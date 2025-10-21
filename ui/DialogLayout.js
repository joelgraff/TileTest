import GridLayout from './GridLayout.js';
import ColumnLayout from './ColumnLayout.js';
import ButtonFactory from './ButtonFactory.js';

/**
 * DialogLayout - Container-based layout manager for dialog components
 * Organizes dialogs into three primary containers: title bar, main content, and bottom bar
 * Assets are positioned relative to their container's upper-left corner
 */
class DialogLayout {
    constructor(scene, dialogX, dialogY, dialogWidth, dialogHeight, dialogType = 'default') {
        this.scene = scene;
        this.dialogX = dialogX;
        this.dialogY = dialogY;
        this.dialogWidth = dialogWidth;
        this.dialogHeight = dialogHeight;
        this.dialogType = dialogType;

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

        if (dialogType === 'interaction') {
            // Interaction dialogs: left column for navigation, right column split into text/buttons
            const mainLeftWidth = availableWidth / 3;
            const mainRightWidth = availableWidth * 2 / 3;
            this.containers.mainLeft = new Phaser.GameObjects.Container(this.scene, -availableWidth / 3, 0, []); // Center vertically
            this.containers.mainRight = new Phaser.GameObjects.Container(this.scene, availableWidth / 6, -this.availableHeight / 2, []);
            this.containers.mainContainer.add([this.containers.mainLeft, this.containers.mainRight]);

            // For interaction dialogs, create sub-containers in right column
            const rightColumnX = availableWidth / 6;
            const textAreaHeight = availableHeight / 3; // 1/3 for text (top)
            this.buttonAreaHeight = availableHeight * 2 / 3; // 2/3 for buttons (bottom)

            this.containers.mainRightText = new Phaser.GameObjects.Container(this.scene, rightColumnX, -this.availableHeight / 2 + textAreaHeight / 2, []);
            this.containers.mainRightButtons = new Phaser.GameObjects.Container(this.scene, rightColumnX, -this.availableHeight / 2 + textAreaHeight + this.buttonAreaHeight / 2, []);
            this.containers.mainContainer.add([this.containers.mainRightText, this.containers.mainRightButtons]);
        } else {
            // Default dialogs: standard left/right split
            const mainLeftWidth = availableWidth / 3;
            const mainRightWidth = availableWidth * 2 / 3;
            this.containers.mainLeft = new Phaser.GameObjects.Container(this.scene, -availableWidth / 3, -this.availableHeight / 2, []);
            this.containers.mainRight = new Phaser.GameObjects.Container(this.scene, availableWidth / 6, -this.availableHeight / 2, []);
            this.containers.mainContainer.add([this.containers.mainLeft, this.containers.mainRight]);
        }

        // Storage for dialog elements (now grouped by container)
        this.elements = {
            titleContainer: [],
            mainContainer: { left: [], right: [], full: [] },
            bottomContainer: []
        };

        // Add interaction-specific storage
        if (dialogType === 'interaction') {
            this.elements.mainContainer.rightText = [];
            this.elements.mainContainer.rightButtons = [];
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
            let phaserAsset = titleText;
            if (typeof titleText === 'object' && titleText.type) {
                // Create Phaser asset from property object
                if (titleText.type === 'text') {
                    phaserAsset = this.scene.add.text(0, 0, titleText.text, titleText.style);
                } else if (titleText.type === 'button') {
                    phaserAsset = this.buttonFactory.createButton(titleText.label, titleText.onClick, {
                        disabled: titleText.disabled,
                        fontSize: '20px',
                        textColor: '#fff',
                        bgColor: 0x000080,
                        hoverColor: 0x0000aa
                    });
                } else if (titleText.type === 'image') {
                    phaserAsset = this.scene.add.image(0, 0, titleText.key);
                    if (titleText.displaySize) {
                        phaserAsset.setDisplaySize(titleText.displaySize.width, titleText.displaySize.height);
                    }
                    phaserAsset.setOrigin(0.5, 0.5);
                }
            }
            this.containers.titleContainer.add(phaserAsset);
            this.elements.titleContainer.push(phaserAsset);
            // Center the title text in the title bar with margins
            if (phaserAsset.setOrigin) {
                // Individual game objects have setOrigin
                phaserAsset.setOrigin(0.5, 0.5);
                phaserAsset.setPosition(0, 0);
            } else {
                // Containers are positioned by setting x,y directly
                phaserAsset.setPosition(0, 0);
            }
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
                if (asset.setOrigin) {
                    asset.setOrigin(0.5, 0);
                    asset.setPosition(0, 0); // Container is already positioned at top of main area
                } else {
                    asset.setPosition(0, 0);
                }
            }
        });
    }

    /**
     * Add content to the main container's right sub-container
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     */
    addMainRight(assets) {
        if (this.dialogType === 'interaction') {
            // For interaction dialogs, this is a convenience method that adds to text area
            this.addMainRightText(assets);
        } else {
            // For default dialogs, add to the full right container
            const assetArray = Array.isArray(assets) ? assets : [assets];
            assetArray.forEach(asset => {
                if (asset) {
                    this.containers.mainRight.add(asset);
                    this.elements.mainContainer.right.push(asset);
                    // Position at the top of the container, centered horizontally
                    if (asset.setOrigin) {
                        asset.setOrigin(0.5, 0);
                        asset.setPosition(0, 0);
                    } else {
                        asset.setPosition(0, 0);
                    }
                }
            });
        }
    }

    /**
     * Add content to the main right text area (interaction dialogs only)
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     */
    addMainRightText(assets) {
        if (this.dialogType !== 'interaction') {
            console.warn('addMainRightText is only available for interaction dialogs');
            return;
        }

        const assetArray = Array.isArray(assets) ? assets : [assets];
        assetArray.forEach(asset => {
            if (asset) {
                this.containers.mainRightText.add(asset);
                this.elements.mainContainer.rightText.push(asset);
                // Position near the top of the text area (container is already positioned correctly)
                if (asset.setOrigin) {
                    asset.setOrigin(0.5, 0);
                    asset.setPosition(0, -this.availableHeight / 6); // shift upward within the 1/3 area
                } else {
                    asset.setPosition(0, -this.availableHeight / 6);
                }
            }
        });
    }

    /**
     * Add content to the main right buttons area (interaction dialogs only)
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     */
    addMainRightButtons(assets) {
        if (this.dialogType !== 'interaction') {
            console.warn('addMainRightButtons is only available for interaction dialogs');
            return;
        }

        const assetArray = Array.isArray(assets) ? assets : [assets];
        assetArray.forEach(asset => {
            if (asset) {
                this.containers.mainRightButtons.add(asset);
                this.elements.mainContainer.rightButtons.push(asset);
                // Position at the center of the buttons container (container is already positioned correctly)
                if (asset.setOrigin) {
                    asset.setOrigin(0.5, 0.5);
                    asset.setPosition(0, 0);
                } else {
                    asset.setPosition(0, 0);
                }
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
                let phaserAsset = asset;
                if (asset && typeof asset === 'object' && asset.type) {
                    // Create Phaser asset from property object
                    if (asset.type === 'button') {
                    phaserAsset = this.buttonFactory.createButton(
                        asset.label,
                        asset.onClick,
                        {
                            disabled: asset.disabled,
                            fontSize: '16px',
                            textColor: '#000',
                            bgColor: 0xcccccc,
                            hoverColor: 0xaaaaaa,
                            ...(asset.options || {})
                        }
                    );
                    } else if (asset.type === 'image') {
                        phaserAsset = this.scene.add.image(0, 0, asset.key);
                        if (asset.displaySize) {
                            phaserAsset.setDisplaySize(asset.displaySize.width, asset.displaySize.height);
                        }
                        phaserAsset.setOrigin(0.5, 0.5);
                    } else if (asset.type === 'text') {
                        phaserAsset = this.scene.add.text(0, 0, asset.text, asset.style);
                    }
                }
                this.containers.mainContainer.add(phaserAsset);
                this.elements.mainContainer.full.push(phaserAsset);
                // Position at the top of the container, centered horizontally
                if (phaserAsset.setOrigin) {
                    phaserAsset.setOrigin(0.5, 0);
                    phaserAsset.setPosition(0, -this.availableHeight / 2);
                } else {
                    phaserAsset.setPosition(0, -this.availableHeight / 2);
                }
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
                // Left-align the bottom button under the left column
                if (asset.setOrigin) {
                    asset.setOrigin(0, 0.5);
                    asset.setPosition(-this.dialogWidth / 3, 0);
                } else {
                    asset.setPosition(-this.dialogWidth / 3, 0);
                }
            }
        });
    }

    /**
     * Add assets to a specified container with relative positioning
     * @param {string} containerName - Name of container ('title', 'mainLeft', 'mainRight', 'mainRightText', 'mainRightButtons', 'bottom')
     * @param {Phaser.GameObjects.GameObject|Array} assets - Single asset or array of assets
     * @param {Object} layoutOptions - Layout options (e.g., { vertical: true, spacing: 10 })
     */
    addAssets(containerName, assets, layoutOptions = {}) {
        const assetArray = Array.isArray(assets) ? assets : [assets];
        let container;
        let elementGroup;

        console.log('Adding assets to container:', containerName, assetArray, layoutOptions);
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
                console.log('DialogLayout: Processing mainLeft container');
                container = this.containers.mainLeft;
                elementGroup = this.elements.mainContainer.left;
                break;
            case 'mainRight':
                if (this.dialogType === 'interaction') {
                    // For interaction dialogs, mainRight is split
                    container = this.containers.mainRightText;
                    elementGroup = this.elements.mainContainer.rightText;
                } else {
                    container = this.containers.mainRight;
                    elementGroup = this.elements.mainContainer.right;
                }
                break;
            case 'mainRightText':
                if (this.dialogType === 'interaction') {
                    container = this.containers.mainRightText;
                    elementGroup = this.elements.mainContainer.rightText;
                } else {
                    console.warn('mainRightText is only available for interaction dialogs');
                    return;
                }
                break;
            case 'mainRightButtons':
                if (this.dialogType === 'interaction') {
                    container = this.containers.mainRightButtons;
                    elementGroup = this.elements.mainContainer.rightButtons;
                } else {
                    console.warn('mainRightButtons is only available for interaction dialogs');
                    return;
                }
                break;
            case 'bottom':
                container = this.containers.bottomContainer;
                elementGroup = this.elements.bottomContainer;
                break;
            default:
                console.warn(`Unknown container name: ${containerName}`);
                return;
        }

        const phaserAssets = [];
        assetArray.forEach(asset => {
            let phaserAsset = asset;
            if (asset && typeof asset === 'object' && asset.type) {
                // Create Phaser asset from property object
                if (asset.type === 'button') {
                    // Only use options provided by asset.options (set in uiManager.js or other managers)
                    phaserAsset = this.buttonFactory.createButton(
                        asset.label,
                        asset.onClick,
                        {
                            disabled: asset.disabled,
                            ...(asset.options || {})
                        }
                    );
                } else if (asset.type === 'image') {
                    console.log('DialogLayout: Creating image asset:', asset.key, asset.displaySize);
                    phaserAsset = this.scene.add.sprite(0, 0, asset.key, 0);
                    phaserAsset.anims.stop(); // Ensure no animation for static display
                    if (asset.displaySize) {
                        phaserAsset.setDisplaySize(asset.displaySize.width, asset.displaySize.height);
                    }
                    phaserAsset.setOrigin(0.5, 0.5);
                    if (asset.scale) phaserAsset.setScale(asset.scale);
                    if (asset.isAvatar) phaserAsset.isAvatar = true;
                } else if (asset.type === 'text') {
                    phaserAsset = this.scene.add.text(0, 0, asset.text, asset.style);
                }
            }
            if (phaserAsset) {
                container.add(phaserAsset);
                elementGroup.push(phaserAsset);
                phaserAssets.push(phaserAsset);
                // Position relative to container - containers are pre-positioned correctly
                if (containerName === 'title' || containerName === 'bottom') {
                    // For title/bottom containers, center the assets
                    if (phaserAsset.setOrigin) {
                        // Allow left alignment for bottom via layoutOptions
                        const leftAlignBottom = containerName === 'bottom' && (layoutOptions.leftAlign === true);
                        if (leftAlignBottom) {
                            phaserAsset.setOrigin(0, 0.5);
                            // If we have a recorded nav span, align and size to it
                            const leftX = (typeof this.navSpanLeftX === 'number') ? this.navSpanLeftX : -this.dialogWidth / 3;
                            phaserAsset.setPosition(leftX, 0);
                            if (typeof this.navSpanWidth === 'number') {
                                this.resizeButtonContainer(phaserAsset, this.navSpanWidth);
                            }
                        } else {
                            phaserAsset.setOrigin(0.5, 0.5);
                            phaserAsset.setPosition(0, 0);
                        }
                    } else {
                        // Containers are positioned by setting x,y directly
                        const leftAlignBottom = containerName === 'bottom' && (layoutOptions.leftAlign === true);
                        if (leftAlignBottom) {
                            const leftX = (typeof this.navSpanLeftX === 'number') ? this.navSpanLeftX : -this.dialogWidth / 3;
                            const spanW = (typeof this.navSpanWidth === 'number') ? this.navSpanWidth : (phaserAsset.width || 120);
                            // Place container by its center so child text remains centered
                            phaserAsset.setPosition(leftX + spanW / 2, 0);
                            if (typeof this.navSpanWidth === 'number') {
                                this.resizeButtonContainer(phaserAsset, this.navSpanWidth);
                            }
                        } else {
                            phaserAsset.setPosition(0, 0);
                        }
                    }
                } else if (containerName === 'mainRightButtons') {
                    // mainRightButtons uses centered positioning for button containers
                    if (phaserAsset.setOrigin) {
                        phaserAsset.setOrigin(0.5, 0.5);
                        phaserAsset.setPosition(0, 0);
                    } else {
                        phaserAsset.setPosition(0, 0);
                    }
                } else if (asset.type === 'button') {
                    // Button containers are positioned by setting x,y directly
                    if (phaserAsset.setOrigin) {
                        phaserAsset.setOrigin(0.5, 0.5);
                        phaserAsset.setPosition(0, 0);
                    } else {
                        phaserAsset.setPosition(0, 0);
                    }
                } else {
                    // Main content starts from top-left of container
                    if (phaserAsset.setOrigin) {
                        phaserAsset.setOrigin(0.5, 0);
                        phaserAsset.setPosition(0, 0);
                    } else {
                        phaserAsset.setPosition(0, 0);
                    }
                }
            }
        });

        // Apply layout if specified, or default vertical for main containers
        if (layoutOptions.vertical || containerName === 'mainLeft' || containerName === 'mainRightButtons') {
            this.layoutVertically(container, phaserAssets, layoutOptions.spacing || 10, layoutOptions);
        } else if (layoutOptions.horizontal) {
            this.layoutHorizontally(container, phaserAssets, layoutOptions.spacing || 10, layoutOptions);
        }
    }

    /**
     * Layout assets vertically within their container
     * @param {Phaser.GameObjects.Container} container - Container holding the assets
     * @param {Array} assets - Array of assets to layout
     * @param {number} spacing - Spacing between assets
     * @param {Object} options - Layout options (e.g., { bottomAlignButtons: true })
     */
    layoutVertically(container, assets, spacing, options = {}) {
        // For main content containers, start from the top
        // For title/bottom containers, center the group vertically
        const isMainContainer = container === this.containers.mainContainer ||
                               container === this.containers.mainLeft ||
                               container === this.containers.mainRight ||
                               container === this.containers.mainRightText ||
                               container === this.containers.mainRightButtons;

        if (isMainContainer) {
            console.log('Layout Vertically - main container:', assets);
            // For mainLeft, handle avatar and navigation buttons
            console.log(container === this.containers.mainLeft);
            if (container === this.containers.mainLeft) {
                // Assume first asset is avatar, rest are navigation buttons
                const avatarAsset = assets[0];
                const otherAssets = assets.slice(1);

                if (avatarAsset) {
                    // Position avatar at center of main content area
                    avatarAsset.setOrigin(0.5, 0.5);
                    // Adjust position based on dialog type to account for different mainLeft positioning
                    const yOffset = this.dialogType === 'interaction' ? 0 : this.availableHeight / 2;
                    avatarAsset.setPosition(0, yOffset);
                    console.log('Avatar positioned at:', avatarAsset.x, avatarAsset.y, 'in container at:', container.x, container.y, 'dialogType:', this.dialogType);
                    console.log('Avatar visible:', avatarAsset.visible, 'texture:', avatarAsset.texture.key, 'frame:', avatarAsset.frame.name, 'scale:', avatarAsset.scaleX, avatarAsset.scaleY);
                }

                // Position other assets (navigation buttons) at the bottom
                if (otherAssets.length > 0) {
                    if (otherAssets.length === 3) {
                        // Special layout for navigation: '<', '>', '< Back'
                        const leftButton = otherAssets[0];
                        const rightButton = otherAssets[1];
                        const backButton = otherAssets[2];

                        // Position '<' and '>' side by side at the bottom with minimal spacing
                        const buttonY = this.availableHeight / 2 - 20; // near bottom
                        const gap = 8; // minimal horizontal gap between button edges
                        const leftW = leftButton.width || 60;
                        const rightW = rightButton.width || 60;
                        const leftCenterX = -(leftW / 2 + gap / 2);
                        const rightCenterX = (rightW / 2 + gap / 2);
                        if (leftButton.setPosition) leftButton.setPosition(leftCenterX, buttonY);
                        if (rightButton.setPosition) rightButton.setPosition(rightCenterX, buttonY);
                        // Compute overall span for aligning the Back button width/position later
                        const leftEdge = leftCenterX - leftW / 2;
                        const rightEdge = rightCenterX + rightW / 2;
                        // Convert to dialog-container space by adding mainLeft container x
                        this.navSpanLeftX = this.containers.mainLeft.x + leftEdge;
                        this.navSpanWidth = (this.containers.mainLeft.x + rightEdge) - this.navSpanLeftX;
                        // '< Back' is handled in the bottom container, not here
                    } else if (otherAssets.length === 2) {
                        // Two-button pagination: '<' and '>'
                        const leftButton = otherAssets[0];
                        const rightButton = otherAssets[1];
                        const buttonY = this.availableHeight / 2 - 20;
                        const gap = 8;
                        const leftW = leftButton.width || 60;
                        const rightW = rightButton.width || 60;
                        const leftCenterX = -(leftW / 2 + gap / 2);
                        const rightCenterX = (rightW / 2 + gap / 2);
                        if (leftButton.setPosition) leftButton.setPosition(leftCenterX, buttonY);
                        if (rightButton.setPosition) rightButton.setPosition(rightCenterX, buttonY);
                        const leftEdge = leftCenterX - leftW / 2;
                        const rightEdge = rightCenterX + rightW / 2;
                        this.navSpanLeftX = this.containers.mainLeft.x + leftEdge;
                        this.navSpanWidth = (this.containers.mainLeft.x + rightEdge) - this.navSpanLeftX;
                    } else {
                        // Default: center buttons in the bottom half
                        const totalNavHeight = otherAssets.reduce((sum, asset, index) => {
                            const assetHeight = asset.setOrigin ? (asset.displayHeight || asset.height || 0) : asset.height;
                            return sum + assetHeight + (index < otherAssets.length - 1 ? spacing : 0);
                        }, 0);
                        let currentY = this.availableHeight / 2 - totalNavHeight / 2; // center in bottom half
                        otherAssets.forEach(asset => {
                            const assetHeight = asset.setOrigin ? (asset.displayHeight || asset.height || 0) : asset.height;
                            if (asset.setOrigin) {
                                asset.setOrigin(0.5, 0);
                                asset.setPosition(0, currentY);
                            } else {
                                asset.setPosition(0, currentY + assetHeight / 2);
                            }
                            currentY += assetHeight + spacing;
                        });
                    }
                }
                return;
            }            // Special handling for mainRight with bottom-aligned buttons
            if (container === this.containers.mainRight && options.bottomAlignButtons && assets.length > 1) {
                // Position first item (text) at top, remaining items (buttons) at bottom
                const textAsset = assets[0];
                const buttonAssets = assets.slice(1);

                // Position text at top
                textAsset.setPosition(0, 0);

                // Position buttons at bottom
                const buttonTotalHeight = buttonAssets.reduce((sum, asset, index) => {
                    const assetHeight = asset.setOrigin ? asset.height : asset.height;
                    return sum + assetHeight + (index < buttonAssets.length - 1 ? spacing : 0);
                }, 0);
                let buttonY = this.availableHeight / 2 - buttonTotalHeight / 2;
                buttonAssets.forEach(asset => {
                    const assetHeight = asset.setOrigin ? asset.height : asset.height;
                    if (asset.setOrigin) {
                        asset.setPosition(0, buttonY);
                    } else {
                        asset.setPosition(0, buttonY + assetHeight / 2);
                    }
                    buttonY += assetHeight + spacing;
                });
                return;
            }

            // For button containers, position buttons from the top of the button area
            if (container === this.containers.mainRightButtons) {
                let currentY = -this.buttonAreaHeight / 2; // Start from top of button area
                assets.forEach(asset => {
                    const assetHeight = asset.setOrigin ? asset.height : asset.height;
                    if (asset.setOrigin) {
                        asset.setPosition(0, currentY + assetHeight / 2);
                    } else {
                        asset.setPosition(0, currentY + assetHeight / 2);
                    }
                    currentY += assetHeight + spacing;
                });
                return;
            }

            // Default: start from the top of the container
            let currentY = 0;
            assets.forEach(asset => {
                const assetHeight = asset.setOrigin ? asset.height : asset.height;
                if (asset.setOrigin) {
                    asset.setPosition(0, currentY);
                } else {
                    asset.setPosition(0, currentY + assetHeight / 2);
                }
                currentY += assetHeight + spacing;
            });
        } else {
            // Center the vertical group in the container
            const totalHeight = assets.reduce((sum, asset, index) => {
                const assetHeight = asset.setOrigin ? asset.height : asset.height;
                return sum + assetHeight + (index < assets.length - 1 ? spacing : 0);
            }, 0);
            let currentY = -totalHeight / 2;

            assets.forEach(asset => {
                const assetHeight = asset.setOrigin ? asset.height : asset.height;
                if (asset.setOrigin) {
                    asset.setPosition(0, currentY + assetHeight / 2);
                } else {
                    asset.setPosition(0, currentY + assetHeight / 2);
                }
                currentY += assetHeight + spacing;
            });
        }
    }

    /**
     * Layout assets horizontally within their container
     * @param {Phaser.GameObjects.Container} container - Container holding the assets
     * @param {Array} assets - Array of assets to layout
     * @param {number} spacing - Spacing between assets
     * @param {Object} options - Layout options (e.g., { leftAlignFirst: true })
     */
    layoutHorizontally(container, assets, spacing, options = {}) {
        const isMainContainer = container === this.containers.mainContainer ||
                               container === this.containers.mainLeft ||
                               container === this.containers.mainRight;

        if (options.leftAlignFirst && assets.length > 1) {
            // Special layout: first item left-justified, remaining items right-justified
            const firstAsset = assets[0];
            const remainingAssets = assets.slice(1);
            const margin = 15; // Margin from dialog edges

            // Position first asset with left margin
            if (isMainContainer) {
                if (firstAsset.type === Phaser.GameObjects.Container) {
                    firstAsset.setPosition(-this.dialogWidth / 2 + margin + firstAsset.width / 2, this.availableHeight / 2 - 15);
                } else {
                    firstAsset.setPosition(-this.dialogWidth / 2 + margin + firstAsset.width / 2, this.availableHeight / 2 - 15);
                }
            } else {
                if (firstAsset.type === Phaser.GameObjects.Container) {
                    firstAsset.setPosition(-this.dialogWidth / 2 + margin + firstAsset.width / 2, 0);
                } else {
                    firstAsset.setPosition(-this.dialogWidth / 2 + margin + firstAsset.width / 2, 0);
                }
            }

            // Position remaining assets with right margin
            const remainingWidth = remainingAssets.reduce((sum, asset, index) => {
                return sum + asset.width + (index < remainingAssets.length - 1 ? spacing : 0);
            }, 0);
            let currentX = this.dialogWidth / 2 - margin - remainingWidth;

            remainingAssets.forEach(asset => {
                if (isMainContainer) {
                    if (asset.type === Phaser.GameObjects.Container) {
                        asset.setPosition(currentX + asset.width / 2, this.availableHeight / 2 - 15);
                    } else {
                        asset.setPosition(currentX + asset.width / 2, this.availableHeight / 2 - 15);
                    }
                } else {
                    if (asset.type === Phaser.GameObjects.Container) {
                        asset.setPosition(currentX + asset.width / 2, 0);
                    } else {
                        asset.setPosition(currentX + asset.width / 2, 0);
                    }
                }
                currentX += asset.width + spacing;
            });
        } else {
            // Default: center the horizontal group in the container
            const totalWidth = assets.reduce((sum, asset, index) => {
                return sum + asset.width + (index < assets.length - 1 ? spacing : 0);
            }, 0);
            let currentX = -totalWidth / 2;

            assets.forEach(asset => {
                if (isMainContainer) {
                    // For main containers, position with vertical bottom alignment
                    if (asset.type === Phaser.GameObjects.Container) {
                        asset.setPosition(currentX + asset.width / 2, this.availableHeight / 2 - 15);
                    } else {
                        asset.setPosition(currentX + asset.width / 2, this.availableHeight / 2 - 15);
                    }
                } else {
                    // For title/bottom containers, center each asset vertically
                    if (asset.type === Phaser.GameObjects.Container) {
                        asset.setPosition(currentX + asset.width / 2, 0);
                    } else {
                        asset.setPosition(currentX + asset.width / 2, 0);
                    }
                }
                currentX += asset.width + spacing;
            });
        }
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

        // Add interaction-specific storage if needed
        if (this.dialogType === 'interaction') {
            this.elements.mainContainer.rightText = [];
            this.elements.mainContainer.rightButtons = [];
        }
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
    }
}

export default DialogLayout;