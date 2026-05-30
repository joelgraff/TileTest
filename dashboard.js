const vendorSelect = document.querySelector('#vendor-select');
const announcementInput = document.querySelector('#announcement-input');
const announcementForm = document.querySelector('#announcement-form');
const clearButton = document.querySelector('#clear-button');
const statusElement = document.querySelector('#status');
const announcementList = document.querySelector('#announcement-list');

const state = {
    vendors: [],
    announcementsByVendorId: new Map()
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

function splitAnnouncementInput() {
    return announcementInput.value
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

function applyAnnouncementSnapshot(snapshot) {
    state.announcementsByVendorId = new Map(
        (snapshot.announcements ?? []).map(entry => [entry.vendorId, entry.announcements ?? []])
    );
}

function renderVendorOptions() {
    vendorSelect.replaceChildren(...state.vendors.map((vendor) => {
        const option = document.createElement('option');
        option.value = vendor.id;
        option.textContent = getVendorLabel(vendor);
        return option;
    }));
}

function renderSelectedAnnouncement() {
    const selectedAnnouncements = state.announcementsByVendorId.get(getSelectedVendorId()) ?? [];
    announcementInput.value = selectedAnnouncements.join('\n');
}

function renderAnnouncementList() {
    const entries = state.vendors
        .map(vendor => ({
            vendor,
            announcements: state.announcementsByVendorId.get(vendor.id) ?? []
        }))
        .filter(entry => entry.announcements.length > 0);

    if (entries.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'announcement-empty';
        emptyState.textContent = 'No live announcements saved.';
        announcementList.replaceChildren(emptyState);
        return;
    }

    announcementList.replaceChildren(...entries.map((entry) => {
        const item = document.createElement('div');
        const vendorName = document.createElement('span');
        const text = document.createElement('div');

        item.className = 'announcement-item';
        vendorName.className = 'announcement-vendor';
        vendorName.textContent = getVendorLabel(entry.vendor);
        text.textContent = entry.announcements.join(' / ');

        item.append(vendorName, text);
        return item;
    }));
}

function renderDashboard() {
    renderSelectedAnnouncement();
    renderAnnouncementList();
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
        fetchJson('/api/vendor-announcements')
    ]);

    state.vendors = vendorPayload.vendors ?? [];
    applyAnnouncementSnapshot(announcementPayload);
    renderVendorOptions();
    renderDashboard();
}

vendorSelect.addEventListener('change', () => {
    renderSelectedAnnouncement();
});

clearButton.addEventListener('click', () => {
    announcementInput.value = '';
    announcementInput.focus();
});

announcementForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('Saving...');

    try {
        const payload = await fetchJson('/api/vendor-announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vendorId: getSelectedVendorId(),
                announcements: splitAnnouncementInput()
            })
        });

        applyAnnouncementSnapshot(payload);
        renderDashboard();
        setStatus('Saved. Reopen that vendor dialog in the game to see the update.');
    } catch (error) {
        setStatus(error.message, true);
    }
});

loadDashboardData().catch((error) => {
    setStatus(error.message, true);
});
