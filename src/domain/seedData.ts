import type {
  BranchProposal,
  GeminiExecutionTrace,
  GenerationJob,
  PublicationRecord,
  RightsManifest,
  StoryDNA,
  StoryGraph,
  TitleBundle,
} from './schemas.ts';
import { computeDeterministicHash, evaluateRightsPolicy } from './rightsEngine.ts';

export const TITANIC_TITLE_ID = 'titanic-1912';
export const LAST_SIGNAL_TITLE_ID = 'the-last-signal';

export const TITANIC_SCENE_IMAGES = {
  scene1: '/src/assets/images/titanic_1912_scene_1_1794651503349.jpg',
  decision: '/src/assets/images/titanic_1912_decision_1794651505459.jpg',
  outcomeCarpathia: '/src/assets/images/titanic_1912_outcome_a_1794651508935.jpg',
  outcomeBulkhead: '/src/assets/images/titanic_1912_outcome_b_adults_1794651772821.jpg',
};

export const TITANIC_VIDEOS = {
  outcomeCarpathia: '/api/v1/media/titanic_outcome_a.mp4',
  outcomeBulkhead: '/api/v1/media/titanic_outcome_b.mp4',
};

export const SCENE_IMAGES = {
  scene1: '/src/assets/images/last_signal_scene_1_1794641862051.jpg',
  decision: '/src/assets/images/last_signal_decision_1794641864781.jpg',
  outcomeBroadcast: '/src/assets/images/last_signal_outcome_broadcast_1794641865584.jpg',
  outcomeQuarantine: '/src/assets/images/last_signal_outcome_quarantine_1794641865244.jpg',
};

export const LAST_SIGNAL_VIDEOS = {
  outcomeBroadcast: '/api/v1/media/last_signal_outcome_a.mp4',
  outcomeQuarantine: '/api/v1/media/last_signal_outcome_b.mp4',
};

// ============================================================================
// FLAGSHIP TITLE: TITANIC 1912 ("One night. One decision. Different futures.")
// ============================================================================

export const TITANIC_SCREENPLAY_TEXT = `TITLE: TITANIC 1912
TAGLINE: One night. One decision. Different futures.
WRITTEN BY: BRANCHFRAME HISTORICAL ORIGINALS
GENRE: HISTORICAL THRILLER / DRAMA
SETTING: RMS TITANIC — NORTH ATLANTIC (41°46'N, 50°14'W) — APRIL 14–15, 1912

[SCENE 01 — INT. MARCONI WIRELESS CABIN & FORWARD CHART ANNEX — 23:40 SHIP'S TIME]
Warm tungsten filaments glow against polished Edwardian mahogany. CLARA VOSS (29), Senior Hydrographic Cartographer & Relief Marconi Telegraphist, logs ice-field warnings from the steamer Mesaba on a North Atlantic chart. A low, resonant shudder vibrates through the steel deck plates as an iceberg shears along the starboard forward hull below the waterline.

JULIAN MERCER (34), Assistant Chief Marine Engineer, enters through the Boat Deck companionway holding a wet brass sounding rod and boiler bulkhead pressure ledger.

JULIAN MERCER
Five forward compartments are breached below the waterline, Clara—from the forepeak tank through Boiler Room Number Six. Freezing Atlantic water is topping the transverse bulkheads at E-Deck. Mathematically, the ship cannot remain afloat past two o'clock.

CLARA VOSS
My chronometer drift calculation shows we are eight nautical miles east-southeast of the dead-reckoning position on the bridge slate. If I cannot transmit our corrected coordinates before the main steam dynamos flood, the RMS Carpathia will steam toward empty ocean.

[SCENE 02 — EXT./INT. BOAT DECK & E-DECK COMPANIONWAY — 00:55 SHIP'S TIME — DECISION POINT]
White steam roars from the towering buff-and-black funnels under a starlit freezing sky. Main dynamo voltage drops; the Marconi spark-gap transmitter flickers. Only one portable 40-ampere Tudor accumulator battery crate and one hydraulic bulkhead ratchet jack remain on the forward Boat Deck staging platform. Below on E-Deck, a jammed watertight ratchet door at Scotland Road traps twenty-four adult third-class passengers and stokers behind rising Atlantic water.

JULIAN MERCER
The Scotland Road bulkhead pawl is jammed on E-Deck! Twenty-four adult passengers and stokers are trapped behind that steel door—if we carry the battery lamp and hydraulic jack down now, we can force the passage open and guide them up the engine-room escape trunk to the aft Boat Deck!

CLARA VOSS
If we take the accumulator crate below, the Marconi spark transmitter dies right now—before Carpathia locks onto our corrected 41°46' North drift bearing! One resource, Julian. Do we power the Carpathia wireless lock and launch Collapsible Boat C, or descend to E-Deck to force the Scotland Road bulkhead?

[CANDIDATE BRANCH POINT — THE 00:55 BOAT DECK & BULKHEAD DILEMMA]
Choice A (The Carpathia Beacon Protocol): Clara and Julian wire the Tudor accumulator crate into the Marconi spark coil, holding the telegraph key until Carpathia confirms the corrected coordinates and launching Collapsible Boat C at 01:40 (Scene 03A — evt:carpathia-spark-transmission, establishing fact:carpathia-coordinates-locked).
Choice B (The Scotland Road Bulkhead Rescue): Clara and Julian haul the accumulator lamp and hydraulic jack down to flooded E-Deck, forcing the jammed watertight door and leading twenty-four trapped adult passengers and stokers up the emergency escape trunk to the aft deck before the ship's final plunge (Scene 03B — evt:e-deck-hydraulic-breach, establishing fact:scotland-road-bulkhead-forced).`;

export const TITANIC_RIGHTS_MANIFEST: RightsManifest = {
  schemaVersion: '1.0.0',
  titleId: TITANIC_TITLE_ID,
  defaultPolicy: 'DENY',
  territories: ['GLOBAL', 'NA', 'EU', 'UK', 'APAC'],
  accessTier: 'FREE_DEMO',
  updatedAt: '2026-11-14T10:25:00.000Z',
  grants: [
    {
      id: 'ttn-grant-ownership-01',
      scope: 'ownership',
      subjectId: `title:${TITANIC_TITLE_ID}`,
      subjectName: 'TITANIC 1912 (Original Historical-Fiction Master IP)',
      rightsholder: 'BranchFrame Historical Originals LLC',
      decision: 'ALLOW',
      licenseRef: 'BF-OWN-TTN-2026-001',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: [
        'Public-domain 1912 historical setting only',
        '100% original fictional characters & dialogue — zero 1997 film IP or third-party media',
      ],
    },
    {
      id: 'ttn-grant-adaptation-02',
      scope: 'adaptation',
      subjectId: `title:${TITANIC_TITLE_ID}`,
      subjectName: 'TITANIC 1912 (Interactive Branching Screenplay)',
      rightsholder: 'BranchFrame Historical Originals LLC',
      decision: 'ALLOW',
      licenseRef: 'BF-ADP-TTN-2026-002',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: [
        'Must preserve immutable historical fact of the April 15, 1912 sinking',
      ],
    },
    {
      id: 'ttn-grant-derivative-03',
      scope: 'derivative_work',
      subjectId: `title:${TITANIC_TITLE_ID}`,
      subjectName: 'TITANIC 1912 (Counterfactual Rescue Outcomes A & B)',
      rightsholder: 'BranchFrame Historical Originals LLC',
      decision: 'ALLOW',
      licenseRef: 'BF-DRV-TTN-2026-003',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: [
        'Requires deterministic Canon DAG validation and authorized supervisor sign-off',
      ],
    },
    {
      id: 'ttn-grant-likeness-clara',
      scope: 'likeness',
      subjectId: 'char:clara-voss',
      subjectName: 'Clara Voss (Fictional Marconi Telegraphist)',
      rightsholder: 'BranchFrame Original Character Digital Release #1912-CV',
      decision: 'ALLOW',
      licenseRef: 'BF-LIK-CLARA-2026',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: [
        'Original synthetic character design — zero real actor likeness used',
      ],
    },
    {
      id: 'ttn-grant-voice-clara',
      scope: 'voice',
      subjectId: 'char:clara-voss',
      subjectName: 'Clara Voss (Voice & Dialogue Track)',
      rightsholder: 'BranchFrame Original Character Voice Release #1912-CV-V',
      decision: 'ALLOW',
      licenseRef: 'BF-VOC-CLARA-2026',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: ['Authorized for TITANIC 1912 interactive playback'],
    },
    {
      id: 'ttn-grant-likeness-julian',
      scope: 'likeness',
      subjectId: 'char:julian-mercer',
      subjectName: 'Julian Mercer (Fictional Assistant Chief Engineer)',
      rightsholder: 'BranchFrame Original Character Digital Release #1912-JM',
      decision: 'ALLOW',
      licenseRef: 'BF-LIK-JULIAN-2026',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: [
        'Original synthetic character design — zero real actor likeness used',
      ],
    },
    {
      id: 'ttn-grant-voice-julian',
      scope: 'voice',
      subjectId: 'char:julian-mercer',
      subjectName: 'Julian Mercer (Voice & Dialogue Track)',
      rightsholder: 'BranchFrame Original Character Voice Release #1912-JM-V',
      decision: 'ALLOW',
      licenseRef: 'BF-VOC-JULIAN-2026',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: ['Authorized for TITANIC 1912 interactive playback'],
    },
  ],
};

