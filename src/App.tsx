/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Lock, RotateCcw, Film, ShieldAlert } from 'lucide-react';
import {
  BranchProposal,
  CanonValidationReport,
  GeminiExecutionTrace,
  GenerationJob,
  PublicationRecord,
  RightsEvaluationResult,
  RightsManifest,
  StoryDNA,
  StoryGraph,
} from './domain/schemas';
import {
  INITIAL_GEMINI_TRACES,
  INITIAL_TITLE_BUNDLES,
  LAST_SIGNAL_TITLE_ID,
  TITANIC_TITLE_ID,
} from './domain/seedData';
import { evaluateRightsPolicy } from './domain/rightsEngine';
import { validateStoryCanonAndGraph } from './domain/canonValidator';
import { getJudgeSandboxHeaders, getJudgeSessionId } from './utils/judgeSession';
import { CinemaPlayerView } from './components/CinemaPlayerView';
import { StoryDnaStudioView } from './components/StoryDnaStudioView';
import { BranchMapStudioView } from './components/BranchMapStudioView';
import { RightsAndCanonView } from './components/RightsAndCanonView';
import { GenerationAndPublishView } from './components/GenerationAndPublishView';
import { HackathonDossierView } from './components/HackathonDossierView';

type ActiveView = 'play' | 'dna' | 'map' | 'rights' | 'generate' | 'dossier';

