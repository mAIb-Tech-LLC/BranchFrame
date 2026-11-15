import type {
  CanonValidationReport,
  SceneNode,
  StoryDNA,
  StoryGraph,
  ValidationIssue,
} from './schemas.ts';

interface TraversalPath {
  sceneIds: string[];
  accumulatedFacts: Set<string>;
  accumulatedEvents: Set<string>;
  characterKnowledge: Map<string, Set<string>>; // characterId -> Set<factId>
}

/**
 * Deterministic Canon & Graph Validator.
 * Checks:
 * 1. Unreachable scenes
 * 2. Contradictions (mutually exclusive canonical facts on the same path)
 * 3. Impossible character knowledge (character uses a fact before witnessing/learning it)
 * 4. Invalid causal dependencies (scene requires prior event or fact not established on incoming path)
 * 5. Dead ends (non-ending scene with 0 outgoing choices)
 */
export function validateStoryCanonAndGraph(
  dna: StoryDNA,
  graph: StoryGraph,
  options?: { onlyPublishedChoices?: boolean }
): CanonValidationReport {
  const issues: ValidationIssue[] = [];
  const sceneMap = new Map<string, SceneNode>();
  for (const scene of graph.scenes) {
    sceneMap.set(scene.id, scene);
  }

  const factMap = new Map(dna.canonicalFacts.map((f) => [f.id, f]));
  const characterMap = new Map(dna.characters.map((c) => [c.id, c]));

  // Initial knowledge state from Story DNA
  const baseKnowledge = new Map<string, Set<string>>();
  for (const char of dna.characters) {
    baseKnowledge.set(char.id, new Set(char.initialKnowledgeFactIds));
  }

  const reachableSceneIds = new Set<string>();
  const completedPaths: TraversalPath[] = [];

  let contradictionsCount = 0;
  let knowledgeViolationsCount = 0;
  let invalidDependenciesCount = 0;
  let deadEndsCount = 0;

  const entryScene = sceneMap.get(graph.entrySceneId);
  if (!entryScene) {
    issues.push({
      id: 'issue-missing-entry',
      type: 'UNREACHABLE_SCENE',
      severity: 'ERROR',
      sceneId: graph.entrySceneId,
      sceneCode: 'ROOT',
      message: `Entry scene "${graph.entrySceneId}" does not exist in the story graph.`,
      remediation: 'Assign a valid entrySceneId present in graph.scenes.',
    });
  } else {
    // BFS/DFS traversal of all simple paths from entryScene
    const queue: TraversalPath[] = [
      {
        sceneIds: [entryScene.id],
        accumulatedFacts: new Set<string>(),
        accumulatedEvents: new Set<string>(),
        characterKnowledge: cloneKnowledgeMap(baseKnowledge),
      },
    ];

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const currentSceneId = currentPath.sceneIds[currentPath.sceneIds.length - 1];
      const scene = sceneMap.get(currentSceneId);
      if (!scene) continue;

      reachableSceneIds.add(scene.id);

      // 1. Check Invalid Causal Dependencies BEFORE applying scene's new facts/events
      for (const reqEventId of scene.requiredPriorEventIds) {
        if (!currentPath.accumulatedEvents.has(reqEventId)) {
          invalidDependenciesCount++;
          issues.push({
            id: `dep-event-${scene.id}-${reqEventId}-${currentPath.sceneIds.join('_')}`,
            type: 'INVALID_CAUSAL_DEPENDENCY',
            severity: 'ERROR',
            sceneId: scene.id,
            sceneCode: scene.code,
            message: `Scene "${scene.title}" (${scene.code}) requires prior causal event "${reqEventId}", which has not occurred along path [${currentPath.sceneIds.join(' -> ')}].`,
            remediation: `Ensure event "${reqEventId}" is established in an upstream scene or remove the invalid dependency.`,
          });
        }
      }

      for (const reqFactId of scene.requiredFactIds) {
        if (!currentPath.accumulatedFacts.has(reqFactId)) {
          invalidDependenciesCount++;
          issues.push({
            id: `dep-fact-${scene.id}-${reqFactId}-${currentPath.sceneIds.join('_')}`,
            type: 'INVALID_CAUSAL_DEPENDENCY',
            severity: 'ERROR',
            sceneId: scene.id,
            sceneCode: scene.code,
            message: `Scene "${scene.title}" (${scene.code}) requires canonical fact "${reqFactId}", which was never established along path [${currentPath.sceneIds.join(' -> ')}].`,
            remediation: `Establish fact "${reqFactId}" in an upstream scene or choice transition.`,
          });
        }
      }

      // 2. Check Impossible Character Knowledge BEFORE gaining new knowledge in this scene
      for (const reqKnow of scene.characterKnowledgeRequired) {
        const charKnownFacts =
          currentPath.characterKnowledge.get(reqKnow.characterId) || new Set<string>();
        if (!charKnownFacts.has(reqKnow.factId)) {
          const charName = characterMap.get(reqKnow.characterId)?.name || reqKnow.characterId;
          knowledgeViolationsCount++;
          issues.push({
            id: `know-${scene.id}-${reqKnow.characterId}-${reqKnow.factId}`,
            type: 'IMPOSSIBLE_CHARACTER_KNOWLEDGE',
            severity: 'ERROR',
            sceneId: scene.id,
            sceneCode: scene.code,
            message: `Impossible character knowledge in "${scene.title}" (${scene.code}): ${charName} acts on "${reqKnow.factId}" (${reqKnow.reason}), but has not learned or witnessed it on path [${currentPath.sceneIds.join(' -> ')}].`,
            remediation: `Add a discovery beat where ${charName} learns "${reqKnow.factId}" prior to scene ${scene.code}.`,
          });
        }
      }

      // Apply scene's established facts, events, and character knowledge
      const nextFacts = new Set(currentPath.accumulatedFacts);
      for (const factId of scene.establishesFactIds) {
        nextFacts.add(factId);
      }

      const nextEvents = new Set(currentPath.accumulatedEvents);
      for (const eventId of scene.establishesEventIds) {
        nextEvents.add(eventId);
      }

      const nextKnowledge = cloneKnowledgeMap(currentPath.characterKnowledge);
      for (const gained of scene.characterKnowledgeGained) {
        if (!nextKnowledge.has(gained.characterId)) {
          nextKnowledge.set(gained.characterId, new Set());
        }
        nextKnowledge.get(gained.characterId)!.add(gained.factId);
      }

      // 3. Check Canon Contradictions across accumulated facts in this scene
      for (const activeFactId of nextFacts) {
        const factDef = factMap.get(activeFactId);
        if (!factDef) continue;
        for (const contradictedId of factDef.contradictsFactIds) {
          if (nextFacts.has(contradictedId)) {
            contradictionsCount++;
            const pairKey = [activeFactId, contradictedId].sort().join('__');
            const issueId = `contra-${scene.id}-${pairKey}`;
            if (!issues.some((i) => i.id === issueId)) {
              issues.push({
                id: issueId,
                type: 'CANON_CONTRADICTION',
                severity: 'ERROR',
                sceneId: scene.id,
                sceneCode: scene.code,
                message: `Canon contradiction in "${scene.title}" (${scene.code}): mutually exclusive facts "${activeFactId}" and "${contradictedId}" are simultaneously active on path [${currentPath.sceneIds.join(' -> ')}].`,
                remediation: `Separate "${activeFactId}" and "${contradictedId}" into mutually exclusive branch paths.`,
              });
            }
          }
        }
      }

      // Filter active outgoing choices
      const activeChoices = options?.onlyPublishedChoices
        ? scene.choices.filter((c) => c.isPublished)
        : scene.choices;

      // 4. Check Dead Ends
      if (!scene.isEnding && activeChoices.length === 0) {
        deadEndsCount++;
        issues.push({
          id: `deadend-${scene.id}`,
          type: 'DEAD_END',
          severity: 'ERROR',
          sceneId: scene.id,
          sceneCode: scene.code,
          message: `Scene "${scene.title}" (${scene.code}) is marked as a non-ending scene (isEnding=false) but has 0 outgoing transitions.`,
          remediation: `Connect "${scene.code}" to a downstream scene or mark it as a valid terminal ending.`,
        });
      }

      if (scene.isEnding || activeChoices.length === 0) {
        completedPaths.push({
          sceneIds: currentPath.sceneIds,
          accumulatedFacts: nextFacts,
          accumulatedEvents: nextEvents,
          characterKnowledge: nextKnowledge,
        });
        continue;
      }

      for (const choice of activeChoices) {
        const targetScene = sceneMap.get(choice.targetSceneId);
        if (!targetScene) {
          invalidDependenciesCount++;
          issues.push({
            id: `missing-target-${scene.id}-${choice.id}`,
            type: 'INVALID_CAUSAL_DEPENDENCY',
            severity: 'ERROR',
            sceneId: scene.id,
            sceneCode: scene.code,
            message: `Choice "${choice.label}" in scene ${scene.code} points to non-existent targetSceneId "${choice.targetSceneId}".`,
            remediation: `Point choice "${choice.label}" to an existing scene ID in the story graph.`,
          });
          continue;
        }

        // Prevent infinite cycles in malformed graphs
        if (currentPath.sceneIds.includes(choice.targetSceneId)) {
          invalidDependenciesCount++;
          issues.push({
            id: `cycle-${scene.id}-${choice.targetSceneId}`,
            type: 'INVALID_CAUSAL_DEPENDENCY',
            severity: 'ERROR',
            sceneId: scene.id,
            sceneCode: scene.code,
            message: `Causal cycle detected: choice "${choice.label}" in ${scene.code} loops back to ancestor scene ${choice.targetSceneId}.`,
            remediation: `Ensure story graph is a Directed Acyclic Graph (DAG).`,
          });
          continue;
        }

        const choiceFacts = new Set(nextFacts);
        const choiceKnowledge = cloneKnowledgeMap(nextKnowledge);
        for (const fId of choice.setsFactIds) {
          choiceFacts.add(fId);
          for (const charId of scene.charactersPresent) {
            if (!choiceKnowledge.has(charId)) {
              choiceKnowledge.set(charId, new Set());
            }
            choiceKnowledge.get(charId)!.add(fId);
          }
        }

        queue.push({
          sceneIds: [...currentPath.sceneIds, choice.targetSceneId],
          accumulatedFacts: choiceFacts,
          accumulatedEvents: new Set(nextEvents),
          characterKnowledge: choiceKnowledge,
        });
      }
    }
  }

  // 5. Check Unreachable Scenes across entire graph
  for (const scene of graph.scenes) {
    if (!reachableSceneIds.has(scene.id)) {
      issues.push({
        id: `unreachable-${scene.id}`,
        type: 'UNREACHABLE_SCENE',
        severity: 'ERROR',
        sceneId: scene.id,
        sceneCode: scene.code,
        message: `Unreachable scene detected: "${scene.title}" (${scene.code}) has no incoming path from entry scene "${graph.entrySceneId}".`,
        remediation: `Connect an upstream decision choice to "${scene.id}" or remove the orphaned scene.`,
      });
    }
  }

  const deduplicatedIssues = deduplicateIssues(issues);
  const endingsCount = graph.scenes.filter(
    (s) => reachableSceneIds.has(s.id) && s.isEnding
  ).length;

  return {
    schemaVersion: '1.0.0',
    titleId: graph.titleId,
    valid: deduplicatedIssues.filter((i) => i.severity === 'ERROR').length === 0,
    checkedAt: new Date().toISOString(),
    stats: {
      totalScenes: graph.scenes.length,
      reachableScenes: reachableSceneIds.size,
      totalPaths: completedPaths.length,
      endingsCount,
      contradictionsCount,
      knowledgeViolationsCount,
      invalidDependenciesCount,
      deadEndsCount,
    },
    issues: deduplicatedIssues,
  };
}

function cloneKnowledgeMap(
  source: Map<string, Set<string>>
): Map<string, Set<string>> {
  const copy = new Map<string, Set<string>>();
  for (const [k, v] of source.entries()) {
    copy.set(k, new Set(v));
  }
  return copy;
}

function deduplicateIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();
  const result: ValidationIssue[] = [];
  for (const issue of issues) {
    if (!seen.has(issue.id)) {
      seen.add(issue.id);
      result.push(issue);
    }
  }
  return result;
}
