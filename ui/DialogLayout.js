import GridLayout from './GridLayout.js';
import ColumnLayout from './ColumnLayout.js';
import ButtonFactory from './ButtonFactory.js';

/**
 * DialogLayout - Container-based layout manager for dialog components
 * Organizes dialogs into three primary containers: title bar, main content, and bottom bar
 * Assets are positioned relative to their container's upper-left corner
 */
class DialogLayout {
    constructor(scene, dialogX, dialogY, dialogWidth, dialogHeight) {
        this.scene = scene;
        this.dialogX = dialogX;
        this.dialogY = dialogY;
        this.dialogWidth = dialogWidth;
        this.dialogHeight = dialogHeight;

        // Initialize button factory
        this.buttonFactory = new ButtonFactory(scene);

        // Define primary containers (relative to dialog container origin at 0,0)
        const titleBarHeight = 40;
        const bottomAreaHeight = 40;
        const contentHeight = dialogHeight - titleBarHeight - bottomAreaHeight;

        // Apply margins to main container positioning
        const margin = 8;
        this.containers = {
            titleContainer: new Phaser.GameObjects.Container(this.scene, 0, -dialogHeight / 2 + titleBarHeight / 2), // Center in title bar
            mainContainer: new Phaser.GameObjects.Container(this.scene, 0, -dialogHeight / 2 + titleBarHeight + margin), // Position with top margin
            bottomContainer: new Phaser.GameObjects.Container(this.scene, 0, dialogHeight / 2 - bottomAreaHeight / 2) // Center in bottom area
        };

        // Sub-containers for main content - with 8px margins
        const availableWidth = dialogWidth - (margin * 2); // Subtract left and right margins
        const availableHeight = contentHeight - (margin * 2); // Subtract top and bottom margins
        this.availableHeight = availableHeight; // Store for layout calculations
        const mainLeftWidth = availableWidth / 3;
        const mainRightWidth = availableWidth * 2 / 3;
        this.containers.mainLeft = new Phaser.GameObjects.Container(this.scene, -availableWidth / 3, 0, []);
        this.containers.mainRight = new Phaser.GameObjects.Container(this.scene, availableWidth / 6, 0, []);
        this.containers.mainContainer.add([this.containers.mainLeft, this.containers.mainRight]);

        // Storage for dialog elements (now grouped by container)
        this.elements = {
            titleContainer: [],
            mainContainer: { left: [], right: [], full: [] },
            bottomContainer: []
        };
    }

