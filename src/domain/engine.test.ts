import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStoryDNASchema,
  validateBranchProposalSchema,
  RightsManifest,
  StoryGraph,
  GenerationJob,
} from './schemas';
import {
  evaluateRightsPolicy,
  verifyPrivilegedStudioToken,
  validateJobApprovalEligibility,
} from './rightsEngine';
import { validateStoryCanonAndGraph } from './canonValidator';
import {
  INITIAL_RIGHTS_MANIFEST,
  INITIAL_STORY_DNA,
  INITIAL_STORY_GRAPH,
  INITIAL_BRANCH_PROPOSALS,
  INITIAL_GENERATION_JOBS,
  LAST_SIGNAL_TITLE_ID,
  TITANIC_TITLE_ID,
  TITANIC_STORY_DNA,
  TITANIC_STORY_GRAPH,
  TITANIC_RIGHTS_MANIFEST,
  TITANIC_BRANCH_PROPOSALS,
  TITANIC_GENERATION_JOBS,
} from './seedData';

test('StoryDNA schema validator accepts valid TITANIC 1912 and THE LAST SIGNAL StoryDNA v1.0.0 and rejects malformed data', () => {
  const titanicCheck = validateStoryDNASchema(TITANIC_STORY_DNA);
  assert.equal(titanicCheck.valid, true);
  assert.equal(titanicCheck.errors.length, 0);

  const validCheck = validateStoryDNASchema(INITIAL_STORY_DNA);
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.errors.length, 0);

  const invalidCheck = validateStoryDNASchema({ schemaVersion: '0.9.0', characters: [] });
  assert.equal(invalidCheck.valid, false);
  assert.ok(invalidCheck.errors.length >= 3);
});

test('BranchProposal schema validator validates structured branch proposals for TITANIC 1912 and THE LAST SIGNAL', () => {
  const titanicProposal = TITANIC_BRANCH_PROPOSALS[0];
  const titanicCheck = validateBranchProposalSchema(titanicProposal);
  assert.equal(titanicCheck.valid, true);
  assert.equal(titanicCheck.errors.length, 0);

  const proposal = INITIAL_BRANCH_PROPOSALS[0];
  const check = validateBranchProposalSchema(proposal);
  assert.equal(check.valid, true);
  assert.equal(check.errors.length, 0);
});

test('Rights-as-Code engine defaults to DENY when manifest is missing, revoked, or expired across both titles', () => {
  // 1. Missing manifest -> DENY
  const missingResult = evaluateRightsPolicy(null, {
    operation: 'GENERATE_FOOTAGE',
    titleId: TITANIC_TITLE_ID,
  });
  assert.equal(missingResult.allowed, false);
  assert.equal(missingResult.decision, 'DENY');

  // 2. Full valid TITANIC 1912 manifest -> ALLOW
  const titanicAllowed = evaluateRightsPolicy(TITANIC_RIGHTS_MANIFEST, {
    operation: 'PUBLISH_GRAPH',
    titleId: TITANIC_TITLE_ID,
    characterIds: ['char:clara-voss', 'char:julian-mercer'],
    evaluationTimeIso: '2026-11-14T00:00:00.000Z',
  });
  assert.equal(titanicAllowed.allowed, true);
  assert.equal(titanicAllowed.decision, 'ALLOW');

  // 3. Full valid THE LAST SIGNAL manifest -> ALLOW
  const allowedResult = evaluateRightsPolicy(INITIAL_RIGHTS_MANIFEST, {
    operation: 'PUBLISH_GRAPH',
    titleId: LAST_SIGNAL_TITLE_ID,
    characterIds: ['char:elena-vance', 'char:marcus-thorne'],
    evaluationTimeIso: '2026-11-14T00:00:00.000Z',
  });
  assert.equal(allowedResult.allowed, true);
  assert.equal(allowedResult.decision, 'ALLOW');
  assert.equal(allowedResult.deniedReasons.length, 0);

  // 4. Revoke likeness permission for Clara Voss on TITANIC 1912 -> DENY
  const revokedTitanicManifest: RightsManifest = {
    ...TITANIC_RIGHTS_MANIFEST,
    grants: TITANIC_RIGHTS_MANIFEST.grants.map((g) =>
      g.id === 'ttn-grant-likeness-clara' ? { ...g, decision: 'DENY' } : g
    ),
  };
  const deniedClara = evaluateRightsPolicy(revokedTitanicManifest, {
    operation: 'GENERATE_FOOTAGE',
    titleId: TITANIC_TITLE_ID,
    characterIds: ['char:clara-voss'],
    evaluationTimeIso: '2026-11-14T00:00:00.000Z',
  });
  assert.equal(deniedClara.allowed, false);
  assert.equal(deniedClara.decision, 'DENY');
  assert.ok(
    deniedClara.deniedReasons.some((r) => r.includes('Clara Voss') && r.includes('likeness'))
  );

  // 5. Expired permission blocks generation and publication -> DENY
  const expiredResult = evaluateRightsPolicy(INITIAL_RIGHTS_MANIFEST, {
    operation: 'PUBLISH_GRAPH',
    titleId: LAST_SIGNAL_TITLE_ID,
    characterIds: ['char:elena-vance'],
    evaluationTimeIso: '2031-01-01T00:00:00.000Z',
  });
  assert.equal(expiredResult.allowed, false);
  assert.equal(expiredResult.decision, 'DENY');
  assert.ok(expiredResult.deniedReasons.some((r) => r.includes('expired')));
});

