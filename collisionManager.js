import {
    createTileCollisionBodiesForLayer,
    getTileCollisionObjects as getTileCollisionObjectsForTile
} from './collisionBodyFactory.js';
import { clearCollisionBodiesDebug, drawCollisionBodiesDebug } from './collisionBodyDebug.js';
import { setupCollisionLayers } from './collisionLayerSetup.js';
import { bindCollisionBodies } from './collisionColliderBinding.js';
import { clearTileCollisionDebug, renderTileCollisionDebug } from './collisionTileDebug.js';

class CollisionManager {
    static preload(scene) {}

    static create(scene) {
        CollisionManager.setupCollisions(scene);
    }

    static update(scene, time, delta) {
        if (scene.debugEnabled) {
            CollisionManager.drawCollisionBodyDebug(scene);
        } else {
            CollisionManager.clearCollisionBodyDebug(scene);
        }
    }

    static setupCollisions(scene) {
        const map = scene.map;
        if (!map) return;

        setupCollisionLayers(scene, ['tables', 'tabletops'], {
            createTileCollisionBodies: CollisionManager.createTileCollisionBodies,
            drawTileCollisionDebug: CollisionManager.drawTileCollisionDebug
        });

        CollisionManager.addColliders(scene);
    }

    static getTileCollisionObjects(tile) {
        return getTileCollisionObjectsForTile(tile);
    }

    static createTileCollisionBodies(scene, tilemapLayer) {
        return createTileCollisionBodiesForLayer(scene, tilemapLayer, {
            getTileCollisionObjects: CollisionManager.getTileCollisionObjects
        });
    }

    static drawTileCollisionDebug(scene, tilemapLayer) {
        if (scene.debugEnabled) {
            return renderTileCollisionDebug(scene, tilemapLayer, {
                getTileCollisionObjects: CollisionManager.getTileCollisionObjects
            });
        } else if (tilemapLayer.customDebugGraphics) {
            return clearTileCollisionDebug(tilemapLayer);
        }

        return null;
    }

    static drawCollisionBodyDebug(scene) {
        return drawCollisionBodiesDebug(scene, scene.customCollisionBodies);
    }

    static clearCollisionBodyDebug(scene) {
        return clearCollisionBodiesDebug(scene.customCollisionBodies);
    }

    static addColliders(scene) {
        bindCollisionBodies(scene, scene.customCollisionBodies);
    }
}

export default CollisionManager;