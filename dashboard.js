const vendorSelect = document.querySelector('#vendor-select');
const descriptionInput = document.querySelector('#description-input');
const featuredInput = document.querySelector('#featured-input');
const announcementInput = document.querySelector('#announcement-input');
const clueInput = document.querySelector('#clue-input');
const contentForm = document.querySelector('#content-form');
const clearButton = document.querySelector('#clear-button');
const statusElement = document.querySelector('#status');
const contentList = document.querySelector('#content-list');
const trailSelect = document.querySelector('#trail-select');
const trailTitleInput = document.querySelector('#trail-title-input');
const trailDescriptionInput = document.querySelector('#trail-description-input');
const trailOrderedInput = document.querySelector('#trail-ordered-input');
const trailStopsInput = document.querySelector('#trail-stops-input');
const trailRewardPointsInput = document.querySelector('#trail-reward-points-input');
const trailRewardDescriptionInput = document.querySelector('#trail-reward-description-input');
const trailCompletionInput = document.querySelector('#trail-completion-input');
const trailForm = document.querySelector('#trail-form');
const trailResetButton = document.querySelector('#trail-reset-button');
const trailStatusElement = document.querySelector('#trail-status');
const trailList = document.querySelector('#trail-list');
const dashboardTabs = Array.from(document.querySelectorAll('[data-dashboard-tab]'));
const dashboardPages = Array.from(document.querySelectorAll('[data-dashboard-page]'));

const state = {
    vendors: [],
    contentByVendorId: new Map(),
    trailsById: new Map()
};

function setStatus(message, isError = false, element = statusElement) {
    element.textContent = message;
    element.style.color = isError ? '#b42318' : '#1d5f8f';
}

function showDashboardPage(pageName) {
    dashboardTabs.forEach((tab) => {
        tab.setAttribute('aria-selected', String(tab.dataset.dashboardTab === pageName));
    });

    dashboardPages.forEach((page) => {
        page.hidden = page.dataset.dashboardPage !== pageName;
    });
}

function getVendorLabel(vendor) {
    return `${vendor.name} (${vendor.booth})`;
}

function getSelectedVendorId() {
    return vendorSelect.value;
}

function getSelectedTrailId() {
    return trailSelect.value;
}

