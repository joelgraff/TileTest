import { VendorAnnouncementStore } from './liveVendorAnnouncementStore.js';

export const DEFAULT_VENDOR_ANNOUNCEMENTS_ENDPOINT = '/api/vendor-announcements';

function getDefaultFetch() {
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        return window.fetch.bind(window);
    }

    return null;
}

function getDefaultSetInterval() {
    return typeof window !== 'undefined' && typeof window.setInterval === 'function'
        ? window.setInterval.bind(window)
        : null;
}

function getDefaultClearInterval() {
    return typeof window !== 'undefined' && typeof window.clearInterval === 'function'
        ? window.clearInterval.bind(window)
        : null;
}

export class LiveVendorContentService {
    constructor({
        endpoint = DEFAULT_VENDOR_ANNOUNCEMENTS_ENDPOINT,
        fetchImpl = getDefaultFetch(),
        setIntervalImpl = getDefaultSetInterval(),
        clearIntervalImpl = getDefaultClearInterval(),
        pollIntervalMs = 3000
    } = {}) {
        this.endpoint = endpoint;
        this.fetchImpl = fetchImpl;
        this.setIntervalImpl = setIntervalImpl;
        this.clearIntervalImpl = clearIntervalImpl;
        this.pollIntervalMs = pollIntervalMs;
        this.store = new VendorAnnouncementStore();
        this.intervalId = null;
        this.started = false;
        this.isAvailable = false;
    }

    getAnnouncementsForVendor(vendorId) {
        return this.store.getAnnouncementsForVendor(vendorId);
    }

    applySnapshot(snapshot) {
        return this.store.replaceSnapshot(snapshot);
    }

    async refresh() {
        if (!this.fetchImpl) {
            this.isAvailable = false;
            return false;
        }

        try {
            const response = await this.fetchImpl(this.endpoint, {
                headers: { Accept: 'application/json' },
                cache: 'no-store'
            });

            if (!response.ok) {
                this.isAvailable = false;
                return false;
            }

            this.applySnapshot(await response.json());
            this.isAvailable = true;
            return true;
        } catch {
            this.isAvailable = false;
            return false;
        }
    }

    startPolling() {
        if (this.intervalId || !this.setIntervalImpl || this.pollIntervalMs <= 0) {
            return;
        }

        this.intervalId = this.setIntervalImpl(() => {
            void this.refresh();
        }, this.pollIntervalMs);
    }

    start() {
        if (this.started) {
            return Promise.resolve(this.isAvailable);
        }

        this.started = true;
        return this.refresh().then((isAvailable) => {
            if (isAvailable) {
                this.startPolling();
            }

            return isAvailable;
        });
    }

    stop() {
        if (this.intervalId && this.clearIntervalImpl) {
            this.clearIntervalImpl(this.intervalId);
        }

        this.intervalId = null;
        this.started = false;
    }
}

export function createLiveVendorContentService(options = {}) {
    const service = new LiveVendorContentService(options);
    return service.fetchImpl ? service : null;
}
