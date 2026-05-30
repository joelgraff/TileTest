import CONFIG from './config.js';

function normalizeDialogText(displayText) {
    if (Array.isArray(displayText)) {
        return displayText.join('\n');
    }

    return displayText ?? '';
}

function resolveDialogImageSource(imageKey) {
    if (!imageKey) {
        return null;
    }

    return imageKey.includes('/')
        ? imageKey
        : `${CONFIG.PATHS.ASSETS}/${imageKey}${CONFIG.PATHS.IMAGE_EXTENSION}`;
}

function createDialogButton(documentRef, buttonData, className = 'dom-dialog-button') {
    const button = documentRef.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = buttonData.label ?? 'Close';
    button.disabled = Boolean(buttonData.disabled);
    button.addEventListener('click', event => {
        if (button.disabled) {
            event.preventDefault?.();
            event.stopPropagation?.();
            return;
        }

        event.preventDefault?.();
        event.stopPropagation?.();
        buttonData.onClick?.();
    });

    return button;
}

export function renderDomDialogSurface(
    manager,
    {
        imageKey = null,
        title = '',
        text = '',
        buttons = [],
        itemButtons = [],
        exitButton = null,
        pagination = null,
        bottomButtons = null,
        textPagination = null
    } = {},
    { documentRef = globalThis.document } = {}
) {
    const overlayRoot = manager.getOverlayRoot?.(documentRef) ?? documentRef?.getElementById?.('ui-overlay-root');

    if (!overlayRoot || !documentRef?.createElement) {
        return null;
    }

    const displayItemButtons = Array.isArray(itemButtons) ? itemButtons : [];

    const dialogRoot = documentRef.createElement('div');
    dialogRoot.className = 'dom-dialog-backdrop';
    dialogRoot.dataset.dialogSurface = 'dom';

    const dialogPanel = documentRef.createElement('section');
    dialogPanel.className = 'dom-dialog-panel';
    dialogPanel.setAttribute('role', 'dialog');
    dialogPanel.setAttribute('aria-modal', 'true');
    dialogPanel.setAttribute('aria-label', title || 'Dialog');
    dialogPanel.addEventListener('click', event => {
        event.stopPropagation?.();
    });

    if (title) {
        const titleElement = documentRef.createElement('h2');
        titleElement.className = 'dom-dialog-title';
        titleElement.textContent = title;
        dialogPanel.append(titleElement);
    }

    const textElement = documentRef.createElement('div');
    textElement.className = 'dom-dialog-text';
    textElement.textContent = normalizeDialogText(
        manager.handleTextPagination?.(text, textPagination) ?? text
    );

    const imageSource = resolveDialogImageSource(imageKey);

    if (imageSource) {
        const contentRow = documentRef.createElement('div');
        contentRow.className = 'dom-dialog-content';

        const mediaElement = documentRef.createElement('div');
        mediaElement.className = 'dom-dialog-media';

        const imageElement = documentRef.createElement('img');
        imageElement.className = 'dom-dialog-image';
        imageElement.src = imageSource;
        imageElement.alt = title ? `${title} portrait` : 'Dialog portrait';

        mediaElement.append(imageElement);
        if (displayItemButtons.length > 0) {
            const bodyElement = documentRef.createElement('div');
            bodyElement.className = 'dom-dialog-body dom-dialog-body-centered';
            bodyElement.append(textElement);

            const itemList = documentRef.createElement('div');
            itemList.className = 'dom-dialog-item-list';

            displayItemButtons.forEach(buttonData => {
                itemList.append(createDialogButton(documentRef, buttonData, 'dom-dialog-button dom-dialog-item-button'));
            });

            bodyElement.append(itemList);
            contentRow.className = 'dom-dialog-content dom-dialog-content-with-items';
            contentRow.append(mediaElement, bodyElement);
        } else {
            contentRow.append(mediaElement, textElement);
        }

        dialogPanel.append(contentRow);
    } else {
        dialogPanel.append(textElement);

        if (displayItemButtons.length > 0) {
            const itemList = documentRef.createElement('div');
            itemList.className = 'dom-dialog-item-list';

            displayItemButtons.forEach(buttonData => {
                itemList.append(createDialogButton(documentRef, buttonData, 'dom-dialog-button dom-dialog-item-button'));
            });

            dialogPanel.append(itemList);
        }
    }

    const displayButtons = manager.handleButtonPagination?.(buttons, pagination, textPagination) ?? buttons;
    const displayBottomButtons = manager.handleBottomButtonPagination?.(bottomButtons, textPagination) ?? bottomButtons;
    const actionButtons = [
        ...(Array.isArray(displayButtons) ? displayButtons : []),
        ...(Array.isArray(displayBottomButtons) ? displayBottomButtons : []),
        ...(exitButton ? [exitButton] : [])
    ];

    if (actionButtons.length > 0) {
        const actionBar = documentRef.createElement('div');
        actionBar.className = 'dom-dialog-actions';
        actionButtons.forEach(buttonData => {
            actionBar.append(createDialogButton(documentRef, buttonData));
        });
        dialogPanel.append(actionBar);
    }

    const dismissDialog = () => {
        if (exitButton?.onClick) {
            exitButton.onClick();
            return;
        }

        manager.hideDialog?.();
    };

    dialogRoot.addEventListener('click', dismissDialog);
    dialogRoot.append(dialogPanel);
    overlayRoot.append(dialogRoot);
    manager.domDialogRoot = dialogRoot;

    return dialogRoot;
}