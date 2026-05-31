import { describe, expect, it, vi } from 'vitest';

import { initializeSceneBootstrap } from '../../sceneBootstrap.js';

describe('scene bootstrap', () => {
    it('creates state, starts readiness work, and initializes world, managers, and runtime in order', () => {
        const vendors = [{ id: 'vendor-1' }];
        const discoveryTrails = [{ id: 'trail-1' }];
        const readinessPromise = Promise.resolve(true);
        const callOrder = [];
        const recreateCollision = vi.fn();
        const questManager = { id: 'quest-1' };
        const interactionCoordinator = { id: 'coord-1' };
        const scene = {
            cache: {
                json: {
                    get: vi.fn((key) => {
                        callOrder.push(`json:${key}`);
                        return key === 'discovery_trails' ? discoveryTrails : vendors;
                    })
                }
            }
        };
        const GameStateClass = vi.fn(function () {
            this.interactionsEnabled = false;
        });
        const DomainManagerModule = {
            loadDomains: vi.fn(() => {
                callOrder.push('loadDomains');
            })
        };
        const initializeSceneWorldFn = vi.fn((sceneArg) => {
            callOrder.push('world');
            return true;
        });
        const initializeSceneManagersFn = vi.fn((sceneArg, options) => {
            callOrder.push('managers');
            sceneArg.questManager = questManager;
            sceneArg.interactionCoordinator = interactionCoordinator;
        });
        const initializeInteractionReadinessFn = vi.fn((options) => {
            callOrder.push('readiness');
            return readinessPromise;
        });
        const initializeSceneRuntimeFn = vi.fn(() => {
            callOrder.push('runtime');
        });

        const result = initializeSceneBootstrap(scene, {
            isTestMode: true,
            isMobile: true,
            GameStateClass,
            DomainManagerModule,
            initializeSceneWorldFn,
            initializeSceneManagersFn,
            initializeInteractionReadinessFn,
            initializeSceneRuntimeFn,
            recreateCollision
        });

        expect(scene.testMode).toBe(true);
        expect(GameStateClass).toHaveBeenCalledTimes(1);
        expect(scene.gameState).toBeInstanceOf(GameStateClass);
        expect(scene.interactionsEnabled).toBe(false);
        expect(DomainManagerModule.loadDomains).toHaveBeenCalledTimes(1);
        expect(scene.cache.json.get).toHaveBeenCalledWith('vendors');
        expect(scene.cache.json.get).toHaveBeenCalledWith('discovery_trails');
        expect(scene.vendors).toBe(vendors);
        expect(scene.discoveryTrails).toBe(discoveryTrails);
        expect(initializeSceneWorldFn).toHaveBeenCalledWith(scene);
        expect(initializeSceneManagersFn).toHaveBeenCalledWith(scene, {
            state: scene.gameState,
            discoveryTrails
        });
        expect(initializeInteractionReadinessFn).toHaveBeenCalledWith({
            questManager,
            vendors,
            setInteractionsEnabled: expect.any(Function)
        });
        expect(initializeSceneRuntimeFn).toHaveBeenCalledWith(scene, {
            isMobile: true,
            recreateCollision,
            interactionCoordinator
        });
        expect(callOrder).toEqual([
            'loadDomains',
            'json:vendors',
            'json:discovery_trails',
            'world',
            'managers',
            'readiness',
            'runtime'
        ]);

        const readinessArgs = initializeInteractionReadinessFn.mock.calls[0][0];
        readinessArgs.setInteractionsEnabled(true);

        expect(scene.interactionsEnabled).toBe(true);
        expect(result).toEqual({
            initialized: true,
            gameState: scene.gameState,
            readinessPromise
        });
    });

    it('stops after world setup fails while preserving state and vendor loading', () => {
        const vendors = [{ id: 'vendor-1' }];
        const scene = {
            cache: {
                json: {
                    get: vi.fn(() => vendors)
                }
            }
        };
        const DomainManagerModule = {
            loadDomains: vi.fn()
        };
        const initializeSceneWorldFn = vi.fn(() => false);
        const initializeSceneManagersFn = vi.fn();
        const initializeInteractionReadinessFn = vi.fn();
        const initializeSceneRuntimeFn = vi.fn();

        const result = initializeSceneBootstrap(scene, {
            DomainManagerModule,
            initializeSceneWorldFn,
            initializeSceneManagersFn,
            initializeInteractionReadinessFn,
            initializeSceneRuntimeFn
        });

        expect(scene.gameState).toBeDefined();
        expect(scene.interactionsEnabled).toBe(false);
        expect(scene.vendors).toBe(vendors);
        expect(DomainManagerModule.loadDomains).toHaveBeenCalledTimes(1);
        expect(initializeSceneWorldFn).toHaveBeenCalledWith(scene);
        expect(initializeSceneManagersFn).not.toHaveBeenCalled();
        expect(initializeInteractionReadinessFn).not.toHaveBeenCalled();
        expect(initializeSceneRuntimeFn).not.toHaveBeenCalled();
        expect(result).toEqual({
            initialized: false,
            gameState: scene.gameState,
            readinessPromise: null
        });
    });

    it('starts live vendor content service and passes it into manager composition when available', () => {
        const vendors = [{ id: 'vendor-1' }];
        const discoveryTrails = [{ id: 'trail-1' }];
        const liveVendorContentService = { start: vi.fn() };
        const scene = {
            cache: {
                json: {
                    get: vi.fn(key => (key === 'discovery_trails' ? discoveryTrails : vendors))
                }
            }
        };
        const initializeSceneManagersFn = vi.fn((sceneArg) => {
            sceneArg.questManager = { id: 'quest-1' };
            sceneArg.interactionCoordinator = { id: 'coord-1' };
        });

        initializeSceneBootstrap(scene, {
            DomainManagerModule: { loadDomains: vi.fn() },
            initializeSceneWorldFn: vi.fn(() => true),
            initializeSceneManagersFn,
            initializeInteractionReadinessFn: vi.fn(),
            initializeSceneRuntimeFn: vi.fn(),
            createLiveVendorContentServiceFn: vi.fn(() => liveVendorContentService)
        });

        expect(scene.liveVendorContentService).toBe(liveVendorContentService);
        expect(liveVendorContentService.start).toHaveBeenCalledTimes(1);
        expect(initializeSceneManagersFn).toHaveBeenCalledWith(scene, {
            state: scene.gameState,
            discoveryTrails,
            liveVendorContentService
        });
    });
});