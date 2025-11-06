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
            spacingX: 960,  // Horizontal spacing in pixels (section width to avoid overlap)
            spacingY: 640   // Vertical spacing in pixels (section height to avoid overlap)
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

        // Calculate new map dimensions to fit all sections
        const newWidth = Math.floor((this.config.sectionsX * this.config.spacingX) / 32) + 30; // Add original width
        const newHeight = Math.floor((this.config.sectionsY * this.config.spacingY) / 32) + 20; // Add original height

        duplicatedMap.width = newWidth;
        duplicatedMap.height = newHeight;

        console.log(`MapDuplicationModule: Resizing map from 30x20 to ${newWidth}x${newHeight} tiles`);

        // Resize all tile layers
        this.resizeTileLayers(duplicatedMap, newWidth, newHeight);

        // Duplicate layers and objects
        this.duplicateFloorLayer(duplicatedMap);
        this.duplicateTablesLayer(duplicatedMap);
        this.duplicateTabletopsLayer(duplicatedMap);
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
    duplicateFloorLayer(mapData) {
        const floorLayer = mapData.layers.find(layer => layer.name === 'floor');
        if (!floorLayer) {
            console.warn('MapDuplicationModule: No floor layer found');
            return;
        }

        const originalData = [...floorLayer.data];
        const width = floorLayer.width;
        const height = floorLayer.height;

        // Clear the layer data to rebuild it
        floorLayer.data = new Array(width * height).fill(0);

        // Place original pattern plus 8 duplicates
        for (let sectionY = 0; sectionY < this.config.sectionsY; sectionY++) {
            for (let sectionX = 0; sectionX < this.config.sectionsX; sectionX++) {
                this.placeFloorSection(
                    floorLayer.data,
                    originalData,
                    width,
                    sectionX,
                    sectionY
                );
            }
        }
    }

    /**
     * Place a single floor section at the specified grid position
     */
    placeFloorSection(layerData, originalData, width, sectionX, sectionY) {
        const offsetX = sectionX * Math.floor(this.config.spacingX / 32); // Convert pixels to tiles
        const offsetY = sectionY * Math.floor(this.config.spacingY / 32);

        // Only place tiles that are within bounds
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 30; x++) {
                const tileId = originalData[y * 30 + x];
                if (tileId !== 0) { // Only place non-empty tiles
                    const newX = x + offsetX;
                    const newY = y + offsetY;

                    // Check bounds (now uses full layer width/height)
                    if (newX < width && newY < layerData.length / width) {
                        layerData[newY * width + newX] = tileId;
                    }
                }
            }
        }
    }

    /**
     * Duplicate the tables tile layer across the map
     */
    duplicateTablesLayer(mapData) {
        const tablesLayer = mapData.layers.find(layer => layer.name === 'tables');
        if (!tablesLayer) {
            console.warn('MapDuplicationModule: No tables layer found');
            return;
        }

        const originalData = [...tablesLayer.data];
        const width = tablesLayer.width;
        const height = tablesLayer.height;

        // Clear the layer data to rebuild it
        tablesLayer.data = new Array(width * height).fill(0);

        // Place original pattern plus 8 duplicates
        for (let sectionY = 0; sectionY < this.config.sectionsY; sectionY++) {
            for (let sectionX = 0; sectionX < this.config.sectionsX; sectionX++) {
                this.placeTablesSection(
                    tablesLayer.data,
                    originalData,
                    width,
                    sectionX,
                    sectionY
                );
            }
        }
    }

    /**
     * Place a single tables section at the specified grid position
     */
    placeTablesSection(layerData, originalData, width, sectionX, sectionY) {
        const offsetX = sectionX * Math.floor(this.config.spacingX / 32); // Convert pixels to tiles
        const offsetY = sectionY * Math.floor(this.config.spacingY / 32);

        // Only place tiles that are within bounds
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 30; x++) {
                const tileId = originalData[y * 30 + x];
                if (tileId !== 0) { // Only place non-empty tiles
                    const newX = x + offsetX;
                    const newY = y + offsetY;

                    // Check bounds (now uses full layer width/height)
                    if (newX < width && newY < layerData.length / width) {
                        layerData[newY * width + newX] = tileId;
                    }
                }
            }
        }
    }

    /**
     * Duplicate the tabletops tile layer across the map
     */
    duplicateTabletopsLayer(mapData) {
        const tabletopsLayer = mapData.layers.find(layer => layer.name === 'tabletops');
        if (!tabletopsLayer) {
            console.warn('MapDuplicationModule: No tabletops layer found');
            return;
        }

        const originalData = [...tabletopsLayer.data];
        const width = tabletopsLayer.width;
        const height = tabletopsLayer.height;

        // Clear the layer data to rebuild it
        tabletopsLayer.data = new Array(width * height).fill(0);

        // Place original pattern plus 8 duplicates
        for (let sectionY = 0; sectionY < this.config.sectionsY; sectionY++) {
            for (let sectionX = 0; sectionX < this.config.sectionsX; sectionX++) {
                this.placeTabletopsSection(
                    tabletopsLayer.data,
                    originalData,
                    width,
                    sectionX,
                    sectionY
                );
            }
        }
    }

    /**
     * Place a single tabletops section at the specified grid position
     */
    placeTabletopsSection(layerData, originalData, width, sectionX, sectionY) {
        const offsetX = sectionX * Math.floor(this.config.spacingX / 32); // Convert pixels to tiles
        const offsetY = sectionY * Math.floor(this.config.spacingY / 32);

        // Only place tiles that are within bounds
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 30; x++) {
                const tileId = originalData[y * 30 + x];
                if (tileId !== 0) { // Only place non-empty tiles
                    const newX = x + offsetX;
                    const newY = y + offsetY;

                    // Check bounds (now uses full layer width/height)
                    if (newX < width && newY < layerData.length / width) {
                        layerData[newY * width + newX] = tileId;
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

        // Duplicate only the point objects across the 9 sections
        const pointObjects = originalObjects.filter(obj => obj.type === 'point');

        // Create 9 sections (3x3 grid) - but only duplicate points, not rects
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