test('P0 Security: Public visitors cannot acquire administrator privileges when server secret is unset or token is missing/forged', () => {
  // 1. When server secret is unset/empty, NO token (even a legacy passcode) can authenticate
  const noServerSecret1 = verifyPrivilegedStudioToken('forged-public-passcode-attempt', undefined);
  assert.equal(noServerSecret1.authorized, false);
  assert.equal(noServerSecret1.role, 'VIEWER');

  const noServerSecret2 = verifyPrivilegedStudioToken('', '');
  assert.equal(noServerSecret2.authorized, false);
  assert.equal(noServerSecret2.role, 'VIEWER');

  // 2. When internal server secret is configured, anonymous and forged tokens are rejected
  const expectedToken = 'bf-internal-admin-secret-994812039481';

  const anonymousViewer = verifyPrivilegedStudioToken(undefined, expectedToken);
  assert.equal(anonymousViewer.authorized, false);
  assert.equal(anonymousViewer.role, 'VIEWER');

  const forgedToken = verifyPrivilegedStudioToken('forged-public-passcode-attempt', expectedToken);
  assert.equal(forgedToken.authorized, false);
  assert.equal(forgedToken.role, 'VIEWER');

  const supervisor = verifyPrivilegedStudioToken(expectedToken, expectedToken);
  assert.equal(supervisor.authorized, true);
  assert.equal(supervisor.role, 'STUDIO_SUPERVISOR');
});

test('Failed or incomplete generation jobs cannot become approved footage while verified Omni video jobs pass', () => {
  const baseJob = TITANIC_GENERATION_JOBS[0];
  assert.equal(baseJob.provenance, 'LIVE_OMNI_VIDEO');
  assert.ok(baseJob.videoUrl?.endsWith('.mp4'));

  // 1. Failed job -> ineligible
  const failedJob: GenerationJob = {
    ...baseJob,
    id: 'job-failed-01',
    status: 'FAILED',
    provenance: 'FAILED',
  };
  const failedCheck = validateJobApprovalEligibility(
    failedJob,
    TITANIC_RIGHTS_MANIFEST,
    ['char:clara-voss'],
    '2026-11-14T00:00:00.000Z'
  );
  assert.equal(failedCheck.eligible, false);
  assert.ok(failedCheck.reason.includes('FAILED'));

  // 2. Incomplete job with no outputUrl or videoUrl -> ineligible
  const emptyMediaJob: GenerationJob = {
    ...baseJob,
    id: 'job-empty-02',
    status: 'PENDING_HUMAN_REVIEW',
    outputUrl: undefined,
    videoUrl: undefined,
  };
  const emptyCheck = validateJobApprovalEligibility(
    emptyMediaJob,
    TITANIC_RIGHTS_MANIFEST,
    ['char:clara-voss'],
    '2026-11-14T00:00:00.000Z'
  );
  assert.equal(emptyCheck.eligible, false);

  // 3. Valid pending job with cleared rights -> eligible
  const validPendingJob: GenerationJob = {
    ...baseJob,
    id: 'job-valid-03',
    status: 'PENDING_HUMAN_REVIEW',
  };
  const validCheck = validateJobApprovalEligibility(
    validPendingJob,
    TITANIC_RIGHTS_MANIFEST,
    ['char:clara-voss'],
    '2026-11-14T00:00:00.000Z'
  );
  assert.equal(validCheck.eligible, true);
});

