const DEFAULT_MODERATION_STATUS = 'approved';
const MODERATION_STATUSES = new Set([
    DEFAULT_MODERATION_STATUS,
    'draft',
    'needs_review',
    'rejected'
]);

function normalizeVendorId(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return typeof value === 'string' ? value.trim() : '';
}

function hasOwn(value, propertyName) {
    return Object.prototype.hasOwnProperty.call(value, propertyName);
}

function getObjectText(value) {
    return typeof value?.text === 'string' ? value.text : '';
}

function getObjectName(value) {
    return typeof value?.name === 'string' ? value.name : '';
}

function collectTextLines(value) {
    if (Array.isArray(value)) {
        return value.flatMap(collectTextLines);
    }

    if (typeof value === 'string') {
        return value.split(/\r?\n/);
    }

    const objectText = getObjectText(value);
    if (objectText) {
        return objectText.split(/\r?\n/);
    }

    const objectName = getObjectName(value);
    return objectName ? objectName.split(/\r?\n/) : [];
}

export function normalizeAnnouncementLines(value) {
    return collectTextLines(value)
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

function normalizeTextBlock(value) {
    if (typeof value === 'string') {
        return value.trim();
    }

    return getObjectText(value).trim();
}

function normalizeModerationStatus(value, fallback = DEFAULT_MODERATION_STATUS) {
    if (typeof value !== 'string') {
        return fallback;
    }

    const status = value.trim().toLowerCase();
    return MODERATION_STATUSES.has(status) ? status : fallback;
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

function getEntryDescriptionOverride(entry) {
    if (hasOwn(entry, 'descriptionOverride')) {
        return entry.descriptionOverride;
    }

    if (hasOwn(entry, 'boothDescriptionOverride')) {
        return entry.boothDescriptionOverride;
    }

    return entry.boothDescription;
}

function getEntryFeaturedItems(entry) {
    if (hasOwn(entry, 'featuredItems')) {
        return entry.featuredItems;
    }

    return entry.featuredDemos;
}

function getEntryClueText(entry) {
    if (hasOwn(entry, 'clueText')) {
        return entry.clueText;
    }

    return entry.clue;
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

function getAnnouncementSnapshotEntries(snapshot) {
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

    for (const entry of getAnnouncementSnapshotEntries(snapshot)) {
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

function normalizeVendorContentPayload(entry) {
    return {
        descriptionOverride: normalizeTextBlock(getEntryDescriptionOverride(entry)),
        featuredItems: normalizeAnnouncementLines(getEntryFeaturedItems(entry)),
        announcements: normalizeAnnouncementLines(getEntryAnnouncements(entry)),
        clueText: normalizeTextBlock(getEntryClueText(entry)),
        moderationStatus: normalizeModerationStatus(entry.moderationStatus)
    };
}

export function normalizeVendorContentEntry(entry) {
    if (!entry || typeof entry !== 'object') {
        return null;
    }

    const vendorId = normalizeVendorId(entry.vendorId ?? entry.vendor_id ?? entry.id);
    if (!vendorId) {
        return null;
    }

    return {
        vendorId,
        ...normalizeVendorContentPayload(entry)
    };
}

function entriesFromVendorContentMap(contentMap) {
    return Object.entries(contentMap).map(([vendorId, content]) => ({
        vendorId,
        ...(content && typeof content === 'object' ? content : { announcements: content })
    }));
}

function getVendorContentSnapshotEntries(snapshot) {
    if (Array.isArray(snapshot)) {
        return snapshot;
    }

    if (!snapshot || typeof snapshot !== 'object') {
        return [];
    }

    if (Array.isArray(snapshot.vendors)) {
        return snapshot.vendors;
    }

    if (snapshot.vendors && typeof snapshot.vendors === 'object') {
        return entriesFromVendorContentMap(snapshot.vendors);
    }

    if (Array.isArray(snapshot.content)) {
        return snapshot.content;
    }

    if (snapshot.content && typeof snapshot.content === 'object') {
        return entriesFromVendorContentMap(snapshot.content);
    }

    return getAnnouncementSnapshotEntries(snapshot);
}

function createDefaultVendorContent() {
    return {
        descriptionOverride: '',
        featuredItems: [],
        announcements: [],
        clueText: '',
        moderationStatus: DEFAULT_MODERATION_STATUS
    };
}

function cloneVendorContent(content) {
    return {
        descriptionOverride: content.descriptionOverride,
        featuredItems: [...content.featuredItems],
        announcements: [...content.announcements],
        clueText: content.clueText,
        moderationStatus: content.moderationStatus
    };
}

function hasVendorContent(content) {
    return Boolean(
        content.descriptionOverride ||
        content.featuredItems.length > 0 ||
        content.announcements.length > 0 ||
        content.clueText ||
        content.moderationStatus !== DEFAULT_MODERATION_STATUS
    );
}

function mergeVendorContent(currentContent, normalizedEntry) {
    return {
        descriptionOverride: normalizedEntry.descriptionOverride || currentContent.descriptionOverride,
        featuredItems: [
            ...currentContent.featuredItems,
            ...normalizedEntry.featuredItems
        ],
        announcements: [
            ...currentContent.announcements,
            ...normalizedEntry.announcements
        ],
        clueText: normalizedEntry.clueText || currentContent.clueText,
        moderationStatus: normalizedEntry.moderationStatus !== DEFAULT_MODERATION_STATUS
            ? normalizedEntry.moderationStatus
            : currentContent.moderationStatus
    };
}

function toVendorContentJsonEntry(vendorId, content) {
    return {
        vendorId,
        descriptionOverride: content.descriptionOverride,
        featuredItems: [...content.featuredItems],
        announcements: [...content.announcements],
        clueText: content.clueText,
        moderationStatus: content.moderationStatus
    };
}

export function normalizeVendorContentSnapshot(snapshot) {
    const contentByVendorId = new Map();

    for (const entry of getVendorContentSnapshotEntries(snapshot)) {
        const normalizedEntry = normalizeVendorContentEntry(entry);
        if (!normalizedEntry || !hasVendorContent(normalizedEntry)) {
            continue;
        }

        const currentContent = contentByVendorId.get(normalizedEntry.vendorId) ?? createDefaultVendorContent();
        contentByVendorId.set(normalizedEntry.vendorId, mergeVendorContent(currentContent, normalizedEntry));
    }

    return Array.from(contentByVendorId, ([vendorId, content]) => ({
        vendorId,
        ...cloneVendorContent(content)
    }));
}

export class VendorContentStore {
    constructor(initialSnapshot = null) {
        this.contentByVendorId = new Map();

        if (initialSnapshot) {
            this.replaceSnapshot(initialSnapshot);
        }
    }

    getContentForVendor(vendorId) {
        const normalizedVendorId = normalizeVendorId(vendorId);
        const content = this.contentByVendorId.get(normalizedVendorId) ?? createDefaultVendorContent();
        return cloneVendorContent(content);
    }

    getAnnouncementsForVendor(vendorId) {
        return this.getContentForVendor(vendorId).announcements;
    }

    setContent(vendorId, content) {
        const normalizedVendorId = normalizeVendorId(vendorId);
        if (!normalizedVendorId) {
            return null;
        }

        const normalizedContent = normalizeVendorContentEntry({
            vendorId: normalizedVendorId,
            ...(content ?? {})
        });

        if (!normalizedContent) {
            return null;
        }

        const storedContent = cloneVendorContent(normalizedContent);
        if (hasVendorContent(storedContent)) {
            this.contentByVendorId.set(normalizedVendorId, storedContent);
        } else {
            this.contentByVendorId.delete(normalizedVendorId);
        }

        return {
            vendorId: normalizedVendorId,
            ...cloneVendorContent(storedContent)
        };
    }

    setAnnouncements(vendorId, announcements) {
        const normalizedVendorId = normalizeVendorId(vendorId);
        if (!normalizedVendorId) {
            return null;
        }

        return this.setContent(normalizedVendorId, {
            ...this.getContentForVendor(normalizedVendorId),
            announcements
        });
    }

    applyUpdate(update) {
        const normalizedUpdate = normalizeVendorContentEntry(update);
        if (!normalizedUpdate) {
            return null;
        }

        return this.setContent(normalizedUpdate.vendorId, normalizedUpdate);
    }

    applyAnnouncementUpdate(update) {
        const normalizedUpdate = normalizeVendorAnnouncementEntry(update);
        if (!normalizedUpdate) {
            return null;
        }

        return this.setAnnouncements(normalizedUpdate.vendorId, normalizedUpdate.announcements);
    }

    replaceSnapshot(snapshot) {
        this.contentByVendorId.clear();

        for (const entry of normalizeVendorContentSnapshot(snapshot)) {
            this.setContent(entry.vendorId, entry);
        }

        return this.toJSON();
    }

    toJSON() {
        const vendors = Array.from(this.contentByVendorId, ([vendorId, vendorContent]) => (
            toVendorContentJsonEntry(vendorId, vendorContent)
        )).sort((left, right) => left.vendorId.localeCompare(right.vendorId, undefined, { numeric: true }));
        const announcements = vendors
            .filter(vendorContent => vendorContent.announcements.length > 0)
            .map(vendorContent => ({
                vendorId: vendorContent.vendorId,
                announcements: [...vendorContent.announcements]
            }));

        return { vendors, announcements };
    }
}

export class VendorAnnouncementStore extends VendorContentStore {
    setAnnouncements(vendorId, announcements) {
        const update = super.setAnnouncements(vendorId, announcements);
        return update ? {
            vendorId: update.vendorId,
            announcements: update.announcements
        } : null;
    }

    applyUpdate(update) {
        return this.applyAnnouncementUpdate(update);
    }

    replaceSnapshot(snapshot) {
        this.contentByVendorId.clear();

        for (const entry of normalizeVendorAnnouncementSnapshot(snapshot)) {
            this.setAnnouncements(entry.vendorId, entry.announcements);
        }

        return this.toJSON();
    }

    toJSON() {
        const announcements = Array.from(this.contentByVendorId, ([vendorId, vendorContent]) => ({
            vendorId,
            announcements: [...vendorContent.announcements]
        })).filter(entry => entry.announcements.length > 0)
            .sort((left, right) => left.vendorId.localeCompare(right.vendorId, undefined, { numeric: true }));

        return { announcements };
    }
}