export const TITANIC_STORY_DNA: StoryDNA = {
  schemaVersion: '1.0.0',
  titleId: TITANIC_TITLE_ID,
  screenplayTitle: 'TITANIC 1912',
  logline:
    'As the RMS Titanic founders in the North Atlantic, a hydrographic cartographer and a marine engineer must decide how to spend their last reserve battery: power the Marconi wireless to guide the Carpathia to their true position or descend into the flooding E-Deck to free twenty-four trapped souls.',
  compiledAt: '2026-11-14T10:26:01.000Z',
  compilerModel: 'gemini-4-hydrogen',
  provenance: 'LIVE_GEMINI',
  latencyMs: 9018,
  characters: [
    {
      id: 'char:clara-voss',
      name: 'Clara Voss',
      role: 'Senior Hydrographic Cartographer & Relief Marconi Telegraphist',
      motivation:
        'Transmit the corrected 8-nautical-mile east-southeast chronometer drift coordinates to RMS Carpathia before the main steam dynamos fail.',
      initialKnowledgeFactIds: [
        'fact:rms-titanic-founders-1912',
        'fact:chronometer-drift-offset',
      ],
      voiceProfile: 'Composed, precise British-Continental cadence under extreme urgency',
      likenessProtected: true,
    },
    {
      id: 'char:julian-mercer',
      name: 'Julian Mercer',
      role: 'Assistant Chief Marine Engineer',
      motivation:
        'Hold open the jammed E-Deck Scotland Road watertight passage long enough to evacuate the twenty-four adult third-class passengers and stokers before Boiler Room No. 4 floods.',
      initialKnowledgeFactIds: [
        'fact:rms-titanic-founders-1912',
        'fact:five-compartments-breached',
      ],
      voiceProfile: 'Resonant Belfast engineering baritone, pragmatic and resolute',
      likenessProtected: true,
    },
  ],
  canonicalFacts: [
    {
      id: 'fact:rms-titanic-founders-1912',
      statement:
        'With five forward watertight compartments breached below the waterline, the RMS Titanic inevitably founders in the North Atlantic at 02:20 Ship Time on April 15, 1912.',
      category: 'WORLD_RULE',
      immutable: true,
      contradictsFactIds: [],
    },
    {
      id: 'fact:five-compartments-breached',
      statement:
        'Iceberg impact at 23:40 opened hull plates from the forepeak tank through Boiler Room No. 6, causing water to spill over the E-Deck transverse bulkhead tops.',
      category: 'TECHNICAL_CONSTRAINT',
      immutable: true,
      contradictsFactIds: [],
    },
    {
      id: 'fact:chronometer-drift-offset',
      statement:
        'Clara Voss calculated that Labrador Current ice drift placed the ship eight nautical miles east-southeast of the initial bridge dead-reckoning distress slate.',
      category: 'CHARACTER_SECRET',
      immutable: true,
      contradictsFactIds: [],
    },
    {
      id: 'fact:auxiliary-battery-staged',
      statement:
        'A single portable 40-ampere Tudor accumulator crate and hydraulic bulkhead jack are staged on the forward Boat Deck at 00:55 as main steam dynamo voltage drops.',
      category: 'PLOT_FACT',
      immutable: false,
      contradictsFactIds: [],
    },
    {
      id: 'fact:carpathia-coordinates-locked',
      statement:
        'The auxiliary accumulator powered the Marconi spark transmitter until RMS Carpathia confirmed the corrected 41°46 N, 50°14 W drift coordinates, cutting dawn rescue intercept time by 35 minutes.',
      category: 'PLOT_FACT',
      immutable: false,
      contradictsFactIds: ['fact:scotland-road-bulkhead-forced'],
    },
    {
      id: 'fact:scotland-road-bulkhead-forced',
      statement:
        'The auxiliary accumulator lamp and hydraulic jack were carried to flooded E-Deck, forcing open the Scotland Road bulkhead and evacuating twenty-four trapped adult passengers and stokers to the aft deck.',
      category: 'PLOT_FACT',
      immutable: false,
      contradictsFactIds: ['fact:carpathia-coordinates-locked'],
    },
  ],
  causalEvents: [
    {
      id: 'evt:starboard-ice-shear',
      title: 'Starboard Ice Shear & Sounding Rod Inspection',
      sceneId: 'ttn-01-impact',
      timestampCode: '23:40:00',
      description:
        'Julian Mercer reports five flooded forward compartments to Clara Voss in the Marconi Chart Annex while Clara identifies the 8-mile chronometer drift offset.',
      causesEventIds: ['evt:dynamo-drop-dilemma'],
      dependsOnEventIds: [],
      establishedFactIds: [
        'fact:rms-titanic-founders-1912',
        'fact:five-compartments-breached',
        'fact:chronometer-drift-offset',
      ],
      characterKnowledgeGained: [
        { characterId: 'char:clara-voss', factId: 'fact:five-compartments-breached' },
        { characterId: 'char:julian-mercer', factId: 'fact:chronometer-drift-offset' },
      ],
    },
    {
      id: 'evt:dynamo-drop-dilemma',
      title: 'The 00:55 Boat Deck & Bulkhead Resource Dilemma',
      sceneId: 'ttn-02-decision',
      timestampCode: '00:55:00',
      description:
        'As main steam dynamo pressure drops, Clara and Julian must allocate the sole portable Tudor accumulator battery crate and hydraulic jack between the Marconi cabin and flooded E-Deck.',
      causesEventIds: ['evt:carpathia-spark-transmission', 'evt:e-deck-hydraulic-breach'],
      dependsOnEventIds: ['evt:starboard-ice-shear'],
      establishedFactIds: ['fact:auxiliary-battery-staged'],
      characterKnowledgeGained: [
        { characterId: 'char:clara-voss', factId: 'fact:auxiliary-battery-staged' },
        { characterId: 'char:julian-mercer', factId: 'fact:auxiliary-battery-staged' },
      ],
    },
    {
      id: 'evt:carpathia-spark-transmission',
      title: 'Outcome A: Carpathia Drift Beacon & Collapsible C Launch',
      sceneId: 'ttn-03a-carpathia',
      timestampCode: '01:40:00',
      description:
        'Clara transmits the corrected drift coordinates under high-voltage spark discharge until Carpathia confirms lock, then boards Collapsible Boat C as distress rockets illuminate the Atlantic.',
      causesEventIds: [],
      dependsOnEventIds: ['evt:dynamo-drop-dilemma'],
      establishedFactIds: ['fact:carpathia-coordinates-locked'],
      characterKnowledgeGained: [
        { characterId: 'char:clara-voss', factId: 'fact:carpathia-coordinates-locked' },
        { characterId: 'char:julian-mercer', factId: 'fact:carpathia-coordinates-locked' },
      ],
    },
    {
      id: 'evt:e-deck-hydraulic-breach',
      title: 'Outcome B: Scotland Road Bulkhead Rescue on Flooded E-Deck',
      sceneId: 'ttn-03b-bulkhead',
      timestampCode: '01:42:00',
      description:
        'Julian and Clara brace the hydraulic jack against the jammed E-Deck watertight frame in ankle-deep freezing water, evacuating twenty-four adult third-class passengers and stokers up the escape trunk.',
      causesEventIds: [],
      dependsOnEventIds: ['evt:dynamo-drop-dilemma'],
      establishedFactIds: ['fact:scotland-road-bulkhead-forced'],
      characterKnowledgeGained: [
        { characterId: 'char:clara-voss', factId: 'fact:scotland-road-bulkhead-forced' },
        { characterId: 'char:julian-mercer', factId: 'fact:scotland-road-bulkhead-forced' },
      ],
    },
  ],
  narrativeConstraints: [
    {
      id: 'ttn-const-01',
      rule: 'Historical Canon Invariant: The RMS Titanic must founder on April 15, 1912 in all branches; branches alter human rescue outcomes and telemetry accuracy, never the sinking itself.',
      severity: 'HARD_CANON',
      enforcedByValidator: true,
    },
    {
      id: 'ttn-const-02',
      rule: 'Mutual Exclusivity: A single playthrough cannot both power the Marconi spark coil to lock Carpathia coordinates (fact:carpathia-coordinates-locked) and carry the accumulator below to force the Scotland Road bulkhead (fact:scotland-road-bulkhead-forced).',
      severity: 'HARD_CANON',
      enforcedByValidator: true,
    },
    {
      id: 'ttn-const-03',
      rule: 'IP & Likeness Purity: Zero characters, dialogue, music, or actor likenesses from the 1997 film may appear in any branch.',
      severity: 'RIGHTS_BOUNDARY',
      enforcedByValidator: true,
    },
  ],
  candidateBranchPoints: [
    {
      id: 'bp-titanic-0055',
      sceneId: 'ttn-02-decision',
      title: 'The 00:55 Boat Deck & Bulkhead Dilemma',
      dramaticQuestion:
        'Will Clara Voss and Julian Mercer use the last portable Tudor accumulator crate to lock the RMS Carpathia onto corrected drift coordinates, or descend to flooded E-Deck to pry open the jammed Scotland Road bulkhead trapping twenty-four adults?',
      triggerEventId: 'evt:dynamo-drop-dilemma',
      stakes:
        'Precision wireless rescue intercept for all lifeboats at dawn versus immediate physical liberation of twenty-four trapped adult passengers and stokers below deck.',
      suggestedAlternatives: [
        'Outcome A: The Carpathia Beacon Protocol — Wire the accumulator into the Marconi spark coil, lock Carpathia onto corrected coordinates, and launch Collapsible Boat C.',
        'Outcome B: The Scotland Road Bulkhead Rescue — Descend to flooded E-Deck with the hydraulic jack and accumulator lamp to free twenty-four trapped adult passengers and stokers.',
      ],
    },
  ],
};

