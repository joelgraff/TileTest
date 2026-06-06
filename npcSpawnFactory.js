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
    setNPCCollisionBox,
    groupFactory = () => scene.add.group(),
    spriteFactory = (x, y, spriteKey, frame) => scene.physics.add.sprite(x, y, spriteKey, frame)
} = {}) {
    const npcGroup = groupFactory();

    spawnPoints.forEach(point => {
        const pointAreaRect = point.npcAreaRect ?? npcAreaRect ?? null;
        const direction = point.resolvedFacing
            ?? point.facing
            ?? (pointAreaRect ? getNearestEdgeDirection(point, pointAreaRect) : 'down');
        const frame = getFrameForDirection(direction);
        const spriteKey = getRandomSpriteKey();
        const npc = spriteFactory(point.x, point.y, spriteKey, frame);

        setNPCCollisionBox?.(npc, point);
        npcGroup.add(npc);
        setNPCDepth(npc, pointAreaRect, tablesLayerDepth);
    });

    return npcGroup;
}