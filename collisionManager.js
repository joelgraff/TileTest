import {
    createTileCollisionBodiesForLayer,
    getTileCollisionObjects as getTileCollisionObjectsForTile
} from './collisionBodyFactory.js';
import { setupCollisionLayers } from './collisionLayerSetup.js';
import { bindCollisionBodies } from './collisionColliderBinding.js';

class CollisionManager {
    static preload(scene) {}

    static create(scene) {
        CollisionManager.setupCollisions(scene);
    }

    static setupCollisions(scene) {
        const map = scene.map;
        if (!map) return;

        setupCollisionLayers(scene, ['tables', 'tabletops'], {
            createTileCollisionBodies: CollisionManager.createTileCollisionBodies
        });

        CollisionManager.addColliders(scene);
    }

    static getTileCollisionObjects(tile, tilemapLayer) {
        return getTileCollisionObjectsForTile(tile, tilemapLayer);
    }

    static createTileCollisionBodies(scene, tilemapLayer) {
        return createTileCollisionBodiesForLayer(scene, tilemapLayer, {
            getTileCollisionObjects: CollisionManager.getTileCollisionObjects
        });
    }

    static addColliders(scene) {
        bindCollisionBodies(scene, scene.customCollisionBodies);
    }
}

export default CollisionManager;