function createTileDebugGraphics(scene) {
    return scene.add.graphics().setAlpha(1).setDepth(999);
}

export function renderTileCollisionDebug(scene, tilemapLayer, {
    getTileCollisionObjects
} = {}) {
    if (!tilemapLayer.customDebugGraphics) {
        tilemapLayer.customDebugGraphics = createTileDebugGraphics(scene);
    }

    const graphics = tilemapLayer.customDebugGraphics;
    graphics.clear();

    tilemapLayer.forEachTile(tile => {
        if (tile.index === -1) {
            return;
        }

        const collisionObjects = getTileCollisionObjects(tile);
        collisionObjects.forEach(collisionObject => {
            graphics.lineStyle(2, 0x00ff00, 1);
            if (collisionObject.width && collisionObject.height) {
                graphics.strokeRect(
                    tile.pixelX + collisionObject.x,
                    tile.pixelY + collisionObject.y,
                    collisionObject.width,
                    collisionObject.height
                );
            }

            if (collisionObject.polygon) {
                graphics.lineStyle(2, 0xff00ff, 1);
                const points = collisionObject.polygon.map(point => ({
                    x: tile.pixelX + collisionObject.x + point.x,
                    y: tile.pixelY + collisionObject.y + point.y
                }));

                for (let index = 0; index < points.length; index++) {
                    const nextPoint = points[(index + 1) % points.length];
                    graphics.strokeLineShape(new Phaser.Geom.Line(
                        points[index].x,
                        points[index].y,
                        nextPoint.x,
                        nextPoint.y
                    ));
                }
            }
        });
    });

    return graphics;
}

export function clearTileCollisionDebug(tilemapLayer) {
    if (tilemapLayer.customDebugGraphics) {
        tilemapLayer.customDebugGraphics.destroy();
        tilemapLayer.customDebugGraphics = null;
    }

    return tilemapLayer;
}