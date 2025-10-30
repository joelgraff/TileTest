import { AssetFactory } from './index.js';

/**
 * DialogLayout - Container-based layout manager for dialog components
 * Organizes dialogs into three primary containers: title bar, main content, and bottom bar
 * Assets are positioned relative to their container's upper-left corner
 */
class DialogLayout {
    constructor(scene, dialogX, dialogY, dialogWidth, dialogHeight, dialogType = 'default') {
        // Store core parameters
        this.scene = scene;
        this.dialogX = dialogX;
        this.dialogY = dialogY;
        this.dialogWidth = dialogWidth;
        this.dialogHeight = dialogHeight;
        this.dialogType = dialogType;

        // Initialize dependencies
        this.assetFactory = new AssetFactory(scene);
        this.positionAssetInContainer = this.positionAssetInContainer.bind(this);

        // Calculate dimensions
        const titleBarHeight = 40;
        const bottomAreaHeight = 40;
        const contentHeight = dialogHeight - titleBarHeight - bottomAreaHeight;
        const margin = 8;
        const availableWidth = dialogWidth - (margin * 2);
        const availableHeight = contentHeight - (margin * 2);

        this.availableHeight = availableHeight;
        this.availableWidth = availableWidth;

        // Create primary containers
        this.containers = {
            titleContainer: new Phaser.GameObjects.Container(scene, 0, -dialogHeight / 2 + titleBarHeight / 2),
            mainContainer: new Phaser.GameObjects.Container(scene, 0, -dialogHeight / 2 + titleBarHeight + margin),
            bottomContainer: new Phaser.GameObjects.Container(scene, 0, dialogHeight / 2 - bottomAreaHeight / 2)
        };

        // Create sub-containers based on dialog type
        this.createSubContainers(availableWidth, availableHeight);

        // Initialize element storage
        this.elements = {
            titleContainer: [],
            mainContainer: { left: [], right: [], full: [] },
            bottomContainer: []
        };

        if (dialogType === 'interaction') {
            this.elements.mainContainer.rightText = [];
            this.elements.mainContainer.rightButtons = [];
        }
    }

