import CONFIG from '../../config.js';
import { formatMapReadinessReport, getMapReadinessReport } from './mapReadiness.js';
import { loadJson } from './testUtils.js';

function resolveMapPath(mapArgument) {
    if (!mapArgument) {
        return `tests/fixtures/vcf_map${CONFIG.PATHS.JSON_EXTENSION}`;
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
const vendors = loadJson(`${CONFIG.CONTENT.VENDORS}${CONFIG.PATHS.JSON_EXTENSION}`);
const report = getMapReadinessReport(map, undefined, { vendors });

console.log(formatMapReadinessReport(mapPath, report));

if (failOnBlocking && !report.ready) {
    process.exitCode = 1;
}