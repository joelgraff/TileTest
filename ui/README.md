# UI Component System

A collection of specialized UI components for Phaser 3 dialogs providing flexible asset creation, button management, and content processing.

## Overview

This UI system provides three main components:

- **AssetFactory**: Creates and manages dialog assets (images, text, containers)
- **ButtonFactory**: Handles button creation with consistent styling and interaction
- **ContentProcessor**: Processes and formats dialog content for display

## Components

### AssetFactory

Provides asset creation and management for dialog components.

```javascript
import { AssetFactory } from './ui/index.js';

const assetFactory = new AssetFactory(scene);

// Create various dialog assets
const titleText = assetFactory.createTitle('Dialog Title');
const npcImage = assetFactory.createImage('npc1', 64, 64);
const dialogText = assetFactory.createText('Hello world!', 200, 100);
```

