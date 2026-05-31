import { createFestivalLog } from './festivalLog.js';

function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function isGeneratedVendorVisitPrompt(encounter = {}) {
    const clue = normalizeText(encounter.clue);
    const vendorName = normalizeText(encounter.vendorName);
    const booth = normalizeText(encounter.booth);

    return Boolean(
        clue
        && vendorName
        && clue.startsWith(`Visit ${vendorName}`)
        && (!booth || clue.includes(` at ${booth}`))
    );
}

function createEncounterDetail(encounter = {}) {
    const goal = normalizeText(encounter.goal);
    if (goal) {
        return goal;
    }

    const clue = normalizeText(encounter.clue);
    if (clue && !isGeneratedVendorVisitPrompt(encounter)) {
        return clue;
    }

    return 'Talk to exhibitors and look for a passport stamp.';
}

function createActiveDiscoveryHudModel(activeTrail) {
    const encounter = activeTrail.nextEncounter ?? activeTrail.availableEncounters[0];
    const detail = createEncounterDetail(encounter);
    const progressText = `${activeTrail.visitedCount}/${activeTrail.totalCount} stamps`;

    return {
        visible: Boolean(encounter),
        status: activeTrail.ordered ? 'ordered' : 'active',
        label: activeTrail.ordered ? 'Next Stop' : 'Passport Lead',
        title: activeTrail.ordered
            ? `Stop ${encounter.order} of ${activeTrail.totalCount}`
            : 'Find a Passport Clue',
        detail: detail ? `${progressText} - ${detail}` : progressText
    };
}

function createCompletedDiscoveryHudModel(completedTrail) {
    const detail = normalizeText(
        completedTrail.completionText,
        `${completedTrail.totalCount} passport stamps logged`
    );

    return {
        visible: true,
        status: 'complete',
        label: 'Passport Complete',
        title: completedTrail.title,
        detail
    };
}

export function createDiscoveryHudModel({
    activeQuests = [],
    completedQuests = [],
    inventory = [],
    score = 0
} = {}) {
    const festivalLog = createFestivalLog({
        activeQuests,
        completedQuests,
        inventory,
        score
    });
    const activeTrail = festivalLog.activeDiscoveryTrails.find(trail => trail.nextEncounter);
    if (activeTrail) {
        return createActiveDiscoveryHudModel(activeTrail);
    }

    const completedTrails = festivalLog.completedDiscoveryTrails;
    const completedTrail = completedTrails[completedTrails.length - 1];
    if (completedTrail) {
        return createCompletedDiscoveryHudModel(completedTrail);
    }

    return {
        visible: false,
        status: 'empty',
        label: '',
        title: '',
        detail: ''
    };
}