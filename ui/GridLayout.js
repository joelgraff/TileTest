/**
 * GridLayout - A flexible grid-based layout system for Phaser 3 UI elements
 * Provides grid-based positioning with support for spanning multiple cells
 */
class GridLayout {
    constructor(scene, x, y, width, height, rows, cols, cellPadding = 5) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rows = rows;
        this.cols = cols;
        this.cellPadding = cellPadding;

        // Calculate cell dimensions
        this.cellWidth = (width - (cellPadding * (cols + 1))) / cols;
        this.cellHeight = (height - (cellPadding * (rows + 1))) / rows;

        // Storage for positioned elements
        this.elements = [];
    }

    /**
     * Add an element to the grid at specified position
     * @param {Phaser.GameObjects.GameObject} element - The element to position
     * @param {number} row - Starting row (0-based)
     * @param {number} col - Starting column (0-based)
     * @param {number} spanRows - How many rows to span (default: 1)
     * @param {number} spanCols - How many columns to span (default: 1)
     * @param {string} hAlign - Horizontal alignment within cell: 'left', 'center', 'right'
     * @param {string} vAlign - Vertical alignment within cell: 'top', 'middle', 'bottom'
     */
    addElement(element, row, col, spanRows = 1, spanCols = 1, hAlign = 'center', vAlign = 'middle') {
        // Validate bounds
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            console.warn('GridLayout: Element position out of bounds');
            return;
        }

        // Calculate cell position and size
        const cellX = this.x + this.cellPadding + (col * (this.cellWidth + this.cellPadding));
        const cellY = this.y + this.cellPadding + (row * (this.cellHeight + this.cellPadding));
        const cellWidth = (spanCols * this.cellWidth) + ((spanCols - 1) * this.cellPadding);
        const cellHeight = (spanRows * this.cellHeight) + ((spanRows - 1) * this.cellPadding);

        // Calculate element position within cell based on alignment
        let elementX = cellX;
        let elementY = cellY;

        switch (hAlign) {
            case 'left':
                elementX = cellX;
                break;
            case 'center':
                elementX = cellX + (cellWidth - element.width) / 2;
                break;
            case 'right':
                elementX = cellX + cellWidth - element.width;
                break;
        }

        switch (vAlign) {
            case 'top':
                elementY = cellY;
                break;
            case 'middle':
                elementY = cellY + (cellHeight - element.height) / 2;
                break;
            case 'bottom':
                elementY = cellY + cellHeight - element.height;
                break;
        }

        // Position the element
        element.setPosition(elementX, elementY);

        // Store element info for potential future use
        this.elements.push({
            element: element,
            row: row,
            col: col,
            spanRows: spanRows,
            spanCols: spanCols,
            cellX: cellX,
            cellY: cellY,
            cellWidth: cellWidth,
            cellHeight: cellHeight
        });
    }

    /**
     * Remove an element from the grid
     * @param {Phaser.GameObjects.GameObject} element - The element to remove
     */
    removeElement(element) {
        const index = this.elements.findIndex(item => item.element === element);
        if (index !== -1) {
            this.elements.splice(index, 1);
        }
    }

    /**
     * Clear all elements from the grid
     */
    clear() {
        this.elements.forEach(item => {
            if (item.element && item.element.destroy) {
                item.element.destroy();
            }
        });
        this.elements = [];
    }

    /**
     * Get cell bounds for a specific position
     * @param {number} row
     * @param {number} col
     * @param {number} spanRows
     * @param {number} spanCols
     * @returns {Object} Bounds object with x, y, width, height
     */
    getCellBounds(row, col, spanRows = 1, spanCols = 1) {
        const cellX = this.x + this.cellPadding + (col * (this.cellWidth + this.cellPadding));
        const cellY = this.y + this.cellPadding + (row * (this.cellHeight + this.cellPadding));
        const cellWidth = (spanCols * this.cellWidth) + ((spanCols - 1) * this.cellPadding);
        const cellHeight = (spanRows * this.cellHeight) + ((spanRows - 1) * this.cellPadding);

        return {
            x: cellX,
            y: cellY,
            width: cellWidth,
            height: cellHeight
        };
    }
}

export default GridLayout;