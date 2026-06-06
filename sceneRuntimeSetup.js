function createFpsDisplay(documentRef = globalThis.document) {
    const overlayRoot = documentRef?.getElementById?.('ui-overlay-root');

    if (!overlayRoot || typeof documentRef?.createElement !== 'function') {
        return null;
    }

    const fpsDisplay = documentRef.createElement('div');
    fpsDisplay.className = 'dom-fps-display';
    fpsDisplay.dataset.fpsOverlay = 'true';
    fpsDisplay.textContent = 'FPS: --';
    fpsDisplay.hidden = true;

    if (fpsDisplay.style) {
        fpsDisplay.style.position = 'absolute';
        fpsDisplay.style.top = '12px';
        fpsDisplay.style.left = '12px';
        fpsDisplay.style.zIndex = '1000';
        fpsDisplay.style.padding = '6px 10px';
        fpsDisplay.style.color = '#E6FF6A';
        fpsDisplay.style.background = 'rgba(0, 0, 0, 0.65)';
        fpsDisplay.style.border = '2px solid #00ffff';
        fpsDisplay.style.boxShadow = '0 0 0 2px #000000';
        fpsDisplay.style.fontFamily = 'monospace';
        fpsDisplay.style.fontSize = '14px';
        fpsDisplay.style.pointerEvents = 'none';
    }

    overlayRoot.append(fpsDisplay);
    return fpsDisplay;
}

function updateFpsDisplay(scene) {
    if (!scene?.fpsDisplayVisible || !scene.fpsDisplayText) {
        return;
    }

    const actualFps = scene.game?.loop?.actualFps;
    const fpsText = Number.isFinite(actualFps) ? actualFps.toFixed(1) : '--';

    scene.fpsDisplayText.textContent = `FPS: ${fpsText}`;
}

export function initializeSceneRuntime(scene, {
    isMobile = false,
    recreateCollision = null,
    interactionCoordinator = null,
    documentRef = globalThis.document
} = {}) {
    recreateCollision?.(scene);

    const mapBounds = {
        x: 0,
        y: 0,
        width: scene.map?.widthInPixels ?? 0,
        height: scene.map?.heightInPixels ?? 0
    };

    scene.fpsDisplayVisible = false;
    scene.fpsDisplayText = createFpsDisplay(documentRef);
    scene.events?.on?.('postupdate', () => updateFpsDisplay(scene));
    scene.events?.once?.('shutdown', () => {
        scene.fpsDisplayText?.remove?.();
        scene.fpsDisplayText = null;
        scene.fpsDisplayVisible = false;
    });

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

    const toggleFpsDisplay = () => {
        scene.fpsDisplayVisible = !scene.fpsDisplayVisible;
        if (scene.fpsDisplayText) {
            scene.fpsDisplayText.hidden = !scene.fpsDisplayVisible;
        }
        updateFpsDisplay(scene);
        return scene.fpsDisplayVisible;
    };

    interactionCoordinator?.setFpsToggleHandler?.(toggleFpsDisplay);
}