function splitTextInput(input) {
    return input.value
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

function normalizeTextList(value) {
    return Array.isArray(value)
        ? value.filter(item => typeof item === 'string' && item.trim().length > 0)
        : [];
}

function createDefaultContent() {
    return {
        descriptionOverride: '',
        featuredItems: [],
        announcements: [],
        clueText: '',
        moderationStatus: 'approved'
    };
}

function normalizeContentEntry(entry) {
    if (!entry || typeof entry !== 'object' || !entry.vendorId) {
        return null;
    }

    return {
        vendorId: String(entry.vendorId),
        descriptionOverride: typeof entry.descriptionOverride === 'string' ? entry.descriptionOverride : '',
        featuredItems: normalizeTextList(entry.featuredItems),
        announcements: normalizeTextList(entry.announcements),
        clueText: typeof entry.clueText === 'string' ? entry.clueText : '',
        moderationStatus: typeof entry.moderationStatus === 'string' ? entry.moderationStatus : 'approved'
    };
}

function normalizeTrailStop(stop) {
    if (!stop || typeof stop !== 'object' || !stop.vendorId) {
        return null;
    }

    return {
        id: String(stop.id ?? stop.vendorId),
        vendorId: String(stop.vendorId),
        clueText: typeof stop.clueText === 'string' ? stop.clueText : '',
        goalText: typeof stop.goalText === 'string' ? stop.goalText : ''
    };
}

function normalizeTrailEntry(entry) {
    if (!entry || typeof entry !== 'object' || !entry.id) {
        return null;
    }

    const stops = Array.isArray(entry.stops)
        ? entry.stops.map(normalizeTrailStop).filter(Boolean)
        : [];

    if (stops.length < 2) {
        return null;
    }

    return {
        id: String(entry.id),
        title: typeof entry.title === 'string' ? entry.title : 'Discovery Trail',
        description: typeof entry.description === 'string' ? entry.description : '',
        ordered: entry.ordered === true,
        stops,
        reward: {
            points: Number.isFinite(entry.reward?.points) ? entry.reward.points : stops.length * 15,
            description: typeof entry.reward?.description === 'string' ? entry.reward.description : ''
        },
        completionText: typeof entry.completionText === 'string' ? entry.completionText : ''
    };
}

function applyContentSnapshot(snapshot) {
    const contentByVendorId = new Map();

    for (const entry of snapshot.vendors ?? []) {
        const normalizedEntry = normalizeContentEntry(entry);
        if (normalizedEntry) {
            contentByVendorId.set(normalizedEntry.vendorId, normalizedEntry);
        }
    }

    for (const entry of snapshot.announcements ?? []) {
        const normalizedEntry = normalizeContentEntry(entry);
        if (!normalizedEntry) {
            continue;
        }

        contentByVendorId.set(normalizedEntry.vendorId, {
            ...(contentByVendorId.get(normalizedEntry.vendorId) ?? createDefaultContent()),
            vendorId: normalizedEntry.vendorId,
            announcements: normalizedEntry.announcements
        });
    }

    state.contentByVendorId = contentByVendorId;
}

function applyTrailSnapshot(snapshot) {
    const trailsById = new Map();

    for (const entry of snapshot.trails ?? []) {
        const normalizedEntry = normalizeTrailEntry(entry);
        if (normalizedEntry) {
            trailsById.set(normalizedEntry.id, normalizedEntry);
        }
    }

    state.trailsById = trailsById;
}

function renderVendorOptions() {
    vendorSelect.replaceChildren(...state.vendors.map((vendor) => {
        const option = document.createElement('option');
        option.value = vendor.id;
        option.textContent = getVendorLabel(vendor);
        return option;
    }));
}

function renderTrailOptions() {
    trailSelect.replaceChildren(...Array.from(state.trailsById.values()).map((trail) => {
        const option = document.createElement('option');
        option.value = trail.id;
        option.textContent = trail.title;
        return option;
    }));
}

function getSelectedContent() {
    return state.contentByVendorId.get(getSelectedVendorId()) ?? createDefaultContent();
}

function getSelectedTrail() {
    return state.trailsById.get(getSelectedTrailId()) ?? null;
}

function renderSelectedContent() {
    const selectedContent = getSelectedContent();
    descriptionInput.value = selectedContent.descriptionOverride;
    featuredInput.value = selectedContent.featuredItems.join('\n');
    announcementInput.value = selectedContent.announcements.join('\n');
    clueInput.value = selectedContent.clueText;
}

function createStopLine(stop) {
    return `${stop.vendorId} | ${stop.clueText} | ${stop.goalText}`;
}

function renderSelectedTrail() {
    const selectedTrail = getSelectedTrail();

    trailTitleInput.value = selectedTrail?.title ?? '';
    trailDescriptionInput.value = selectedTrail?.description ?? '';
    trailOrderedInput.checked = selectedTrail?.ordered === true;
    trailStopsInput.value = selectedTrail?.stops?.map(createStopLine).join('\n') ?? '';
    trailRewardPointsInput.value = selectedTrail?.reward?.points ?? '';
    trailRewardDescriptionInput.value = selectedTrail?.reward?.description ?? '';
    trailCompletionInput.value = selectedTrail?.completionText ?? '';
}

function hasPreviewContent(content) {
    return Boolean(
        content.descriptionOverride ||
        content.featuredItems.length > 0 ||
        content.announcements.length > 0 ||
        content.clueText
    );
}

function getPreviewLines(content) {
    const lines = [];

    if (content.descriptionOverride) {
        lines.push(`Description: ${content.descriptionOverride}`);
    }

    if (content.featuredItems.length > 0) {
        lines.push(`Featured: ${content.featuredItems.join(' / ')}`);
    }

    if (content.announcements.length > 0) {
        lines.push(`Booth Notes: ${content.announcements.join(' / ')}`);
    }

    if (content.clueText) {
        lines.push(`Clue: ${content.clueText}`);
    }

    return lines;
}

function renderContentList() {
    const entries = state.vendors
        .map(vendor => ({
            vendor,
            content: state.contentByVendorId.get(vendor.id) ?? createDefaultContent()
        }))
        .filter(entry => hasPreviewContent(entry.content));

    if (entries.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'content-empty';
        emptyState.textContent = 'No live vendor content saved.';
        contentList.replaceChildren(emptyState);
        return;
    }

    contentList.replaceChildren(...entries.map((entry) => {
        const item = document.createElement('div');
        const vendorName = document.createElement('span');

        item.className = 'content-item';
        vendorName.className = 'content-vendor';
        vendorName.textContent = getVendorLabel(entry.vendor);

        item.append(vendorName, ...getPreviewLines(entry.content).map((line) => {
            const lineElement = document.createElement('div');
            lineElement.textContent = line;
            return lineElement;
        }));
        return item;
    }));
}

function getVendorName(vendorId) {
    const vendor = state.vendors.find(entry => entry.id === vendorId);
    return vendor ? getVendorLabel(vendor) : vendorId;
}

function renderTrailList() {
    const trails = Array.from(state.trailsById.values());

    if (trails.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'content-empty';
        emptyState.textContent = 'No discovery trails saved.';
        trailList.replaceChildren(emptyState);
        return;
    }

    trailList.replaceChildren(...trails.map((trail) => {
        const item = document.createElement('div');
        const title = document.createElement('span');
        const meta = document.createElement('div');

        item.className = 'content-item';
        title.className = 'content-vendor';
        title.textContent = trail.title;
        meta.textContent = `${trail.ordered ? 'Ordered' : 'Any order'} / ${trail.stops.length} stops / ${trail.reward.points} points`;
        item.append(title, meta, ...trail.stops.map((stop, index) => {
            const stopElement = document.createElement('div');
            stopElement.textContent = `${index + 1}. ${getVendorName(stop.vendorId)}: ${stop.clueText}`;
            return stopElement;
        }));
        return item;
    }));
}

function renderDashboard() {
    renderSelectedContent();
    renderSelectedTrail();
    renderContentList();
    renderTrailList();
}

async function fetchJson(url, options) {
    const requestOptions = options ?? {};
    const response = await fetch(url, {
        ...requestOptions,
        headers: { Accept: 'application/json', ...(requestOptions.headers ?? {}) }
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error ?? `Request failed with ${response.status}`);
    }

    return response.json();
}

async function loadDashboardData() {
    const [vendorPayload, announcementPayload, trailPayload] = await Promise.all([
        fetchJson('/api/vendors'),
        fetchJson('/api/vendor-content'),
        fetchJson('/api/discovery-trails')
    ]);

    state.vendors = vendorPayload.vendors ?? [];
    applyContentSnapshot(announcementPayload);
    applyTrailSnapshot(trailPayload);
    renderVendorOptions();
    renderTrailOptions();
    renderDashboard();
}

vendorSelect.addEventListener('change', () => {
    renderSelectedContent();
});

trailSelect.addEventListener('change', () => {
    renderSelectedTrail();
});

dashboardTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        showDashboardPage(tab.dataset.dashboardTab);
    });
});

