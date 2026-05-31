import {
    RUNTIME_MAP_CONTRACT,
    getMapReadinessReport
} from './mapReadiness.js';

export const MAP_CONVERSION_PREVIEW_STATUS = {
    CREATED: 'created',
    COPIED: 'copied',
    MATCHED: 'matched'
};

export const DEFAULT_DRAFT_TO_RUNTIME_LAYER_MAP = {
    floor: 'Tile Layer 1',
    tables: 'furniture',
    npc_area: 'zones'
};

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function getLayer(map, layerName) {
    return (map.layers ?? []).find(layer => layer.name === layerName);
}

function getUsedTileCount(layer) {
    if (!Array.isArray(layer.data)) {
        return undefined;
    }

    return layer.data.filter(tileId => tileId > 0).length;
}

function getLayerKind(expectedType) {
    if (expectedType === 'tilelayer') {
        return 'tile layer';
    }

    if (expectedType === 'objectgroup') {
        return 'object layer';
    }

    if (expectedType === 'imagelayer') {
        return 'image layer';
    }

    return `${expectedType} layer`;
}

function describeLayer(layer) {
    const parts = [getLayerKind(layer.type)];

    if (layer.width !== undefined && layer.height !== undefined) {
        parts.push(`${layer.width}x${layer.height}`);
    }

    const usedTileCount = getUsedTileCount(layer);
    if (usedTileCount !== undefined) {
        parts.push(`used tiles: ${usedTileCount}`);
    }

    if (Array.isArray(layer.objects)) {
        parts.push(`objects: ${layer.objects.length}`);
    }

    if (layer.image) {
        parts.push(`image: ${layer.image}`);
    }

    return parts.join(', ');
}

function getNextLayerIdAllocator(map) {
    const layerIds = (map.layers ?? [])
        .map(layer => layer.id)
        .filter(layerId => Number.isInteger(layerId));
    const maxLayerId = layerIds.length > 0 ? Math.max(...layerIds) : 0;
    let nextLayerId = Math.max(map.nextlayerid ?? 1, maxLayerId + 1);

    return {
        allocate() {
            const layerId = nextLayerId;
            nextLayerId += 1;
            return layerId;
        },
        current() {
            return nextLayerId;
        }
    };
}

function cloneLayerAsRuntimeLayer(sourceLayer, runtimeLayerName) {
    const layer = cloneJson(sourceLayer);
    layer.name = runtimeLayerName;

    return layer;
}

function createEmptyRuntimeLayer(map, runtimeLayerName, expectedType, layerId) {
    const baseLayer = {
        id: layerId,
        name: runtimeLayerName,
        opacity: 1,
        type: expectedType,
        visible: true,
        x: 0,
        y: 0
    };

    if (expectedType === 'tilelayer') {
        return {
            ...baseLayer,
            class: 'tileLayer',
            data: Array((map.width ?? 0) * (map.height ?? 0)).fill(0),
            height: map.height,
            width: map.width
        };
    }

    if (expectedType === 'objectgroup') {
        return {
            ...baseLayer,
            draworder: 'topdown',
            objects: []
        };
    }

    return baseLayer;
}

function createStep({ runtimeLayerName, expectedType, status, sourceLayer, previewLayer }) {
    const sourceText = sourceLayer ? ` from "${sourceLayer.name}"` : '';
    const actionText = status === MAP_CONVERSION_PREVIEW_STATUS.CREATED
        ? `created empty ${getLayerKind(expectedType)}`
        : `${status} ${getLayerKind(expectedType)}${sourceText}`;

    return {
        runtimeLayer: runtimeLayerName,
        expectedType,
        status,
        sourceLayer: sourceLayer?.name,
        previewLayer: previewLayer.name,
        summary: describeLayer(previewLayer),
        message: `${runtimeLayerName}: ${actionText} as "${previewLayer.name}" [${describeLayer(previewLayer)}].`
    };
}

