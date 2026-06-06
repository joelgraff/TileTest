export const TABLE_COLLISION_PROPERTY_NAMES = {
    height: 'tableCollisionHeight',
    width: 'tableCollisionWidth',
    x: 'tableCollisionX',
    y: 'tableCollisionY'
};

export const TABLETOP_COLLISION_PROPERTY_NAMES = {
    height: 'tabletopCollisionHeight',
    width: 'tabletopCollisionWidth',
    x: 'tabletopCollisionX',
    y: 'tabletopCollisionY'
};

function getPropertyValue(entity, propertyName) {
    if (!Array.isArray(entity?.properties)) {
        return undefined;
    }

    return entity.properties.find(property => property.name === propertyName)?.value;
}

function normalizeNumericProperty(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        const normalizedValue = Number(value);

        return Number.isFinite(normalizedValue) ? normalizedValue : undefined;
    }

    return undefined;
}

function getTileSizeDimension(entity, propertyNames) {
    for (const propertyName of propertyNames) {
        const value = entity?.[propertyName];

        if (Number.isFinite(value)) {
            return value;
        }
    }

    return undefined;
}

function resolveCollisionDimension(value, tileSizeDimension) {
    if (value === -1) {
        return tileSizeDimension;
    }

    return Number.isFinite(value) ? value : undefined;
}

function resolveCollisionCoordinate(value, fallbackValue = 0) {
    if (value === -1) {
        return fallbackValue;
    }

    return Number.isFinite(value) ? value : fallbackValue;
}

function isValidCollisionObject(collisionObject) {
    return Number.isFinite(collisionObject?.x)
        && Number.isFinite(collisionObject?.y)
        && collisionObject.width > 0
        && collisionObject.height > 0;
}

export function resolveCollisionBox(collisionBox, {
    tileWidth = undefined,
    tileHeight = undefined,
    defaultOffsetX = 0,
    defaultOffsetY = 0
} = {}) {
    if (!collisionBox || typeof collisionBox !== 'object') {
        return null;
    }

    const sourceOffsetX = Number.isFinite(collisionBox.offsetX)
        ? collisionBox.offsetX
        : collisionBox.x;
    const sourceOffsetY = Number.isFinite(collisionBox.offsetY)
        ? collisionBox.offsetY
        : collisionBox.y;
    const hasAnyFinite = Number.isFinite(sourceOffsetX)
        || Number.isFinite(sourceOffsetY)
        || Number.isFinite(collisionBox.width)
        || Number.isFinite(collisionBox.height);

    if (!hasAnyFinite) {
        return null;
    }

    const width = resolveCollisionDimension(collisionBox.width, tileWidth);
    const height = resolveCollisionDimension(collisionBox.height, tileHeight);
    const x = resolveCollisionCoordinate(sourceOffsetX, defaultOffsetX);
    const y = resolveCollisionCoordinate(sourceOffsetY, defaultOffsetY);

    return {
        ...collisionBox,
        x,
        y,
        width,
        height,
        offsetX: x,
        offsetY: y
    };
}

export function getCollisionMetadata(entity, propertyNames) {
    const metadata = {
        height: normalizeNumericProperty(getPropertyValue(entity, propertyNames.height)),
        width: normalizeNumericProperty(getPropertyValue(entity, propertyNames.width)),
        x: normalizeNumericProperty(getPropertyValue(entity, propertyNames.x)),
        y: normalizeNumericProperty(getPropertyValue(entity, propertyNames.y))
    };
    const definedValueCount = Object.values(metadata).filter(value => value !== undefined).length;
    const tileWidth = getTileSizeDimension(entity, ['tilewidth', 'tileWidth']);
    const tileHeight = getTileSizeDimension(entity, ['tileheight', 'tileHeight']);
    const resolvedWidth = resolveCollisionDimension(metadata.width, tileWidth);
    const resolvedHeight = resolveCollisionDimension(metadata.height, tileHeight);
    const isDisabled = metadata.width === 0 || metadata.height === 0;

    return {
        ...metadata,
        tileWidth,
        tileHeight,
        resolvedWidth,
        resolvedHeight,
        hasAny: definedValueCount > 0,
        isComplete: definedValueCount === 4,
        isDisabled,
        isValid: Number.isFinite(metadata.x)
            && Number.isFinite(metadata.y)
            && !isDisabled
            && Number.isFinite(resolvedWidth)
            && Number.isFinite(resolvedHeight)
            && resolvedWidth > 0
            && resolvedHeight > 0
    };
}

export function getCollisionObject(entity, propertyNames, tileSize = {}) {
    const metadata = getCollisionMetadata(entity, propertyNames);

    if (!metadata.hasAny || metadata.isDisabled) {
        return null;
    }

    return resolveCollisionBox({
        x: metadata.x,
        y: metadata.y,
        width: metadata.width,
        height: metadata.height
    }, {
        tileWidth: tileSize.width,
        tileHeight: tileSize.height
    });
}

export function getCollisionRect(entity, propertyNames, tileSize = {}) {
    const collisionObject = getCollisionObject(entity, propertyNames, tileSize);

    if (!isValidCollisionObject(collisionObject)) {
        return null;
    }

    return collisionObject;
}

export function getTableCollisionMetadata(entity) {
    return getCollisionMetadata(entity, TABLE_COLLISION_PROPERTY_NAMES);
}

export function getTabletopCollisionMetadata(entity) {
    return getCollisionMetadata(entity, TABLETOP_COLLISION_PROPERTY_NAMES);
}

export function getTableCollisionRect(entity, tileSize = {}) {
    return getCollisionRect(entity, TABLE_COLLISION_PROPERTY_NAMES, tileSize);
}

export function getTabletopCollisionRect(entity, tileSize = {}) {
    return getCollisionRect(entity, TABLETOP_COLLISION_PROPERTY_NAMES, tileSize);
}