export const TITANIC_STORY_GRAPH: StoryGraph = {
  schemaVersion: '1.0.0',
  titleId: TITANIC_TITLE_ID,
  versionNumber: 1,
  entrySceneId: 'ttn-01-impact',
  publishedChoiceIds: ['ttn-choice-a-wireless', 'ttn-choice-b-bulkhead'],
  lastPublishedAt: '2026-11-14T10:25:58.000Z',
  approvedByHuman: 'Clara Voss — Historical Story & Rights Supervisor',
  architectureCapabilities: {
    maxSupportedDecisions: 3,
    maxSupportedEndings: 4,
    multiTitleReady: true,
    deterministicRouting: true,
  },
  scenes: [
    {
      id: 'ttn-01-impact',
      code: 'SCN-01',
      title: 'The Starlight Shear at 23:40',
      act: 'ACT_I',
      synopsis:
        'In the mahogany Marconi Chart Annex aboard RMS Titanic at 23:40, a low shudder vibrates through the forward hull. Assistant Chief Engineer Julian Mercer brings a wet brass sounding rod confirming five flooded forward compartments, while cartographer Clara Voss discovers an 8-mile chronometer drift offset.',
      location: 'INT. MARCONI WIRELESS CABIN & CHART ANNEX — BOAT DECK',
      timecode: '23:40:12:00',
      durationSec: 16,
      imageUrl: TITANIC_SCENE_IMAGES.scene1,
      mediaProvenance: 'STORYBOARD_DEMO',
      assetHash: 'bf-asset-ttn01-88c1a042',
      audioMood: 'TENSION_PULSE',
      charactersPresent: ['char:clara-voss', 'char:julian-mercer'],
      requiredPriorEventIds: [],
      requiredFactIds: [],
      establishesFactIds: [
        'fact:rms-titanic-founders-1912',
        'fact:five-compartments-breached',
        'fact:chronometer-drift-offset',
      ],
      establishesEventIds: ['evt:starboard-ice-shear'],
      characterKnowledgeRequired: [
        {
          characterId: 'char:clara-voss',
          factId: 'fact:chronometer-drift-offset',
          reason: 'Clara calculated the Labrador Current drift offset on her hydrographic chart.',
        },
      ],
      characterKnowledgeGained: [
        { characterId: 'char:clara-voss', factId: 'fact:five-compartments-breached' },
        { characterId: 'char:julian-mercer', factId: 'fact:chronometer-drift-offset' },
      ],
      dialogue: [
        {
          speaker: 'JULIAN MERCER',
          characterId: 'char:julian-mercer',
          delivery: 'Holding the wet brass sounding rod by the frosted porthole',
          line: 'Five forward compartments are breached below the waterline, Clara—from the forepeak tank through Boiler Room Six. The ship cannot stay afloat past two o’clock.',
          startSec: 0,
          endSec: 6,
        },
        {
          speaker: 'CLARA VOSS',
          characterId: 'char:clara-voss',
          delivery: 'Marking the North Atlantic hydrographic chart beside the cyan spark coil',
          line: 'My chronometer drift fix puts us eight nautical miles east-southeast of the bridge slate. If we don’t transmit the corrected bearing before the dynamos flood, Carpathia will steam toward empty water.',
          startSec: 6,
          endSec: 12,
        },
        {
          speaker: 'JULIAN MERCER',
          characterId: 'char:julian-mercer',
          delivery: 'Looking toward the Boat Deck companionway',
          line: 'Main steam pressure in Boiler Room Four is already dropping. Bring the auxiliary battery log—we have minutes before the forward deck tilts.',
          startSec: 12,
          endSec: 16,
        },
      ],
      choices: [
        {
          id: 'ttn-choice-to-decision',
          label: '01. Step onto the Freezing Boat Deck (00:55)',
          subtitle: 'Stage the auxiliary Tudor battery crate and hydraulic bulkhead jack.',
          targetSceneId: 'ttn-02-decision',
          consequenceSummary:
            'Advances to the central 00:55 Boat Deck & E-Deck Bulkhead decision.',
          requiredRightsScopes: ['ownership', 'adaptation'],
          setsFactIds: ['fact:auxiliary-battery-staged'],
          isPublished: true,
        },
      ],
      isEnding: false,
    },
    {
      id: 'ttn-02-decision',
      code: 'SCN-02',
      title: 'The 00:55 Boat Deck & Bulkhead Dilemma',
      act: 'DECISION_POINT',
      synopsis:
        'Under towering steam vents on the starlit Boat Deck, main dynamo voltage collapses. Only one portable Tudor accumulator battery crate and hydraulic jack remain. Clara and Julian must choose between powering the Marconi spark transmitter to lock RMS Carpathia onto the true drift coordinates, or descending to flooded E-Deck to pry open the jammed Scotland Road bulkhead trapping twenty-four adults.',
      location: 'EXT. FORWARD BOAT DECK DAVITS & E-DECK STAIRWELL',
      timecode: '00:55:00:00',
      durationSec: 18,
      imageUrl: TITANIC_SCENE_IMAGES.decision,
      mediaProvenance: 'STORYBOARD_DEMO',
      assetHash: 'bf-asset-ttn02-92b4d118',
      audioMood: 'DECISION_HEARTBEAT',
      charactersPresent: ['char:clara-voss', 'char:julian-mercer'],
      requiredPriorEventIds: ['evt:starboard-ice-shear'],
      requiredFactIds: [
        'fact:five-compartments-breached',
        'fact:chronometer-drift-offset',
      ],
      establishesFactIds: ['fact:auxiliary-battery-staged'],
      establishesEventIds: ['evt:dynamo-drop-dilemma'],
      characterKnowledgeRequired: [
        {
          characterId: 'char:clara-voss',
          factId: 'fact:five-compartments-breached',
          reason: 'Julian briefed Clara on the five breached compartments in Scene 01.',
        },
        {
          characterId: 'char:julian-mercer',
          factId: 'fact:chronometer-drift-offset',
          reason: 'Clara showed Julian the 8-nautical-mile drift offset in Scene 01.',
        },
      ],
      characterKnowledgeGained: [
        { characterId: 'char:clara-voss', factId: 'fact:auxiliary-battery-staged' },
        { characterId: 'char:julian-mercer', factId: 'fact:auxiliary-battery-staged' },
      ],
      dialogue: [
        {
          speaker: 'JULIAN MERCER',
          characterId: 'char:julian-mercer',
          delivery: 'Shouting over the roar of white funnel steam on the Boat Deck',
          line: 'The Scotland Road watertight pawl is jammed on E-Deck! Twenty-four adult passengers and stokers are trapped behind that steel door—if we haul the battery lamp and hydraulic jack down now, we can force it open!',
          startSec: 0,
          endSec: 7,
        },
        {
          speaker: 'CLARA VOSS',
          characterId: 'char:clara-voss',
          delivery: 'Hand on the brass emergency battery crate beside Lifeboat No. 12',
          line: 'If we disconnect this accumulator crate, the Marconi spark coil goes dead before Carpathia confirms our 41°46′ North drift coordinates!',
          startSec: 7,
          endSec: 13,
        },
        {
          speaker: 'JULIAN MERCER',
          characterId: 'char:julian-mercer',
          delivery: 'Locking eyes with Clara as a distress rocket fires overhead',
          line: 'One battery crate, Clara. Lock the Carpathia wireless beacon for the lifeboat fleet, or come below with me to breach Scotland Road. Decide now!',
          startSec: 13,
          endSec: 18,
        },
      ],
      choices: [
        {
          id: 'ttn-choice-a-wireless',
          label: 'Outcome A: Execute Carpathia Beacon Protocol',
          subtitle:
            'Route the auxiliary battery to the Marconi spark coil, lock Carpathia onto corrected coordinates, and launch Collapsible C.',
          targetSceneId: 'ttn-03a-carpathia',
          consequenceSummary:
            'Carpathia locks onto the exact 8-mile drift offset and arrives 35 minutes earlier at dawn; E-Deck bulkhead remains sealed.',
          requiredRightsScopes: [
            'ownership',
            'adaptation',
            'derivative_work',
            'likeness',
            'voice',
          ],
          setsFactIds: ['fact:carpathia-coordinates-locked'],
          isPublished: true,
        },
        {
          id: 'ttn-choice-b-bulkhead',
          label: 'Outcome B: Execute Scotland Road Bulkhead Rescue',
          subtitle:
            'Haul the battery lamp and hydraulic jack down to flooded E-Deck to pry open the jammed steel door and free twenty-four adults.',
          targetSceneId: 'ttn-03b-bulkhead',
          consequenceSummary:
            'Twenty-four trapped adult passengers and stokers escape up the engine-room trunk to the aft deck; Marconi transmitter goes silent early.',
          requiredRightsScopes: [
            'ownership',
            'adaptation',
            'derivative_work',
            'likeness',
            'voice',
          ],
          setsFactIds: ['fact:scotland-road-bulkhead-forced'],
          isPublished: true,
        },
      ],
      isEnding: false,
    },
    {
      id: 'ttn-03a-carpathia',
      code: 'SCN-03A',
      title: 'Outcome A: The Carpathia Beacon Protocol',
      act: 'OUTCOME_BRANCH',
      synopsis:
        'Inside the steeply listing mahogany Marconi cabin, electric cyan sparks arc across the brass telegraph key as Clara Voss transmits the corrected 41°46′N, 50°14′W drift bearing until RMS Carpathia taps back "R-R-R COPY DIRECT." Outside the open cabin doorway, Julian helps lower Collapsible Boat C into the starlit Atlantic as white distress rockets illuminate the horizon.',
      location: 'INT./EXT. LISTING MARCONI CABIN & FORWARD DAVITS — 01:40',
      timecode: '01:40:15:00',
      durationSec: 16,
      imageUrl: TITANIC_SCENE_IMAGES.outcomeCarpathia,
      videoUrl: TITANIC_VIDEOS.outcomeCarpathia,
      mediaProvenance: 'LIVE_OMNI_VIDEO',
      assetHash: 'bf-sha256-85e94c755d0d73e3',
      audioMood: 'CYAN_HORIZON',
      charactersPresent: ['char:clara-voss', 'char:julian-mercer'],
      requiredPriorEventIds: ['evt:starboard-ice-shear', 'evt:dynamo-drop-dilemma'],
      requiredFactIds: ['fact:carpathia-coordinates-locked'],
      establishesFactIds: ['fact:carpathia-coordinates-locked'],
      establishesEventIds: ['evt:carpathia-spark-transmission'],
      characterKnowledgeRequired: [
        {
          characterId: 'char:clara-voss',
          factId: 'fact:carpathia-coordinates-locked',
          reason: 'Clara personally keyed the corrected drift bearing to Carpathia.',
        },
      ],
      characterKnowledgeGained: [],
      dialogue: [
        {
          speaker: 'CLARA VOSS',
          characterId: 'char:clara-voss',
          delivery: 'Bracing against the tilted mahogany desk as blue-cyan sparks crackle',
          line: 'Carpathia Operator Cottam confirms our corrected 41°46′ North, 50°14′ West drift fix! Their engines are at flank speed—they will reach our boats thirty-five minutes ahead of dawn!',
          startSec: 0,
          endSec: 8,
        },
        {
          speaker: 'JULIAN MERCER',
          characterId: 'char:julian-mercer',
          delivery: 'Holding the open cabin doorway as Collapsible Boat C swings over the dark water',
          line: 'The accumulator cells are spent and the forward well deck is awash, Clara. Step into Collapsible C—your signal just saved every lifeboat on the water.',
          startSec: 8,
          endSec: 16,
        },
      ],
      choices: [],
      isEnding: true,
      endingType: 'CANON_A',
      endingThematicTag:
        'ENDING A — THE CARPATHIA DRIFT LOCK (PRECISION TELEMETRY SALVATION)',
    },
    {
      id: 'ttn-03b-bulkhead',
      code: 'SCN-03B',
      title: 'Outcome B: The Scotland Road Bulkhead Rescue',
      act: 'OUTCOME_BRANCH',
      synopsis:
        'Waist-deep in freezing Atlantic water inside the tilting E-Deck Scotland Road corridor, Julian Mercer and Clara Voss brace the iron hydraulic jack against the jammed steel watertight frame. Under flickering amber emergency cage lamps, twenty-four adult third-class passengers and stokers climb up the vertical iron engine-room escape ladder to the aft Boat Deck before the ship’s final plunge.',
      location: 'INT. FLOODED E-DECK SCOTLAND ROAD BULKHEAD & ESCAPE TRUNK — 01:42',
      timecode: '01:42:08:00',
      durationSec: 16,
      imageUrl: TITANIC_SCENE_IMAGES.outcomeBulkhead,
      videoUrl: TITANIC_VIDEOS.outcomeBulkhead,
      mediaProvenance: 'LIVE_OMNI_VIDEO',
      assetHash: 'bf-sha256-5aaf421b9cd0caa2',
      audioMood: 'QUARANTINE_DRONE',
      charactersPresent: ['char:clara-voss', 'char:julian-mercer'],
      requiredPriorEventIds: ['evt:starboard-ice-shear', 'evt:dynamo-drop-dilemma'],
      requiredFactIds: ['fact:scotland-road-bulkhead-forced'],
      establishesFactIds: ['fact:scotland-road-bulkhead-forced'],
      establishesEventIds: ['evt:e-deck-hydraulic-breach'],
      characterKnowledgeRequired: [
        {
          characterId: 'char:julian-mercer',
          factId: 'fact:scotland-road-bulkhead-forced',
          reason: 'Julian operated the hydraulic jack that forced the E-Deck bulkhead.',
        },
      ],
      characterKnowledgeGained: [],
      dialogue: [
        {
          speaker: 'JULIAN MERCER',
          characterId: 'char:julian-mercer',
          delivery: 'Straining against the iron hydraulic lever in swirling dark water',
          line: 'The pawl is clear—nineteen inches of clearance! Keep moving up the turbine casing ladder to the aft poop deck, every last one of you!',
          startSec: 0,
          endSec: 8,
        },
        {
          speaker: 'CLARA VOSS',
          characterId: 'char:clara-voss',
          delivery: 'Holding the emergency battery lantern high as the last stoker reaches the upper rung',
          line: 'All twenty-four are through the hatch, Julian! The wireless room above is dark, but twenty-four souls are breathing on the aft deck because we came below.',
          startSec: 8,
          endSec: 16,
        },
      ],
      choices: [],
      isEnding: true,
      endingType: 'ALTERNATE_B',
      endingThematicTag:
        'ENDING B — THE SCOTLAND ROAD BREACH (DIRECT HUMAN DELIVERANCE)',
    },
  ],
};

