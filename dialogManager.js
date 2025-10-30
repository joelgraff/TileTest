import { DialogLayout } from './ui/index.js';

// Dialog type constants
const DIALOG_TYPES = {
    DEFAULT: 'default',
    INTERACTION: 'interaction'
};

class DialogManager {
    constructor(scene) {
        this.scene = scene;
        this.dialogContainer = null;
        this.overlay = null;
        this.isDialogOpen = false;
        // Cache mobile detection for performance
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Show dialog with specified type and pre-built assets
     * @param {Object} assets - Assets grouped by container { title: [...], mainLeft: [...], mainRight: [...], bottom: [...] }
     * @param {Object} layoutOptions - Layout options for each container
     * @param {string} dialogType - Dialog type ('default' or 'interaction')
     */
    showDialog(assets = {}, layoutOptions = {}, dialogType = DIALOG_TYPES.DEFAULT) {
        if (this.isDialogOpen) {
            this.hideDialog();
        }

        this.scene.isDialogOpen = true;
        this.isDialogOpen = true;

        // Clear any existing input state to prevent player movement
        if (this.scene.inputManager) {
            this.scene.inputManager.target = null;
            this.scene.inputManager.isDragging = false;
            this.scene.inputManager.direction = { x: 0, y: 0 };
        }

        const cam = this.scene.cameras.main;
        const dialogWidth = Math.min(this.isMobile ? 400 : 600, cam.width * (this.isMobile ? 0.9 : 0.85));
        const dialogHeight = Math.min(this.isMobile ? 260 : 340, cam.height * (this.isMobile ? 0.8 : 0.65));

        // Initialize the layout system with dialog type
        this.dialogLayout = new DialogLayout(this.scene, cam.width / 2, cam.height / 2, dialogWidth, dialogHeight, dialogType);

        // Create overlay and container
        this.overlay = this.createOverlay(cam);
        this.scene.add.existing(this.overlay);
        this.dialogContainer = this.createContainer(cam, dialogWidth, dialogHeight);
        this.dialogContainer.setDepth(50000);

        // Create dialog background
        this.renderBackground(dialogWidth, dialogHeight);

        // Add assets to containers based on dialog type
        this.addAssetsToLayout(assets, layoutOptions, dialogType);

        // Add all elements to the dialog container
        this.addElementsToContainer();
    }

    createOverlay(cam) {
        return this.dialogLayout.createOverlay(cam, () => this.hideDialog());
    }

    createContainer(cam, dialogWidth, dialogHeight) {
        return this.dialogLayout.createContainer(cam);
    }

    renderBackground(dialogWidth, dialogHeight) {
        const bg = this.dialogLayout.createBackground();
        this.dialogContainer.add(bg);
    }

    /**
     * Add pre-built assets to their respective containers based on dialog type
     * @param {Object} assets - Assets grouped by container
     * @param {Object} layoutOptions - Layout options for each container
     * @param {string} dialogType - Dialog type for layout scheme
     */
    addAssetsToLayout(assets, layoutOptions, dialogType) {
        // Add assets to each container using DialogLayout
        Object.keys(assets).forEach(containerName => {
            const containerAssets = assets[containerName];
            const containerOptions = layoutOptions[containerName] || {};

            if (containerAssets) {
                if (containerName === 'title') {
                    // Special handling for title
                    if (Array.isArray(containerAssets)) {
                        containerAssets.forEach(asset => this.dialogLayout.addTitle(asset));
                    } else {
                        this.dialogLayout.addTitle(containerAssets);
                    }
                } else {
                    // Add to appropriate container
                    this.dialogLayout.addAssets(containerName, containerAssets, containerOptions);
                }
            }
        });
    }

    addElementsToContainer() {
        const containerItems = [];

        // Add layout containers to dialog container
        if (this.dialogLayout) {
            Object.values(this.dialogLayout.containers).forEach(container => {
                if (container) {
                    containerItems.push(container);
                }
            });
        }

        this.dialogContainer.add(containerItems);
    }

    hideDialog() {
        if (this.isDialogOpen) {
            this.scene.isDialogOpen = false;
            this.isDialogOpen = false;
        }

        // If pointer is still down when dialog closes, ignore subsequent pointer events until release
        if (this.scene.inputManager && this.scene.input.activePointer.isDown) {
            this.scene.inputManager.ignorePointerUntilRelease = true;
        }

        // Clear the layout system
        if (this.dialogLayout) {
            this.dialogLayout.clear();
            this.dialogLayout = null;
        }

        if (this.dialogContainer) {
            this.dialogContainer.destroy();
            this.dialogContainer = null;
        }

        if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
        }
    }
}

export default DialogManager;