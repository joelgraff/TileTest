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

        const collidableLayers = ['tables', 'tabletops'];
        scene.customCollisionBodies = [];

        collidableLayers.forEach(layerName => {
            const layer = map.getLayer(layerName);
            if (layer && layer.tilemapLayer) {
                CollisionManager.createTileCollisionBodies(scene, layer.tilemapLayer);
                CollisionManager.drawTileCollisionDebug(scene, layer.tilemapLayer);
            }
        });

        CollisionManager.addColliders(scene);
    }

    static getTileCollisionObjects(tile) {
        const tileset = tile.tileset;
        if (!tileset || !tileset.tileData) return [];
        let localTileId = tile.index;
        if (tileset.firstgid && tile.index >= tileset.firstgid) {
            localTileId = tile.index - tileset.firstgid;
        }
        const tileData = tileset.tileData[localTileId];
        if (
            tileData &&
            tileData.objectgroup &&
            Array.isArray(tileData.objectgroup.objects) &&
            tileData.objectgroup.objects.length > 0
        ) {
            return tileData.objectgroup.objects;
        }
        return [];
    }

    static createTileCollisionBodies(scene, tilemapLayer) {
        tilemapLayer.forEachTile(tile => {
            if (tile.index === -1) return;
            const objects = CollisionManager.getTileCollisionObjects(tile);
            objects.forEach(obj => {
                if (obj.width && obj.height) {
                    const body = scene.physics.add.staticSprite(
                        tile.pixelX + obj.x + obj.width / 2,
                        tile.pixelY + obj.y + obj.height / 2,
                        null
                    );
                    body.setSize(obj.width, obj.height);
                    body.visible = false;
                    body.tileInfo = {
                        id: tile.index,
                        x: tile.x,
                        y: tile.y,
                        pixelX: tile.pixelX,
                        pixelY: tile.pixelY,
                        depth: tilemapLayer.depth || 0 // Store the tile's depth for logging
                    };
                    scene.customCollisionBodies.push(body);
                }
                // For polygons, you would need Matter.js
            });
        });
    }

    static drawTileCollisionDebug(scene, tilemapLayer) {
        if (scene.debugEnabled) {
            if (!tilemapLayer.customDebugGraphics) {
                tilemapLayer.customDebugGraphics = scene.add.graphics().setAlpha(1).setDepth(999);
            }
            const graphics = tilemapLayer.customDebugGraphics;
            graphics.clear();

            tilemapLayer.forEachTile(tile => {
                if (tile.index === -1) return;
                const objects = CollisionManager.getTileCollisionObjects(tile);
                objects.forEach(obj => {
                    graphics.lineStyle(2, 0x00ff00, 1);
                    if (obj.width && obj.height) {
                        graphics.strokeRect(
                            tile.pixelX + obj.x,
                            tile.pixelY + obj.y,
                            obj.width,
                            obj.height
                        );
                    }
                    if (obj.polygon) {
                        graphics.lineStyle(2, 0xff00ff, 1);
                        const points = obj.polygon.map(pt => ({
                            x: tile.pixelX + obj.x + pt.x,
                            y: tile.pixelY + obj.y + pt.y
                        }));
                        for (let i = 0; i < points.length; i++) {
                            const next = points[(i + 1) % points.length];
                            graphics.strokeLineShape(new Phaser.Geom.Line(
                                points[i].x, points[i].y, next.x, next.y
                            ));
                        }
                    }
                });
            });
        } else if (tilemapLayer.customDebugGraphics) {
            tilemapLayer.customDebugGraphics.destroy();
            tilemapLayer.customDebugGraphics = null;
        }
    }

    static drawCollisionBodyDebug(scene) {
        scene.customCollisionBodies.forEach(body => {
            if (!body.debugGraphics) {
                body.debugGraphics = scene.add.graphics().setDepth(999);
            }
            body.debugGraphics.clear();
            body.debugGraphics.lineStyle(2, 0xff0000, 1);
            body.debugGraphics.strokeRect(
                body.body.x,
                body.body.y,
                body.body.width,
                body.body.height
            );
        });
    }

    static clearCollisionBodyDebug(scene) {
        scene.customCollisionBodies.forEach(body => {
            if (body.debugGraphics) {
                body.debugGraphics.destroy();
                body.debugGraphics = null;
            }
        });
    }

    static addColliders(scene) {
        if (scene.player) {
            scene.customCollisionBodies.forEach(body => {
                scene.physics.add.collider(scene.player, body, () => {
                    // Log tile and player info on collision
                    const info = body.tileInfo || {};
                    const playerDepth = scene.player.depth;
                });
            });
        }
        if (scene.npcGroup) {
            scene.npcGroup.getChildren().forEach(npc => {
                scene.customCollisionBodies.forEach(body => {
                    scene.physics.add.collider(npc, body);
                });
            });
        }
    }
}

export default CollisionManager;