export const TITANIC_BRANCH_PROPOSALS: BranchProposal[] = [
  {
    schemaVersion: '1.0.0',
    id: 'proposal-ttn-optical-morse',
    branchPointId: 'bp-titanic-0055',
    sourceSceneId: 'ttn-02-decision',
    choiceLabel: 'Outcome C: Bridge Morse Lamp & Boiler Steam Vent Relay',
    choiceSubtitle:
      'Split the crew: Julian takes the hydraulic jack to E-Deck in darkness while Clara climbs to the bridge wing with a hand-cranked Aldis signal lamp.',
    synopsis:
      'Clara uses the bridge Aldis lamp to flash visual Morse coordinates toward the horizon while Julian attempts to pry the E-Deck bulkhead by boiler pressure gauge light alone.',
    endingThematicTag: 'ENDING C — THE ALDIS LANTERN GAMBIT (PROPOSED DRAFT)',
    causalConsequences: [
      'Preserves historical fact fact:rms-titanic-founders-1912.',
      'Replaces high-power Marconi spark lock with line-of-sight optical Morse signaling.',
      'Requires Julian to breach the E-Deck bulkhead without electric floodlights.',
    ],
    downstreamEventChanges: [
      {
        originalEventId: 'evt:carpathia-spark-transmission',
        changeType: 'MODIFIED',
        newDescription:
          'Clara flashes optical Morse signals from the starboard bridge wing instead of high-voltage wireless telegraphy.',
      },
      {
        originalEventId: 'evt:e-deck-hydraulic-breach',
        changeType: 'MODIFIED',
        newDescription:
          'Julian operates the hydraulic jack by dim boiler pressure gauge glow.',
      },
    ],
    newSceneDraft: {
      code: 'SCN-03C',
      title: 'Outcome C: The Bridge Wing Aldis Relay',
      location: 'EXT. STARBOARD BRIDGE WING — RMS TITANIC',
      durationSec: 15,
      charactersPresent: ['char:clara-voss', 'char:julian-mercer'],
      establishesFactIds: ['fact:scotland-road-bulkhead-forced'],
      dialogue: [
        {
          speaker: 'CLARA VOSS',
          characterId: 'char:clara-voss',
          delivery: 'Keying the brass Aldis shutter toward the northern horizon',
          line: 'Take the hydraulic jack below, Julian—I will key the drift fix by optical shutter from the bridge wing until the water reaches the rail!',
          startSec: 0,
          endSec: 8,
        },
        {
          speaker: 'JULIAN MERCER',
          characterId: 'char:julian-mercer',
          delivery: 'Shouldering the iron ratchet jack at the companionway hatch',
          line: 'Meet me at the aft boat deck davits when the last stoker clears the trunk!',
          startSec: 8,
          endSec: 15,
        },
      ],
      visualPrompt:
        'Anamorphic 35mm historical film still on the starboard bridge wing of a 1912 liner at night, female telegraphist keying a bright brass Aldis signal lamp into the mist.',
    },
    createdAt: '2026-11-14T10:25:56.000Z',
    plannerModel: 'gemini-4-hydrogen',
    provenance: 'LIVE_GEMINI',
    latencyMs: 5890,
    status: 'VALIDATED',
  },
];

const titanicRightsAudit = evaluateRightsPolicy(TITANIC_RIGHTS_MANIFEST, {
  operation: 'GENERATE_FOOTAGE',
  titleId: TITANIC_TITLE_ID,
  characterIds: ['char:clara-voss', 'char:julian-mercer'],
  evaluationTimeIso: '2026-11-14T10:25:00.000Z',
});

export const TITANIC_GENERATION_JOBS: GenerationJob[] = [
  {
    id: 'job-ttn03a-video',
    titleId: TITANIC_TITLE_ID,
    sceneId: 'ttn-03a-carpathia',
    sceneTitle: 'SCN-03A — Outcome A: The Carpathia Beacon Protocol',
    adapterType: 'OMNI_FLASH_VIDEO',
    modelName: 'gemini-omni-1.2-flash',
    prompt:
      'Animate this 1912 historical drama frame: inside the listing mahogany Marconi wireless cabin, bright cyan-blue electric sparks crackle from the brass telegraph key as Clara Voss transmits final distress coordinates, while outside the open doorway Collapsible Boat C lowers smoothly toward the starlit North Atlantic ocean as white distress rockets bloom in the night sky.',
    aspectRatio: '16:9',
    durationSec: 5,
    rightsCheck: titanicRightsAudit,
    modelAvailable: true,
    availabilityNote:
      'Generated 16:9 720p MP4 motion video (3,989,582 bytes) via gemini-omni-1.2-flash (v1beta Interactions API) from approved reference plate. Verified & approved for playback.',
    provenance: 'LIVE_OMNI_VIDEO',
    assetVersion: 1,
    assetHash: 'bf-sha256-85e94c755d0d73e3',
    latencyMs: 24500,
    status: 'APPROVED',
    outputUrl: TITANIC_SCENE_IMAGES.outcomeCarpathia,
    videoUrl: TITANIC_VIDEOS.outcomeCarpathia,
    outputMimeType: 'video/mp4',
    reviewerName: 'Clara Voss — Historical Story & Rights Supervisor',
    reviewedAt: '2026-11-14T10:25:30.000Z',
    reviewNotes:
      'Approved live gemini-omni-1.2-flash MP4 motion sequence. Verified historical continuity, wardrobe consistency, and zero 1997 film IP.',
    createdAt: '2026-11-14T10:21:00.000Z',
  },
  {
    id: 'job-ttn03b-video',
    titleId: TITANIC_TITLE_ID,
    sceneId: 'ttn-03b-bulkhead',
    sceneTitle: 'SCN-03B — Outcome B: The Scotland Road Bulkhead Rescue',
    adapterType: 'OMNI_FLASH_VIDEO',
    modelName: 'gemini-omni-1.2-flash',
    prompt:
      'Animate this 1912 historical drama frame: inside the flooded steel E-Deck Scotland Road corridor, ankle-deep dark Atlantic water ripples under amber emergency cage lamps as engineer Julian Mercer and Clara Voss hold open the heavy steel bulkhead door with an iron hydraulic jack while adult stokers and adult third-class passengers climb up the iron escape ladder to safety.',
    aspectRatio: '16:9',
    durationSec: 5,
    rightsCheck: titanicRightsAudit,
    modelAvailable: true,
    availabilityNote:
      'Generated 16:9 720p MP4 motion video (3,605,187 bytes) via gemini-omni-1.2-flash (v1beta Interactions API, ID v1_Chd2RGI0YXRuREw4V1prZFVQcE1EZjJBYxIXdkRiNGF0bkRMOFdaa2RVUHBNRGYyQWM). Verified & approved for playback.',
    provenance: 'LIVE_OMNI_VIDEO',
    assetVersion: 1,
    assetHash: 'bf-sha256-5aaf421b9cd0caa2',
    latencyMs: 28774,
    status: 'APPROVED',
    outputUrl: TITANIC_SCENE_IMAGES.outcomeBulkhead,
    videoUrl: TITANIC_VIDEOS.outcomeBulkhead,
    outputMimeType: 'video/mp4',
    reviewerName: 'Clara Voss — Historical Story & Rights Supervisor',
    reviewedAt: '2026-11-14T10:25:45.000Z',
    reviewNotes:
      'Approved live gemini-omni-1.2-flash MP4 motion sequence. Verified adult-only cast, historical bulkhead mechanics, and Rights-as-Code clearance.',
    createdAt: '2026-11-14T10:23:30.000Z',
  },
];

export const TITANIC_PUBLICATION_RECORDS: PublicationRecord[] = [
  {
    id: 'pub-ttn-v1',
    titleId: TITANIC_TITLE_ID,
    versionNumber: 1,
    approvedBy: 'Clara Voss',
    role: 'Historical Story & Rights Supervisor',
    notes:
      'Flagship Mission 03 release of TITANIC 1912. Live Gemini 4 Hydrogen Story DNA & Branch Proposal + Live Gemini Omni 1.2 Flash MP4 motion video outcomes A & B + deterministic Canon & Rights-as-Code verification.',
    rightsVerified: true,
    canonVerified: true,
    approvedJobIds: ['job-ttn03a-video', 'job-ttn03b-video'],
    publishedAt: '2026-11-14T10:25:58.000Z',
    deterministicHash: computeDeterministicHash('titanic-1912:v1:live-omni-video'),
    rightsSnapshotHash: titanicRightsAudit.auditHash,
    assetHashes: {
      'ttn-01-impact': 'bf-asset-ttn01-88c1a042',
      'ttn-02-decision': 'bf-asset-ttn02-92b4d118',
      'ttn-03a-carpathia': 'bf-sha256-85e94c755d0d73e3',
      'ttn-03b-bulkhead': 'bf-sha256-5aaf421b9cd0caa2',
    },
    playbackMode: 'HYBRID_CINEMA',
  },
];

// ============================================================================
// TECHNICAL REFERENCE TITLE: THE LAST SIGNAL
// ============================================================================

