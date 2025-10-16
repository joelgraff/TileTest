/**
 * ContentProcessor - Handles text processing and pagination for dialog content
 */
class ContentProcessor {
    constructor(maxLines = 15) {
        this.maxLines = maxLines;
    }

    /**
     * Process text content into pages based on max lines
     * @param {string} text - Raw text content
     * @param {number} maxLines - Maximum lines per page (optional override)
     * @returns {Array<string>} Array of page texts
     */
    paginateText(text, maxLines = null) {
        const linesPerPage = maxLines || this.maxLines;
        const lines = text.split('\n');
        const pages = [];

        for (let i = 0; i < lines.length; i += linesPerPage) {
            const pageLines = lines.slice(i, i + linesPerPage);
            pages.push(pageLines.join('\n'));
        }

        return pages;
    }

    /**
     * Get pagination info for content
     * @param {string} text - Text content
     * @param {number} maxLines - Maximum lines per page
     * @returns {Object} Pagination info with totalPages, currentPage, etc.
     */
    getPaginationInfo(text, maxLines = null) {
        const linesPerPage = maxLines || this.maxLines;
        const lines = text.split('\n');
        const totalPages = Math.ceil(lines.length / linesPerPage);

        return {
            totalPages,
            totalLines: lines.length,
            linesPerPage,
            hasMultiplePages: totalPages > 1
        };
    }

    /**
     * Extract a specific page from paginated content
     * @param {string} text - Full text content
     * @param {number} pageIndex - Zero-based page index
     * @param {number} maxLines - Maximum lines per page
     * @returns {string} Text for the specified page
     */
    getPage(text, pageIndex, maxLines = null) {
        const linesPerPage = maxLines || this.maxLines;
        const lines = text.split('\n');
        const startLine = pageIndex * linesPerPage;
        const endLine = startLine + linesPerPage;
        const pageLines = lines.slice(startLine, endLine);

        return pageLines.join('\n');
    }
}

export default ContentProcessor;