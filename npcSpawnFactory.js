export function resolveNPCTablesLayerDepth(scene) {
    const tablesLayer = scene.mapLayers?.tables;

    if (tablesLayer && typeof tablesLayer.depth === 'number') {
        return tablesLayer.depth;
    }

    return Math.floor(scene.map.heightInPixels);
}

function getFiniteNumber(value, defaultValue = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : defaultValue;
}

function getStringPropertyValue(point, propertyName) {
    const directValue = point?.[propertyName];

    if (typeof directValue === 'string' && directValue.length > 0) {
        return directValue;
    }

    const property = point?.properties?.find(entry => entry?.name === propertyName);

    if (typeof property?.value === 'string' && property.value.length > 0) {
        return property.value;
    }

    return null;
}

function getVendorSpawnOffsets(scene) {
    const runtimeProfile = scene?.mapRuntimeProfile ?? {};
    const properties = runtimeProfile?.properties ?? {};

    return {
        up: getFiniteNumber(runtimeProfile.vendorUpOffset ?? properties.vendorUpOffset ?? runtimeProfile.vendorVerticalOffset ?? properties.vendorVerticalOffset, 0),
        down: getFiniteNumber(runtimeProfile.vendorDownOffset ?? properties.vendorDownOffset ?? runtimeProfile.vendorVerticalOffset ?? properties.vendorVerticalOffset, 0),
        left: getFiniteNumber(runtimeProfile.vendorLeftOffset ?? properties.vendorLeftOffset ?? runtimeProfile.vendorHorizontalOffset ?? properties.vendorHorizontalOffset, 0),
        right: getFiniteNumber(runtimeProfile.vendorRightOffset ?? properties.vendorRightOffset ?? runtimeProfile.vendorHorizontalOffset ?? properties.vendorHorizontalOffset, 0)
    };
}

function resolveFacingBoundaryPosition(point, direction, npcAreaRect, tileWidth, tileHeight) {
    const x = Number(point?.x ?? 0);
    const y = Number(point?.y ?? 0);

    if (npcAreaRect) {
        switch (direction) {
            case 'up':
                return { x, y: Number(npcAreaRect.y ?? y) };
            case 'down':
                return { x, y: Number(npcAreaRect.y ?? y) + Number(npcAreaRect.height ?? 0) };
            case 'left':
                return { x: Number(npcAreaRect.x ?? x), y };
            case 'right':
                return { x: Number(npcAreaRect.x ?? x) + Number(npcAreaRect.width ?? 0), y };
            default:
                return { x, y };
        }
    }

    const resolvedTileWidth = Math.abs(Number(tileWidth));
    const resolvedTileHeight = Math.abs(Number(tileHeight));

    switch (direction) {
        case 'up':
            return {
                x,
                y: resolvedTileHeight > 0 ? Math.floor(y / resolvedTileHeight) * resolvedTileHeight : y
            };
        case 'down':
            return {
                x,
                y: resolvedTileHeight > 0 ? Math.ceil(y / resolvedTileHeight) * resolvedTileHeight : y
            };
        case 'left':
            return {
                x: resolvedTileWidth > 0 ? Math.floor(x / resolvedTileWidth) * resolvedTileWidth : x,
                y
            };
        case 'right':
            return {
                x: resolvedTileWidth > 0 ? Math.ceil(x / resolvedTileWidth) * resolvedTileWidth : x,
                y
            };
        default:
            return { x, y };
    }
}

function resolveVendorSpawnPosition(point, direction, vendorOffsets, npcAreaRect, tileWidth, tileHeight) {
    const boundaryPosition = resolveFacingBoundaryPosition(point, direction, npcAreaRect, tileWidth, tileHeight);

    switch (direction) {
        case 'up':
            return { x: boundaryPosition.x, y: boundaryPosition.y + vendorOffsets.up };
        case 'down':
            return { x: boundaryPosition.x, y: boundaryPosition.y - vendorOffsets.down };
        case 'left':
            return { x: boundaryPosition.x + vendorOffsets.left, y: boundaryPosition.y };
        case 'right':
            return { x: boundaryPosition.x - vendorOffsets.right, y: boundaryPosition.y };
        default:
            return boundaryPosition;
    }
}

function getNPCInteractionCue(point) {
    return getStringPropertyValue(point, 'interactionCue');
}

export function createNPCGroup(scene, spawnPoints, npcAreaRect, tablesLayerDepth, {
    getNearestEdgeDirection,
    getFrameForDirection,
    getRandomSpriteKey,
    setNPCDepth,
    setNPCCollisionBox,
    groupFactory = () => scene.add.group(),
    spriteFactory = (x, y, spriteKey, frame) => scene.physics.add.sprite(x, y, spriteKey, frame)
} = {}) {
    const npcGroup = groupFactory();
    const vendorOffsets = getVendorSpawnOffsets(scene);
    const runtimeProfile = scene?.mapRuntimeProfile ?? {};
    const tileWidth = runtimeProfile.tileWidth ?? scene?.map?.tileWidth ?? 0;
    const tileHeight = runtimeProfile.tileHeight ?? scene?.map?.tileHeight ?? 0;

    spawnPoints.forEach(point => {
        const pointAreaRect = point.npcAreaRect ?? npcAreaRect ?? null;
        const direction = (point.resolvedFacing
            ?? point.facing
            ?? (pointAreaRect ? getNearestEdgeDirection(point, pointAreaRect) : 'down')).toLowerCase();
        const frame = getFrameForDirection(direction);
        const spriteKey = getRandomSpriteKey();
        const spawnPosition = resolveVendorSpawnPosition(point, direction, vendorOffsets, pointAreaRect, tileWidth, tileHeight);
        const npc = spriteFactory(spawnPosition.x, spawnPosition.y, spriteKey, frame);

        npc.interactionCue = getNPCInteractionCue(point);
        setNPCCollisionBox?.(npc, point);
        npcGroup.add(npc);
        setNPCDepth(npc, pointAreaRect, tablesLayerDepth);
    });

    return npcGroup;
}