export const INITIAL_SCREENPLAY_TEXT = `TITLE: THE LAST SIGNAL
WRITTEN BY: BRANCHFRAME ORIGINAL PRODUCTIONS
GENRE: TECHNOLOGY THRILLER
SETTING: MERIDIAN-9 DEEP-ORBITAL & ACOUSTIC LISTENING BUNKER — SVALBARD RIDGE

[SCENE 01 — INT. MERIDIAN-9 ACOUSTIC SHIELDED BAY — 03:14 UTC]
Blue-violet spectral lines pulse across curved optical glass. DR. ELENA VANCE (38), Chief Signal Cryptographer, isolates a narrowband 1.420 GHz carrier wave originating from the decommissioned Helios-IV relay satellite—a satellite that burned up on atmospheric re-entry eleven years ago.

ELENA VANCE
(adjusting phase array)
It's not telemetry echo. The packet header is signed with my own cryptographic key—dated forty-eight hours from now.

Behind her, DIRECTOR MARCUS THORNE (54), National Signal Directorate Overseer, steps through the biometric airlock holding a crimson physical Faraday interlock key.

MARCUS THORNE
Helios-IV is debris at the bottom of the Pacific, Elena. Whatever is spoofing that transponder is already inside our orbital clock network.

ELENA VANCE
Look at the payload structure, Marcus. It's a deterministic planetary grid patch. If the solar flare hits at 03:20 UTC without this patch, every synchronous power transformer on the northern hemisphere cascades into failure.

[SCENE 02 — INT. DUAL-KEY OVERRIDE CONSOLE — 03:17 UTC — CONVERGENCE & DECISION POINT]
Alarms chime in low harmonic intervals. On the central CRT scope, the carrier wave begins a 90-second decay cycle. Two physical routing switches sit armed on the Meridian-9 console:
- ROUTE ALPHA: Open Horizon Uplink (Broadcasts the unverified patch directly to all civil orbital relays).
- ROUTE BETA: Faraday Cryo-Lock (Diverts and traps the anomalous signal inside Meridian-9's air-gapped cryogenic memory core, cutting off outside transmission).

MARCUS THORNE
If that payload is a weaponized logic bomb disguised as a grid patch, broadcasting it hands the entire civil infrastructure to an unknown actor. Seal it in the cryo-core!

ELENA VANCE
And if the telemetry warning is authentic, locking it in the vault guarantees a continental blackout in three minutes. The key is in the console. One route survives.

[CANDIDATE BRANCH POINT — THE MERIDIAN OVERRIDE]
Choice A (Open Horizon Protocol): Elena overrides Thorne's lockdown and routes the carrier wave to the global civil dish array (Scene 03A — evt:global-uplink-executed, establishing fact:signal-broadcast-globally).
Choice B (Faraday Containment Protocol): Elena engages the blast doors and isolates the signal inside the subterranean cryogenic core (Scene 03B — evt:cryo-vault-sealed, establishing fact:signal-quarantined-in-vault).`;

export const INITIAL_RIGHTS_MANIFEST: RightsManifest = {
  schemaVersion: '1.0.0',
  titleId: LAST_SIGNAL_TITLE_ID,
  defaultPolicy: 'DENY',
  territories: ['GLOBAL', 'NA', 'EU', 'APAC'],
  accessTier: 'FREE_DEMO',
  updatedAt: '2026-11-14T10:25:00.000Z',
  grants: [
    {
      id: 'grant-ownership-01',
      scope: 'ownership',
      subjectId: `title:${LAST_SIGNAL_TITLE_ID}`,
      subjectName: 'THE LAST SIGNAL (Master IP)',
      rightsholder: 'Meridian Pictures & BranchFrame Originals LLC',
      decision: 'ALLOW',
      licenseRef: 'BF-OWN-2026-001',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: ['Chain-of-title verified', 'Original work — zero 3P copyrighted media'],
    },
    {
      id: 'grant-adaptation-02',
      scope: 'adaptation',
      subjectId: `title:${LAST_SIGNAL_TITLE_ID}`,
      subjectName: 'THE LAST SIGNAL (Interactive Screenplay)',
      rightsholder: 'Meridian Pictures & BranchFrame Originals LLC',
      decision: 'ALLOW',
      licenseRef: 'BF-ADP-2026-002',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: ['Interactive branching permitted up to 3 decision nodes & 4 endings'],
    },
    {
      id: 'grant-derivative-03',
      scope: 'derivative_work',
      subjectId: `title:${LAST_SIGNAL_TITLE_ID}`,
      subjectName: 'THE LAST SIGNAL (Alternate Branch Endings)',
      rightsholder: 'Meridian Pictures & BranchFrame Originals LLC',
      decision: 'ALLOW',
      licenseRef: 'BF-DRV-2026-003',
      expiresAt: '2030-12-31T23:59:59.000Z',
      constraints: ['Requires deterministic canon validation and human sign-off prior to publish'],
    },
    {
      id: 'grant-likeness-elena',
      scope: 'likeness',
      subjectId: 'char:elena-vance',
      subjectName: 'Dr. Elena Vance (Lead Cryptographer)',
      rightsholder: 'SAG-AFTRA Digital Replica Clearance #8841-A',
      decision: 'ALLOW',
      licenseRef: 'BF-LIK-ELENA-2026',
      expiresAt: '2029-06-30T23:59:59.000Z',
      constraints: ['Authorized only for THE LAST SIGNAL canonical & approved alternate scenes'],
    },
    {
      id: 'grant-voice-elena',
      scope: 'voice',
      subjectId: 'char:elena-vance',
      subjectName: 'Dr. Elena Vance (Voice Synthesis)',
      rightsholder: 'SAG-AFTRA Digital Voice Release #8841-V',
      decision: 'ALLOW',
      licenseRef: 'BF-VOC-ELENA-2026',
      expiresAt: '2029-06-30T23:59:59.000Z',
      constraints: ['Watermarked neural telemetry voice print required'],
    },
    {
      id: 'grant-likeness-marcus',
      scope: 'likeness',
      subjectId: 'char:marcus-thorne',
      subjectName: 'Director Marcus Thorne (NSD Overseer)',
      rightsholder: 'Performer Digital Likeness Rider #9012-A',
      decision: 'ALLOW',
      licenseRef: 'BF-LIK-MARCUS-2026',
      expiresAt: '2029-06-30T23:59:59.000Z',
      constraints: ['No character defamatory alteration permitted'],
    },
    {
      id: 'grant-voice-marcus',
      scope: 'voice',
      subjectId: 'char:marcus-thorne',
      subjectName: 'Director Marcus Thorne (Voice Synthesis)',
      rightsholder: 'Performer Digital Voice Rider #9012-V',
      decision: 'ALLOW',
      licenseRef: 'BF-VOC-MARCUS-2026',
      expiresAt: '2029-06-30T23:59:59.000Z',
      constraints: ['Approved for interactive branch dialogue'],
    },
  ],
};

export const INITIAL_STORY_DNA: StoryDNA = {
  schemaVersion: '1.0.0',
  titleId: LAST_SIGNAL_TITLE_ID,
  screenplayTitle: 'THE LAST SIGNAL',
  logline:
    'Inside a subterranean Arctic listening station, a cryptographer intercepts aplanetary grid patch signed with her own future key and must choose between broadcasting the unverified cure or locking it in a Faraday vault before a solar super-storm strikes.',
  compiledAt: '2026-11-14T09:21:37.409Z',
  compilerModel: 'gemini-4-hydrogen',
  provenance: 'LIVE_GEMINI',
  latencyMs: 16666,
  characters: [
    {
      id: 'char:elena-vance',
      name: 'Dr. Elena Vance',
      role: 'Chief Signal Cryptographer, Meridian-9',
      motivation:
        'Prevent a northern-hemisphere power grid collapse by verifying and deploying the temporal carrier patch.',
      initialKnowledgeFactIds: ['fact:helios-decommissioned', 'fact:future-key-signature'],
      voiceProfile: 'Measured, analytical mezzo-soprano with urgent precision',
      likenessProtected: true,
    },
    {
      id: 'char:marcus-thorne',
      name: 'Director Marcus Thorne',
      role: 'National Signal Directorate Overseer',
      motivation:
        'Enforce air-gapped containment protocols to prevent an unverified anomalous payload from infiltrating civil satellites.',
      initialKnowledgeFactIds: ['fact:helios-decommissioned', 'fact:nsd-containment-protocol'],
      voiceProfile: 'Deep baritone, authoritative, security-first cadence',
      likenessProtected: true,
    },
  ],
  canonicalFacts: [
    {
      id: 'fact:helios-decommissioned',
      statement:
        'The Helios-IV relay satellite burned up on atmospheric re-entry eleven years ago.',
      category: 'WORLD_RULE',
      immutable: true,
      contradictsFactIds: [],
    },
    {
      id: 'fact:future-key-signature',
      statement:
        'The 1.420 GHz carrier packet is cryptographically signed with Dr. Elena Vance’s private key timestamped 48 hours in the future.',
      category: 'CHARACTER_SECRET',
      immutable: true,
      contradictsFactIds: [],
    },
    {
      id: 'fact:nsd-containment-protocol',
      statement:
        'NSD Directive 9 requires any anomalous orbital transmission to be quarantined inside the air-gapped cryogenic vault.',
      category: 'TECHNICAL_CONSTRAINT',
      immutable: true,
      contradictsFactIds: [],
    },
    {
      id: 'fact:Override-Console-Armed',
      statement:
        'The dual-key Meridian-9 routing console is armed in its final 90-second carrier decay window.',
      category: 'PLOT_FACT',
      immutable: false,
      contradictsFactIds: [],
    },
    {
      id: 'fact:signal-broadcast-globally',
      statement:
        'The carrier patch was transmitted across all civil orbital relays, stabilizing the synchronous power grid while exposing the temporal anomaly.',
      category: 'PLOT_FACT',
      immutable: false,
      contradictsFactIds: ['fact:signal-quarantined-in-vault'],
    },
    {
      id: 'fact:signal-quarantined-in-vault',
      statement:
        'The carrier signal was trapped inside Meridian-9’s cryogenic Faraday vault, preserving air-gap security while external grid transformers go dark.',
      category: 'PLOT_FACT',
      immutable: false,
      contradictsFactIds: ['fact:signal-broadcast-globally'],
    },
  ],
  causalEvents: [
    {
      id: 'evt:signal-intercepted',
      title: '1.420 GHz Carrier Wave Intercepted at Meridian-9',
      sceneId: 'scene-01-arrival',
      timestampCode: '03:14:00',
      description:
        'Elena isolates the impossible Helios-IV transmission and shares the future-key signature with Marcus Thorne.',
      causesEventIds: ['evt:dual-key-standoff'],
      dependsOnEventIds: [],
      establishedFactIds: ['fact:helios-decommissioned', 'fact:future-key-signature'],
      characterKnowledgeGained: [
        { characterId: 'char:marcus-thorne', factId: 'fact:future-key-signature' },
      ],
    },
    {
      id: 'evt:dual-key-standoff',
      title: 'Dual-Key Override Standoff (90-Second Decay Window)',
      sceneId: 'scene-02-decision',
      timestampCode: '03:17:00',
      description:
        'With 90 seconds before carrier decay, Elena and Marcus confront the mutually exclusive choice between Open Horizon Uplink and Faraday Cryo-Lock.',
      causesEventIds: ['evt:global-uplink-executed', 'evt:cryo-vault-sealed'],
      dependsOnEventIds: ['evt:signal-intercepted'],
      establishedFactIds: ['fact:Override-Console-Armed'],
      characterKnowledgeGained: [
        { characterId: 'char:elena-vance', factId: 'fact:nsd-containment-protocol' },
      ],
    },
    {
      id: 'evt:global-uplink-executed',
      title: 'Open Horizon Global Dish Broadcast',
      sceneId: 'scene-03a-broadcast',
      timestampCode: '03:18:30',
      description:
        'Svalbard deep-space dish arrays align and broadcast the planetary grid patch across the northern hemisphere.',
      causesEventIds: [],
      dependsOnEventIds: ['evt:dual-key-standoff'],
      establishedFactIds: ['fact:signal-broadcast-globally'],
      characterKnowledgeGained: [
        { characterId: 'char:elena-vance', factId: 'fact:signal-broadcast-globally' },
        { characterId: 'char:marcus-thorne', factId: 'fact:signal-broadcast-globally' },
      ],
    },
    {
      id: 'evt:cryo-vault-sealed',
      title: 'Faraday Cryo-Vault Containment Seal',
      sceneId: 'scene-03b-quarantine',
      timestampCode: '03:18:30',
      description:
        'Monolithic steel blast doors seal the cryogenic memory core around the captured signal as external sector power fails.',
      causesEventIds: [],
      dependsOnEventIds: ['evt:dual-key-standoff'],
      establishedFactIds: ['fact:signal-quarantined-in-vault'],
      characterKnowledgeGained: [
        { characterId: 'char:elena-vance', factId: 'fact:signal-quarantined-in-vault' },
        { characterId: 'char:marcus-thorne', factId: 'fact:signal-quarantined-in-vault' },
      ],
    },
  ],
  narrativeConstraints: [
    {
      id: 'const-01',
      rule: 'No scene may simultaneously establish fact:signal-broadcast-globally and fact:signal-quarantined-in-vault.',
      severity: 'HARD_CANON',
      enforcedByValidator: true,
    },
    {
      id: 'const-02',
      rule: 'Characters may only reference canonical facts in dialogue if present in initialKnowledgeFactIds or acquired in a causal ancestor scene.',
      severity: 'HARD_CANON',
      enforcedByValidator: true,
    },
    {
      id: 'const-03',
      rule: 'All alternate branch generation requires active SAG-AFTRA digital replica and voice grants for participating characters.',
      severity: 'RIGHTS_BOUNDARY',
      enforcedByValidator: true,
    },
  ],
  candidateBranchPoints: [
    {
      id: 'bp-meridian-override',
      sceneId: 'scene-02-decision',
      title: 'The Meridian Override',
      dramaticQuestion:
        'Will Dr. Elena Vance broadcast the unverified future-signed grid patch to save the planetary transformer network, or seal it inside the Faraday cryogenic vault under NSD containment?',
      triggerEventId: 'evt:dual-key-standoff',
      stakes: 'Planetary power grid survival versus national orbital security containment.',
      suggestedAlternatives: [
        'Outcome A: Open Horizon Protocol — Route the signal to the Svalbard dish array to patch the orbital grid.',
        'Outcome B: Faraday Blackout Protocol — Seal the signal inside the air-gapped cryogenic memory vault.',
      ],
    },
  ],
};

