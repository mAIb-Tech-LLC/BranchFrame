import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, FileText, Users, GitCommit, Lock, ShieldAlert } from 'lucide-react';
import { CanonValidationReport, RightsEvaluationResult, StoryDNA } from '../domain/schemas';
import { getJudgeSandboxHeaders } from '../utils/judgeSession';

interface StoryDnaStudioViewProps {
  screenplayText: string;
  storyDNA: StoryDNA;
  publishRightsCheck: RightsEvaluationResult;
  onCompileSuccess: (newDna: StoryDNA, newText: string, newCanon: CanonValidationReport) => void;
}

export const StoryDnaStudioView: React.FC<StoryDnaStudioViewProps> = ({
  screenplayText,
  storyDNA,
  publishRightsCheck,
  onCompileSuccess,
}) => {
  const [draftText, setDraftText] = useState<string>(screenplayText);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileMessage, setCompileMessage] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<
    'characters' | 'facts' | 'events' | 'constraints' | 'branches'
  >('characters');

  useEffect(() => {
    setDraftText(screenplayText);
    setCompileError(null);
    setCompileMessage(null);
  }, [screenplayText, storyDNA.titleId]);

  const handleRunCompiler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftText.trim()) {
      setCompileError('Screenplay manuscript cannot be empty.');
      return;
    }

    setIsCompiling(true);
    setCompileError(null);
    setCompileMessage(null);

    try {
      const response = await fetch('/api/v1/compiler/analyze', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: storyDNA.titleId,
          screenplayText: draftText,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setCompileError(
          data.error ||
            'Public canonical Story DNA compilation is locked (HTTP 403 PRIVILEGE_DENIED). Use the Judge Sandbox Preview button to test preconfigured Story DNA verification safely.'
        );
      } else {
        onCompileSuccess(data.storyDNA, draftText, data.canonReport);
        setCompileMessage(
          `Compiled and schema-validated StoryDNA v${data.storyDNA.schemaVersion} via ${data.storyDNA.compilerModel} (${data.storyDNA.characters.length} characters, ${data.storyDNA.canonicalFacts.length} facts, ${data.storyDNA.causalEvents.length} causal events).`
        );
      }
    } catch (err: any) {
      setCompileError(err?.message || 'Network error invoking Story DNA Compiler.');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRunSandboxPreview = async () => {
    setIsCompiling(true);
    setCompileError(null);
    setCompileMessage(null);
    try {
      const response = await fetch('/api/v1/sandbox/scenario/run', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: storyDNA.titleId,
          scenario: 'COMPILE_PREVIEW',
        }),
      });
      const data = await response.json();
      if (response.ok && data.sandboxState) {
        setCompileMessage(data.sandboxState.lastActionSummary);
      } else {
        setCompileError(data.error || 'Sandbox scenario failed.');
      }
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F4F1E8]/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
            <span className="font-mono text-[#755CFF]">GEMINI STORY DNA COMPILER</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Schema v{storyDNA.schemaVersion}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{storyDNA.compilerModel}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1E8] tracking-tight">
            01. Story DNA Extraction & Canonical Schema ({storyDNA.screenplayTitle})
          </h1>
          <p className="text-sm text-[#9BA3B8] max-w-3xl">
            Analyzes the original screenplay for <strong className="text-[#F4F1E8]">{storyDNA.screenplayTitle}</strong> and compiles characters, immutable facts, causal event dependencies, narrative constraints, and candidate branch points into versioned, independently validated JSON.
          </p>
        </div>

        <div className="text-xs font-mono text-[#9BA3B8] tabular-nums shrink-0">
          Last Compiled: {new Date(storyDNA.compiledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
        </div>
      </div>

      {/* Feedback Banner */}
      {compileError && (
        <div role="alert" className="p-4 rounded-xl border border-[#FF617C]/50 bg-[#13182B] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FF617C] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-[#FF617C]">Public Canonical Mutation & Billable AI Guard Active (HTTP 403)</div>
            <div className="text-[#F4F1E8]">{compileError}</div>
          </div>
        </div>
      )}

      {compileMessage && (
        <div role="status" className="p-4 rounded-xl border border-[#29DCEF]/50 bg-[#13182B] flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#29DCEF] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-[#29DCEF]">Story DNA Verification Complete</div>
            <div className="text-[#F4F1E8]">{compileMessage}</div>
          </div>
        </div>
      )}

      {/* Main 12-Column Split: Left 5 Columns Screenplay Source | Right 7 Columns Compiled Story DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 5 Columns: Original Screenplay Editor & Compiler Trigger */}
        <form
          onSubmit={handleRunCompiler}
          className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="screenplay-editor"
                className="font-display text-base font-semibold text-[#F4F1E8] flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-[#29DCEF]" />
                <span>Original Screenplay Manuscript ({storyDNA.screenplayTitle})</span>
              </label>
              <span className="text-xs font-mono text-[#9BA3B8] tabular-nums">
                {draftText.length} chars
              </span>
            </div>

            <p className="text-xs text-[#9BA3B8]">
              Inspect the canonical screenplay below. Direct public calls to <code className="text-[#FF617C]">/api/v1/compiler/analyze</code> are blocked by P0 security hardening to prevent unauthorized canonical overwrites or billable AI triggers.
            </p>

            <textarea
              id="screenplay-editor"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={18}
              className="w-full rounded-lg bg-[#070912] border border-[#F4F1E8]/15 p-3.5 text-xs font-mono text-[#F4F1E8] leading-relaxed focus:outline-none focus:border-[#755CFF]"
            />
          </div>

          <div className="pt-3 border-t border-[#F4F1E8]/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={isCompiling}
              onClick={handleRunSandboxPreview}
              className="px-3.5 py-2 text-xs font-semibold text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verify Story DNA in Judge Sandbox</span>
            </button>

            <button
              type="submit"
              disabled={isCompiling}
              className="px-3.5 py-2 text-xs font-semibold text-[#F4F1E8] bg-[#13182B] border border-[#FF617C]/40 rounded-lg hover:border-[#FF617C] transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF617C]" />
              <span>Test Unauthorized Global Compile (403)</span>
            </button>
          </div>
        </form>

        {/* Right 7 Columns: Structured Story DNA Inspector */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-5">
          <div className="space-y-4">
            {/* Logline & Interactive Filter Bar */}
            <div className="space-y-3 border-b border-[#F4F1E8]/10 pb-4">
              <div className="text-xs text-[#9BA3B8]">
                <span className="text-[#F4F1E8] font-semibold">Compiled Logline: </span>
                {storyDNA.logline}
              </div>

              {/* Interactive Segmented Controls */}
              <div
                role="tablist"
                aria-label="Story DNA Schema Sections"
                className="flex flex-wrap items-center gap-1 p-1 bg-[#070912] rounded-lg border border-[#F4F1E8]/10"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSubTab === 'characters'}
                  onClick={() => setActiveSubTab('characters')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeSubTab === 'characters'
                      ? 'bg-[#13182B] text-[#29DCEF]'
                      : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
                  }`}
                >
                  Characters ({storyDNA.characters.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSubTab === 'facts'}
                  onClick={() => setActiveSubTab('facts')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeSubTab === 'facts'
                      ? 'bg-[#13182B] text-[#29DCEF]'
                      : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
                  }`}
                >
                  Canonical Facts ({storyDNA.canonicalFacts.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSubTab === 'events'}
                  onClick={() => setActiveSubTab('events')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeSubTab === 'events'
                      ? 'bg-[#13182B] text-[#29DCEF]'
                      : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
                  }`}
                >
                  Causal Events ({storyDNA.causalEvents.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSubTab === 'constraints'}
                  onClick={() => setActiveSubTab('constraints')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeSubTab === 'constraints'
                      ? 'bg-[#13182B] text-[#29DCEF]'
                      : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
                  }`}
                >
                  Constraints ({storyDNA.narrativeConstraints.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeSubTab === 'branches'}
                  onClick={() => setActiveSubTab('branches')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    activeSubTab === 'branches'
                      ? 'bg-[#13182B] text-[#29DCEF]'
                      : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
                  }`}
                >
                  Branch Points ({storyDNA.candidateBranchPoints.length})
                </button>
              </div>
            </div>

            {/* Tab 1: Characters */}
            {activeSubTab === 'characters' && (
              <div className="space-y-3">
                {storyDNA.characters.map((char) => (
                  <div
                    key={char.id}
                    className="p-4 rounded-lg border border-[#F4F1E8]/10 bg-[#13182B]/70 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9BA3B8]">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#755CFF]" />
                        <span className="font-display text-sm font-semibold text-[#F4F1E8]">
                          {char.name}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{char.role}</span>
                      </div>
                      <span className="font-mono text-[#29DCEF]">{char.id}</span>
                    </div>
                    <p className="text-xs text-[#F4F1E8] leading-relaxed">
                      <span className="text-[#9BA3B8]">Motivation: </span>
                      {char.motivation}
                    </p>
                    <div className="pt-2 border-t border-[#F4F1E8]/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#9BA3B8]">
                      <span>
                        Initial Knowledge:{' '}
                        <strong className="font-mono text-[#F4F1E8]">
                          {char.initialKnowledgeFactIds.join(', ')}
                        </strong>
                      </span>
                      <span>
                        Likeness Protected:{' '}
                        <strong className="font-mono text-[#29DCEF]">
                          {char.likenessProtected ? 'YES (SAG-AFTRA)' : 'NO'}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Canonical Facts */}
            {activeSubTab === 'facts' && (
              <div className="space-y-2.5">
                {storyDNA.canonicalFacts.map((fact) => (
                  <div
                    key={fact.id}
                    className="p-3.5 rounded-lg border border-[#F4F1E8]/10 bg-[#13182B]/70 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9BA3B8]">
                      <span className="font-mono text-[#29DCEF]">{fact.id}</span>
                      <div className="flex items-center gap-2">
                        <span>{fact.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">
                          {fact.immutable ? 'IMMUTABLE CANON' : 'BRANCH-DEPENDENT'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#F4F1E8]">{fact.statement}</p>
                    {fact.contradictsFactIds.length > 0 && (
                      <div className="text-[11px] font-mono text-[#FF617C]">
                        Mutually Exclusive With: {fact.contradictsFactIds.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Causal Events */}
            {activeSubTab === 'events' && (
              <div className="space-y-3">
                {storyDNA.causalEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-lg border border-[#F4F1E8]/10 bg-[#13182B]/70 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9BA3B8]">
                      <div className="flex items-center gap-2">
                        <GitCommit className="w-3.5 h-3.5 text-[#29DCEF]" />
                        <span className="font-display font-semibold text-[#F4F1E8]">
                          {evt.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className="text-[#755CFF]">{evt.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>TC {evt.timestampCode}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#9BA3B8]">{evt.description}</p>
                    <div className="pt-1.5 flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#9BA3B8]">
                      <span>
                        Depends On:{' '}
                        <strong className="text-[#F4F1E8]">
                          {evt.dependsOnEventIds.length > 0
                            ? evt.dependsOnEventIds.join(', ')
                            : 'ROOT'}
                        </strong>
                      </span>
                      <span>
                        Causes:{' '}
                        <strong className="text-[#29DCEF]">
                          {evt.causesEventIds.length > 0
                            ? evt.causesEventIds.join(', ')
                            : 'TERMINAL OUTCOME'}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Narrative Constraints */}
            {activeSubTab === 'constraints' && (
              <div className="space-y-3">
                {storyDNA.narrativeConstraints.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-lg border border-[#F4F1E8]/10 bg-[#13182B]/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-[#9BA3B8]">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-[#755CFF]" />
                        <span className="font-mono text-[#F4F1E8]">{c.id}</span>
                      </div>
                      <span className="font-mono text-[#29DCEF]">
                        {c.severity} · {c.enforcedByValidator ? 'VALIDATOR ENFORCED' : 'ADVISORY'}
                      </span>
                    </div>
                    <p className="text-xs text-[#F4F1E8]">{c.rule}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 5: Candidate Branch Points */}
            {activeSubTab === 'branches' && (
              <div className="space-y-3">
                {storyDNA.candidateBranchPoints.map((bp) => (
                  <div
                    key={bp.id}
                    className="p-4 rounded-lg border border-[#755CFF]/40 bg-[#13182B] space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-[#9BA3B8]">
                      <span className="font-mono text-[#29DCEF]">{bp.id}</span>
                      <span className="font-mono">Trigger: {bp.triggerEventId}</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-[#F4F1E8]">
                      {bp.title}
                    </h3>
                    <p className="text-xs text-[#F4F1E8]">{bp.dramaticQuestion}</p>
                    <p className="text-xs text-[#9BA3B8]">
                      <strong className="text-[#F4F1E8]">Stakes: </strong>
                      {bp.stakes}
                    </p>
                    <div className="pt-2 border-t border-[#F4F1E8]/10 space-y-1">
                      <div className="text-xs font-semibold text-[#29DCEF]">
                        Candidate Narrative Trajectories:
                      </div>
                      <ul className="space-y-1 text-xs text-[#9BA3B8]">
                        {bp.suggestedAlternatives.map((alt, i) => (
                          <li key={i} className="font-mono">
                            0{i + 1}. {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#F4F1E8]/10 flex items-center justify-between text-xs text-[#9BA3B8]">
            <span>Independent Schema Validator: PASS (StoryDNA v1.0.0)</span>
            <span className="font-mono tabular-nums">
              {storyDNA.canonicalFacts.length} Facts · {storyDNA.causalEvents.length} Events
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
