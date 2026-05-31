function normalizeText(value, fallback = '') {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeBoolean(value) {
    return value === true || value === 'true';
}

function normalizePoints(value, fallback = 0) {
    const numericValue = typeof value === 'string' ? Number.parseInt(value, 10) : value;

    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function normalizeTrailStop(stop, index) {
    if (!stop || typeof stop !== 'object') {
        return null;
    }

    const vendorId = normalizeText(stop.vendorId ?? stop.vendor_id);
    if (!vendorId) {
        return null;
    }

    return {
        id: normalizeText(stop.id, `stop-${index + 1}`),
        vendorId,
        clueText: normalizeText(stop.clueText ?? stop.clue),
        goalText: normalizeText(stop.goalText ?? stop.goal)
    };
}

function normalizeTrailStops(stops) {
    if (!Array.isArray(stops)) {
        return [];
    }

    const seenVendorIds = new Set();
    const normalizedStops = [];

    stops.forEach((stop, index) => {
        const normalizedStop = normalizeTrailStop(stop, index);
        if (!normalizedStop || seenVendorIds.has(normalizedStop.vendorId)) {
            return;
        }

        seenVendorIds.add(normalizedStop.vendorId);
        normalizedStops.push(normalizedStop);
    });

    return normalizedStops;
}

function normalizeReward(entry, stops) {
    const points = normalizePoints(entry.reward?.points ?? entry.rewardPoints, stops.length * 15);

    return {
        points,
        description: normalizeText(
            entry.reward?.description ?? entry.rewardDescription,
            `${points} points for completing ${normalizeText(entry.title, 'the discovery trail')}`
        )
    };
}

export function normalizeDiscoveryTrailEntry(entry) {
    if (!entry || typeof entry !== 'object') {
        return null;
    }

    const id = normalizeText(entry.id ?? entry.trailId);
    const stops = normalizeTrailStops(entry.stops ?? entry.objectives);

    if (!id || stops.length < 2) {
        return null;
    }

    return {
        id,
        title: normalizeText(entry.title, 'Discovery Trail'),
        description: normalizeText(entry.description, 'Visit these exhibitors and collect a clue from each booth.'),
        ordered: normalizeBoolean(entry.ordered),
        stops,
        reward: normalizeReward(entry, stops),
        completionText: normalizeText(entry.completionText)
    };
}

function getDiscoveryTrailSnapshotEntries(snapshot) {
    if (Array.isArray(snapshot)) {
        return snapshot;
    }

    if (!snapshot || typeof snapshot !== 'object') {
        return [];
    }

    if (Array.isArray(snapshot.trails)) {
        return snapshot.trails;
    }

    if (Array.isArray(snapshot.discoveryTrails)) {
        return snapshot.discoveryTrails;
    }

    return [snapshot];
}

function cloneTrail(trail) {
    return {
        id: trail.id,
        title: trail.title,
        description: trail.description,
        ordered: trail.ordered,
        stops: trail.stops.map(stop => ({ ...stop })),
        reward: { ...trail.reward },
        completionText: trail.completionText
    };
}

export function normalizeDiscoveryTrailSnapshot(snapshot) {
    const trailsById = new Map();

    for (const entry of getDiscoveryTrailSnapshotEntries(snapshot)) {
        const normalizedEntry = normalizeDiscoveryTrailEntry(entry);
        if (!normalizedEntry) {
            continue;
        }

        trailsById.set(normalizedEntry.id, normalizedEntry);
    }

    return Array.from(trailsById.values()).map(cloneTrail);
}

export class DiscoveryTrailStore {
    constructor(initialSnapshot = null) {
        this.trailsById = new Map();

        if (initialSnapshot) {
            this.replaceSnapshot(initialSnapshot);
        }
    }

    getTrails() {
        return Array.from(this.trailsById.values())
            .map(cloneTrail)
            .sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true }));
    }

    setTrail(trail) {
        const normalizedTrail = normalizeDiscoveryTrailEntry(trail);
        if (!normalizedTrail) {
            return null;
        }

        this.trailsById.set(normalizedTrail.id, normalizedTrail);
        return cloneTrail(normalizedTrail);
    }

    applyUpdate(update) {
        return this.setTrail(update);
    }

    replaceSnapshot(snapshot) {
        this.trailsById.clear();

        for (const trail of normalizeDiscoveryTrailSnapshot(snapshot)) {
            this.trailsById.set(trail.id, trail);
        }

        return this.toJSON();
    }

    toJSON() {
        return { trails: this.getTrails() };
    }
}