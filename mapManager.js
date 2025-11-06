import MapDuplicationModule from './MapDuplicationModule.js';

class MapManager {
    static preload(scene) {
        // Load map JSON directly
        scene.load.json('mapData', 'assets/map.json');
        scene.load.image('tiles', 'assets/tiles.png');

        // Debug: Check if texture loads
        scene.load.on('filecomplete', (key) => {
            if (key === 'tiles') {
                console.log('MapManager: tiles.png loaded successfully');
            }
        });
    }

    static create(scene) {
        // Get the raw map data from cache
        let mapData = scene.cache.json.get('mapData');

        if (!mapData) {
            console.error('MapManager: Failed to load map data from cache. Available cache keys:', Object.keys(scene.cache.json.entries));
            return;
        }

        console.log('MapManager: Loaded map data with layers:', mapData.layers ? mapData.layers.length : 'undefined');

        // Apply duplication if enabled
        if (window.mapDuplicationEnabled) {
            console.log('MapManager: Applying map duplication...');
            const originalObjectCount = mapData.layers?.find(l => l.name === 'npc_area')?.objects?.length || 0;
            mapData = MapDuplicationModule.duplicateMapData(mapData, true);
            const duplicatedObjectCount = mapData.layers?.find(l => l.name === 'npc_area')?.objects?.length || 0;
            console.log('MapManager: Duplication complete. Original objects:', originalObjectCount, 'Duplicated objects:', duplicatedObjectCount);
        }

        console.log('MapManager: Final mapData.layers:', mapData.layers);
        console.log('MapManager: Final mapData.layers length:', mapData.layers ? mapData.layers.length : 'undefined');

        // Put the modified data in the tilemap cache with proper format
        scene.cache.tilemap.add('modifiedMap', { format: Phaser.Tilemaps.Formats.TILED_JSON, data: mapData });

        // Create tilemap using the key
        scene.map = scene.make.tilemap({ key: 'modifiedMap' });
        console.log('MapManager: Created tilemap with', scene.map.layers.length, 'layers');

        const tileset = scene.map.addTilesetImage('tiles', 'tiles');
        console.log('MapManager: Tileset created:', tileset ? 'success' : 'failed');

        if (!tileset) {
            console.error('MapManager: Failed to create tileset. Available textures:', Object.keys(scene.textures.list));
        }

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
        console.log('MapManager: About to create layers. scene.map.layers:', scene.map.layers);
        console.log('MapManager: scene.map.layers length:', scene.map.layers ? scene.map.layers.length : 'undefined');

        scene.map.layers.forEach((layerData, i) => {
            console.log(`MapManager: Creating tile layer '${layerData.name}' (${i + 1}/${scene.map.layers.length})`);
            const layer = scene.map.createLayer(layerData.name, tileset, 0, 0);
            console.log(`MapManager: Layer '${layerData.name}' created:`, layer ? 'success' : 'failed');

            if (layer) {
                console.log(`MapManager: Layer '${layerData.name}' has ${layer.width}x${layer.height} tiles`);
                console.log(`MapManager: Layer visible: ${layer.visible}, alpha: ${layer.alpha}`);

                // Calculate layer depth: base + offset
                let baseDepth = Math.floor((i / scene.map.layers.length) * (2 * mapHeight));
                let offset = layerDepths[layerData.name] * scene.map.tileHeight;
                let finalDepth = Phaser.Math.Clamp(baseDepth + offset, 0, 2 * mapHeight);
                layer.setDepth(finalDepth);
                console.log(`MapManager: Layer '${layerData.name}' depth set to:`, finalDepth);

                // TEMP: Force layer to be visible and in front
                layer.setVisible(true);
                layer.setAlpha(1);
                // layer.setDepth(1000); // Uncomment to test if depth is the issue

                // Store reference for other managers if needed
                scene[layerData.name + 'Layer'] = layer;
            }
        });

        console.log('MapManager: Map created successfully');
    }
}

export default MapManager;