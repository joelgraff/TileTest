
import DialogSystem from './dialogSystem.js';
import InventoryManager from './inventoryManager.js';
import QuestDialogManager from './questDialogManager.js';
import HelpManager from './helpManager.js';
import MovementIndicator from './MovementIndicator.js';


class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;

        this.createUI();

        // DialogSystem instance
        this.dialogSystem = new DialogSystem(scene);

        // Specialized managers
        this.inventoryManager = new InventoryManager(scene, this);
        this.questDialogManager = new QuestDialogManager(scene, this);
        this.helpManager = new HelpManager(scene, this);

        // Movement indicator (reticle)
        this.movementIndicator = new MovementIndicator(scene);
    }

    // Movement indicator (reticle)
    showMovementIndicator(x, y) {
        this.movementIndicator.show(x, y);
    }

    hideMovementIndicator() {
        this.movementIndicator.hide();
    }

    // Call this from InputManager after pointerdown/up events
    handlePointerMove(screenX, screenY, isDown) {
        this.movementIndicator.handlePointerMove(screenX, screenY, isDown);
    }

    createUI() {
        // Create score display
        this.createScoreDisplay();

        // Create inventory button
        this.createInventoryButton();

        // Create quest button
        this.createQuestButton();

        // Create help button
        this.createHelpButton();

        // Create version display
        this.createVersionDisplay();
    }

    createScoreDisplay() {
        this.scoreBackground = this.scene.add.rectangle(100, 25, 180, 40, 0x808080)
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, 0xFFFFFF);  // White border to match buttons

        this.scoreText = this.scene.add.text(100, 25, 'SCORE: 0', {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
    }

    createInventoryButton() {
        this.invButton = this.scene.add.rectangle(720, 60, 80, 30, 0x808080)  // Moved to right edge, below QUESTS
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, 0xFFFFFF)  // White border
            .setInteractive({ cursor: 'pointer' });

        this.invButtonText = this.scene.add.text(720, 60, 'PACK', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);

        this.invButton.on('pointerover', () => {
            this.invButton.setFillStyle(0xC0C0C0);
        });

        this.invButton.on('pointerout', () => {
            this.invButton.setFillStyle(0x808080);
        });

        this.invButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            // Clear any existing input state to prevent player movement
            if (this.scene.inputManager) {
                this.scene.inputManager.target = null;
                this.scene.inputManager.isDragging = false;
                this.scene.inputManager.direction = { x: 0, y: 0 };
            }
            this.toggleInventory();
        });
    }

    createQuestButton() {
        this.questButton = this.scene.add.rectangle(720, 25, 80, 30, 0x808080)  // Moved to right edge, top position
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, 0xFFFFFF)  // White border
            .setInteractive({ cursor: 'pointer' });

        this.questButtonText = this.scene.add.text(720, 25, 'QUESTS', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);

        this.questButton.on('pointerover', () => {
            this.questButton.setFillStyle(0xC0C0C0);
        });

        this.questButton.on('pointerout', () => {
            this.questButton.setFillStyle(0x808080);
        });

        this.questButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            // Clear any existing input state to prevent player movement
            if (this.scene.inputManager) {
                this.scene.inputManager.target = null;
                this.scene.inputManager.isDragging = false;
                this.scene.inputManager.direction = { x: 0, y: 0 };
            }
            this.toggleQuests();
        });
    }

    createHelpButton() {
        this.helpButton = this.scene.add.rectangle(720, 95, 80, 30, 0x808080)  // Below PACK button
            .setScrollFactor(0)
            .setDepth(100)
            .setStrokeStyle(2, 0xFFFFFF)  // White border
            .setInteractive({ cursor: 'pointer' });

        this.helpButtonText = this.scene.add.text(720, 95, 'HELP', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);

        this.helpButton.on('pointerover', () => {
            this.helpButton.setFillStyle(0xC0C0C0);
        });

        this.helpButton.on('pointerout', () => {
            this.helpButton.setFillStyle(0x808080);
        });

        this.helpButton.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            // Clear any existing input state to prevent player movement
            if (this.scene.inputManager) {
                this.scene.inputManager.target = null;
                this.scene.inputManager.isDragging = false;
                this.scene.inputManager.direction = { x: 0, y: 0 };
            }
            this.toggleHelp();
        });
    }

    createVersionDisplay() {
        this.versionText = this.scene.add.text(10, 620, 'Version 1.6', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            align: 'left'
        })
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(100);
    }

    // Inventory Management - delegated to InventoryManager
    addItem(item) {
        return this.inventoryManager.addItem(item);
    }

    getInventory() {
        return this.inventoryManager.getInventory();
    }

    toggleInventory() {
        this.inventoryManager.toggleInventory();
    }

    toggleQuests() {
        this.questDialogManager.toggleQuests();
    }

    toggleHelp() {
        this.helpManager.toggleHelp();
    }

    showQuestCompletion(quest) {
        this.questDialogManager.showQuestCompletion(quest);
    }

    // Score Management
    updateScore(points) {
        this.score += points;
        this.scoreText.setText(`SCORE: ${this.score}`);
    }

    getScore() {
        return this.score;
    }

    // Dialog System (delegated to DialogSystem)
    showDialog(dialogData) {
        // Pass dialogData directly to DialogSystem
        this.dialogSystem.showDialog(dialogData);
    }

    closeDialog() {
        this.dialogSystem.hideDialog();
    }

    // Input handling for UI
    handleInput(key) {
        // Delegate to specialized managers
        if (this.inventoryManager.handleInput(key)) return;
        if (this.questDialogManager.handleInput(key)) return;
        if (this.helpManager.handleInput(key)) return;

        // Handle ESC key for closing dialogs
        if (key === 'ESCAPE') {
            // Close any open dialog first
            if (this.scene.isDialogOpen) {
                this.closeDialog();
                // Reset panel states when dialog is closed via ESC
                this.inventoryManager.isInventoryOpen = false;
                this.questDialogManager.isQuestsOpen = false;
                this.helpManager.isHelpOpen = false;
            }
        }
    }
}

export default UIManager;