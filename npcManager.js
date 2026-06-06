import CONFIG from './config.js';
import { syncNPCInteractionState } from './npcInteractionState.js';
import { createNPCGroup, resolveNPCTablesLayerDepth } from './npcSpawnFactory.js';
import { getPlayerCollisionBox } from './playerManager.js';

class NPCManager {
    static preload(scene, {
        packageName = scene.assetPackageName ?? CONFIG.ASSETS.PACKAGE,
        spriteKeys = CONFIG.NPC.SPRITES,
        frameWidth = CONFIG.NPC.FRAME_WIDTH,
        frameHeight = CONFIG.NPC.FRAME_HEIGHT
    } = {}) {
        scene.npcSpriteConfig = {
            frameWidth,
            frameHeight,
            spriteKeys: [...spriteKeys]
        };

        spriteKeys.forEach(spriteKey => {
            scene.load.spritesheet(
                spriteKey,
                CONFIG.getAssetPath(spriteKey, CONFIG.PATHS.IMAGE_EXTENSION, packageName),
                { frameWidth, frameHeight }
            );
        });
    }

    static create(scene) {
        const spawnAreas = NPCManager.getSpawnAreas(scene);
        const spawnPoints = spawnAreas.flatMap(area =>
            area.spawnPoints.map(point => ({
                ...point,
                npcAreaRect: area.rect ?? null
            }))
        );

        if (spawnPoints.length === 0) return;

        const tablesLayerDepth = resolveNPCTablesLayerDepth(scene);
        const npcCollisionBox = getPlayerCollisionBox(scene);

        scene.npcGroup = createNPCGroup(scene, spawnPoints, null, tablesLayerDepth, {
            getNearestEdgeDirection: NPCManager.getNearestEdgeDirection,
            getFrameForDirection: NPCManager.getFrameForDirection,
            getRandomSpriteKey: () => NPCManager.getRandomSpriteKey(scene),
            setNPCDepth: NPCManager.setNPCDepth,
            setNPCCollisionBox: (npc) => NPCManager.setNPCCollisionBox(npc, npcCollisionBox)
        });
    }

    static update(scene, time, delta) {
        if (!scene.player || !scene.npcGroup) return;

        if (scene.gameState?.isDialogOpen) return; // Don't update NPCs when dialog is open

        scene.npcGroup.getChildren().forEach(npc => {
            syncNPCInteractionState(scene, npc, scene.player);
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

    static getSpawnAreas(scene) {
        const runtimeAreas = scene.mapRuntimeProfile?.npcAreaLayers;

        if (Array.isArray(runtimeAreas) && runtimeAreas.length > 0) {
            return runtimeAreas.map(area => ({
                spawnPoints: area.spawnPoints ?? [],
                rect: NPCManager.getRectObject({ objects: area.layer?.objects ?? [] })
            }));
        }

        const npcAreaLayer = NPCManager.getNPCAreaLayer(scene);
        if (!npcAreaLayer) {
            return [];
        }

        return [{
            spawnPoints: NPCManager.getSpawnPoints(npcAreaLayer),
            rect: NPCManager.getRectObject(npcAreaLayer)
        }];
    }

    static getSpawnPoints(npcAreaLayer) {
        return npcAreaLayer.objects.filter(obj => obj.point === true || obj.type === 'point');
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

    static getRandomSpriteKey(scene) {
        const sprites = scene?.npcSpriteConfig?.spriteKeys?.length
            ? scene.npcSpriteConfig.spriteKeys
            : CONFIG.NPC.SPRITES;
        return sprites[Math.floor(Math.random() * sprites.length)];
    }

    static setNPCDepth(npc, npcAreaRect, tablesLayerDepth) {
        if (!npcAreaRect) {
            const npcDepth = Math.max(Math.floor(npc.y), Math.floor(tablesLayerDepth));
            npc.setDepth(npcDepth);
            return;
        }

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

    static setNPCCollisionBox(npc, collisionBox) {
        if (!npc || !collisionBox) {
            return;
        }

        npc.setSize?.(collisionBox.width, collisionBox.height);
        npc.setOffset?.(collisionBox.offsetX, collisionBox.offsetY);
        npc.setCollideWorldBounds?.(true);
    }
}

export default NPCManager;