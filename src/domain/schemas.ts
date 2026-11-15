export type PermissionScope =
  | 'ownership'
  | 'adaptation'
  | 'likeness'
  | 'voice'
  | 'derivative_work';

export type PermissionDecision = 'ALLOW' | 'DENY';

export type OperationType =
  | 'COMPILE_DNA'
  | 'PROPOSE_BRANCH'
  | 'GENERATE_FOOTAGE'
  | 'APPROVE_FOOTAGE'
  | 'PUBLISH_GRAPH';

export interface PermissionGrant {
  id: string;
  scope: PermissionScope;
  subjectId: string; // 'title:the-last-signal' or character ID e.g. 'char:elena-vance'
  subjectName: string;
  rightsholder: string;
  decision: PermissionDecision;
  licenseRef: string;
  expiresAt: string;
  constraints: string[];
}

export interface RightsManifest {
  schemaVersion: '1.0.0';
  titleId: string;
  defaultPolicy: 'DENY';
  territories: string[];
  accessTier: 'FREE_DEMO' | 'PAID_PASS' | 'STUDIO_LICENSE';
  grants: PermissionGrant[];
  updatedAt: string;
}

export interface RightsEvaluationResult {
  allowed: boolean;
  decision: PermissionDecision;
  operation: OperationType;
  evaluatedScopes: {
    scope: PermissionScope;
    subjectId: string;
    subjectName: string;
    decision: PermissionDecision;
    reason: string;
  }[];
  deniedReasons: string[];
  auditHash: string;
  evaluatedAt: string;
}

export interface GeminiExecutionTrace {
  id: string;
  operation:
    | 'STORY_DNA_COMPILER'
    | 'BRANCH_PLANNER'
    | 'OMNI_VIDEO_GENERATION'
    | 'FLASH_IMAGE_GENERATION';
  modelId: string;
  endpoint: string;
  outcome: 'LIVE_SUCCESS' | 'BLOCKED_RIGHTS' | 'API_ERROR';
  provenance: 'LIVE_GEMINI' | 'SEED_FIXTURE' | 'STORYBOARD_FALLBACK';
  latencyMs: number;
  schemaValid: boolean;
  validationSummary: string;
  sanitizedError?: string;
  timestamp: string;
}

export interface CharacterDNA {
  id: string;
  name: string;
  role: string;
  motivation: string;
  initialKnowledgeFactIds: string[];
  voiceProfile: string;
  likenessProtected: boolean;
}

export interface CanonicalFact {
  id: string;
  statement: string;
  category: 'WORLD_RULE' | 'PLOT_FACT' | 'CHARACTER_SECRET' | 'TECHNICAL_CONSTRAINT';
  immutable: boolean;
  contradictsFactIds: string[];
}

export interface CausalEvent {
  id: string;
  title: string;
  sceneId: string;
  timestampCode: string;
  description: string;
  causesEventIds: string[];
  dependsOnEventIds: string[];
  establishedFactIds: string[];
  characterKnowledgeGained: {
    characterId: string;
    factId: string;
  }[];
}

export interface NarrativeConstraint {
  id: string;
  rule: string;
  severity: 'HARD_CANON' | 'TONAL' | 'RIGHTS_BOUNDARY';
  enforcedByValidator: boolean;
}

export interface CandidateBranchPoint {
  id: string;
  sceneId: string;
  title: string;
  dramaticQuestion: string;
  triggerEventId: string;
  stakes: string;
  suggestedAlternatives: string[];
}

export interface StoryDNA {
  schemaVersion: '1.0.0';
  titleId: string;
  screenplayTitle: string;
  logline: string;
  characters: CharacterDNA[];
  canonicalFacts: CanonicalFact[];
  causalEvents: CausalEvent[];
  narrativeConstraints: NarrativeConstraint[];
  candidateBranchPoints: CandidateBranchPoint[];
  compiledAt: string;
  compilerModel: string;
  provenance?: 'LIVE_GEMINI' | 'SEED_FIXTURE';
  latencyMs?: number;
}

export interface DialogueLine {
  speaker: string;
  characterId?: string;
  line: string;
  delivery?: string;
  startSec: number;
  endSec: number;
}

export interface DecisionChoice {
  id: string;
  label: string;
  subtitle: string;
  targetSceneId: string;
  consequenceSummary: string;
  requiredRightsScopes: PermissionScope[];
  setsFactIds: string[];
  isPublished: boolean;
}

