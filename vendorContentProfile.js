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

            return '';
        })
        .filter(value => value.trim().length > 0);
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
    announcements = []
} = {}) {
    const responses = normalizeResponses(vendorData.dialog?.responses);

    return {
        id: normalizeText(vendorData.id),
        name: normalizeText(vendorData.name, 'Unknown Vendor'),
        booth: normalizeText(vendorData.booth, 'Unknown Booth'),
        description: normalizeText(vendorData.description, 'No description available.'),
        domainId: normalizeText(vendorData.domain_id),
        domainName: normalizeText(domainName, 'Unknown Domain'),
        items: normalizeItems(items),
        facts: normalizeTextList(facts),
        announcements: [
            ...normalizeTextList(vendorData.announcements),
            ...normalizeTextList(announcements)
        ],
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