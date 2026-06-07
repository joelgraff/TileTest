import CONFIG from './config.js';

const DEFAULT_NPC_GROUP_NAME = 'npc_areas';
const SPRITE_COUNT_PROPERTY_NAMES = ['spriteCount', 'spriteSpriteCount'];
const DEFAULT_NPC_SPRITE_PREFIX = 'npc_';
const DEFAULT_NPC_SPRITE_PADDING = 3;

export function getEntityPropertyValue(entity, propertyName) {
    if (!Array.isArray(entity?.properties)) {
        return undefined;
    }

    return entity.properties.find(property => property.name === propertyName)?.value;
}

export function flattenLayerTree(layers = [], parentPath = []) {
    const entries = [];

    for (const layer of layers) {
        const path = [...parentPath, layer.name].filter(Boolean);
        const entry = {
            layer,
            name: layer?.name ?? null,
            type: layer?.type ?? null,
            path
        };

        entries.push(entry);

        if (Array.isArray(layer?.layers) && layer.layers.length > 0) {
            entries.push(...flattenLayerTree(layer.layers, path));
        }
    }

    return entries;
}

function getPropertyBag(entity) {
    if (!Array.isArray(entity?.properties)) {
        return {};
    }

    return entity.properties.reduce((propertyBag, property) => {
        propertyBag[property.name] = property.value;
        return propertyBag;
    }, {});
}

function getCompatibleProperty(properties, propertyNames) {
    const propertyName = propertyNames.find(name => properties[name] !== undefined) ?? null;

    return {
        propertyName,
        value: propertyName ? properties[propertyName] : null
    };
}

function getNumericPropertyValue(properties, propertyName, defaultValue = 0) {
    const value = Number(properties?.[propertyName]);

    return Number.isFinite(value) ? value : defaultValue;
}

function getNumericPropertyValueFromAny(properties, propertyNames, defaultValue = 0) {
    for (const propertyName of propertyNames) {
        const value = getNumericPropertyValue(properties, propertyName, Number.NaN);

        if (Number.isFinite(value)) {
            return value;
        }
    }

    return defaultValue;
}

function isExternalReference(reference) {
    return (
        typeof reference === 'string' &&
        (
            /^[a-z]+:\/\//i.test(reference) ||
            /^[A-Za-z]:[\\/]/.test(reference) ||
            reference.startsWith('/') ||
            reference.startsWith('..') ||
            reference.includes('/../') ||
            reference.includes('\\..\\')
        )
    );
}

function getPathBasename(pathValue) {
    if (typeof pathValue !== 'string' || pathValue.length === 0) {
        return null;
    }

    return pathValue.split(/[\\/]/).pop() ?? null;
}

function buildNpcAreaLayerProfile(layerEntry) {
    const defaultFacing = getEntityPropertyValue(layerEntry.layer, 'defaultFacing') ?? null;
    const spawnPoints = (layerEntry.layer?.objects ?? [])
        .filter(object => object?.point === true || object?.type === 'point')
        .map(object => {
            const facing = getEntityPropertyValue(object, 'facing') ?? null;

            return {
                object,
                name: object?.name ?? null,
                x: object?.x ?? null,
                y: object?.y ?? null,
                facing,
                resolvedFacing: facing ?? defaultFacing ?? 'down'
            };
        });

    return {
        layer: layerEntry.layer,
        name: layerEntry.name,
        path: layerEntry.path,
        defaultFacing,
        spawnPoints
    };
}

function buildTilesetProfile(tileset, packageRoot) {
    const imageFileName = getPathBasename(tileset?.image);

    return {
        tileset,
        name: tileset?.name ?? null,
        firstgid: tileset?.firstgid ?? null,
        image: tileset?.image ?? null,
        imageFileName,
        packageImagePath: imageFileName ? `${packageRoot}/${imageFileName}` : null,
        externalImage: isExternalReference(tileset?.image),
        tileWidth: tileset?.tilewidth ?? null,
        tileHeight: tileset?.tileheight ?? null
    };
}

function getPrimaryTileset(mapData) {
    return (mapData?.tilesets ?? []).find(tileset => typeof tileset?.name === 'string' && tileset.name.length > 0)
        ?? mapData?.tilesets?.[0]
        ?? null;
}

