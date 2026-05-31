import CONFIG from './config.js';

const TILE_FLIP_FLAGS_MASK = 0x1fffffff;

export const MAP_READINESS_SEVERITY = {
    BLOCKING: 'blocking',
    INFO: 'info'
};

export const MAP_READINESS_CODES = {
    COLLISION_LAYER_DEPTH_MISSING: 'COLLISION_LAYER_DEPTH_MISSING',
    COLLISION_LAYER_EMPTY: 'COLLISION_LAYER_EMPTY',
    COLLISION_LAYER_MISSING: 'COLLISION_LAYER_MISSING',
    COLLISION_LAYER_TYPE_INVALID: 'COLLISION_LAYER_TYPE_INVALID',
    COLLISION_TILE_METADATA_INVALID: 'COLLISION_TILE_METADATA_INVALID',
    COLLISION_TILE_METADATA_MISSING: 'COLLISION_TILE_METADATA_MISSING',
    DRAFT_LAYER_PRESENT: 'DRAFT_LAYER_PRESENT',
    EXTERNAL_IMAGE_REFERENCE: 'EXTERNAL_IMAGE_REFERENCE',
    EXTERNAL_TILESET_IMAGE: 'EXTERNAL_TILESET_IMAGE',
    EXTERNAL_TILESET_SOURCE: 'EXTERNAL_TILESET_SOURCE',
    IMAGE_LAYER_PRESENT: 'IMAGE_LAYER_PRESENT',
    LAYER_TYPE_INVALID: 'LAYER_TYPE_INVALID',
    NPC_AREA_RECT_COUNT_INVALID: 'NPC_AREA_RECT_COUNT_INVALID',
    NPC_AREA_RECT_MISSING: 'NPC_AREA_RECT_MISSING',
    NPC_SPAWN_POINT_INVALID: 'NPC_SPAWN_POINT_INVALID',
    NPC_SPAWN_POINTS_MISSING: 'NPC_SPAWN_POINTS_MISSING',
    PLAYER_START_COUNT_INVALID: 'PLAYER_START_COUNT_INVALID',
    PLAYER_START_MISSING: 'PLAYER_START_MISSING',
    PLAYER_START_NOT_POINT: 'PLAYER_START_NOT_POINT',
    REQUIRED_LAYER_MISSING: 'REQUIRED_LAYER_MISSING',
    TILESET_IMAGE_MISMATCH: 'TILESET_IMAGE_MISMATCH',
    TILESET_MISSING: 'TILESET_MISSING',
    TILESET_NOT_EMBEDDED: 'TILESET_NOT_EMBEDDED'
};

export const MAP_READINESS_ACTION_IDS = {
    RUNTIME_LAYERS: 'runtime-layers',
    TILESET_BUNDLING: 'tileset-bundling',
    PLAYER_START: 'player-start',
    NPC_PLACEMENT: 'npc-placement',
    COLLISION_AUTHORING: 'collision-authoring',
    IMAGE_LAYERS: 'image-layers'
};

export const MAP_LAYER_MAPPING_STATUS = {
    MATCHED: 'matched',
    CANDIDATE: 'candidate',
    MISSING: 'missing'
};

const DEFAULT_DRAFT_LAYER_ALIASES = {
    floor: ['Tile Layer 1'],
    tables: ['furniture'],
    npc_area: ['zones']
};

export const RUNTIME_MAP_CONTRACT = {
    requiredLayers: ['floor', 'tables', 'player', 'npc_area', 'tabletops'],
    expectedLayerTypes: {
        floor: 'tilelayer',
        tables: 'tilelayer',
        player: 'objectgroup',
        npc_area: 'objectgroup',
        tabletops: 'tilelayer'
    },
    collisionLayers: ['tables', 'tabletops'],
    npcLayerName: 'npc_area',
    playerLayerName: 'player',
    playerStartName: 'start',
    tilesetImage: `${CONFIG.ASSETS.TILES}${CONFIG.PATHS.IMAGE_EXTENSION}`,
    tilesetName: CONFIG.ASSETS.TILES
};

function createIssue(severity, code, message) {
    return { severity, code, message };
}

function getLayer(map, layerName) {
    return (map.layers ?? []).find(layer => layer.name === layerName);
}

function getTileset(map, tilesetName) {
    return (map.tilesets ?? []).find(tileset => tileset.name === tilesetName);
}

