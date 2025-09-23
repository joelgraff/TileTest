import CONFIG from './config.js';

class MapManager {
    static loadAssets(scene) {
        const cacheBuster = `?v=${Date.now()}`;
        scene.load.image(CONFIG.ASSETS.TILES, `tiles.png${cacheBuster}`);
        scene.load.spritesheet(CONFIG.ASSETS.PLAYER, `player.png${cacheBuster}`, {
            frameWidth: CONFIG.PLAYER.FRAME_WIDTH,
            frameHeight: CONFIG.PLAYER.FRAME_HEIGHT
        });
        CONFIG.NPC.SPRITES.forEach(key => {
            scene.load.spritesheet(key, `${key}.png${cacheBuster}`, {
                frameWidth: CONFIG.PLAYER.FRAME_WIDTH,
                frameHeight: CONFIG.PLAYER.FRAME_HEIGHT
            });
        });
        scene.load.tilemapTiledJSON(CONFIG.ASSETS.MAP, `map.json${cacheBuster}`);
    }

    static createMap(scene) {
        let map;
        try {
            map = scene.make.tilemap({ key: CONFIG.ASSETS.MAP });
            console.log('Loaded map with', map.layers.length, 'layers:', map.layers.map(layer => layer.name));
        } catch (error) {
            console.error('Failed to create tilemap from map.json:', error);
            return null;
        }

        const tileset = map.addTilesetImage(CONFIG.ASSETS.TILES, CONFIG.ASSETS.TILES);
        if (!tileset) {
            console.error('Failed to load tileset "tiles". Check map.json tileset name or image loading.');
            return null;
        }

        const playerTileset = map.addTilesetImage(CONFIG.ASSETS.PLAYER, CONFIG.ASSETS.PLAYER);
        if (!playerTileset) {
            console.error('Failed to load player tileset "player". Check map.json tileset name or player.png loading.');
            return null;
        }

        const layers = {};
        map.layers.forEach(layerData => {
            if (layerData.data && !layerData.objects) {
                if (!layers[layerData.name]) {
                    layers[layerData.name] = map.createLayer(layerData.name, tileset, 0, 0);
                    if (!layers[layerData.name]) {
                        console.error(`Failed to create ${layerData.name} layer. Check layer names in map.json or tileset association.`);
                        return;
                    }
                    const depthProp = layerData.properties && layerData.properties.find(prop => prop.name === 'depth');
                    if (!depthProp || typeof depthProp.value !== 'number') {
                        console.error(`Missing or invalid depth property for ${layerData.name} layer. Depth is required.`);
                        return;
                    }
                    layers[layerData.name].setDepth(depthProp.value);
                    scene[`${layerData.name}Layer`] = layers[layerData.name];
                }
            }
        });

        if (Object.keys(layers).length === 0) {
            console.error('No tile layers found in map.json. Check for layers with "data" field (tile layers) and valid tileset association.');
            return null;
        }

        scene.map = map;
        scene.playerTileset = playerTileset;
        scene.tilesTileset = tileset;

        return map;
    }
}

export default MapManager;