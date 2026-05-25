export function initializeSceneRuntime(scene, { isMobile = false, recreateCollision = null, interactionCoordinator = null } = {}) {
    recreateCollision?.(scene);

    const toggleDebug = () => {
        scene.debugEnabled = !scene.debugEnabled;
        scene.children.each(child => {
            if (child.type === 'Graphics') child.destroy();
        });
        recreateCollision?.(scene);
    };

    if (scene.player) {
        scene.cameras.main.startFollow(scene.player);
        scene.cameras.main.centerOn(scene.player.x, scene.player.y);
        scene.cameras.main.setBounds(0, 0, scene.map.widthInPixels, scene.map.heightInPixels);

        if (isMobile) {
            scene.cameras.main.setZoom(1.5);
        }
    } else {
        console.error('Player not created. Check playerManager.js and asset paths.');
    }

    if (interactionCoordinator?.setDebugToggleHandler) {
        interactionCoordinator.setDebugToggleHandler(toggleDebug);
        return;
    }

    scene.input.keyboard.on('keydown-BACKTICK', toggleDebug);
}