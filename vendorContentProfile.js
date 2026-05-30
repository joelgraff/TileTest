function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function normalizeTextList(values) {
    return normalizeArray(values)
        .map(value => {
            if (typeof value === 'string') {
                return value;
            }

            if (typeof value?.text === 'string') {
                return value.text;
            }

            if (typeof value?.name === 'string') {
                return value.name;
            }

            return '';
        })
        .filter(value => value.trim().length > 0);
}

const MODERATION_STATUSES = new Set([
    'approved',
    'draft',
    'needs_review',
    'rejected'
]);

function normalizeModerationStatus(value, fallback = 'approved') {
    if (typeof value !== 'string') {
        return fallback;
    }

    const status = value.trim().toLowerCase();
    return MODERATION_STATUSES.has(status) ? status : fallback;
}

function normalizeDescriptionOverride(vendorData, descriptionOverride) {
    return normalizeText(
        descriptionOverride,
        normalizeText(vendorData.descriptionOverride, normalizeText(vendorData.boothDescriptionOverride))
    );
}

function normalizeItems(items) {
    return normalizeArray(items).filter(item => (
        item &&
        typeof item === 'object' &&
        typeof item.name === 'string' &&
        item.name.trim().length > 0
    ));
}

function normalizeResponses(responses) {
    return normalizeArray(responses).filter(response => (
        response &&
        typeof response === 'object' &&
        typeof response.action === 'string' &&
        typeof response.text === 'string' &&
        response.text.trim().length > 0
    ));
}

export function createVendorContentProfile(vendorData = {}, {
    domainName = 'Unknown Domain',
    items = [],
    facts = [],
    announcements = [],
    descriptionOverride = '',
    featuredItems = [],
    clueText = '',
    moderationStatus = ''
} = {}) {
    const responses = normalizeResponses(vendorData.dialog?.responses);
    const resolvedDescriptionOverride = normalizeDescriptionOverride(vendorData, descriptionOverride);

    return {
        id: normalizeText(vendorData.id),
        name: normalizeText(vendorData.name, 'Unknown Vendor'),
        booth: normalizeText(vendorData.booth, 'Unknown Booth'),
        description: normalizeText(resolvedDescriptionOverride, normalizeText(vendorData.description, 'No description available.')),
        descriptionOverride: resolvedDescriptionOverride,
        domainId: normalizeText(vendorData.domain_id),
        domainName: normalizeText(domainName, 'Unknown Domain'),
        items: normalizeItems(items),
        facts: normalizeTextList(facts),
        featuredItems: [
            ...normalizeTextList(vendorData.featuredItems),
            ...normalizeTextList(vendorData.featuredDemos),
            ...normalizeTextList(featuredItems)
        ],
        announcements: [
            ...normalizeTextList(vendorData.announcements),
            ...normalizeTextList(announcements)
        ],
        clueText: normalizeText(clueText, normalizeText(vendorData.clueText)),
        moderationStatus: normalizeModerationStatus(
            moderationStatus,
            normalizeModerationStatus(vendorData.moderationStatus)
        ),
        responses,
        exitResponse: responses.find(response => response.action === 'end') ?? null
    };
}

export function createVendorFactLines(vendorContent) {
    return normalizeTextList(vendorContent?.facts).map(fact => `• ${fact}`);
}

export function createVendorAnnouncementLines(vendorContent) {
    return normalizeTextList(vendorContent?.announcements).map(announcement => `• ${announcement}`);
}

export function createVendorFeaturedItemLines(vendorContent) {
    return normalizeTextList(vendorContent?.featuredItems).map(featuredItem => `• ${featuredItem}`);
}

export function createVendorClueLine(vendorContent) {
    return normalizeText(vendorContent?.clueText);
}