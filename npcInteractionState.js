const INTERACTION_VERTICAL_THRESHOLD = 96;
const INTERACTION_DISTANCE_THRESHOLD = 96;
const EXCLAMATION_Y_OFFSET = 32;

export function createNPCExclamation(scene, npc) {
    return scene.add.text(npc.x, npc.y - EXCLAMATION_Y_OFFSET, '!', {
        fontFamily: 'Arial',
        fontSize: '32px',
        fill: '#FF0000',
        stroke: '#FFFFFF',
        strokeThickness: 3,
        align: 'center'
    }).setOrigin(0.5).setDepth(npc.depth + 1);
}

export function clearNPCExclamation(npc) {
    if (!npc.exclamation) {
        return;
    }

    npc.exclamation.destroy();
    npc.exclamation = null;
}

export function syncNPCInteractionState(scene, npc, player) {
    const dy = Math.abs(npc.y - player.y);

    if (dy < INTERACTION_VERTICAL_THRESHOLD) {
        const dx = Math.abs(npc.x - player.x);
        const interactable = dx + dy < INTERACTION_DISTANCE_THRESHOLD;

        npc.interactable = interactable;

        if (interactable) {
            if (!npc.exclamation) {
                npc.exclamation = createNPCExclamation(scene, npc);
            }
        } else {
            clearNPCExclamation(npc);
        }

        return interactable;
    }

    if (npc.interactable) {
        npc.interactable = false;
        clearNPCExclamation(npc);
    }

    return false;
}