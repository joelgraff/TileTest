export function setupCollisionLayers(scene, layerNames, {
    createTileCollisionBodies,
    drawTileCollisionDebug
} = {}) {
    scene.customCollisionBodies = [];

    layerNames.forEach(layerName => {
        const layer = scene.map.getLayer(layerName);
        if (!layer || !layer.tilemapLayer) {
            return;
        }

        createTileCollisionBodies(scene, layer.tilemapLayer);
        drawTileCollisionDebug(scene, layer.tilemapLayer);
    });

    return scene.customCollisionBodies;
}