clearButton.addEventListener('click', () => {
    descriptionInput.value = '';
    featuredInput.value = '';
    announcementInput.value = '';
    clueInput.value = '';
    descriptionInput.focus();
});

trailResetButton.addEventListener('click', () => {
    renderSelectedTrail();
    trailTitleInput.focus();
});

function createStopId(vendorId, index) {
    return `stop-${index + 1}-${vendorId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function parseTrailStops() {
    return trailStopsInput.value
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, index) => {
            const [vendorId = '', clueText = '', goalText = ''] = line.split('|').map(part => part.trim());

            return {
                id: createStopId(vendorId, index),
                vendorId,
                clueText,
                goalText
            };
        })
        .filter(stop => stop.vendorId);
}

contentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('Saving...');

    try {
        const payload = await fetchJson('/api/vendor-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vendorId: getSelectedVendorId(),
                descriptionOverride: descriptionInput.value.trim(),
                featuredItems: splitTextInput(featuredInput),
                announcements: splitTextInput(announcementInput),
                clueText: clueInput.value.trim()
            })
        });

        applyContentSnapshot(payload);
        renderDashboard();
        setStatus('Saved. Reopen that vendor dialog in the game to see the update.');
    } catch (error) {
        setStatus(error.message, true);
    }
});

trailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('Saving trail...', false, trailStatusElement);

    try {
        const payload = await fetchJson('/api/discovery-trails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: getSelectedTrailId(),
                title: trailTitleInput.value.trim(),
                description: trailDescriptionInput.value.trim(),
                ordered: trailOrderedInput.checked,
                stops: parseTrailStops(),
                reward: {
                    points: Number.parseInt(trailRewardPointsInput.value, 10),
                    description: trailRewardDescriptionInput.value.trim()
                },
                completionText: trailCompletionInput.value.trim()
            })
        });

        applyTrailSnapshot(payload);
        renderTrailOptions();
        trailSelect.value = payload.updated.id;
        renderDashboard();
        setStatus('Trail saved. Open a new live game session to use the updated trail.', false, trailStatusElement);
    } catch (error) {
        setStatus(error.message, true, trailStatusElement);
    }
});

loadDashboardData().catch((error) => {
    setStatus(error.message, true);
});
