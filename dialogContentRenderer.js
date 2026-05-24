export function renderDialogImageContent(manager, { imageKey, dialogWidth }) {
    if (!imageKey) return null;

    const npcImage = manager.scene.add.image(0, 0, imageKey)
        .setDisplaySize(dialogWidth / 6, dialogWidth / 6)
        .setOrigin(0.5, 0.5);

    manager.dialogLayout.setImage(npcImage);

    return npcImage;
}

export function renderDialogTextContent(manager, { displayText, dialogWidth }) {
    const textAreaWidth = Math.floor(2 * dialogWidth / 3 - 16);
    const targetWidth = Math.min(textAreaWidth, 389);

    const dialogText = manager.scene.add.text(0, 0, displayText, {
        fontSize: '18px',
        fontStyle: 'bold',
        wordWrap: { width: targetWidth },
        color: '#000',
        align: 'left'
    }).setOrigin(0, 0);

    manager.dialogLayout.setText(dialogText);

    return dialogText;
}