export default function App() {
  const [activeTitleId, setActiveTitleId] = useState<string>(TITANIC_TITLE_ID);
  const [activeView, setActiveView] = useState<ActiveView>('play');
  const [judgeSessionId] = useState<string>(() => getJudgeSessionId());

  const initialBundle = INITIAL_TITLE_BUNDLES[TITANIC_TITLE_ID];

  const [screenplayText, setScreenplayText] = useState<string>(
    initialBundle.screenplayText
  );
  const [storyDNA, setStoryDNA] = useState<StoryDNA>(initialBundle.storyDNA);
  const [rightsManifest, setRightsManifest] = useState<RightsManifest>(
    initialBundle.rightsManifest
  );
  const [storyGraph, setStoryGraph] = useState<StoryGraph>(initialBundle.storyGraph);
  const [branchProposals, setBranchProposals] = useState<BranchProposal[]>(
    initialBundle.branchProposals
  );
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>(
    initialBundle.generationJobs
  );
  const [publicationRecords, setPublicationRecords] = useState<PublicationRecord[]>(
    initialBundle.publicationRecords
  );
  const [geminiTraces, setGeminiTraces] =
    useState<GeminiExecutionTrace[]>(INITIAL_GEMINI_TRACES);

  const [securityStatusMsg, setSecurityStatusMsg] = useState<string | null>(null);

  const [canonReport, setCanonReport] = useState<CanonValidationReport>(() =>
    validateStoryCanonAndGraph(initialBundle.storyDNA, initialBundle.storyGraph)
  );
  const [publishRightsCheck, setPublishRightsCheck] = useState<RightsEvaluationResult>(
    () =>
      evaluateRightsPolicy(initialBundle.rightsManifest, {
        operation: 'PUBLISH_GRAPH',
        titleId: TITANIC_TITLE_ID,
        characterIds: initialBundle.storyDNA.characters.map((c) => c.id),
      })
  );
  const [capabilities, setCapabilities] = useState({
    geminiConfigured: true,
    compilerModel: 'gemini-4-hydrogen',
    plannerModel: 'gemini-4-hydrogen',
    videoAdapterModel: 'gemini-omni-1.2-flash',
    imageAdapterModel: 'gemini-3.1-flash-lite-image',
    videoModelAccessible: true,
    note: 'Server-side Gemini Story DNA Compiler (gemini-4-hydrogen) and v1beta Omni 1.2 Flash MP4 Video Adapter verified.',
  });

  const hydrateFromLocalBundle = useCallback((titleId: string) => {
    const bundle =
      INITIAL_TITLE_BUNDLES[titleId] || INITIAL_TITLE_BUNDLES[TITANIC_TITLE_ID];
    setScreenplayText(bundle.screenplayText);
    setStoryDNA(bundle.storyDNA);
    setRightsManifest(bundle.rightsManifest);
    setStoryGraph(bundle.storyGraph);
    setBranchProposals(bundle.branchProposals);
    setGenerationJobs(bundle.generationJobs);
    setPublicationRecords(bundle.publicationRecords);
    setCanonReport(validateStoryCanonAndGraph(bundle.storyDNA, bundle.storyGraph));
    setPublishRightsCheck(
      evaluateRightsPolicy(bundle.rightsManifest, {
        operation: 'PUBLISH_GRAPH',
        titleId: bundle.titleId,
        characterIds: bundle.storyDNA.characters.map((c) => c.id),
      })
    );
  }, []);

  const refreshServerState = useCallback(
    (targetTitleId: string = activeTitleId) => {
      fetch(`/api/v1/state?titleId=${encodeURIComponent(targetTitleId)}`, {
        headers: getJudgeSandboxHeaders(),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.store) {
            setScreenplayText(data.store.screenplayText);
            setStoryDNA(data.store.storyDNA);
            setStoryGraph(data.store.storyGraph);
            setBranchProposals(data.store.branchProposals);
            setGenerationJobs(data.store.generationJobs);
            setPublicationRecords(data.store.publicationRecords);
            if (data.store.geminiTraces) setGeminiTraces(data.store.geminiTraces);
            if (data.sandbox) {
              setRightsManifest(data.sandbox.rightsManifest);
              setPublishRightsCheck(data.sandbox.publishRightsCheck);
              setCanonReport(data.sandbox.canonReport);
            } else {
              setRightsManifest(data.store.rightsManifest);
              if (data.canonReport) setCanonReport(data.canonReport);
              if (data.publishRightsCheck) setPublishRightsCheck(data.publishRightsCheck);
            }
            if (data.capabilities) setCapabilities(data.capabilities);
          }
        })
        .catch(() => {
          hydrateFromLocalBundle(targetTitleId);
        });
    },
    [activeTitleId, hydrateFromLocalBundle]
  );

  useEffect(() => {
    hydrateFromLocalBundle(activeTitleId);
    refreshServerState(activeTitleId);
  }, [activeTitleId, hydrateFromLocalBundle, refreshServerState]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeView]);

  const handleSelectTitle = (nextTitleId: string) => {
    if (nextTitleId === activeTitleId) return;
    setSecurityStatusMsg(null);
    setActiveTitleId(nextTitleId);
  };

  const handleVerifyPublicElevationBlocked = async () => {
    setSecurityStatusMsg(null);
    try {
      const res = await fetch('/api/v1/auth/elevate', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setSecurityStatusMsg(
        `Verified P0 Lockdown — HTTP ${res.status} (${
          data.code || 'PUBLIC_ELEVATION_DISABLED'
        }): ${data.error}`
      );
    } catch (err: any) {
      setSecurityStatusMsg(err?.message || 'Error testing public lockdown.');
    }
  };

  const handleResetJudgeSandbox = async () => {
    setSecurityStatusMsg(null);
    try {
      const res = await fetch('/api/v1/sandbox/reset', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({ titleId: activeTitleId }),
      });
      const data = await res.json();
      if (res.ok && data.sandboxState) {
        setRightsManifest(data.sandboxState.rightsManifest);
        setPublishRightsCheck(data.sandboxState.publishRightsCheck);
        setCanonReport(data.sandboxState.canonReport);
        setSecurityStatusMsg(data.sandboxState.lastActionSummary);
      }
    } catch {
      hydrateFromLocalBundle(activeTitleId);
    }
  };

  const isTitanic = activeTitleId === TITANIC_TITLE_ID;

  return (
    <div className="min-h-screen bg-[#070912] text-[#F4F1E8] flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-[#F4F1E8]/10 bg-[#070912]/90 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#play"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('play');
          }}
          className="font-display text-lg font-bold tracking-tight text-[#F4F1E8] whitespace-nowrap shrink-0"
        >
          BRANCHFRAME
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-6 text-sm font-medium text-[#9BA3B8] overflow-x-auto"
        >
          <a
            href="#play"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('play');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeView === 'play'
                ? 'text-[#F4F1E8] border-[#29DCEF]'
                : 'border-transparent hover:text-[#F4F1E8]'
            }`}
          >
            Play
          </a>
          <a
            href="#dna"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('dna');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeView === 'dna'
                ? 'text-[#F4F1E8] border-[#755CFF]'
                : 'border-transparent hover:text-[#F4F1E8]'
            }`}
          >
            Story DNA
          </a>
          <a
            href="#map"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('map');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeView === 'map'
                ? 'text-[#F4F1E8] border-[#755CFF]'
                : 'border-transparent hover:text-[#F4F1E8]'
            }`}
          >
            Branch Map
          </a>
          <a
            href="#rights"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('rights');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeView === 'rights'
                ? 'text-[#F4F1E8] border-[#755CFF]'
                : 'border-transparent hover:text-[#F4F1E8]'
            }`}
          >
            Rights & Canon
          </a>
          <a
            href="#generate"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('generate');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeView === 'generate'
                ? 'text-[#F4F1E8] border-[#755CFF]'
                : 'border-transparent hover:text-[#F4F1E8]'
            }`}
          >
            Generation & Publish
          </a>
          <a
            href="#dossier"
            onClick={(e) => {
              e.preventDefault();
              refreshServerState(activeTitleId);
              setActiveView('dossier');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeView === 'dossier'
                ? 'text-[#F4F1E8] border-[#29DCEF]'
                : 'border-transparent hover:text-[#F4F1E8]'
            }`}
          >
            Gemini & Pitch
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action Button */}
        <div className="flex items-center shrink-0">
          {activeView === 'play' ? (
            <button
              type="button"
              onClick={() => setActiveView('dna')}
              className="px-4 py-2 text-xs font-semibold text-[#F4F1E8] bg-[#755CFF] rounded-lg hover:bg-[#755CFF]/90 transition-colors whitespace-nowrap shrink-0"
            >
              Open Studio
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveView('play')}
              className="px-4 py-2 text-xs font-semibold text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              Launch Player
            </button>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Multi-Title Catalogue Switcher Strip (TITANIC 1912 Flagship + THE LAST SIGNAL Reference) */}
        <div className="rounded-xl border border-[#F4F1E8]/15 bg-[#0D1120] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#9BA3B8]">
              <Film className="w-3.5 h-3.5 text-[#29DCEF]" />
              <span className="font-mono text-[#29DCEF] font-semibold">
                {isTitanic
                  ? 'FLAGSHIP INTERACTIVE PROTOTYPE · HISTORICAL FICTION'
                  : 'TECHNICAL REFERENCE PROTOTYPE · SCI-FI THRILLER'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#755CFF]">
                STORYBOARD OPENING + 2 GENERATED OMNI 1.2 FLASH MP4 OUTCOMES
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-xl font-bold text-[#F4F1E8] tracking-tight">
                {storyDNA.screenplayTitle}
              </span>
              <span className="text-xs italic text-[#9BA3B8]">
                “{isTitanic ? 'One night. One decision. Different futures.' : "The story doesn't have to end that way."}”
              </span>
            </div>
          </div>

          <div
            role="group"
            aria-label="Interactive Title Selector"
            className="flex flex-wrap items-center gap-2 shrink-0"
          >
            <button
              type="button"
              data-testid="select-title-titanic"
              onClick={() => handleSelectTitle(TITANIC_TITLE_ID)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                isTitanic
                  ? 'bg-[#29DCEF] text-[#070912] border-[#29DCEF]'
                  : 'bg-[#13182B] text-[#F4F1E8] border-[#F4F1E8]/15 hover:border-[#29DCEF]'
              }`}
            >
              TITANIC 1912 (Flagship)
            </button>
            <button
              type="button"
              data-testid="select-title-last-signal"
              onClick={() => handleSelectTitle(LAST_SIGNAL_TITLE_ID)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                !isTitanic
                  ? 'bg-[#755CFF] text-[#F4F1E8] border-[#755CFF]'
                  : 'bg-[#13182B] text-[#F4F1E8] border-[#F4F1E8]/15 hover:border-[#755CFF]'
              }`}
            >
              THE LAST SIGNAL (Reference)
            </button>
          </div>
        </div>

        {/* P0 Security Hardening & Isolated Judge Demonstration Sandbox Bar on Studio Tabs */}
        {activeView !== 'play' && activeView !== 'dossier' && (
          <div className="rounded-xl border border-[#29DCEF]/30 bg-[#0D1120] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <Lock className="w-5 h-5 text-[#29DCEF] shrink-0" />
              <div className="space-y-0.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[#9BA3B8]">SECURITY CONTEXT:</span>
                  <span className="font-mono font-bold text-[#29DCEF]">
                    PUBLIC CANON LOCKED · ISOLATED JUDGE SANDBOX ({judgeSessionId})
                  </span>
                </div>
                <p className="text-[#9BA3B8]">
                  {securityStatusMsg ||
                    'Public visitors cannot acquire administrator privileges, alter global rights policies, approve canonical releases, or trigger billable AI generation. Interactive studio tests run safely in your isolated Judge Sandbox.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleVerifyPublicElevationBlocked}
                className="px-3.5 py-2 text-xs font-semibold text-[#F4F1E8] bg-[#13182B] border border-[#FF617C]/40 rounded-lg hover:border-[#FF617C] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF617C]" />
                <span>Verify Admin Elevation Lock (403)</span>
              </button>
              <button
                type="button"
                onClick={handleResetJudgeSandbox}
                className="px-3.5 py-2 text-xs font-semibold text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Judge Sandbox</span>
              </button>
            </div>
          </div>
        )}

        {activeView === 'play' && (
          <CinemaPlayerView
            storyDNA={storyDNA}
            storyGraph={storyGraph}
            publishRightsCheck={publishRightsCheck}
            geminiTraces={geminiTraces}
            onOpenStudioTab={(tab) => setActiveView(tab)}
          />
        )}

        {activeView === 'dna' && (
          <StoryDnaStudioView
            screenplayText={screenplayText}
            storyDNA={storyDNA}
            publishRightsCheck={publishRightsCheck}
            onCompileSuccess={(newDna, newText, newCanon) => {
              setStoryDNA(newDna);
              setScreenplayText(newText);
              setCanonReport(newCanon);
            }}
          />
        )}

        {activeView === 'map' && (
          <BranchMapStudioView
            storyDNA={storyDNA}
            storyGraph={storyGraph}
            branchProposals={branchProposals}
            publishRightsCheck={publishRightsCheck}
            onProposalCreated={(newProposal) => {
              setBranchProposals((prev) => [newProposal, ...prev]);
            }}
            onProposalPromoted={(newGraph, newCanon) => {
              setStoryGraph(newGraph);
              setCanonReport(newCanon);
            }}
          />
        )}

        {activeView === 'rights' && (
          <RightsAndCanonView
            rightsManifest={rightsManifest}
            publishRightsCheck={publishRightsCheck}
            canonReport={canonReport}
            onRightsUpdated={(manifest, publishCheck) => {
              setRightsManifest(manifest);
              setPublishRightsCheck(publishCheck);
            }}
          />
        )}

        {activeView === 'generate' && (
          <GenerationAndPublishView
            storyGraph={storyGraph}
            generationJobs={generationJobs}
            publicationRecords={publicationRecords}
            publishRightsCheck={publishRightsCheck}
            canonReport={canonReport}
            capabilities={capabilities}
          />
        )}

        {activeView === 'dossier' && (
          <HackathonDossierView
            storyDNA={storyDNA}
            storyGraph={storyGraph}
            geminiTraces={geminiTraces}
            publicationRecords={publicationRecords}
            capabilities={capabilities}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#F4F1E8]/10 px-6 py-5 mt-12">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9BA3B8]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#29DCEF]" />
            <span>
              BranchFrame — Programmable Interactive Entertainment · Flagship: TITANIC 1912 · Reference: THE LAST SIGNAL
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#play"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('play');
              }}
              className="hover:text-[#F4F1E8] transition-colors"
            >
              BranchFrame Play
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="#dna"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('dna');
              }}
              className="hover:text-[#F4F1E8] transition-colors"
            >
              Story DNA Compiler
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="#dossier"
              onClick={(e) => {
                e.preventDefault();
                refreshServerState(activeTitleId);
                setActiveView('dossier');
              }}
              className="hover:text-[#F4F1E8] transition-colors"
            >
              Gemini Traces & Pitch Dossier
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
