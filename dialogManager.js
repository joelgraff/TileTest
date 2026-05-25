import { renderDialogSurface } from './dialogRenderSurface.js';
import {
    createDialogPaginationButtons,
    createDialogTextPaginationButtons,
    resolveDialogBottomButtons,
    resolveDialogButtons
} from './dialogButtonPagination.js';
import { renderDialogImageContent, renderDialogTextContent } from './dialogContentRenderer.js';
import { calculateDialogTextPages, resolveDialogTextPage } from './dialogTextPagination.js';
import { bindSceneBooleanFlag } from './stateBindings.js';

class DialogManager {
    constructor(scene, {
        state = null,
        inputManager = null,
        prepareUiInteraction = null,
        releasePointerSuppression = null,
        isPointerDown = null
    } = {}) {
        this.scene = scene;
        this.prepareUiInteraction = prepareUiInteraction ?? inputManager?.prepareUiInteraction?.bind(inputManager) ?? null;
        this.releasePointerSuppression = releasePointerSuppression ?? inputManager?.releasePointerSuppression?.bind(inputManager) ?? null;
        this.isPointerDown = isPointerDown ?? (() => Boolean(this.scene.input?.activePointer?.isDown));
        this.dialogContainer = null;
        this.overlay = null;
        this.setState(state);
        // Cache mobile detection for performance
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setInputManager(inputManager) {
        this.prepareUiInteraction = inputManager?.prepareUiInteraction?.bind(inputManager) ?? null;
        this.releasePointerSuppression = inputManager?.releasePointerSuppression?.bind(inputManager) ?? null;
        return this;
    }

    setState(state) {
        const nextState = state ?? this.state ?? {
            isDialogOpen: false
        };

        nextState.isDialogOpen = Boolean(nextState.isDialogOpen);
        this.state = nextState;

        Object.defineProperty(this, 'isDialogOpen', {
            configurable: true,
            enumerable: true,
            get: () => this.state.isDialogOpen,
            set: (isDialogOpen) => {
                this.state.isDialogOpen = Boolean(isDialogOpen);
            }
        });

        bindSceneBooleanFlag(this.scene, this.state, 'isDialogOpen');

        return this;
    }

    showDialog({ imageKey, title = '', text = '', buttons = [], exitButton = null, pagination = null, bottomButtons = null, textPagination = null }) {
        if (this.isDialogOpen) {
            this.hideDialog();
        }

        this.scene.isDialogOpen = true;
        this.isDialogOpen = true;

        // Clear any existing input state to prevent player movement
        this.prepareUiInteraction?.();

        renderDialogSurface(this, {
            imageKey,
            title,
            text,
            buttons,
            exitButton,
            pagination,
            bottomButtons,
            textPagination
        });
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

    renderTitleBar(title, dialogWidth, dialogHeight) {
        this.dialogLayout.createTitleBar(title);
    }

    renderNpcImage(imageKey, dialogWidth, dialogHeight) {
        return renderDialogImageContent(this, { imageKey, dialogWidth });
    }

    renderDialogText(displayText, dialogWidth, dialogHeight) {
        return renderDialogTextContent(this, { displayText, dialogWidth });
    }

    renderButtons(displayButtons) {
        this.dialogLayout.createButtons(displayButtons);
    }

    renderExitButton(exitButton) {
        this.dialogLayout.createExitButton(exitButton);
    }

    renderBottomButtons(bottomButtons) {
        if (!bottomButtons || bottomButtons.length === 0) return;
        this.dialogLayout.createBottomButtons(bottomButtons);
    }

    addElementsToContainer() {
        const containerItems = [];

        // Add layout elements to container
        if (this.dialogLayout) {
            Object.values(this.dialogLayout.elements).forEach(element => {
                if (Array.isArray(element)) {
                    containerItems.push(...element);
                } else if (element) {
                    containerItems.push(element);
                }
            });
        }

        this.dialogContainer.add(containerItems);
        this.dialogContainer.setDepth(2000);
    }

    handleTextPagination(text, textPagination) {
        return resolveDialogTextPage(text, textPagination, {
            calculateTextPages: (textArray) => this.calculateTextPages(textArray)
        });
    }

    /**
     * Calculate pages of text based on line and character limits
     * @param {Array<string>} textArray - Array of text items to paginate
     * @returns {Array<Array<string>>} Array of pages, each containing an array of text items
     */
    calculateTextPages(textArray) {
        return calculateDialogTextPages(textArray);
    }

    handleButtonPagination(buttons, pagination, textPagination) {
        return resolveDialogButtons(buttons, pagination, {
            createPaginationButtons: (nextPagination, totalItems) => this.getPaginationButtons(nextPagination, totalItems)
        });
    }

    handleBottomButtonPagination(bottomButtons, textPagination) {
        return resolveDialogBottomButtons(bottomButtons, textPagination, {
            getTextPaginationButtons: (nextTextPagination) => this.getTextPaginationButtons(nextTextPagination)
        });
    }

    getPaginationButtons(pagination, totalItems = 0) {
        return createDialogPaginationButtons(pagination, {
            totalItems,
            getDialogParams: () => this.getDialogParams(),
            showDialog: (dialogParams) => this.showDialog(dialogParams)
        });
    }

    getTextPaginationButtons(textPagination) {
        return createDialogTextPaginationButtons(textPagination, {
            calculateTextPages: (textArray) => this.calculateTextPages(textArray),
            getDialogParams: () => this.getDialogParams(),
            showDialog: (dialogParams) => this.showDialog(dialogParams)
        });
    }

    getDialogParams() {
        // Return the current dialog parameters for pagination callbacks
        return this.currentDialogParams || {};
    }

    hideDialog() {
        if (this.isDialogOpen) {
            this.scene.isDialogOpen = false;
            this.isDialogOpen = false;
        }

        const isPointerDown = this.isPointerDown();

        // If pointer is still down when dialog closes, ignore subsequent pointer events until release
        if (this.prepareUiInteraction && isPointerDown) {
            this.prepareUiInteraction({ suppressPointer: true });
        } else {
            this.releasePointerSuppression?.();
        }

        // Clear the layout system (elements will be destroyed with container)
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