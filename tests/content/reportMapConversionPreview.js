import CONFIG from '../../config.js';
import {
    createMapLayerConversionPreviewReport,
    formatMapLayerConversionPreviewReport
} from '../../mapConversionPreview.js';
import { loadJson } from './testUtils.js';

function resolveMapPath(mapArgument) {
    if (!mapArgument) {
        return `${CONFIG.PATHS.ASSETS}/vcf_map${CONFIG.PATHS.JSON_EXTENSION}`;
    }

    if (mapArgument.endsWith(CONFIG.PATHS.JSON_EXTENSION)) {
        return mapArgument;
    }

    return `${CONFIG.PATHS.ASSETS}/${mapArgument}${CONFIG.PATHS.JSON_EXTENSION}`;
}

const args = process.argv.slice(2);
const failOnBlocking = args.includes('--fail-on-blocking');
const mapArgument = args.find(arg => !arg.startsWith('--'));
const mapPath = resolveMapPath(mapArgument);
const map = loadJson(mapPath);
const report = createMapLayerConversionPreviewReport(map);

console.log(formatMapLayerConversionPreviewReport(mapPath, report));

if (failOnBlocking && !report.readinessReport.ready) {
    process.exitCode = 1;
}