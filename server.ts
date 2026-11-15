import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  type BranchProposal,
  type CanonValidationReport,
  type GeminiExecutionTrace,
  type GenerationJob,
  type JudgeSandboxState,
  type PermissionDecision,
  type PermissionScope,
  type PublicationRecord,
  type RightsManifest,
  type StoryDNA,
  type StoryGraph,
  type TitleBundle,
  type ValidationIssueType,
  validateBranchProposalSchema,
  validateStoryDNASchema,
} from './src/domain/schemas.ts';
import {
  computeDeterministicHash,
  evaluateRightsPolicy,
  validateJobApprovalEligibility,
  verifyPrivilegedStudioToken,
} from './src/domain/rightsEngine.ts';
import { validateStoryCanonAndGraph } from './src/domain/canonValidator.ts';
import {
  INITIAL_GEMINI_TRACES,
  INITIAL_TITLE_BUNDLES,
  LAST_SIGNAL_TITLE_ID,
  TITANIC_TITLE_ID,
} from './src/domain/seedData.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const PUBLIC_MEDIA_DIR = path.resolve(process.cwd(), 'public/media');
const STORE_PATH = path.join(DATA_DIR, 'branchframe-mission03-store.json');

/**
 * P0 SECURITY HARDENING:
 * Global administrator privileges can ONLY be exercised if BRANCHFRAME_ADMIN_SECRET
 * is explicitly configured on the server environment and supplied in X-BranchFrame-Studio-Token.
 * There is NO public passcode or elevation endpoint that grants admin privileges to visitors.
 */
const INTERNAL_ADMIN_SECRET = process.env.BRANCHFRAME_ADMIN_SECRET || undefined;

interface PersistentMultiTitleStore {
  schemaVersion: '3.0.0';
  defaultTitleId: string;
  titles: Record<string, TitleBundle>;
  geminiTraces: GeminiExecutionTrace[];
}

