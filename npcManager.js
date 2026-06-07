import CONFIG from './config.js';
import { clearNPCExclamation, syncNPCInteractionState } from './npcInteractionState.js';
import { createNPCGroup, resolveNPCTablesLayerDepth } from './npcSpawnFactory.js';
import { getPlayerCollisionBox } from './playerManager.js';

const NPC_WAKE_DISTANCE_TILES = 1;
const NPC_SLEEP_DISTANCE_TILES = 1.5;
const NPC_ACTIVITY_CELL_RADIUS = Math.ceil(NPC_SLEEP_DISTANCE_TILES);

function getNpcTileDistance(scene) {
    return scene.map?.tileWidth
        ?? scene.map?.tileHeight
        ?? scene.playerSpriteConfig?.frameWidth
        ?? CONFIG.PLAYER.FRAME_WIDTH;
}

function getNpcSpatialCellCoordinates(scene, x, y) {
    const cellSize = getNpcTileDistance(scene);

    return {
        cellX: Math.floor(x / cellSize),
        cellY: Math.floor(y / cellSize)
    };
}

function getNpcSpatialCellKey(scene, x, y) {
    const { cellX, cellY } = getNpcSpatialCellCoordinates(scene, x, y);

    return `${cellX},${cellY}`;
}

function getNpcSpatialIndex(scene) {
    if (scene?.npcSpatialIndex instanceof Map) {
        return scene.npcSpatialIndex;
    }

    return NPCManager.buildNPCSpatialIndex(scene);
}

function getAllNpcSprites(scene) {
    const npcSpatialIndex = getNpcSpatialIndex(scene);

    if (npcSpatialIndex.size > 0) {
        return Array.from(npcSpatialIndex.values()).flat();
    }

    return scene?.npcGroup?.getChildren?.() ?? [];
}

function getNpcDistanceThresholds(scene) {
    const tileDistance = getNpcTileDistance(scene);

    return {
        wakeDistanceSquared: (tileDistance * NPC_WAKE_DISTANCE_TILES) ** 2,
        sleepDistanceSquared: (tileDistance * NPC_SLEEP_DISTANCE_TILES) ** 2
    };
}

function getDistanceSquared(left, right) {
    const dx = (left?.x ?? 0) - (right?.x ?? 0);
    const dy = (left?.y ?? 0) - (right?.y ?? 0);

    return (dx * dx) + (dy * dy);
}

function lockNpcPhysics(npc) {
    if (!npc) {
        return;
    }

    npc.setImmovable?.(true);
    npc.setPushable?.(false);

    if (npc.body) {
        npc.body.moves = false;
    }
}

function setNpcPhysicsEnabled(npc, isEnabled) {
    if (!npc?.body) {
        return;
    }

    npc.body.enable = isEnabled;

    if (isEnabled) {
        npc.body.updateFromGameObject?.();
        lockNpcPhysics(npc);
    } else {
        npc.body.stop?.();
        npc.setVelocity?.(0, 0);
    }
}

function setNPCActivityState(npc, isActive) {
    if (!npc) {
        return;
    }

    npc.npcActivityState = isActive ? 'active' : 'sleeping';
    setNpcPhysicsEnabled(npc, isActive);

    if (isActive) {
        return;
    }

    npc.interactable = false;
    clearNPCExclamation(npc);
    npc.glowGraphic?.setVisible?.(false);
}

