
import NPCSpawner from './NPCSpawner.js';
import NPCMovement from './NPCMovement.js';

class NPCManager {
    static preload(scene) {
        NPCSpawner.preload(scene);
    }

    static create(scene, vendors) {
        NPCSpawner.create(scene, vendors);
    }

    static update(scene, time, delta) {
        NPCMovement.update(scene, time, delta);
    }
}

export default NPCManager;