export interface SceneNode {
  id: string;
  code: string;
  title: string;
  act: 'ACT_I' | 'DECISION_POINT' | 'OUTCOME_BRANCH';
  synopsis: string;
  location: string;
  timecode: string;
  durationSec: number;
  imageUrl: string;
  videoUrl?: string;
  mediaProvenance?: 'LIVE_OMNI_VIDEO' | 'STORYBOARD_DEMO';
  assetHash?: string;
  audioMood: 'TENSION_PULSE' | 'DECISION_HEARTBEAT' | 'CYAN_HORIZON' | 'QUARANTINE_DRONE';
  charactersPresent: string[];
  requiredPriorEventIds: string[];
  requiredFactIds: string[];
  establishesFactIds: string[];
  establishesEventIds: string[];
  characterKnowledgeRequired: {
    characterId: string;
    factId: string;
    reason: string;
  }[];
  characterKnowledgeGained: {
    characterId: string;
    factId: string;
  }[];
  dialogue: DialogueLine[];
  choices: DecisionChoice[];
  isEnding: boolean;
  endingType?: 'CANON_A' | 'ALTERNATE_B' | 'EXTENDED_C' | 'EXTENDED_D';
  endingThematicTag?: string;
}

export interface StoryGraph {
  schemaVersion: '1.0.0';
  titleId: string;
  versionNumber: number;
  entrySceneId: string;
  scenes: SceneNode[];
  publishedChoiceIds: string[];
  lastPublishedAt: string;
  approvedByHuman: string;
  architectureCapabilities: {
    maxSupportedDecisions: number;
    maxSupportedEndings: number;
    multiTitleReady: boolean;
    deterministicRouting: boolean;
  };
}

export interface BranchProposal {
  schemaVersion: '1.0.0';
  id: string;
  branchPointId: string;
  sourceSceneId: string;
  choiceLabel: string;
  choiceSubtitle: string;
  synopsis: string;
  endingThematicTag: string;
  causalConsequences: string[];
  downstreamEventChanges: {
    originalEventId: string;
    changeType: 'REPLACED' | 'MODIFIED' | 'INVALIDATED';
    newDescription: string;
  }[];
  newSceneDraft: {
    code: string;
    title: string;
    location: string;
    durationSec: number;
    charactersPresent: string[];
    establishesFactIds: string[];
    dialogue: DialogueLine[];
    visualPrompt: string;
  };
  createdAt: string;
  plannerModel: string;
  provenance?: 'LIVE_GEMINI' | 'SEED_FIXTURE';
  latencyMs?: number;
  status: 'DRAFT' | 'VALIDATED' | 'PUBLISHED';
}

export type ValidationIssueType =
  | 'UNREACHABLE_SCENE'
  | 'CANON_CONTRADICTION'
  | 'IMPOSSIBLE_CHARACTER_KNOWLEDGE'
  | 'INVALID_CAUSAL_DEPENDENCY'
  | 'DEAD_END';

export interface ValidationIssue {
  id: string;
  type: ValidationIssueType;
  severity: 'ERROR' | 'WARNING';
  sceneId: string;
  sceneCode: string;
  message: string;
  remediation: string;
}

export interface CanonValidationReport {
  schemaVersion: '1.0.0';
  titleId: string;
  valid: boolean;
  checkedAt: string;
  stats: {
    totalScenes: number;
    reachableScenes: number;
    totalPaths: number;
    endingsCount: number;
    contradictionsCount: number;
    knowledgeViolationsCount: number;
    invalidDependenciesCount: number;
    deadEndsCount: number;
  };
  issues: ValidationIssue[];
}