function getPropertyValue(entity, propertyName) {
    if (!Array.isArray(entity?.properties)) {
        return undefined;
    }

    return entity.properties.find(property => property.name === propertyName)?.value;
}

function getReferenceLabel(entity, fallback) {
    if (entity.name) {
        return `"${entity.name}"`;
    }

    if (entity.firstgid !== undefined) {
        return `at firstgid ${entity.firstgid}`;
    }

    return fallback;
}

function getTilesetLabel(tileset) {
    const nameLabel = tileset.name ? tileset.name : `firstgid ${tileset.firstgid}`;

    return tileset.firstgid !== undefined && tileset.name
        ? `${nameLabel} at firstgid ${tileset.firstgid}`
        : nameLabel;
}

function isExternalReference(reference) {
    return (
        /^[a-z]+:\/\//i.test(reference) ||
        /^[A-Za-z]:[\\/]/.test(reference) ||
        reference.startsWith('/') ||
        reference.startsWith('..') ||
        reference.includes('/../') ||
        reference.includes('\\..\\')
    );
}

function toLocalTileId(globalTileId, tileset) {
    const unflippedTileId = globalTileId & TILE_FLIP_FLAGS_MASK;

    if (!tileset?.firstgid || unflippedTileId < tileset.firstgid) {
        return undefined;
    }

    return unflippedTileId - tileset.firstgid;
}

function getEmbeddedTilesetCollisionObjects(tileset, tileId) {
    const tileDefinition = tileset?.tiles?.find(tile => tile.id === tileId);

    return tileDefinition?.objectgroup?.objects ?? [];
}

function validateRequiredLayers(map, contract, issues) {
    for (const layerName of contract.requiredLayers) {
        const layer = getLayer(map, layerName);

        if (!layer) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.REQUIRED_LAYER_MISSING,
                `Missing required runtime layer "${layerName}".`
            ));
            continue;
        }

        const expectedType = contract.expectedLayerTypes[layerName];
        if (expectedType && layer.type !== expectedType) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.LAYER_TYPE_INVALID,
                `Layer "${layerName}" must be a ${expectedType}, but it is ${layer.type}.`
            ));
        }
    }
}

function validatePlayerStart(map, contract, issues) {
    const playerLayer = getLayer(map, contract.playerLayerName);
    const playerObjects = Array.isArray(playerLayer?.objects) ? playerLayer.objects : [];
    const startMarkers = playerObjects.filter(object => object.name === contract.playerStartName);

    if (startMarkers.length === 0) {
        issues.push(createIssue(
            MAP_READINESS_SEVERITY.BLOCKING,
            MAP_READINESS_CODES.PLAYER_START_MISSING,
            `Missing player start marker: add one point object named "${contract.playerStartName}" on layer "${contract.playerLayerName}".`
        ));
        return;
    }

    if (startMarkers.length !== 1) {
        issues.push(createIssue(
            MAP_READINESS_SEVERITY.BLOCKING,
            MAP_READINESS_CODES.PLAYER_START_COUNT_INVALID,
            `Layer "${contract.playerLayerName}" must define exactly one "${contract.playerStartName}" point marker; found ${startMarkers.length}.`
        ));
    }

    const invalidMarker = startMarkers.find(object => object.point !== true);
    if (invalidMarker) {
        issues.push(createIssue(
            MAP_READINESS_SEVERITY.BLOCKING,
            MAP_READINESS_CODES.PLAYER_START_NOT_POINT,
            `Player start marker "${contract.playerStartName}" must be a point object.`
        ));
    }
}

