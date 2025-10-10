import CONFIG from './config.js';
import DomainManager from './domainManager.js';

class NPCManager {
    static preload(scene) {
        CONFIG.NPC.SPRITES.forEach(spriteKey => {
            scene.load.spritesheet(spriteKey, `assets/${spriteKey}.png`, { frameWidth: 32, frameHeight: 48 });
        });
    }

    static create(scene, vendors) {
        const npcAreaLayer = NPCManager.getNPCAreaLayer(scene);
        if (!npcAreaLayer) return;

        const spawnPoints = NPCManager.getSpawnPoints(npcAreaLayer);
        if (spawnPoints.length === 0) return;

        const rect = NPCManager.getRectObject(npcAreaLayer);
        if (!rect) return;

        // Get tables layer depth from scene (set by mapManager)
        let tablesLayerDepth = 0;
        if (scene.tablesLayer && typeof scene.tablesLayer.depth === 'number') {
            tablesLayerDepth = scene.tablesLayer.depth;
        } else {
            tablesLayerDepth = Math.floor(scene.map.heightInPixels);
        }

        scene.npcGroup = scene.add.group();

        spawnPoints.forEach(point => {
            const direction = NPCManager.getNearestEdgeDirection(point, rect);
            const frame = NPCManager.getFrameForDirection(direction);
            const spriteKey = NPCManager.getRandomSpriteKey();

            const npc = scene.add.sprite(point.x, point.y, spriteKey, frame);
            scene.npcGroup.add(npc);

            // Assign random vendor data
            npc.vendorData = vendors[Math.floor(Math.random() * vendors.length)];

            // Set progressive depth for NPC (reversed gradient)
            NPCManager.setNPCDepth(npc, rect, tablesLayerDepth);
        });
    }

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
                    npc.setInteractive();
                    npc.on('pointerdown', () => {

                        if (npc.interactable) {
                            let dialogData;
                            console.log('NPC clicked:', npc);

                            if (npc.vendorData) {
                                // Use vendor-specific data
                                const originalDialogData = {
                                    imageKey: npc.texture.key,
                                    text: npc.vendorData.dialog.greeting,
                                    buttons: npc.vendorData.dialog.responses.map(response => ({
                                        label: response.text,
                                        onClick: () => {
                                            let newText = '';
                                            if (response.action === 'show_items') {
                                                // Get domain items instead of vendor items
                                                const domainItems = DomainManager.getDomainItems(npc.vendorData.domain_id);
                                                if (domainItems.length > 0) {
                                                    // Create dialog with item list and collection buttons
                                                    const itemButtons = domainItems.map((item, index) => ({
                                                        label: `Collect ${item.name}`,
                                                        onClick: () => {
                                                            // Check if item collection completes a quest
                                                            if (scene.questManager) {
                                                                const questUpdated = scene.questManager.checkItemCollection(item.name, npc.vendorData.id);
                                                                if (questUpdated) {
                                                                    scene.uiManager.showDialog({
                                                                        text: `Collected ${item.name}!\n\nQuest progress updated!`,
                                                                        buttons: [{
                                                                            label: 'Continue',
                                                                            onClick: () => scene.uiManager.showDialog(originalDialogData)
                                                                        }]
                                                                    });
                                                                } else {
                                                                    scene.uiManager.showDialog({
                                                                        text: `Collected ${item.name}!\n\n(Item added to your collection)`,
                                                                        buttons: [{
                                                                            label: 'Continue',
                                                                            onClick: () => scene.uiManager.showDialog(originalDialogData)
                                                                        }]
                                                                    });
                                                                }
                                                            } else {
                                                                scene.uiManager.showDialog({
                                                                    text: `Collected ${item.name}!`,
                                                                    buttons: [{
                                                                        label: 'Continue',
                                                                        onClick: () => scene.uiManager.showDialog(originalDialogData)
                                                                    }]
                                                                });
                                                            }
                                                        }
                                                    }));

                                                    scene.uiManager.showDialog({
                                                        text: `Available items from ${DomainManager.getDomainName(npc.vendorData.domain_id)}:`,
                                                        buttons: itemButtons.concat([{
                                                            label: 'Back',
                                                            onClick: () => scene.uiManager.showDialog(originalDialogData)
                                                        }])
                                                    });
                                                    return; // Don't show the text dialog
                                                } else {
                                                    newText = 'No items available at this time.';
                                                }
                                            } else if (response.action === 'booth_info') {
                                                newText = `Booth: ${npc.vendorData.booth}\nDescription: ${npc.vendorData.description}\nDomain: ${DomainManager.getDomainName(npc.vendorData.domain_id)}`;
                                            } else if (response.action === 'tech_facts') {
                                                // Get domain facts instead of vendor facts
                                                const domainFacts = DomainManager.getDomainFacts(npc.vendorData.domain_id);
                                                if (domainFacts.length > 0) {
                                                    newText = DomainManager.getDomainName(npc.vendorData.domain_id) + ' facts:\n\n';
                                                    newText += domainFacts.join('\n');
                                                } else {
                                                    newText = 'No facts available at this time.';
                                                }
                                            } else if (response.action === 'end') {
                                                scene.uiManager.closeDialog();
                                                return;
                                            }
                                            scene.uiManager.showDialog({
                                                text: newText,
                                                buttons: [{
                                                    label: 'Back',
                                                    onClick: () => scene.uiManager.showDialog(originalDialogData)
                                                }]
                                            });
                                        }
                                    }))
                                };
                                scene.uiManager.showDialog(originalDialogData);
                            } else {
                                // Fallback generic dialog
                                dialogData = {
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

    // --- Helper Functions ---

    static getNPCAreaLayer(scene) {
        const layer = scene.map.getObjectLayer('npc_area');
        if (!layer || !layer.objects || layer.objects.length === 0) {
            return null;
        }
        return layer;
    }

    static getSpawnPoints(npcAreaLayer) {
        return npcAreaLayer.objects.filter(obj => obj.type === 'point');
    }

    static getRectObject(npcAreaLayer) {
        return npcAreaLayer.objects.find(obj => obj.type === 'rect');
    }

    static getNearestEdgeDirection(point, rect) {
        const rectX = rect.x;
        const rectY = rect.y;
        const rectRight = rect.x + rect.width;
        const rectBottom = rect.y + rect.height;

        const dxLeft = Math.abs(point.x - rectX);
        const dxRight = Math.abs(point.x - rectRight);
        const dyTop = Math.abs(point.y - rectY);
        const dyBottom = Math.abs(point.y - rectBottom);

        const minDist = Math.min(dxLeft, dxRight, dyTop, dyBottom);
        if (minDist === dxLeft) return 'left';
        if (minDist === dxRight) return 'right';
        if (minDist === dyTop) return 'up';
        return 'down';
    }

    static getFrameForDirection(direction) {
        switch (direction) {
            case 'up': return 12;
            case 'down': return 0;
            case 'left': return 4;
            case 'right': return 8;
            default: return 0;
        }
    }

    static getRandomSpriteKey() {
        const sprites = CONFIG.NPC.SPRITES;
        return sprites[Math.floor(Math.random() * sprites.length)];
    }

    static setNPCDepth(npc, npcAreaRect, tablesLayerDepth) {
        // Calculate relative position in npcAreaRect
        const relY = Phaser.Math.Clamp(npc.y, npcAreaRect.y, npcAreaRect.y + npcAreaRect.height);
        // Reverse the gradient: 1 at top, 0 at bottom
        const gradient = 1 - ((relY - npcAreaRect.y) / npcAreaRect.height);

        // Depth range: centered on tablesLayerDepth, width 50
        const minDepth = Phaser.Math.Clamp(tablesLayerDepth - 25, 0, tablesLayerDepth + 25);
        const maxDepth = Phaser.Math.Clamp(tablesLayerDepth + 25, minDepth, tablesLayerDepth + 25);

        // Interpolate depth
        const npcDepth = Math.floor(Phaser.Math.Linear(minDepth, maxDepth, gradient));
        npc.setDepth(npcDepth);
    }
}

export default NPCManager;