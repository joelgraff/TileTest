import MapManager from './mapManager.js';
import PlayerManager from './playerManager.js';
import NPCManager from './npcManager.js';

export function initializeSceneWorld(
    scene,
    {
        MapManagerModule = MapManager,
        PlayerManagerModule = PlayerManager,
        NPCManagerModule = NPCManager
    } = {}
) {
    MapManagerModule.create(scene);

    if (scene.mapBootFailure) {
        return false;
    }

    if (!scene.map) {
        console.error('Map failed to load. Check asset paths and mapManager.js preload.');
        return false;
    }

    PlayerManagerModule.create(scene);
    NPCManagerModule.create(scene);

    return true;
}