function validateNpcObjects(map, contract, issues) {
    const npcLayer = getLayer(map, contract.npcLayerName);
    const npcObjects = Array.isArray(npcLayer?.objects) ? npcLayer.objects : [];
    const areaRects = npcObjects.filter(object => object.type === 'rect');
    const spawnPoints = npcObjects.filter(object => object.type === 'point');

    if (areaRects.length === 0) {
        issues.push(createIssue(
            MAP_READINESS_SEVERITY.BLOCKING,
            MAP_READINESS_CODES.NPC_AREA_RECT_MISSING,
            `Missing NPC area rectangle: add exactly one object with type "rect" on layer "${contract.npcLayerName}".`
        ));
    } else if (areaRects.length !== 1) {
        issues.push(createIssue(
            MAP_READINESS_SEVERITY.BLOCKING,
            MAP_READINESS_CODES.NPC_AREA_RECT_COUNT_INVALID,
            `Layer "${contract.npcLayerName}" must define exactly one NPC area rectangle; found ${areaRects.length}.`
        ));
    }

    if (spawnPoints.length === 0) {
        issues.push(createIssue(
            MAP_READINESS_SEVERITY.BLOCKING,
            MAP_READINESS_CODES.NPC_SPAWN_POINTS_MISSING,
            `Missing NPC spawn points: add one or more point objects on layer "${contract.npcLayerName}".`
        ));
        return;
    }

    const invalidSpawn = spawnPoints.find(object => object.point !== true);
    if (invalidSpawn) {
        issues.push(createIssue(
            MAP_READINESS_SEVERITY.BLOCKING,
            MAP_READINESS_CODES.NPC_SPAWN_POINT_INVALID,
            `NPC spawn objects on layer "${contract.npcLayerName}" must be point objects.`
        ));
    }
}

function validateTilesets(map, contract, issues) {
    const runtimeTileset = getTileset(map, contract.tilesetName);

    if (!runtimeTileset) {
        issues.push(createIssue(
            MAP_READINESS_SEVERITY.BLOCKING,
            MAP_READINESS_CODES.TILESET_MISSING,
            `Missing required tileset "${contract.tilesetName}"; MapManager calls addTilesetImage("${contract.tilesetName}") for runtime maps.`
        ));
    } else {
        if (runtimeTileset.source) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.TILESET_NOT_EMBEDDED,
                `Tileset "${contract.tilesetName}" references source "${runtimeTileset.source}"; embed tileset data in the map JSON before switching maps.`
            ));
        }

        if (runtimeTileset.image && runtimeTileset.image !== contract.tilesetImage) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.TILESET_IMAGE_MISMATCH,
                `Tileset "${contract.tilesetName}" must reference image "${contract.tilesetImage}", but it references "${runtimeTileset.image}".`
            ));
        }
    }

    for (const tileset of map.tilesets ?? []) {
        const tilesetLabel = getReferenceLabel(tileset, 'without a name');

        if (tileset.image && isExternalReference(tileset.image)) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.EXTERNAL_TILESET_IMAGE,
                `Tileset ${tilesetLabel} references external image "${tileset.image}"; bundle it under assets/ before switching maps.`
            ));
        }

        if (tileset.source && isExternalReference(tileset.source)) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.EXTERNAL_TILESET_SOURCE,
                `Tileset ${tilesetLabel} references external source "${tileset.source}"; embed tileset data in the map JSON before switching maps.`
            ));
        }
    }
}

function validateImageLayers(map, issues) {
    for (const layer of map.layers ?? []) {
        if (layer.type !== 'imagelayer') {
            continue;
        }

        issues.push(createIssue(
            MAP_READINESS_SEVERITY.INFO,
            MAP_READINESS_CODES.IMAGE_LAYER_PRESENT,
            `Image layer "${layer.name}" is present; MapManager currently renders tile layers, so confirm the draft does not rely on this image at runtime.`
        ));

        if (layer.image && isExternalReference(layer.image)) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.EXTERNAL_IMAGE_REFERENCE,
                `Image layer "${layer.name}" references external image "${layer.image}"; bundle it under assets/ or convert it to tile data before switching maps.`
            ));
        }
    }
}

