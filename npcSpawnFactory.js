export function resolveNPCTablesLayerDepth(scene) {
    if (scene.tablesLayer && typeof scene.tablesLayer.depth === 'number') {
        return scene.tablesLayer.depth;
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