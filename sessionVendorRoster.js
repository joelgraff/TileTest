import { normalizeSessionVendorIds, readQuestSessionState } from './questSessionStore.js';

function normalizeVendorId(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return typeof value === 'string' ? value.trim() : '';
}

function getVendorId(vendor) {
    return normalizeVendorId(vendor?.id);
}

function getRosterSize(vendors, npcCount) {
    const resolvedNpcCount = Number.isFinite(npcCount) ? Math.max(0, Math.floor(npcCount)) : 0;
    return Math.min(vendors.length, resolvedNpcCount);
}

function shuffleVendors(vendors, random = Math.random) {
    const shuffledVendors = [...vendors];

    for (let index = shuffledVendors.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffledVendors[index], shuffledVendors[swapIndex]] = [shuffledVendors[swapIndex], shuffledVendors[index]];
    }

    return shuffledVendors;
}

export function getSavedActiveVendorIds(options = {}) {
    const sessionState = readQuestSessionState(options);
    const activeVendorIds = normalizeSessionVendorIds(sessionState?.activeVendorIds);

    if (activeVendorIds.length > 0) {
        return activeVendorIds;
    }

    return normalizeSessionVendorIds([
        ...(sessionState?.activeQuests ?? []),
        ...(sessionState?.completedQuests ?? [])
    ].flatMap(quest => (
        Array.isArray(quest?.objectives)
            ? quest.objectives.map(objective => objective?.vendorId ?? objective?.vendor)
            : []
    )));
}

export function getVendorsForSessionVendorIds(vendors = [], vendorIds = []) {
    const vendorsById = new Map(
        (Array.isArray(vendors) ? vendors : [])
            .map(vendor => [getVendorId(vendor), vendor])
            .filter(([vendorId]) => vendorId)
    );

    return normalizeSessionVendorIds(vendorIds)
        .map(vendorId => vendorsById.get(vendorId))
        .filter(Boolean);
}

export function resolveSessionVendorIds({
    vendors = [],
    npcCount = 0,
    savedVendorIds = [],
    testMode = false,
    random = Math.random
} = {}) {
    const knownVendors = (Array.isArray(vendors) ? vendors : [])
        .filter(vendor => getVendorId(vendor));
    const rosterSize = getRosterSize(knownVendors, npcCount);

    if (rosterSize === 0) {
        return [];
    }

    const knownVendorIds = new Set(knownVendors.map(getVendorId));
    const savedRosterIds = normalizeSessionVendorIds(savedVendorIds)
        .filter(vendorId => knownVendorIds.has(vendorId))
        .slice(0, rosterSize);
    const savedRosterIdSet = new Set(savedRosterIds);
    const remainingVendors = knownVendors.filter(vendor => !savedRosterIdSet.has(getVendorId(vendor)));
    const orderedRemainingVendors = testMode ? remainingVendors : shuffleVendors(remainingVendors, random);

    return [
        ...savedRosterIds,
        ...orderedRemainingVendors.map(getVendorId)
    ].slice(0, rosterSize);
}