function validateCollisionLayers(map, contract, issues) {
    const runtimeTileset = getTileset(map, contract.tilesetName);

    for (const layerName of contract.collisionLayers) {
        const layer = getLayer(map, layerName);

        if (!layer) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.COLLISION_LAYER_MISSING,
                `Missing collision layer "${layerName}"; collision bodies are built from layers: ${contract.collisionLayers.join(', ')}.`
            ));
            continue;
        }

        if (layer.type !== 'tilelayer') {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.COLLISION_LAYER_TYPE_INVALID,
                `Collision layer "${layerName}" must be a tilelayer, but it is ${layer.type}.`
            ));
            continue;
        }

        if (typeof getPropertyValue(layer, 'depth') !== 'number') {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.COLLISION_LAYER_DEPTH_MISSING,
                `Collision layer "${layerName}" is missing numeric depth metadata.`
            ));
        }

        const usedGlobalTileIds = (layer.data ?? []).filter(globalTileId => globalTileId > 0);

        if (usedGlobalTileIds.length === 0) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.COLLISION_LAYER_EMPTY,
                `Collision layer "${layerName}" has no runtime tiles to collide with.`
            ));
            continue;
        }

        if (!runtimeTileset) {
            continue;
        }

        const usedTileIds = new Set(
            usedGlobalTileIds
                .map(globalTileId => toLocalTileId(globalTileId, runtimeTileset))
                .filter(tileId => tileId !== undefined)
        );

        const missingCollisionTileIds = [];
        const invalidCollisionTileIds = [];

        for (const tileId of usedTileIds) {
            const collisionObjects = getEmbeddedTilesetCollisionObjects(runtimeTileset, tileId);

            if (collisionObjects.length === 0) {
                missingCollisionTileIds.push(tileId);
                continue;
            }

            const invalidCollisionObject = collisionObjects.find(object => !(object.width > 0 && object.height > 0));
            if (invalidCollisionObject) {
                invalidCollisionTileIds.push(tileId);
            }
        }

        if (missingCollisionTileIds.length > 0) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.COLLISION_TILE_METADATA_MISSING,
                `Collision layer "${layerName}" uses tiles without embedded collision objects: ${missingCollisionTileIds.join(', ')}.`
            ));
        }

        if (invalidCollisionTileIds.length > 0) {
            issues.push(createIssue(
                MAP_READINESS_SEVERITY.BLOCKING,
                MAP_READINESS_CODES.COLLISION_TILE_METADATA_INVALID,
                `Collision layer "${layerName}" uses tiles with invalid collision object dimensions: ${invalidCollisionTileIds.join(', ')}.`
            ));
        }
    }
}

function addDraftLayerNotes(map, contract, issues) {
    const runtimeLayerNames = new Set([
        ...contract.requiredLayers,
        ...contract.collisionLayers
    ]);

    for (const layer of map.layers ?? []) {
        if (runtimeLayerNames.has(layer.name)) {
            continue;
        }

        issues.push(createIssue(
            MAP_READINESS_SEVERITY.INFO,
            MAP_READINESS_CODES.DRAFT_LAYER_PRESENT,
            `Layer "${layer.name}" is not part of the current runtime layer contract; rename, map, or intentionally ignore it before switching maps.`
        ));
    }
}

function countUsedTiles(layer) {
    if (!Array.isArray(layer.data)) {
        return undefined;
    }

    return layer.data.filter(globalTileId => globalTileId > 0).length;
}

function getObjectTypeCounts(layer) {
    if (!Array.isArray(layer.objects)) {
        return [];
    }

    const typeCounts = new Map();

    for (const object of layer.objects) {
        const objectType = object.point === true
            ? 'point'
            : object.type || 'object';

        typeCounts.set(objectType, (typeCounts.get(objectType) ?? 0) + 1);
    }

    return Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count }));
}

function formatObjectTypeCounts(objectTypeCounts) {
    if (objectTypeCounts.length === 0) {
        return 'none';
    }

    return objectTypeCounts
        .map(({ type, count }) => `${count} ${type}`)
        .join(', ');
}

function formatReference(reference) {
    if (!reference) {
        return 'none';
    }

    return isExternalReference(reference) ? `${reference} (external)` : reference;
}

function describeLayerShape(layer) {
    const parts = [layer.type];

    if (layer.width !== undefined && layer.height !== undefined) {
        parts.push(`${layer.width}x${layer.height}`);
    }

    const usedTileCount = countUsedTiles(layer);
    if (usedTileCount !== undefined) {
        parts.push(`used tiles: ${usedTileCount}`);
    }

    if (Array.isArray(layer.objects)) {
        parts.push(`objects: ${layer.objects.length}`);
        parts.push(`object types: ${formatObjectTypeCounts(getObjectTypeCounts(layer))}`);
    }

    if (layer.image) {
        parts.push(`image: ${formatReference(layer.image)}`);
    }

    return parts.join(', ');
}

function findDraftLayerCandidate(map, runtimeLayerName, expectedType, draftLayerAliases) {
    const aliases = draftLayerAliases[runtimeLayerName] ?? [];

    return aliases
        .map(alias => getLayer(map, alias))
        .find(layer => layer && (!expectedType || layer.type === expectedType));
}