    /**
     * Create sub-containers for main content area
     * @param {number} availableWidth - Available width for content
     * @param {number} availableHeight - Available height for content
     */
    createSubContainers(availableWidth, availableHeight) {
        const mainLeftWidth = availableWidth / 3;
        const mainRightWidth = availableWidth * 2 / 3;

        if (this.dialogType === 'interaction') {
            // Interaction dialogs: split right column into text/buttons areas
            const rightColumnX = availableWidth / 6;
            const textAreaHeight = availableHeight / 4;
            this.buttonAreaHeight = availableHeight * 3 / 4;

            this.containers.mainLeft = new Phaser.GameObjects.Container(this.scene, -availableWidth / 3, 0);
            this.containers.mainLeft.width = mainLeftWidth;

            this.containers.mainRight = new Phaser.GameObjects.Container(this.scene, rightColumnX, -availableHeight / 2 + 40);
            this.containers.mainRight.width = mainRightWidth;

            this.containers.mainRightText = new Phaser.GameObjects.Container(this.scene, rightColumnX, -availableHeight / 2 + textAreaHeight / 2 + 20);
            this.containers.mainRightText.width = mainRightWidth;

            this.containers.mainRightButtons = new Phaser.GameObjects.Container(this.scene, rightColumnX, -availableHeight / 2 + textAreaHeight + this.buttonAreaHeight / 2 + 5);
            this.containers.mainRightButtons.width = mainRightWidth;

            this.containers.mainContainer.add([this.containers.mainLeft, this.containers.mainRight, this.containers.mainRightText, this.containers.mainRightButtons]);
        } else {
            // Default dialogs: simple left/right split
            this.containers.mainLeft = new Phaser.GameObjects.Container(this.scene, -availableWidth / 3, -availableHeight / 2);
            this.containers.mainLeft.width = mainLeftWidth;

            this.containers.mainRight = new Phaser.GameObjects.Container(this.scene, availableWidth / 6, -availableHeight / 2);
            this.containers.mainRight.width = mainRightWidth;

            this.containers.mainContainer.add([this.containers.mainLeft, this.containers.mainRight]);
        }
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
        return this.scene.add.container(cam.width / 2, cam.height / 2).setScrollFactor(0);
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

    addTitle(titleText) {
        if (titleText) {
            let phaserAsset = this.assetFactory.createAsset(titleText);
            this.containers.titleContainer.add(phaserAsset);
            this.elements.titleContainer.push(phaserAsset);
            // Center the title text in the title bar
            if (phaserAsset.setOrigin) {
                phaserAsset.setOrigin(0.5, 0.5);
                phaserAsset.setPosition(0, 0);
            } else {
                phaserAsset.setPosition(0, 0);
            }
        }
    }



















    /**
     * Position an asset within its container based on container type and layout options
     * @param {Phaser.GameObjects.GameObject} phaserAsset - The asset to position
     * @param {string} containerName - Name of the container
     * @param {Object} layoutOptions - Layout options
     */
    positionAssetInContainer(phaserAsset, containerName, layoutOptions = {}) {
        // Default positioning: center horizontally, top-align vertically
        let originX = 0.5;
        let originY = 0;
        let posX = 0;
        let posY = 0;

        // Special cases
        if (containerName === 'bottom' && layoutOptions.leftAlign) {
            // Left-align bottom assets, use nav span if available
            originX = 0;
            originY = 0.5;
            posX = (typeof this.navSpanLeftX === 'number') ? this.navSpanLeftX : -this.dialogWidth / 3;
            posY = 0;
            if (typeof this.navSpanWidth === 'number') {
                this.resizeButtonContainer(phaserAsset, this.navSpanWidth);
            }
        } else if (containerName === 'bottom' && phaserAsset.type === 'button') {
            // Bottom buttons: center in bottom area
            originX = 0.5;
            originY = 0.5;
            posX = 0;
            posY = 0; // Center in bottom container
        } else if (containerName === 'mainRightButtons' || phaserAsset.type === 'button') {
            // Center buttons
            originX = 0.5;
            originY = 0.5;
            posX = 0;
            posY = 0;
        } else if (containerName === 'mainRightText') {
            // Top-align text in right column
            originX = 0;
            originY = 0;
            posX = -this.containers.mainRightText.width / 2;
            posY = -this.containers.mainRightText.height / 2 + 10; // Start 10px from top
        }

        // Apply positioning
        if (phaserAsset.setOrigin) {
            phaserAsset.setOrigin(originX, originY);
            phaserAsset.setPosition(posX, posY);
        } else {
            // For containers without setOrigin, adjust position based on origin
            const adjustedX = posX - (originX - 0.5) * (phaserAsset.width || 0);
            const adjustedY = posY - (originY - 0.5) * (phaserAsset.height || 0);
            phaserAsset.setPosition(adjustedX, adjustedY);
        }
    }

    /**
     * Get container and element group for a container name
     * @param {string} containerName - Name of container
     * @returns {Object} Object with container and elementGroup properties
     */
    getContainerInfo(containerName) {
        switch (containerName) {
            case 'title':
                return {
                    container: this.containers.titleContainer,
                    elementGroup: this.elements.titleContainer
                };
            case 'main':
                return {
                    container: this.containers.mainContainer,
                    elementGroup: this.elements.mainContainer.full
                };
            case 'mainLeft':
                return {
                    container: this.containers.mainLeft,
                    elementGroup: this.elements.mainContainer.left
                };
            case 'mainRight':
                return {
                    container: this.containers.mainRight,
                    elementGroup: this.elements.mainContainer.right
                };
            case 'mainRightText':
                if (this.dialogType !== 'interaction') {
                    console.warn('mainRightText is only available for interaction dialogs');
                    return null;
                }
                return {
                    container: this.containers.mainRightText,
                    elementGroup: this.elements.mainContainer.rightText
                };
            case 'mainRightButtons':
                if (this.dialogType !== 'interaction') {
                    console.warn('mainRightButtons is only available for interaction dialogs');
                    return null;
                }
                return {
                    container: this.containers.mainRightButtons,
                    elementGroup: this.elements.mainContainer.rightButtons
                };
            case 'bottom':
                return {
                    container: this.containers.bottomContainer,
                    elementGroup: this.elements.bottomContainer
                };
            default:
                console.warn(`Unknown container name: ${containerName}`);
                return null;
        }
    }

    addAssets(containerName, assets, layoutOptions = {}) {
        const assetArray = Array.isArray(assets) ? assets : [assets];

        // Special handling for mainRight in interaction dialogs
        if (containerName === 'mainRight' && this.dialogType === 'interaction') {
            const textAssets = [];
            const buttonAssets = [];
            assetArray.forEach(asset => {
                if (asset.type === 'button') {
                    buttonAssets.push(asset);
                } else {
                    textAssets.push(asset);
                }
            });
            if (textAssets.length > 0) {
                this.addAssets('mainRightText', textAssets);
            }
            if (buttonAssets.length > 0) {
                this.addAssets('mainRightButtons', buttonAssets);
            }
            return; // Skip normal processing
        }

        // Get container info
        const containerInfo = this.getContainerInfo(containerName);
        if (!containerInfo) return;

        const { container, elementGroup } = containerInfo;

        // Process assets
        const phaserAssets = [];
        assetArray.forEach(asset => {
            let phaserAsset = this.assetFactory.createAsset(asset, { container });
            if (phaserAsset) {
                container.add(phaserAsset);
                elementGroup.push(phaserAsset);
                phaserAssets.push(phaserAsset);
                this.positionAssetInContainer(phaserAsset, containerName, layoutOptions);
            }
        });

        // Apply layout if specified
        if (layoutOptions.vertical || (containerName === 'mainLeft' && !layoutOptions.horizontal) || containerName === 'mainRightButtons') {
            this.layoutVertical(container, phaserAssets, layoutOptions.spacing || 10, layoutOptions);
        } else if (layoutOptions.horizontal) {
            this.layoutHorizontal(container, phaserAssets, layoutOptions.spacing || 10, layoutOptions);
        }
    }

    /**
     * Generic navigation layout for mainLeft container
     * @param {Phaser.GameObjects.Container} container - The mainLeft container
     * @param {Array} assets - Array of assets (avatar + navigation buttons)
     */
    layoutNavigation(container, assets) {
        if (assets.length === 0) return;

        // First asset is typically avatar, position at center
        const avatarAsset = assets[0];
        if (avatarAsset) {
            if (avatarAsset.setOrigin) avatarAsset.setOrigin(0.5, 0.5);
            const yOffset = this.dialogType === 'interaction' ? 0 : this.availableHeight / 2;
            avatarAsset.setPosition(0, yOffset);
        }

        // Remaining assets are navigation buttons
        const navButtons = assets.slice(1);
        if (navButtons.length === 0) return;

        if (navButtons.length === 3) {
            // Special layout: '<', '>', '< Back' - position first two left-aligned
            this.layoutNavButtonsLeftAligned(navButtons.slice(0, 2));
            // Third button ('< Back') handled in bottom container
        } else if (navButtons.length === 2) {
            // Two-button pagination: '<' and '>'
            this.layoutNavButtonsLeftAligned(navButtons);
        } else {
            // Default: center buttons in bottom half
            this.layoutButtonsCentered(navButtons, this.availableHeight / 2);
        }
    }

    /**
     * Layout navigation buttons left-aligned with minimal spacing
     * @param {Array} buttons - Array of button assets
     */
    layoutNavButtonsLeftAligned(buttons) {
        const buttonY = this.availableHeight / 2 - 20;
        const gap = 8;
        const mainLeftWidth = this.containers.mainLeft.width;

        let currentX = -mainLeftWidth / 2;
        let leftEdge = currentX;

        buttons.forEach((button, index) => {
            const buttonW = button.width || 60;
            const centerX = currentX + buttonW / 2;
            button.setPosition(centerX, buttonY);
            currentX += buttonW + (index < buttons.length - 1 ? gap : 0);
        });

        // Calculate nav span for alignment
        const rightEdge = currentX;
        this.navSpanLeftX = this.containers.mainLeft.x + leftEdge;
        this.navSpanWidth = rightEdge - leftEdge;
    }

    /**
     * Layout buttons centered vertically in a given area
     * @param {Array} buttons - Array of button assets
     * @param {number} centerY - Y position to center around
     * @param {number} spacing - Spacing between buttons
     */
    layoutButtonsCentered(buttons, centerY, spacing = 10) {
        const totalHeight = buttons.reduce((sum, button, index) => {
            const height = button.displayHeight || button.height || 0;
            return sum + height + (index < buttons.length - 1 ? spacing : 0);
        }, 0);

        let currentY = centerY - totalHeight / 2;
        buttons.forEach(button => {
            const height = button.displayHeight || button.height || 0;
            if (button.setOrigin) button.setOrigin(0.5, 0);
            button.setPosition(0, currentY);
            currentY += height + spacing;
        });
    }



    /**
     * Generic horizontal layout for assets
     * @param {Phaser.GameObjects.Container} container - Container holding the assets
     * @param {Array} assets - Array of assets to layout
     * @param {number} spacing - Spacing between assets
     * @param {Object} options - Layout options
     */
    layoutHorizontal(container, assets, spacing = 10, options = {}) {
        const isMainContainer = container === this.containers.mainContainer ||
                               container === this.containers.mainLeft ||
                               container === this.containers.mainRight;

        if (options.leftAlign) {
            // Left-align all assets
            const referenceWidth = !isMainContainer ? this.dialogWidth : container.width;
            let currentX = -referenceWidth / 2 + 10; // 10px margin from left
            const baseY = isMainContainer ? this.availableHeight / 2 - 15 : 0;

            assets.forEach(asset => {
                asset.setPosition(currentX + asset.width / 2, baseY);
                currentX += asset.width + spacing;
            });
        } else if (options.navAligned && assets.length === 2) {
            // Back button aligned with nav, close button right-aligned
            const backButton = assets[0];
            const closeButton = assets[1];
            const navButtonLeftEdge = this.navSpanLeftX || -this.availableWidth / 2;
            const backButtonCenterX = navButtonLeftEdge + backButton.width / 2;
            const baseY = container === this.containers.bottomContainer ? -10 : (isMainContainer ? this.availableHeight / 2 - 15 : 0);

            backButton.setPosition(backButtonCenterX, baseY);
            closeButton.setPosition(this.dialogWidth / 2 - 10 - closeButton.width / 2, baseY);
        } else if (options.leftAlignFirst && assets.length > 1) {
            // First item left-aligned, remaining items right-aligned
            const firstAsset = assets[0];
            const remainingAssets = assets.slice(1);
            const margin = 15;
            const baseY = isMainContainer ? this.availableHeight / 2 - 15 : 0;

            // Position first asset with left margin
            firstAsset.setPosition(-this.dialogWidth / 2 + margin + firstAsset.width / 2, baseY);

            // Position remaining assets with right margin
            const remainingWidth = remainingAssets.reduce((sum, asset, index) => {
                return sum + asset.width + (index < remainingAssets.length - 1 ? spacing : 0);
            }, 0);
            let currentX = this.dialogWidth / 2 - margin - remainingWidth;

            remainingAssets.forEach(asset => {
                asset.setPosition(currentX + asset.width / 2, baseY);
                currentX += asset.width + spacing;
            });
        } else {
            // Default centered layout
            const totalWidth = assets.reduce((sum, asset, index) => {
                return sum + asset.width + (index < assets.length - 1 ? spacing : 0);
            }, 0);
            let currentX = -totalWidth / 2;
            const baseY = isMainContainer ? this.availableHeight / 2 - 15 : 0;

            assets.forEach(asset => {
                asset.setPosition(currentX + asset.width / 2, baseY);
                currentX += asset.width + spacing;
            });

            // Special case: calculate navSpan for horizontal nav buttons in mainLeft
            if (container === this.containers.mainLeft && assets.length === 2) {
                this.navSpanLeftX = this.containers.mainLeft.x - totalWidth / 2;
                this.navSpanWidth = totalWidth;
            }
        }
    }

    /**
     * Generic vertical layout for assets
     * @param {Phaser.GameObjects.Container} container - Container holding the assets
     * @param {Array} assets - Array of assets to layout
     * @param {number} spacing - Spacing between assets
     * @param {Object} options - Layout options
     */
    layoutVertical(container, assets, spacing = 10, options = {}) {
        const isMainContainer = container === this.containers.mainContainer ||
                               container === this.containers.mainLeft ||
                               container === this.containers.mainRight ||
                               container === this.containers.mainRightText ||
                               container === this.containers.mainRightButtons;

        if (isMainContainer) {
            // Special handling for mainLeft navigation
            if (container === this.containers.mainLeft) {
                this.layoutNavigation(container, assets);
                return;
            }

            // Special handling for mainRight with bottom-aligned buttons
            if (container === this.containers.mainRight && options.bottomAlignButtons && assets.length > 1) {
                const textAsset = assets[0];
                const buttonAssets = assets.slice(1);
                textAsset.setPosition(0, 0);
                this.layoutButtonsCentered(buttonAssets, this.availableHeight / 2, spacing);
                return;
            }

            // Special handling for button containers (left-aligned from top)
            if (container === this.containers.mainRightButtons) {
                let currentY = -this.buttonAreaHeight / 2;
                assets.forEach(asset => {
                    if (asset.setOrigin) asset.setOrigin(0, 0.5);
                    asset.setPosition(-container.width / 2, currentY);
                    currentY += asset.height + spacing;
                });
                return;
            }

            // Default: start from the top of the container
            let currentY = -this.availableHeight / 2 + 20; // Start 20px from top
            assets.forEach(asset => {
                if (asset.setOrigin) asset.setOrigin(0.5, 0);
                asset.setPosition(0, currentY);
                currentY += asset.height + spacing;
            });
        } else {
            // Center the vertical group in the container
            const totalHeight = assets.reduce((sum, asset, index) => {
                const assetHeight = asset.height;
                return sum + assetHeight + (index < assets.length - 1 ? spacing : 0);
            }, 0);
            let currentY = -totalHeight / 2;

            assets.forEach(asset => {
                if (asset.setOrigin) asset.setOrigin(0.5, 0.5);
                asset.setPosition(0, currentY + asset.height / 2);
                currentY += asset.height + spacing;
            });
        }
    }







    /**
     * Clear all elements from the dialog layout
     */
    clear() {
        this.elements = {
            titleContainer: [],
            mainContainer: { left: [], right: [], full: [] },
            bottomContainer: []
        };

        if (this.dialogType === 'interaction') {
            this.elements.mainContainer.rightText = [];
            this.elements.mainContainer.rightButtons = [];
        }
    }



    /**
     * Resize a button container to a specific width by adjusting its background rect
     * @param {Phaser.GameObjects.Container|Phaser.GameObjects.GameObject} buttonContainer
     * @param {number} newWidth
     */
    resizeButtonContainer(buttonContainer, newWidth) {
        if (!buttonContainer) return;
        // If we were given a container, try to find a Rectangle child
        const container = buttonContainer.list ? buttonContainer : null;
        if (container) {
            const bg = container.list && container.list.find(child => typeof child.setSize === 'function' && 'width' in child && 'height' in child);
            if (bg && typeof bg.setSize === 'function') {
                bg.setSize(newWidth, bg.height);
            }
            buttonContainer.width = newWidth;
        } else if (typeof buttonContainer.setSize === 'function') {
            // It might be a Rectangle itself
            buttonContainer.setSize(newWidth, buttonContainer.height);
        }
    };
}

export default DialogLayout;