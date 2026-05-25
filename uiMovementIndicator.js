export function initializeMovementIndicator(uiManager) {
    const movementIndicator = uiManager.scene.add.graphics();
    movementIndicator.setDepth(999);
    movementIndicator.setVisible(false);
    movementIndicator.alpha = 1;

    uiManager.movementIndicator = movementIndicator;
    uiManager.movementIndicatorFadeTween = null;

    return movementIndicator;
}

export function showMovementIndicatorReticle(uiManager, x, y) {
    uiManager.movementIndicator.clear();
    uiManager.movementIndicator.lineStyle(4, 0xFFFF00, 1);
    uiManager.movementIndicator.strokeCircle(x, y, 16);
    uiManager.movementIndicator.lineStyle(2, 0xFFFFFF, 1);
    uiManager.movementIndicator.beginPath();
    uiManager.movementIndicator.moveTo(x - 12, y);
    uiManager.movementIndicator.lineTo(x + 12, y);
    uiManager.movementIndicator.moveTo(x, y - 12);
    uiManager.movementIndicator.lineTo(x, y + 12);
    uiManager.movementIndicator.strokePath();
    uiManager.movementIndicator.setVisible(true);
    uiManager.movementIndicator.alpha = 1;

    if (uiManager.movementIndicatorFadeTween) {
        uiManager.movementIndicatorFadeTween.stop();
        uiManager.movementIndicatorFadeTween = null;
    }
}

export function hideMovementIndicatorReticle(uiManager) {
    if (uiManager.movementIndicatorFadeTween) {
        uiManager.movementIndicatorFadeTween.stop();
    }

    uiManager.movementIndicatorFadeTween = uiManager.scene.tweens.add({
        targets: uiManager.movementIndicator,
        alpha: 0,
        duration: 200,
        onComplete: () => {
            uiManager.movementIndicator.setVisible(false);
        }
    });

    return uiManager.movementIndicatorFadeTween;
}

export function updateMovementIndicatorFromPointer(uiManager, screenX, screenY, isDown) {
    if (isDown) {
        const worldPoint = uiManager.scene.cameras.main.getWorldPoint(screenX, screenY);
        showMovementIndicatorReticle(uiManager, worldPoint.x, worldPoint.y);
        return worldPoint;
    }

    hideMovementIndicatorReticle(uiManager);
    return null;
}