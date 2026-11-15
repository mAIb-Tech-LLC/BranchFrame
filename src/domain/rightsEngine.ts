import type {
  GenerationJob,
  OperationType,
  PermissionDecision,
  PermissionScope,
  RightsEvaluationResult,
  RightsManifest,
} from './schemas.ts';

export interface RightsCheckRequest {
  operation: OperationType;
  titleId: string;
  requiredScopes?: PermissionScope[];
  characterIds?: string[];
  evaluationTimeIso?: string;
}

const OPERATION_REQUIRED_SCOPES: Record<OperationType, PermissionScope[]> = {
  COMPILE_DNA: ['ownership', 'adaptation'],
  PROPOSE_BRANCH: ['ownership', 'adaptation', 'derivative_work'],
  GENERATE_FOOTAGE: ['ownership', 'adaptation', 'derivative_work', 'likeness', 'voice'],
  APPROVE_FOOTAGE: ['ownership', 'adaptation', 'derivative_work', 'likeness', 'voice'],
  PUBLISH_GRAPH: ['ownership', 'adaptation', 'derivative_work', 'likeness', 'voice'],
};

export function computeDeterministicHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 'bf-audit-' + (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Verifies privileged server-side Administrator secret.
 * Public visitors can NEVER acquire administrator privileges, mutate global rights policies,
 * approve canonical publication, alter canonical assets, or trigger billable AI generation.
 * If expectedServerToken is unset or empty, all requests default to DENY.
 */
export function verifyPrivilegedStudioToken(
  providedToken: string | undefined | null,
  expectedServerToken: string | undefined | null
): {
  authorized: boolean;
  role: 'STUDIO_SUPERVISOR' | 'VIEWER';
  reason: string;
} {
  if (
    !expectedServerToken ||
    typeof expectedServerToken !== 'string' ||
    expectedServerToken.trim().length < 12
  ) {
    return {
      authorized: false,
      role: 'VIEWER',
      reason:
        'PRIVILEGE_DENIED: Public visitor elevation is disabled. Global rights, canonical assets, publication, and billable AI generation are locked. Use the isolated Judge Demonstration Sandbox.',
    };
  }
  if (!providedToken || typeof providedToken !== 'string' || !providedToken.trim()) {
    return {
      authorized: false,
      role: 'VIEWER',
      reason:
        'PRIVILEGE_DENIED: Anonymous viewer session cannot mutate global rights policies, approve canonical footage, publish story graphs, or trigger billable AI generation. Use the isolated Judge Demonstration Sandbox.',
    };
  }
  if (providedToken.trim() !== expectedServerToken.trim()) {
    return {
      authorized: false,
      role: 'VIEWER',
      reason:
        'PRIVILEGE_DENIED: Invalid administrator credential. Public visitors cannot acquire administrator privileges.',
    };
  }
  return {
    authorized: true,
    role: 'STUDIO_SUPERVISOR',
    reason: 'Authenticated internal administrator session verified.',
  };
}

/**
 * Validates whether a generation job is eligible for human approval.
 * Failed, incomplete, or rights-denied jobs can NEVER become approved footage.
 */
export function validateJobApprovalEligibility(
  job: GenerationJob | undefined | null,
  manifest: RightsManifest | undefined | null,
  characterIds?: string[],
  evaluationTimeIso?: string
): {
  eligible: boolean;
  rightsCheck: RightsEvaluationResult;
  reason: string;
} {
  const rightsCheck = evaluateRightsPolicy(manifest, {
    operation: 'APPROVE_FOOTAGE',
    titleId: job?.titleId || manifest?.titleId || 'unknown',
    characterIds,
    evaluationTimeIso,
  });

  if (!job) {
    return {
      eligible: false,
      rightsCheck,
      reason: 'APPROVAL_BLOCKED: Generation job does not exist.',
    };
  }

  if (job.status === 'FAILED' || job.provenance === 'FAILED') {
    return {
      eligible: false,
      rightsCheck,
      reason: `APPROVAL_BLOCKED: Job "${job.id}" has status/provenance FAILED and cannot become approved footage.`,
    };
  }

  if (!job.videoUrl && !job.outputUrl) {
    return {
      eligible: false,
      rightsCheck,
      reason: `APPROVAL_BLOCKED: Job "${job.id}" has no generated video or image payload.`,
    };
  }

  if (!rightsCheck.allowed) {
    return {
      eligible: false,
      rightsCheck,
      reason: `APPROVAL_BLOCKED: Rights-as-Code Engine denied approval (${rightsCheck.deniedReasons.join('; ')}).`,
    };
  }

  return {
    eligible: true,
    rightsCheck,
    reason: 'Job eligible for human supervisor approval.',
  };
}

/**
 * Deterministic Rights-as-Code Engine.
 * Permissions strictly default to DENY.
 * No generation, approval, or publication may bypass permissions.
 */
export function evaluateRightsPolicy(
  manifest: RightsManifest | undefined | null,
  request: RightsCheckRequest
): RightsEvaluationResult {
  const nowIso = request.evaluationTimeIso || new Date().toISOString();
  const nowMs = Date.parse(nowIso);

  // Default to DENY if manifest is missing or mismatched title
  if (!manifest || manifest.titleId !== request.titleId) {
    return {
      allowed: false,
      decision: 'DENY',
      operation: request.operation,
      evaluatedScopes: [],
      deniedReasons: [
        `DEFAULT_DENY: No valid RightsManifest registered for title "${request.titleId}".`,
      ],
      auditHash: computeDeterministicHash(`missing:${request.titleId}:${request.operation}`),
      evaluatedAt: nowIso,
    };
  }

  const baseScopes = OPERATION_REQUIRED_SCOPES[request.operation] || [
    'ownership',
    'adaptation',
    'derivative_work',
  ];
  const scopesToCheck = Array.from(
    new Set([...baseScopes, ...(request.requiredScopes || [])])
  );

  const evaluatedScopes: RightsEvaluationResult['evaluatedScopes'] = [];
  const deniedReasons: string[] = [];

  // 1. Evaluate title-level scopes (ownership, adaptation, derivative_work)
  const titleLevelScopes: PermissionScope[] = (
    ['ownership', 'adaptation', 'derivative_work'] as PermissionScope[]
  ).filter((s) => scopesToCheck.includes(s));

  for (const scope of titleLevelScopes) {
    const matchingGrant = manifest.grants.find(
      (g) => g.scope === scope && g.subjectId === `title:${manifest.titleId}`
    );

    if (!matchingGrant) {
      evaluatedScopes.push({
        scope,
        subjectId: `title:${manifest.titleId}`,
        subjectName: manifest.titleId,
        decision: 'DENY',
        reason: `No explicit grant found for scope "${scope}" (Default Policy: DENY).`,
      });
      deniedReasons.push(`Missing title grant for "${scope}" on ${manifest.titleId}.`);
      continue;
    }

    const expiresMs = Date.parse(matchingGrant.expiresAt);
    const isExpired = !Number.isNaN(expiresMs) && expiresMs < nowMs;

    if (matchingGrant.decision !== 'ALLOW') {
      evaluatedScopes.push({
        scope,
        subjectId: matchingGrant.subjectId,
        subjectName: matchingGrant.subjectName,
        decision: 'DENY',
        reason: `Explicitly set to DENY by rightsholder (${matchingGrant.rightsholder}).`,
      });
      deniedReasons.push(
        `Scope "${scope}" for ${matchingGrant.subjectName} is set to DENY (${matchingGrant.licenseRef}).`
      );
    } else if (isExpired) {
      evaluatedScopes.push({
        scope,
        subjectId: matchingGrant.subjectId,
        subjectName: matchingGrant.subjectName,
        decision: 'DENY',
        reason: `License ${matchingGrant.licenseRef} expired on ${matchingGrant.expiresAt}.`,
      });
      deniedReasons.push(
        `License ${matchingGrant.licenseRef} for "${scope}" expired on ${matchingGrant.expiresAt}.`
      );
    } else {
      evaluatedScopes.push({
        scope,
        subjectId: matchingGrant.subjectId,
        subjectName: matchingGrant.subjectName,
        decision: 'ALLOW',
        reason: `Verified via ${matchingGrant.licenseRef} (${matchingGrant.rightsholder}).`,
      });
    }
  }

  // 2. Evaluate character-specific likeness and voice scopes
  const performerScopes: PermissionScope[] = (
    ['likeness', 'voice'] as PermissionScope[]
  ).filter((s) => scopesToCheck.includes(s));

  if (performerScopes.length > 0) {
    const targetCharacterIds =
      request.characterIds && request.characterIds.length > 0
        ? request.characterIds
        : Array.from(
            new Set(
              manifest.grants
                .filter((g) => g.subjectId.startsWith('char:'))
                .map((g) => g.subjectId)
            )
          );

    for (const charId of targetCharacterIds) {
      const normalizedSubjectId = charId.startsWith('char:') ? charId : `char:${charId}`;

      for (const scope of performerScopes) {
        const grant = manifest.grants.find(
          (g) => g.scope === scope && g.subjectId === normalizedSubjectId
        );

        if (!grant) {
          evaluatedScopes.push({
            scope,
            subjectId: normalizedSubjectId,
            subjectName: normalizedSubjectId,
            decision: 'DENY',
            reason: `No ${scope} release on file for ${normalizedSubjectId} (Default: DENY).`,
          });
          deniedReasons.push(
            `Missing ${scope} permission grant for performer/character ${normalizedSubjectId}.`
          );
          continue;
        }

        const expiresMs = Date.parse(grant.expiresAt);
        const isExpired = !Number.isNaN(expiresMs) && expiresMs < nowMs;

        if (grant.decision !== 'ALLOW') {
          evaluatedScopes.push({
            scope,
            subjectId: grant.subjectId,
            subjectName: grant.subjectName,
            decision: 'DENY',
            reason: `Performer ${scope} release is DENY (${grant.rightsholder}).`,
          });
          deniedReasons.push(
            `${grant.subjectName} (${scope}) permission is DENY [${grant.licenseRef}].`
          );
        } else if (isExpired) {
          evaluatedScopes.push({
            scope,
            subjectId: grant.subjectId,
            subjectName: grant.subjectName,
            decision: 'DENY',
            reason: `Performer ${scope} release expired on ${grant.expiresAt}.`,
          });
          deniedReasons.push(
            `${grant.subjectName} (${scope}) release expired on ${grant.expiresAt}.`
          );
        } else {
          evaluatedScopes.push({
            scope,
            subjectId: grant.subjectId,
            subjectName: grant.subjectName,
            decision: 'ALLOW',
            reason: `Cleared via ${grant.licenseRef} (${grant.rightsholder}).`,
          });
        }
      }
    }
  }

  const allAllowed =
    evaluatedScopes.length > 0 &&
    evaluatedScopes.every((s) => s.decision === 'ALLOW') &&
    deniedReasons.length === 0;

  const finalDecision: PermissionDecision = allAllowed ? 'ALLOW' : 'DENY';
  const signaturePayload = JSON.stringify({
    titleId: manifest.titleId,
    op: request.operation,
    decision: finalDecision,
    scopes: evaluatedScopes.map((s) => `${s.subjectId}:${s.scope}:${s.decision}`),
  });

  return {
    allowed: allAllowed,
    decision: finalDecision,
    operation: request.operation,
    evaluatedScopes,
    deniedReasons,
    auditHash: computeDeterministicHash(signaturePayload),
    evaluatedAt: nowIso,
  };
}