export const INITIAL_STORY_GRAPH: StoryGraph = {
  schemaVersion: '1.0.0',
  titleId: LAST_SIGNAL_TITLE_ID,
  versionNumber: 5,
  entrySceneId: 'scene-01-arrival',
  publishedChoiceIds: ['choice-a-broadcast', 'choice-b-quarantine'],
  lastPublishedAt: '2026-11-14T10:25:00.000Z',
  approvedByHuman: 'Elena Rostova — Executive Story & Rights Supervisor',
  architectureCapabilities: {
    maxSupportedDecisions: 3,
    maxSupportedEndings: 4,
    multiTitleReady: true,
    deterministicRouting: true,
  },
  scenes: [
    {
      id: 'scene-01-arrival',
      code: 'SCN-01',
      title: 'Signal Acquisition at Meridian-9',
      act: 'ACT_I',
      synopsis:
        'At 03:14 UTC inside the Svalbard acoustic-shielded listening bay, Dr. Elena Vance intercepts a 1.420 GHz carrier wave from the long-destroyed Helios-IV relay—signed with her own key from 48 hours in the future.',
      location: 'INT. MERIDIAN-9 ACOUSTIC LISTENING BAY — SVALBARD',
      timecode: '00:00:00:00',
      durationSec: 16,
      imageUrl: SCENE_IMAGES.scene1,
      mediaProvenance: 'STORYBOARD_DEMO',
      assetHash: 'bf-asset-scn01-a18f9201',
      audioMood: 'TENSION_PULSE',
      charactersPresent: ['char:elena-vance', 'char:marcus-thorne'],
      requiredPriorEventIds: [],
      requiredFactIds: [],
      establishesFactIds: ['fact:helios-decommissioned', 'fact:future-key-signature'],
      establishesEventIds: ['evt:signal-intercepted'],
      characterKnowledgeRequired: [
        {
          characterId: 'char:elena-vance',
          factId: 'fact:future-key-signature',
          reason: 'Elena verifies her own cryptographic key signature on the packet header.',
        },
      ],
      characterKnowledgeGained: [
        { characterId: 'char:marcus-thorne', factId: 'fact:future-key-signature' },
      ],
      dialogue: [
        {
          speaker: 'DR. ELENA VANCE',
          characterId: 'char:elena-vance',
          delivery: 'Focused, studying the cyan phase spectrogram',
          line: 'It is not orbital debris echo, Marcus. The packet header is signed with my private key—timestamped forty-eight hours from now.',
          startSec: 0,
          endSec: 5,
        },
        {
          speaker: 'DIRECTOR MARCUS THORNE',
          characterId: 'char:marcus-thorne',
          delivery: 'Stepping through the biometric airlock with the override key',
          line: 'Helios-IV burned up over the Pacific eleven years ago. Whatever is spoofing that transponder is probing our synchronous clock network.',
          startSec: 5,
          endSec: 11,
        },
        {
          speaker: 'DR. ELENA VANCE',
          characterId: 'char:elena-vance',
          delivery: 'Turning toward the dual-key console as warning harmonics rise',
          line: 'Look at the telemetry structure—it is a planetary transformer phase patch. If the coronal mass ejection hits at 03:20 without it, the northern grid collapses.',
          startSec: 11,
          endSec: 16,
        },
      ],
      choices: [
        {
          id: 'choice-to-decision',
          label: '01. Proceed to Override Console',
          subtitle: 'Arms the dual-key Meridian-9 routing terminal.',
          targetSceneId: 'scene-02-decision',
          consequenceSummary: 'Transitions to the 90-second Meridian Override decision point.',
          requiredRightsScopes: ['ownership', 'adaptation'],
          setsFactIds: ['fact:Override-Console-Armed'],
          isPublished: true,
        },
      ],
      isEnding: false,
    },
    {
      id: 'scene-02-decision',
      code: 'SCN-02',
      title: 'The Meridian Override',
      act: 'DECISION_POINT',
      synopsis:
        'The carrier signal enters its final 90-second decay window on the dual-key analog routing console. Elena and Marcus stand over the physical interlock switches as orbital geomagnetic alarms sound.',
      location: 'INT. MERIDIAN-9 DUAL-KEY OVERRIDE CONSOLE',
      timecode: '00:00:16:00',
      durationSec: 18,
      imageUrl: SCENE_IMAGES.decision,
      mediaProvenance: 'STORYBOARD_DEMO',
      assetHash: 'bf-asset-scn02-c71b4012',
      audioMood: 'DECISION_HEARTBEAT',
      charactersPresent: ['char:elena-vance', 'char:marcus-thorne'],
      requiredPriorEventIds: ['evt:signal-intercepted'],
      requiredFactIds: ['fact:helios-decommissioned', 'fact:future-key-signature'],
      establishesFactIds: ['fact:Override-Console-Armed'],
      establishesEventIds: ['evt:dual-key-standoff'],
      characterKnowledgeRequired: [
        {
          characterId: 'char:marcus-thorne',
          factId: 'fact:future-key-signature',
          reason: 'Thorne learned of the future-dated signature in Scene 01.',
        },
      ],
      characterKnowledgeGained: [
        { characterId: 'char:elena-vance', factId: 'fact:nsd-containment-protocol' },
      ],
      dialogue: [
        {
          speaker: 'DIRECTOR MARCUS THORNE',
          characterId: 'char:marcus-thorne',
          delivery: 'Hand poised over the crimson Faraday Cryo-Lock switch',
          line: 'NSD Directive Nine is unambiguous. If that signal is an adversarial logic bomb,uplinking it hands every civil relay to an unknown intelligence. Seal the vault!',
          startSec: 0,
          endSec: 6,
        },
        {
          speaker: 'DR. ELENA VANCE',
          characterId: 'char:elena-vance',
          delivery: 'Hand on the cyan Open Horizon Uplink key',
          line: 'And if I sent this patch back through a nonlinear ionospheric bounce because the blackout kills millions, locking it in the cryo-core dooms the grid!',
          startSec: 6,
          endSec: 12,
        },
        {
          speaker: 'DIRECTOR MARCUS THORNE',
          characterId: 'char:marcus-thorne',
          delivery: 'Voice tight as the carrier countdown crosses twenty seconds',
          line: 'Fifteen seconds before carrier decoherence, Elena. Turn the key—Open Horizon Uplink or Faraday Blackout?',
          startSec: 12,
          endSec: 18,
        },
      ],
      choices: [
        {
          id: 'choice-a-broadcast',
          label: 'Outcome A: Execute Open Horizon Protocol',
          subtitle: 'Broadcast the temporal patch across all civil orbital relays.',
          targetSceneId: 'scene-03a-broadcast',
          consequenceSummary:
            'Stabilizes the planetary power grid while permanently altering global orbital telemetry.',
          requiredRightsScopes: [
            'ownership',
            'adaptation',
            'derivative_work',
            'likeness',
            'voice',
          ],
          setsFactIds: ['fact:signal-broadcast-globally'],
          isPublished: true,
        },
        {
          id: 'choice-b-quarantine',
          label: 'Outcome B: Execute Faraday Blackout Protocol',
          subtitle: 'Trap the signal inside Meridian-9’s air-gapped cryogenic vault.',
          targetSceneId: 'scene-03b-quarantine',
          consequenceSummary:
            'Contains the anomalous transmission inside the subterranean bunker while surface grids go dark.',
          requiredRightsScopes: [
            'ownership',
            'adaptation',
            'derivative_work',
            'likeness',
            'voice',
          ],
          setsFactIds: ['fact:signal-quarantined-in-vault'],
          isPublished: true,
        },
      ],
      isEnding: false,
    },
    {
      id: 'scene-03a-broadcast',
      code: 'SCN-03A',
      title: 'Outcome A: Open Horizon Protocol',
      act: 'OUTCOME_BRANCH',
      synopsis:
        'Across the mist-shrouded Svalbard ridge, giant radio telescope dishes pivot in unison toward the aurora-lit stratosphere. Cyan telemetry beams lock onto the civil constellation, immunizing the planetary grid just as the solar shockwave arrives.',
      location: 'EXT./INT. SVALBARD DEEP-SPACE DISH ARRAY — DAWN',
      timecode: '00:00:34:00',
      durationSec: 16,
      imageUrl: SCENE_IMAGES.outcomeBroadcast,
      videoUrl: LAST_SIGNAL_VIDEOS.outcomeBroadcast,
      mediaProvenance: 'LIVE_OMNI_VIDEO',
      assetHash: 'bf-sha256-53278574e04557a5',
      audioMood: 'CYAN_HORIZON',
      charactersPresent: ['char:elena-vance', 'char:marcus-thorne'],
      requiredPriorEventIds: ['evt:signal-intercepted', 'evt:dual-key-standoff'],
      requiredFactIds: ['fact:signal-broadcast-globally'],
      establishesFactIds: ['fact:signal-broadcast-globally'],
      establishesEventIds: ['evt:global-uplink-executed'],
      characterKnowledgeRequired: [
        {
          characterId: 'char:elena-vance',
          factId: 'fact:signal-broadcast-globally',
          reason: 'Elena executed the Open Horizon uplink.',
        },
      ],
      characterKnowledgeGained: [],
      dialogue: [
        {
          speaker: 'DR. ELENA VANCE',
          characterId: 'char:elena-vance',
          delivery: 'Watching the northern hemisphere grid map stabilize in cyan',
          line: 'All forty-two orbital relays acknowledged the phase patch. Transformer harmonics across Europe and North America are holding steady.',
          startSec: 0,
          endSec: 8,
        },
        {
          speaker: 'DIRECTOR MARCUS THORNE',
          characterId: 'char:marcus-thorne',
          delivery: 'Looking at the secondary decoder log',
          line: 'The grid survived, Elena—but the carrier header just opened a persistent return channel. Someone forty-eight hours ahead knows we listened.',
          startSec: 8,
          endSec: 16,
        },
      ],
      choices: [],
      isEnding: true,
      endingType: 'CANON_A',
      endingThematicTag: 'ENDING A — OPEN HORIZON (GLOBAL CONVERGENCE)',
    },
    {
      id: 'scene-03b-quarantine',
      code: 'SCN-03B',
      title: 'Outcome B: Faraday Blackout Protocol',
      act: 'OUTCOME_BRANCH',
      synopsis:
        'Monolithic steel blast doors thunder shut around Meridian-9’s subterranean cryogenic core. The anomalous signal is trapped inside a supercooled optical lattice while surface power sectors across the continent drop offline one by one.',
      location: 'INT. MERIDIAN-9 SUBTERRANEAN FARADAY CRYO-VAULT',
      timecode: '00:00:34:00',
      durationSec: 16,
      imageUrl: SCENE_IMAGES.outcomeQuarantine,
      videoUrl: LAST_SIGNAL_VIDEOS.outcomeQuarantine,
      mediaProvenance: 'LIVE_OMNI_VIDEO',
      assetHash: 'bf-sha256-103f2ffb0320485e',
      audioMood: 'QUARANTINE_DRONE',
      charactersPresent: ['char:elena-vance', 'char:marcus-thorne'],
      requiredPriorEventIds: ['evt:signal-intercepted', 'evt:dual-key-standoff'],
      requiredFactIds: ['fact:signal-quarantined-in-vault'],
      establishesFactIds: ['fact:signal-quarantined-in-vault'],
      establishesEventIds: ['evt:cryo-vault-sealed'],
      characterKnowledgeRequired: [
        {
          characterId: 'char:marcus-thorne',
          factId: 'fact:signal-quarantined-in-vault',
          reason: 'Thorne and Elena engaged the Faraday containment seal.',
        },
      ],
      characterKnowledgeGained: [],
      dialogue: [
        {
          speaker: 'DIRECTOR MARCUS THORNE',
          characterId: 'char:marcus-thorne',
          delivery: 'As emergency coral-red backup lamps illuminate the sealed vault',
          line: 'External uplinks severed. The payload is locked inside the liquid-helium optical core. Zero bytes escaped Meridian-9.',
          startSec: 0,
          endSec: 8,
        },
        {
          speaker: 'DR. ELENA VANCE',
          characterId: 'char:elena-vance',
          delivery: 'Staring at the dark continental telemetry board',
          line: 'Surface grid sectors One through Twelve just went dark... and inside the cryo-lattice, the trapped signal is still ticking toward the timestamp when I first write it.',
          startSec: 8,
          endSec: 16,
        },
      ],
      choices: [],
      isEnding: true,
      endingType: 'ALTERNATE_B',
      endingThematicTag: 'ENDING B — FARADAY BLACKOUT (CONTAINMENT & ISOLATION)',
    },
  ],
};