function createMatchedLayerHint(runtimeLayerName, expectedType, layer) {
    return {
        runtimeLayer: runtimeLayerName,
        expectedType,
        status: MAP_LAYER_MAPPING_STATUS.MATCHED,
        sourceLayer: layer.name,
        sourceLayerType: layer.type,
        typeMatches: !expectedType || layer.type === expectedType,
        summary: describeLayerShape(layer),
        message: `Matched runtime layer "${runtimeLayerName}" [${describeLayerShape(layer)}].`
    };
}

function formatExpectedLayerKind(expectedType) {
    if (expectedType === 'tilelayer') {
        return 'tile layer';
    }

    if (expectedType === 'objectgroup') {
        return 'object layer';
    }

    return `${expectedType} layer`;
}

function createCandidateLayerHint(runtimeLayerName, expectedType, layer) {
    return {
        runtimeLayer: runtimeLayerName,
        expectedType,
        status: MAP_LAYER_MAPPING_STATUS.CANDIDATE,
        sourceLayer: layer.name,
        sourceLayerType: layer.type,
        typeMatches: !expectedType || layer.type === expectedType,
        summary: describeLayerShape(layer),
        message: `Runtime layer "${runtimeLayerName}" is missing; candidate draft layer "${layer.name}" matches the expected ${formatExpectedLayerKind(expectedType)} shape [${describeLayerShape(layer)}]. Rename or copy it intentionally if this is the right role.`
    };
}

function getIndefiniteArticle(value) {
    return /^[aeiou]/i.test(value) ? 'an' : 'a';
}

function createMissingLayerHint(runtimeLayerName, expectedType) {
    return {
        runtimeLayer: runtimeLayerName,
        expectedType,
        status: MAP_LAYER_MAPPING_STATUS.MISSING,
        sourceLayer: undefined,
        sourceLayerType: undefined,
        typeMatches: false,
        summary: undefined,
        message: `Runtime layer "${runtimeLayerName}" is missing; create ${getIndefiniteArticle(formatExpectedLayerKind(expectedType))} ${formatExpectedLayerKind(expectedType)} named "${runtimeLayerName}".`
    };
}

const MAP_READINESS_ACTIONS = [
    {
        id: MAP_READINESS_ACTION_IDS.RUNTIME_LAYERS,
        title: 'Create runtime layer contract',
        codes: [
            MAP_READINESS_CODES.REQUIRED_LAYER_MISSING,
            MAP_READINESS_CODES.LAYER_TYPE_INVALID,
            MAP_READINESS_CODES.DRAFT_LAYER_PRESENT
        ],
        getDetail: contract => `Create or rename layers so the map has tile layers "floor", "tables", and "tabletops", object layers "player" and "npc_area", and an intentional decision for every draft-only layer. Required runtime layers: ${contract.requiredLayers.join(', ')}.`
    },
    {
        id: MAP_READINESS_ACTION_IDS.TILESET_BUNDLING,
        title: 'Bundle and embed the runtime tileset',
        codes: [
            MAP_READINESS_CODES.TILESET_MISSING,
            MAP_READINESS_CODES.TILESET_NOT_EMBEDDED,
            MAP_READINESS_CODES.TILESET_IMAGE_MISMATCH,
            MAP_READINESS_CODES.EXTERNAL_TILESET_IMAGE,
            MAP_READINESS_CODES.EXTERNAL_TILESET_SOURCE
        ],
        getDetail: contract => `Ensure the exported map embeds a tileset named "${contract.tilesetName}" that points to "${contract.tilesetImage}" under the served assets path.`
    },
    {
        id: MAP_READINESS_ACTION_IDS.PLAYER_START,
        title: 'Place the player start marker',
        codes: [
            MAP_READINESS_CODES.PLAYER_START_MISSING,
            MAP_READINESS_CODES.PLAYER_START_COUNT_INVALID,
            MAP_READINESS_CODES.PLAYER_START_NOT_POINT
        ],
        getDetail: contract => `Add exactly one point object named "${contract.playerStartName}" on the "${contract.playerLayerName}" object layer.`
    },
    {
        id: MAP_READINESS_ACTION_IDS.NPC_PLACEMENT,
        title: 'Author NPC placement objects',
        codes: [
            MAP_READINESS_CODES.NPC_AREA_RECT_MISSING,
            MAP_READINESS_CODES.NPC_AREA_RECT_COUNT_INVALID,
            MAP_READINESS_CODES.NPC_SPAWN_POINTS_MISSING,
            MAP_READINESS_CODES.NPC_SPAWN_POINT_INVALID
        ],
        getDetail: contract => `Add exactly one rectangle with type "rect" plus one or more point spawn markers on the "${contract.npcLayerName}" object layer.`
    },
    {
        id: MAP_READINESS_ACTION_IDS.COLLISION_AUTHORING,
        title: 'Author collision layers and tile metadata',
        codes: [
            MAP_READINESS_CODES.COLLISION_LAYER_MISSING,
            MAP_READINESS_CODES.COLLISION_LAYER_TYPE_INVALID,
            MAP_READINESS_CODES.COLLISION_LAYER_DEPTH_MISSING,
            MAP_READINESS_CODES.COLLISION_LAYER_EMPTY,
            MAP_READINESS_CODES.COLLISION_TILE_METADATA_MISSING,
            MAP_READINESS_CODES.COLLISION_TILE_METADATA_INVALID
        ],
        getDetail: contract => `Provide collision tile layers ${contract.collisionLayers.join(', ')} with numeric depth properties and embedded collision rectangles on every used collision tile.`
    },
    {
        id: MAP_READINESS_ACTION_IDS.IMAGE_LAYERS,
        title: 'Resolve image-layer dependencies',
        codes: [
            MAP_READINESS_CODES.IMAGE_LAYER_PRESENT,
            MAP_READINESS_CODES.EXTERNAL_IMAGE_REFERENCE
        ],
        getDetail: () => 'Convert any required floorplan image layer to tile data or bundle the image under assets/ and update runtime rendering intentionally.'
    }
];

