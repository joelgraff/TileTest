function normalizeDirection(dx, dy, minimumDistance = 0) {
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= minimumDistance) {
        return { x: 0, y: 0 };
    }

    return {
        x: dx / dist,
        y: dy / dist
    };
}

function resolveKeyboardDirection(cursors) {
    const direction = { x: 0, y: 0 };

    if (cursors.left.isDown) direction.x = -1;
    else if (cursors.right.isDown) direction.x = 1;

    if (cursors.up.isDown) direction.y = -1;
    else if (cursors.down.isDown) direction.y = 1;

    return direction;
}

export function updateDragDirection(inputManager, pointer) {
    const dx = pointer.x - inputManager.scene.player.x;
    const dy = pointer.y - inputManager.scene.player.y;

    inputManager.direction = normalizeDirection(dx, dy, inputManager.threshold);

    return inputManager.direction;
}

export function resolveMovementDirection(inputManager) {
    if (!inputManager.scene.interactionsEnabled) {
        inputManager.clearMovementState();
        return { x: 0, y: 0 };
    }

    if (inputManager.scene.isDialogOpen) {
        inputManager.clearMovementState();
        return { x: 0, y: 0 };
    }

    if (inputManager.ignorePointerUntilRelease) {
        return { x: 0, y: 0 };
    }

    const keyboardDirection = resolveKeyboardDirection(inputManager.cursors);
    if (keyboardDirection.x !== 0 || keyboardDirection.y !== 0) {
        return keyboardDirection;
    }

    if (inputManager.target) {
        const dx = inputManager.target.x - inputManager.scene.player.x;
        const dy = inputManager.target.y - inputManager.scene.player.y;
        const targetDirection = normalizeDirection(dx, dy, 20);

        if (targetDirection.x === 0 && targetDirection.y === 0) {
            inputManager.target = null;
            return { x: 0, y: 0 };
        }

        return targetDirection;
    }

    if (inputManager.isDragging) {
        return inputManager.direction;
    }

    return { x: 0, y: 0 };
}