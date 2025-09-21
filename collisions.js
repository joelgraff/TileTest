function setupCollisions(scene) {
    if (!scene.tablesLayer || !scene.tabletopsLayer || !scene.player || !scene.tilesTileset) {
        console.error('Missing required scene objects:', {
            tablesLayer: !!scene.tablesLayer,
            tabletopsLayer: !!scene.tabletopsLayer,
            player: !!scene.player,
            tilesTileset: !!scene.tilesTileset
        });
        return;
    }

    const collisionGroup = scene.physics.add.staticGroup();
    scene.tablesLayer.setCollisionByExclusion([], false);
    scene.tabletopsLayer.setCollisionByExclusion([], false);

    const processLayerCollisions = (layer, layerName) => {
        let nonEmptyTileCount = 0;
        let processedTiles = 0;
        layer.forEachTile(tile => {
            processedTiles++;
            if (tile.index !== -1) {
                nonEmptyTileCount++;
                const tileId = tile.index - scene.tilesTileset.firstgid;

                if (scene.tilesTileset.tileData && scene.tilesTileset.tileData[tileId] && scene.tilesTileset.tileData[tileId].objectgroup && scene.tilesTileset.tileData[tileId].objectgroup.objects.length > 0) {
                    const obj = scene.tilesTileset.tileData[tileId].objectgroup.objects[0];
                    const body = collisionGroup.create(
                        tile.getLeft() + (obj.width / 2) + obj.x,
                        tile.getTop() + (obj.height / 2) + obj.y,
                        null,
                        null,
                        false
                    );
                    body.setSize(obj.width, obj.height);
                } else {
                    const body = collisionGroup.create(
                        tile.getCenterX(),
                        tile.getCenterY(),
                        null,
                        null,
                        false
                    );
                    body.setSize(tile.width, tile.height);
                }
            }
        });
        console.log(`Total tiles processed in ${layerName}:`, processedTiles);
        console.log(`Non-empty tiles in ${layerName}:`, nonEmptyTileCount);
    };

    processLayerCollisions(scene.tablesLayer, 'tables');
    processLayerCollisions(scene.tabletopsLayer, 'tabletops');

    console.log('Collision bodies created:', collisionGroup.getLength());

    scene.physics.add.collider(scene.player, collisionGroup);

    if (collisionGroup.getLength() === 0) {
        console.warn('No custom collision bodies created. Using default tilemap collisions.');
        scene.tablesLayer.setCollisionByExclusion([-1]);
        scene.tabletopsLayer.setCollisionByExclusion([-1]);
        scene.physics.add.collider(scene.player, scene.tablesLayer);
        scene.physics.add.collider(scene.player, scene.tabletopsLayer);
    }
}