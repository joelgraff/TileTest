const NEW_TRAIL_VALUE = '';

const pageMode = document.body?.dataset.dashboardMode ?? 'admin';
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
const trailNewButton = document.querySelector('#trail-new-button');
const trailIdInput = document.querySelector('#trail-id-input');
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
const vendorReferenceList = document.querySelector('#vendor-reference-list');

const state = {
    vendors: [],
    contentByVendorId: new Map(),
    trailsById: new Map(),
    isEditingNewTrail: false,
    fallbackSources: []
};

function setStatus(message, isError = false, element = statusElement) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.style.color = isError ? '#b42318' : '#1d5f8f';
}

function setPageStatus(message, isError = false) {
    setStatus(message, isError, pageMode === 'admin' ? trailStatusElement : statusElement);
}

function createOption(value, textContent, { disabled = false } = {}) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = textContent;
    option.disabled = disabled;
    return option;
}

function getVendorLabel(vendor) {
    const booth = vendor.booth ? ` (${vendor.booth})` : '';
    return `${vendor.name}${booth}`;
}

function getSelectedVendorId() {
    return vendorSelect?.value ?? '';
}

function getSelectedTrailId() {
    return state.isEditingNewTrail ? NEW_TRAIL_VALUE : (trailSelect?.value ?? NEW_TRAIL_VALUE);
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

function normalizeVendorEntry(entry) {
    if (!entry || typeof entry !== 'object' || entry.id === undefined) {
        return null;
    }

    return {
        id: String(entry.id),
        name: typeof entry.name === 'string' && entry.name.trim().length > 0 ? entry.name.trim() : `Vendor ${entry.id}`,
        booth: typeof entry.booth === 'string' ? entry.booth.trim() : ''
    };
}

function normalizeVendorPayload(payload) {
    const entries = Array.isArray(payload)
        ? payload
        : payload?.mapVendors ?? payload?.vendors ?? [];

    return entries
        .map(normalizeVendorEntry)
        .filter(Boolean);
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

    for (const entry of snapshot?.vendors ?? []) {
        const normalizedEntry = normalizeContentEntry(entry);
        if (normalizedEntry) {
            contentByVendorId.set(normalizedEntry.vendorId, normalizedEntry);
        }
    }

    for (const entry of snapshot?.announcements ?? []) {
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
    const trailEntries = Array.isArray(snapshot) ? snapshot : snapshot?.trails ?? [];
    const trailsById = new Map();

    for (const entry of trailEntries) {
        const normalizedEntry = normalizeTrailEntry(entry);
        if (normalizedEntry) {
            trailsById.set(normalizedEntry.id, normalizedEntry);
        }
    }

    state.trailsById = trailsById;
}

function setVendorFormDisabled(isDisabled) {
    for (const element of [descriptionInput, featuredInput, announcementInput, clueInput, clearButton, contentForm?.querySelector('button[type="submit"]')]) {
        if (element) {
            element.disabled = isDisabled;
        }
    }
}

function renderVendorOptions() {
    if (!vendorSelect) {
        return;
    }

    const selectedVendorId = getSelectedVendorId();
    const options = state.vendors.map((vendor) => createOption(vendor.id, getVendorLabel(vendor)));

    if (options.length === 0) {
        vendorSelect.replaceChildren(createOption('', 'No vendors available', { disabled: true }));
        vendorSelect.value = '';
        setVendorFormDisabled(true);
        return;
    }

    vendorSelect.replaceChildren(...options);
    vendorSelect.value = state.vendors.some(vendor => vendor.id === selectedVendorId)
        ? selectedVendorId
        : state.vendors[0].id;
    setVendorFormDisabled(false);
}

function renderTrailOptions() {
    if (!trailSelect) {
        return;
    }

    const selectedTrailId = getSelectedTrailId();
    const trails = Array.from(state.trailsById.values());
    const options = [createOption(NEW_TRAIL_VALUE, 'Create a new trail')];

    options.push(...trails.map((trail) => createOption(trail.id, trail.title)));
    trailSelect.replaceChildren(...options);

    if (!state.isEditingNewTrail && state.trailsById.has(selectedTrailId)) {
        trailSelect.value = selectedTrailId;
    } else if (trails.length > 0 && !state.isEditingNewTrail) {
        trailSelect.value = trails[0].id;
    } else {
        trailSelect.value = NEW_TRAIL_VALUE;
        state.isEditingNewTrail = true;
    }
}

function getSelectedContent() {
    return state.contentByVendorId.get(getSelectedVendorId()) ?? createDefaultContent();
}

function getSelectedTrail() {
    return state.trailsById.get(getSelectedTrailId()) ?? null;
}

function renderSelectedContent() {
    if (!descriptionInput || !featuredInput || !announcementInput || !clueInput) {
        return;
    }

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
    if (!trailIdInput || !trailTitleInput || !trailDescriptionInput || !trailOrderedInput || !trailStopsInput || !trailRewardPointsInput || !trailRewardDescriptionInput || !trailCompletionInput) {
        return;
    }

    const selectedTrail = getSelectedTrail();
    trailIdInput.value = selectedTrail?.id ?? '';
    trailTitleInput.value = selectedTrail?.title ?? '';
    trailDescriptionInput.value = selectedTrail?.description ?? '';
    trailOrderedInput.checked = selectedTrail?.ordered === true;
    trailStopsInput.value = selectedTrail?.stops?.map(createStopLine).join('\n') ?? '';
    trailRewardPointsInput.value = selectedTrail?.reward?.points ?? '';
    trailRewardDescriptionInput.value = selectedTrail?.reward?.description ?? '';
    trailCompletionInput.value = selectedTrail?.completionText ?? '';
}

function startNewTrail({ focus = true } = {}) {
    state.isEditingNewTrail = true;

    if (trailSelect) {
        trailSelect.value = NEW_TRAIL_VALUE;
    }

    renderSelectedTrail();

    if (focus) {
        trailTitleInput?.focus();
    }
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
    if (!contentList) {
        return;
    }

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
    if (!trailList) {
        return;
    }

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

function renderVendorReferenceList() {
    if (!vendorReferenceList) {
        return;
    }

    if (state.vendors.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'content-empty';
        emptyState.textContent = 'No vendors loaded.';
        vendorReferenceList.replaceChildren(emptyState);
        return;
    }

    vendorReferenceList.replaceChildren(...state.vendors.map((vendor) => {
        const item = document.createElement('div');
        const vendorId = document.createElement('span');
        const vendorName = document.createElement('span');

        item.className = 'reference-entry';
        vendorId.className = 'reference-id';
        vendorId.textContent = vendor.id;
        vendorName.textContent = getVendorLabel(vendor);
        item.append(vendorId, vendorName);
        return item;
    }));
}

function renderDashboard() {
    renderVendorOptions();
    renderTrailOptions();
    renderSelectedContent();
    renderSelectedTrail();
    renderContentList();
    renderTrailList();
    renderVendorReferenceList();
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

async function loadJsonWithFallback(apiUrl, fallbackUrl, fallbackPayload, sourceLabel) {
    try {
        return await fetchJson(apiUrl);
    } catch (apiError) {
        if (fallbackUrl) {
            try {
                const payload = await fetchJson(fallbackUrl);
                state.fallbackSources.push(sourceLabel);
                return payload;
            } catch (fallbackError) {
                state.fallbackSources.push(`${sourceLabel}: ${fallbackError.message}`);
            }
        } else {
            state.fallbackSources.push(sourceLabel);
        }

        return typeof fallbackPayload === 'function' ? fallbackPayload(apiError) : fallbackPayload;
    }
}

async function loadDashboardData() {
    state.fallbackSources = [];

    const [vendorPayload, contentPayload, trailPayload] = await Promise.all([
        loadJsonWithFallback('/api/vendors', '/vendors.json', { vendors: [] }, 'vendors'),
        loadJsonWithFallback('/api/vendor-content', null, { vendors: [], announcements: [] }, 'live content'),
        loadJsonWithFallback('/api/discovery-trails', '/discovery_trails.json', { trails: [] }, 'discovery trails')
    ]);

    state.vendors = normalizeVendorPayload(vendorPayload);
    applyContentSnapshot(contentPayload);
    applyTrailSnapshot(trailPayload);
    state.isEditingNewTrail = state.trailsById.size === 0;
    renderDashboard();

    if (state.fallbackSources.length > 0) {
        setPageStatus('Loaded bundled data. Saving changes requires the live server.', false);
    }
}

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

function slugifyTrailId(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getTrailIdForSave() {
    return slugifyTrailId(trailIdInput?.value ?? '') || slugifyTrailId(trailTitleInput?.value ?? '');
}

function getSaveErrorMessage(error) {
    const message = error instanceof Error ? error.message : String(error);

    if (/404|not found|failed to fetch/i.test(message)) {
        return `${message}. Start the live server with npm run serve:live and open this page from that server.`;
    }

    return message;
}

vendorSelect?.addEventListener('change', () => {
    renderSelectedContent();
});

trailSelect?.addEventListener('change', () => {
    state.isEditingNewTrail = trailSelect.value === NEW_TRAIL_VALUE;
    renderSelectedTrail();
});

clearButton?.addEventListener('click', () => {
    descriptionInput.value = '';
    featuredInput.value = '';
    announcementInput.value = '';
    clueInput.value = '';
    descriptionInput.focus();
});

trailNewButton?.addEventListener('click', () => {
    startNewTrail();
});

trailResetButton?.addEventListener('click', () => {
    if (state.isEditingNewTrail) {
        startNewTrail();
    } else {
        renderSelectedTrail();
    }

    trailTitleInput?.focus();
});

contentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!getSelectedVendorId()) {
        setStatus('Choose a vendor before saving.', true);
        return;
    }

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
        setStatus(getSaveErrorMessage(error), true);
    }
});

trailForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('Saving trail...', false, trailStatusElement);

    const trailId = getTrailIdForSave();
    const stops = parseTrailStops();

    if (!trailId) {
        setStatus('A trail ID or title is required.', true, trailStatusElement);
        return;
    }

    if (stops.length < 2) {
        setStatus('Add at least two valid stops before saving.', true, trailStatusElement);
        return;
    }

    try {
        const payload = await fetchJson('/api/discovery-trails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: trailId,
                title: trailTitleInput.value.trim(),
                description: trailDescriptionInput.value.trim(),
                ordered: trailOrderedInput.checked,
                stops,
                reward: {
                    points: Number.parseInt(trailRewardPointsInput.value, 10),
                    description: trailRewardDescriptionInput.value.trim()
                },
                completionText: trailCompletionInput.value.trim()
            })
        });

        applyTrailSnapshot(payload);
        state.isEditingNewTrail = false;
        renderTrailOptions();
        trailSelect.value = payload.updated.id;
        renderDashboard();
        setStatus('Trail saved. Open a new live game session to use the updated trail.', false, trailStatusElement);
    } catch (error) {
        setStatus(getSaveErrorMessage(error), true, trailStatusElement);
    }
});

loadDashboardData().catch((error) => {
    setPageStatus(getSaveErrorMessage(error), true);
});
