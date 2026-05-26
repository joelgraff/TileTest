export function createVendorReturnButton(dialogData, { showDialog, label = 'Back' }) {
    return {
        label,
        onClick: () => showDialog?.(dialogData)
    };
}

export function createVendorMessageDialogData(text, { returnButton }) {
    return {
        renderMode: 'dom',
        text,
        buttons: [returnButton]
    };
}

export function createVendorContinueDialogData(message, { onContinue }) {
    return {
        renderMode: 'dom',
        text: message,
        buttons: [{
            label: 'Continue',
            onClick: onContinue
        }]
    };
}

export function createVendorBoothInfoDialogData(vendorData, imageKey, { domainName, returnButton }) {
    return {
        renderMode: 'dom',
        imageKey,
        title: vendorData.name,
        text: `Booth: ${vendorData.booth}\nDescription: ${vendorData.description}\nDomain: ${domainName}`,
        buttons: [returnButton]
    };
}

export function createVendorFactsDialogData(vendorData, imageKey, { formattedFacts, exitButton }) {
    return {
        renderMode: 'dom',
        imageKey,
        title: vendorData.name,
        text: formattedFacts,
        textPagination: {
            currentPage: 0,
            text: formattedFacts
        },
        buttons: [],
        exitButton
    };
}

export function createVendorItemsDialogData(vendorData, imageKey, {
    page,
    totalPages,
    domainName,
    itemButtons,
    bottomButtons,
    exitButton
}) {
    return {
        renderMode: 'dom',
        imageKey,
        title: vendorData.name,
        text: `Available items from ${domainName} (Page ${page + 1}/${totalPages}):`,
        buttons: itemButtons,
        bottomButtons,
        exitButton
    };
}

export function createVendorResponseButtons(vendorData, { imageKey, originalDialogData, handleVendorResponse }) {
    return vendorData.dialog.responses
        .filter(response => response.action !== 'end' && response.text !== 'Tell me about your booth')
        .map(response => ({
            label: response.text,
            onClick: () => handleVendorResponse(response, vendorData, imageKey, originalDialogData)
        }));
}

export function createVendorExitButton(vendorData, { closeDialog }) {
    const exitResponse = vendorData.dialog.responses.find(response => response.action === 'end');

    return exitResponse ? {
        label: exitResponse.text,
        onClick: () => closeDialog?.()
    } : null;
}

export function createVendorRootDialogData(vendorData, { imageKey, buttons, exitButton }) {
    return {
        renderMode: 'dom',
        imageKey,
        title: vendorData.name,
        text: vendorData.description,
        buttons,
        exitButton
    };
}