/**
 * ColumnLayout - A vertical column layout system for stacking UI elements
 * Provides flexible vertical positioning with spacing and alignment options
 */
class ColumnLayout {
    constructor(scene, x, y, width, height, elementSpacing = 10) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.elementSpacing = elementSpacing;

        // Storage for positioned elements
        this.elements = [];
        this.currentY = y;
    }

    /**
     * Add an element to the column
     * @param {Phaser.GameObjects.GameObject} element - The element to add
     * @param {string|number} height - Element height: 'auto', 'fill', or specific number
     * @param {string} hAlign - Horizontal alignment: 'left', 'center', 'right', 'stretch'
     * @param {number} marginTop - Additional top margin for this element
     * @param {number} marginBottom - Additional bottom margin for this element
     */
    addElement(element, height = 'auto', hAlign = 'center', marginTop = 0, marginBottom = 0) {
        // Calculate element height
        let elementHeight;
        if (height === 'auto') {
            elementHeight = element.height || 30; // Default height if not set
        } else if (height === 'fill') {
            // Calculate remaining space and distribute to fill elements
            const remainingSpace = this.calculateRemainingSpace();
            const fillElements = this.elements.filter(item => item.height === 'fill').length + 1;
            elementHeight = remainingSpace / fillElements;
        } else {
            elementHeight = height;
        }

        // Position element horizontally based on alignment
        let elementX = this.x;
        switch (hAlign) {
            case 'left':
                elementX = this.x;
                break;
            case 'center':
                elementX = this.x + (this.width - element.width) / 2;
                break;
            case 'right':
                elementX = this.x + this.width - element.width;
                break;
            case 'stretch':
                elementX = this.x;
                element.setDisplaySize(this.width, elementHeight);
                break;
        }

        // Add spacing and margins
        this.currentY += marginTop;

        // Position the element
        element.setPosition(elementX, this.currentY);

        // Store element info
        this.elements.push({
            element: element,
            height: height,
            hAlign: hAlign,
            marginTop: marginTop,
            marginBottom: marginBottom,
            y: this.currentY
        });

        // Move current Y position for next element
        this.currentY += elementHeight + this.elementSpacing + marginBottom;
    }

    /**
     * Calculate remaining vertical space in the column
     * @returns {number} Remaining space
     */
    calculateRemainingSpace() {
        const usedSpace = this.elements.reduce((total, item) => {
            let height = 0;
            if (typeof item.height === 'number') {
                height = item.height;
            } else if (item.height === 'auto') {
                height = item.element.height || 30;
            }
            return total + height + this.elementSpacing + item.marginTop + item.marginBottom;
        }, 0);

        return Math.max(0, this.height - usedSpace);
    }

    /**
     * Redistribute space for fill elements
     * Call this after adding all elements to properly size fill elements
     */
    redistributeFillSpace() {
        const fillElements = this.elements.filter(item => item.height === 'fill');
        if (fillElements.length === 0) return;

        const remainingSpace = this.calculateRemainingSpace();
        const fillHeight = remainingSpace / fillElements.length;

        fillElements.forEach(item => {
            item.element.setDisplaySize(this.width, fillHeight);
            item.height = fillHeight; // Update stored height
        });

        // Recalculate positions after resizing
        this.recalculatePositions();
    }

    /**
     * Recalculate positions of all elements (useful after resizing)
     */
    recalculatePositions() {
        this.currentY = this.y;

        this.elements.forEach(item => {
            // Reposition horizontally
            let elementX = this.x;
            switch (item.hAlign) {
                case 'left':
                    elementX = this.x;
                    break;
                case 'center':
                    elementX = this.x + (this.width - item.element.width) / 2;
                    break;
                case 'right':
                    elementX = this.x + this.width - item.element.width;
                    break;
                case 'stretch':
                    elementX = this.x;
                    break;
            }

            // Add spacing and margins
            this.currentY += item.marginTop;

            // Reposition element
            item.element.setPosition(elementX, this.currentY);
            item.y = this.currentY;

            // Move current Y position
            this.currentY += item.element.height + this.elementSpacing + item.marginBottom;
        });
    }

    /**
     * Remove an element from the column
     * @param {Phaser.GameObjects.GameObject} element - The element to remove
     */
    removeElement(element) {
        const index = this.elements.findIndex(item => item.element === element);
        if (index !== -1) {
            this.elements.splice(index, 1);
            this.recalculatePositions();
        }
    }

    /**
     * Clear all elements from the column
     */
    clear() {
        this.elements.forEach(item => {
            if (item.element && item.element.destroy) {
                item.element.destroy();
            }
        });
        this.elements = [];
        this.currentY = this.y;
    }

    /**
     * Get the current bottom position of the column
     * @returns {number} Current Y position
     */
    getCurrentY() {
        return this.currentY;
    }
}

export default ColumnLayout;