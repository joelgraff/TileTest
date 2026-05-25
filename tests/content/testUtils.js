import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(currentDir, '../..');

export function loadJson(relativePath) {
    const filePath = path.join(repoRoot, relativePath);
    const fileContents = fs.readFileSync(filePath, 'utf8');

    return JSON.parse(fileContents);
}

export function getLayer(map, layerName) {
    return map.layers.find(layer => layer.name === layerName);
}

export function getPropertyValue(entity, propertyName) {
    if (!Array.isArray(entity?.properties)) {
        return undefined;
    }

    return entity.properties.find(property => property.name === propertyName)?.value;
}