function normalizeDialogText(displayText) {
    if (Array.isArray(displayText)) {
        return displayText.join('\n');
    }

    return displayText ?? '';
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
        title = '',
        text = '',
        buttons = [],
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
    dialogPanel.append(textElement);

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