export const INITIAL_BRANCH_PROPOSALS: BranchProposal[] = [
  {
    schemaVersion: '1.0.0',
    id: 'proposal-c-quantum-mirror',
    branchPointId: 'bp-meridian-override',
    sourceSceneId: 'scene-02-decision',
    choiceLabel: 'Outcome C: Engage Quantum Mirror Loop',
    choiceSubtitle:
      'Transmit only the grid phase-lock headers while reflecting the anomalous core payload back along the 1.420 GHz carrier.',
    synopsis:
      'Elena splits the packet in real time—routing only the deterministic transformer timing headers to civil relays while bouncing the encrypted temporal core back to its source coordinates.',
    endingThematicTag: 'ENDING C — QUANTUM MIRROR (CAUSAL LOOP)',
    causalConsequences: [
      'Avoids establishing full fact:signal-broadcast-globally while preventing continental transformer failure.',
      'Requires modifying evt:global-uplink-executed into a narrowband header-only burst.',
      'Preserves NSD containment of the executable payload.',
    ],
    downstreamEventChanges: [
      {
        originalEventId: 'evt:global-uplink-executed',
        changeType: 'MODIFIED',
        newDescription:
          'Svalbard dishes transmit stripped phase-lock headers while reflecting the encrypted core back to orbital origin.',
      },
      {
        originalEventId: 'evt:cryo-vault-sealed',
        changeType: 'REPLACED',
        newDescription:
          'Cryo-vault stores only a read-only parity hash of the reflected signal.',
      },
    ],
    newSceneDraft: {
      code: 'SCN-03C',
      title: 'Outcome C: Quantum Mirror Protocol',
      location: 'INT. MERIDIAN-9 PHASE INVERSION CHAMBER',
      durationSec: 15,
      charactersPresent: ['char:elena-vance', 'char:marcus-thorne'],
      establishesFactIds: ['fact:Override-Console-Armed'],
      dialogue: [
        {
          speaker: 'DR. ELENA VANCE',
          characterId: 'char:elena-vance',
          delivery: 'Splitting the waveform across dual optical channels',
          line: 'Phase headers are stabilizing the grid—and the reflected core just bounced back into the ionospheric mirror.',
          startSec: 0,
          endSec: 8,
        },
        {
          speaker: 'DIRECTOR MARCUS THORNE',
          characterId: 'char:marcus-thorne',
          delivery: 'Watching the return azimuth lock onto Meridian-9 itself',
          line: 'Elena... the reflection azimuth isn’t pointing at Helios-IV. It’s pointing at our own transmitter forty-eight hours from now.',
          startSec: 8,
          endSec: 15,
        },
      ],
      visualPrompt:
        'Anamorphic 35mm sci-fi thriller still inside a dark glass phase-inversion chamber, violet and cyan laser interferometry beams splitting inside a crystal prism.',
    },
    createdAt: '2026-11-14T09:21:53.151Z',
    plannerModel: 'gemini-4-hydrogen',
    provenance: 'LIVE_GEMINI',
    latencyMs: 15734,
    status: 'VALIDATED',
  },
];

const initialRightsAudit = evaluateRightsPolicy(INITIAL_RIGHTS_MANIFEST, {
  operation: 'GENERATE_FOOTAGE',
  titleId: LAST_SIGNAL_TITLE_ID,
  characterIds: ['char:elena-vance', 'char:marcus-thorne'],
  evaluationTimeIso: '2026-11-14T10:25:00.000Z',
});

