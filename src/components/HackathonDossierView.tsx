import React, { useState } from 'react';
import {
  Cpu,
  FileText,
  Mic,
  Film,
  Users,
  ExternalLink,
  CheckCircle2,
  Clock,
  Youtube,
  GitCommit,
} from 'lucide-react';
import {
  GeminiExecutionTrace,
  PublicationRecord,
  StoryDNA,
  StoryGraph,
} from '../domain/schemas';

interface HackathonDossierViewProps {
  storyDNA: StoryDNA;
  storyGraph: StoryGraph;
  geminiTraces: GeminiExecutionTrace[];
  publicationRecords: PublicationRecord[];
  capabilities: {
    geminiConfigured: boolean;
    compilerModel: string;
    plannerModel: string;
    videoAdapterModel: string;
    imageAdapterModel: string;
    videoModelAccessible: boolean;
    note: string;
  };
}

export const HackathonDossierView: React.FC<HackathonDossierViewProps> = ({
  storyGraph,
  geminiTraces,
  capabilities,
}) => {
  const [activeDocTab, setActiveDocTab] = useState<
    'checklist' | 'product' | 'team' | 'pitch' | 'demo_script' | 'youtube'
  >('checklist');

  const publicDemoUrl =
    'https://ais-pre-sz4m6basjpzqqppvnlc552-693549710523.europe-west1.run.app';
  const cloudRunDevUrl =
    'https://ais-dev-sz4m6basjpzqqppvnlc552-693549710523.europe-west1.run.app';
  const aiStudioProjectUrl =
    'https://aistudio.google.com/apps/drive/964bbf5f-d829-4376-aa2e-4b77fe26b910';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F4F1E8]/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
            <span className="font-mono text-[#29DCEF]">
              BERKELEY × GOOGLE DEEPMIND HACKATHON
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">MISSION 04 SUBMISSION FREEZE</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#755CFF]">RELEASE TAG: v1.0.0-hackathon-freeze</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1E8] tracking-tight">
            05. Gemini Live Telemetry & Final Submission Manifest
          </h1>
          <p className="text-sm text-[#9BA3B8] max-w-3xl">
            Verified server-side execution ledger recording actual{' '}
            <code className="font-mono text-[#29DCEF]">@google/genai</code> SDK calls across{' '}
            <code className="font-mono text-[#755CFF]">gemini-4-hydrogen</code> and{' '}
            <code className="font-mono text-[#29DCEF]">gemini-omni-1.2-flash</code> (
            <code className="font-mono">v1beta</code> Interactions API), alongside factually audited submission documents and recording scripts.
          </p>
        </div>

        <div className="text-xs font-mono text-[#9BA3B8] tabular-nums shrink-0">
          Recorded Calls: {geminiTraces.length} · Graph v{storyGraph.versionNumber}.0
        </div>
      </div>

      {/* Prototype Scope & Technical Honesty Attestation (P2) */}
      <section className="rounded-xl border border-[#29DCEF]/40 bg-[#13182B]/80 p-5 space-y-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[#29DCEF]">
          <span>PROTOTYPE SCOPE & TECHNICAL ACCURACY ATTESTATION (MISSION 04 FREEZE)</span>
          <span>4/4 MP4 OUTCOMES PERSISTED</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[#F4F1E8] leading-relaxed pt-1">
          <li>
            • <strong>Gemini Inference:</strong> Story DNA compilation and counterfactual Branch Planning execute via live server-side <code className="font-mono text-[#29DCEF]">gemini-4-hydrogen</code> calls with strict JSON schema validation.
          </li>
          <li>
            • <strong>Original Historical-Fiction Prototype:</strong> <em>TITANIC 1912</em> is a controlled interactive prototype (not a feature-length film) featuring 100% original characters (Clara Voss &amp; Julian Mercer) and zero copyrighted 1997 film IP.
          </li>
          <li>
            • <strong>Media Modalities:</strong> Opening and decision scenes (<code className="font-mono">SCN-01</code>, <code className="font-mono">SCN-02</code>) use 16:9 storyboard keyframe plates; branch outcomes (<code className="font-mono">SCN-03A</code>, <code className="font-mono">SCN-03B</code>) play generated 16:9 720p MP4 motion video synthesized via <code className="font-mono text-[#29DCEF]">gemini-omni-1.2-flash</code> (<code className="font-mono">v1beta</code> Interactions API).
          </li>
          <li>
            • <strong>Deterministic Rights &amp; Licensing:</strong> Rights-as-Code (<code className="font-mono">DENY</code> by default), Canon DAG validation, and mandatory human publication review run as deterministic application logic. Existing third-party films are never converted without explicit rightsholder licensing.
          </li>
        </ul>
      </section>

      {/* Live Gemini Telemetry & Provenance Ledger */}
      <section className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4F1E8]/10 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#29DCEF]" />
            <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
              Server-Side Gemini API Execution Trace Ledger
            </h2>
          </div>
          <span className="text-xs font-mono text-[#9BA3B8]">
            Compiler: {capabilities.compilerModel} · Video: {capabilities.videoAdapterModel} (v1beta)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#F4F1E8]/10 text-[#9BA3B8] font-mono">
                <th className="py-2.5 px-3 whitespace-nowrap">OPERATION</th>
                <th className="py-2.5 px-3 whitespace-nowrap">MODEL ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">OUTCOME / PROVENANCE</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">LATENCY</th>
                <th className="py-2.5 px-3">VALIDATION &amp; TRACE SUMMARY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F1E8]/10">
              {geminiTraces.map((tr) => (
                <tr key={tr.id} className="hover:bg-[#13182B]/60">
                  <td className="py-2.5 px-3 font-mono text-[#F4F1E8] whitespace-nowrap">
                    {tr.operation}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#29DCEF] whitespace-nowrap">
                    {tr.modelId}
                  </td>
                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                    <span
                      className={
                        tr.outcome === 'LIVE_SUCCESS'
                          ? 'text-[#29DCEF]'
                          : 'text-[#FF617C]'
                      }
                    >
                      {tr.outcome}
                    </span>{' '}
                    · <span className="text-[#9BA3B8]">{tr.provenance}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#F4F1E8] whitespace-nowrap">
                    {tr.latencyMs.toLocaleString()} ms
                  </td>
                  <td className="py-2.5 px-3 text-[#9BA3B8]">
                    <div>{tr.validationSummary}</div>
                    {tr.sanitizedError && (
                      <div className="font-mono text-[11px] text-[#FF617C] mt-0.5">
                        Trace: {tr.sanitizedError}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hackathon Submission Artifacts (P1–P4) */}
      <section className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#F4F1E8]/10 pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F4F1E8]">
              Berkeley × Google DeepMind Hackathon Submission Manifest
            </h2>
            <p className="text-xs text-[#9BA3B8]">
              Audited links, plain-text one-pagers, and exact 60s/120s recording scripts.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Hackathon Submission Documents"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#070912] rounded-lg border border-[#F4F1E8]/10"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeDocTab === 'checklist'}
              onClick={() => setActiveDocTab('checklist')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeDocTab === 'checklist'
                  ? 'bg-[#13182B] text-[#29DCEF]'
                  : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
              }`}
            >
              Submission Manifest
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDocTab === 'product'}
              onClick={() => setActiveDocTab('product')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeDocTab === 'product'
                  ? 'bg-[#13182B] text-[#29DCEF]'
                  : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
              }`}
            >
              Product &amp; Tech 1-Pager
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDocTab === 'team'}
              onClick={() => setActiveDocTab('team')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeDocTab === 'team'
                  ? 'bg-[#13182B] text-[#29DCEF]'
                  : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
              }`}
            >
              Team 1-Pager
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDocTab === 'demo_script'}
              onClick={() => setActiveDocTab('demo_script')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeDocTab === 'demo_script'
                  ? 'bg-[#13182B] text-[#29DCEF]'
                  : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
              }`}
            >
              60s Demo Walkthrough
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDocTab === 'pitch'}
              onClick={() => setActiveDocTab('pitch')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeDocTab === 'pitch'
                  ? 'bg-[#13182B] text-[#29DCEF]'
                  : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
              }`}
            >
              2-Min Founder Pitch
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeDocTab === 'youtube'}
              onClick={() => setActiveDocTab('youtube')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeDocTab === 'youtube'
                  ? 'bg-[#13182B] text-[#29DCEF]'
                  : 'text-[#9BA3B8] hover:text-[#F4F1E8]'
              }`}
            >
              YouTube Upload Guide
            </button>
          </div>
        </div>

        {/* Tab 0: 7-Artifact Status Checklist */}
        {activeDocTab === 'checklist' && (
          <div className="space-y-3 text-xs">
            {[
              {
                num: '01',
                title: 'Working Public Deployed Demo URL (Cloud Run Shared Preview)',
                status: 'INCOMPLETE — OWNER MUST ENABLE PUBLIC SHARING IN AI STUDIO UI',
                detail: `${publicDemoUrl} — Verified working end-to-end on container port 3000 across isolated anonymous sessions; unauthenticated external probe to ais-pre returns HTTP 404 until the project owner (rami.m.abdelrahim@gmail.com) enables public sharing in the AI Studio top-bar Share menu.`,
                isComplete: false,
              },
              {
                num: '02',
                title: 'Google AI Studio Source-Project Share Link & Frozen Git Repo',
                status: 'INCOMPLETE — OWNER SHARE PERMISSION IN AI STUDIO UI / GITHUB PUSH REQUIRED',
                detail: `AI Studio Applet URL: ${aiStudioProjectUrl} (Applet ID: 964bbf5f-d829-4376-aa2e-4b77fe26b910; Note: ${cloudRunDevUrl} is the Cloud Run dev container endpoint, NOT the source share link). Local secrets-free git repo frozen at tag v1.0.0-hackathon-freeze — project owner must enable "Anyone with link" in AI Studio Share dialog or push to a public GitHub remote.`,
                isComplete: false,
              },
              {
                num: '03',
                title: 'Plain-Text Team One-Pager (Actual Participant & Credentials)',
                status: 'COMPLETE',
                detail:
                  'Identifies actual builder Rami Abdelrahim (rami.m.abdelrahim@gmail.com) and genuine system engineering delivered for the hackathon.',
                isComplete: true,
              },
              {
                num: '04',
                title: 'Plain-Text Product & Technology One-Pager (Factually Audited)',
                status: 'COMPLETE',
                detail:
                  'Accurately distinguishes live Gemini Story DNA/Branch Planning, storyboard opening plates, generated Omni 1.2 Flash MP4 outcomes, deterministic Rights-as-Code/Canon gates, human review, and licensed rights-holder pilot model.',
                isComplete: true,
              },
              {
                num: '05',
                title: 'Two-Minute Founder Pitch Video',
                status: 'INCOMPLETE — MANUAL CAMERA/MIC RECORDING REQUIRED',
                detail:
                  'Finalized 2-minute script emphasizing rights-first programmable entertainment, licensing revenue, and pilot customer acquisition prepared in "2-Min Founder Pitch" tab.',
                isComplete: false,
              },
              {
                num: '06',
                title: 'One-Minute Functional Product Demo Video',
                status: 'INCOMPLETE — MANUAL SCREEN CAPTURE WITH VOICEOVER REQUIRED',
                detail:
                  'Finalized 60-second walkthrough script with exact required timecodes (00:00–00:08, 00:08–00:20, 00:20–00:35, 00:35–00:45, 00:45–00:53, 00:53–01:00) prepared in "60s Demo Walkthrough" tab.',
                isComplete: false,
              },
              {
                num: '07',
                title: 'Public YouTube Demo Link',
                status: 'INCOMPLETE — EXTERNAL YOUTUBE ACCOUNT UPLOAD REQUIRED',
                detail:
                  'Finalized YouTube metadata and upload checklist prepared in "YouTube Upload Guide" tab.',
                isComplete: false,
              },
            ].map((item) => (
              <div
                key={item.num}
                className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.isComplete
                    ? 'border-[#29DCEF]/40 bg-[#13182B]/70'
                    : 'border-[#FF617C]/50 bg-[#13182B]/90'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#755CFF] font-bold">
                      {item.num}
                    </span>
                    <span className="font-display font-semibold text-[#F4F1E8]">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-[#9BA3B8] font-mono break-all">
                    {item.detail}
                  </div>
                </div>
                <div
                  className={`font-mono font-semibold shrink-0 flex items-center gap-1.5 ${
                    item.isComplete ? 'text-[#29DCEF]' : 'text-[#FF617C]'
                  }`}
                >
                  {item.isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 1: Plain-Text Product & Technology One-Pager */}
        {activeDocTab === 'product' && (
          <div className="p-5 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-4 text-xs leading-relaxed">
            <div className="flex items-center justify-between gap-2 text-[#29DCEF] font-mono">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>PLAIN-TEXT PRODUCT &amp; TECHNOLOGY ONE-PAGER (COPY-READY)</span>
              </div>
              <span>STATUS: COMPLETE</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-[#F4F1E8] bg-[#070912] p-4 rounded-lg border border-[#F4F1E8]/10 leading-relaxed">
{`BRANCHFRAME — GEMINI-NATIVE, RIGHTS-FIRST PROGRAMMABLE ENTERTAINMENT
Flagship Interactive Prototype: TITANIC 1912 ("One night. One decision. Different futures.")
Technical Reference Prototype: THE LAST SIGNAL ("The story doesn't have to end that way.")

1. THE OPPORTUNITY IN FILM CATALOGUES
Film studios and independent rightsholders own deep libraries of narrative IP whose streaming engagement plateaus after initial release. Viewers increasingly want interactive, choice-driven editions ("What if the characters made the other decision at the pivotal moment?"), but live-action reshoots are cost-prohibitive and unguided AI video tools break plot continuity and violate talent rights.

2. HOW GEMINI ENABLES NARRATIVE CAUSALITY
BranchFrame uses server-side Google Gemini 4 Hydrogen (gemini-4-hydrogen) via the @google/genai SDK as a Story DNA Compiler and Counterfactual Branch Planner. Using strict JSON responseSchema validation, Gemini analyzes an original screenplay and extracts characters, immutable canonical facts, causal event dependencies, character knowledge timelines, and candidate branch points. When a creator plans an alternate branch, Gemini computes the downstream causal consequences and event modifications required so the narrative remains internally consistent.

3. ACCURATE PROTOTYPE ARCHITECTURE & MEDIA MODALITIES
BranchFrame demonstrates this pipeline through two controlled interactive prototypes (each scoped to one consequential decision and two distinct outcomes—not feature-length films):
- TITANIC 1912 (Flagship Prototype): Set during the historical April 14–15, 1912 disaster, featuring 100% original fictional characters (Clara Voss, hydrographic cartographer/relief telegraphist, and Julian Mercer, assistant marine engineer) and zero copyrighted 1997 film elements or actor likenesses. While the historical sinking at 02:20 AM remains an immutable canonical fact, the viewer's 00:55 allocation of the last reserve accumulator battery branches into Outcome A (The Carpathia Beacon Protocol) or Outcome B (The Scotland Road Bulkhead Rescue).
- THE LAST SIGNAL (Technical Reference Prototype): An original Arctic orbital relay thriller branching between Outcome A (Open Horizon Broadcast) and Outcome B (Faraday Blackout Protocol).
- Visual Modality Split: Opening and decision scenes (SCN-01, SCN-02) render 16:9 storyboard keyframe plates (gemini-3.1-flash-lite-image). Terminal branch outcomes (SCN-03A, SCN-03B) play persisted 16:9 720p MP4 motion-video sequences generated via Gemini Omni 1.2 Flash (gemini-omni-1.2-flash on the v1beta Interactions API).

4. HOW BRANCHFRAME DIFFERS FROM ORDINARY AI VIDEO GENERATORS
Ordinary prompt-to-video generators operate without a causal world-state model or rights enforcement. BranchFrame decouples story compilation from visual synthesis and interposes two deterministic TypeScript application gates before any footage can be generated or published:
- Deterministic Canon & Graph Validator: Verifies zero unreachable scenes, zero mutually exclusive fact contradictions, valid character knowledge timelines, valid causal dependencies, and zero dead ends.
- Mandatory Human Review Gate: All generated media enters PENDING_HUMAN_REVIEW and requires explicit human editorial approval before publication.

5. HOW RIGHTS-AS-CODE PROTECTS IP AND TALENT
BranchFrame's deterministic Rights-as-Code Engine defaults strictly to DENY. Every operation evaluates five granular permission scopes—ownership, adaptation, likeness, voice, and derivative_work—producing cryptographic audit hashes (bf-audit-*). Revoking or expiring any required scope immediately blocks compilation, branch planning, video generation, and playback. Existing third-party movies are never converted without explicit rightsholder licensing.

6. MONETIZATION & SCALING FROM ORIGINAL PROTOTYPES TO LICENSED CATALOGUES
BranchFrame is built for B2B2C commercialization with studios and independent rightsholders:
- Pilot Customer Route: Onboard independent sci-fi/thriller rightsholders and studio catalogue divisions to produce authorized "Interactive Director's Cut" editions of single pivotal scenes.
- Monetization Tiers: FREE_DEMO (promotional interactive trailers), PAID_PASS (viewer micro-transactions to unlock verified alternate endings), and STUDIO_LICENSE (enterprise SaaS + per-branch royalty attribution tied to Rights-as-Code audit hashes).`}
            </pre>
          </div>
        )}

        {/* Tab 2: Plain-Text Team One-Pager */}
        {activeDocTab === 'team' && (
          <div className="p-5 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-4 text-xs leading-relaxed">
            <div className="flex items-center justify-between gap-2 text-[#29DCEF] font-mono">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>PLAIN-TEXT TEAM ONE-PAGER (ACTUAL PARTICIPANT &amp; CREDENTIALS)</span>
              </div>
              <span>STATUS: COMPLETE</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-[#F4F1E8] bg-[#070912] p-4 rounded-lg border border-[#F4F1E8]/10 leading-relaxed">
{`BRANCHFRAME — TEAM ONE-PAGER
Event: Berkeley x Google DeepMind Hackathon (November 14, 2026)

PARTICIPANT & BUILDER
- Name: Rami Abdelrahim
- Contact: rami.m.abdelrahim@gmail.com
- Role: Solo Founder, Product Architect & Full-Stack Engineer (BranchFrame)

GENUINE ENGINEERING & CREDENTIALS DELIVERED IN THIS PROJECT
1. Server-Side Gemini Intelligence & Multimodal Video Pipeline
   - Integrated the @google/genai TypeScript SDK on a Node.js/Express backend.
   - Built the Story DNA Compiler and Counterfactual Branch Planner using gemini-4-hydrogen with strict JSON responseSchema validation and independent runtime schema verification.
   - Resolved v1 vs. v1beta Interactions API routing to synthesize and persist four continuity-locked 16:9 720p MP4 outcome videos using gemini-omni-1.2-flash from approved 16:9 reference keyframes (gemini-3.1-flash-lite-image).

2. Deterministic Rights-as-Code & Formal Graph Verification
   - Engineered the default-DENY Rights-as-Code evaluator enforcing ownership, adaptation, likeness, voice, and derivative_work grants with deterministic SHA-256 audit hashes.
   - Implemented the five-check Canon & Graph Validator testing reachability, mutually exclusive fact collisions, character knowledge timelines, causal event dependencies, and non-terminal dead ends (verified by automated node:test unit tests).

3. Public Demo Hardening & Session-Isolated Judge Sandbox
   - Locked all global administrative and billable AI endpoints behind server-side authorization checks (returning HTTP 403 to public visitors).
   - Built an isolated per-session Judge Demonstration Sandbox (/api/v1/sandbox/* keyed by X-Judge-Sandbox-Session) allowing independent judges to concurrently test permission revocations and fault injection without cross-session interference.

4. Original Interactive Prototypes
   - Authored and produced two original interactive prototypes: TITANIC 1912 (historical-fiction drama with original characters Clara Voss and Julian Mercer) and THE LAST SIGNAL (Arctic sci-fi thriller).`}
            </pre>
          </div>
        )}

        {/* Tab 3: Exact 60-Second Screen-Recording Walkthrough (P3) */}
        {activeDocTab === 'demo_script' && (
          <div className="p-5 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-4 text-xs leading-relaxed">
            <div className="flex items-center justify-between gap-2 text-[#FF617C] font-mono">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                <span>PRECISE 60-SECOND SCREEN-RECORDING WALKTHROUGH (P3)</span>
              </div>
              <span>STATUS: INCOMPLETE (MANUAL RECORDING REQUIRED)</span>
            </div>
            <div className="p-3.5 rounded bg-[#070912] border border-[#FF617C]/40 text-[#9BA3B8]">
              <strong className="text-[#F4F1E8]">Recording Instructions:</strong> Record a 60-second 1080p screen capture of <code className="text-[#29DCEF]">{publicDemoUrl}</code> following the exact 6 timecode beats below.
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-[#F4F1E8] bg-[#070912] p-4 rounded-lg border border-[#F4F1E8]/10 leading-relaxed">
{`00:00–00:08 — BRANCHFRAME BRAND & TITANIC 1912
- Visual: Land on the BranchFrame Play view showing the BRANCHFRAME header, the flagship prototype banner "TITANIC 1912 — One night. One decision. Different futures.", and Scene 01 ("The Starlight Shear at 23:40" storyboard keyframe plate).
- Voiceover: "This is BranchFrame—a Gemini-native, rights-first platform for programmable interactive cinema, demonstrated with our original historical-fiction prototype, Titanic 1912."

00:08–00:20 — ORIGINAL STORY, DILEMMA & VIEWER CHOICE
- Visual: Click "Jump to Decision Hub" (SCN-02: The 00:55 Boat Deck & Bulkhead Dilemma). Point to the Consequential Decision Overlay showing Route 01 ("Power the Marconi Distress Beacon") and Route 02 ("Pry Open the E-Deck Bulkhead").
- Voiceover: "At 00:55 AM, our original protagonists—cartographer Clara Voss and engineer Julian Mercer—have one reserve battery and hydraulic jack. The viewer must choose: power the Marconi wireless to transmit corrected drift coordinates, or descend to E-Deck to free twenty-four trapped adults."

00:20–00:35 — PLAY OUTCOME A GENERATED MP4
- Visual: Click Route 01 (or "Outcome A (MP4)"). Show the <video> player playing titanic_outcome_a.mp4 with the badge "GENERATED MOTION VIDEO (OMNI 1.2 FLASH MP4)" and the right-hand Deterministic World-State Ledger updating with fact:carpathia-coordinates-locked while preserving fact:rms-titanic-founders-1912.
- Voiceover: "Selecting Route 1 plays our first 16:9 motion-video outcome generated by Gemini Omni 1.2 Flash. Clara locks the Carpathia rescue beacon while the deterministic ledger preserves the historical fact of the ship's sinking."

00:35–00:45 — REPLAY & SHOW OUTCOME B GENERATED MP4
- Visual: Click "Outcome B (MP4)" (or "Explore Outcome B: The Scotland Road Bulkhead Rescue"). Show titanic_outcome_b.mp4 playing in the cinema viewport as Julian and Clara jack open the flooded E-Deck bulkhead door.
- Voiceover: "Replaying the decision for Route 2 switches to our second Gemini Omni 1.2 Flash MP4 outcome down in flooded Scotland Road, updating the causal world state to reflect the bulkhead rescue."

00:45–00:53 — SHOW GEMINI STORY DNA / BRANCH REASONING
- Visual: Click "Open Studio" to reveal "01. Story DNA" (compiled by gemini-4-hydrogen) and click "Branch Map" to show the causal DAG and downstream event modifications.
- Voiceover: "In BranchFrame Studio, Gemini 4 Hydrogen compiles the screenplay into structured Story DNA—extracting character motivations, canonical facts, and counterfactual branch consequences."

00:53–01:00 — SHOW RIGHTS ENFORCEMENT & CLOSE ON COMMERCIAL PROPOSITION
- Visual: Click "Rights & Canon". Click "ALLOW (Click to Revoke)" on Clara Voss's likeness grant in the Isolated Judge Sandbox to trigger the immediate DENY hold.
- Voiceover: "Every branch and frame is governed by deterministic Rights-as-Code and human approval—giving film studios and rightsholders a safe, licensable path to monetize interactive catalogue editions."`}
            </pre>
          </div>
        )}

        {/* Tab 4: Two-Minute Founder Pitch Video Script (P3) */}
        {activeDocTab === 'pitch' && (
          <div className="p-5 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-4 text-xs leading-relaxed">
            <div className="flex items-center justify-between gap-2 text-[#FF617C] font-mono">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <span>TWO-MINUTE FOUNDER PITCH — RIGHTS-FIRST COMMERCIALIZATION (P3)</span>
              </div>
              <span>STATUS: INCOMPLETE (MANUAL RECORDING REQUIRED)</span>
            </div>
            <div className="p-3.5 rounded bg-[#070912] border border-[#FF617C]/40 text-[#9BA3B8]">
              <strong className="text-[#F4F1E8]">Recording Instructions:</strong> Record a 120-second founder pitch video (camera + screen cutaways) emphasizing rights-first programmable entertainment, licensing revenue, and the route to rights-holder pilot customers.
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-[#F4F1E8] bg-[#070912] p-4 rounded-lg border border-[#F4F1E8]/10 leading-relaxed">
{`[0:00 – 0:25] THE PROBLEM & COMMERCIAL OPPORTUNITY
"Hi, I'm Rami Abdelrahim, creator of BranchFrame. Every great thriller or historical drama has a pivotal scene where the audience thinks: What if they made the other choice? Film studios and independent rightsholders sit on thousands of catalogue titles whose streaming revenue plateaus after release. Interactive editions could unlock a massive new licensing and replay tier—but live-action reshoots cost millions, and studios refuse to touch ordinary AI video generators because they hallucinate plot contradictions and violate actor likeness rights."

[0:25 – 0:55] GEMINI CAUSALITY + DETERMINISTIC RIGHTS-AS-CODE
"BranchFrame solves this by building rights-first programmable entertainment infrastructure on Google Gemini. First, we use Gemini 4 Hydrogen on the server as a Story DNA Compiler and Branch Planner. In our flagship historical-fiction prototype TITANIC 1912—built with 100% original characters Clara Voss and Julian Mercer—Gemini compiles character knowledge, causal dependencies, and immutable historical facts so alternate branches never violate story canon. Second, before any branch or video frame is generated, our deterministic Rights-as-Code engine evaluates ownership, adaptation, likeness, voice, and derivative-work permissions—defaulting strictly to DENY. When permissions and our five-check Canon Validator pass, Gemini Omni 1.2 Flash synthesizes 16:9 MP4 motion-video outcomes from approved storyboard keyframes, held for mandatory human editorial sign-off."

[0:55 – 1:30] LICENSING REVENUE MODEL
"We do not convert third-party films without licenses. Instead, BranchFrame sells B2B2C infrastructure to rightsholders with three revenue streams:
1. Studio & Rightsholder Pilot Licenses: Fixed per-title onboarding to compile a licensed screenplay into a verified interactive edition.
2. Viewer Interactive Passes (PAID_PASS): Micro-transactions where streaming audiences pay to unlock director-approved counterfactual branches and alternate endings.
3. Automated Royalty Attribution: Every published branch carries a cryptographic Rights-as-Code audit hash (bf-audit-*) that tracks exactly which writer, director, and performer digital-replica releases participated in that branch."

[1:30 – 2:00] ROUTE TO RIGHTS-HOLDER PILOT CUSTOMERS
"Our go-to-market starts with independent genre filmmakers and boutique thriller/sci-fi distributors who own 100% of their underlying screenplay and talent releases—converting a single high-stakes decision point per title into an interactive special edition in days rather than months, before expanding to major studio library divisions. With BranchFrame, the story doesn't have to end that way—and creators stay in complete control of their canon and their rights."`}
            </pre>
          </div>
        )}

        {/* Tab 5: Public YouTube Demo Link Package */}
        {activeDocTab === 'youtube' && (
          <div className="p-5 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-4 text-xs leading-relaxed">
            <div className="flex items-center justify-between gap-2 text-[#FF617C] font-mono">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4" />
                <span>PUBLIC YOUTUBE UPLOAD PACKAGE &amp; METADATA</span>
              </div>
              <span>STATUS: INCOMPLETE (EXTERNAL UPLOAD REQUIRED)</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-[#F4F1E8] bg-[#070912] p-4 rounded-lg border border-[#F4F1E8]/10 leading-relaxed">
{`YOUTUBE UPLOAD CHECKLIST (EXTERNAL ACTION REQUIRED)
1. Record the 60-Second Functional Product Demo Walkthrough (and 2-Minute Founder Pitch) as 1080p MP4.
2. Upload to YouTube with Visibility set to PUBLIC (or UNLISTED with public judge access).
3. Paste the metadata below into the YouTube upload form:

Suggested Title:
BranchFrame: Titanic 1912 — Gemini-Native Rights-First Interactive Cinema Prototype (Berkeley x Google DeepMind Hackathon)

Suggested Description:
BranchFrame is a Gemini-native, rights-first programmable entertainment prototype built by Rami Abdelrahim for the Berkeley x Google DeepMind Hackathon (November 14, 2026).
- Uses live server-side Gemini 4 Hydrogen (gemini-4-hydrogen) for Story DNA compilation and counterfactual branch planning.
- Uses Gemini Omni 1.2 Flash (gemini-omni-1.2-flash via v1beta Interactions API) for 16:9 720p MP4 branch outcome video generation from approved 16:9 storyboard keyframes.
- Enforces deterministic Rights-as-Code (default DENY across ownership, adaptation, likeness, voice, derivative_work), deterministic Canon/Graph validation, and mandatory human publication approval.
- Public Deployed Demo URL: ${publicDemoUrl}`}
            </pre>
          </div>
        )}

        {/* Public Deployment & Share Links Footer */}
        <div className="pt-4 border-t border-[#F4F1E8]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#9BA3B8]">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Public Deployed Demo URL:{' '}
              <a
                href={publicDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[#29DCEF] hover:underline inline-flex items-center gap-1"
              >
                <span>{publicDemoUrl}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[#755CFF]">
              <GitCommit className="w-3.5 h-3.5" />
              <span>Release Tag: v1.0.0-hackathon-freeze</span>
            </span>
          </div>
          <div className="font-mono text-[#29DCEF]">
            Public Canonical State: LOCKED · Per-Session Judge Sandbox: ISOLATED
          </div>
        </div>
      </section>
    </div>
  );
};
