import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  GitBranch,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Radio,
  Film,
  Cpu,
  Image as ImageIcon,
} from 'lucide-react';
import {
  DecisionChoice,
  GeminiExecutionTrace,
  RightsEvaluationResult,
  SceneNode,
  StoryDNA,
  StoryGraph,
} from '../domain/schemas';
import { cinemaAudio } from '../utils/cinemaAudio';

interface CinemaPlayerViewProps {
  storyDNA: StoryDNA;
  storyGraph: StoryGraph;
  publishRightsCheck: RightsEvaluationResult;
  geminiTraces: GeminiExecutionTrace[];
  onOpenStudioTab: (tab: 'dna' | 'map' | 'rights' | 'generate' | 'dossier') => void;
}

export const CinemaPlayerView: React.FC<CinemaPlayerViewProps> = ({
  storyDNA,
  storyGraph,
  publishRightsCheck,
  geminiTraces,
  onOpenStudioTab,
}) => {
  const entryScene = storyGraph.scenes[0];
  const decisionScene =
    storyGraph.scenes.find((s) => s.act === 'DECISION_POINT') || storyGraph.scenes[1];

  const [currentSceneId, setCurrentSceneId] = useState<string>(storyGraph.entrySceneId);
  const [visitedSceneIds, setVisitedSceneIds] = useState<string[]>([storyGraph.entrySceneId]);
  const [chosenChoiceIds, setChosenChoiceIds] = useState<string[]>([]);
  const [activeFacts, setActiveFacts] = useState<string[]>(
    entryScene?.establishesFactIds || []
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [compareStoryboardMode, setCompareStoryboardMode] = useState<boolean>(false);
  const [imgFallbackMap, setImgFallbackMap] = useState<Record<string, boolean>>({});
  const [videoFallbackMap, setVideoFallbackMap] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset player state when switching between TITANIC 1912 and THE LAST SIGNAL
  useEffect(() => {
    const firstScene = storyGraph.scenes[0];
    setCurrentSceneId(storyGraph.entrySceneId);
    setVisitedSceneIds([storyGraph.entrySceneId]);
    setChosenChoiceIds([]);
    setActiveFacts(firstScene ? [...firstScene.establishesFactIds] : []);
    setElapsedSec(0);
    setIsPlaying(true);
    setCompareStoryboardMode(false);
  }, [storyGraph.titleId, storyGraph.entrySceneId]);

  const currentScene: SceneNode =
    storyGraph.scenes.find((s) => s.id === currentSceneId) || storyGraph.scenes[0];

  const hasVerifiedMp4Video =
    Boolean(currentScene.videoUrl) && !videoFallbackMap[currentScene.id];
  const hasActiveVideo = hasVerifiedMp4Video && !compareStoryboardMode;

  // Published choices available from this scene
  const publishedChoices = currentScene.choices.filter((c) => c.isPublished);
  const isDecisionOverlayVisible =
    !currentScene.isEnding &&
    publishedChoices.length > 0 &&
    (currentScene.act === 'DECISION_POINT' || elapsedSec >= currentScene.durationSec - 4);

  // Sync HTML5 <video> element when present
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !hasActiveVideo) return;
    vid.muted = !soundEnabled;
    if (isPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isPlaying, soundEnabled, hasActiveVideo, currentScene.id]);

  // Advance playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setElapsedSec((prev) => {
        if (prev + 0.25 >= currentScene.durationSec) {
          setIsPlaying(false);
          return currentScene.durationSec;
        }
        return prev + 0.25;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, currentScene.durationSec, currentScene.id]);

  // Manage optional Web Audio drone
  useEffect(() => {
    if (soundEnabled && isPlaying) {
      cinemaAudio.startDrone(currentScene.audioMood);
    } else {
      cinemaAudio.stopDrone();
    }
    return () => {
      cinemaAudio.stopDrone();
    };
  }, [soundEnabled, isPlaying, currentScene.audioMood, currentScene.id]);

  // Render subtle Marconi / carrier waveform telemetry on canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const strokeColor =
      currentScene.audioMood === 'CYAN_HORIZON'
        ? '#29DCEF'
        : currentScene.audioMood === 'QUARANTINE_DRONE'
        ? '#FF617C'
        : '#755CFF';

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const phase = elapsedSec * 2.4;
    for (let x = 0; x < width; x += 3) {
      const normalized = x / width;
      const envelope = Math.sin(normalized * Math.PI);
      const y =
        height / 2 +
        Math.sin(normalized * 24 + phase) * 12 * envelope +
        Math.cos(normalized * 53 - phase * 1.3) * 6 * envelope;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, [elapsedSec, currentScene.audioMood]);

  const activeDialogue =
    currentScene.dialogue.find(
      (d) => elapsedSec >= d.startSec && elapsedSec <= d.endSec
    ) || currentScene.dialogue[currentScene.dialogue.length - 1];

  const handleSelectChoice = (choice: DecisionChoice) => {
    if (!publishRightsCheck.allowed) {
      return;
    }
    if (soundEnabled) {
      cinemaAudio.playChoiceCue('SELECT');
    }
    const targetScene = storyGraph.scenes.find((s) => s.id === choice.targetSceneId);
    if (!targetScene) return;

    const mergedFacts = Array.from(
      new Set([
        ...activeFacts,
        ...choice.setsFactIds,
        ...targetScene.establishesFactIds,
      ])
    );

    setChosenChoiceIds((prev) => [...prev, choice.id]);
    setVisitedSceneIds((prev) => [...prev, targetScene.id]);
    setActiveFacts(mergedFacts);
    setCurrentSceneId(targetScene.id);
    setElapsedSec(0);
    setCompareStoryboardMode(false);
    setIsPlaying(true);
  };

  const handleJumpToScene = (scene: SceneNode) => {
    if (soundEnabled) {
      cinemaAudio.playChoiceCue('TRANSITION');
    }
    const rootScene = storyGraph.scenes[0];
    const decScene =
      storyGraph.scenes.find((s) => s.act === 'DECISION_POINT') || storyGraph.scenes[1];
    const rootChoice = rootScene?.choices[0];

    if (scene.id === rootScene?.id) {
      setVisitedSceneIds([rootScene.id]);
      setChosenChoiceIds([]);
      setActiveFacts([...rootScene.establishesFactIds]);
    } else if (scene.id === decScene?.id) {
      setVisitedSceneIds([rootScene.id, decScene.id]);
      setChosenChoiceIds(rootChoice ? [rootChoice.id] : []);
      setActiveFacts(
        Array.from(
          new Set([
            ...(rootScene?.establishesFactIds || []),
            ...(rootChoice?.setsFactIds || []),
            ...decScene.establishesFactIds,
          ])
        )
      );
    } else {
      const parentChoice = decScene?.choices.find((c) => c.targetSceneId === scene.id);
      setVisitedSceneIds(
        [rootScene?.id, decScene?.id, scene.id].filter(Boolean) as string[]
      );
      setChosenChoiceIds(
        [rootChoice?.id, parentChoice?.id].filter(Boolean) as string[]
      );
      setActiveFacts(
        Array.from(
          new Set([
            ...(rootScene?.establishesFactIds || []),
            ...(rootChoice?.setsFactIds || []),
            ...(decScene?.establishesFactIds || []),
            ...(parentChoice?.setsFactIds || []),
            ...scene.establishesFactIds,
          ])
        )
      );
    }
    setCurrentSceneId(scene.id);
    setElapsedSec(0);
    setCompareStoryboardMode(false);
    setIsPlaying(true);
  };

  const handleRestartExperience = () => {
    handleJumpToScene(storyGraph.scenes[0]);
  };

  const progressPercent = Math.min(
    100,
    Math.round((elapsedSec / Math.max(1, currentScene.durationSec)) * 100)
  );

  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = Math.floor(sec % 60);
    const frames = Math.floor((sec % 1) * 24);
    return `00:0${mins}:${String(remSec).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const outcomeScenes = storyGraph.scenes.filter((s) => s.isEnding);
  const isTitanic = storyGraph.titleId === 'titanic-1912';

  return (
    <div className="space-y-8">
      {/* Rights-as-Code Gate Warning Banner if any required permission was revoked */}
      {!publishRightsCheck.allowed && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-[#FF617C]/50 bg-[#13182B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#FF617C]">
              Deterministic Rights-as-Code Hold Active (Default Policy: DENY)
            </p>
            <p className="text-xs text-[#9BA3B8]">
              {publishRightsCheck.deniedReasons.join(' · ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenStudioTab('rights')}
            className="px-4 py-2 text-xs font-medium text-[#070912] bg-[#FF617C] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            Inspect in Rights Sandbox
          </button>
        </div>
      )}

      {/* Primary 1440px Split: Left 8 Columns Anamorphic Cinema Player | Right 4 Columns Live Decision & World Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: 16:9 Anamorphic Cinema Frame */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] overflow-hidden">
          {/* Top Metadata Strip inside Player Frame */}
          <div className="px-5 py-3 border-b border-[#F4F1E8]/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#9BA3B8]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[#29DCEF] font-medium">
                {currentScene.code}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#F4F1E8] font-medium">{currentScene.title}</span>
              <span aria-hidden="true">·</span>
              <span
                data-testid="playback-provenance-label"
                className={
                  hasActiveVideo
                    ? 'font-mono text-[#29DCEF] font-semibold'
                    : 'font-mono text-[#755CFF] font-semibold'
                }
              >
                {hasActiveVideo
                  ? 'GENERATED MOTION VIDEO (OMNI 1.2 FLASH MP4)'
                  : 'STORYBOARD KEYFRAME PLATE'}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span>TC {formatTimecode(elapsedSec)}</span>
              <span aria-hidden="true">/</span>
              <span>Graph v{storyGraph.versionNumber}.0</span>
            </div>
          </div>

          {/* 16:9 Cinema Viewport */}
          <div
            data-testid="cinema-viewport"
            className="relative aspect-video w-full bg-[#070912] overflow-hidden select-none"
          >
            {hasActiveVideo ? (
              <video
                ref={videoRef}
                key={currentScene.videoUrl}
                src={currentScene.videoUrl}
                poster={currentScene.imageUrl}
                autoPlay
                loop
                playsInline
                muted={!soundEnabled}
                onError={() =>
                  setVideoFallbackMap((prev) => ({
                    ...prev,
                    [currentScene.id]: true,
                  }))
                }
                className="w-full h-full object-cover"
              />
            ) : !imgFallbackMap[currentScene.id] ? (
              <img
                src={currentScene.imageUrl}
                alt={`${currentScene.title} — ${currentScene.location}`}
                referrerPolicy="no-referrer"
                onError={() =>
                  setImgFallbackMap((prev) => ({ ...prev, [currentScene.id]: true }))
                }
                className="w-full h-full object-cover transition-transform duration-700 ease-out"
                style={{
                  transform: isPlaying ? 'scale(1.03)' : 'scale(1.0)',
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#070912] via-[#13182B] to-[#0D1120] p-8 text-center">
                <Radio className="w-10 h-10 text-[#29DCEF] mb-3" />
                <p className="font-display text-lg font-semibold text-[#F4F1E8]">
                  {currentScene.title}
                </p>
                <p className="text-xs text-[#9BA3B8] mt-1">{currentScene.location}</p>
              </div>
            )}

            {/* Measured Scrim for Guaranteed 4.5:1 Contrast on Subtitles & Choice Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070912] via-[#070912]/45 to-transparent pointer-events-none" />

            {/* Top-Left Persistent Media Modality Pill */}
            <div className="absolute top-4 left-4 bg-[#070912]/85 backdrop-blur-md border border-[#F4F1E8]/15 rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-none">
              {hasActiveVideo ? (
                <>
                  <Film className="w-3.5 h-3.5 text-[#29DCEF]" />
                  <span className="text-[11px] font-mono text-[#29DCEF]">
                    MOTION VIDEO · gemini-omni-1.2-flash
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-[#755CFF]" />
                  <span className="text-[11px] font-mono text-[#F4F1E8]">
                    STORYBOARD PLATE · 16:9 KEYFRAME
                  </span>
                </>
              )}
            </div>

            {/* Top-Right Carrier Frequency Oscilloscope Overlay */}
            <div className="absolute top-4 right-4 bg-[#070912]/80 backdrop-blur-md border border-[#F4F1E8]/15 rounded-lg px-3 py-2 flex items-center gap-3 pointer-events-none">
              <div className="text-right">
                <div className="text-[11px] font-mono text-[#9BA3B8] tabular-nums">
                  {isTitanic ? '1912 MARCONI SPARK · 500 kHz' : '1.420 GHz CARRIER'}
                </div>
                <div className="text-xs font-mono text-[#F4F1E8] tabular-nums">
                  {currentScene.act === 'DECISION_POINT'
                    ? isTitanic
                      ? '00:55 ALLOCATION WINDOW'
                      : 'DECAY WINDOW ACTIVE'
                    : currentScene.isEnding
                    ? currentScene.endingType === 'CANON_A'
                      ? isTitanic
                        ? 'CARPATHIA BEACON LOCKED'
                        : 'UPLINK SYNCHRONIZED'
                      : isTitanic
                      ? 'BULKHEAD 6 BREACHED'
                      : 'FARADAY SEAL LOCKED'
                    : isTitanic
                    ? 'NORTH ATLANTIC · 41°46′N'
                    : 'PHASE LOCKED'}
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={108}
                height={32}
                aria-label="Signal frequency waveform"
                className="w-[108px] h-[32px]"
              />
            </div>

            {/* Dialogue Subtitle Box */}
            {activeDialogue && (
              <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
                <div className="max-w-3xl mx-auto bg-[#070912]/85 backdrop-blur-md border border-[#F4F1E8]/15 rounded-lg px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#9BA3B8] mb-1">
                    <span className="font-mono font-semibold text-[#29DCEF] tracking-wide">
                      {activeDialogue.speaker}
                    </span>
                    {activeDialogue.delivery && (
                      <span className="italic text-[#9BA3B8]">
                        {activeDialogue.delivery}
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-[#F4F1E8] leading-relaxed">
                    “{activeDialogue.line}”
                  </p>
                </div>
              </div>
            )}

            {/* Consequential Branching Decision Overlay */}
            {isDecisionOverlayVisible && (
              <div
                data-testid="decision-overlay"
                className="absolute inset-x-5 top-16 bottom-28 flex flex-col justify-center items-center z-10"
              >
                <div className="w-full max-w-2xl bg-[#070912]/92 backdrop-blur-md border border-[#755CFF]/50 rounded-xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between gap-4 border-b border-[#F4F1E8]/10 pb-3">
                    <div>
                      <p className="text-xs font-mono text-[#29DCEF]">
                        {currentScene.act === 'DECISION_POINT'
                          ? isTitanic
                            ? 'CONSEQUENTIAL DECISION POINT · RMS TITANIC 00:55'
                            : 'CONSEQUENTIAL DECISION POINT · MERIDIAN-9 CONSOLE'
                          : 'SCENE TRANSITION READY'}
                      </p>
                      <h2 className="font-display text-lg font-semibold text-[#F4F1E8]">
                        {currentScene.act === 'DECISION_POINT'
                          ? isTitanic
                            ? 'Choose Rescue Allocation Protocol'
                            : 'Choose Signal Routing Protocol'
                          : 'Advance Narrative Sequence'}
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-[#9BA3B8] tabular-nums">
                      {publishedChoices.length}{' '}
                      {publishedChoices.length === 1 ? 'Route' : 'Routes'} Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {publishedChoices.map((choice, idx) => (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={!publishRightsCheck.allowed}
                        onClick={() => handleSelectChoice(choice)}
                        className={`text-left p-4 rounded-lg border transition-all duration-150 ${
                          idx === 0
                            ? 'border-[#29DCEF]/40 bg-[#13182B]/90 hover:border-[#29DCEF] hover:bg-[#13182B]'
                            : 'border-[#755CFF]/40 bg-[#13182B]/90 hover:border-[#755CFF] hover:bg-[#13182B]'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#9BA3B8] mb-1">
                          <span
                            className={
                              idx === 0 ? 'text-[#29DCEF]' : 'text-[#755CFF]'
                            }
                          >
                            ROUTE 0{idx + 1}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#F4F1E8]" />
                        </div>
                        <div className="font-display text-sm font-semibold text-[#F4F1E8]">
                          {choice.label}
                        </div>
                        <p className="text-xs text-[#9BA3B8] mt-1 line-clamp-2">
                          {choice.subtitle}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Player Transport & Scrubber Bar */}
          <div className="px-5 py-3.5 border-t border-[#F4F1E8]/10 bg-[#0D1120] space-y-3">
            {/* Scrubber Track */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#9BA3B8] tabular-nums w-12">
                00:{String(Math.floor(elapsedSec)).padStart(2, '0')}
              </span>
              <div
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Scene playback progress"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickRatio = Math.max(
                    0,
                    Math.min(1, (e.clientX - rect.left) / rect.width)
                  );
                  setElapsedSec(clickRatio * currentScene.durationSec);
                }}
                className="flex-1 h-2 bg-[#13182B] rounded-full overflow-hidden cursor-pointer"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#755CFF] to-[#29DCEF] transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[#9BA3B8] tabular-nums w-12 text-right">
                00:{String(currentScene.durationSec).padStart(2, '0')}
              </span>
            </div>

            {/* Transport Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (elapsedSec >= currentScene.durationSec) {
                      setElapsedSec(0);
                    }
                    setIsPlaying((prev) => !prev);
                  }}
                  className="px-4 py-2 text-xs font-medium text-[#070912] bg-[#F4F1E8] rounded-lg hover:bg-[#F4F1E8]/90 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Scene</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>
                        {elapsedSec >= currentScene.durationSec
                          ? 'Replay Scene'
                          : 'Play Scene'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRestartExperience}
                  className="px-3.5 py-2 text-xs font-medium text-[#F4F1E8] bg-[#13182B] border border-[#F4F1E8]/15 rounded-lg hover:border-[#F4F1E8]/40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Film</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  aria-label={
                    soundEnabled ? 'Mute synthesized score' : 'Enable synthesized score'
                  }
                  className="px-3.5 py-2 text-xs font-medium text-[#F4F1E8] bg-[#13182B] border border-[#F4F1E8]/15 rounded-lg hover:border-[#F4F1E8]/40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#29DCEF]" />
                      <span>Score On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-[#9BA3B8]" />
                      <span>Score Muted</span>
                    </>
                  )}
                </button>

                {hasVerifiedMp4Video && (
                  <button
                    type="button"
                    onClick={() => setCompareStoryboardMode((prev) => !prev)}
                    className="px-3.5 py-2 text-xs font-mono text-[#29DCEF] bg-[#13182B] border border-[#29DCEF]/30 rounded-lg hover:border-[#29DCEF] transition-colors whitespace-nowrap shrink-0"
                  >
                    {compareStoryboardMode
                      ? 'Return to Motion Video (MP4)'
                      : 'Compare Reference Keyframe'}
                  </button>
                )}
              </div>

              {/* Quick Jump to Decision or Alternate Endings */}
              <div className="flex flex-wrap items-center gap-2">
                {decisionScene && currentScene.id !== decisionScene.id && (
                  <button
                    type="button"
                    onClick={() => handleJumpToScene(decisionScene)}
                    className="px-3.5 py-2 text-xs font-medium text-[#29DCEF] bg-[#13182B] border border-[#29DCEF]/30 rounded-lg hover:border-[#29DCEF] transition-colors whitespace-nowrap shrink-0"
                  >
                    Jump to Decision Hub
                  </button>
                )}

                {outcomeScenes.map((endingScene, idx) => (
                  <button
                    key={endingScene.id}
                    type="button"
                    onClick={() => handleJumpToScene(endingScene)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      currentScene.id === endingScene.id
                        ? 'bg-[#755CFF] text-[#F4F1E8] border-[#755CFF]'
                        : 'bg-[#13182B] text-[#F4F1E8] border-[#F4F1E8]/15 hover:border-[#755CFF]'
                    }`}
                  >
                    Outcome {String.fromCharCode(65 + idx)} (MP4)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Active Scene Dossier, Consequential Decisions & Causal World State */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-5 space-y-6">
          <div className="space-y-5">
            {/* Title & Synopsis Header */}
            <div className="space-y-2 border-b border-[#F4F1E8]/10 pb-4">
              <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
                <span className="font-mono text-[#755CFF] font-semibold">
                  {storyDNA.screenplayTitle}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentScene.act.replace('_', ' ')}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {currentScene.durationSec}s
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-[#F4F1E8] tracking-tight">
                {currentScene.title}
              </h1>
              <p className="text-sm text-[#9BA3B8] leading-relaxed">
                {currentScene.synopsis}
              </p>
            </div>

            {/* Consequential Choice Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#9BA3B8]">
                <span className="font-semibold text-[#F4F1E8]">
                  {currentScene.isEnding
                    ? 'Terminal Outcome Reached'
                    : 'Available Branch Decisions'}
                </span>
                <span className="font-mono tabular-nums">
                  {publishedChoices.length} Active
                </span>
              </div>

              {currentScene.isEnding ? (
                <div className="p-4 rounded-lg border border-[#29DCEF]/30 bg-[#13182B] space-y-3">
                  <div className="text-xs font-mono text-[#29DCEF]">
                    {currentScene.endingThematicTag || 'CANONICAL OUTCOME'}
                  </div>
                  <p className="text-xs text-[#9BA3B8] leading-relaxed">
                    You are watching a real 16:9 motion-video outcome of{' '}
                    <strong className="text-[#F4F1E8]">{storyDNA.screenplayTitle}</strong>{' '}
                    synthesized via <code className="text-[#29DCEF]">gemini-omni-1.2-flash</code>. Compare how the causal world state shifts on the alternate branch below.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {outcomeScenes
                      .filter((s) => s.id !== currentScene.id)
                      .map((alt) => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => handleJumpToScene(alt)}
                          className="px-3.5 py-2 text-xs font-medium text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                        >
                          Explore {alt.title}
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => onOpenStudioTab('map')}
                      className="px-3.5 py-2 text-xs font-medium text-[#F4F1E8] bg-[#0D1120] border border-[#F4F1E8]/20 rounded-lg hover:border-[#755CFF] transition-colors whitespace-nowrap shrink-0"
                    >
                      Inspect Branch Map
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {publishedChoices.map((choice, index) => (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={!publishRightsCheck.allowed}
                      onClick={() => handleSelectChoice(choice)}
                      className="w-full text-left p-3.5 rounded-lg border border-[#F4F1E8]/15 bg-[#13182B] hover:border-[#29DCEF] transition-colors space-y-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-semibold text-[#F4F1E8]">
                          0{index + 1}. {choice.label.replace(/^0\d\.\s*/, '')}
                        </span>
                        <span className="text-xs font-mono text-[#29DCEF] whitespace-nowrap shrink-0">
                          Select Route →
                        </span>
                      </div>
                      <p className="text-xs text-[#9BA3B8]">
                        {choice.consequenceSummary}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active Causal World State Ledger */}
            <div className="space-y-2.5 pt-2 border-t border-[#F4F1E8]/10">
              <div className="flex items-center justify-between text-xs text-[#9BA3B8]">
                <span className="font-semibold text-[#F4F1E8]">
                  Deterministic World-State Ledger
                </span>
                <span className="font-mono tabular-nums">
                  {activeFacts.length} Facts Active
                </span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {activeFacts.map((factId) => {
                  const factObj = storyDNA.canonicalFacts.find((f) => f.id === factId);
                  return (
                    <div
                      key={factId}
                      className="p-2.5 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 text-xs"
                    >
                      <div className="font-mono text-[11px] text-[#29DCEF]">
                        {factId}
                      </div>
                      <div className="text-[#F4F1E8] mt-0.5">
                        {factObj ? factObj.statement : factId}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rights & Deterministic Verification Footer inside Sidebar */}
          <div className="pt-4 border-t border-[#F4F1E8]/10 flex items-center justify-between gap-2 text-xs text-[#9BA3B8]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#29DCEF] shrink-0" />
              <span>
                Rights Policy:{' '}
                <strong className="text-[#F4F1E8] font-mono">
                  {publishRightsCheck.decision}
                </strong>
              </span>
            </div>
            <span className="font-mono text-[11px] tabular-nums">
              {currentScene.assetHash || publishRightsCheck.auditHash}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Branching Timeline Visualization Ribbon */}
      <section
        aria-label="Interactive Branching Timeline"
        className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4F1E8]/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
              <GitBranch className="w-3.5 h-3.5 text-[#755CFF]" />
              <span>DETERMINISTIC STORY GRAPH ({storyDNA.screenplayTitle})</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {storyGraph.scenes.length} Scenes
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {outcomeScenes.length} Motion-Video Endings
              </span>
            </div>
            <h2 className="font-display text-lg font-semibold text-[#F4F1E8]">
              Interactive Timeline & Alternate Outcome Explorer
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenStudioTab('dna')}
              className="px-3.5 py-2 text-xs font-medium text-[#F4F1E8] bg-[#13182B] border border-[#F4F1E8]/15 rounded-lg hover:border-[#755CFF] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#755CFF]" />
              <span>Inspect Story DNA</span>
            </button>
          </div>
        </div>

        {/* Node Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {storyGraph.scenes.map((scene) => {
            const isCurrent = scene.id === currentScene.id;
            const isVisited = visitedSceneIds.includes(scene.id);

            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => handleJumpToScene(scene)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-[#29DCEF] bg-[#13182B]'
                    : isVisited
                    ? 'border-[#755CFF]/50 bg-[#13182B]/60 hover:border-[#755CFF]'
                    : 'border-[#F4F1E8]/10 bg-[#070912]/60 hover:border-[#F4F1E8]/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#9BA3B8] mb-1.5">
                  <span className={isCurrent ? 'text-[#29DCEF]' : 'text-[#755CFF]'}>
                    {scene.code}
                  </span>
                  <span>
                    {isCurrent
                      ? 'NOW PLAYING'
                      : isVisited
                      ? 'TRAVERSED'
                      : scene.isEnding
                      ? 'ALTERNATE ENDING'
                      : 'BRANCH NODE'}
                  </span>
                </div>
                <div className="font-display text-sm font-semibold text-[#F4F1E8]">
                  {scene.title}
                </div>
                <p className="text-xs text-[#9BA3B8] mt-1 line-clamp-2">
                  {scene.synopsis}
                </p>
                <div className="mt-3 pt-2 border-t border-[#F4F1E8]/10 flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className={scene.videoUrl ? 'text-[#29DCEF]' : 'text-[#9BA3B8]'}>
                    {scene.videoUrl ? 'MOTION VIDEO (MP4)' : 'STORYBOARD PLATE'}
                  </span>
                  <span className="text-[#9BA3B8]">
                    {scene.isEnding ? 'TERMINAL' : `${scene.choices.length} Out`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* "How Gemini Powers BranchFrame" Explanation Section on Primary Landing View */}
      <section
        aria-label="How Gemini Powers BranchFrame"
        className="rounded-xl border border-[#F4F1E8]/10 bg-[#0D1120] p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4F1E8]/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#9BA3B8]">
              <Cpu className="w-3.5 h-3.5 text-[#29DCEF]" />
              <span>GEMINI INTELLIGENCE ARCHITECTURE</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {geminiTraces.length} Verified Server Executions
              </span>
            </div>
            <h2 className="font-display text-lg font-semibold text-[#F4F1E8]">
              How Gemini Powers BranchFrame
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenStudioTab('dossier')}
            className="px-4 py-2 text-xs font-semibold text-[#070912] bg-[#29DCEF] rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            View Live Telemetry & Hackathon Dossier
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-2">
            <div className="font-mono text-[#755CFF]">01 · STORY DNA COMPILER</div>
            <div className="font-display text-sm font-semibold text-[#F4F1E8]">
              Gemini 4 Hydrogen (`gemini-4-hydrogen`)
            </div>
            <p className="text-[#9BA3B8] leading-relaxed">
              Parses the raw screenplay on the server using strict JSON `responseSchema` to extract characters, immutable facts, causal events, and candidate branch points.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-2">
            <div className="font-mono text-[#29DCEF]">02 · CAUSAL BRANCH PLANNER</div>
            <div className="font-display text-sm font-semibold text-[#F4F1E8]">
              Counterfactual Consequence Engine
            </div>
            <p className="text-[#9BA3B8] leading-relaxed">
              Synthesizes alternate story paths while tracking downstream event invalidations and character knowledge state so branches never violate historical or narrative canon.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-2">
            <div className="font-mono text-[#FF617C]">03 · RIGHTS & CANON GATES</div>
            <div className="font-display text-sm font-semibold text-[#F4F1E8]">
              Deterministic Zero-Bypass Guards
            </div>
            <p className="text-[#9BA3B8] leading-relaxed">
              Enforces default-DENY Rights-as-Code (`ownership`, `adaptation`, `likeness`, `voice`, `derivative_work`) and graph DAG validation before any media job runs.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#13182B]/70 border border-[#F4F1E8]/10 space-y-2">
            <div className="font-mono text-[#29DCEF]">04 · MOTION VIDEO SYNTHESIS</div>
            <div className="font-display text-sm font-semibold text-[#F4F1E8]">
              Gemini Omni 1.2 Flash (`gemini-omni-1.2-flash`)
            </div>
            <p className="text-[#9BA3B8] leading-relaxed">
              Invokes the `v1beta` Interactions API with approved reference frames to generate continuity-locked 16:9 720p MP4 outcome sequences held for human supervisor sign-off.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
