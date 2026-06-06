const CONFIG = {
    PATHS: {
        ASSETS: 'assets',
        IMAGE_EXTENSION: '.png',
        JSON_EXTENSION: '.json'
    },
    ASSETS: {
        PACKAGE: '24px',
        TILES: 'tiles',
        PLAYER: 'player',
        MAP: 'map'
    },
    CONTENT: {
        DOMAINS: 'technology_domains',
        DISCOVERY_TRAILS: 'discovery_trails',
        VENDORS: 'vendors'
    },
    PLAYER: {
        FRAME_WIDTH: 32,
        FRAME_HEIGHT: 48,
        DEFAULT_SIZE: { width: 24, height: 10, offsetX: 0, offsetY: 30 },
        SPEED: 100
    },
    NPC: {
        FRAME_WIDTH: 32,
        FRAME_HEIGHT: 48,
        SPRITE_PREFIX: 'npc_',
        SPRITE_PADDING: 3,
        SPRITES: ['npc1', 'npc2'] // Add your NPC asset keys here (filenames without .png)
    },
    getPackageRoot(packageName) {
        const resolvedPackage = packageName ?? this.ASSETS.PACKAGE;

        return resolvedPackage
            ? `${this.PATHS.ASSETS}/${resolvedPackage}`
            : this.PATHS.ASSETS;
    },
    getAssetPath(assetKey, extension, packageName) {
        return `${this.getPackageRoot(packageName)}/${assetKey}${extension}`;
    }
};

export default CONFIG;