export interface GenerationJob {
  id: string;
  titleId: string;
  sceneId: string;
  sceneTitle: string;
  adapterType: 'OMNI_FLASH_VIDEO' | 'FLASH_IMAGE_KEYFRAME';
  modelName:
    | 'gemini-omni-1.2-flash'
    | 'gemini-omni-flash-preview'
    | 'gemini-3.1-flash-lite-image';
  prompt: string;
  aspectRatio: '16:9';
  durationSec: number;
  rightsCheck: RightsEvaluationResult;
  modelAvailable: boolean;
  availabilityNote: string;
  provenance:
    | 'LIVE_OMNI_VIDEO'
    | 'LIVE_FLASH_IMAGE'
    | 'STORYBOARD_DEMO_FALLBACK'
    | 'FAILED';
  assetVersion: number;
  assetHash: string;
  latencyMs?: number;
  status:
    | 'QUEUED'
    | 'GENERATING'
    | 'PENDING_HUMAN_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'FAILED';
  outputUrl?: string;
  videoUrl?: string;
  outputMimeType?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface PublicationRecord {
  id: string;
  titleId: string;
  versionNumber: number;
  approvedBy: string;
  role: string;
  notes: string;
  rightsVerified: boolean;
  canonVerified: boolean;
  approvedJobIds: string[];
  publishedAt: string;
  deterministicHash: string;
  rightsSnapshotHash?: string;
  assetHashes?: Record<string, string>;
  playbackMode?: 'MOTION_VIDEO' | 'STORYBOARD_DEMO' | 'HYBRID_CINEMA';
}

export interface TitleBundle {
  titleId: string;
  titleName: string;
  subtitle: string;
  tagline: string;
  genre: string;
  yearSetting: string;
  isFlagship: boolean;
  screenplayText: string;
  storyDNA: StoryDNA;
  rightsManifest: RightsManifest;
  storyGraph: StoryGraph;
  branchProposals: BranchProposal[];
  generationJobs: GenerationJob[];
  publicationRecords: PublicationRecord[];
}

export interface JudgeSandboxState {
  sessionId: string;
  titleId: string;
  isolated: true;
  simulatedFault: ValidationIssueType | 'NONE';
  rightsManifest: RightsManifest;
  storyDNA: StoryDNA;
  storyGraph: StoryGraph;
  branchProposals: BranchProposal[];
  generationJobs: GenerationJob[];
  publicationRecords: PublicationRecord[];
  canonReport: CanonValidationReport;
  publishRightsCheck: RightsEvaluationResult;
  lastResetAt: string;
}

/**
 * Independent Runtime Schema Validators
 * Ensures all Gemini outputs and API payloads conform strictly to versioned contracts.
 */
export function validateStoryDNASchema(input: unknown): {
  valid: boolean;
  errors: string[];
  data?: StoryDNA;
} {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Payload must be a non-null object'] };
  }
  const obj = input as Record<string, unknown>;

  if (obj.schemaVersion !== '1.0.0') {
    errors.push('schemaVersion must be "1.0.0"');
  }
  if (typeof obj.screenplayTitle !== 'string' || !obj.screenplayTitle.trim()) {
    errors.push('screenplayTitle must be a non-empty string');
  }
  if (typeof obj.logline !== 'string' || !obj.logline.trim()) {
    errors.push('logline must be a non-empty string');
  }
  if (!Array.isArray(obj.characters) || obj.characters.length === 0) {
    errors.push('characters must be a non-empty array');
  }
  if (!Array.isArray(obj.canonicalFacts) || obj.canonicalFacts.length === 0) {
    errors.push('canonicalFacts must be a non-empty array');
  }
  if (!Array.isArray(obj.causalEvents) || obj.causalEvents.length === 0) {
    errors.push('causalEvents must be a non-empty array');
  }
  if (!Array.isArray(obj.narrativeConstraints)) {
    errors.push('narrativeConstraints must be an array');
  }
  if (!Array.isArray(obj.candidateBranchPoints) || obj.candidateBranchPoints.length === 0) {
    errors.push('candidateBranchPoints must be a non-empty array');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (obj as unknown as StoryDNA) : undefined,
  };
}

export function validateBranchProposalSchema(input: unknown): {
  valid: boolean;
  errors: string[];
  data?: BranchProposal;
} {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Proposal must be a non-null object'] };
  }
  const obj = input as Record<string, unknown>;

  if (obj.schemaVersion !== '1.0.0') {
    errors.push('schemaVersion must be "1.0.0"');
  }
  if (typeof obj.choiceLabel !== 'string' || !obj.choiceLabel.trim()) {
    errors.push('choiceLabel must be a non-empty string');
  }
  if (typeof obj.synopsis !== 'string' || !obj.synopsis.trim()) {
    errors.push('synopsis must be a non-empty string');
  }
  if (!Array.isArray(obj.causalConsequences) || obj.causalConsequences.length === 0) {
    errors.push('causalConsequences must be a non-empty array');
  }
  if (!Array.isArray(obj.downstreamEventChanges)) {
    errors.push('downstreamEventChanges must be an array');
  }
  if (!obj.newSceneDraft || typeof obj.newSceneDraft !== 'object') {
    errors.push('newSceneDraft must be an object');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (obj as unknown as BranchProposal) : undefined,
  };
}
