// VendorManagerCore.js
// Main orchestration for vendor management

import VendorAssignment from './vendorAssignment.js';
import VendorInteraction from './vendorInteraction.js';
import VendorDialog from './vendorDialog.js';

class VendorManagerCore {
    constructor(scene) {
        this.scene = scene;
        this.vendors = scene.vendors || [];
        this.vendorAssignment = new VendorAssignment(scene);
        this.vendorInteraction = new VendorInteraction(scene, this);
        this.vendorDialog = new VendorDialog(scene);
    }

    assignVendorsToNPCs() {
        this.vendorAssignment.assignVendorsToNPCs(this.vendors);
    }

    setupInteractionPrompt() {
        // Handled in VendorInteraction
    }

    interactWithVendor(vendorData, npcSprite = null) {
        this.vendorDialog.interactWithVendor(vendorData, npcSprite);
    }

    update() {
        this.assignVendorsToNPCs();
        this.vendorInteraction.update();
    }
}

export default VendorManagerCore;
