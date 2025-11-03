import DomainManager from './domainManager.js';

class QuestGenerator {
    constructor(questManager) {
        this.questManager = questManager;
    }

    /**
     * Generate initial quests for the session
     */
    generateInitialQuests() {
        // For Phase 1B, start with one basic collection quest
        const collectionQuest = this.generateCollectionQuest();
        if (collectionQuest) {
            this.questManager.activeQuests.push(collectionQuest);
        }
    }

    /**
     * Generate a basic collection quest
     */
    generateCollectionQuest() {
        // Get assigned vendors from the scene
        const assignedVendors = [];
        if (this.questManager.scene && this.questManager.scene.npcGroup) {
            this.questManager.scene.npcGroup.getChildren().forEach(npc => {
                if (npc.vendorData) {
                    assignedVendors.push(npc.vendorData);
                }
            });
        }

        if (assignedVendors.length === 0) {
            console.warn('No assigned vendors available for quest generation');
            return null;
        }

        // Group assigned vendors by domain
        const vendorsByDomain = {};
        assignedVendors.forEach(vendor => {
            if (!vendorsByDomain[vendor.domain_id]) {
                vendorsByDomain[vendor.domain_id] = [];
            }
            vendorsByDomain[vendor.domain_id].push(vendor);
        });

        console.log('Assigned vendors by domain:', Object.keys(vendorsByDomain).map(domain =>
            `${domain}: ${vendorsByDomain[domain].length} vendors`
        ));

        // Get domains that have at least one assigned vendor
        const availableDomains = Object.keys(vendorsByDomain).map(domainId => {
            const domain = DomainManager.getAllDomains().find(d => d.id === domainId);
            return domain;
        }).filter(domain => domain);

        if (availableDomains.length === 0) {
            console.warn('No domains with assigned vendors available for quest generation');
            return null;
        }

        // Select domains that have multiple vendors assigned (to ensure item distribution)
        const multiVendorDomains = availableDomains.filter(domain =>
            vendorsByDomain[domain.id] && vendorsByDomain[domain.id].length >= 1
        );

        console.log('Domains with assigned vendors:', availableDomains.map(d => d.name));
        console.log('Domains with multiple vendors:', multiVendorDomains.map(d => d.name));

        // If we don't have multiple domains, use what's available
        const domainsToUse = multiVendorDomains.length >= 2 ? multiVendorDomains : availableDomains;

        // Select 1-2 domains for the quest
        const numDomains = Math.min(2, domainsToUse.length);
        const selectedDomains = this.shuffleArray(domainsToUse).slice(0, numDomains);

        console.log('Selected domains for quest:', selectedDomains.map(d => d.name));

        // For each selected domain, get items (we'll assume random inventories will distribute them)
        let availableItems = [];
        selectedDomains.forEach(domain => {
            const domainItems = DomainManager.getDomainItems(domain.id);
            console.log(`Domain ${domain.name} has ${domainItems.length} items`);
            if (domainItems && domainItems.length > 0) {
                availableItems = availableItems.concat(domainItems);
            }
        });

        console.log('Total available items across selected domains:', availableItems.length);
        if (availableItems.length === 0) {
            console.warn('No items available in selected domains');
            return null;
        }

        // Select items for the quest (up to 3, ensuring they're from different domains if possible)
        const numItems = Math.min(3, availableItems.length);
        let selectedItems = [];

        if (selectedDomains.length >= 2 && numItems >= 2) {
            // Try to select items from different domains, limiting items per domain based on vendor count
            const itemsByDomain = {};
            const maxItemsPerDomain = {};

            selectedDomains.forEach(domain => {
                itemsByDomain[domain.id] = DomainManager.getDomainItems(domain.id);
                // Limit items per domain to the number of vendors assigned to that domain
                const vendorCount = vendorsByDomain[domain.id] ? vendorsByDomain[domain.id].length : 1;
                maxItemsPerDomain[domain.id] = Math.min(vendorCount, itemsByDomain[domain.id].length);
                console.log(`Domain ${domain.name}: ${vendorCount} vendors, max ${maxItemsPerDomain[domain.id]} items`);
            });

            // Select items, respecting the per-domain limits
            const selectedItemsByDomain = {};
            selectedDomains.forEach(domain => {
                selectedItemsByDomain[domain.id] = [];
            });

            // First pass: select at least one item from each domain (if possible)
            selectedDomains.forEach(domain => {
                if (itemsByDomain[domain.id] && itemsByDomain[domain.id].length > 0 && selectedItemsByDomain[domain.id].length < maxItemsPerDomain[domain.id]) {
                    const randomItem = itemsByDomain[domain.id][Math.floor(Math.random() * itemsByDomain[domain.id].length)];
                    selectedItems.push(randomItem);
                    selectedItemsByDomain[domain.id].push(randomItem);
                    // Remove from domain items to avoid duplicates
                    itemsByDomain[domain.id] = itemsByDomain[domain.id].filter(item => item.name !== randomItem.name);
                }
            });

            // Second pass: fill remaining slots, respecting per-domain limits
            while (selectedItems.length < numItems && availableItems.length > 0) {
                // Find domains that still have capacity
                const availableDomains = selectedDomains.filter(domain =>
                    selectedItemsByDomain[domain.id].length < maxItemsPerDomain[domain.id] &&
                    itemsByDomain[domain.id].length > 0
                );

                if (availableDomains.length === 0) break;

                // Select a random available domain
                const randomDomain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
                const domainItems = itemsByDomain[randomDomain.id];
                const randomItem = domainItems[Math.floor(Math.random() * domainItems.length)];

                selectedItems.push(randomItem);
                selectedItemsByDomain[randomDomain.id].push(randomItem);

                // Remove from both domain items and available items
                itemsByDomain[randomDomain.id] = itemsByDomain[randomDomain.id].filter(item => item.name !== randomItem.name);
                availableItems = availableItems.filter(item => item.name !== randomItem.name);
            }
        } else {
            // Fallback to random selection
            selectedItems = this.shuffleArray(availableItems).slice(0, numItems);
        }

        console.log('Selected items for quest:', selectedItems.map(i => `${i.name} (${DomainManager.getDomainNameByItem ? 'domain lookup needed' : 'unknown domain'})`));

        // Create quest object
        const quest = {
            id: 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'collection',
            domains: selectedDomains.map(d => d.id),
            title: `Collect Retro Treasures`,
            description: `Find and collect these items from ${selectedDomains.map(d => d.name.toLowerCase()).join(' or ')} vendors: ${selectedItems.map(item => item.name).join(', ')}`,
            objectives: selectedItems.map((item, index) => {
                // Assign each item to a specific vendor in the appropriate domain
                const itemDomain = selectedDomains.find(d => DomainManager.getDomainItems(d.id).some(di => di.name === item.name));
                const vendorsInDomain = vendorsByDomain[itemDomain.id] || [];
                const assignedVendor = vendorsInDomain[index % vendorsInDomain.length] || vendorsInDomain[0];

                console.log(`Assigning item ${item.name} (domain: ${itemDomain ? itemDomain.name : 'unknown'}) to vendor ${assignedVendor ? assignedVendor.name : 'none'} (domain: ${assignedVendor ? assignedVendor.domain_id : 'none'})`);

                return {
                    item: item,
                    collected: false,
                    vendorId: assignedVendor ? assignedVendor.id : null,
                    domainId: itemDomain.id
                };
            }),
            reward: {
                points: selectedItems.length * 10,
                description: `${selectedItems.length * 10} points for collecting retro treasures`
            },
            created: Date.now(),
            completed: false
        };

        console.log(`Generated quest for domains: ${selectedDomains.map(d => d.name).join(', ')}`);
        console.log(`Quest items: ${selectedItems.map(item => item.name).join(', ')}`);
        return quest;
    }

    /**
     * Utility function to shuffle array
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

export default QuestGenerator;