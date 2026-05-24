import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DomainManager from '../../domainManager.js';
import VendorManager from '../../vendorManager.js';

describe('domain and vendor readiness', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        DomainManager.domains = null;
        DomainManager.loadingPromise = null;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        DomainManager.domains = null;
        DomainManager.loadingPromise = null;
    });

    it('reuses one in-flight domain load', async () => {
        const domainPayload = [{ id: 'gaming', name: 'Gaming', items: [], facts: [] }];

        globalThis.fetch = vi.fn(async () => ({
            ok: true,
            json: async () => domainPayload
        }));

        const firstLoad = DomainManager.loadDomains();
        const secondLoad = DomainManager.loadDomains();
        const [firstResult, secondResult] = await Promise.all([firstLoad, secondLoad]);

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(firstResult).toEqual(domainPayload);
        expect(secondResult).toEqual(domainPayload);
        expect(DomainManager.isLoaded()).toBe(true);
    });

    it('only allows vendor interaction once domains are loaded and no dialog is open', () => {
        const context = {
            scene: {
                interactionsEnabled: false
            },
            uiManager: {
                isDialogOpen: false
            }
        };

        DomainManager.domains = null;
        expect(VendorManager.prototype.isInteractionAvailable.call(context)).toBe(false);

        context.scene.interactionsEnabled = true;
        DomainManager.domains = [];
        expect(VendorManager.prototype.isInteractionAvailable.call(context)).toBe(true);

        context.uiManager.isDialogOpen = true;
        expect(VendorManager.prototype.isInteractionAvailable.call(context)).toBe(false);
    });
});