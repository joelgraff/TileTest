import { createEncounterChain } from './encounterChain.js';

function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function normalizeNumber(value, fallback = 0) {
    return Number.isFinite(value) ? value : fallback;
}

function getQuestObjectives(quest = {}) {
    return Array.isArray(quest.objectives) ? quest.objectives : [];
}

function createStampFromObjective(quest, objective, index) {
    return {
        questId: normalizeText(quest.id),
        questTitle: normalizeText(quest.title, 'Discovery Passport'),
        trailId: normalizeText(quest.trailId),
        trailStopId: normalizeText(objective.trailStopId),
        source: normalizeText(quest.source),
        order: index + 1,
        vendorId: normalizeText(objective.vendorId),
        vendorName: normalizeText(objective.vendorName, 'Unknown Vendor'),
        booth: normalizeText(objective.booth),
        clue: normalizeText(objective.clue),
        goal: normalizeText(objective.goal),
        visited: objective.visited === true,
        visitedAt: objective.visitedAt ?? null,
        completed: quest.completed === true
    };
}

function createDiscoveryTrailEntry(quest) {
    const objectives = getQuestObjectives(quest);
    const encounterChain = createEncounterChain(quest);
    const stamps = objectives
        .map((objective, index) => createStampFromObjective(quest, objective, index))
        .filter(stamp => stamp.visited || quest.completed === true);
    const rewardPoints = normalizeNumber(quest.reward?.points);

    return {
        questId: normalizeText(quest.id),
        trailId: normalizeText(quest.trailId),
        source: normalizeText(quest.source),
        title: normalizeText(quest.title, 'Discovery Passport'),
        description: normalizeText(quest.description),
        status: quest.completed === true ? 'completed' : 'active',
        ordered: quest.ordered === true,
        completionText: normalizeText(quest.completionText),
        rewardPoints,
        rewardDescription: normalizeText(quest.reward?.description),
        createdAt: quest.created ?? null,
        completedAt: quest.completedAt ?? null,
        visitedCount: objectives.filter(objective => objective.visited).length,
        totalCount: objectives.length,
        encounters: encounterChain.encounters,
        availableEncounters: encounterChain.availableEncounters,
        lockedEncounters: encounterChain.lockedEncounters,
        nextEncounter: encounterChain.nextEncounter,
        stamps
    };
}

function createCollectedItemEntry(item, index) {
    return {
        id: normalizeText(item?.id, normalizeText(item?.name, `item-${index + 1}`)),
        name: normalizeText(item?.name, 'Unknown Item'),
        description: normalizeText(item?.description),
        value: normalizeNumber(item?.value)
    };
}

export function createFestivalLog({
    activeQuests = [],
    completedQuests = [],
    inventory = [],
    score = 0
} = {}) {
    const safeActiveQuests = Array.isArray(activeQuests) ? activeQuests : [];
    const safeCompletedQuests = Array.isArray(completedQuests) ? completedQuests : [];
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    const discoveryTrails = [...safeCompletedQuests, ...safeActiveQuests]
        .filter(quest => quest?.type === 'discovery')
        .map(createDiscoveryTrailEntry);
    const completedDiscoveryTrails = discoveryTrails.filter(trail => trail.status === 'completed');
    const activeDiscoveryTrails = discoveryTrails.filter(trail => trail.status === 'active');
    const stamps = discoveryTrails.flatMap(trail => trail.stamps.map(stamp => ({
        ...stamp,
        trailTitle: trail.title,
        trailStatus: trail.status
    })));
    const availableEncounterCount = discoveryTrails.reduce(
        (sum, trail) => sum + trail.availableEncounters.length,
        0
    );
    const collectedItems = safeInventory.map(createCollectedItemEntry);
    const rewardPoints = safeCompletedQuests.reduce(
        (sum, quest) => sum + normalizeNumber(quest?.reward?.points),
        0
    );

    return {
        score: normalizeNumber(score),
        activeQuestCount: safeActiveQuests.length,
        completedQuestCount: safeCompletedQuests.length,
        completedTrailCount: completedDiscoveryTrails.length,
        activeTrailCount: activeDiscoveryTrails.length,
        stampCount: stamps.length,
        availableEncounterCount,
        collectedItemCount: collectedItems.length,
        rewardPoints,
        discoveryTrails,
        completedDiscoveryTrails,
        activeDiscoveryTrails,
        stamps,
        collectedItems
    };
}

export function hasFestivalLogActivity(festivalLog) {
    return Boolean(
        festivalLog?.stampCount
        || festivalLog?.availableEncounterCount
        || festivalLog?.completedTrailCount
        || festivalLog?.completedQuestCount
        || festivalLog?.collectedItemCount
    );
}