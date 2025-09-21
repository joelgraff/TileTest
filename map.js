function loadMapAssets(scene) {
    const cacheBuster = `?v=${Date.now()}`;
    scene.load.image('tiles', `tiles.png${cacheBuster}`);
    scene.load.spritesheet('player', `player.png${cacheBuster}`, { frameWidth: 32, frameHeight: 48 });
    scene.load.tilemapTiledJSON('map', `map.json${cacheBuster}`);
}

function createMap(scene) {
    let map;
    try {
        map = scene.make.tilemap({ key: 'map' });
    } catch (error) {
        console.error('Failed to create tilemap from map.json:', error);
        return;
    }

    const tileset = map.addTilesetImage('tiles', 'tiles');
    if (!tileset) {
        console.error('Failed to load tileset "tiles". Check map.json tileset name or image loading.');
        return;
    }

    const playerTileset = map.addTilesetImage('player', 'player');
    if (!playerTileset) {
        console.error('Failed to load player tileset "player". Check map.json tileset name or player.png loading.');
        return;
    }

    const floorLayerData = map.getLayer('floor');
    const tablesLayerData = map.getLayer('tables');
    const tabletopsLayerData = map.getLayer('tabletops');
    if (!floorLayerData || !tablesLayerData || !tabletopsLayerData) {
        console.error('Failed to find floor, tables, or tabletops layer data. Check layer names in map.json.');
        return;
    }

    const floorLayer = map.createLayer('floor', tileset, 0, 0);
    const tablesLayer = map.createLayer('tables', tileset, 0, 0);
    const tabletopsLayer = map.createLayer('tabletops', tileset, 0, 0);
    if (!floorLayer || !tablesLayer || !tabletopsLayer) {
        console.error('Failed to create floor, tables, or tabletops layer. Check layer names in map.json.');
        return;
    }

    const getLayerDepth = (layerData, fallback) => {
        const depthProp = layerData.properties && layerData.properties.find(prop => prop.name === 'depth');
        return depthProp && typeof depthProp.value === 'number' ? depthProp.value : fallback;
    };

    floorLayer.setDepth(getLayerDepth(floorLayerData, 0));
    tablesLayer.setDepth(getLayerDepth(tablesLayerData, 2));
    tabletopsLayer.setDepth(getLayerDepth(tabletopsLayerData, 3));

    scene.map = map;
    scene.floorLayer = floorLayer;
    scene.tablesLayer = tablesLayer;
    scene.tabletopsLayer = tabletopsLayer;
    scene.playerTileset = playerTileset;
    scene.tilesTileset = tileset;
}