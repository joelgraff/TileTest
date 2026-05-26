import { renderDomDialogSurface } from './domDialogSurface.js';
import {
    createDialogPaginationButtons,
    createDialogTextPaginationButtons,
    resolveDialogBottomButtons,
    resolveDialogButtons
} from './dialogButtonPagination.js';
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
        this.domDialogRoot = null;
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

    getOverlayRoot(documentRef = globalThis.document) {
        return documentRef?.getElementById?.('ui-overlay-root') ?? null;
    }

    showDialog(dialogParams = {}) {
        const {
            renderMode = 'dom'
        } = dialogParams;

        if (this.isDialogOpen) {
            this.hideDialog();
        }

        this.scene.isDialogOpen = true;
        this.isDialogOpen = true;
        this.currentDialogParams = { ...dialogParams };

        // Clear any existing input state to prevent player movement
        this.prepareUiInteraction?.();

        if (renderMode !== 'dom') {
            throw new Error(`Unsupported dialog render mode: ${renderMode}`);
        }

        const dialogRoot = renderDomDialogSurface(this, dialogParams);

        if (!dialogRoot) {
            throw new Error('DOM overlay root is not available.');
        }

        return dialogRoot;
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

        if (this.domDialogRoot) {
            this.domDialogRoot.remove?.();
            this.domDialogRoot = null;
        }
    }
}

export default DialogManager;