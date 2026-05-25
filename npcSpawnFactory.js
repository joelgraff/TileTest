export function resolveNPCTablesLayerDepth(scene) {
    const tablesLayer = scene.mapLayers?.tables;

    if (tablesLayer && typeof tablesLayer.depth === 'number') {
        return tablesLayer.depth;
    }

    return Math.floor(scene.map.heightInPixels);
}

export function createNPCGroup(scene, spawnPoints, npcAreaRect, tablesLayerDepth, {
    getNearestEdgeDirection,
    getFrameForDirection,
    getRandomSpriteKey,
    setNPCDepth,
    groupFactory = () => scene.add.group(),
    spriteFactory = (x, y, spriteKey, frame) => scene.add.sprite(x, y, spriteKey, frame)
} = {}) {
    const npcGroup = groupFactory();

    spawnPoints.forEach(point => {
        const direction = getNearestEdgeDirection(point, npcAreaRect);
        const frame = getFrameForDirection(direction);
        const spriteKey = getRandomSpriteKey();
        const npc = spriteFactory(point.x, point.y, spriteKey, frame);

        npcGroup.add(npc);
        setNPCDepth(npc, npcAreaRect, tablesLayerDepth);
    });

    return npcGroup;
}