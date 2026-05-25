function createBodyDebugGraphics(scene) {
    return scene.add.graphics().setDepth(999);
}

export function drawCollisionBodiesDebug(scene, collisionBodies = scene.customCollisionBodies) {
    collisionBodies.forEach(body => {
        if (!body.debugGraphics) {
            body.debugGraphics = createBodyDebugGraphics(scene);
        }

        body.debugGraphics.clear();
        body.debugGraphics.lineStyle(2, 0xff0000, 1);
        body.debugGraphics.strokeRect(
            body.body.x,
            body.body.y,
            body.body.width,
            body.body.height
        );
    });

    return collisionBodies;
}

export function clearCollisionBodiesDebug(collisionBodies = []) {
    collisionBodies.forEach(body => {
        if (body.debugGraphics) {
            body.debugGraphics.destroy();
            body.debugGraphics = null;
        }
    });

    return collisionBodies;
}