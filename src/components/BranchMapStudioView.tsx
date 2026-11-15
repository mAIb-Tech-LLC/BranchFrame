import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import {
  BranchProposal,
  CanonValidationReport,
  RightsEvaluationResult,
  StoryDNA,
  StoryGraph,
} from '../domain/schemas';
import { getJudgeSandboxHeaders } from '../utils/judgeSession';

interface BranchMapStudioViewProps {
  storyDNA: StoryDNA;
  storyGraph: StoryGraph;
  branchProposals: BranchProposal[];
  publishRightsCheck: RightsEvaluationResult;
  onProposalCreated: (newProposal: BranchProposal) => void;
  onProposalPromoted: (newGraph: StoryGraph, newCanon: CanonValidationReport) => void;
}

export const BranchMapStudioView: React.FC<BranchMapStudioViewProps> = ({
  storyDNA,
  storyGraph,
  branchProposals,
  publishRightsCheck,
}) => {
  const isTitanic = storyDNA.titleId === 'titanic-1912';
  const [directive, setDirective] = useState<string>(
    isTitanic
      ? 'Propose a controlled branch where Clara Voss and Julian Mercer wire the emergency accumulator into the Boat Deck Morse blinker lamp while tapping the steam dynamo for a 30-second Marconi burst.'
      : 'Propose an alternate branch where Dr. Elena Vance routes the 1.420 GHz payload into a decoupled orbital relay ring, deceiving Director Thorne while preserving regional power substations.'
  );
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setDirective(
      storyDNA.titleId === 'titanic-1912'
        ? 'Propose a controlled branch where Clara Voss and Julian Mercer wire the emergency accumulator into the Boat Deck Morse blinker lamp while tapping the steam dynamo for a 30-second Marconi burst.'
        : 'Propose an alternate branch where Dr. Elena Vance routes the 1.420 GHz payload into a decoupled orbital relay ring, deceiving Director Thorne while preserving regional power substations.'
    );
    setStatusMsg(null);
    setErrorMsg(null);
  }, [storyDNA.titleId]);

  const handleTestUnauthorizedPropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlanning(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const response = await fetch('/api/v1/planner/propose', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: storyDNA.titleId,
          branchPointId: storyDNA.candidateBranchPoints[0]?.id,
          directive,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(
          data.error ||
            'Unauthorized global branch planner call blocked (HTTP 403 PRIVILEGE_DENIED).'
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error invoking Gemini Branch Planner.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleRunSandboxBranchScenario = async () => {
    setIsPlanning(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const response = await fetch('/api/v1/sandbox/scenario/run', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: storyDNA.titleId,
          scenario: 'PROPOSE_BRANCH_PREVIEW',
        }),
      });
      const data = await response.json();
      if (response.ok && data.sandboxState) {
        setStatusMsg(data.sandboxState.lastActionSummary);
      } else {
        setErrorMsg(data.error || 'Sandbox branch scenario failed.');
      }
    } finally {
      setIsPlanning(false);
    }
  };

  const decisionScene = storyGraph.scenes.find((s) => s.act === 'DECISION_POINT');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F4F1E8]/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
            <span className="font-mono text-[#29DCEF]">GEMINI BRANCH PLANNER</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Graph v{storyGraph.versionNumber}.0
            </span>
            <span aria-hidden="true">·</span>
            <span>Deterministic DAG</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1E8] tracking-tight">
            02. Interactive Branch Map & Causal Consequence Planner ({storyDNA.screenplayTitle})
          </h1>
          <p className="text-sm text-[#9BA3B8] max-w-3xl">
            Inspect the deterministic story graph for <strong className="text-[#F4F1E8]">{storyDNA.screenplayTitle}</strong> and evaluate Gemini Branch Planner counterfactual trajectories, causal consequences, and downstream event invalidations.
          </p>
        </div>

        <div className="text-xs font-mono text-[#9BA3B8] tabular-nums shrink-0">
          {storyGraph.scenes.length} Active Nodes · {branchProposals.length} Studio Proposals
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 rounded-xl border border-[#FF617C]/50 bg-[#13182B] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FF617C] shrink-0 mt-0.5" />
          <div className="text-xs text-[#F4F1E8]">{errorMsg}</div>
        </div>
      )}

      {statusMsg && (
        <div role="status" className="p-4 rounded-xl border border-[#29DCEF]/50 bg-[#13182B] flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#29DCEF] shrink-0 mt-0.5" />
          <div className="text-xs text-[#F4F1E8]">{statusMsg}</div>
        </div>
      )}

      {/* Visual Directed Acyclic Graph Map */}
      <section className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-5">
        <div className="flex items-center justify-between gap-4 border-b border-[#F4F1E8]/10 pb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#755CFF]" />
            <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
              Canonical Story Graph Topology ({storyDNA.screenplayTitle})
            </h2>
          </div>
          <span className="text-xs font-mono text-[#9BA3B8] tabular-nums">
            Entry Node: {storyGraph.entrySceneId}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Root Act I Scene */}
          {storyGraph.scenes
            .filter((s) => s.act === 'ACT_I')
            .map((scene) => (
              <div
                key={scene.id}
                className="lg:col-span-3 p-4 rounded-lg border border-[#F4F1E8]/15 bg-[#13182B] space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#9BA3B8]">
                  <span className="text-[#29DCEF]">{scene.code}</span>
                  <span>ENTRY NODE</span>
                </div>
                <div className="font-display text-sm font-semibold text-[#F4F1E8]">
                  {scene.title}
                </div>
                <p className="text-xs text-[#9BA3B8] line-clamp-2">{scene.synopsis}</p>
                <div className="text-[11px] font-mono text-[#755CFF]">
                  Establishes: {scene.establishesEventIds.join(', ')}
                </div>
              </div>
            ))}

          <div className="hidden lg:flex lg:col-span-1 justify-center text-[#9BA3B8]">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Decision Point Node */}
          {storyGraph.scenes
            .filter((s) => s.act === 'DECISION_POINT')
            .map((scene) => (
              <div
                key={scene.id}
                className="lg:col-span-3 p-4 rounded-lg border border-[#755CFF] bg-[#13182B] space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#9BA3B8]">
                  <span className="text-[#755CFF]">{scene.code}</span>
                  <span>DECISION HUB</span>
                </div>
                <div className="font-display text-sm font-semibold text-[#F4F1E8]">
                  {scene.title}
                </div>
                <p className="text-xs text-[#9BA3B8] line-clamp-2">{scene.synopsis}</p>
                <div className="text-[11px] font-mono text-[#29DCEF] tabular-nums">
                  {scene.choices.length} Outgoing Branch Routes
                </div>
              </div>
            ))}

          <div className="hidden lg:flex lg:col-span-1 justify-center text-[#9BA3B8]">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Outcome Nodes */}
          <div className="lg:col-span-4 space-y-3">
            {storyGraph.scenes
              .filter((s) => s.act === 'OUTCOME_BRANCH')
              .map((scene) => {
                const parentChoice = decisionScene?.choices.find(
                  (c) => c.targetSceneId === scene.id
                );
                const isPublished = parentChoice ? parentChoice.isPublished : true;

                return (
                  <div
                    key={scene.id}
                    className={`p-3.5 rounded-lg border space-y-1.5 ${
                      isPublished
                        ? 'border-[#29DCEF]/50 bg-[#13182B]'
                        : 'border-[#FF617C]/50 bg-[#13182B]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#29DCEF]">{scene.code}</span>
                      <span
                        className={
                          isPublished ? 'text-[#29DCEF]' : 'text-[#FF617C]'
                        }
                      >
                        {isPublished
                          ? 'PUBLISHED MP4 OUTCOME'
                          : 'STAGED — AWAITING APPROVAL'}
                      </span>
                    </div>
                    <div className="font-display text-sm font-semibold text-[#F4F1E8]">
                      {scene.title}
                    </div>
                    <p className="text-xs text-[#9BA3B8] line-clamp-2">
                      {scene.synopsis}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Split: Left 5 Columns Gemini Branch Planner Form | Right 7 Columns Branch Proposals & Causal Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <form
          onSubmit={handleTestUnauthorizedPropose}
          className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="branch-directive"
                className="font-display text-base font-semibold text-[#F4F1E8] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#755CFF]" />
                <span>Propose Alternative Narrative Path</span>
              </label>
              <span className="text-xs font-mono text-[#9BA3B8]">
                {storyDNA.candidateBranchPoints[0]?.id}
              </span>
            </div>

            <p className="text-xs text-[#9BA3B8]">
              Describe a counterfactual choice at <strong className="text-[#F4F1E8]">{storyDNA.candidateBranchPoints[0]?.title}</strong>. Judges can evaluate the preconfigured proposal in the isolated Judge Sandbox or verify that direct public calls to <code className="text-[#FF617C]">/api/v1/planner/propose</code> return HTTP 403.
            </p>

            <textarea
              id="branch-directive"
              value={directive}
              onChange={(e) => setDirective(e.target.value)}
              rows={7}
              className="w-full rounded-lg bg-[#070912] border border-[#F4F1E8]/15 p-3.5 text-xs text-[#F4F1E8] leading-relaxed focus:outline-none focus:border-[#755CFF]"
            />
          </div>

          <div className="pt-3 border-t border-[#F4F1E8]/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={isPlanning}
              onClick={handleRunSandboxBranchScenario}
              className="px-3.5 py-2 text-xs font-semibold text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluate Branch in Judge Sandbox</span>
            </button>

            <button
              type="submit"
              disabled={isPlanning}
              className="px-3.5 py-2 text-xs font-semibold text-[#F4F1E8] bg-[#13182B] border border-[#FF617C]/40 rounded-lg hover:border-[#FF617C] transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF617C]" />
              <span>Test Unauthorized Global Planner (403)</span>
            </button>
          </div>
        </form>

        {/* Right 7 Columns: Proposed Branches List */}
        <div className="lg:col-span-7 rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F4F1E8]/10 pb-3">
            <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
              Verified Gemini Branch Proposals & Causal Impact Analysis
            </h2>
            <span className="text-xs font-mono text-[#9BA3B8] tabular-nums">
              {branchProposals.length} Proposals
            </span>
          </div>

          <div className="space-y-4">
            {branchProposals.map((prop) => {
              const isAlreadyInGraph = storyGraph.scenes.some(
                (s) => s.code === prop.newSceneDraft.code
              );

              return (
                <div
                  key={prop.id}
                  className="p-4 rounded-lg border border-[#F4F1E8]/10 bg-[#13182B]/80 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9BA3B8]">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[#29DCEF]">{prop.newSceneDraft.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{prop.endingThematicTag}</span>
                    </div>
                    <span className="font-mono text-[#755CFF]">
                      {isAlreadyInGraph ? 'PROMOTED TO GRAPH' : prop.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-base font-semibold text-[#F4F1E8]">
                      Choice: “{prop.choiceLabel}” — {prop.newSceneDraft.title}
                    </h3>
                    <p className="text-xs text-[#9BA3B8] mt-1">{prop.synopsis}</p>
                  </div>

                  {/* Causal Consequences */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#F4F1E8]">
                      Tracked Causal Consequences:
                    </div>
                    <ul className="space-y-1 text-xs text-[#9BA3B8]">
                      {prop.causalConsequences.map((c, idx) => (
                        <li key={idx}>
                          <span className="font-mono text-[#29DCEF] mr-1.5">
                            0{idx + 1}.
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Downstream Events That Must Change */}
                  {prop.downstreamEventChanges.length > 0 && (
                    <div className="pt-2 border-t border-[#F4F1E8]/10 space-y-1.5">
                      <div className="text-xs font-semibold text-[#F4F1E8]">
                        Downstream Canonical Events Modified:
                      </div>
                      {prop.downstreamEventChanges.map((change, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-[#9BA3B8] font-mono bg-[#070912]/70 p-2 rounded border border-[#F4F1E8]/10"
                        >
                          <span className="text-[#FF617C]">{change.changeType}</span>{' '}
                          <span className="text-[#29DCEF]">{change.originalEventId}</span>:{' '}
                          <span className="font-sans text-[#F4F1E8]">
                            {change.newDescription}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#F4F1E8]/10 flex items-center justify-between gap-3">
                    <span className="text-xs font-mono text-[#9BA3B8]">
                      Model: {prop.plannerModel} · Latency: {prop.latencyMs || 0} ms
                    </span>

                    <button
                      type="button"
                      onClick={handleRunSandboxBranchScenario}
                      className="px-3.5 py-2 text-xs font-medium text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                    >
                      Stage in Isolated Judge Sandbox
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Long-Term Programmable Entertainment Architecture Matrix */}
      <section className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F4F1E8]/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#29DCEF]" />
            <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
              Long-Term Platform Architecture & Commercial Scaling Topology
            </h2>
          </div>
          <span className="text-xs font-mono text-[#9BA3B8]">
            Contract v1.0.0 · Multi-Title Active (TITANIC 1912 + THE LAST SIGNAL)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#13182B]/60 border border-[#F4F1E8]/10 space-y-1">
            <div className="font-mono text-[#29DCEF]">DECISION TOPOLOGY</div>
            <div className="font-display text-base font-semibold text-[#F4F1E8] tabular-nums">
              Up to {storyGraph.architectureCapabilities.maxSupportedDecisions} Decision Hubs
            </div>
            <p className="text-[#9BA3B8]">
              Controlled demo scoped to 1 consequential decision; DAG engine supports 3 sequential decision points without state explosion.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#13182B]/60 border border-[#F4F1E8]/10 space-y-1">
            <div className="font-mono text-[#755CFF]">ENDING CAPACITY</div>
            <div className="font-display text-base font-semibold text-[#F4F1E8] tabular-nums">
              Up to {storyGraph.architectureCapabilities.maxSupportedEndings} Canonical Endings
            </div>
            <p className="text-[#9BA3B8]">
              2 endings live in Play (Outcome A & Outcome B) + 2 extensible ending slots (EXTENDED_C & EXTENDED_D) verified by validator.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#13182B]/60 border border-[#F4F1E8]/10 space-y-1">
            <div className="font-mono text-[#29DCEF]">MULTI-TITLE CATALOG</div>
            <div className="font-display text-base font-semibold text-[#F4F1E8]">
              Title-Scoped Partitioning
            </div>
            <p className="text-[#9BA3B8]">
              Every StoryDNA, RightsManifest, and StoryGraph is keyed by <code className="font-mono">titleId</code> for multi-studio slate isolation.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#13182B]/60 border border-[#F4F1E8]/10 space-y-1">
            <div className="font-mono text-[#FF617C]">COMMERCIAL & LICENSING</div>
            <div className="font-display text-base font-semibold text-[#F4F1E8]">
              Rights-Holder Royalties
            </div>
            <p className="text-[#9BA3B8]">
              Supports <code className="font-mono">FREE_DEMO</code>, <code className="font-mono">PAID_PASS</code>, and <code className="font-mono">STUDIO_LICENSE</code> tiers with per-branch audit hashes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
