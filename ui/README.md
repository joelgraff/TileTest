# UI Layout System

A custom, open-source layout system for Phaser 3 dialogs providing flexible grid and column-based positioning.

## Overview

This layout system provides three main components:

- **GridLayout**: Grid-based positioning with cell spanning
- **ColumnLayout**: Vertical column stacking with flexible sizing
- **DialogLayout**: Orchestrates layouts for complete dialog positioning

## Components

### GridLayout

Provides grid-based positioning where elements can span multiple cells.

```javascript
import { GridLayout } from './ui/index.js';

const grid = new GridLayout(scene, x, y, width, height, rows, cols, padding);

// Add element at row 0, col 1, spanning 1x2 cells
grid.addElement(button, 0, 1, 1, 2, 'center', 'middle');
```

### ColumnLayout

Provides vertical stacking of elements with flexible sizing options.

```javascript
import { ColumnLayout } from './ui/index.js';

const column = new ColumnLayout(scene, x, y, width, height, spacing);

// Add elements with different sizing options
column.addElement(title, 'auto', 'center');
column.addElement(content, 'fill', 'left'); // Fills remaining space
column.addElement(button, 50, 'center'); // Fixed height
```

### DialogLayout

Main layout manager that orchestrates grid and column layouts for complete dialogs.

```javascript
import { DialogLayout } from './ui/index.js';

const dialogLayout = new DialogLayout(scene, dialogX, dialogY, dialogWidth, dialogHeight);

// Set dialog components
dialogLayout.setTitle(titleText);
dialogLayout.setImage(npcImage);
dialogLayout.setText(dialogText);
dialogLayout.setButtons(buttonArray);
dialogLayout.setBottomButtons(paginationButtons);
dialogLayout.setExitButton(backButton);
```

## Key Features

- **Flexible Positioning**: Grid-based and column-based layouts
- **Cell Spanning**: Elements can span multiple grid cells
- **Alignment Options**: Left, center, right, top, middle, bottom alignment
- **Flexible Sizing**: Auto, fill, and fixed sizing options
- **Responsive**: Adapts to different dialog sizes
- **Open Source**: MIT licensed, no external dependencies

## Usage in DialogManager

The DialogLayout class is designed to replace manual positioning in the existing DialogManager, providing:

- Consistent button positioning
- Flexible content layout
- Easy responsive design
- Maintainable layout logic

## Migration Path

1. Import DialogLayout in DialogManager
2. Replace manual positioning with layout system calls
3. Test with existing dialog configurations
4. Extend for new layout requirements

## Examples

### Simple Button Grid
```javascript
const buttonGrid = dialogLayout.createButtonGrid(20, 200, 400, 100, 2, 4);
buttons.forEach((button, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    buttonGrid.addElement(button, row, col);
});
```

### Content Column
```javascript
const contentColumn = dialogLayout.createColumn(120, 50, 300, 200);
contentColumn.addElement(image, 80, 'center');
contentColumn.addElement(text, 'fill', 'left');
contentColumn.addElement(actions, 'auto', 'center');
```