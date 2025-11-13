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

        // Get layer depths for proper NPC layering
        let tablesLayerDepth = 0;
        let tabletopsLayerDepth = 0;
        if (scene.tablesLayer && typeof scene.tablesLayer.depth === 'number') {
            tablesLayerDepth = scene.tablesLayer.depth;
        }
        if (scene.tabletopsLayer && typeof scene.tabletopsLayer.depth === 'number') {
            tabletopsLayerDepth = scene.tabletopsLayer.depth;
        }

        // Build tile ID map for debug correlation (needed for direction calculation logging)
        NPCSpawner.buildTileIdMap(scene);

        // Visualize tile IDs in debug mode (only if debug is enabled)
        if (scene.debugEnabled) {
            NPCSpawner.visualizeTileIds(scene);
        }

        scene.npcGroup = scene.add.group();

        spawnPoints.forEach(point => {
            const direction = NPCSpawner.getDirectionToNearestTable(point, scene, rect);
            const frame = NPCSpawner.getFrameForDirection(direction);
            const spriteKey = NPCSpawner.getRandomSpriteKey();

            const npc = scene.add.sprite(point.x, point.y, spriteKey, frame);
            scene.npcGroup.add(npc);

            // Set depth based on facing direction and Y position
            NPCSpawner.setNPCDepth(npc, rect, direction, tablesLayerDepth, tabletopsLayerDepth);
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

    static getDirectionToNearestTable(point, scene, rect) {
        const tablesLayer = scene.tablesLayer;
        if (!tablesLayer) {
            console.warn('NPCSpawner: No tables layer found, falling back to booth position');
            const boothCenterY = rect.y + rect.height / 2;
            return point.y < boothCenterY ? 'up' : 'down';
        }

        const tileWidth = scene.map.tileWidth;
        const tileHeight = scene.map.tileHeight;
        const threshold = 80; // Increased threshold to capture more tiles before culling
        // Remove maxTilesToCheck limit - we'll cull to 3 nearest after finding all within threshold

        let qualifyingTiles = [];
        const debugInfo = {
            npcX: point.x,
            npcY: point.y,
            qualifyingTiles: []
        };

        // Find all non-zero tiles in the tables layer that meet the criteria
        // In Phaser 3, layer data is accessed through layer.layer.data
        const layerData = tablesLayer.layer.data;
        for (let y = 0; y < layerData.length; y++) {
            const row = layerData[y];
            for (let x = 0; x < row.length; x++) {
                const tile = row[x];
                if (tile && tile.index !== 0 && tile.index !== -1) {
                    // Get base tile ID without flip flags (mask out bits 29-31)
                    const baseTileId = tile.index & 0x1FFFFFFF;

                    // Convert tile coordinates to world coordinates (center of tile)
                    const worldX = x * tileWidth + tileWidth / 2;
                    const worldY = y * tileHeight + tileHeight / 2;

                    // Check Euclidean distance instead of separate X/Y thresholds
                    const distance = Phaser.Math.Distance.Between(point.x, point.y, worldX, worldY);
                    if (distance <= threshold) {
                        // Calculate displacement from tile to NPC for vector summation
                        const dx = worldX - point.x;
                        const dy = worldY - point.y;

                        const tileKey = `${x},${y}`;
                        const tileId = scene.tileIdMap ? scene.tileIdMap[tileKey] : '?';

                        qualifyingTiles.push({
                            x: worldX,
                            y: worldY,
                            tileX: x,
                            tileY: y,
                            tileId: tileId,
                            distance: distance,
                            verticalDist: Math.abs(dy),
                            horizontalDist: Math.abs(dx),
                            manhattanDist: Math.abs(dx) + Math.abs(dy) // Add Manhattan distance for sorting
                        });

                        debugInfo.qualifyingTiles.push({
                            id: tileId,
                            tileCoord: `(${x},${y})`,
                            worldCoord: `(${worldX},${worldY})`,
                            euclidean: distance.toFixed(2),
                            vertical: Math.abs(dy).toFixed(0),
                            horizontal: Math.abs(dx).toFixed(0),
                            manhattan: (Math.abs(dx) + Math.abs(dy)).toFixed(0)
                        });

                        // No longer stopping early - collect all tiles within threshold
                    }
                }
            }
        }

        // Cull to the 3 nearest tiles by Manhattan distance to ensure centered selection
        if (qualifyingTiles.length > 3) {
            qualifyingTiles.sort((a, b) => a.manhattanDist - b.manhattanDist);
            qualifyingTiles = qualifyingTiles.slice(0, 3);

            // Also cull debug info to match
            debugInfo.qualifyingTiles.sort((a, b) => parseFloat(a.manhattan) - parseFloat(b.manhattan));
            debugInfo.qualifyingTiles = debugInfo.qualifyingTiles.slice(0, 3);
        }

        if (qualifyingTiles.length === 0) {
            console.warn(`NPCSpawner: No qualifying table tiles found (within ${threshold}px Euclidean distance), falling back to booth position`);
            console.warn(`  NPC at (${point.x}, ${point.y})`);
            const boothCenterY = rect.y + rect.height / 2;
            return point.y < boothCenterY ? 'up' : 'down';
        }

        // Sum direction signs (+1/-1) from all qualifying tiles to NPC
        // This gives each tile equal weight regardless of distance
        let sumSignDx = 0;
        let sumSignDy = 0;

        qualifyingTiles.forEach(tile => {
            // Calculate displacement from tile to NPC (tile - NPC)
            const dx = tile.x - point.x;
            const dy = tile.y - point.y;

            // Add sign of displacement (+1, 0, or -1)
            sumSignDx += Math.sign(dx);
            sumSignDy += Math.sign(dy);
        });

        // Determine direction based on summed signs
        const absSumSignDx = Math.abs(sumSignDx);
        const absSumSignDy = Math.abs(sumSignDy);

        let direction;
        if (absSumSignDx > absSumSignDy) {
            // X axis dominates
            direction = sumSignDx > 0 ? 'right' : 'left';
        } else if (absSumSignDy > absSumSignDx) {
            // Y axis dominates
            direction = sumSignDy > 0 ? 'down' : 'up';
        } else {
            // Equal magnitude - fallback to closest tile
            const closestTable = qualifyingTiles.reduce((closest, current) =>
                current.distance < closest.distance ? current : closest
            );
            const dx = closestTable.x - point.x;
            const dy = closestTable.y - point.y;
            direction = Math.abs(dx) > Math.abs(dy) ?
                (dx > 0 ? 'right' : 'left') :
                (dy > 0 ? 'down' : 'up');
        }

        // Debug output
        console.log(`NPCSpawner: Direction debug for NPC at (${point.x.toFixed(0)}, ${point.y.toFixed(0)})`);
        console.log(`  All tiles found (within ${threshold}px Euclidean distance): ${debugInfo.qualifyingTiles.length}`);
        console.log(`  After culling to 3 nearest by Manhattan distance: ${qualifyingTiles.length}`);
        qualifyingTiles.forEach((tile, idx) => {
            console.log(`    [${idx}] Tile ID ${tile.tileId} at (${tile.tileX},${tile.tileY}) (world (${tile.x.toFixed(0)},${tile.y.toFixed(0)})): euclidean=${tile.distance.toFixed(2)}, manhattan=${tile.manhattanDist.toFixed(0)}`);
        });
        console.log(`  Summed direction signs: dx=${sumSignDx}, dy=${sumSignDy}`);
        console.log(`  Absolute sign magnitudes: X=${absSumSignDx}, Y=${absSumSignDy}`);
        console.log(`  Direction: ${direction}`);

        return direction;
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

    static setNPCDepth(npc, npcAreaRect, direction, tablesLayerDepth, tabletopsLayerDepth) {
        // Calculate relative position in npcAreaRect for Y-based depth variation
        const relY = Phaser.Math.Clamp(npc.y, npcAreaRect.y, npcAreaRect.y + npcAreaRect.height);
        const gradient = 1 - ((relY - npcAreaRect.y) / npcAreaRect.height); // 1 at top, 0 at bottom

        let baseDepth;
        let depthRange;

        // Set depth based on facing direction
        if (direction === 'up') {
            // NPCs facing up should be above both tables and tabletops
            baseDepth = Math.max(tablesLayerDepth, tabletopsLayerDepth) + 1;
            depthRange = 25; // Range above the highest layer
        } else {
            // NPCs facing down (or other directions) should be below tables and tabletops
            baseDepth = Math.min(tablesLayerDepth, tabletopsLayerDepth) - 26;
            depthRange = 25; // Range below the lowest layer
        }

        // Add Y-based variation within the depth range
        const npcDepth = Math.floor(baseDepth + (gradient * depthRange));
        npc.setDepth(npcDepth);
    }

    /**
     * Build a map of tile IDs for the tables layer for debug correlation
     */
    static buildTileIdMap(scene) {
        if (!scene.tablesLayer) return;

        // Define which tile indices are considered "table" tiles
        const tableTileIds = new Set([19, 20, 33, 34, 35, 36, 39, 41, 50]);

        const layerData = scene.tablesLayer.layer.data;
        const tileIdMap = {};
        let tileId = 0;

        for (let y = 0; y < layerData.length; y++) {
            const row = layerData[y];
            for (let x = 0; x < row.length; x++) {
                const tile = row[x];
                if (tile && tile.index !== 0 && tile.index !== -1) {
                    // Get base tile ID without flip flags (mask out bits 29-31)
                    const baseTileId = tile.index & 0x1FFFFFFF;
                    if (tableTileIds.has(baseTileId)) {
                        tileIdMap[`${x},${y}`] = tileId;
                        tileId++;
                    }
                }
            }
        }

        scene.tileIdMap = tileIdMap;
        console.log(`NPCSpawner: Built tile ID map with ${tileId} table tiles in tables layer`);
    }

    /**
     * Visualize tile IDs on the tables layer in debug mode
     */
    static visualizeTileIds(scene) {
        if (!scene.tablesLayer || !scene.tileIdMap) {
            console.warn('NPCSpawner: Cannot visualize tile IDs - no tables layer or tile ID map');
            return;
        }

        // Define which tile indices are considered "table" tiles
        const tableTileIds = new Set([19, 20, 33, 34, 35, 36, 39, 41, 50]);

        const tileWidth = scene.map.tileWidth;
        const tileHeight = scene.map.tileHeight;
        const layerData = scene.tablesLayer.layer.data;

        let visualizedCount = 0;

        for (let y = 0; y < layerData.length; y++) {
            const row = layerData[y];
            for (let x = 0; x < row.length; x++) {
                const tile = row[x];
                if (tile && tile.index !== 0 && tile.index !== -1) {
                    // Get base tile ID without flip flags (mask out bits 29-31)
                    const baseTileId = tile.index & 0x1FFFFFFF;
                    if (tableTileIds.has(baseTileId)) {
                        const key = `${x},${y}`;
                        const tileId = scene.tileIdMap[key];
                        if (tileId !== undefined) {
                            const worldX = x * tileWidth + tileWidth / 2;
                            const worldY = y * tileHeight + tileHeight / 2;

                            // Create text for tile ID with clear visibility
                            const text = scene.add.text(worldX, worldY, String(tileId), {
                                fontSize: '16px',
                                fontFamily: 'monospace',
                                color: '#ffff00',
                                align: 'center',
                                backgroundColor: '#000000',
                                padding: { x: 4, y: 2 },
                                stroke: '#ff0000',
                                strokeThickness: 2
                            });
                            text.setOrigin(0.5, 0.5);
                            text.setScrollFactor(1, 1); // Ensure it scrolls with the camera

                            // Set VERY high depth to ensure it's above everything
                            text.setDepth(99999);

                            visualizedCount++;
                        }
                    }
                }
            }
        }

        console.log(`NPCSpawner: Visualized ${visualizedCount} table tile IDs on tables layer`);
        console.log(`NPCSpawner: Tables layer depth: ${scene.tablesLayer.depth}`);
    }
}

export default NPCSpawner;
