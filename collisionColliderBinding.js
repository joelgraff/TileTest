export function bindCollisionBodies(scene, collisionBodies, {
    colliderFactory = (firstObject, secondObject) => scene.physics.add.collider(firstObject, secondObject),
    includeNpcBodies = true
} = {}) {
    if (scene.player) {
        collisionBodies.forEach(body => {
            colliderFactory(scene.player, body);
        });
    }

    if (includeNpcBodies && scene.npcGroup) {
        scene.npcGroup.getChildren().forEach(npc => {
            collisionBodies.forEach(body => {
                colliderFactory(npc, body);
            });
        });
    }
}