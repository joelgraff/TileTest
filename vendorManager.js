// Vendor Manager for handling vendor interactions and dialog in VCF Quest
class VendorManager {
    constructor(scene) {
        this.scene = scene;
        this.vendors = [];
        this.vendorSprites = [];
        this.nearbyVendor = null;
        this.interactionRange = 60; // Distance for interaction
        
        this.loadVendors();
        this.setupInteractionPrompt();
    }

    async loadVendors() {
        try {
            const response = await fetch('./vendors_.json');
            const data = await response.json();
            this.vendors = data.vendors;
            this.createVendorSprites();
        } catch (error) {
            console.error('Failed to load vendor data:', error);
        }
    }

    createVendorSprites() {
        this.vendors.forEach((vendor, index) => {
            // Create vendor sprite at specified location
            const sprite = this.scene.add.sprite(vendor.x, vendor.y, 'npc1', 0);
            sprite.setDepth(1);
            sprite.vendorData = vendor;
            sprite.vendorId = vendor.id;
            
            // Add booth label above vendor
            const label = this.scene.add.text(vendor.x, vendor.y - 40, vendor.booth, {
                fontFamily: 'Courier New, monospace',
                fontSize: '14px',
                fill: '#FFFF00',
                backgroundColor: '#000080',
                padding: { x: 4, y: 2 }
            })
            .setOrigin(0.5)
            .setDepth(2);

            // Store references
            sprite.boothLabel = label;
            this.vendorSprites.push(sprite);
        });

        console.log(`Created ${this.vendorSprites.length} vendor sprites`);
    }

    setupInteractionPrompt() {
        // Create interaction prompt (initially hidden)
        this.interactionPrompt = this.scene.add.text(400, 100, 'PRESS SPACE TO TALK', {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            fill: '#FFFFFF',
            backgroundColor: '#000080',
            padding: { x: 8, y: 4 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(150)
        .setVisible(false);

        // Setup space key for interaction
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            if (this.nearbyVendor && !this.scene.uiManager.isDialogOpen) {
                this.interactWithVendor(this.nearbyVendor);
            }
        });
    }

    update() {
        if (!this.scene.player) return;

        // Check for nearby vendors
        const previousNearbyVendor = this.nearbyVendor;
        this.nearbyVendor = null;

        this.vendorSprites.forEach(vendorSprite => {
            const distance = Phaser.Math.Distance.Between(
                this.scene.player.x, 
                this.scene.player.y,
                vendorSprite.x, 
                vendorSprite.y
            );

            if (distance < this.interactionRange) {
                this.nearbyVendor = vendorSprite.vendorData;
                
                // Position prompt above player
                this.interactionPrompt.x = this.scene.player.x;
                this.interactionPrompt.y = this.scene.player.y - 60;
            }
        });

        // Show/hide interaction prompt
        if (this.nearbyVendor && !this.scene.uiManager.isDialogOpen) {
            this.interactionPrompt.setVisible(true);
        } else {
            this.interactionPrompt.setVisible(false);
        }

        // Update prompt to follow camera
        if (this.nearbyVendor) {
            const camera = this.scene.cameras.main;
            this.interactionPrompt.x = this.scene.player.x - camera.scrollX;
            this.interactionPrompt.y = this.scene.player.y - camera.scrollY - 60;
        }
    }

    interactWithVendor(vendorData) {
        console.log(`Interacting with vendor: ${vendorData.name}`);
        
        // Hide interaction prompt
        this.interactionPrompt.setVisible(false);
        
        // Show vendor dialog through UI manager
        this.scene.uiManager.showDialog(vendorData);
        
        // Add a sample item to test inventory system
        if (vendorData.items && vendorData.items.length > 0) {
            // For demo purposes, add first item to inventory
            const item = vendorData.items[0];
            if (this.scene.uiManager.addItem(item)) {
                console.log(`Added ${item.name} to inventory`);
            }
        }
    }

    getVendorById(vendorId) {
        return this.vendors.find(vendor => vendor.id === vendorId);
    }

    getVendorByBooth(boothLetter) {
        return this.vendors.find(vendor => vendor.booth === boothLetter);
    }

    // Get all vendor locations for map purposes
    getVendorLocations() {
        return this.vendors.map(vendor => ({
            x: vendor.x,
            y: vendor.y,
            booth: vendor.booth,
            name: vendor.name
        }));
    }
}

export default VendorManager;