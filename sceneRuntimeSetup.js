export function initializeSceneRuntime(scene, { isMobile = false, recreateCollision = null, interactionCoordinator = null } = {}) {
    recreateCollision?.(scene);

    const toggleDebug = () => {
        scene.debugEnabled = !scene.debugEnabled;
        scene.children.each(child => {
            if (child.type === 'Graphics') child.destroy();
        });
        recreateCollision?.(scene);
    };

    const mapBounds = {
        x: 0,
        y: 0,
        width: scene.map?.widthInPixels ?? 0,
        height: scene.map?.heightInPixels ?? 0
    };

    scene.physics?.world?.setBounds?.(mapBounds.x, mapBounds.y, mapBounds.width, mapBounds.height);

    if (scene.player) {
        scene.cameras.main.startFollow(scene.player);
        scene.cameras.main.centerOn(scene.player.x, scene.player.y);
        scene.cameras.main.setBounds(mapBounds.x, mapBounds.y, mapBounds.width, mapBounds.height);

        if (isMobile) {
            scene.cameras.main.setZoom(1.5);
        }
    } else {
        console.error('Player not created. Check playerManager.js and asset paths.');
    }

    interactionCoordinator?.setDebugToggleHandler?.(toggleDebug);
}