/**
 * MapDuplicationModule.js
 * A modular system for duplicating map elements within existing boundaries.
 * Creates multiple identical booth sections for enhanced testing capabilities.
 */

class MapDuplicationModule {
    constructor() {
        this.config = {
            enabled: false, // Master toggle for duplication
            sectionsX: 3,   // Number of horizontal sections
            sectionsY: 3,   // Number of vertical sections
            spacingX: 480,  // Horizontal spacing in pixels (reduced for closer booths)
            spacingY: 320   // Vertical spacing in pixels (reduced for closer booths)
        };
    }

    /**
     * Enable or disable map duplication
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
    }

    /**
     * Check if duplication is enabled
     */
    isEnabled() {
        return this.config.enabled;
    }

    /**
     * Main function to duplicate map data
     * @param {Object} originalMapData - The original Tiled map JSON
     * @param {boolean} enabled - Whether duplication is enabled
     * @returns {Object} - Modified map data with duplicated elements
     */
    duplicateMapData(originalMapData, enabled = false) {
        if (!enabled) {
            return originalMapData;
        }

        console.log('MapDuplicationModule: Duplicating map elements...');

    // Create a deep copy of the map data
    const duplicatedMap = JSON.parse(JSON.stringify(originalMapData));

    // Capture original layer datas and dimensions BEFORE we resize them
    const originalFloorLayer = duplicatedMap.layers.find(layer => layer.name === 'floor');
    const originalTablesLayer = duplicatedMap.layers.find(layer => layer.name === 'tables');
    const originalTabletopsLayer = duplicatedMap.layers.find(layer => layer.name === 'tabletops');

    const origFloorData = originalFloorLayer ? [...originalFloorLayer.data] : null;
    const origFloorWidth = originalFloorLayer ? originalFloorLayer.width : duplicatedMap.width;
    const origFloorHeight = originalFloorLayer ? originalFloorLayer.height : duplicatedMap.height;

    const origTablesData = originalTablesLayer ? [...originalTablesLayer.data] : null;
    const origTablesWidth = originalTablesLayer ? originalTablesLayer.width : duplicatedMap.width;
    const origTablesHeight = originalTablesLayer ? originalTablesLayer.height : duplicatedMap.height;

    const origTabletopsData = originalTabletopsLayer ? [...originalTabletopsLayer.data] : null;
    const origTabletopsWidth = originalTabletopsLayer ? originalTabletopsLayer.width : duplicatedMap.width;
    const origTabletopsHeight = originalTabletopsLayer ? originalTabletopsLayer.height : duplicatedMap.height;

        // Calculate new map dimensions to fit all sections
        const tilesPerScreenX = Math.floor(this.config.spacingX / 32); // 960/32 = 30
        const tilesPerScreenY = Math.floor(this.config.spacingY / 32); // 640/32 = 20
        const newWidth = this.config.sectionsX * tilesPerScreenX; // 3 * 30 = 90
        const newHeight = this.config.sectionsY * tilesPerScreenY; // 3 * 20 = 60

        duplicatedMap.width = newWidth;
        duplicatedMap.height = newHeight;

        console.log(`MapDuplicationModule: Resizing map from 30x20 to ${newWidth}x${newHeight} tiles (${tilesPerScreenX}x${tilesPerScreenY} per screen)`);

        // Resize all tile layers
        this.resizeTileLayers(duplicatedMap, newWidth, newHeight);

    // Duplicate layers and objects using originals captured earlier
    this.duplicateFloorLayer(duplicatedMap, origFloorData, origFloorWidth, origFloorHeight);
    this.duplicateTablesLayer(duplicatedMap, origTablesData, origTablesWidth, origTablesHeight);
    this.duplicateTabletopsLayer(duplicatedMap, origTabletopsData, origTabletopsWidth, origTabletopsHeight);
    this.duplicateNpcAreaObjects(duplicatedMap);

        console.log('MapDuplicationModule: Duplication complete');
        return duplicatedMap;
    }

