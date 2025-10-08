class MapManager {
    static preload(scene) {
        scene.load.tilemapTiledJSON('map', 'assets/map.json');
        scene.load.image('tiles', 'assets/tiles.png');
    }

    static create(scene) {
        scene.map = scene.make.tilemap({ key: 'map' });
        const tileset = scene.map.addTilesetImage('tiles');
        const mapHeight = scene.map.heightInPixels;

        // Build a lookup for layer depth values from map.json
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

            // Store reference for other managers if needed
            scene[layerData.name + 'Layer'] = layer;
        });
    }
}

export default MapManager;