function getNearbyNpcSprites(scene) {
    if (!scene?.player) {
        return scene?.npcGroup?.getChildren?.() ?? [];
    }

    const npcSpatialIndex = getNpcSpatialIndex(scene);
    const { cellX, cellY } = getNpcSpatialCellCoordinates(scene, scene.player.x, scene.player.y);
    const nearbyNpcSprites = [];
    const seenNpcSprites = new Set();

    for (let offsetY = -NPC_ACTIVITY_CELL_RADIUS; offsetY <= NPC_ACTIVITY_CELL_RADIUS; offsetY += 1) {
        for (let offsetX = -NPC_ACTIVITY_CELL_RADIUS; offsetX <= NPC_ACTIVITY_CELL_RADIUS; offsetX += 1) {
            const bucket = npcSpatialIndex.get(`${cellX + offsetX},${cellY + offsetY}`);

            if (!bucket) {
                continue;
            }

            bucket.forEach(npc => {
                if (seenNpcSprites.has(npc)) {
                    return;
                }

                seenNpcSprites.add(npc);
                nearbyNpcSprites.push(npc);
            });
        }
    }

    return nearbyNpcSprites;
}

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

        NPCManager.buildNPCSpatialIndex(scene);
        scene.npcActivityPrimed = false;
        NPCManager.refreshNPCActivity(scene);
    }

    static update(scene, time, delta) {
        if (!scene.player || !scene.npcGroup) return;

        const playerCellKey = getNpcSpatialCellKey(scene, scene.player.x, scene.player.y);

        if (scene.npcActivityCellKey === playerCellKey && Array.isArray(scene.activeNpcSprites)) {
            if (scene.gameState?.isDialogOpen) return;

            scene.activeNpcSprites.forEach(npc => {
                syncNPCInteractionState(scene, npc, scene.player);
            });

            return;
        }

        const activeNpcSprites = NPCManager.refreshNPCActivity(scene);

        if (scene.gameState?.isDialogOpen) return; // Don't update NPCs when dialog is open

        activeNpcSprites.forEach(npc => {
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

    static buildNPCSpatialIndex(scene) {
        const npcSprites = scene?.npcGroup?.getChildren?.() ?? [];
        const npcSpatialIndex = new Map();

        npcSprites.forEach(npc => {
            const cellKey = getNpcSpatialCellKey(scene, npc.x, npc.y);
            npc.npcSpatialCellKey = cellKey;

            if (!npcSpatialIndex.has(cellKey)) {
                npcSpatialIndex.set(cellKey, []);
            }

            npcSpatialIndex.get(cellKey).push(npc);
        });

        scene.npcSpatialIndex = npcSpatialIndex;
        return npcSpatialIndex;
    }

    static getActiveNPCSprites(scene) {
        if (Array.isArray(scene?.activeNpcSprites)) {
            return scene.activeNpcSprites;
        }

        return scene?.npcGroup?.getChildren?.() ?? [];
    }

    static refreshNPCActivity(scene) {
        const playerCellKey = scene.player ? getNpcSpatialCellKey(scene, scene.player.x, scene.player.y) : null;

        if (!scene.npcActivityPrimed) {
            const npcSprites = getAllNpcSprites(scene);

            if (npcSprites.length === 0) {
                scene.activeNpcSprites = [];
                scene.npcActivityCellKey = playerCellKey;
                scene.npcActivityPrimed = true;
                return scene.activeNpcSprites;
            }

            if (!scene.player) {
                npcSprites.forEach(npc => setNPCActivityState(npc, true));
                scene.activeNpcSprites = npcSprites;
                scene.npcActivityCellKey = null;
                scene.npcActivityPrimed = true;
                return npcSprites;
            }

            const { sleepDistanceSquared } = getNpcDistanceThresholds(scene);
            const activeNpcSprites = [];

            npcSprites.forEach(npc => {
                const distanceSquared = getDistanceSquared(npc, scene.player);

                if (distanceSquared <= sleepDistanceSquared) {
                    setNPCActivityState(npc, true);
                    activeNpcSprites.push(npc);
                    return;
                }

                setNPCActivityState(npc, false);
            });

            scene.activeNpcSprites = activeNpcSprites;
            scene.npcActivityCellKey = playerCellKey;
            scene.npcActivityPrimed = true;
            return activeNpcSprites;
        }

        const nearbyNpcSprites = getNearbyNpcSprites(scene);

        if (!scene.player) {
            nearbyNpcSprites.forEach(npc => setNPCActivityState(npc, true));
            scene.activeNpcSprites = nearbyNpcSprites;
            scene.npcActivityCellKey = null;
            return nearbyNpcSprites;
        }

        const { wakeDistanceSquared, sleepDistanceSquared } = getNpcDistanceThresholds(scene);

        if (scene.npcActivityCellKey === playerCellKey && Array.isArray(scene.activeNpcSprites)) {
            return scene.activeNpcSprites;
        }

        const activeNpcSprites = [];
        const activeNpcSet = new Set();
        const nearbyNpcSet = new Set(nearbyNpcSprites);
        const previousActiveNpcSprites = Array.isArray(scene.activeNpcSprites) ? scene.activeNpcSprites : [];

        previousActiveNpcSprites.forEach(npc => {
            const distanceSquared = getDistanceSquared(npc, scene.player);
            const stillActive = nearbyNpcSet.has(npc) && distanceSquared <= sleepDistanceSquared;

            if (stillActive) {
                activeNpcSet.add(npc);
                activeNpcSprites.push(npc);
                return;
            }

            setNPCActivityState(npc, false);
        });

        nearbyNpcSprites.forEach(npc => {
            if (activeNpcSet.has(npc)) {
                return;
            }

            const distanceSquared = getDistanceSquared(npc, scene.player);

            if (distanceSquared <= wakeDistanceSquared) {
                setNPCActivityState(npc, true);
                activeNpcSet.add(npc);
                activeNpcSprites.push(npc);
            }
        });

        scene.activeNpcSprites = activeNpcSprites;
        scene.npcActivityCellKey = playerCellKey;
        return activeNpcSprites;
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
        lockNpcPhysics(npc);
        npc.setCollideWorldBounds?.(true);
    }
}

export default NPCManager;