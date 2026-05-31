function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function getQuestObjectives(quest = {}) {
    return Array.isArray(quest.objectives) ? quest.objectives : [];
}

function getNextOpenObjectiveIndex(objectives) {
    return objectives.findIndex(objective => objective?.visited !== true);
}

function resolveEncounterStatus({ quest, objective, index, nextOpenObjectiveIndex }) {
    if (quest.completed === true || objective?.visited === true) {
        return 'completed';
    }

    if (quest.ordered !== true) {
        return 'available';
    }

    return index === nextOpenObjectiveIndex ? 'available' : 'locked';
}

function createEncounterFromObjective(quest, objective, index, nextOpenObjectiveIndex) {
    const status = resolveEncounterStatus({ quest, objective, index, nextOpenObjectiveIndex });

    return {
        questId: normalizeText(quest.id),
        questTitle: normalizeText(quest.title, 'Discovery Passport'),
        trailId: normalizeText(quest.trailId),
        trailStopId: normalizeText(objective?.trailStopId),
        source: normalizeText(quest.source),
        order: index + 1,
        vendorId: normalizeText(objective?.vendorId),
        vendorName: normalizeText(objective?.vendorName, 'Unknown Vendor'),
        booth: normalizeText(objective?.booth),
        clue: normalizeText(objective?.clue),
        goal: normalizeText(objective?.goal),
        status,
        visited: objective?.visited === true,
        visitedAt: objective?.visitedAt ?? null,
        completed: status === 'completed',
        available: status === 'available',
        locked: status === 'locked'
    };
}

export function createEncounterChain(quest = {}) {
    const objectives = getQuestObjectives(quest);
    const nextOpenObjectiveIndex = getNextOpenObjectiveIndex(objectives);
    const encounters = objectives.map((objective, index) => (
        createEncounterFromObjective(quest, objective, index, nextOpenObjectiveIndex)
    ));
    const completedEncounters = encounters.filter(encounter => encounter.completed);
    const availableEncounters = encounters.filter(encounter => encounter.available);
    const lockedEncounters = encounters.filter(encounter => encounter.locked);
    const isComplete = quest.completed === true || (objectives.length > 0 && completedEncounters.length === objectives.length);

    return {
        questId: normalizeText(quest.id),
        trailId: normalizeText(quest.trailId),
        source: normalizeText(quest.source),
        title: normalizeText(quest.title, 'Discovery Passport'),
        description: normalizeText(quest.description),
        ordered: quest.ordered === true,
        status: isComplete ? 'completed' : 'active',
        visitedCount: completedEncounters.length,
        totalCount: encounters.length,
        encounters,
        completedEncounters,
        availableEncounters,
        lockedEncounters,
        nextEncounter: availableEncounters[0] ?? null
    };
}

export function createEncounterChains({ activeQuests = [], completedQuests = [] } = {}) {
    const safeActiveQuests = Array.isArray(activeQuests) ? activeQuests : [];
    const safeCompletedQuests = Array.isArray(completedQuests) ? completedQuests : [];

    return [...safeCompletedQuests, ...safeActiveQuests]
        .filter(quest => quest?.type === 'discovery')
        .map(createEncounterChain);
}

export function getEncounterForVendor(quest, vendorId) {
    const resolvedVendorId = normalizeText(vendorId);

    if (!resolvedVendorId) {
        return null;
    }

    return createEncounterChain(quest).encounters.find(encounter => encounter.vendorId === resolvedVendorId) ?? null;
}