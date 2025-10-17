/**
 * ContentProcessor - Handles text processing and pagination for dialog content
 */
class ContentProcessor {
    constructor(maxLines = 9) {
        this.maxLines = maxLines;
    }

    /**
     * Process text content into pages where each page contains at most one subtopic
     * @param {string} text - Raw text content
     * @param {number} maxLines - Maximum logical lines per page (optional override)
     * @returns {Array<string>} Array of page texts
     */
    paginateText(text, maxLines = null) {
        const MAX_LINES = maxLines || this.maxLines;
        const lines = text.split('\n');
        const pages = [];

        // Helper: Check if line is a subtopic header
        const isHeader = (line) => {
            const trimmed = line.trim();
            // Headers are ALL CAPS lines (converted from markdown # and ##)
            return trimmed && trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes('•') && !trimmed.match(/^\d/);
        };

        let currentPageLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isLineHeader = isHeader(line);

            // If this is a header and we already have content on the current page,
            // start a new page with this header
            if (isLineHeader && currentPageLines.length > 0) {
                pages.push(currentPageLines.join('\n'));
                currentPageLines = [line];
            } else {
                // Add the line to current page
                currentPageLines.push(line);

                // Check if we've exceeded the maximum lines per page
                if (currentPageLines.length >= MAX_LINES) {
                    pages.push(currentPageLines.join('\n'));
                    currentPageLines = [];
                }
            }
            console.log('Current page lines:', currentPageLines);
            console.log('Processing line:', line);
            console.log('Current pages:', pages);
        }

        // Add any remaining content
        if (currentPageLines.length > 0) {
            pages.push(currentPageLines.join('\n'));
        }

        console.log('Paginated into', pages.length, 'pages.');
        console.log(pages);
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

    /**
     * Parse markdown content into formatted text lines
     * @param {string} markdown - Markdown content
     * @returns {Array<string>} Array of formatted text lines
     */
    parseMarkdown(markdown) {
        const lines = markdown.split('\n');
        const result = [];

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed) {
                // Skip blank lines from input markdown
                continue;
            } else if (trimmed.startsWith('# ')) {
                // Main header (H1) - convert to all caps
                result.push(trimmed.substring(2).toUpperCase());
                result.push(''); // Add blank line after header
            } else if (trimmed.startsWith('## ')) {
                // Sub header (H2) - convert to all caps
                result.push(trimmed.substring(3).toUpperCase());
                result.push(''); // Add blank line after header
            } else if (trimmed.startsWith('- ')) {
                // Bullet point
                result.push('• ' + trimmed.substring(2));
            } else if (/^\d+\.\s/.test(trimmed)) {
                // Numbered list (keep as is)
                result.push(trimmed);
            } else {
                // Regular paragraph text
                result.push(trimmed);
            }
        }

        return result;
    }

    /**
     * Load and parse help content from markdown
     * @param {string} markdownContent - Raw markdown content
     * @returns {Object} Parsed help topics
     */
    parseHelpMarkdown(markdownContent) {
        const topics = {};
        const sections = markdownContent.split(/^# /m);

        for (let i = 1; i < sections.length; i++) {
            const section = sections[i];
            const lines = section.split('\n');
            const title = lines[0].trim();

            // Parse the content of this section
            const contentMarkdown = lines.slice(1).join('\n');
            const contentLines = this.parseMarkdown(contentMarkdown);

            // Create topic key from title (lowercase, replace spaces with underscores)
            const topicKey = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

            topics[topicKey] = {
                title: title,
                content: contentLines
            };
        }

        return { topics };
    }
}

export default ContentProcessor;