export const INITIAL_GENERATION_JOBS: GenerationJob[] = [
  {
    id: 'job-scn03a-video',
    titleId: LAST_SIGNAL_TITLE_ID,
    sceneId: 'scene-03a-broadcast',
    sceneTitle: 'SCN-03A — Outcome A: Open Horizon Protocol',
    adapterType: 'OMNI_FLASH_VIDEO',
    modelName: 'gemini-omni-1.2-flash',
    prompt:
      'Animate this 35mm sci-fi thriller frame: across a snow-swept Arctic mountain ridge at night, colossal deep-space parabolic radio telescope dishes pivot in unison as cyan telemetry laser beams pulse into the aurora borealis sky.',
    aspectRatio: '16:9',
    durationSec: 5,
    rightsCheck: initialRightsAudit,
    modelAvailable: true,
    availabilityNote:
      'Generated 16:9 720p MP4 motion video (3,643,865 bytes) via gemini-omni-1.2-flash (v1beta Interactions API, ID v1_ChcxemI0YXFXM1BPWDRuc0VQcXI3djBBMBIXMXpiNGFxVzNQT1g0bnNFUHFyN3YwQTA). Verified & approved.',
    provenance: 'LIVE_OMNI_VIDEO',
    assetVersion: 2,
    assetHash: 'bf-sha256-53278574e04557a5',
    latencyMs: 27478,
    status: 'APPROVED',
    outputUrl: SCENE_IMAGES.outcomeBroadcast,
    videoUrl: LAST_SIGNAL_VIDEOS.outcomeBroadcast,
    outputMimeType: 'video/mp4',
    reviewerName: 'Elena Rostova — Supervising Editor',
    reviewedAt: '2026-11-14T10:24:30.000Z',
    reviewNotes:
      'Approved live gemini-omni-1.2-flash MP4 motion sequence for Outcome A (Open Horizon Protocol).',
    createdAt: '2026-11-14T10:24:00.000Z',
  },
  {
    id: 'job-scn03b-video',
    titleId: LAST_SIGNAL_TITLE_ID,
    sceneId: 'scene-03b-quarantine',
    sceneTitle: 'SCN-03B — Outcome B: Faraday Blackout Protocol',
    adapterType: 'OMNI_FLASH_VIDEO',
    modelName: 'gemini-omni-1.2-flash',
    prompt:
      'Animate this 35mm sci-fi thriller frame: inside a subterranean concrete Faraday vault, monolithic dark steel blast doors close around a glowing violet-and-coral cryogenic memory core while emergency indicator lights pulse on the damp industrial walls.',
    aspectRatio: '16:9',
    durationSec: 5,
    rightsCheck: initialRightsAudit,
    modelAvailable: true,
    availabilityNote:
      'Generated 16:9 720p MP4 motion video (3,476,152 bytes) via gemini-omni-1.2-flash (v1beta Interactions API, ID v1_Chc5RGI0YXJ6VUtKU094TjhQMmZfYWlRdxIXOURiNGFyelVLSlNPeE44UDJmX2FpUXc). Verified & approved.',
    provenance: 'LIVE_OMNI_VIDEO',
    assetVersion: 2,
    assetHash: 'bf-sha256-103f2ffb0320485e',
    latencyMs: 28626,
    status: 'APPROVED',
    outputUrl: SCENE_IMAGES.outcomeQuarantine,
    videoUrl: LAST_SIGNAL_VIDEOS.outcomeQuarantine,
    outputMimeType: 'video/mp4',
    reviewerName: 'Elena Rostova — Supervising Editor',
    reviewedAt: '2026-11-14T10:24:58.000Z',
    reviewNotes:
      'Approved live gemini-omni-1.2-flash MP4 motion sequence for Outcome B (Faraday Blackout Protocol).',
    createdAt: '2026-11-14T10:24:25.000Z',
  },
];

export const INITIAL_PUBLICATION_RECORDS: PublicationRecord[] = [
  {
    id: 'pub-v5-omni-video',
    titleId: LAST_SIGNAL_TITLE_ID,
    versionNumber: 5,
    approvedBy: 'Elena Rostova',
    role: 'Executive Story & Rights Supervisor',
    notes:
      'Mission 03 verified release of THE LAST SIGNAL with live Gemini 4 Hydrogen Story DNA & Branch Proposal and live Gemini Omni 1.2 Flash MP4 motion video outcomes A & B.',
    rightsVerified: true,
    canonVerified: true,
    approvedJobIds: ['job-scn03a-video', 'job-scn03b-video'],
    publishedAt: '2026-11-14T10:25:00.000Z',
    deterministicHash: computeDeterministicHash('the-last-signal:v5:live-omni-video'),
    rightsSnapshotHash: initialRightsAudit.auditHash,
    assetHashes: {
      'scene-01-arrival': 'bf-asset-scn01-a18f9201',
      'scene-02-decision': 'bf-asset-scn02-c71b4012',
      'scene-03a-broadcast': 'bf-sha256-53278574e04557a5',
      'scene-03b-quarantine': 'bf-sha256-103f2ffb0320485e',
    },
    playbackMode: 'HYBRID_CINEMA',
  },
];

export const INITIAL_TITLE_BUNDLES: Record<string, TitleBundle> = {
  [TITANIC_TITLE_ID]: {
    titleId: TITANIC_TITLE_ID,
    titleName: 'TITANIC 1912',
    subtitle: 'Original Historical-Fiction Interactive Cinema',
    tagline: 'One night. One decision. Different futures.',
    genre: 'Historical Drama / Thriller',
    yearSetting: 'April 14–15, 1912 · North Atlantic',
    isFlagship: true,
    screenplayText: TITANIC_SCREENPLAY_TEXT,
    storyDNA: TITANIC_STORY_DNA,
    rightsManifest: TITANIC_RIGHTS_MANIFEST,
    storyGraph: TITANIC_STORY_GRAPH,
    branchProposals: TITANIC_BRANCH_PROPOSALS,
    generationJobs: TITANIC_GENERATION_JOBS,
    publicationRecords: TITANIC_PUBLICATION_RECORDS,
  },
  [LAST_SIGNAL_TITLE_ID]: {
    titleId: LAST_SIGNAL_TITLE_ID,
    titleName: 'THE LAST SIGNAL',
    subtitle: 'Technical Reference Interactive Thriller',
    tagline: 'The story doesn’t have to end that way.',
    genre: 'Technology Thriller',
    yearSetting: 'Meridian-9 Arctic Listening Bunker',
    isFlagship: false,
    screenplayText: INITIAL_SCREENPLAY_TEXT,
    storyDNA: INITIAL_STORY_DNA,
    rightsManifest: INITIAL_RIGHTS_MANIFEST,
    storyGraph: INITIAL_STORY_GRAPH,
    branchProposals: INITIAL_BRANCH_PROPOSALS,
    generationJobs: INITIAL_GENERATION_JOBS,
    publicationRecords: INITIAL_PUBLICATION_RECORDS,
  },
};

export const INITIAL_GEMINI_TRACES: GeminiExecutionTrace[] = [
  {
    id: 'trace-ttn-dna-1794651950',
    operation: 'STORY_DNA_COMPILER',
    modelId: 'gemini-4-hydrogen',
    endpoint: '/api/v1/compiler/analyze',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 6412,
    schemaValid: true,
    validationSummary:
      'TITANIC 1912 StoryDNA v1.0.0 validated (2 fictional characters Clara Voss & Julian Mercer, 6 facts, 4 causal events). Historical sinking invariant preserved.',
    timestamp: '2026-11-14T10:25:55.000Z',
  },
  {
    id: 'trace-ttn-plan-1794651956',
    operation: 'BRANCH_PLANNER',
    modelId: 'gemini-4-hydrogen',
    endpoint: '/api/v1/planner/propose',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 5890,
    schemaValid: true,
    validationSummary:
      'TITANIC 1912 BranchProposal v1.0.0 validated: "Outcome C: Bridge Morse Lamp & Boiler Steam Vent Relay" (3 causal consequences, 2 downstream event modifications).',
    timestamp: '2026-11-14T10:25:56.000Z',
  },
  {
    id: 'trace-ttn-vid-a-1794651660',
    operation: 'OMNI_VIDEO_GENERATION',
    modelId: 'gemini-omni-1.2-flash',
    endpoint: '/api/v1/generation/create',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 24500,
    schemaValid: true,
    validationSummary:
      'TITANIC 1912 SCN-03A (Carpathia Beacon Protocol): Synthesized 16:9 720p MP4 video titanic_outcome_a.mp4 (3,989,582 bytes, bf-sha256-85e94c755d0d73e3) via v1beta Interactions API.',
    timestamp: '2026-11-14T10:21:00.000Z',
  },
  {
    id: 'trace-ttn-vid-b-1794651835',
    operation: 'OMNI_VIDEO_GENERATION',
    modelId: 'gemini-omni-1.2-flash',
    endpoint: '/api/v1/generation/create',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 28774,
    schemaValid: true,
    validationSummary:
      'TITANIC 1912 SCN-03B (Scotland Road Bulkhead Rescue): Synthesized 16:9 720p MP4 video titanic_outcome_b.mp4 (3,605,187 bytes, bf-sha256-5aaf421b9cd0caa2) via v1beta Interactions API (id: v1_Chd2RGI0YXRuREw4V1prZFVQcE1EZjJBYxIXdkRiNGF0bkRMOFdaa2RVUHBNRGYyQWM).',
    timestamp: '2026-11-14T10:23:55.000Z',
  },
  {
    id: 'trace-ls-vid-a-1794651865',
    operation: 'OMNI_VIDEO_GENERATION',
    modelId: 'gemini-omni-1.2-flash',
    endpoint: '/api/v1/generation/create',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 27478,
    schemaValid: true,
    validationSummary:
      'THE LAST SIGNAL SCN-03A (Open Horizon Protocol): Synthesized 16:9 720p MP4 video last_signal_outcome_a.mp4 (3,643,865 bytes, bf-sha256-53278574e04557a5) via v1beta Interactions API (id: v1_ChcxemI0YXFXM1BPWDRuc0VQcXI3djBBMBIXMXpiNGFxVzNQT1g0bnNFUHFyN3YwQTA).',
    timestamp: '2026-11-14T10:24:25.000Z',
  },
  {
    id: 'trace-ls-vid-b-1794651895',
    operation: 'OMNI_VIDEO_GENERATION',
    modelId: 'gemini-omni-1.2-flash',
    endpoint: '/api/v1/generation/create',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 28626,
    schemaValid: true,
    validationSummary:
      'THE LAST SIGNAL SCN-03B (Faraday Blackout Protocol): Synthesized 16:9 720p MP4 video last_signal_outcome_b.mp4 (3,476,152 bytes, bf-sha256-103f2ffb0320485e) via v1beta Interactions API (id: v1_Chc5RGI0YXJ6VUtKU094TjhQMmZfYWlRdxIXOURiNGFyelVLSlNPeE44UDJmX2FpUXc).',
    timestamp: '2026-11-14T10:24:55.000Z',
  },
  {
    id: 'trace-1794648808741-gf7s',
    operation: 'FLASH_IMAGE_GENERATION',
    modelId: 'gemini-3.1-flash-lite-image',
    endpoint: '/api/v1/generation/create',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 3163,
    schemaValid: true,
    validationSummary:
      'THE LAST SIGNAL SCN-03A: Generated 16:9 keyframe image asset (bf-sha256-49670eed5f6a91e7) via gemini-3.1-flash-lite-image.',
    timestamp: '2026-11-14T09:33:28.741Z',
  },
  {
    id: 'trace-1794648113151-8cak',
    operation: 'BRANCH_PLANNER',
    modelId: 'gemini-4-hydrogen',
    endpoint: '/api/v1/planner/propose',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 15734,
    schemaValid: true,
    validationSummary:
      'THE LAST SIGNAL BranchProposal v1.0.0 validated: "Engage the Quantum Mirror Loop" (4 causal consequences, 4 downstream event modifications).',
    timestamp: '2026-11-14T09:21:53.151Z',
  },
  {
    id: 'trace-1794648097409-sfc9',
    operation: 'STORY_DNA_COMPILER',
    modelId: 'gemini-4-hydrogen',
    endpoint: '/api/v1/compiler/analyze',
    outcome: 'LIVE_SUCCESS',
    provenance: 'LIVE_GEMINI',
    latencyMs: 16666,
    schemaValid: true,
    validationSummary:
      'THE LAST SIGNAL StoryDNA v1.0.0 validated (2 chars, 6 facts, 4 events). Canon valid: true',
    timestamp: '2026-11-14T09:21:37.409Z',
  },
];
