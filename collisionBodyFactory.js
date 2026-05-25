export function getTileCollisionObjects(tile) {
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

export function createCollisionBodyForObject(scene, tile, tilemapLayer, collisionObject, {
    staticSpriteFactory = (x, y) => scene.physics.add.staticSprite(x, y, null)
} = {}) {
    if (!collisionObject.width || !collisionObject.height) {
        return null;
    }

    const body = staticSpriteFactory(
        tile.pixelX + collisionObject.x + collisionObject.width / 2,
        tile.pixelY + collisionObject.y + collisionObject.height / 2
    );

    body.setSize(collisionObject.width, collisionObject.height);
    body.visible = false;
    body.tileInfo = {
        id: tile.index,
        x: tile.x,
        y: tile.y,
        pixelX: tile.pixelX,
        pixelY: tile.pixelY,
        depth: tilemapLayer.depth || 0
    };

    return body;
}

export function createTileCollisionBodiesForLayer(scene, tilemapLayer, {
    getTileCollisionObjects: resolveTileCollisionObjects = getTileCollisionObjects,
    createCollisionBodyForObject: createCollisionBody = createCollisionBodyForObject
} = {}) {
    tilemapLayer.forEachTile(tile => {
        if (tile.index === -1) {
            return;
        }

        const collisionObjects = resolveTileCollisionObjects(tile);
        collisionObjects.forEach(collisionObject => {
            const body = createCollisionBody(scene, tile, tilemapLayer, collisionObject);
            if (body) {
                scene.customCollisionBodies.push(body);
            }
        });
    });

    return scene.customCollisionBodies;
}