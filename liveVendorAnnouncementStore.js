function normalizeVendorId(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return typeof value === 'string' ? value.trim() : '';
}

function getObjectText(value) {
    return typeof value?.text === 'string' ? value.text : '';
}

function collectAnnouncementLines(value) {
    if (Array.isArray(value)) {
        return value.flatMap(collectAnnouncementLines);
    }

    if (typeof value === 'string') {
        return value.split(/\r?\n/);
    }

    const objectText = getObjectText(value);
    return objectText ? objectText.split(/\r?\n/) : [];
}

function hasOwn(value, propertyName) {
    return Object.prototype.hasOwnProperty.call(value, propertyName);
}

export function normalizeAnnouncementLines(value) {
    return collectAnnouncementLines(value)
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

function getEntryAnnouncements(entry) {
    if (hasOwn(entry, 'announcements')) {
        return entry.announcements;
    }

    if (hasOwn(entry, 'announcement')) {
        return entry.announcement;
    }

    return entry.text;
}

export function normalizeVendorAnnouncementEntry(entry) {
    if (!entry || typeof entry !== 'object') {
        return null;
    }

    const vendorId = normalizeVendorId(entry.vendorId ?? entry.vendor_id ?? entry.id);
    if (!vendorId) {
        return null;
    }

    return {
        vendorId,
        announcements: normalizeAnnouncementLines(getEntryAnnouncements(entry))
    };
}

function getSnapshotEntries(snapshot) {
    if (Array.isArray(snapshot)) {
        return snapshot;
    }

    if (!snapshot || typeof snapshot !== 'object') {
        return [];
    }

    if (Array.isArray(snapshot.announcements)) {
        return snapshot.announcements;
    }

    if (snapshot.announcements && typeof snapshot.announcements === 'object') {
        return Object.entries(snapshot.announcements).map(([vendorId, announcements]) => ({
            vendorId,
            announcements
        }));
    }

    if (Array.isArray(snapshot.vendors)) {
        return snapshot.vendors;
    }

    return [snapshot];
}

export function normalizeVendorAnnouncementSnapshot(snapshot) {
    const announcementsByVendorId = new Map();

    for (const entry of getSnapshotEntries(snapshot)) {
        const normalizedEntry = normalizeVendorAnnouncementEntry(entry);
        if (!normalizedEntry || normalizedEntry.announcements.length === 0) {
            continue;
        }

        const currentAnnouncements = announcementsByVendorId.get(normalizedEntry.vendorId) ?? [];
        announcementsByVendorId.set(normalizedEntry.vendorId, [
            ...currentAnnouncements,
            ...normalizedEntry.announcements
        ]);
    }

    return Array.from(announcementsByVendorId, ([vendorId, announcements]) => ({
        vendorId,
        announcements
    }));
}

export class VendorAnnouncementStore {
    constructor(initialSnapshot = null) {
        this.announcementsByVendorId = new Map();

        if (initialSnapshot) {
            this.replaceSnapshot(initialSnapshot);
        }
    }

    getAnnouncementsForVendor(vendorId) {
        const normalizedVendorId = normalizeVendorId(vendorId);
        return [...(this.announcementsByVendorId.get(normalizedVendorId) ?? [])];
    }

    setAnnouncements(vendorId, announcements) {
        const normalizedVendorId = normalizeVendorId(vendorId);
        if (!normalizedVendorId) {
            return null;
        }

        const normalizedAnnouncements = normalizeAnnouncementLines(announcements);
        if (normalizedAnnouncements.length === 0) {
            this.announcementsByVendorId.delete(normalizedVendorId);
        } else {
            this.announcementsByVendorId.set(normalizedVendorId, normalizedAnnouncements);
        }

        return {
            vendorId: normalizedVendorId,
            announcements: normalizedAnnouncements
        };
    }

    applyUpdate(update) {
        const normalizedUpdate = normalizeVendorAnnouncementEntry(update);
        if (!normalizedUpdate) {
            return null;
        }

        return this.setAnnouncements(normalizedUpdate.vendorId, normalizedUpdate.announcements);
    }

    replaceSnapshot(snapshot) {
        this.announcementsByVendorId.clear();

        for (const entry of normalizeVendorAnnouncementSnapshot(snapshot)) {
            this.setAnnouncements(entry.vendorId, entry.announcements);
        }

        return this.toJSON();
    }

    toJSON() {
        const announcements = Array.from(this.announcementsByVendorId, ([vendorId, vendorAnnouncements]) => ({
            vendorId,
            announcements: [...vendorAnnouncements]
        })).sort((left, right) => left.vendorId.localeCompare(right.vendorId, undefined, { numeric: true }));

        return { announcements };
    }
}
