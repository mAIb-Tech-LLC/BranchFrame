import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  GitCompare,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  CanonValidationReport,
  OperationType,
  PermissionDecision,
  RightsEvaluationResult,
  RightsManifest,
} from '../domain/schemas';
import { getJudgeSandboxHeaders } from '../utils/judgeSession';

interface RightsAndCanonViewProps {
  rightsManifest: RightsManifest;
  publishRightsCheck: RightsEvaluationResult;
  canonReport: CanonValidationReport;
  onRightsUpdated: (
    manifest: RightsManifest,
    publishCheck: RightsEvaluationResult
  ) => void;
}

export const RightsAndCanonView: React.FC<RightsAndCanonViewProps> = ({
  rightsManifest,
  publishRightsCheck,
  canonReport,
  onRightsUpdated,
}) => {
  const [togglingGrantId, setTogglingGrantId] = useState<string | null>(null);
  const [securityBanner, setSecurityBanner] = useState<{
    type: 'sandbox' | 'blocked';
    message: string;
  } | null>(null);
  const [selectedOperation, setSelectedOperation] =
    useState<OperationType>('GENERATE_FOOTAGE');
  const [customEvalResult, setCustomEvalResult] =
    useState<RightsEvaluationResult>(publishRightsCheck);

  const [simulatedFault, setSimulatedFault] = useState<
    | 'NONE'
    | 'UNREACHABLE_SCENE'
    | 'CANON_CONTRADICTION'
    | 'IMPOSSIBLE_CHARACTER_KNOWLEDGE'
    | 'INVALID_CAUSAL_DEPENDENCY'
    | 'DEAD_END'
  >('NONE');
  const [activeCanonReport, setActiveCanonReport] =
    useState<CanonValidationReport>(canonReport);
  const [isCheckingCanon, setIsCheckingCanon] = useState<boolean>(false);

  useEffect(() => {
    setCustomEvalResult(publishRightsCheck);
    setActiveCanonReport(canonReport);
    setSimulatedFault('NONE');
    setSecurityBanner(null);
  }, [rightsManifest.titleId, publishRightsCheck, canonReport]);

  const handleToggleSandboxGrant = async (
    grantId: string,
    nextDecision: PermissionDecision
  ) => {
    setTogglingGrantId(grantId);
    setSecurityBanner(null);
    try {
      const response = await fetch('/api/v1/sandbox/rights/toggle', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: rightsManifest.titleId,
          grantId,
          decision: nextDecision,
        }),
      });
      const data = await response.json();
      if (response.ok && data.sandboxState) {
        onRightsUpdated(
          data.sandboxState.rightsManifest,
          data.sandboxState.publishRightsCheck
        );
        setCustomEvalResult(data.sandboxState.publishRightsCheck);
        setSecurityBanner({
          type: 'sandbox',
          message: `${data.sandboxState.lastActionSummary} (Canonical global state remains untouched.)`,
        });
      }
    } finally {
      setTogglingGrantId(null);
    }
  };

  const handleTestUnauthorizedGlobalMutation = async () => {
    setSecurityBanner(null);
    const firstGrant = rightsManifest.grants[0];
    if (!firstGrant) return;
    const response = await fetch('/api/v1/rights/toggle', {
      method: 'POST',
      headers: getJudgeSandboxHeaders(),
      body: JSON.stringify({
        titleId: rightsManifest.titleId,
        grantId: firstGrant.id,
        decision: 'DENY',
      }),
    });
    const data = await response.json();
    setSecurityBanner({
      type: 'blocked',
      message: `HTTP ${response.status} (${data.code || 'PRIVILEGE_DENIED'}): ${
        data.error || 'Unauthorized direct global API call blocked.'
      }`,
    });
  };

  const handleResetSandbox = async () => {
    const response = await fetch('/api/v1/sandbox/reset', {
      method: 'POST',
      headers: getJudgeSandboxHeaders(),
      body: JSON.stringify({ titleId: rightsManifest.titleId }),
    });
    const data = await response.json();
    if (response.ok && data.sandboxState) {
      onRightsUpdated(
        data.sandboxState.rightsManifest,
        data.sandboxState.publishRightsCheck
      );
      setCustomEvalResult(data.sandboxState.publishRightsCheck);
      setActiveCanonReport(data.sandboxState.canonReport);
      setSimulatedFault('NONE');
      setSecurityBanner({
        type: 'sandbox',
        message: data.sandboxState.lastActionSummary,
      });
    }
  };

  const handleEvaluateOperation = async (op: OperationType) => {
    setSelectedOperation(op);
    const response = await fetch('/api/v1/rights/evaluate', {
      method: 'POST',
      headers: getJudgeSandboxHeaders(),
      body: JSON.stringify({
        titleId: rightsManifest.titleId,
        operation: op,
        customGrants: rightsManifest.grants,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setCustomEvalResult(data.evaluation);
    }
  };

  const handleRunValidator = async (
    fault:
      | 'NONE'
      | 'UNREACHABLE_SCENE'
      | 'CANON_CONTRADICTION'
      | 'IMPOSSIBLE_CHARACTER_KNOWLEDGE'
      | 'INVALID_CAUSAL_DEPENDENCY'
      | 'DEAD_END'
  ) => {
    setSimulatedFault(fault);
    setIsCheckingCanon(true);
    try {
      const response = await fetch('/api/v1/sandbox/canon/fault', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: rightsManifest.titleId,
          simulateFault: fault,
        }),
      });
      const data = await response.json();
      if (response.ok && data.sandboxState) {
        setActiveCanonReport(data.sandboxState.canonReport);
        setSecurityBanner({
          type: 'sandbox',
          message: data.sandboxState.lastActionSummary,
        });
      }
    } finally {
      setIsCheckingCanon(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F4F1E8]/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
            <span className="font-mono text-[#FF617C]">DEFAULT POLICY: DENY</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#29DCEF]">ISOLATED JUDGE SANDBOX</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {rightsManifest.grants.length} Active Grants ({rightsManifest.titleId.toUpperCase()})
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1E8] tracking-tight">
            03. Deterministic Rights-as-Code & Canon Graph Validator
          </h1>
          <p className="text-sm text-[#9BA3B8] max-w-3xl">
            Every compilation, branch proposal, video generation job, and publication approval passes through two deterministic gates: the Rights-as-Code Engine (defaulting to <code className="font-mono text-[#FF617C]">DENY</code>) and the Canon/Graph Validator. Judges can freely toggle permissions and inject faults in this isolated sandbox without mutating global canonical state.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestUnauthorizedGlobalMutation}
            className="px-3.5 py-2 text-xs font-semibold text-[#F4F1E8] bg-[#13182B] border border-[#FF617C]/40 rounded-lg hover:border-[#FF617C] transition-colors whitespace-nowrap"
          >
            Test Direct Global API Lock (403)
          </button>
          <button
            type="button"
            onClick={handleResetSandbox}
            className="px-3.5 py-2 text-xs font-semibold text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Judge Sandbox</span>
          </button>
        </div>
      </div>

      {securityBanner && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs ${
            securityBanner.type === 'blocked'
              ? 'border-[#FF617C]/60 bg-[#13182B] text-[#FF617C]'
              : 'border-[#29DCEF]/50 bg-[#13182B] text-[#F4F1E8]'
          }`}
        >
          <span>{securityBanner.message}</span>
          <span className="font-mono shrink-0">
            {securityBanner.type === 'blocked'
              ? 'GLOBAL CANON PROTECTED'
              : 'SANDBOX ISOLATED'}
          </span>
        </div>
      )}

      {/* Main 12-Column Split: Left 7 Columns Rights-as-Code Matrix | Right 5 Columns Policy Evaluator & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 7 Columns: Rights-as-Code Permission Grants Table */}
        <div className="lg:col-span-7 rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F4F1E8]/10 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#755CFF]" />
              <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
                Rights-as-Code Permission Ledger ({rightsManifest.titleId.toUpperCase()})
              </h2>
            </div>
            <span className="text-xs font-mono text-[#9BA3B8]">
              Sandbox Toggle: Test DENY Enforcement
            </span>
          </div>

          <div className="space-y-2.5">
            {rightsManifest.grants.map((grant) => {
              const isAllow = grant.decision === 'ALLOW';
              return (
                <div
                  key={grant.id}
                  className={`p-3.5 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isAllow
                      ? 'border-[#F4F1E8]/10 bg-[#13182B]/70'
                      : 'border-[#FF617C]/60 bg-[#13182B]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#9BA3B8]">
                      <span className="font-mono font-semibold text-[#29DCEF]">
                        {grant.scope.toUpperCase()}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#F4F1E8] font-medium">
                        {grant.subjectName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{grant.licenseRef}</span>
                    </div>
                    <div className="text-xs text-[#9BA3B8]">
                      Rightsholder: <span className="text-[#F4F1E8]">{grant.rightsholder}</span> · Expires:{' '}
                      <span className="font-mono tabular-nums">
                        {grant.expiresAt.slice(0, 10)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={togglingGrantId === grant.id}
                      onClick={() =>
                        handleToggleSandboxGrant(
                          grant.id,
                          isAllow ? 'DENY' : 'ALLOW'
                        )
                      }
                      aria-label={`Set ${grant.subjectName} ${grant.scope} permission to ${
                        isAllow ? 'DENY' : 'ALLOW'
                      }`}
                      className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        isAllow
                          ? 'bg-[#29DCEF]/15 text-[#29DCEF] border-[#29DCEF]/40 hover:bg-[#29DCEF]/25'
                          : 'bg-[#FF617C] text-[#070912] border-[#FF617C]'
                      }`}
                    >
                      {togglingGrantId === grant.id
                        ? 'UPDATING...'
                        : isAllow
                        ? 'ALLOW (Click to Revoke)'
                        : 'DENY (Click to Grant)'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Live Deterministic Policy Gate Evaluator */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-5">
          <div className="space-y-4">
            <div className="border-b border-[#F4F1E8]/10 pb-3 space-y-1">
              <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
                Live Operation Gate Evaluator
              </h2>
              <p className="text-xs text-[#9BA3B8]">
                Select any platform operation below to inspect the deterministic Rights-as-Code gate decision.
              </p>
            </div>

            {/* Operation Selector Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'COMPILE_DNA',
                  'PROPOSE_BRANCH',
                  'GENERATE_FOOTAGE',
                  'APPROVE_FOOTAGE',
                  'PUBLISH_GRAPH',
                ] as OperationType[]
              ).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => handleEvaluateOperation(op)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    selectedOperation === op
                      ? 'bg-[#755CFF] text-[#F4F1E8] border-[#755CFF]'
                      : 'bg-[#13182B] text-[#9BA3B8] border-[#F4F1E8]/10 hover:text-[#F4F1E8]'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>

            {/* Gate Verdict Card */}
            <div
              className={`p-4 rounded-lg border space-y-2 ${
                customEvalResult.allowed
                  ? 'border-[#29DCEF]/50 bg-[#13182B]'
                  : 'border-[#FF617C]/60 bg-[#13182B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {customEvalResult.allowed ? (
                    <ShieldCheck className="w-5 h-5 text-[#29DCEF]" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-[#FF617C]" />
                  )}
                  <span className="font-display text-base font-bold text-[#F4F1E8]">
                    Gate Decision: {customEvalResult.decision}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#9BA3B8] tabular-nums">
                  {customEvalResult.auditHash}
                </span>
              </div>

              {customEvalResult.deniedReasons.length > 0 ? (
                <div className="space-y-1 pt-1">
                  {customEvalResult.deniedReasons.map((reason, idx) => (
                    <div key={idx} className="text-xs text-[#FF617C] font-mono">
                      • {reason}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#9BA3B8]">
                  All required title and performer scopes verified for{' '}
                  <code className="font-mono text-[#29DCEF]">
                    {customEvalResult.operation}
                  </code>
                  .
                </p>
              )}
            </div>

            {/* Scope-by-Scope Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#F4F1E8]">
                Evaluated Scope Chain ({customEvalResult.evaluatedScopes.length} Checks):
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {customEvalResult.evaluatedScopes.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-[#070912] border border-[#F4F1E8]/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono text-[#29DCEF]">{s.scope}</span> ·{' '}
                      <span className="text-[#F4F1E8]">{s.subjectName}</span>
                    </div>
                    <span
                      className={`font-mono font-semibold ${
                        s.decision === 'ALLOW'
                          ? 'text-[#29DCEF]'
                          : 'text-[#FF617C]'
                      }`}
                    >
                      {s.decision}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4F1E8]/10 text-xs text-[#9BA3B8] flex items-center justify-between">
            <span>Zero-Bypass Enforcement</span>
            <span className="font-mono">Territories: {rightsManifest.territories.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Deterministic Canon & Graph Validator Section */}
      <section className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F4F1E8]/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
              <GitCompare className="w-4 h-4 text-[#29DCEF]" />
              <span>DETERMINISTIC CANON & GRAPH VALIDATOR</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeCanonReport.stats.reachableScenes}/{activeCanonReport.stats.totalScenes} Reachable
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeCanonReport.stats.totalPaths} Complete Paths
              </span>
            </div>
            <h2 className="font-display text-lg font-semibold text-[#F4F1E8]">
              Continuity, Causal Dependency & Character Knowledge Verification
            </h2>
          </div>

          {/* Interactive Fault Injection Simulator in Judge Sandbox */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#9BA3B8] mr-1">Judge Fault Injector:</span>
            {(
              [
                { id: 'NONE', label: 'Live Graph (Clean)' },
                { id: 'UNREACHABLE_SCENE', label: 'Inject Unreachable Scene' },
                { id: 'CANON_CONTRADICTION', label: 'Inject Contradiction' },
                { id: 'IMPOSSIBLE_CHARACTER_KNOWLEDGE', label: 'Inject Impossible Knowledge' },
                { id: 'INVALID_CAUSAL_DEPENDENCY', label: 'Inject Invalid Dependency' },
                { id: 'DEAD_END', label: 'Inject Dead End' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                disabled={isCheckingCanon}
                onClick={() => handleRunValidator(btn.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  simulatedFault === btn.id
                    ? btn.id === 'NONE'
                      ? 'bg-[#29DCEF] text-[#070912] border-[#29DCEF]'
                      : 'bg-[#FF617C] text-[#070912] border-[#FF617C]'
                    : 'bg-[#13182B] text-[#F4F1E8] border-[#F4F1E8]/15 hover:border-[#755CFF]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Check Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-lg bg-[#13182B] border border-[#F4F1E8]/10">
            <div className="text-xs text-[#9BA3B8]">Unreachable Scenes</div>
            <div className="font-mono text-xl font-bold text-[#F4F1E8] tabular-nums mt-1">
              {activeCanonReport.stats.totalScenes -
                activeCanonReport.stats.reachableScenes}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#13182B] border border-[#F4F1E8]/10">
            <div className="text-xs text-[#9BA3B8]">Canon Contradictions</div>
            <div className="font-mono text-xl font-bold text-[#F4F1E8] tabular-nums mt-1">
              {activeCanonReport.stats.contradictionsCount}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#13182B] border border-[#F4F1E8]/10">
            <div className="text-xs text-[#9BA3B8]">Impossible Knowledge</div>
            <div className="font-mono text-xl font-bold text-[#F4F1E8] tabular-nums mt-1">
              {activeCanonReport.stats.knowledgeViolationsCount}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#13182B] border border-[#F4F1E8]/10">
            <div className="text-xs text-[#9BA3B8]">Invalid Dependencies</div>
            <div className="font-mono text-xl font-bold text-[#F4F1E8] tabular-nums mt-1">
              {activeCanonReport.stats.invalidDependenciesCount}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#13182B] border border-[#F4F1E8]/10">
            <div className="text-xs text-[#9BA3B8]">Dead Ends</div>
            <div className="font-mono text-xl font-bold text-[#F4F1E8] tabular-nums mt-1">
              {activeCanonReport.stats.deadEndsCount}
            </div>
          </div>
        </div>

        {/* Validation Result Detail */}
        {activeCanonReport.valid ? (
          <div className="p-4 rounded-lg border border-[#29DCEF]/40 bg-[#13182B]/70 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#29DCEF] shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-[#F4F1E8]">
                  Canon & Graph Validation Passed (0 Errors across {activeCanonReport.stats.totalPaths} Deterministic Paths)
                </div>
                <div className="text-[#9BA3B8]">
                  All scenes are reachable from root, zero mutually exclusive facts collide, character knowledge timelines are causally sound, and every non-terminal node has valid outgoing transitions.
                </div>
              </div>
            </div>
            <span className="font-mono text-xs text-[#29DCEF] shrink-0">VALIDATED</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeCanonReport.issues.map((issue) => (
              <div
                key={issue.id}
                role="alert"
                className="p-4 rounded-lg border border-[#FF617C]/60 bg-[#13182B] flex items-start gap-3"
              >
                <AlertOctagon className="w-5 h-5 text-[#FF617C] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-mono text-[#FF617C]">
                    <span>{issue.type}</span>
                    <span aria-hidden="true">·</span>
                    <span>Scene {issue.sceneCode}</span>
                  </div>
                  <div className="text-[#F4F1E8] font-medium">{issue.message}</div>
                  <div className="text-[#9BA3B8]">
                    Remediation: {issue.remediation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
