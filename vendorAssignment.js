import CrisisManager from './CrisisManager.js';

class VendorAssignment {
    constructor(scene) {
        this.scene = scene;
        this.vendorAssignmentDone = false;
        this.assignedNpcCount = 0; // Track how many NPCs we've assigned vendors to
    }

    assignVendorsToNPCs(vendors) {
        if (!this.scene.npcGroup || !vendors.length) return;

        const npcs = this.scene.npcGroup.getChildren();
        const numNpcs = npcs.length;

        // If we've already assigned vendors to all current NPCs, nothing to do
        if (this.vendorAssignmentDone && this.assignedNpcCount >= numNpcs) return;

        // If we have more NPCs than before, we need to assign vendors to the new ones
        if (numNpcs > this.assignedNpcCount) {
            console.log(`Vendor assignment: Found ${numNpcs} NPCs, previously assigned ${this.assignedNpcCount}. Assigning vendors to ${numNpcs - this.assignedNpcCount} new NPCs.`);
        }

        // Group vendors by domain
        const vendorsByDomain = {};
        vendors.forEach(vendor => {
            if (!vendorsByDomain[vendor.domain_id]) {
                vendorsByDomain[vendor.domain_id] = [];
            }
            vendorsByDomain[vendor.domain_id].push(vendor);
        });

        console.log('Vendors by domain:', Object.keys(vendorsByDomain).map(domain => `${domain}: ${vendorsByDomain[domain].length} vendors`));

        // Find NPCs that don't have vendor data yet
        const unassignedNpcs = npcs.filter(npc => !npc.vendorData);
        const numUnassigned = unassignedNpcs.length;

        if (numUnassigned === 0) {
            // All NPCs already have vendors assigned
            this.vendorAssignmentDone = true;
            return;
        }

        console.log(`Vendor assignment: Found ${numNpcs} total NPCs, ${numUnassigned} unassigned.`);

        // Select vendors for unassigned NPCs, ensuring domain diversity
        const selectedVendors = [];
        const domains = Object.keys(vendorsByDomain);

        // First, select one vendor from each domain for unassigned NPCs
        domains.forEach(domain => {
            if (vendorsByDomain[domain].length > 0 && selectedVendors.length < numUnassigned) {
                const randomVendor = vendorsByDomain[domain][Math.floor(Math.random() * vendorsByDomain[domain].length)];
                selectedVendors.push(randomVendor);
                // Remove this vendor from the pool to avoid duplicates
                vendorsByDomain[domain] = vendorsByDomain[domain].filter(v => v.id !== randomVendor.id);
            }
        });

        // If we still need more vendors, allow duplicates (same vendor at multiple booths)
        while (selectedVendors.length < numUnassigned) {
            const randomVendor = vendors[Math.floor(Math.random() * vendors.length)];
            selectedVendors.push(randomVendor);
        }

        console.log('Selected vendors for unassigned NPCs:', selectedVendors.map(v => `${v.name} (${v.domain_id})`));
        console.log(`Will assign vendors to ${selectedVendors.length} NPCs.`);

        // Assign selected vendors to unassigned NPCs
        unassignedNpcs.forEach((npcSprite, index) => {
            npcSprite.vendorData = selectedVendors[index];

            // Assign crisis to some NPCs (about 30% chance) - only if they don't already have one
            if (Math.random() < 0.3 && !npcSprite.crisisState) {
                this.scene.crisisManager.assignRandomCrisis(npcSprite);
                console.log(`Assigned crisis to NPC ${npcSprite.vendorData?.name || 'Unknown'}`);
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

        this.assignedNpcCount = npcs.filter(npc => npc.vendorData).length;
        console.log(`Vendor assignment complete. ${this.assignedNpcCount} of ${numNpcs} NPCs now have vendors assigned.`);

        // Mark as done if all NPCs have vendors
        if (this.assignedNpcCount >= numNpcs) {
            this.vendorAssignmentDone = true;
        }
    }
}

export default VendorAssignment;