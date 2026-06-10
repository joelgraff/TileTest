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

function getZoneLetter(value) {
    const textValue = typeof value === 'string' ? value.trim() : '';
    const match = textValue.match(/[A-Za-z]/);

    return match ? match[0].toUpperCase() : null;
}

function getVendorBoothZone(vendor) {
    return getZoneLetter(vendor?.booth);
}

function getZoneRequirementZone(zoneRequirement) {
    return getZoneLetter(zoneRequirement?.zone ?? zoneRequirement?.name ?? zoneRequirement);
}

function getZoneRequirementCount(zoneRequirement) {
    const explicitCount = Number(zoneRequirement?.count);
    if (Number.isFinite(explicitCount)) {
        return Math.max(0, Math.floor(explicitCount));
    }

    if (Array.isArray(zoneRequirement?.spawnPoints)) {
        return zoneRequirement.spawnPoints.length;
    }

    const spawnPointCount = Number(zoneRequirement?.spawnPoints?.length);
    if (Number.isFinite(spawnPointCount)) {
        return Math.max(0, Math.floor(spawnPointCount));
    }

    return 0;
}

function normalizeZoneRequirements(zoneRequirements = []) {
    const requirementsByZone = new Map();

    const addRequirement = (zone, count) => {
        if (!zone || !Number.isFinite(count) || count <= 0) {
            return;
        }

        requirementsByZone.set(zone, (requirementsByZone.get(zone) ?? 0) + Math.floor(count));
    };

    if (zoneRequirements instanceof Map) {
        for (const [zone, zoneRequirement] of zoneRequirements.entries()) {
            addRequirement(getZoneRequirementZone(zone), getZoneRequirementCount(zoneRequirement));
        }

        return [...requirementsByZone.entries()].map(([zone, count]) => ({ zone, count }));
    }

    if (Array.isArray(zoneRequirements)) {
        for (const zoneRequirement of zoneRequirements) {
            addRequirement(getZoneRequirementZone(zoneRequirement), getZoneRequirementCount(zoneRequirement));
        }

        return [...requirementsByZone.entries()].map(([zone, count]) => ({ zone, count }));
    }

    if (zoneRequirements && typeof zoneRequirements === 'object') {
        for (const [zone, zoneRequirement] of Object.entries(zoneRequirements)) {
            const count = Number.isFinite(zoneRequirement)
                ? zoneRequirement
                : getZoneRequirementCount(zoneRequirement);

            addRequirement(getZoneRequirementZone(zone), count);
        }
    }

    return [...requirementsByZone.entries()].map(([zone, count]) => ({ zone, count }));
}

function getVendorIndexes(vendors = []) {
    const vendorsById = new Map();
    const vendorsByZone = new Map();

    (Array.isArray(vendors) ? vendors : []).forEach(vendor => {
        const vendorId = getVendorId(vendor);

        if (!vendorId || vendorsById.has(vendorId)) {
            return;
        }

        vendorsById.set(vendorId, vendor);

        const zone = getVendorBoothZone(vendor);
        if (!zone) {
            return;
        }

        if (!vendorsByZone.has(zone)) {
            vendorsByZone.set(zone, []);
        }

        vendorsByZone.get(zone).push(vendor);
    });

    return { vendorsById, vendorsByZone };
}

function resolveZoneAwareSessionVendorIds({
    vendors = [],
    zoneRequirements = [],
    savedVendorIds = [],
    testMode = false,
    random = Math.random
} = {}) {
    const normalizedZoneRequirements = normalizeZoneRequirements(zoneRequirements);

    if (normalizedZoneRequirements.length === 0) {
        return [];
    }

    const { vendorsById, vendorsByZone } = getVendorIndexes(vendors);
    const normalizedSavedVendorIds = normalizeSessionVendorIds(savedVendorIds)
        .filter(vendorId => vendorsById.has(vendorId));
    const selectedVendorIds = [];
    const selectedVendorIdSet = new Set();

    normalizedZoneRequirements.forEach(({ zone, count }) => {
        if (!zone || count <= 0) {
            return;
        }

        const zoneSavedVendorIds = [];
        const zoneSavedVendorIdSet = new Set();

        normalizedSavedVendorIds.forEach(vendorId => {
            if (zoneSavedVendorIdSet.has(vendorId) || selectedVendorIdSet.has(vendorId)) {
                return;
            }

            const vendor = vendorsById.get(vendorId);
            if (!vendor || getVendorBoothZone(vendor) !== zone) {
                return;
            }

            zoneSavedVendorIdSet.add(vendorId);
            zoneSavedVendorIds.push(vendorId);
        });

        const remainingZoneVendors = (vendorsByZone.get(zone) ?? []).filter(vendor => {
            const vendorId = getVendorId(vendor);
            return vendorId && !zoneSavedVendorIdSet.has(vendorId);
        });
        const orderedRemainingZoneVendors = testMode
            ? remainingZoneVendors
            : shuffleVendors(remainingZoneVendors, random);

        [...zoneSavedVendorIds, ...orderedRemainingZoneVendors.map(getVendorId)]
            .slice(0, count)
            .forEach(vendorId => {
                if (!vendorId || selectedVendorIdSet.has(vendorId)) {
                    return;
                }

                selectedVendorIdSet.add(vendorId);
                selectedVendorIds.push(vendorId);
            });
    });

    return selectedVendorIds;
}

function resolveFlatSessionVendorIds({
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
    zoneRequirements = [],
    savedVendorIds = [],
    testMode = false,
    random = Math.random
} = {}) {
    const normalizedZoneRequirements = normalizeZoneRequirements(zoneRequirements);

    if (normalizedZoneRequirements.length > 0) {
        return resolveZoneAwareSessionVendorIds({
            vendors,
            zoneRequirements: normalizedZoneRequirements,
            savedVendorIds,
            testMode,
            random
        });
    }

    return resolveFlatSessionVendorIds({
        vendors,
        npcCount,
        savedVendorIds,
        testMode,
        random
    });
}
