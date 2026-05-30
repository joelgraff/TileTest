const CONFIG = {
    PATHS: {
        ASSETS: 'assets',
        IMAGE_EXTENSION: '.png',
        JSON_EXTENSION: '.json'
    },
    ASSETS: {
        TILES: 'tiles',
        PLAYER: 'player',
        MAP: 'vcf_map'
    },
    CONTENT: {
        DOMAINS: 'technology_domains',
        VENDORS: 'vendors'
    },
    PLAYER: {
        FRAME_WIDTH: 32,
        FRAME_HEIGHT: 48,
        DEFAULT_SIZE: { width: 24, height: 10, offsetX: 0, offsetY: 30 },
        SPEED: 100
    },
    NPC: {
        SPRITES: ['npc1', 'npc2'] // Add your NPC asset keys here (filenames without .png)
    }
};

export default CONFIG;