    /**
     * Create the dialog overlay
     * @param {Phaser.Cameras.Scene2D.Camera} cam - Scene camera
     * @param {Function} onClickOutside - Handler for clicking outside dialog
     * @returns {Phaser.GameObjects.Rectangle} Overlay rectangle
     */
    createOverlay(cam, onClickOutside) {
        const overlay = this.scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.5)
            .setScrollFactor(0)
            .setInteractive()
            .setDepth(49999)
            .on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                onClickOutside();
            })
            .on('pointermove', (pointer, localX, localY, event) => {
                event.stopPropagation();
            })
            .on('pointerup', (pointer, localX, localY, event) => {
                event.stopPropagation();
            });

        return overlay;
    }

    /**
     * Create the dialog container
     * @param {Phaser.Cameras.Scene2D.Camera} cam - Scene camera
     * @returns {Phaser.GameObjects.Container} Dialog container
     */
    createContainer(cam) {
        return this.scene.add.container(cam.width / 2, cam.height - this.dialogHeight / 2 - 16).setScrollFactor(0);
    }

    /**
     * Create the dialog background
     * @returns {Phaser.GameObjects.Container} Container with background rectangles
     */
    createBackground() {
        const backgroundContainer = this.scene.add.container(0, 0);

        // Title bar background
        const titleBg = this.scene.add.rectangle(0, -this.dialogHeight / 2 + 20, this.dialogWidth, 40, 0x000080, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x666666);

        // Main content background
        const mainBg = this.scene.add.rectangle(0, -this.dialogHeight / 2 + 40 + (this.dialogHeight - 80) / 2, this.dialogWidth, this.dialogHeight - 80, 0x808080, 0.97)
            .setOrigin(0.5);

        // Bottom area background
        const bottomBg = this.scene.add.rectangle(0, this.dialogHeight / 2 - 20, this.dialogWidth, 40, 0x808080, 0.9)
            .setOrigin(0.5);

        backgroundContainer.add([titleBg, mainBg, bottomBg]);

        // Make backgrounds interactive to prevent click-through
        [titleBg, mainBg, bottomBg].forEach(bg => {
            bg.setInteractive()
                .on('pointerdown', (pointer, localX, localY, event) => event.stopPropagation())
                .on('pointermove', (pointer, localX, localY, event) => event.stopPropagation())
                .on('pointerup', (pointer, localX, localY, event) => event.stopPropagation());
        });

        return backgroundContainer;
    }

    /**
     * Add title text to the title container
     * @param {Phaser.GameObjects.Text} titleText - Pre-built title text object
     */
    addTitle(titleText) {
        if (titleText) {
            this.containers.titleContainer.add(titleText);
            this.elements.titleContainer.push(titleText);
            // Center the title text in the title bar with margins
            titleText.setOrigin(0.5, 0.5);
            titleText.setPosition(0, 0);
        }
    }

    /**
     * Add content to the main container's left sub-container
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     */
    addMainLeft(assets) {
        const assetArray = Array.isArray(assets) ? assets : [assets];
        assetArray.forEach(asset => {
            if (asset) {
                this.containers.mainLeft.add(asset);
                this.elements.mainContainer.left.push(asset);
                // Position from top of main area, centered horizontally
                asset.setOrigin(0.5, 0);
                asset.setPosition(0, 0); // Container is already positioned at top of main area
            }
        });
    }

    /**
     * Add content to the main container's right sub-container
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     */
    addMainRight(assets) {
        const assetArray = Array.isArray(assets) ? assets : [assets];
        assetArray.forEach(asset => {
            if (asset) {
                this.containers.mainRight.add(asset);
                this.elements.mainContainer.right.push(asset);
                // Position from top of main area, centered horizontally
                asset.setOrigin(0.5, 0);
                asset.setPosition(0, 0); // Container is already positioned at top of main area
            }
        });
    }

    /**
     * Add content to the main container (full width)
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     */
    addMain(assets) {
        const assetArray = Array.isArray(assets) ? assets : [assets];
        assetArray.forEach(asset => {
            if (asset) {
                this.containers.mainContainer.add(asset);
                this.elements.mainContainer.full.push(asset);
                // Position from top of main area, centered horizontally (container already has top margin)
                asset.setOrigin(0.5, 0);
                asset.setPosition(0, 0);
            }
        });
    }











    /**
     * Add content to the bottom container
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     */
    addBottom(assets) {
        const assetArray = Array.isArray(assets) ? assets : [assets];
        assetArray.forEach(asset => {
            if (asset) {
                this.containers.bottomContainer.add(asset);
                this.elements.bottomContainer.push(asset);
                // Center the bottom content
                asset.setOrigin(0.5, 0.5);
                asset.setPosition(0, 0);
            }
        });
    }

    /**
     * Add assets to a specified container with relative positioning
     * @param {string} containerName - Name of container ('title', 'mainLeft', 'mainRight', 'bottom')
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     * @param {Object} layoutOptions - Layout options (e.g., { vertical: true, spacing: 10 })
     */
    addAssets(containerName, assets, layoutOptions = {}) {
        const assetArray = Array.isArray(assets) ? assets : [assets];
        let container;
        let elementGroup;

        switch (containerName) {
            case 'title':
                container = this.containers.titleContainer;
                elementGroup = this.elements.titleContainer;
                break;
            case 'main':
                container = this.containers.mainContainer;
                elementGroup = this.elements.mainContainer.full;
                break;
            case 'mainLeft':
                container = this.containers.mainLeft;
                elementGroup = this.elements.mainContainer.left;
                break;
            case 'mainRight':
                container = this.containers.mainRight;
                elementGroup = this.elements.mainContainer.right;
                break;
            case 'bottom':
                container = this.containers.bottomContainer;
                elementGroup = this.elements.bottomContainer;
                break;
            default:
                console.warn(`Unknown container name: ${containerName}`);
                return;
        }

        assetArray.forEach(asset => {
            if (asset) {
                container.add(asset);
                elementGroup.push(asset);
                // Position relative to container - containers are pre-positioned correctly
                if (containerName === 'title' || containerName === 'bottom') {
                    asset.setOrigin(0.5, 0.5);
                    asset.setPosition(0, 0);
                } else {
                    // Main content starts from top-left of container
                    asset.setOrigin(0.5, 0);
                    asset.setPosition(0, 0);
                }
            }
        });

        // Apply layout if specified
        if (layoutOptions.vertical) {
            this.layoutVertically(container, assetArray, layoutOptions.spacing || 10);
        } else if (layoutOptions.horizontal) {
            this.layoutHorizontally(container, assetArray, layoutOptions.spacing || 10);
        }
    }

    /**
     * Layout assets vertically within their container
     * @param {Phaser.GameObjects.Container} container - Container holding the assets
     * @param {Array} assets - Array of assets to layout
     * @param {number} spacing - Spacing between assets
     */
    layoutVertically(container, assets, spacing) {
        // For main content containers, start from the top with margins
        // For title/bottom containers, center the group vertically
        const isMainContainer = container === this.containers.mainContainer ||
                               container === this.containers.mainLeft ||
                               container === this.containers.mainRight;
        let currentY;

        if (isMainContainer) {
            currentY = 0; // Start from top of container (margins already accounted for in positioning)
        } else {
            // Center the vertical group in the container
            const totalHeight = assets.reduce((sum, asset, index) => {
                return sum + asset.height + (index < assets.length - 1 ? spacing : 0);
            }, 0);
            currentY = -totalHeight / 2;
        }

        assets.forEach(asset => {
            if (isMainContainer) {
                // For main containers, position from top with horizontal center
                asset.setPosition(0, currentY);
            } else {
                // For title/bottom containers, center each asset
                asset.setPosition(0, currentY + asset.height / 2);
            }
            currentY += asset.height + spacing;
        });
    }

    /**
     * Layout assets horizontally within their container
     * @param {Phaser.GameObjects.Container} container - Container holding the assets
     * @param {Array} assets - Array of assets to layout
     * @param {number} spacing - Spacing between assets
     */
    layoutHorizontally(container, assets, spacing) {
        // Center the horizontal group in the container
        const totalWidth = assets.reduce((sum, asset, index) => {
            return sum + asset.width + (index < assets.length - 1 ? spacing : 0);
        }, 0);
        let currentX = -totalWidth / 2;

        const isMainContainer = container === this.containers.mainContainer ||
                               container === this.containers.mainLeft ||
                               container === this.containers.mainRight;

        assets.forEach(asset => {
            if (isMainContainer) {
                // For main containers, position with vertical bottom alignment
                asset.setPosition(currentX + asset.width / 2, this.availableHeight - asset.height);
            } else {
                // For title/bottom containers, center each asset vertically
                asset.setPosition(currentX + asset.width / 2, 0);
            }
            currentX += asset.width + spacing;
        });
    }





    /**
     * Clear all elements from the dialog layout
     */
    clear() {
        // Note: Elements are not destroyed here as they will be destroyed
        // when the dialog container is destroyed

        // Reset elements storage
        this.elements = {
            titleContainer: [],
            mainContainer: { left: [], right: [], full: [] },
            bottomContainer: []
        };
    }

    /**
     * Get container bounds for custom positioning
     * @param {string} containerName - Name of container ('title', 'main', 'bottom')
     * @returns {Object} Container bounds with x, y, width, height (relative to dialog container)
     */
    getContainerBounds(containerName) {
        const titleBarHeight = 40;
        const bottomAreaHeight = 40;
        const contentHeight = this.dialogHeight - titleBarHeight - bottomAreaHeight;
        const margin = 8;

        switch (containerName) {
            case 'title':
                return { x: 0, y: -this.dialogHeight / 2, width: this.dialogWidth, height: titleBarHeight };
            case 'main':
                return {
                    x: 0,
                    y: -this.dialogHeight / 2 + titleBarHeight + margin,
                    width: this.dialogWidth - (margin * 2),
                    height: contentHeight - (margin * 2)
                };
            case 'bottom':
                return { x: 0, y: this.dialogHeight / 2 - bottomAreaHeight / 2, width: this.dialogWidth, height: bottomAreaHeight };
            default:
                return null;
        }
    }
}

export default DialogLayout;