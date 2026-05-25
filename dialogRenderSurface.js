import { DialogLayout } from './ui/index.js';

export function renderDialogSurface(
    manager,
    { imageKey, title = '', text = '', buttons = [], exitButton = null, pagination = null, bottomButtons = null, textPagination = null },
    { DialogLayoutClass = DialogLayout } = {}
) {
    const cam = manager.scene.cameras.main;
    const dialogWidth = Math.min(manager.isMobile ? 400 : 600, cam.width * (manager.isMobile ? 0.9 : 0.85));
    const dialogHeight = Math.min(manager.isMobile ? 260 : 340, cam.height * (manager.isMobile ? 0.8 : 0.65));

    manager.currentDialogParams = { imageKey, title, text, buttons, exitButton, pagination, bottomButtons, textPagination };
    manager.dialogLayout = new DialogLayoutClass(
        manager.scene,
        cam.width / 2,
        cam.height - dialogHeight / 2 - 16,
        dialogWidth,
        dialogHeight,
        { prepareUiInteraction: manager.prepareUiInteraction }
    );
    manager.overlay = manager.createOverlay(cam);
    manager.dialogContainer = manager.createContainer(cam, dialogWidth, dialogHeight);

    manager.renderBackground(dialogWidth, dialogHeight);
    manager.renderTitleBar(title, dialogWidth, dialogHeight);
    manager.renderNpcImage(imageKey, dialogWidth, dialogHeight);
    manager.renderDialogText(manager.handleTextPagination(text, textPagination), dialogWidth, dialogHeight);
    manager.renderButtons(manager.handleButtonPagination(buttons, pagination, textPagination));
    manager.renderBottomButtons(manager.handleBottomButtonPagination(bottomButtons, textPagination));
    manager.renderExitButton(exitButton);
    manager.addElementsToContainer();
}