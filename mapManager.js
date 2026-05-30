import CONFIG from './config.js';

class MapManager {
    static preload(scene) {
        scene.load.tilemapTiledJSON(
            CONFIG.ASSETS.MAP,
            `${CONFIG.PATHS.ASSETS}/${CONFIG.ASSETS.MAP}${CONFIG.PATHS.JSON_EXTENSION}`
        );
        scene.load.image(
            CONFIG.ASSETS.TILES,
            `${CONFIG.PATHS.ASSETS}/${CONFIG.ASSETS.TILES}${CONFIG.PATHS.IMAGE_EXTENSION}`
        );
    }

    static create(scene) {
        scene.map = scene.make.tilemap({ key: CONFIG.ASSETS.MAP });
        scene.mapLayers = {};
        const tileset = scene.map.addTilesetImage(CONFIG.ASSETS.TILES);
        const mapHeight = scene.map.heightInPixels;

        // Build a lookup for layer depth values from the loaded tilemap.
        const layerDepths = {};
        if (scene.map.layers) {
            scene.map.layers.forEach(layerData => {
                let depthValue = 0;
                if (layerData.properties) {
                    const depthProp = layerData.properties.find(p => p.name === 'depth');
                    if (depthProp) depthValue = parseInt(depthProp.value, 10) || 0;
                } else if (typeof layerData.depth === 'number') {
                    depthValue = layerData.depth;
                }
                layerDepths[layerData.name] = depthValue;
            });
        }

        // Create each layer and set its depth once
        scene.map.layers.forEach((layerData, i) => {
            const layer = scene.map.createLayer(layerData.name, tileset, 0, 0);
            // Calculate layer depth: base + offset
            let baseDepth = Math.floor((i / scene.map.layers.length) * (2 * mapHeight));
            let offset = layerDepths[layerData.name] * scene.map.tileHeight;
            let finalDepth = Phaser.Math.Clamp(baseDepth + offset, 0, 2 * mapHeight);
            layer.setDepth(finalDepth);

            scene.mapLayers[layerData.name] = layer;
        });

        return scene.mapLayers;
    }
}

export default MapManager;