    /**
     * Resize all tile layers to accommodate duplicated sections
     */
    resizeTileLayers(mapData, newWidth, newHeight) {
        mapData.layers.forEach(layer => {
            if (layer.type === 'tilelayer' && layer.data) {
                // Resize the data array
                const newData = new Array(newWidth * newHeight).fill(0);

                // Copy existing data
                const oldWidth = layer.width;
                const oldHeight = layer.height;
                for (let y = 0; y < oldHeight; y++) {
                    for (let x = 0; x < oldWidth; x++) {
                        const oldIndex = y * oldWidth + x;
                        const newIndex = y * newWidth + x;
                        if (newIndex < newData.length) {
                            newData[newIndex] = layer.data[oldIndex];
                        }
                    }
                }

                layer.data = newData;
                layer.width = newWidth;
                layer.height = newHeight;
            }
        });
    }

    /**
     * Duplicate the floor tile layer across the map
     */
    duplicateFloorLayer(mapData, originalData, origWidth, origHeight) {
        const floorLayer = mapData.layers.find(layer => layer.name === 'floor');
        if (!floorLayer) {
            console.warn('MapDuplicationModule: No floor layer found');
            return;
        }

        // If originals weren't provided, fall back to current layer data
        const sourceData = originalData ? originalData : [...floorLayer.data];
        const sourceWidth = origWidth ? origWidth : floorLayer.width;
        const sourceHeight = origHeight ? origHeight : floorLayer.height;

        const targetWidth = floorLayer.width;
        const targetHeight = floorLayer.height;

        console.log(`MapDuplicationModule: Duplicating floor layer (source ${sourceWidth}x${sourceHeight}, target ${targetWidth}x${targetHeight})`);

        // Clear the layer data to rebuild it
        floorLayer.data = new Array(targetWidth * targetHeight).fill(0);

        // Place original pattern plus duplicates across the grid
        for (let sectionY = 0; sectionY < this.config.sectionsY; sectionY++) {
            for (let sectionX = 0; sectionX < this.config.sectionsX; sectionX++) {
                this.placeFloorSection(
                    floorLayer.data,
                    sourceData,
                    sourceWidth,
                    sourceHeight,
                    targetWidth,
                    targetHeight,
                    sectionX,
                    sectionY
                );
            }
        }

        console.log(`MapDuplicationModule: Floor layer duplication complete, ${floorLayer.data.filter(id => id !== 0).length} non-zero tiles placed`);
    }

    /**
     * Place a single floor section at the specified grid position
     */
    placeFloorSection(layerData, originalData, sourceWidth, sourceHeight, targetWidth, targetHeight, sectionX, sectionY) {
        const tilesPerScreenX = Math.floor(this.config.spacingX / 32);
        const tilesPerScreenY = Math.floor(this.config.spacingY / 32);
        const offsetX = sectionX * tilesPerScreenX;
        const offsetY = sectionY * tilesPerScreenY;

        console.log(`MapDuplicationModule: Placing floor section ${sectionX},${sectionY} at tile offset (${offsetX}, ${offsetY})`);

        // Only place tiles that are within bounds using source dimensions for reads
        for (let y = 0; y < sourceHeight; y++) {
            for (let x = 0; x < sourceWidth; x++) {
                const tileId = originalData[y * sourceWidth + x];
                if (tileId !== 0) { // Only place non-empty tiles
                    const newX = x + offsetX;
                    const newY = y + offsetY;

                    // Check bounds against target dimensions
                    if (newX >= 0 && newX < targetWidth && newY >= 0 && newY < targetHeight) {
                        const index = newY * targetWidth + newX;
                        if (index >= 0 && index < layerData.length) {
                            layerData[index] = tileId;
                        }
                    }
                }
            }
        }
    }

