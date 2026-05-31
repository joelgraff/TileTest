export const QUEST_SESSION_COOKIE_NAME = 'vcf_quest_session';

export function normalizeSessionVendorIds(vendorIds = []) {
    const seenVendorIds = new Set();
    const normalizedVendorIds = [];

    for (const vendorId of Array.isArray(vendorIds) ? vendorIds : []) {
        const normalizedVendorId = typeof vendorId === 'number' && Number.isFinite(vendorId)
            ? String(vendorId)
            : (typeof vendorId === 'string' ? vendorId.trim() : '');

        if (!normalizedVendorId || seenVendorIds.has(normalizedVendorId)) {
            continue;
        }

        seenVendorIds.add(normalizedVendorId);
        normalizedVendorIds.push(normalizedVendorId);
    }

    return normalizedVendorIds;
}

function getDefaultDocument() {
    return typeof document !== 'undefined' ? document : null;
}

export function getQuestSessionCookieValue(cookieString = '', cookieName = QUEST_SESSION_COOKIE_NAME) {
    const cookiePrefix = `${cookieName}=`;
    const decodedCookie = decodeURIComponent(cookieString ?? '');

    for (let cookie of decodedCookie.split(';')) {
        cookie = cookie.trim();
        if (cookie.startsWith(cookiePrefix)) {
            return cookie.substring(cookiePrefix.length);
        }
    }

    return null;
}

export function readQuestSessionState({ documentRef = getDefaultDocument(), onParseError = null } = {}) {
    if (!documentRef?.cookie) {
        return null;
    }

    const cookieValue = getQuestSessionCookieValue(documentRef.cookie);
    if (!cookieValue) {
        return null;
    }

    try {
        return JSON.parse(cookieValue);
    } catch (error) {
        onParseError?.(error);
        return null;
    }
}

export function writeQuestSessionState(sessionData, { documentRef = getDefaultDocument(), expiresInHours = 24 } = {}) {
    if (!documentRef) {
        return false;
    }

    const expires = new Date();
    expires.setHours(expires.getHours() + expiresInHours);

    documentRef.cookie = `${QUEST_SESSION_COOKIE_NAME}=${JSON.stringify(sessionData)}; expires=${expires.toUTCString()}; path=/`;
    return true;
}

export function clearQuestSessionState({ documentRef = getDefaultDocument() } = {}) {
    if (!documentRef) {
        return false;
    }

    documentRef.cookie = `${QUEST_SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    return true;
}
