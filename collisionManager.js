import CONFIG from './config.js';

class CollisionManager {
    static setupCollisions(scene) {
        if (!scene.player || !scene.tilesTileset) {
            console.error('Missing required scene objects:', {
                player: !!scene.player,
                tilesTileset: !!scene.tilesTileset
            });
            return;
        }

        const collisionGroup = scene.physics.add.staticGroup();

        scene.map.layers.forEach(layerData => {
            if (layerData.data && !layerData.objects && scene[`${layerData.name}Layer`]) {
                const layer = scene[`${layerData.name}Layer`];
                const collidableProp = layerData.properties && layerData.properties.find(prop => prop.name === 'collidable');
                const isCollidable = collidableProp ? !!collidableProp.value : true;

                if (isCollidable) {
                    layer.setCollisionByExclusion([], false);
                    layer.forEachTile(tile => {
                        if (tile.index !== -1) {
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
                }
            }
        });

        scene.physics.add.collider(scene.player, collisionGroup);

        if (collisionGroup.getLength() === 0) {
            console.warn('No custom collision bodies created. Using default tilemap collisions.');
            scene.map.layers.forEach(layerData => {
                if (layerData.data && !layerData.objects && scene[`${layerData.name}Layer`]) {
                    scene[`${layerData.name}Layer`].setCollisionByExclusion([-1]);
                    scene.physics.add.collider(scene.player, scene[`${layerData.name}Layer`]);
                }
            });
        }
    }
}

export default CollisionManager;