    /**
     * Duplicate the tables tile layer across the map
     */
    duplicateTablesLayer(mapData, originalData, origWidth, origHeight) {
        const tablesLayer = mapData.layers.find(layer => layer.name === 'tables');
        if (!tablesLayer) {
            console.warn('MapDuplicationModule: No tables layer found');
            return;
        }

        const sourceData = originalData ? originalData : [...tablesLayer.data];
        const sourceWidth = origWidth ? origWidth : tablesLayer.width;
        const sourceHeight = origHeight ? origHeight : tablesLayer.height;

        const targetWidth = tablesLayer.width;
        const targetHeight = tablesLayer.height;

        console.log(`MapDuplicationModule: Duplicating tables layer (source ${sourceWidth}x${sourceHeight}, target ${targetWidth}x${targetHeight})`);

        // Clear the layer data to rebuild it
        tablesLayer.data = new Array(targetWidth * targetHeight).fill(0);

        // Place original pattern plus duplicates across the grid
        for (let sectionY = 0; sectionY < this.config.sectionsY; sectionY++) {
            for (let sectionX = 0; sectionX < this.config.sectionsX; sectionX++) {
                this.placeTablesSection(
                    tablesLayer.data,
                    sourceData,
                    sourceWidth,
                    sourceHeight,
                    targetWidth,
                    targetHeight,
                    sectionX,
                    sectionY
                );
            }
        }

        console.log(`MapDuplicationModule: Tables layer duplication complete, ${tablesLayer.data.filter(id => id !== 0).length} non-zero tiles placed`);
    }

    /**
     * Place a single tables section at the specified grid position
     */
    placeTablesSection(layerData, originalData, sourceWidth, sourceHeight, targetWidth, targetHeight, sectionX, sectionY) {
        const tilesPerScreenX = Math.floor(this.config.spacingX / 32);
        const tilesPerScreenY = Math.floor(this.config.spacingY / 32);
        const offsetX = sectionX * tilesPerScreenX;
        const offsetY = sectionY * tilesPerScreenY;

        console.log(`MapDuplicationModule: Placing tables section ${sectionX},${sectionY} at tile offset (${offsetX}, ${offsetY})`);

        for (let y = 0; y < sourceHeight; y++) {
            for (let x = 0; x < sourceWidth; x++) {
                const tileId = originalData[y * sourceWidth + x];
                if (tileId !== 0) {
                    const newX = x + offsetX;
                    const newY = y + offsetY;

                    if (newX >= 0 && newX < targetWidth && newY >= 0 && newY < targetHeight) {
                        const index = newY * targetWidth + newX;
                        if (index >= 0 && index < layerData.length) {
                            layerData[index] = tileId;
                        }
                    }
                }
            }
        }
    }

    /**
     * Duplicate the tabletops tile layer across the map
     */
    duplicateTabletopsLayer(mapData, originalData, origWidth, origHeight) {
        const tabletopsLayer = mapData.layers.find(layer => layer.name === 'tabletops');
        if (!tabletopsLayer) {
            console.warn('MapDuplicationModule: No tabletops layer found');
            return;
        }

        const sourceData = originalData ? originalData : [...tabletopsLayer.data];
        const sourceWidth = origWidth ? origWidth : tabletopsLayer.width;
        const sourceHeight = origHeight ? origHeight : tabletopsLayer.height;

        const targetWidth = tabletopsLayer.width;
        const targetHeight = tabletopsLayer.height;

        console.log(`MapDuplicationModule: Duplicating tabletops layer (source ${sourceWidth}x${sourceHeight}, target ${targetWidth}x${targetHeight})`);

        // Clear the layer data to rebuild it
        tabletopsLayer.data = new Array(targetWidth * targetHeight).fill(0);

        // Place original pattern plus duplicates across the grid
        for (let sectionY = 0; sectionY < this.config.sectionsY; sectionY++) {
            for (let sectionX = 0; sectionX < this.config.sectionsX; sectionX++) {
                this.placeTabletopsSection(
                    tabletopsLayer.data,
                    sourceData,
                    sourceWidth,
                    sourceHeight,
                    targetWidth,
                    targetHeight,
                    sectionX,
                    sectionY
                );
            }
        }

        console.log(`MapDuplicationModule: Tabletops layer duplication complete, ${tabletopsLayer.data.filter(id => id !== 0).length} non-zero tiles placed`);
    }

