import CONFIG from './config.js';
import { buildMapRuntimeProfile } from './mapRuntimeProfile.js';

export function buildNPCSpriteKeys(runtimeProfile, {
    fallbackSpriteKeys = CONFIG.NPC.SPRITES,
    defaultPrefix = CONFIG.NPC.SPRITE_PREFIX,
    defaultPadding = CONFIG.NPC.SPRITE_PADDING
} = {}) {
    const spriteCount = runtimeProfile?.sprite?.count;

    if (!Number.isInteger(spriteCount) || spriteCount <= 0) {
        return [...fallbackSpriteKeys];
    }

    const prefix = runtimeProfile?.sprite?.prefix ?? defaultPrefix;
    const padding = Number.isInteger(runtimeProfile?.sprite?.padding)
        ? runtimeProfile.sprite.padding
        : defaultPadding;

    return Array.from({ length: spriteCount }, (_, index) => (
        `${prefix}${String(index + 1).padStart(padding, '0')}`
    ));
}

export function createBootstrapPreloadOptions(runtimeProfile, {
    packageName = runtimeProfile?.packageName ?? CONFIG.ASSETS.PACKAGE
} = {}) {
    const frameWidth = runtimeProfile?.sprite?.frameWidth ?? CONFIG.PLAYER.FRAME_WIDTH;
    const frameHeight = runtimeProfile?.sprite?.frameHeight ?? CONFIG.PLAYER.FRAME_HEIGHT;

    return {
        packageName,
        player: {
            packageName,
            frameWidth,
            frameHeight
        },
        npc: {
            packageName,
            spriteKeys: buildNPCSpriteKeys(runtimeProfile),
            frameWidth: runtimeProfile?.sprite?.frameWidth ?? CONFIG.NPC.FRAME_WIDTH,
            frameHeight: runtimeProfile?.sprite?.frameHeight ?? CONFIG.NPC.FRAME_HEIGHT
        }
    };
}

export async function loadBootstrapRuntimeProfile({
    fetchFn = globalThis.fetch?.bind(globalThis),
    packageName = CONFIG.ASSETS.PACKAGE,
    mapKey = CONFIG.ASSETS.MAP
} = {}) {
    if (typeof fetchFn !== 'function') {
        return null;
    }

    const response = await fetchFn(
        CONFIG.getAssetPath(mapKey, CONFIG.PATHS.JSON_EXTENSION, packageName)
    );

    if (!response?.ok) {
        throw new Error(`Runtime profile fetch failed for map "${mapKey}".`);
    }

    const mapData = await response.json();

    return buildMapRuntimeProfile(mapData, {
        packageName,
        mapName: mapKey
    });
}