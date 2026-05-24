import { describe, expect, it, vi } from 'vitest';

import { initializeSceneWorld } from '../../sceneWorldSetup.js';

describe('scene world setup', () => {
    it('creates the map and then initializes player and NPC systems when the map is available', () => {
        const scene = {};
        const MapManagerModule = {
            create: vi.fn(sceneArg => {
                sceneArg.map = { id: 'map-1' };
            })
        };
        const PlayerManagerModule = {
            create: vi.fn()
        };
        const NPCManagerModule = {
            create: vi.fn()
        };

        const isReady = initializeSceneWorld(scene, {
            MapManagerModule,
            PlayerManagerModule,
            NPCManagerModule
        });

        expect(isReady).toBe(true);
        expect(MapManagerModule.create).toHaveBeenCalledWith(scene);
        expect(PlayerManagerModule.create).toHaveBeenCalledWith(scene);
        expect(NPCManagerModule.create).toHaveBeenCalledWith(scene);
    });

    it('stops scene setup when the map is missing after map creation', () => {
        const scene = {};
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const MapManagerModule = {
            create: vi.fn()
        };
        const PlayerManagerModule = {
            create: vi.fn()
        };
        const NPCManagerModule = {
            create: vi.fn()
        };

        const isReady = initializeSceneWorld(scene, {
            MapManagerModule,
            PlayerManagerModule,
            NPCManagerModule
        });

        expect(isReady).toBe(false);
        expect(MapManagerModule.create).toHaveBeenCalledWith(scene);
        expect(PlayerManagerModule.create).not.toHaveBeenCalled();
        expect(NPCManagerModule.create).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith('Map failed to load. Check asset paths and mapManager.js preload.');

        errorSpy.mockRestore();
    });
});