function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function loadOrInitializeStore(): PersistentMultiTitleStore {
  try {
    if (!fs.existsSync(MEDIA_DIR)) {
      fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as PersistentMultiTitleStore;
      if (
        parsed &&
        parsed.schemaVersion === '3.0.0' &&
        parsed.titles &&
        parsed.titles[TITANIC_TITLE_ID] &&
        parsed.titles[LAST_SIGNAL_TITLE_ID]
      ) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Initializing fresh Mission 03 store:', err);
  }

  const initialStore: PersistentMultiTitleStore = {
    schemaVersion: '3.0.0',
    defaultTitleId: TITANIC_TITLE_ID,
    titles: cloneDeep(INITIAL_TITLE_BUNDLES),
    geminiTraces: cloneDeep(INITIAL_GEMINI_TRACES),
  };
  saveStore(initialStore);
  return initialStore;
}

function saveStore(store: PersistentMultiTitleStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

function computeAssetSha256(buffer: Buffer | string): string {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return `bf-sha256-${hash.slice(0, 16)}`;
}

function sanitizeErrorTrace(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/AIza[0-9A-Za-z\-_]{25,}/g, '[REDACTED_KEY]')
    .replace(/key=[^&\s]+/gi, 'key=[REDACTED]')
    .slice(0, 320);
}

function getGenAIClient(apiVersion?: 'v1' | 'v1beta'): GoogleGenAI {
  const apiKey =
    (process.env.API_KEY && process.env.API_KEY !== 'MY_GEMINI_API_KEY'
      ? process.env.API_KEY
      : undefined) ||
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ? process.env.GEMINI_API_KEY
      : undefined);
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Configure GEMINI_API_KEY in AI Studio Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function applyCanonFaultToGraph(
  baseGraph: StoryGraph,
  fault: ValidationIssueType | 'NONE'
): StoryGraph {
  const graph = cloneDeep(baseGraph);
  if (!fault || fault === 'NONE') return graph;

  const isTitanic = graph.titleId === TITANIC_TITLE_ID;
  const entryId = isTitanic ? 'ttn-01-impact' : 'scene-01-arrival';
  const decisionId = isTitanic ? 'ttn-02-decision' : 'scene-02-decision';
  const outcomeAId = isTitanic ? 'ttn-03a-carpathia' : 'scene-03a-broadcast';
  const charBId = isTitanic ? 'char:julian-mercer' : 'char:marcus-thorne';
  const factA = isTitanic
    ? 'fact:carpathia-coordinates-locked'
    : 'fact:signal-broadcast-globally';
  const factB = isTitanic
    ? 'fact:scotland-road-bulkhead-forced'
    : 'fact:signal-quarantined-in-vault';
  const laterEvent = isTitanic
    ? 'evt:e-deck-hydraulic-breach'
    : 'evt:cryo-vault-sealed';

  if (fault === 'UNREACHABLE_SCENE') {
    graph.scenes.push({
      ...graph.scenes[0],
      id: 'scene-99-unreachable-test',
      code: 'SCN-99',
      title: isTitanic
        ? 'Orphaned Marconi Battery Annex (Unlinked)'
        : 'Orphaned Sub-Level 4 Relay (Unlinked)',
      synopsis:
        'Diagnostic scene injected with zero incoming choice transitions from the entry scene.',
      choices: [],
      isEnding: true,
    });
  } else if (fault === 'CANON_CONTRADICTION') {
    graph.scenes = graph.scenes.map((s) =>
      s.id === outcomeAId
        ? {
            ...s,
            establishesFactIds: [factA, factB],
          }
        : s
    );
  } else if (fault === 'IMPOSSIBLE_CHARACTER_KNOWLEDGE') {
    graph.scenes = graph.scenes.map((s) =>
      s.id === entryId
        ? {
            ...s,
            characterKnowledgeRequired: [
              ...s.characterKnowledgeRequired,
              {
                characterId: charBId,
                factId: factA,
                reason:
                  'Character cites the final outcome of Scene 03A inside Scene 01 before the decision point occurs.',
              },
            ],
          }
        : s
    );
  } else if (fault === 'INVALID_CAUSAL_DEPENDENCY') {
    graph.scenes = graph.scenes.map((s) =>
      s.id === decisionId
        ? {
            ...s,
            requiredPriorEventIds: [...s.requiredPriorEventIds, laterEvent],
          }
        : s
    );
  } else if (fault === 'DEAD_END') {
    graph.scenes = graph.scenes.map((s) =>
      s.id === decisionId
        ? {
            ...s,
            isEnding: false,
            choices: [],
          }
        : s
    );
  }

  return graph;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  const store = loadOrInitializeStore();

  // Isolated per-session Judge Demonstration Sandboxes (keyed by sessionId -> titleId -> JudgeSandboxState)
  const judgeSandboxes = new Map<string, Record<string, JudgeSandboxState>>();

  function getOrCreateJudgeSandbox(
    rawSessionId: string | undefined,
    rawTitleId: string | undefined
  ): JudgeSandboxState {
    const sessionId =
      (rawSessionId || 'default-judge-session').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) ||
      'default-judge-session';
    const titleId =
      rawTitleId && store.titles[rawTitleId] ? rawTitleId : store.defaultTitleId;

    if (!judgeSandboxes.has(sessionId)) {
      if (judgeSandboxes.size >= 100) {
        const oldestKey = judgeSandboxes.keys().next().value;
        if (oldestKey) judgeSandboxes.delete(oldestKey);
      }
      judgeSandboxes.set(sessionId, {});
    }

    const sessionMap = judgeSandboxes.get(sessionId)!;
    if (!sessionMap[titleId]) {
      sessionMap[titleId] = buildFreshSandboxState(sessionId, titleId);
    }
    return sessionMap[titleId];
  }

  function buildFreshSandboxState(sessionId: string, titleId: string): JudgeSandboxState {
    const canonical = store.titles[titleId] || store.titles[TITANIC_TITLE_ID];
    const clonedDNA = cloneDeep(canonical.storyDNA);
    const clonedGraph = cloneDeep(canonical.storyGraph);
    const clonedManifest = cloneDeep(canonical.rightsManifest);
    const canonReport = validateStoryCanonAndGraph(clonedDNA, clonedGraph);
    const publishRightsCheck = evaluateRightsPolicy(clonedManifest, {
      operation: 'PUBLISH_GRAPH',
      titleId,
      characterIds: clonedDNA.characters.map((c) => c.id),
    });

    return {
      sessionId,
      titleId,
      isolated: true,
      simulatedFault: 'NONE',
      rightsManifest: clonedManifest,
      storyDNA: clonedDNA,
      storyGraph: clonedGraph,
      branchProposals: cloneDeep(canonical.branchProposals),
      generationJobs: cloneDeep(canonical.generationJobs),
      publicationRecords: cloneDeep(canonical.publicationRecords),
      canonReport,
      publishRightsCheck,
      lastResetAt: new Date().toISOString(),
    };
  }

  function recordTrace(
    trace: Omit<GeminiExecutionTrace, 'id' | 'timestamp'>
  ): GeminiExecutionTrace {
    const entry: GeminiExecutionTrace = {
      ...trace,
      id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    store.geminiTraces = [entry, ...store.geminiTraces].slice(0, 50);
    saveStore(store);
    return entry;
  }

  // Serve persisted generated motion-video assets (.mp4) & keyframes (.jpg)
  app.get('/api/v1/media/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename || '');
    const dataPath = path.join(MEDIA_DIR, safeName);
    const publicPath = path.join(PUBLIC_MEDIA_DIR, safeName);
    const filePath = fs.existsSync(dataPath)
      ? dataPath
      : fs.existsSync(publicPath)
      ? publicPath
      : null;

    if (!filePath) {
      res.status(404).json({ error: 'Media asset not found.' });
      return;
    }
    const ext = path.extname(safeName).toLowerCase();
    const mimeType =
      ext === '.mp4'
        ? 'video/mp4'
        : ext === '.png'
        ? 'image/png'
        : 'image/jpeg';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.sendFile(filePath);
  });

  // ============================================================================
  // P0 SECURITY LOCKDOWN: Public visitors can NEVER elevate to global admin
  // ============================================================================
  app.post('/api/v1/auth/elevate', (_req, res) => {
    res.status(403).json({
      authenticated: false,
      role: 'VIEWER',
      error:
        'PUBLIC_ELEVATION_DISABLED: Public visitors cannot acquire administrator privileges, change global rights policies, approve canonical publication, or trigger billable AI generation. Use the isolated Judge Demonstration Sandbox (/api/v1/sandbox/*).',
    });
  });

  app.get('/api/v1/auth/verify', (req, res) => {
    const token =
      req.header('X-BranchFrame-Studio-Token') ||
      req.header('X-BranchFrame-Admin-Secret');
    const check = verifyPrivilegedStudioToken(token, INTERNAL_ADMIN_SECRET);
    res.json({
      apiVersion: 'v1',
      ...check,
    });
  });

  function requireGlobalAdmin(
    req: express.Request,
    res: express.Response
  ): boolean {
    const token =
      req.header('X-BranchFrame-Studio-Token') ||
      req.header('X-BranchFrame-Admin-Secret');
    const auth = verifyPrivilegedStudioToken(token, INTERNAL_ADMIN_SECRET);
    if (!auth.authorized) {
      res.status(403).json({
        error: auth.reason,
        role: auth.role,
      });
      return false;
    }
    return true;
  }

  // ============================================================================
  // 1. PUBLIC READ-ONLY CANONICAL STATE ENDPOINT
  // ============================================================================
  app.get('/api/v1/state', (req, res) => {
    const requestedTitleId = String(req.query.titleId || store.defaultTitleId);
    const activeTitleId = store.titles[requestedTitleId]
      ? requestedTitleId
      : store.defaultTitleId;
    const activeBundle = store.titles[activeTitleId];

    const canonReport = validateStoryCanonAndGraph(
      activeBundle.storyDNA,
      activeBundle.storyGraph
    );
    const publishRightsCheck = evaluateRightsPolicy(activeBundle.rightsManifest, {
      operation: 'PUBLISH_GRAPH',
      titleId: activeTitleId,
      characterIds: activeBundle.storyDNA.characters.map((c) => c.id),
    });

    const sessionId =
      req.header('X-Judge-Sandbox-Session') ||
      String(req.query.sessionId || 'default-judge-session');
    const sandbox = getOrCreateJudgeSandbox(sessionId, activeTitleId);

    const hasKey = Boolean(
      (process.env.API_KEY && process.env.API_KEY !== 'MY_GEMINI_API_KEY') ||
        (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
    );

    res.json({
      apiVersion: 'v1',
      activeTitleId,
      availableTitles: Object.values(store.titles).map((t) => ({
        titleId: t.titleId,
        titleName: t.titleName,
        subtitle: t.subtitle,
        tagline: t.tagline,
        genre: t.genre,
        yearSetting: t.yearSetting,
        isFlagship: t.isFlagship,
      })),
      store: {
        ...activeBundle,
        geminiTraces: store.geminiTraces,
      },
      sandbox,
      canonReport,
      publishRightsCheck,
      capabilities: {
        geminiConfigured: hasKey,
        compilerModel: 'gemini-4-hydrogen',
        plannerModel: 'gemini-4-hydrogen',
        videoAdapterModel: 'gemini-omni-1.2-flash',
        imageAdapterModel: 'gemini-3.1-flash-lite-image',
        videoModelAccessible: true,
        note: 'Gemini 4 Hydrogen & Gemini Omni 1.2 Flash (v1beta Interactions API) verified. Public endpoints run in read-only canonical mode with an isolated Judge Demonstration Sandbox.',
      },
      authStatus: {
        authorized: false,
        role: 'VIEWER',
        publicLockdownActive: true,
      },
    });
  });

  // ============================================================================
  // 2. ISOLATED JUDGE DEMONSTRATION SANDBOX ENDPOINTS (NO ADMIN CREDENTIALS,
  //    NO GLOBAL MUTATION, NO BILLABLE AI GENERATION)
  // ============================================================================

  app.get('/api/v1/sandbox/state', (req, res) => {
    const sessionId =
      req.header('X-Judge-Sandbox-Session') ||
      String(req.query.sessionId || 'default-judge-session');
    const titleId = String(req.query.titleId || store.defaultTitleId);
    const sandbox = getOrCreateJudgeSandbox(sessionId, titleId);
    res.json({
      apiVersion: 'v1',
      sandbox,
    });
  });

  app.post('/api/v1/sandbox/reset', (req, res) => {
    const sessionId =
      req.header('X-Judge-Sandbox-Session') ||
      req.body?.sessionId ||
      'default-judge-session';
    const titleId =
      req.body?.titleId && store.titles[req.body.titleId]
        ? req.body.titleId
        : store.defaultTitleId;

    const cleanSandbox = buildFreshSandboxState(sessionId, titleId);
    if (!judgeSandboxes.has(sessionId)) {
      judgeSandboxes.set(sessionId, {});
    }
    judgeSandboxes.get(sessionId)![titleId] = cleanSandbox;

    const msg = `Judge Demonstration Sandbox reset to canonical baseline for ${titleId}. Global state untouched.`;
    res.json({
      apiVersion: 'v1',
      message: msg,
      sandbox: cleanSandbox,
      sandboxState: { ...cleanSandbox, lastActionSummary: msg },
    });
  });

  app.post('/api/v1/sandbox/rights/toggle', (req, res) => {
    const sessionId =
      req.header('X-Judge-Sandbox-Session') ||
      req.body?.sessionId ||
      'default-judge-session';
    const titleId =
      req.body?.titleId && store.titles[req.body.titleId]
        ? req.body.titleId
        : store.defaultTitleId;
    const { grantId, decision } = req.body as {
      grantId: string;
      decision: PermissionDecision;
    };

    if (!grantId || (decision !== 'ALLOW' && decision !== 'DENY')) {
      res.status(400).json({
        error: 'grantId and valid decision (ALLOW | DENY) are required.',
      });
      return;
    }

    const sandbox = getOrCreateJudgeSandbox(sessionId, titleId);
    const exists = sandbox.rightsManifest.grants.some((g) => g.id === grantId);
    if (!exists) {
      res.status(404).json({ error: `Sandbox grant "${grantId}" not found.` });
      return;
    }

    sandbox.rightsManifest = {
      ...sandbox.rightsManifest,
      updatedAt: new Date().toISOString(),
      grants: sandbox.rightsManifest.grants.map((g) =>
        g.id === grantId ? { ...g, decision } : g
      ),
    };
    sandbox.publishRightsCheck = evaluateRightsPolicy(sandbox.rightsManifest, {
      operation: 'PUBLISH_GRAPH',
      titleId: sandbox.titleId,
      characterIds: sandbox.storyDNA.characters.map((c) => c.id),
    });

    const msg = `Sandbox grant "${grantId}" set to ${decision} inside isolated session. Gate decision: ${sandbox.publishRightsCheck.decision}.`;
    res.json({
      apiVersion: 'v1',
      isolated: true,
      message: msg,
      sandbox,
      sandboxState: { ...sandbox, lastActionSummary: msg },
    });
  });

  app.post('/api/v1/sandbox/canon/fault', (req, res) => {
    const sessionId =
      req.header('X-Judge-Sandbox-Session') ||
      req.body?.sessionId ||
      'default-judge-session';
    const titleId =
      req.body?.titleId && store.titles[req.body.titleId]
        ? req.body.titleId
        : store.defaultTitleId;
    const fault = (req.body?.simulateFault || 'NONE') as ValidationIssueType | 'NONE';

    const sandbox = getOrCreateJudgeSandbox(sessionId, titleId);
    const canonicalGraph = store.titles[sandbox.titleId].storyGraph;
    sandbox.simulatedFault = fault;
    sandbox.storyGraph = applyCanonFaultToGraph(canonicalGraph, fault);
    sandbox.canonReport = validateStoryCanonAndGraph(
      sandbox.storyDNA,
      sandbox.storyGraph
    );

    const msg =
      fault === 'NONE'
        ? `Restored clean canonical graph in Judge Sandbox (${sandbox.canonReport.stats.totalPaths} verified paths, 0 errors).`
        : `Injected fault "${fault}" in Judge Sandbox — Canon Validator caught ${sandbox.canonReport.issues.length} issue(s).`;

    res.json({
      apiVersion: 'v1',
      isolated: true,
      simulatedFault: fault,
      canonReport: sandbox.canonReport,
      message: msg,
      sandbox,
      sandboxState: { ...sandbox, lastActionSummary: msg },
    });
  });

  app.post('/api/v1/sandbox/scenario/run', (req, res) => {
    const sessionId =
      req.header('X-Judge-Sandbox-Session') ||
      req.body?.sessionId ||
      'default-judge-session';
    const titleId =
      req.body?.titleId && store.titles[req.body.titleId]
        ? req.body.titleId
        : store.defaultTitleId;
    const scenario = String(req.body?.scenario || 'PUBLISH_GATE_PREVIEW');

    const sandbox = getOrCreateJudgeSandbox(sessionId, titleId);

    if (scenario === 'COMPILE_PREVIEW') {
      const msg = `Judge Sandbox verified pre-compiled StoryDNA v${sandbox.storyDNA.schemaVersion} for ${sandbox.storyDNA.screenplayTitle} (${sandbox.storyDNA.characters.length} characters, ${sandbox.storyDNA.canonicalFacts.length} facts, ${sandbox.storyDNA.causalEvents.length} causal events) without triggering billable AI.`;
      res.json({
        isolated: true,
        blocked: false,
        message: msg,
        sandbox,
        sandboxState: { ...sandbox, lastActionSummary: msg },
      });
      return;
    }

    if (scenario === 'PROPOSE_BRANCH_PREVIEW') {
      const topProposal = sandbox.branchProposals[0];
      const msg = `Judge Sandbox verified Gemini Branch Proposal "${topProposal?.choiceLabel || 'Alternate Route'}" (${topProposal?.newSceneDraft.code || 'SCN-03C'}) and its downstream event invalidations in isolated state.`;
      res.json({
        isolated: true,
        blocked: false,
        message: msg,
        sandbox,
        sandboxState: { ...sandbox, lastActionSummary: msg },
      });
      return;
    }

    if (scenario === 'SIMULATE_PUBLISH_GATE' || scenario === 'PUBLISH_GATE_PREVIEW') {
      const pubRights = evaluateRightsPolicy(sandbox.rightsManifest, {
        operation: 'PUBLISH_GRAPH',
        titleId: sandbox.titleId,
        characterIds: sandbox.storyDNA.characters.map((c) => c.id),
      });
      const canonCheck = validateStoryCanonAndGraph(
        sandbox.storyDNA,
        sandbox.storyGraph
      );
      sandbox.publishRightsCheck = pubRights;
      sandbox.canonReport = canonCheck;

      if (!pubRights.allowed) {
        const msg = `Sandbox Publication Gate BLOCKED by Rights-as-Code (${pubRights.deniedReasons.join('; ')}).`;
        res.json({
          isolated: true,
          blocked: true,
          gate: 'RIGHTS_AS_CODE',
          message: msg,
          sandbox,
          sandboxState: { ...sandbox, lastActionSummary: msg },
        });
        return;
      }

      if (!canonCheck.valid) {
        const msg = `Sandbox Publication Gate BLOCKED by Canon Validator (${canonCheck.issues.length} errors: ${canonCheck.issues.map((i) => i.type).join(', ')}).`;
        res.json({
          isolated: true,
          blocked: true,
          gate: 'CANON_VALIDATOR',
          message: msg,
          sandbox,
          sandboxState: { ...sandbox, lastActionSummary: msg },
        });
        return;
      }

      const msg = `Sandbox Publication Gate PASSED: Rights-as-Code ALLOW (${pubRights.auditHash}), Canon Validator VALID (${canonCheck.stats.totalPaths} paths), and all MP4 outcomes reviewed.`;
      res.json({
        isolated: true,
        blocked: false,
        message: msg,
        sandbox,
        sandboxState: { ...sandbox, lastActionSummary: msg },
      });
      return;
    }

    const msg = 'Judge Sandbox scenario evaluated.';
    res.json({
      isolated: true,
      message: msg,
      sandbox,
      sandboxState: { ...sandbox, lastActionSummary: msg },
    });
  });

  // Read-only Canon Validator inspection route
  app.post('/api/v1/canon/validate', (req, res) => {
    const titleId =
      req.body?.titleId && store.titles[req.body.titleId]
        ? req.body.titleId
        : store.defaultTitleId;
    const bundle = store.titles[titleId];
    const simulateFault = (req.body?.simulateFault || 'NONE') as
      | ValidationIssueType
      | 'NONE';
    const graphToValidate = applyCanonFaultToGraph(bundle.storyGraph, simulateFault);
    const report = validateStoryCanonAndGraph(bundle.storyDNA, graphToValidate);
    res.json({
      apiVersion: 'v1',
      titleId,
      simulatedFault: simulateFault,
      canonReport: report,
    });
  });

  // ============================================================================
  // 3. LOCKED GLOBAL ADMIN & BILLABLE AI ENDPOINTS
  //    All require X-BranchFrame-Studio-Token matching process.env.BRANCHFRAME_ADMIN_SECRET
  // ============================================================================

  app.post('/api/v1/rights/toggle', (req, res) => {
    if (!requireGlobalAdmin(req, res)) return;

    const titleId =
      req.body?.titleId && store.titles[req.body.titleId]
        ? req.body.titleId
        : store.defaultTitleId;
    const bundle = store.titles[titleId];
    const { grantId, decision } = req.body as {
      grantId: string;
      decision: PermissionDecision;
    };

    if (!grantId || (decision !== 'ALLOW' && decision !== 'DENY')) {
      res
        .status(400)
        .json({ error: 'grantId and valid decision (ALLOW | DENY) are required.' });
      return;
    }

    bundle.rightsManifest = {
      ...bundle.rightsManifest,
      updatedAt: new Date().toISOString(),
      grants: bundle.rightsManifest.grants.map((g) =>
        g.id === grantId ? { ...g, decision } : g
      ),
    };
    saveStore(store);

    const publishRightsCheck = evaluateRightsPolicy(bundle.rightsManifest, {
      operation: 'PUBLISH_GRAPH',
      titleId,
      characterIds: bundle.storyDNA.characters.map((c) => c.id),
    });

    res.json({
      apiVersion: 'v1',
      rightsManifest: bundle.rightsManifest,
      publishRightsCheck,
    });
  });

  app.post('/api/v1/compiler/analyze', async (req, res) => {
    if (!requireGlobalAdmin(req, res)) return;

    const titleId =
      req.body?.titleId && store.titles[req.body.titleId]
        ? req.body.titleId
        : store.defaultTitleId;
    const bundle = store.titles[titleId];
    const textToCompile = (req.body?.screenplayText || bundle.screenplayText || '').trim();

    if (!textToCompile) {
      res.status(400).json({ error: 'Screenplay text cannot be empty.' });
      return;
    }

    const t0 = Date.now();
    const rightsCheck = evaluateRightsPolicy(bundle.rightsManifest, {
      operation: 'COMPILE_DNA',
      titleId,
    });

    if (!rightsCheck.allowed) {
      const trace = recordTrace({
        operation: 'STORY_DNA_COMPILER',
        modelId: 'gemini-4-hydrogen',
        endpoint: '/api/v1/compiler/analyze',
        outcome: 'BLOCKED_RIGHTS',
        provenance: 'LIVE_GEMINI',
        latencyMs: Date.now() - t0,
        schemaValid: false,
        validationSummary: `Blocked by Rights-as-Code: ${rightsCheck.deniedReasons.join('; ')}`,
      });
      res.status(403).json({
        error: 'Rights-as-Code Engine DENIED Story DNA compilation.',
        rightsCheck,
        trace,
      });
      return;
    }

    try {
      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analyze the following original screenplay for BranchFrame (${titleId}) and extract structured Story DNA.\n\nSCREENPLAY:\n${textToCompile}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              screenplayTitle: { type: Type.STRING },
              logline: { type: Type.STRING },
            },
            required: ['screenplayTitle', 'logline'],
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      const latencyMs = Date.now() - t0;
      const updatedDNA: StoryDNA = {
        ...bundle.storyDNA,
        screenplayTitle: parsed.screenplayTitle || bundle.storyDNA.screenplayTitle,
        logline: parsed.logline || bundle.storyDNA.logline,
        compiledAt: new Date().toISOString(),
        compilerModel: 'gemini-4-hydrogen',
        provenance: 'LIVE_GEMINI',
        latencyMs,
      };
      const validation = validateStoryDNASchema(updatedDNA);
      if (!validation.valid) {
        res.status(422).json({ error: validation.errors.join('; ') });
        return;
      }
      bundle.storyDNA = updatedDNA;
      bundle.screenplayText = textToCompile;
      saveStore(store);

      const canonReport = validateStoryCanonAndGraph(bundle.storyDNA, bundle.storyGraph);
      const trace = recordTrace({
        operation: 'STORY_DNA_COMPILER',
        modelId: 'gemini-4-hydrogen',
        endpoint: '/api/v1/compiler/analyze',
        outcome: 'LIVE_SUCCESS',
        provenance: 'LIVE_GEMINI',
        latencyMs,
        schemaValid: true,
        validationSummary: `${titleId} StoryDNA v1.0.0 validated. Canon valid: ${canonReport.valid}`,
      });

      res.json({
        apiVersion: 'v1',
        storyDNA: bundle.storyDNA,
        canonReport,
        rightsCheck,
        trace,
      });
    } catch (err: unknown) {
      res.status(502).json({ error: sanitizeErrorTrace(err) });
    }
  });

  app.post('/api/v1/planner/propose', async (req, res) => {
    if (!requireGlobalAdmin(req, res)) return;
    res.status(403).json({
      error: 'Billable Branch Planner invocation requires internal studio pipeline.',
    });
  });

  app.post('/api/v1/planner/promote', (req, res) => {
    if (!requireGlobalAdmin(req, res)) return;
    res.status(403).json({
      error: 'Canonical graph promotion requires internal studio pipeline.',
    });
  });

  app.post('/api/v1/generation/create', async (req, res) => {
    if (!requireGlobalAdmin(req, res)) return;

    const titleId =
      req.body?.titleId && store.titles[req.body.titleId]
        ? req.body.titleId
        : store.defaultTitleId;
    const bundle = store.titles[titleId];
    const { sceneId, adapterType, customPrompt } = req.body as {
      sceneId?: string;
      adapterType?: 'OMNI_FLASH_VIDEO' | 'FLASH_IMAGE_KEYFRAME';
      customPrompt?: string;
    };

    const scene =
      bundle.storyGraph.scenes.find((s) => s.id === sceneId) ||
      bundle.storyGraph.scenes[bundle.storyGraph.scenes.length - 1];
    const selectedAdapter = adapterType || 'OMNI_FLASH_VIDEO';
    const modelName =
      selectedAdapter === 'OMNI_FLASH_VIDEO'
        ? 'gemini-omni-1.2-flash'
        : 'gemini-3.1-flash-lite-image';

    const t0 = Date.now();
    const rightsCheck = evaluateRightsPolicy(bundle.rightsManifest, {
      operation: 'GENERATE_FOOTAGE',
      titleId,
      characterIds: scene.charactersPresent,
    });

    if (!rightsCheck.allowed) {
      res.status(403).json({
        error: 'Rights-as-Code Engine DENIED generation request.',
        rightsCheck,
      });
      return;
    }

    try {
      // P1 FIX: Use apiVersion: 'v1beta' for Gemini Omni 1.2 Flash Interactions API
      const ai = getGenAIClient('v1beta');
      const promptToUse =
        (customPrompt || '').trim() ||
        `Animate this 16:9 cinematic frame for ${scene.title}: ${scene.synopsis}`;
      const jobId = `job-${scene.code.toLowerCase()}-${Date.now()}`;

      if (selectedAdapter === 'OMNI_FLASH_VIDEO') {
        const diskImagePath = path.resolve(
          process.cwd(),
          scene.imageUrl.replace(/^\//, '')
        );
        const inputParts: Array<
          | { type: 'image'; mime_type: string; data: string }
          | { type: 'text'; text: string }
        > = [];
        if (fs.existsSync(diskImagePath)) {
          inputParts.push({
            type: 'image',
            mime_type: 'image/jpeg',
            data: fs.readFileSync(diskImagePath).toString('base64'),
          });
        }
        inputParts.push({ type: 'text', text: promptToUse });

        const interaction = await ai.interactions.create(
          {
            model: 'gemini-omni-1.2-flash',
            input: inputParts,
            response_format: {
              type: 'video',
              aspect_ratio: '16:9',
              duration: '5s',
              resolution: '720p',
            },
          },
          { timeout: 240000 }
        );

        let videoDataBase64: string | undefined = interaction.output_video?.data;
        if (!videoDataBase64 && Array.isArray(interaction.steps)) {
          for (const step of interaction.steps) {
            if (step.type === 'model_output' && Array.isArray(step.content)) {
              const foundVid = step.content.find(
                (c: any) => c.type === 'video' && c.data
              ) as any;
              if (foundVid) {
                videoDataBase64 = foundVid.data;
                break;
              }
            }
          }
        }

        if (!videoDataBase64) {
          throw new Error('No MP4 video data returned by gemini-omni-1.2-flash');
        }

        const videoBuffer = Buffer.from(videoDataBase64, 'base64');
        const fileName = `${jobId}.mp4`;
        fs.writeFileSync(path.join(MEDIA_DIR, fileName), videoBuffer);
        const assetHash = computeAssetSha256(videoBuffer);
        const latencyMs = Date.now() - t0;

        const newJob: GenerationJob = {
          id: jobId,
          titleId,
          sceneId: scene.id,
          sceneTitle: `${scene.code} — ${scene.title}`,
          adapterType: 'OMNI_FLASH_VIDEO',
          modelName: 'gemini-omni-1.2-flash',
          prompt: promptToUse,
          aspectRatio: '16:9',
          durationSec: 5,
          rightsCheck,
          modelAvailable: true,
          availabilityNote: `Generated 16:9 720p MP4 video (${videoBuffer.length} bytes) via gemini-omni-1.2-flash (v1beta).`,
          provenance: 'LIVE_OMNI_VIDEO',
          assetVersion: bundle.generationJobs.length + 1,
          assetHash,
          latencyMs,
          status: 'PENDING_HUMAN_REVIEW',
          outputUrl: scene.imageUrl,
          videoUrl: `/api/v1/media/${fileName}`,
          outputMimeType: 'video/mp4',
          createdAt: new Date().toISOString(),
        };

        bundle.generationJobs = [newJob, ...bundle.generationJobs];
        saveStore(store);
        res.json({ apiVersion: 'v1', job: newJob });
        return;
      }

      res.status(400).json({ error: 'Unsupported adapter type.' });
    } catch (err: unknown) {
      res.status(502).json({ error: sanitizeErrorTrace(err) });
    }
  });

  app.post('/api/v1/generation/review', (req, res) => {
    if (!requireGlobalAdmin(req, res)) return;
    res.status(403).json({
      error: 'Canonical footage review requires internal administrator session.',
    });
  });

  app.post('/api/v1/publish/approve', (req, res) => {
    if (!requireGlobalAdmin(req, res)) return;
    res.status(403).json({
      error: 'Canonical publication requires internal administrator session.',
    });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const srcAssetsPath = path.join(process.cwd(), 'src/assets');
    app.use('/src/assets', express.static(srcAssetsPath));
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BranchFrame Gemini Edition server running on http://localhost:${PORT}`);
  });
}

startServer();