test('Canon & Graph Validator passes clean TITANIC 1912 and THE LAST SIGNAL graphs and catches all 5 fault classes', () => {
  // 1. Clean TITANIC 1912 graph passes with 0 errors and preserves historical sinking fact
  const titanicReport = validateStoryCanonAndGraph(TITANIC_STORY_DNA, TITANIC_STORY_GRAPH);
  assert.equal(titanicReport.valid, true);
  assert.equal(titanicReport.issues.length, 0);
  assert.equal(titanicReport.stats.totalScenes, 4);
  assert.equal(titanicReport.stats.reachableScenes, 4);
  assert.equal(titanicReport.stats.endingsCount, 2);

  // 2. Clean THE LAST SIGNAL graph passes with 0 errors
  const cleanReport = validateStoryCanonAndGraph(INITIAL_STORY_DNA, INITIAL_STORY_GRAPH);
  assert.equal(cleanReport.valid, true);
  assert.equal(cleanReport.issues.length, 0);
  assert.equal(cleanReport.stats.totalScenes, 4);
  assert.equal(cleanReport.stats.reachableScenes, 4);
  assert.equal(cleanReport.stats.endingsCount, 2);

  // 3. Inject Unreachable Scene, Contradiction, Impossible Character Knowledge, Invalid Dependency, and Dead End
  const faultyGraph: StoryGraph = {
    ...TITANIC_STORY_GRAPH,
    scenes: [
      ...TITANIC_STORY_GRAPH.scenes.map((s) => {
        if (s.id === 'ttn-03a-carpathia') {
          return {
            ...s,
            establishesFactIds: [
              'fact:carpathia-coordinates-locked',
              'fact:scotland-road-bulkhead-forced',
            ],
            characterKnowledgeRequired: [
              ...s.characterKnowledgeRequired,
              {
                characterId: 'char:clara-voss',
                factId: 'fact:non-existent-secret',
                reason: 'References unlearned secret',
              },
            ],
            requiredPriorEventIds: ['evt:never-happened'],
            isEnding: false,
            choices: [],
          };
        }
        return s;
      }),
      {
        ...TITANIC_STORY_GRAPH.scenes[0],
        id: 'ttn-99-orphan',
        code: 'SCN-99',
        title: 'Orphaned Marconi Annex',
        choices: [],
        isEnding: true,
      },
    ],
  };

  const faultyReport = validateStoryCanonAndGraph(TITANIC_STORY_DNA, faultyGraph);
  assert.equal(faultyReport.valid, false);
  const issueTypes = new Set(faultyReport.issues.map((i) => i.type));
  assert.ok(issueTypes.has('UNREACHABLE_SCENE'), 'Should detect unreachable scene');
  assert.ok(issueTypes.has('CANON_CONTRADICTION'), 'Should detect canon contradiction');
  assert.ok(
    issueTypes.has('IMPOSSIBLE_CHARACTER_KNOWLEDGE'),
    'Should detect impossible character knowledge'
  );
  assert.ok(
    issueTypes.has('INVALID_CAUSAL_DEPENDENCY'),
    'Should detect invalid causal dependency'
  );
  assert.ok(issueTypes.has('DEAD_END'), 'Should detect dead end');
});
