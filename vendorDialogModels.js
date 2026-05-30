import {
    createVendorAnnouncementLines,
    createVendorClueLine,
    createVendorFeaturedItemLines
} from './vendorContentProfile.js';

function getVendorResponses(vendorData) {
    return Array.isArray(vendorData.responses)
        ? vendorData.responses
        : vendorData.dialog?.responses ?? [];
}

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

function appendVendorAuthoredLines(textLines, vendorData) {
    const featuredItems = createVendorFeaturedItemLines(vendorData);
    const announcements = createVendorAnnouncementLines(vendorData);
    const clueText = createVendorClueLine(vendorData);

    if (featuredItems.length > 0) {
        textLines.push('', 'Featured:', ...featuredItems);
    }

    if (announcements.length > 0) {
        textLines.push('', 'Announcements:', ...announcements);
    }

    if (clueText) {
        textLines.push('', `Clue: ${clueText}`);
    }
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
    const resolvedDomainName = domainName ?? vendorData.domainName;
    const textLines = [
        `Booth: ${vendorData.booth}`,
        `Description: ${vendorData.description}`,
        `Domain: ${resolvedDomainName}`
    ];
    appendVendorAuthoredLines(textLines, vendorData);

    return {
        renderMode: 'dom',
        imageKey,
        title: vendorData.name,
        text: textLines.join('\n'),
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
        buttons: [],
        itemButtons,
        bottomButtons,
        exitButton
    };
}

export function createVendorResponseButtons(vendorData, { imageKey, originalDialogData, handleVendorResponse }) {
    return getVendorResponses(vendorData)
        .filter(response => response.action !== 'end' && response.text !== 'Tell me about your booth')
        .map(response => ({
            label: response.text,
            onClick: () => handleVendorResponse(response, vendorData, imageKey, originalDialogData)
        }));
}

export function createVendorExitButton(vendorData, { closeDialog }) {
    const exitResponse = vendorData.exitResponse ?? getVendorResponses(vendorData).find(response => response.action === 'end');

    return exitResponse ? {
        label: exitResponse.text,
        onClick: () => closeDialog?.()
    } : null;
}

export function createVendorRootDialogData(vendorData, { imageKey, buttons, exitButton }) {
    const textLines = [vendorData.description];
    appendVendorAuthoredLines(textLines, vendorData);

    return {
        renderMode: 'dom',
        imageKey,
        title: vendorData.name,
        text: textLines.join('\n'),
        buttons,
        exitButton
    };
}