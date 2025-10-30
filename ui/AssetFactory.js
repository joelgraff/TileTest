import { ButtonFactory } from './index.js';

/**
 * AssetFactory - Centralized creation of Phaser assets from definitions
 * Handles all asset creation logic, delegating button creation to ButtonFactory
 */
class AssetFactory {
    constructor(scene) {
        this.scene = scene;
        this.buttonFactory = new ButtonFactory(scene);
    }

    /**
     * Create a Phaser asset from an asset definition
     * @param {Object} asset - Asset definition object
     * @param {Object} options - Creation options (container, etc.)
     * @returns {Phaser.GameObjects.GameObject} Created Phaser asset
     */
    createAsset(asset, options = {}) {
        if (!asset || typeof asset !== 'object' || !asset.type) {
            console.warn('AssetFactory: Invalid asset definition:', asset);
            return asset; // Return as-is if not a config object
        }

        switch (asset.type) {
            case 'button':
                return this.buttonFactory.createButton(
                    asset.label,
                    asset.onClick,
                    {
                        disabled: asset.disabled,
                        ...(asset.options || {})
                    }
                );

            case 'linkButton':
                return this.buttonFactory.createLinkButton(
                    asset.label,
                    asset.onClick,
                    {
                        disabled: asset.disabled,
                        ...(asset.options || {})
                    }
                );

            case 'image':
                const image = this.scene.add.sprite(0, 0, asset.key, 0);
                image.anims.stop();
                if (asset.displaySize) {
                    image.setDisplaySize(asset.displaySize.width, asset.displaySize.height);
                }
                image.setOrigin(0.5, 0.5);
                if (asset.scale) image.setScale(asset.scale);
                if (asset.isAvatar) image.isAvatar = true;
                return image;

            case 'text':
            case 'Text':
                const style = asset.style || { fontSize: '18px', color: '#ffffff', align: 'left' };
                const text = this.scene.add.text(0, 0, asset.text, style);
                // Set word wrap based on container width
                if (options.container && options.container.width) {
                    text.setWordWrapWidth(options.container.width - 20);
                }
                return text;

            default:
                console.warn(`AssetFactory: Unknown asset type: ${asset.type}`);
                return null;
        }
    }

    /**
     * Create multiple assets from an array of definitions
     * @param {Array} assets - Array of asset definitions
     * @param {Object} options - Creation options
     * @returns {Array<Phaser.GameObjects.GameObject>} Array of created Phaser assets
     */
    createAssets(assets, options = {}) {
        if (!Array.isArray(assets)) {
            return [this.createAsset(assets, options)].filter(asset => asset !== null);
        }

        return assets.map(asset => this.createAsset(asset, options)).filter(asset => asset !== null);
    }
}

export default AssetFactory;