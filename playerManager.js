import CONFIG from './config.js';
import { resolvePlayerAnimationKey } from './playerAnimationResolver.js';
import { resolveCollisionBox } from './tabletopCollisionMetadata.js';

function isValidCollisionBox(collisionBox) {
    return Number.isFinite(collisionBox?.width)
        && Number.isFinite(collisionBox?.height)
        && Number.isFinite(collisionBox?.offsetX)
        && Number.isFinite(collisionBox?.offsetY)
        && collisionBox.width > 0
        && collisionBox.height > 0;
}

function getRuntimeProfileCollisionBox(scene) {
    const collisionBox = scene.mapRuntimeProfile?.sprite?.collision;
    const frameWidth = scene.playerSpriteConfig?.frameWidth
        ?? scene.mapRuntimeProfile?.sprite?.frameWidth
        ?? CONFIG.PLAYER.FRAME_WIDTH;
    const frameHeight = scene.playerSpriteConfig?.frameHeight
        ?? scene.mapRuntimeProfile?.sprite?.frameHeight
        ?? CONFIG.PLAYER.FRAME_HEIGHT;
    const resolvedCollisionBox = resolveCollisionBox({
        width: collisionBox?.width,
        height: collisionBox?.height,
        offsetX: collisionBox?.left,
        offsetY: collisionBox?.top
    }, {
        tileWidth: frameWidth,
        tileHeight: frameHeight
    });

    return resolvedCollisionBox
        ? {
            width: resolvedCollisionBox.width ?? null,
            height: resolvedCollisionBox.height ?? null,
            offsetX: resolvedCollisionBox.offsetX ?? null,
            offsetY: resolvedCollisionBox.offsetY ?? null
        }
        : null;
}

export function getPlayerCollisionBox(scene) {
    const playerTileset = scene.map?.tilesets?.find(ts => ts.name === CONFIG.ASSETS.PLAYER);
    let collisionBox = null;
    const tileWidth = playerTileset?.tilewidth ?? playerTileset?.tileWidth ?? scene.playerSpriteConfig?.frameWidth ?? CONFIG.PLAYER.FRAME_WIDTH;
    const tileHeight = playerTileset?.tileheight ?? playerTileset?.tileHeight ?? scene.playerSpriteConfig?.frameHeight ?? CONFIG.PLAYER.FRAME_HEIGHT;

    if (playerTileset?.tileData) {
        let frameIndex = scene.player?.frame?.name ?? scene.player?.frame?.index ?? 0;
        if (typeof frameIndex === 'string') frameIndex = parseInt(frameIndex, 10) || 0;
        if (playerTileset.firstgid && frameIndex >= playerTileset.firstgid) {
            frameIndex = frameIndex - playerTileset.firstgid;
        }

        const tileData = playerTileset.tileData[frameIndex];
        const objectGroupObject = tileData?.objectgroup?.objects?.[0] ?? null;

        if (objectGroupObject) {
            collisionBox = resolveCollisionBox({
                width: objectGroupObject.width,
                height: objectGroupObject.height,
                offsetX: objectGroupObject.x,
                offsetY: objectGroupObject.y
            }, {
                tileWidth,
                tileHeight
            });
        }
    }

    if (!isValidCollisionBox(collisionBox)) {
        collisionBox = getRuntimeProfileCollisionBox(scene);
    }

    if (!isValidCollisionBox(collisionBox)) {
        collisionBox = getDefaultCollisionBox();
    }

    return isValidCollisionBox(collisionBox) ? collisionBox : null;
}

function getDefaultCollisionBox() {
    return {
        width: CONFIG.PLAYER.DEFAULT_SIZE.width,
        height: CONFIG.PLAYER.DEFAULT_SIZE.height,
        offsetX: CONFIG.PLAYER.DEFAULT_SIZE.offsetX,
        offsetY: CONFIG.PLAYER.DEFAULT_SIZE.offsetY
    };
}

function getLayerDepth(scene, layerName, fallbackDepth = 0) {
    const layerDepth = scene.mapLayers?.[layerName]?.depth;

    return Number.isFinite(layerDepth) ? layerDepth : fallbackDepth;
}

function resolvePlayerDepth(scene) {
    const playerY = Number.isFinite(scene.player?.y) ? Math.floor(scene.player.y) : 0;
    const tablesLayerDepth = Math.floor(getLayerDepth(scene, 'tables', scene.map?.heightInPixels ?? 0));
    const tabletopsLayerDepth = Math.floor(getLayerDepth(scene, 'tabletops', (scene.map?.heightInPixels ?? 0) * 2));
    const minDepth = tablesLayerDepth + 1;
    const maxDepth = Math.max(minDepth, tabletopsLayerDepth - 1);

    return Math.min(Math.max(playerY, minDepth), maxDepth);
}

class PlayerManager {
    static lastX = 0;
    static lastY = 0;
    static stuckCounter = 0;
    static preload(scene, {
        packageName = scene.assetPackageName ?? CONFIG.ASSETS.PACKAGE,
        frameWidth = CONFIG.PLAYER.FRAME_WIDTH,
        frameHeight = CONFIG.PLAYER.FRAME_HEIGHT
    } = {}) {
        scene.playerSpriteConfig = {
            frameWidth,
            frameHeight
        };

        scene.load.spritesheet(
            CONFIG.ASSETS.PLAYER,
            CONFIG.getAssetPath(CONFIG.ASSETS.PLAYER, CONFIG.PATHS.IMAGE_EXTENSION, packageName),
            { frameWidth, frameHeight }
        );
    }

