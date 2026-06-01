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

function createConversationMoment(topic, index) {
    return {
        topicId: normalizeText(topic?.topicId, normalizeText(topic?.id)),
        topicLabel: normalizeText(topic?.topicLabel, normalizeText(topic?.label)),
        topicResponse: normalizeText(topic?.topicResponse, normalizeText(topic?.response)),
        completionMarker: normalizeText(topic?.completionMarker),
        askedAt: topic?.askedAt ?? null,
        verification: createVerificationMoment(topic?.verification),
        order: index + 1
    };
}

function createVerificationMoment(verification = {}) {
    if (!verification || typeof verification !== 'object') {
        return null;
    }

    const prompt = normalizeText(verification.prompt);
    const selectedPhrase = normalizeText(verification.selectedPhrase);
    const expectedPhrase = normalizeText(verification.expectedPhrase);

    if (!prompt && !selectedPhrase && !expectedPhrase) {
        return null;
    }

    return {
        id: normalizeText(verification.id),
        prompt,
        expectedPhrase,
        selectedPhrase,
        selectedLabel: normalizeText(verification.selectedLabel),
        verified: verification.verified === true,
        message: normalizeText(verification.message)
    };
}

function createConversationMoments(objective = {}) {
    return (Array.isArray(objective.completedTopics) ? objective.completedTopics : [])
        .map(createConversationMoment)
        .filter(moment => moment.topicId || moment.topicLabel || moment.topicResponse || moment.completionMarker);
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
        completed: quest.completed === true,
        conversationMoments: createConversationMoments(objective)
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