export function createMapLayerConversionPreview(draftMap, {
    contract = RUNTIME_MAP_CONTRACT,
    layerMap = DEFAULT_DRAFT_TO_RUNTIME_LAYER_MAP
} = {}) {
    const layerIdAllocator = getNextLayerIdAllocator(draftMap);
    const usedSourceLayers = new Set();
    const steps = [];

    const runtimeLayers = contract.requiredLayers.map(runtimeLayerName => {
        const expectedType = contract.expectedLayerTypes[runtimeLayerName];
        const exactLayer = getLayer(draftMap, runtimeLayerName);
        const mappedSourceLayer = getLayer(draftMap, layerMap[runtimeLayerName]);
        const sourceLayer = exactLayer?.type === expectedType
            ? exactLayer
            : mappedSourceLayer?.type === expectedType
                ? mappedSourceLayer
                : undefined;

        if (sourceLayer) {
            usedSourceLayers.add(sourceLayer.name);
            const status = sourceLayer.name === runtimeLayerName
                ? MAP_CONVERSION_PREVIEW_STATUS.MATCHED
                : MAP_CONVERSION_PREVIEW_STATUS.COPIED;
            const previewLayer = cloneLayerAsRuntimeLayer(sourceLayer, runtimeLayerName);

            steps.push(createStep({
                runtimeLayerName,
                expectedType,
                status,
                sourceLayer,
                previewLayer
            }));

            return previewLayer;
        }

        const previewLayer = createEmptyRuntimeLayer(
            draftMap,
            runtimeLayerName,
            expectedType,
            layerIdAllocator.allocate()
        );

        steps.push(createStep({
            runtimeLayerName,
            expectedType,
            status: MAP_CONVERSION_PREVIEW_STATUS.CREATED,
            sourceLayer: undefined,
            previewLayer
        }));

        return previewLayer;
    });

    const previewMap = {
        ...cloneJson(draftMap),
        layers: runtimeLayers,
        nextlayerid: Math.max(
            layerIdAllocator.current(),
            ...runtimeLayers.map(layer => layer.id ?? 0).map(layerId => layerId + 1)
        )
    };
    const droppedLayers = (draftMap.layers ?? [])
        .filter(layer => !usedSourceLayers.has(layer.name))
        .map(layer => ({
            name: layer.name,
            type: layer.type,
            summary: describeLayer(layer)
        }));

    return {
        previewMap,
        steps,
        droppedLayers
    };
}

export function createMapLayerConversionPreviewReport(draftMap, options = {}) {
    const preview = createMapLayerConversionPreview(draftMap, options);

    return {
        ...preview,
        readinessReport: getMapReadinessReport(preview.previewMap, options.contract)
    };
}

export function formatMapLayerConversionPreviewReport(mapPath, previewReport) {
    const lines = [
        `Map layer conversion preview: ${mapPath}`,
        'Mode: in-memory only; no map files were changed.',
        `Preview layers: ${previewReport.previewMap.layers.map(layer => layer.name).join(', ')}`,
        'Layer conversion steps:'
    ];

    for (const step of previewReport.steps) {
        lines.push(`- ${step.message}`);
    }

    lines.push(`Dropped draft layers: ${previewReport.droppedLayers.length}`);
    for (const layer of previewReport.droppedLayers) {
        lines.push(`- ${layer.name} [${layer.summary}]`);
    }

    lines.push(`Preview readiness status: ${previewReport.readinessReport.ready ? 'ready' : 'not runtime-ready'}`);
    lines.push(`Remaining blocking issues: ${previewReport.readinessReport.blockingIssues.length}`);
    for (const issue of previewReport.readinessReport.blockingIssues) {
        lines.push(`- [${issue.code}] ${issue.message}`);
    }

    lines.push(`Remaining next actions: ${previewReport.readinessReport.actionPlan.length}`);
    for (const action of previewReport.readinessReport.actionPlan) {
        lines.push(`- ${action.title}: ${action.detail}`);
    }

    return lines.join('\n');
}