const vendorSelect = document.querySelector('#vendor-select');
const descriptionInput = document.querySelector('#description-input');
const featuredInput = document.querySelector('#featured-input');
const announcementInput = document.querySelector('#announcement-input');
const clueInput = document.querySelector('#clue-input');
const contentForm = document.querySelector('#content-form');
const clearButton = document.querySelector('#clear-button');
const statusElement = document.querySelector('#status');
const contentList = document.querySelector('#content-list');

const state = {
    vendors: [],
    contentByVendorId: new Map()
};

function setStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.style.color = isError ? '#b42318' : '#1d5f8f';
}

function getVendorLabel(vendor) {
    return `${vendor.name} (${vendor.booth})`;
}

function getSelectedVendorId() {
    return vendorSelect.value;
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

function renderVendorOptions() {
    vendorSelect.replaceChildren(...state.vendors.map((vendor) => {
        const option = document.createElement('option');
        option.value = vendor.id;
        option.textContent = getVendorLabel(vendor);
        return option;
    }));
}

function getSelectedContent() {
    return state.contentByVendorId.get(getSelectedVendorId()) ?? createDefaultContent();
}

function renderSelectedContent() {
    const selectedContent = getSelectedContent();
    descriptionInput.value = selectedContent.descriptionOverride;
    featuredInput.value = selectedContent.featuredItems.join('\n');
    announcementInput.value = selectedContent.announcements.join('\n');
    clueInput.value = selectedContent.clueText;
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
        lines.push(`Announcements: ${content.announcements.join(' / ')}`);
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

function renderDashboard() {
    renderSelectedContent();
    renderContentList();
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
    const [vendorPayload, announcementPayload] = await Promise.all([
        fetchJson('/api/vendors'),
        fetchJson('/api/vendor-content')
    ]);

    state.vendors = vendorPayload.vendors ?? [];
    applyContentSnapshot(announcementPayload);
    renderVendorOptions();
    renderDashboard();
}

vendorSelect.addEventListener('change', () => {
    renderSelectedContent();
});

clearButton.addEventListener('click', () => {
    descriptionInput.value = '';
    featuredInput.value = '';
    announcementInput.value = '';
    clueInput.value = '';
    descriptionInput.focus();
});

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

loadDashboardData().catch((error) => {
    setStatus(error.message, true);
});
