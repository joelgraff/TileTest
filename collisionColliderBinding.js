export function bindCollisionBodies(scene, collisionBodies, {
    colliderFactory = (firstObject, secondObject) => scene.physics.add.collider(firstObject, secondObject)
} = {}) {
    if (scene.player) {
        collisionBodies.forEach(body => {
            colliderFactory(scene.player, body);
        });
    }

    if (scene.npcGroup) {
        scene.npcGroup.getChildren().forEach(npc => {
            collisionBodies.forEach(body => {
                colliderFactory(npc, body);
            });
        });
    }
}