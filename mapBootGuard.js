import CONFIG from './config.js';
import { getMapReadinessReport } from './mapReadiness.js';

const MAX_VISIBLE_ISSUES = 3;

export function getCachedTilemapData(scene, mapKey = CONFIG.ASSETS.MAP) {
    const tilemapEntry = scene.cache?.tilemap?.get?.(mapKey);

    if (tilemapEntry?.data) {
        return tilemapEntry.data;
    }

    if (tilemapEntry?.layers || tilemapEntry?.tilesets) {
        return tilemapEntry;
    }

    return scene.cache?.json?.get?.(mapKey) ?? null;
}

export function validateLoadedMapBootContract(scene, {
    mapKey = CONFIG.ASSETS.MAP,
    documentRef = globalThis.document
} = {}) {
    return validateMapBootContract(scene, getCachedTilemapData(scene, mapKey), {
        mapName: mapKey,
        documentRef
    });
}

export function validateMapBootContract(scene, mapData, {
    mapName = CONFIG.ASSETS.MAP,
    documentRef = globalThis.document
} = {}) {
    if (!mapData) {
        const message = `Map boot failed: "${mapName}" was not found in the loaded tilemap cache.`;

        return recordMapBootFailure(scene, message, [], { documentRef });
    }

    const report = getMapReadinessReport(mapData);
    if (report.ready) {
        return {
            success: true,
            message: `Map boot contract passed for "${mapName}".`,
            blockingIssues: []
        };
    }

    const message = createMapBootFailureMessage(mapName, report.blockingIssues);

    return recordMapBootFailure(scene, message, report.blockingIssues, { documentRef });
}

export function createMapBootFailureMessage(mapName, blockingIssues) {
    const visibleIssues = blockingIssues.slice(0, MAX_VISIBLE_ISSUES);
    const lines = [
        `Map boot failed: "${mapName}" does not satisfy the runtime map contract.`,
        ...visibleIssues.map(issue => `- ${issue.message}`)
    ];
    const hiddenIssueCount = blockingIssues.length - visibleIssues.length;

    if (hiddenIssueCount > 0) {
        lines.push(`- ${hiddenIssueCount} more issue${hiddenIssueCount === 1 ? '' : 's'} hidden; run node tests/content/reportFullMapReadiness.js ${mapName} for the full report.`);
    }

    return lines.join('\n');
}

export function recordMapBootFailure(scene, message, blockingIssues = [], {
    documentRef = globalThis.document
} = {}) {
    const failure = {
        message,
        blockingIssues: blockingIssues.map(issue => ({
            code: issue.code,
            message: issue.message
        }))
    };

    if (scene) {
        scene.mapBootFailure = failure;
    }

    console.error(message);
    renderMapBootFailure(scene, message, { documentRef });

    return {
        success: false,
        message,
        blockingIssues
    };
}

export function renderMapBootFailure(scene, message, {
    documentRef = globalThis.document
} = {}) {
    const domSurface = renderMapBootFailureDom(message, { documentRef });
    const textSurface = renderMapBootFailureSceneText(scene, message);

    if (scene?.mapBootFailure) {
        scene.mapBootFailure.domSurface = domSurface;
        scene.mapBootFailure.textSurface = textSurface;
    }

    return domSurface ?? textSurface ?? null;
}

function renderMapBootFailureDom(message, { documentRef = globalThis.document } = {}) {
    const overlayRoot = documentRef?.getElementById?.('ui-overlay-root') ?? documentRef?.body;

    if (!overlayRoot || typeof documentRef.createElement !== 'function') {
        return null;
    }

    const surface = documentRef.createElement('div');
    surface.className = 'map-boot-failure';
    surface.setAttribute('role', 'alert');
    surface.setAttribute('aria-live', 'assertive');
    surface.textContent = message;

    if (surface.style) {
        surface.style.position = 'absolute';
        surface.style.inset = '0';
        surface.style.zIndex = '1000';
        surface.style.boxSizing = 'border-box';
        surface.style.padding = '24px';
        surface.style.background = 'rgba(20, 20, 20, 0.94)';
        surface.style.color = '#f4f4f4';
        surface.style.fontFamily = 'monospace';
        surface.style.fontSize = '14px';
        surface.style.lineHeight = '1.5';
        surface.style.whiteSpace = 'pre-wrap';
        surface.style.overflow = 'auto';
    }

    overlayRoot.append(surface);

    return surface;
}

function renderMapBootFailureSceneText(scene, message) {
    if (typeof scene?.add?.text !== 'function') {
        return null;
    }

    const textSurface = scene.add.text(16, 16, message, {
        backgroundColor: '#141414',
        color: '#f4f4f4',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: { x: 12, y: 10 },
        wordWrap: { width: 680 }
    });

    textSurface.setScrollFactor?.(0);
    textSurface.setDepth?.(Number.MAX_SAFE_INTEGER);

    return textSurface;
}