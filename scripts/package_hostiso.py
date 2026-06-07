#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ROOT = ROOT / 'dist' / 'hostiso'
ROOT_ALLOWED_SUFFIXES = {'.html', '.js', '.css', '.json', '.tmx', '.tsx'}
ROOT_STATIC_FILE_EXCLUDES = {
    'discoveryTrailStore.js',
    'eslint.config.js',
    'jsconfig.json',
    'liveVendorAnnouncementStore.js',
    'mapConversionPreview.js',
    'playwright.config.js',
    'vitest.config.js',
    'server.js'
}
ROOT_LIVE_FILE_EXCLUDES = {
    'eslint.config.js',
    'jsconfig.json',
    'mapConversionPreview.js',
    'playwright.config.js',
    'vitest.config.js'
}
STATIC_MODE = 'static'
LIVE_MODE = 'live'
VALID_MODES = {STATIC_MODE, LIVE_MODE, 'both'}
EXCLUDED_DIR_NAMES = {
    '.git',
    '.github',
    '.pytest_cache',
    '.vscode',
    '__pycache__',
    'docs',
    'dist',
    'memories',
    'node_modules',
    'playwright-report',
    'test-results',
    'tests'
}
UI_FILE_SUFFIXES = {'.js'}
LIVE_MANIFEST = {
    'description': 'Slim HostISO deployment manifest for the optional TileTest live backend.',
    'engines': {
        'node': '>=18.0.0'
    },
    'name': 'tiletest-hostiso-live',
    'private': True,
    'scripts': {
        'start': 'node server.js'
    },
    'type': 'module'
}


@dataclass(frozen=True)
class BundleFile:
    source: Path
    relative_path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Create HostISO deployment bundles for TileTest.')
    parser.add_argument('--mode', choices=sorted(VALID_MODES), default='both', help='Bundle type to create.')
    parser.add_argument('--output-root', default=str(OUTPUT_ROOT), help='Output directory for the generated bundles.')
    return parser.parse_args()


def should_include_root_file(file_path: Path, mode: str) -> bool:
    if file_path.name in {'package.json', 'package-lock.json'}:
        return False

    excluded_names = ROOT_STATIC_FILE_EXCLUDES if mode == STATIC_MODE else ROOT_LIVE_FILE_EXCLUDES

    if file_path.name in excluded_names:
        return False

    if file_path.suffix not in ROOT_ALLOWED_SUFFIXES:
        return False

    return True


def should_include_ui_file(file_path: Path) -> bool:
    return file_path.suffix in UI_FILE_SUFFIXES


def iter_bundle_files(mode: str) -> Iterable[BundleFile]:
    for file_path in ROOT.rglob('*'):
        if not file_path.is_file():
            continue

        relative_path = file_path.relative_to(ROOT)
        if any(part in EXCLUDED_DIR_NAMES for part in relative_path.parts):
            continue

        top_level = relative_path.parts[0]

        if top_level == 'assets':
            yield BundleFile(file_path, relative_path)
            continue

        if top_level == 'ui':
            if should_include_ui_file(file_path):
                yield BundleFile(file_path, relative_path)
            continue

        if should_include_root_file(file_path, mode):
            yield BundleFile(file_path, relative_path)


def write_bundle_file(bundle_file: BundleFile, destination_root: Path) -> None:
    destination = destination_root / bundle_file.relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(bundle_file.source, destination)


def write_live_manifest(destination_root: Path) -> None:
    (destination_root / 'package.json').write_text(json.dumps(LIVE_MANIFEST, indent=2) + '\n', encoding='utf-8')


def write_deploy_manifest(destination_root: Path, mode: str, file_count: int) -> None:
    payload = {
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'fileCount': file_count,
        'mode': mode,
        'sourceRoot': str(ROOT)
    }
    (destination_root / 'manifest.json').write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')


def build_bundle(mode: str, output_root: Path) -> tuple[Path, Path, int]:
    bundle_root = output_root / mode
    if bundle_root.exists():
        shutil.rmtree(bundle_root)
    bundle_root.mkdir(parents=True, exist_ok=True)

    file_count = 0
    for bundle_file in iter_bundle_files(mode):
        write_bundle_file(bundle_file, bundle_root)
        file_count += 1

    if mode == LIVE_MODE:
        write_live_manifest(bundle_root)
        file_count += 1

    write_deploy_manifest(bundle_root, mode, file_count)
    file_count += 1

    zip_path = Path(shutil.make_archive(str(bundle_root), 'zip', root_dir=bundle_root))

    return bundle_root, zip_path, file_count


def main() -> int:
    args = parse_args()
    output_root = Path(args.output_root)
    output_root.mkdir(parents=True, exist_ok=True)

    modes = [args.mode] if args.mode != 'both' else [STATIC_MODE, LIVE_MODE]
    summaries = []

    for mode in modes:
        bundle_root, zip_path, file_count = build_bundle(mode, output_root)
        summaries.append((mode, bundle_root, zip_path, file_count))

    for mode, bundle_root, zip_path, file_count in summaries:
        print(f'Created {mode} bundle at {bundle_root}')
        print(f'Created {mode} zip at {zip_path}')
        print(f'Packaged {file_count} files for {mode}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())