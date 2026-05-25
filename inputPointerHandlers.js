function projectPointerToWorld(scene, pointer) {
    return scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
}

export function handlePointerDown(inputManager, pointer) {
    const { scene } = inputManager;

    if (!scene.interactionsEnabled) {
        inputManager.ignorePointerUntilRelease = true;
        return null;
    }

    if (scene.isDialogOpen) {
        inputManager.ignorePointerUntilRelease = true;
        return null;
    }

    if (inputManager.ignorePointerUntilRelease) {
        return null;
    }

    inputManager.touchStart.x = pointer.x;
    inputManager.touchEnd.x = pointer.x;
    inputManager.touchStart.y = pointer.y;
    inputManager.touchEnd.y = pointer.y;
    inputManager.target = projectPointerToWorld(scene, pointer);
    inputManager.isDragging = false;
    inputManager.forwardPointerMove(pointer, true);

    return inputManager.target;
}

export function handlePointerMove(inputManager, pointer) {
    const { scene } = inputManager;

    if (!scene.interactionsEnabled || scene.isDialogOpen || inputManager.ignorePointerUntilRelease) {
        return null;
    }

    if (!pointer.isDown) {
        return null;
    }

    if (!inputManager.isDragging) {
        const dx = pointer.x - inputManager.touchStart.x;
        const dy = pointer.y - inputManager.touchStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > inputManager.threshold) {
            inputManager.isDragging = true;
        }
    }

    if (!inputManager.isDragging) {
        return null;
    }

    inputManager.target = projectPointerToWorld(scene, pointer);
    inputManager.forwardPointerMove(pointer, true);

    return inputManager.target;
}

export function handlePointerUp(inputManager, pointer) {
    if (inputManager.scene.isDialogOpen) {
        return null;
    }

    if (typeof inputManager.releasePointerSuppression === 'function') {
        inputManager.releasePointerSuppression();
    } else {
        inputManager.ignorePointerUntilRelease = false;
    }

    if (inputManager.isDragging) {
        inputManager.direction = { x: 0, y: 0 };
    }

    inputManager.isDragging = false;
    inputManager.forwardPointerMove(pointer, false);

    return inputManager.direction;
}

export function registerPointerHandlers(inputManager, scene = inputManager.scene) {
    scene.input.on('pointerdown', (pointer) => {
        handlePointerDown(inputManager, pointer);
    });

    scene.input.on('pointermove', (pointer) => {
        handlePointerMove(inputManager, pointer);
    });

    scene.input.on('pointerup', (pointer) => {
        handlePointerUp(inputManager, pointer);
    });

    return inputManager;
}