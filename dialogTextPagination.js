export function calculateDialogTextPages(textArray) {
    const pages = [];
    const maxLinesPerPage = 8;
    const charsPerLine = 36;
    const maxCharsPerPage = maxLinesPerPage * charsPerLine;

    let currentPage = [];
    let currentChars = 0;

    for (const item of textArray) {
        const itemChars = item.length + 2;

        if (currentChars + itemChars > maxCharsPerPage && currentPage.length > 0) {
            pages.push([...currentPage]);
            currentPage = [];
            currentChars = 0;
        }

        if (itemChars > maxCharsPerPage) {
            if (currentPage.length > 0) {
                pages.push([...currentPage]);
                currentPage = [];
                currentChars = 0;
            }
            pages.push([item]);
            continue;
        }

        currentPage.push(item);
        currentChars += itemChars;

        if (currentChars >= maxCharsPerPage) {
            pages.push([...currentPage]);
            currentPage = [];
            currentChars = 0;
        }
    }

    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    return pages;
}

export function resolveDialogTextPage(text, textPagination, { calculateTextPages = calculateDialogTextPages } = {}) {
    let displayText = text;

    if (textPagination && Array.isArray(text)) {
        const { currentPage = 0 } = textPagination;
        const pages = calculateTextPages(text);

        if (currentPage < pages.length) {
            displayText = pages[currentPage].join('\n\n');
        }
    }

    return displayText;
}