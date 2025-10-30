class VendorAssignment {
    constructor(scene) {
        this.scene = scene;
        this.vendorAssignmentDone = false;
    }

    assignVendorsToNPCs(vendors) {
        if (this.vendorAssignmentDone) return;
        if (!this.scene.npcGroup || !vendors.length) return;

        const npcs = this.scene.npcGroup.getChildren();
        const numNpcs = npcs.length;

        // Group vendors by domain
        const vendorsByDomain = {};
        vendors.forEach(vendor => {
            if (!vendorsByDomain[vendor.domain_id]) {
                vendorsByDomain[vendor.domain_id] = [];
            }
            vendorsByDomain[vendor.domain_id].push(vendor);
        });

        console.log('Vendors by domain:', Object.keys(vendorsByDomain).map(domain => `${domain}: ${vendorsByDomain[domain].length} vendors`));

        // Select vendors to ensure domain diversity
        const selectedVendors = [];
        const domains = Object.keys(vendorsByDomain);

        // First, select one vendor from each domain
        domains.forEach(domain => {
            if (vendorsByDomain[domain].length > 0 && selectedVendors.length < numNpcs) {
                const randomVendor = vendorsByDomain[domain][Math.floor(Math.random() * vendorsByDomain[domain].length)];
                selectedVendors.push(randomVendor);
                // Remove this vendor from the pool to avoid duplicates
                vendorsByDomain[domain] = vendorsByDomain[domain].filter(v => v.id !== randomVendor.id);
            }
        });

        // If we still need more vendors, fill with random remaining vendors
        const remainingVendors = [];
        domains.forEach(domain => {
            remainingVendors.push(...vendorsByDomain[domain]);
        });

        while (selectedVendors.length < numNpcs && remainingVendors.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingVendors.length);
            selectedVendors.push(remainingVendors[randomIndex]);
            remainingVendors.splice(randomIndex, 1);
        }

        console.log('Selected vendors for NPCs:', selectedVendors.map(v => `${v.name} (${v.domain_id})`));

        // Assign selected vendors to NPCs
        npcs.forEach((npcSprite, index) => {
            if (index < selectedVendors.length) {
                npcSprite.vendorData = selectedVendors[index];
            } else {
                // Fallback to random if we somehow don't have enough
                npcSprite.vendorData = vendors[Math.floor(Math.random() * vendors.length)];
            }

            // Pulsing glow effect
            if (npcSprite.glowGraphic) {
                npcSprite.glowGraphic.destroy();
            }
            const glow = this.scene.add.graphics();
            glow.setDepth(npcSprite.depth ? npcSprite.depth - 1 : 0);
            glow.setVisible(false);
            npcSprite.glowGraphic = glow;
            npcSprite.glowPulse = 0;
        });

        this.vendorAssignmentDone = true;
    }
}

export default VendorAssignment;