export function getMapReadinessInventory(map) {
    return {
        dimensions: {
            width: map.width,
            height: map.height,
            tilewidth: map.tilewidth,
            tileheight: map.tileheight
        },
        layers: (map.layers ?? []).map(layer => ({
            name: layer.name,
            type: layer.type,
            width: layer.width,
            height: layer.height,
            usedTileCount: countUsedTiles(layer),
            objectCount: Array.isArray(layer.objects) ? layer.objects.length : undefined,
            objectTypeCounts: getObjectTypeCounts(layer),
            image: layer.image,
            imageIsExternal: Boolean(layer.image && isExternalReference(layer.image))
        })),
        tilesets: (map.tilesets ?? []).map(tileset => ({
            label: getTilesetLabel(tileset),
            name: tileset.name,
            firstgid: tileset.firstgid,
            image: tileset.image,
            imageIsExternal: Boolean(tileset.image && isExternalReference(tileset.image)),
            source: tileset.source,
            sourceIsExternal: Boolean(tileset.source && isExternalReference(tileset.source)),
            tilecount: tileset.tilecount,
            embeddedTileDefinitions: Array.isArray(tileset.tiles) ? tileset.tiles.length : 0
        }))
    };
}

export function getMapLayerMappingHints(map, contract = RUNTIME_MAP_CONTRACT) {
    const draftLayerAliases = contract.draftLayerAliases ?? DEFAULT_DRAFT_LAYER_ALIASES;

    return contract.requiredLayers.map(runtimeLayerName => {
        const expectedType = contract.expectedLayerTypes[runtimeLayerName];
        const exactLayer = getLayer(map, runtimeLayerName);

        if (exactLayer) {
            return createMatchedLayerHint(runtimeLayerName, expectedType, exactLayer);
        }

        const candidateLayer = findDraftLayerCandidate(
            map,
            runtimeLayerName,
            expectedType,
            draftLayerAliases
        );

        if (candidateLayer) {
            return createCandidateLayerHint(runtimeLayerName, expectedType, candidateLayer);
        }

        return createMissingLayerHint(runtimeLayerName, expectedType);
    });
}

export function getMapReadinessActionPlan(readinessInput, contract = RUNTIME_MAP_CONTRACT) {
    const issues = Array.isArray(readinessInput) ? readinessInput : readinessInput.issues;
    const issueCodes = new Set(issues.map(issue => issue.code));

    return MAP_READINESS_ACTIONS
        .filter(action => action.codes.some(code => issueCodes.has(code)))
        .map(action => ({
            id: action.id,
            title: action.title,
            detail: action.getDetail(contract),
            issueCodes: action.codes.filter(code => issueCodes.has(code))
        }));
}

export function getMapReadinessIssues(map, contract = RUNTIME_MAP_CONTRACT) {
    const issues = [];

    validateRequiredLayers(map, contract, issues);
    validatePlayerStart(map, contract, issues);
    validateNpcObjects(map, contract, issues);
    validateTilesets(map, contract, issues);
    validateImageLayers(map, issues);
    validateCollisionLayers(map, contract, issues);
    addDraftLayerNotes(map, contract, issues);

    return issues;
}

