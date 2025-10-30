// NPCMovement.js
// Handles NPC update/movement logic

class NPCMovement {
    static update(scene, time, delta) {
        if (!scene.player || !scene.npcGroup) return;
        if (scene.isDialogOpen) return; // Don't update NPCs when dialog is open

        scene.npcGroup.getChildren().forEach(npc => {
            //check vertical first for performance
            const dy = Math.abs(npc.y - scene.player.y);
            // If under 96 pixels, check full distance, otherwise clear interactable, if set
            if (dy < 96) {
                const dx = Math.abs(npc.x - scene.player.x);
                npc.interactable = (dx + dy < 96);
                if (npc.interactable) {
                    // Add exclamation mark
                    if (!npc.exclamation) {
                        npc.exclamation = scene.add.text(npc.x, npc.y - 32, '!', {
                            fontFamily: 'Arial',
                            fontSize: '32px',
                            fill: '#FF0000',
                            stroke: '#FFFFFF',
                            strokeThickness: 3,
                            align: 'center'
                        }).setOrigin(0.5).setDepth(npc.depth + 1);
                    }
                    if (!npc.vendorData) {
                        npc.setInteractive();
                        npc.on('pointerdown', () => {
                            if (npc.interactable && !scene.uiManager.isDialogOpen) {
                                console.log('NPC clicked:', npc);
                                if (npc.vendorData) {
                                    scene.vendorManager.interactWithVendor(npc.vendorData, npc);
                                } else {
                                    const dialogData = {
                                        text: "Hello! I'm a vendor. What can I do for you?",
                                        buttons: [
                                            { label: "Buy", onClick: () => console.log("Buy action") },
                                            { label: "Sell", onClick: () => console.log("Sell action") },
                                            { label: "Talk", onClick: () => console.log("Talk action") },
                                            { label: "Close", onClick: () => scene.uiManager.closeDialog() }
                                        ]
                                    };
                                    scene.uiManager.showDialog(dialogData);
                                }
                            }
                        });
                    }
                } else {
                    if (npc.exclamation) {
                        npc.exclamation.destroy();
                        npc.exclamation = null;
                    }
                    npc.disableInteractive();
                }
            } else if (npc.interactable) {
                npc.interactable = false;
                if (npc.exclamation) {
                    npc.exclamation.destroy();
                    npc.exclamation = null;
                }
                npc.disableInteractive();
            }
        });
    }
}

export default NPCMovement;
