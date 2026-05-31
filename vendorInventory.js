const DEFAULT_VENDOR_ITEM_LIMIT = 4;

function normalizeText(value, fallback = '') {
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function getItemKey(item = {}) {
    return normalizeText(item.id, normalizeText(item.name));
}

function getVendorItemPrefix(vendorId) {
    return vendorId ? `item_${vendorId}_` : '';
}

function createStableOffset(seed, length) {
    if (length <= 0) {
        return 0;
    }

    return [...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0) % length;
}

function uniqueItems(items) {
    const seenKeys = new Set();
    const unique = [];

    items.forEach(item => {
        const key = getItemKey(item);
        if (!key || seenKeys.has(key)) {
            return;
        }

        seenKeys.add(key);
        unique.push(item);
    });

    return unique;
}

export function getVendorInventoryItems(vendorData = {}, domainItems = [], {
    limit = DEFAULT_VENDOR_ITEM_LIMIT
} = {}) {
    const safeDomainItems = Array.isArray(domainItems) ? domainItems : [];
    const vendorId = normalizeText(vendorData.id);
    const vendorPrefix = getVendorItemPrefix(vendorId);
    const directItems = vendorPrefix
        ? safeDomainItems.filter(item => getItemKey(item).startsWith(vendorPrefix))
        : [];
    const rotatedItems = safeDomainItems.map((_, index, items) => {
        const offset = createStableOffset(vendorId || normalizeText(vendorData.name), items.length);

        return items[(index + offset) % items.length];
    });

    return uniqueItems([...directItems, ...rotatedItems]).slice(0, limit);
}

export function getInventoryItemKey(item = {}) {
    return getItemKey(item);
}