export function getMapReadinessReport(map, contract = RUNTIME_MAP_CONTRACT) {
    const issues = getMapReadinessIssues(map, contract);
    const blockingIssues = issues.filter(issue => issue.severity === MAP_READINESS_SEVERITY.BLOCKING);
    const infoIssues = issues.filter(issue => issue.severity === MAP_READINESS_SEVERITY.INFO);
    const issueSummary = {
        issues,
        blockingIssues,
        infoIssues
    };

    return {
        ready: blockingIssues.length === 0,
        issues,
        blockingIssues,
        infoIssues,
        inventory: getMapReadinessInventory(map),
        layerMappingHints: getMapLayerMappingHints(map, contract),
        actionPlan: getMapReadinessActionPlan(issueSummary, contract)
    };
}

function formatLayerInventory(layer) {
    const parts = [layer.type];

    if (layer.width !== undefined && layer.height !== undefined) {
        parts.push(`${layer.width}x${layer.height}`);
    }

    if (layer.usedTileCount !== undefined) {
        parts.push(`used tiles: ${layer.usedTileCount}`);
    }

    if (layer.objectCount !== undefined) {
        parts.push(`objects: ${layer.objectCount}`);
        parts.push(`object types: ${formatObjectTypeCounts(layer.objectTypeCounts)}`);
    }

    if (layer.image) {
        parts.push(`image: ${formatReference(layer.image)}`);
    }

    return `- ${layer.name} [${parts.join(', ')}]`;
}

function formatTilesetInventory(tileset) {
    const parts = [];

    if (tileset.image) {
        parts.push(`image: ${formatReference(tileset.image)}`);
    }

    if (tileset.source) {
        parts.push(`source: ${formatReference(tileset.source)}`);
    }

    if (tileset.tilecount !== undefined) {
        parts.push(`tilecount: ${tileset.tilecount}`);
    }

    parts.push(`embedded tile definitions: ${tileset.embeddedTileDefinitions}`);

    return `- ${tileset.label} [${parts.join(', ')}]`;
}

function formatInventory(inventory) {
    const lines = [
        'Map inventory:',
        `- Size: ${inventory.dimensions.width}x${inventory.dimensions.height} tiles; tile size: ${inventory.dimensions.tilewidth}x${inventory.dimensions.tileheight}px`,
        `- Layers: ${inventory.layers.length}`
    ];

    for (const layer of inventory.layers) {
        lines.push(formatLayerInventory(layer));
    }

    lines.push(`- Tilesets: ${inventory.tilesets.length}`);
    for (const tileset of inventory.tilesets) {
        lines.push(formatTilesetInventory(tileset));
    }

    return lines;
}

function formatActionPlan(actionPlan) {
    const lines = [`Next actions: ${actionPlan.length}`];

    if (actionPlan.length === 0) {
        lines.push('- No readiness actions required for the current runtime contract.');
        return lines;
    }

    actionPlan.forEach((action, index) => {
        lines.push(`${index + 1}. ${action.title}: ${action.detail}`);
        lines.push(`   Related issues: ${action.issueCodes.join(', ')}`);
    });

    return lines;
}

function formatLayerMappingHints(layerMappingHints) {
    const lines = [`Layer mapping hints: ${layerMappingHints.length}`];

    for (const hint of layerMappingHints) {
        lines.push(`- ${hint.runtimeLayer}: ${hint.message}`);
    }

    return lines;
}

export function formatMapReadinessReport(mapPath, report) {
    const lines = [
        `Map readiness report: ${mapPath}`,
        `Status: ${report.ready ? 'ready' : 'not runtime-ready'}`,
        ...formatInventory(report.inventory),
        ...formatLayerMappingHints(report.layerMappingHints),
        `Blocking issues: ${report.blockingIssues.length}`
    ];

    for (const issue of report.blockingIssues) {
        lines.push(`- [${issue.code}] ${issue.message}`);
    }

    lines.push(`Informational notes: ${report.infoIssues.length}`);
    for (const issue of report.infoIssues) {
        lines.push(`- [${issue.code}] ${issue.message}`);
    }

    lines.push(...formatActionPlan(report.actionPlan));

    return lines.join('\n');
}