export function getNPCSpriteKeys(runtimeProfile, {
    fallbackSpriteKeys = CONFIG.NPC.SPRITES,
    defaultPrefix = DEFAULT_NPC_SPRITE_PREFIX,
    defaultPadding = DEFAULT_NPC_SPRITE_PADDING
} = {}) {
    const spriteConfig = runtimeProfile?.sprite;
    const spriteCount = Number(spriteConfig?.count ?? 0);

    if (!Number.isInteger(spriteCount) || spriteCount <= 0) {
        return [...fallbackSpriteKeys];
    }

    const prefix = spriteConfig?.prefix ?? defaultPrefix;
    const padding = Number.isInteger(spriteConfig?.padding) && spriteConfig.padding > 0
        ? spriteConfig.padding
        : defaultPadding;

    return Array.from({ length: spriteCount }, (_, index) => `${prefix}${String(index + 1).padStart(padding, '0')}`);
}

export async function loadMapRuntimeProfile({
    fetchFn = globalThis.fetch,
    packageName,
    mapName = CONFIG.ASSETS.MAP
} = {}) {
    if (typeof fetchFn !== 'function') {
        throw new Error('A fetch implementation is required to load the map runtime profile.');
    }

    const mapPath = CONFIG.getAssetPath(mapName, CONFIG.PATHS.JSON_EXTENSION, packageName);
    const response = await fetchFn(mapPath, { cache: 'no-store' });

    if (!response?.ok) {
        throw new Error(`Failed to load map runtime profile from "${mapPath}" (${response?.status ?? 'unknown status'}).`);
    }

    return buildMapRuntimeProfile(await response.json(), {
        packageName,
        mapName
    });
}

export function buildMapRuntimeProfile(mapData, {
    packageName,
    mapName = CONFIG.ASSETS.MAP,
    npcGroupName = DEFAULT_NPC_GROUP_NAME
} = {}) {
    const properties = getPropertyBag(mapData);
    const packageRoot = CONFIG.getPackageRoot(packageName);
    const flattenedLayers = flattenLayerTree(mapData?.layers ?? []);
    const npcAreaGroupEntry = flattenedLayers.find(entry => entry.type === 'group' && entry.name === npcGroupName) ?? null;
    const npcAreaLayers = npcAreaGroupEntry
        ? flattenLayerTree(npcAreaGroupEntry.layer?.layers ?? [], npcAreaGroupEntry.path)
            .filter(entry => entry.type === 'objectgroup')
            .map(buildNpcAreaLayerProfile)
        : [];
    const spriteCount = getCompatibleProperty(properties, SPRITE_COUNT_PROPERTY_NAMES);
    const vendorUpOffset = getNumericPropertyValueFromAny(properties, ['vendorUpOffset', 'vendorVerticalOffset'], 0);
    const vendorDownOffset = getNumericPropertyValueFromAny(properties, ['vendorDownOffset', 'vendorVerticalOffset'], 0);
    const vendorLeftOffset = getNumericPropertyValueFromAny(properties, ['vendorLeftOffset', 'vendorHorizontalOffset'], 0);
    const vendorRightOffset = getNumericPropertyValueFromAny(properties, ['vendorRightOffset', 'vendorHorizontalOffset'], 0);

    const primaryTileset = getPrimaryTileset(mapData);

    return {
        packageName: packageName ?? CONFIG.ASSETS.PACKAGE,
        packageRoot,
        mapKey: mapName,
        mapPath: CONFIG.getAssetPath(mapName, CONFIG.PATHS.JSON_EXTENSION, packageName),
        tileWidth: mapData?.tilewidth ?? null,
        tileHeight: mapData?.tileheight ?? null,
        properties,
        allLayers: flattenedLayers,
        npcAreaGroup: npcAreaGroupEntry
            ? {
                layer: npcAreaGroupEntry.layer,
                name: npcAreaGroupEntry.name,
                path: npcAreaGroupEntry.path
            }
            : null,
        npcAreaLayers,
        vendorUpOffset,
        vendorDownOffset,
        vendorLeftOffset,
        vendorRightOffset,
        sprite: {
            prefix: properties.spritePrefix ?? null,
            count: spriteCount.value,
            countProperty: spriteCount.propertyName,
            frameWidth: properties.spriteFrameWidth ?? null,
            frameHeight: properties.spriteFrameHeight ?? null,
            frameRate: properties.spriteFrameRate ?? null,
            padding: properties.spritePadding ?? null,
            collision: {
                left: properties.spriteCollisionLeft ?? null,
                top: properties.spriteCollisionTop ?? null,
                width: properties.spriteCollisionWidth ?? null,
                height: properties.spriteCollisionHeight ?? null
            }
        },
        tilesets: (mapData?.tilesets ?? []).map(tileset => buildTilesetProfile(tileset, packageRoot)),
        primaryTileset: primaryTileset
            ? buildTilesetProfile(primaryTileset, packageRoot)
            : null,
        compatibility: {
            usedLegacySpriteCountProperty: spriteCount.propertyName === 'spriteSpriteCount'
        }
    };
}