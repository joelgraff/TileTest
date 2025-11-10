// NPCSpawner.js
// Handles NPC spawn point and creation logic

import CONFIG from './config.js';

class NPCSpawner {
    static preload(scene) {
        CONFIG.NPC.SPRITES.forEach(spriteKey => {
            scene.load.spritesheet(spriteKey, `assets/${spriteKey}.png`, { frameWidth: 32, frameHeight: 48 });
        });
    }

    static create(scene, vendors) {
        const npcAreaLayer = NPCSpawner.getNPCAreaLayer(scene);
        if (!npcAreaLayer) return;

        const spawnPoints = NPCSpawner.getSpawnPoints(npcAreaLayer);
        if (spawnPoints.length === 0) return;

        const rect = NPCSpawner.getRectObject(npcAreaLayer);
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
            const direction = NPCSpawner.getNearestEdgeDirection(point, rect);
            const frame = NPCSpawner.getFrameForDirection(direction);
            const spriteKey = NPCSpawner.getRandomSpriteKey();

            const npc = scene.add.sprite(point.x, point.y, spriteKey, frame);
            scene.npcGroup.add(npc);

            // Set progressive depth for NPC (reversed gradient)
            NPCSpawner.setNPCDepth(npc, rect, tablesLayerDepth);
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

        // Depth range: above tabletops (10+), width 25
        const minDepth = 15;
        const maxDepth = 40;

        // Interpolate depth
        const npcDepth = Math.floor(Phaser.Math.Linear(minDepth, maxDepth, gradient));
        npc.setDepth(npcDepth);
    }
}

export default NPCSpawner;