    static create(scene) {
        const { x: startX, y: startY } = PlayerManager.getPlayerStartPosition(scene);
        scene.player = PlayerManager.createPlayerSprite(scene, startX, startY);
        PlayerManager.setPlayerCollisionBox(scene);
        PlayerManager.createPlayerAnimations(scene);
        PlayerManager.updatePlayerDepth(scene);
    }

    static update(scene, time, delta) {
        if (!scene.player || !scene.inputManager) return;
        if (scene.gameState?.isDialogOpen) return; // Don't update player when dialog is open
        const direction = scene.inputManager.getDirection();
        PlayerManager.handlePlayerMovement(scene, direction);
        PlayerManager.handlePlayerAnimation(scene, direction);
        PlayerManager.updatePlayerDepth(scene); // Keep the player above tables and below tabletops
        PlayerManager.drawPlayerDebug(scene, direction);
    }

    // --- Helper Functions ---

    static getPlayerStartPosition(scene) {
        const playerLayer = scene.map.getObjectLayer('player');
        let x = 100, y = 100;
        if (playerLayer && playerLayer.objects && playerLayer.objects.length > 0) {
            const startObj = playerLayer.objects.find(obj => obj.name === 'start');
            if (startObj) {
                x = startObj.x;
                y = startObj.y;
            }
        }
        return { x, y };
    }

    static createPlayerSprite(scene, x, y) {
        const sprite = scene.physics.add.sprite(x, y, CONFIG.ASSETS.PLAYER, 0);
        sprite.setCollideWorldBounds(true);
        return sprite;
    }

    static setPlayerCollisionBox(scene) {
        const collisionBox = getPlayerCollisionBox(scene);

        if (!isValidCollisionBox(collisionBox)) {
            return;
        }

        scene.player.setSize(collisionBox.width, collisionBox.height);
        scene.player.setOffset(collisionBox.offsetX, collisionBox.offsetY);
    }

    static createPlayerAnimations(scene) {
        scene.anims.create({
            key: 'down',
            frames: scene.anims.generateFrameNumbers(CONFIG.ASSETS.PLAYER, { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'left',
            frames: scene.anims.generateFrameNumbers(CONFIG.ASSETS.PLAYER, { start: 4, end: 7 }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'right',
            frames: scene.anims.generateFrameNumbers(CONFIG.ASSETS.PLAYER, { start: 8, end: 11 }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'up',
            frames: scene.anims.generateFrameNumbers(CONFIG.ASSETS.PLAYER, { start: 12, end: 15 }),
            frameRate: 8,
            repeat: -1
        });
    }

    static handlePlayerMovement(scene, direction = scene.inputManager.getDirection()) {
        const speed = 200;
        scene.player.setVelocity(direction.x * speed, direction.y * speed);

        // Check if stuck trying to reach target
        if (scene.inputManager.hasMovementTarget()) {
            const deltas = { x: Math.abs(scene.player.x - PlayerManager.lastX), y: Math.abs(scene.player.y - PlayerManager.lastY) };

            if (deltas.x + deltas.y < .2) {
            //if (scene.player.x === PlayerManager.lastX && scene.player.y === PlayerManager.lastY) {
                PlayerManager.stuckCounter++;
                if (PlayerManager.stuckCounter > 1) {
                    // Player hasn't moved for 2 frames, cancel target
                    scene.inputManager.cancelMovementTarget();
                    scene.player.setVelocity(0, 0);
                    PlayerManager.stuckCounter = 0;
                }
            } else {
                PlayerManager.stuckCounter = 0;
            }
            PlayerManager.lastX = scene.player.x;
            PlayerManager.lastY = scene.player.y;
        } else {
            PlayerManager.stuckCounter = 0;
        }
    }

    static handlePlayerAnimation(scene, direction = scene.inputManager.getDirection()) {
        const animKey = resolvePlayerAnimationKey(direction);

        if (!animKey) {
            scene.player.anims.stop();
            scene.player.setFrame(0); // Idle frame (down)
        } else {
            scene.player.anims.play(animKey, true);
        }
    }

    static updatePlayerDepth(scene) {
        scene.player.setDepth(resolvePlayerDepth(scene));
    }

    static drawPlayerDebug(scene, direction = scene.inputManager.getDirection()) {
        if (scene.debugEnabled) {
            if (!scene.playerDebugGraphics) {
                scene.playerDebugGraphics = scene.add.graphics().setDepth(999);
            }
            scene.playerDebugGraphics.clear();
            // Draw direction vector
            scene.playerDebugGraphics.lineStyle(2, 0xff0000, 1);
            scene.playerDebugGraphics.strokeLineShape(
                new Phaser.Geom.Line(
                    scene.player.x,
                    scene.player.y,
                    scene.player.x + direction.x * 32,
                    scene.player.y + direction.y * 32
                )
            );
            // Draw custom collision box
            const body = scene.player.body;
            if (body) {
                scene.playerDebugGraphics.lineStyle(2, 0x00ff00, 1);
                scene.playerDebugGraphics.strokeRect(
                    body.x,
                    body.y,
                    body.width,
                    body.height
                );
            }
        } else if (scene.playerDebugGraphics) {
            scene.playerDebugGraphics.destroy();
            scene.playerDebugGraphics = null;
        }
    }
}

export default PlayerManager;