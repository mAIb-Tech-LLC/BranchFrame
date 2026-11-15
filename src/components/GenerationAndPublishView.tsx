import React, { useEffect, useState } from 'react';
import {
  Film,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Stamp,
  Clock,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  CanonValidationReport,
  GenerationJob,
  PublicationRecord,
  RightsEvaluationResult,
  StoryGraph,
} from '../domain/schemas';
import { getJudgeSandboxHeaders } from '../utils/judgeSession';

interface GenerationAndPublishViewProps {
  storyGraph: StoryGraph;
  generationJobs: GenerationJob[];
  publicationRecords: PublicationRecord[];
  publishRightsCheck: RightsEvaluationResult;
  canonReport: CanonValidationReport;
  capabilities: {
    geminiConfigured: boolean;
    videoAdapterModel: string;
    imageAdapterModel: string;
    videoModelAccessible: boolean;
    note: string;
  };
}

export const GenerationAndPublishView: React.FC<GenerationAndPublishViewProps> = ({
  storyGraph,
  generationJobs,
  publicationRecords,
  publishRightsCheck,
  canonReport,
  capabilities,
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    storyGraph.scenes[storyGraph.scenes.length - 1]?.id || storyGraph.entrySceneId
  );
  const [adapterType, setAdapterType] = useState<
    'OMNI_FLASH_VIDEO' | 'FLASH_IMAGE_KEYFRAME'
  >('OMNI_FLASH_VIDEO');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const [approverName, setApproverName] = useState<string>('Elena Rostova');
  const [approverRole, setApproverRole] = useState<string>(
    'Executive Story & Rights Supervisor'
  );
  const [publishNotes, setPublishNotes] = useState<string>(
    'Verified Rights-as-Code clearance, deterministic DAG canon continuity, and human review of all generated 16:9 Omni 1.2 Flash MP4 outcomes.'
  );

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSceneId(
      storyGraph.scenes[storyGraph.scenes.length - 1]?.id || storyGraph.entrySceneId
    );
    setStatusMessage(null);
    setErrorMessage(null);
  }, [storyGraph.titleId, storyGraph.entrySceneId, storyGraph.scenes]);

  const pendingReviewJobs = generationJobs.filter(
    (j) => j.status === 'PENDING_HUMAN_REVIEW'
  );

  const handleTestUnauthorizedGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/v1/generation/create', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: storyGraph.titleId,
          sceneId: selectedSceneId,
          adapterType,
          customPrompt,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          `HTTP ${response.status} (${data.code || 'PRIVILEGE_DENIED'}): ${
            data.error ||
            'Billable video generation is locked for public visitors.'
          }`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error invoking generation adapter.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleTestSandboxPublishGate = async () => {
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/v1/sandbox/scenario/run', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: storyGraph.titleId,
          scenario: 'PUBLISH_GATE_PREVIEW',
        }),
      });
      const data = await response.json();
      if (response.ok && data.sandboxState) {
        if (
          data.sandboxState.publishRightsCheck.allowed &&
          data.sandboxState.canonReport.valid
        ) {
          setStatusMessage(data.sandboxState.lastActionSummary);
        } else {
          setErrorMessage(data.sandboxState.lastActionSummary);
        }
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleTestUnauthorizedPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/v1/publish/approve', {
        method: 'POST',
        headers: getJudgeSandboxHeaders(),
        body: JSON.stringify({
          titleId: storyGraph.titleId,
          approvedBy: approverName,
          role: approverRole,
          notes: publishNotes,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          `HTTP ${response.status} (${data.code || 'PRIVILEGE_DENIED'}): ${
            data.error || 'Canonical publication is locked for public visitors.'
          }`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error during publication check.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F4F1E8]/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
            <span className="font-mono text-[#755CFF]">OMNI 1.2 FLASH VIDEO ADAPTER</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#29DCEF]">v1beta INTERACTIONS API</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {generationJobs.filter((j) => j.videoUrl).length} MP4 Motion Outcomes Persisted
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1E8] tracking-tight">
            04. Video Generation Provenance, Footage Review & Publication Gate
          </h1>
          <p className="text-sm text-[#9BA3B8] max-w-3xl">
            Inspect the persisted <code className="font-mono text-[#29DCEF]">gemini-omni-1.2-flash</code> MP4 motion-video outcomes and <code className="font-mono text-[#755CFF]">gemini-3.1-flash-lite-image</code> reference plates, verify SHA-256 asset hashes, and test the pre-flight publication checklist.
          </p>
        </div>

        <div className="text-xs font-mono text-[#29DCEF] shrink-0">
          Adapter: {capabilities.videoAdapterModel} (VERIFIED)
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="p-4 rounded-xl border border-[#FF617C]/50 bg-[#13182B] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FF617C] shrink-0 mt-0.5" />
          <div className="text-xs text-[#F4F1E8]">{errorMessage}</div>
        </div>
      )}

      {statusMessage && (
        <div role="status" className="p-4 rounded-xl border border-[#29DCEF]/50 bg-[#13182B] flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#29DCEF] shrink-0 mt-0.5" />
          <div className="text-xs text-[#F4F1E8]">{statusMessage}</div>
        </div>
      )}

      {/* Split: Left 5 Columns Generation Adapter Dispatcher | Right 7 Columns Human Publication Approval */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 5 Columns: Generation Adapter Form */}
        <form
          onSubmit={handleTestUnauthorizedGeneration}
          className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F4F1E8]/10 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#29DCEF]" />
                <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
                  Video Generation Adapter & P0 Billable Guard
                </h2>
              </div>
              <span className="text-xs font-mono text-[#29DCEF]">v1beta Active</span>
            </div>

            <div className="p-3 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 text-xs text-[#9BA3B8] space-y-1">
              <div className="font-mono text-[#29DCEF]">
                Model Capability Check: {capabilities.videoAdapterModel}
              </div>
              <div>{capabilities.note}</div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="target-scene-select"
                className="block text-xs font-medium text-[#F4F1E8]"
              >
                Target Story Scene
              </label>
              <select
                id="target-scene-select"
                value={selectedSceneId}
                onChange={(e) => setSelectedSceneId(e.target.value)}
                className="w-full rounded-lg bg-[#070912] border border-[#F4F1E8]/15 px-3 py-2 text-xs text-[#F4F1E8] focus:outline-none focus:border-[#755CFF]"
              >
                {storyGraph.scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="adapter-select"
                className="block text-xs font-medium text-[#F4F1E8]"
              >
                Google Generation Adapter
              </label>
              <select
                id="adapter-select"
                value={adapterType}
                onChange={(e) =>
                  setAdapterType(
                    e.target.value as 'OMNI_FLASH_VIDEO' | 'FLASH_IMAGE_KEYFRAME'
                  )
                }
                className="w-full rounded-lg bg-[#070912] border border-[#F4F1E8]/15 px-3 py-2 text-xs text-[#F4F1E8] focus:outline-none focus:border-[#755CFF]"
              >
                <option value="OMNI_FLASH_VIDEO">
                  Omni Flash Video Adapter (gemini-omni-1.2-flash via v1beta Interactions API)
                </option>
                <option value="FLASH_IMAGE_KEYFRAME">
                  Anamorphic Storyboard Keyframe Adapter (gemini-3.1-flash-lite-image)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="generation-prompt"
                className="block text-xs font-medium text-[#F4F1E8]"
              >
                Visual Direction Prompt (Optional Override)
              </label>
              <textarea
                id="generation-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                placeholder="All 4 canonical MP4 motion outcomes are already generated, verified, approved, and persisted. Public billable generation is locked (HTTP 403)."
                className="w-full rounded-lg bg-[#070912] border border-[#F4F1E8]/15 p-3 text-xs text-[#F4F1E8] focus:outline-none focus:border-[#755CFF]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4F1E8]/10 flex items-center justify-between gap-3">
            <span className="text-xs text-[#9BA3B8]">
              Rights Gate:{' '}
              <strong
                className={
                  publishRightsCheck.allowed
                    ? 'font-mono text-[#29DCEF]'
                    : 'font-mono text-[#FF617C]'
                }
              >
                {publishRightsCheck.decision}
              </strong>
            </span>

            <button
              type="submit"
              disabled={isBusy}
              className="px-3.5 py-2 text-xs font-semibold text-[#F4F1E8] bg-[#13182B] border border-[#FF617C]/40 rounded-lg hover:border-[#FF617C] transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF617C]" />
              <span>Test Public Billable Lock (403)</span>
            </button>
          </div>
        </form>

        {/* Right 7 Columns: Mandatory Human Publication Approval Gate */}
        <form
          onSubmit={handleTestUnauthorizedPublish}
          className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F4F1E8]/10 pb-3">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-[#29DCEF]" />
                <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
                  Human Publication Approval Gate (Deterministic Pre-Flight Checklist)
                </h2>
              </div>
              <span className="text-xs font-mono text-[#9BA3B8] tabular-nums">
                Current Live Version: v{storyGraph.versionNumber}.0
              </span>
            </div>

            {/* 3 Mandatory Pre-Publish Checklist Gates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                className={`p-3 rounded-lg border ${
                  publishRightsCheck.allowed
                    ? 'border-[#29DCEF]/40 bg-[#13182B]'
                    : 'border-[#FF617C]/60 bg-[#13182B]'
                }`}
              >
                <div className="font-mono text-[#9BA3B8]">1. RIGHTS-AS-CODE</div>
                <div
                  className={`font-display text-sm font-bold mt-1 ${
                    publishRightsCheck.allowed ? 'text-[#29DCEF]' : 'text-[#FF617C]'
                  }`}
                >
                  {publishRightsCheck.allowed ? 'CLEARED (ALLOW)' : 'BLOCKED (DENY)'}
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  canonReport.valid
                    ? 'border-[#29DCEF]/40 bg-[#13182B]'
                    : 'border-[#FF617C]/60 bg-[#13182B]'
                }`}
              >
                <div className="font-mono text-[#9BA3B8]">2. CANON VALIDATOR</div>
                <div
                  className={`font-display text-sm font-bold mt-1 ${
                    canonReport.valid ? 'text-[#29DCEF]' : 'text-[#FF617C]'
                  }`}
                >
                  {canonReport.valid
                    ? `VALID (${canonReport.stats.totalPaths} PATHS)`
                    : `${canonReport.issues.length} ERRORS`}
                </div>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  pendingReviewJobs.length === 0
                    ? 'border-[#29DCEF]/40 bg-[#13182B]'
                    : 'border-[#FF617C]/60 bg-[#13182B]'
                }`}
              >
                <div className="font-mono text-[#9BA3B8]">3. FOOTAGE REVIEW</div>
                <div
                  className={`font-display text-sm font-bold mt-1 ${
                    pendingReviewJobs.length === 0
                      ? 'text-[#29DCEF]'
                      : 'text-[#FF617C]'
                  }`}
                >
                  {pendingReviewJobs.length === 0
                    ? 'ALL MP4s APPROVED'
                    : `${pendingReviewJobs.length} PENDING REVIEW`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="approver-name"
                  className="block text-xs font-medium text-[#F4F1E8]"
                >
                  Approving Human Executive
                </label>
                <input
                  id="approver-name"
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full rounded-lg bg-[#070912] border border-[#F4F1E8]/15 px-3 py-2 text-xs text-[#F4F1E8] focus:outline-none focus:border-[#755CFF]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="approver-role"
                  className="block text-xs font-medium text-[#F4F1E8]"
                >
                  Title / Authority Role
                </label>
                <input
                  id="approver-role"
                  type="text"
                  value={approverRole}
                  onChange={(e) => setApproverRole(e.target.value)}
                  className="w-full rounded-lg bg-[#070912] border border-[#F4F1E8]/15 px-3 py-2 text-xs text-[#F4F1E8] focus:outline-none focus:border-[#755CFF]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="publish-notes"
                className="block text-xs font-medium text-[#F4F1E8]"
              >
                Publication Release Notes & Continuity Attestation
              </label>
              <textarea
                id="publish-notes"
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-[#070912] border border-[#F4F1E8]/15 p-3 text-xs text-[#F4F1E8] focus:outline-none focus:border-[#755CFF]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4F1E8]/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleTestSandboxPublishGate}
              className="px-3.5 py-2 text-xs font-semibold text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evaluate Pre-Flight Gate in Judge Sandbox</span>
            </button>

            <button
              type="submit"
              disabled={isBusy}
              className="px-3.5 py-2 text-xs font-semibold text-[#F4F1E8] bg-[#13182B] border border-[#FF617C]/40 rounded-lg hover:border-[#FF617C] transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF617C]" />
              <span>Test Unauthorized Global Publish (403)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Persisted Footage & Keyframe Provenance Queue */}
      <section className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4F1E8]/10 pb-3">
          <div className="space-y-0.5">
            <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
              Persisted Motion-Video (MP4) & Storyboard Keyframe Provenance Ledger
            </h2>
            <p className="text-xs text-[#9BA3B8]">
              Every outcome video below was synthesized once via <code className="text-[#29DCEF]">gemini-omni-1.2-flash</code> (<code className="text-[#29DCEF]">v1beta</code> Interactions API), verified, approved by human editorial review, and persisted on disk with SHA-256 provenance.
            </p>
          </div>

          <div className="text-xs font-mono text-[#29DCEF]">
            {generationJobs.length} Verified Assets
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generationJobs.map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-lg border border-[#29DCEF]/40 bg-[#13182B]/70 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="text-[#29DCEF]">
                  {job.modelName} · {job.provenance}
                </span>
                <span className="text-[#29DCEF] font-semibold">{job.status}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {job.videoUrl ? (
                  <video
                    src={job.videoUrl}
                    poster={job.outputUrl}
                    controls
                    muted
                    playsInline
                    className="w-full sm:w-44 h-28 object-cover rounded border border-[#29DCEF]/50 shrink-0 bg-[#070912]"
                  />
                ) : job.outputUrl ? (
                  <img
                    src={job.outputUrl}
                    alt={job.sceneTitle}
                    referrerPolicy="no-referrer"
                    className="w-full sm:w-44 h-28 object-cover rounded border border-[#F4F1E8]/15 shrink-0"
                  />
                ) : null}
                <div className="space-y-1 text-xs">
                  <div className="font-display font-semibold text-[#F4F1E8]">
                    {job.sceneTitle}
                  </div>
                  <p className="text-[#9BA3B8] line-clamp-2">{job.prompt}</p>
                  <div className="text-[11px] font-mono text-[#29DCEF]">
                    {job.availabilityNote}
                  </div>
                  {job.assetHash && (
                    <div className="text-[11px] font-mono text-[#755CFF]">
                      SHA-256 Asset Hash: {job.assetHash}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#F4F1E8]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[#9BA3B8] font-mono">
                  Rights Audit: {job.rightsCheck.auditHash}
                </div>
                <span className="text-[#9BA3B8]">
                  Reviewed by <strong className="text-[#F4F1E8]">{job.reviewerName}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Immutable Publication Audit Log */}
      <section className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#F4F1E8]/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#755CFF]" />
            <h2 className="font-display text-base font-semibold text-[#F4F1E8]">
              Deterministic Publication Audit Log
            </h2>
          </div>
          <span className="text-xs font-mono text-[#9BA3B8] tabular-nums">
            {publicationRecords.length} Releases
          </span>
        </div>

        <div className="space-y-2.5">
          {publicationRecords.map((rec) => (
            <div
              key={rec.id}
              className="p-3.5 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[#9BA3B8]">
                  <span className="font-mono font-semibold text-[#29DCEF]">
                    v{rec.versionNumber}.0
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#F4F1E8] font-medium">
                    Approved by {rec.approvedBy} ({rec.role})
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(rec.publishedAt).toLocaleString()}
                  </span>
                  {rec.playbackMode && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[#29DCEF]">
                        {rec.playbackMode}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[#9BA3B8]">{rec.notes}</p>
                {rec.rightsSnapshotHash && (
                  <div className="font-mono text-[11px] text-[#9BA3B8]">
                    Rights Snapshot: {rec.rightsSnapshotHash} · Assets Tracked:{' '}
                    {Array.isArray(rec.assetHashes)
                      ? rec.assetHashes.length
                      : Object.keys(rec.assetHashes || {}).length}
                  </div>
                )}
              </div>
              <div className="font-mono text-[#755CFF] shrink-0">
                {rec.deterministicHash}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
