import {
    TABLE_COLLISION_PROPERTY_NAMES,
    TABLETOP_COLLISION_PROPERTY_NAMES,
    getCollisionMetadata,
    getCollisionRect,
    resolveCollisionBox
} from './tabletopCollisionMetadata.js';

function getResolvedTilemapLayer(tile, tilemapLayer) {
    return tilemapLayer ?? tile?.tilemapLayer ?? null;
}

function getLayerName(tilemapLayer) {
    return tilemapLayer?.layer?.name ?? tilemapLayer?.name ?? null;
}

function getCollisionPropertyNamesForLayer(layerName) {
    if (layerName === 'tables') {
        return TABLE_COLLISION_PROPERTY_NAMES;
    }

    if (layerName === 'tabletops') {
        return TABLETOP_COLLISION_PROPERTY_NAMES;
    }

    return null;
}

function getTileSize(tile) {
    return {
        width: tile.width ?? tile.tileset?.tileWidth ?? tile.tileset?.tilewidth ?? 0,
        height: tile.height ?? tile.tileset?.tileHeight ?? tile.tileset?.tileheight ?? 0
    };
}

function getLayerCollisionObjects(tile, tilemapLayer) {
    const resolvedTilemapLayer = getResolvedTilemapLayer(tile, tilemapLayer);
    const layerName = getLayerName(resolvedTilemapLayer);
    const collisionPropertyNames = getCollisionPropertyNamesForLayer(layerName);

    if (!collisionPropertyNames) {
        return null;
    }

    const collisionMetadata = getCollisionMetadata(resolvedTilemapLayer?.tilemap, collisionPropertyNames);

    if (!collisionMetadata.hasAny) {
        return null;
    }

    if (collisionMetadata.isDisabled) {
        return [];
    }

    const collisionRect = getCollisionRect(
        resolvedTilemapLayer?.tilemap,
        collisionPropertyNames,
        getTileSize(tile)
    );

    return collisionRect ? [collisionRect] : null;
}

export function getTileCollisionObjects(tile, tilemapLayer) {
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
        const tileSize = getTileSize(tile);

        return tileData.objectgroup.objects
            .map(collisionObject => resolveCollisionBox(collisionObject, {
                tileWidth: tileSize.width,
                tileHeight: tileSize.height
            }))
            .filter(Boolean);
    }

    const fallbackWidth = tile.width ?? tileset.tileWidth ?? tileset.tilewidth ?? 0;
    const fallbackHeight = tile.height ?? tileset.tileHeight ?? tileset.tileheight ?? 0;

    if (fallbackWidth > 0 && fallbackHeight > 0) {
        const layerCollisionObjects = getLayerCollisionObjects(tile, tilemapLayer);

        if (layerCollisionObjects !== null) {
            return layerCollisionObjects;
        }

        return [{ x: 0, y: 0, width: fallbackWidth, height: fallbackHeight }];
    }

    return [];
}

export function createCollisionBodyForObject(scene, tile, tilemapLayer, collisionObject, {
    staticSpriteFactory = (x, y) => scene.physics.add.staticSprite(x, y, null)
} = {}) {
    if (
        !Number.isFinite(collisionObject.x)
        || !Number.isFinite(collisionObject.y)
        || !(collisionObject.width > 0)
        || !(collisionObject.height > 0)
    ) {
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

        const collisionObjects = resolveTileCollisionObjects(tile, tilemapLayer);
        collisionObjects.forEach(collisionObject => {
            const body = createCollisionBody(scene, tile, tilemapLayer, collisionObject);
            if (body) {
                scene.customCollisionBodies.push(body);
            }
        });
    });

    return scene.customCollisionBodies;
}