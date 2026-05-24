export function resolveDialogButtons(buttons, pagination, { createPaginationButtons = () => [] } = {}) {
    let displayButtons = buttons;

    if (pagination) {
        const { currentPage, itemsPerPage } = pagination;
        const startIndex = currentPage * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, buttons.length);

        displayButtons = buttons.slice(startIndex, endIndex);
        displayButtons = displayButtons.concat(createPaginationButtons(pagination, buttons.length));
    }

    return displayButtons;
}

export function resolveDialogBottomButtons(bottomButtons, textPagination, { getTextPaginationButtons = () => [] } = {}) {
    let displayBottomButtons = bottomButtons || [];

    if (textPagination) {
        displayBottomButtons = displayBottomButtons.concat(getTextPaginationButtons(textPagination));
    }

    return displayBottomButtons;
}

export function createDialogPaginationButtons(
    pagination,
    { totalItems = 0, getDialogParams = () => ({}), showDialog = () => {} } = {}
) {
    const buttons = [];

    if (!pagination) {
        return buttons;
    }

    const { currentPage = 0, itemsPerPage = 0 } = pagination;
    const totalPages = itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 0;

    if (totalPages > 1) {
        buttons.push({
            label: '<',
            disabled: currentPage <= 0,
            onClick: currentPage > 0
                ? () => showDialog({ ...getDialogParams(), pagination: { ...pagination, currentPage: currentPage - 1 } })
                : () => {}
        });
        buttons.push({
            label: '>',
            disabled: currentPage >= totalPages - 1,
            onClick: currentPage < totalPages - 1
                ? () => showDialog({ ...getDialogParams(), pagination: { ...pagination, currentPage: currentPage + 1 } })
                : () => {}
        });
    }

    return buttons;
}

export function createDialogTextPaginationButtons(
    textPagination,
    { calculateTextPages = () => [], getDialogParams = () => ({}), showDialog = () => {} } = {}
) {
    const buttons = [];

    if (textPagination && Array.isArray(textPagination.text)) {
        const { currentPage = 0, text } = textPagination;
        const pages = calculateTextPages(text);
        const totalPages = pages.length;

        if (totalPages > 1) {
            buttons.push({
                label: '<',
                disabled: currentPage <= 0,
                onClick: currentPage > 0
                    ? () => showDialog({ ...getDialogParams(), textPagination: { ...textPagination, currentPage: currentPage - 1 } })
                    : () => {}
            });
            buttons.push({
                label: '>',
                disabled: currentPage >= totalPages - 1,
                onClick: currentPage < totalPages - 1
                    ? () => showDialog({ ...getDialogParams(), textPagination: { ...textPagination, currentPage: currentPage + 1 } })
                    : () => {}
            });
        }
    }

    return buttons;
}