    /**
     * Place a single tabletops section at the specified grid position
     */
    placeTabletopsSection(layerData, originalData, sourceWidth, sourceHeight, targetWidth, targetHeight, sectionX, sectionY) {
        const tilesPerScreenX = Math.floor(this.config.spacingX / 32);
        const tilesPerScreenY = Math.floor(this.config.spacingY / 32);
        const offsetX = sectionX * tilesPerScreenX;
        const offsetY = sectionY * tilesPerScreenY;

        console.log(`MapDuplicationModule: Placing tabletops section ${sectionX},${sectionY} at tile offset (${offsetX}, ${offsetY})`);

        for (let y = 0; y < sourceHeight; y++) {
            for (let x = 0; x < sourceWidth; x++) {
                const tileId = originalData[y * sourceWidth + x];
                if (tileId !== 0) {
                    const newX = x + offsetX;
                    const newY = y + offsetY;

                    if (newX >= 0 && newX < targetWidth && newY >= 0 && newY < targetHeight) {
                        const index = newY * targetWidth + newX;
                        if (index >= 0 && index < layerData.length) {
                            layerData[index] = tileId;
                        }
                    }
                }
            }
        }
    }

    /**
     * Duplicate the npc_area object layer
     */
    duplicateNpcAreaObjects(mapData) {
        const npcAreaLayer = mapData.layers.find(layer => layer.name === 'npc_area');
        if (!npcAreaLayer) {
            console.warn('MapDuplicationModule: No npc_area layer found');
            return;
        }

        const originalObjects = [...npcAreaLayer.objects];
        const newObjects = [];

        let nextObjectId = mapData.nextobjectid;

        // Keep the original rect object (don't duplicate it)
        const rectObject = originalObjects.find(obj => obj.type === 'rect');
        if (rectObject) {
            newObjects.push(rectObject);
        }

        // Keep the original point objects
        const pointObjects = originalObjects.filter(obj => obj.type === 'point');
        pointObjects.forEach(originalObj => {
            newObjects.push(originalObj);
        });

        // Duplicate additional point objects across the other 8 sections
        for (let sectionY = 0; sectionY < this.config.sectionsY; sectionY++) {
            for (let sectionX = 0; sectionX < this.config.sectionsX; sectionX++) {
                // Skip the original section (0,0) since points are already there
                if (sectionX === 0 && sectionY === 0) continue;

                const offsetX = sectionX * this.config.spacingX;
                const offsetY = sectionY * this.config.spacingY;

                // Duplicate each point object with offset coordinates
                pointObjects.forEach(originalObj => {
                    const duplicatedObj = this.duplicateObject(originalObj, offsetX, offsetY, nextObjectId);
                    newObjects.push(duplicatedObj);
                    nextObjectId++;
                });
            }
        }

        // Replace the objects array
        npcAreaLayer.objects = newObjects;
        mapData.nextobjectid = nextObjectId;
    }

    /**
     * Create a duplicate of an object with coordinate offsets
     */
    duplicateObject(originalObj, offsetX, offsetY, newId) {
        const duplicated = JSON.parse(JSON.stringify(originalObj));

        // Update ID
        duplicated.id = newId;

        // Apply coordinate offsets
        if (duplicated.x !== undefined) duplicated.x += offsetX;
        if (duplicated.y !== undefined) duplicated.y += offsetY;

        // Handle rectangle objects (they have width/height)
        if (duplicated.width !== undefined && duplicated.height !== undefined) {
            // Rectangle objects are fine as-is with just position offset
        }

        return duplicated;
    }
}

// Export singleton instance
const mapDuplicationModule = new MapDuplicationModule();
export default mapDuplicationModule;