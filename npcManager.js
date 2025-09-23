import CONFIG from './config.js';

class NPCManager {
    static createNPCs(scene) {
        const npcAreaLayer = scene.map.getObjectLayer('npc_area');
        if (!npcAreaLayer || npcAreaLayer.objects.length === 0) {
            console.error('npc_area object layer not found or empty in map.');
            return;
        }

        // Filter for spawn points (objects with type 'point')
        const spawnPoints = npcAreaLayer.objects.filter(obj => obj.type === 'point');

        if (spawnPoints.length === 0) {
            console.warn('No spawn points (type "point") found in npc_area layer.');
            return;
        }

        // Load the rect object (assuming only one rect with type 'rect')
        const rect = npcAreaLayer.objects.find(obj => obj.type === 'rect');
        if (!rect) {
            console.warn('No rect object (type "rect") found in npc_area layer.');
            return;
        }

        scene.npcGroup = scene.add.group(); // No physics group

        spawnPoints.forEach((point, i) => {
            const spriteKey = CONFIG.NPC.SPRITES[Math.floor(Math.random() * CONFIG.NPC.SPRITES.length)];
            const x = point.x; // Tiled x in pixels from map origin
            const y = point.y; // Tiled y in pixels from map origin

            // Determine nearest edge
            const rectX = rect.x;
            const rectY = rect.y;
            const rectWidth = rect.width;
            const rectHeight = rect.height;
            const rectRight = rectX + rectWidth;
            const rectBottom = rectY + rectHeight;

            const dxLeft = Math.abs(x - rectX);
            const dxRight = Math.abs(x - rectRight);
            const dyTop = Math.abs(y - rectY);
            const dyBottom = Math.abs(y - rectBottom);

            let direction;
            const minDist = Math.min(dxLeft, dxRight, dyTop, dyBottom);
            if (minDist === dxLeft) direction = 'left';
            else if (minDist === dxRight) direction = 'right';
            else if (minDist === dyTop) direction = 'up';
            else direction = 'down';

            // Map direction to a static frame (assuming a spritesheet with directional frames)
            let frame = 0; // Default frame
            switch (direction) {
                case 'up': frame = 12; break; // Adjust frame numbers based on your spritesheet
                case 'down': frame = 0; break; // Default/down frame
                case 'left': frame = 4; break;
                case 'right': frame = 8; break;
            }

            const npc = scene.add.sprite(x, y, spriteKey, frame);
            npc.setDepth(1); // Same as player

            scene.npcGroup.add(npc);
        });

        // No collision setup needed
    }

    static handleNPCMovements(scene) {
        if (!scene.npcGroup) return;

        // No movement logic needed since NPCs are static
    }
}

export default NPCManager;