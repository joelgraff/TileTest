// Test script to verify quest generation logic
import DomainManager from './domainManager.js';

// Mock assigned vendors for testing
const mockAssignedVendors = [
    { id: '100', name: 'Ben Armstrong', domain_id: 'hardware' },
    { id: '101', name: 'Test Vendor 1', domain_id: 'gaming' },
    { id: '102', name: 'Test Vendor 2', domain_id: 'software' }
];

// Test the quest generation logic
async function testQuestGeneration() {
    try {
        await DomainManager.loadDomains();
        console.log('Domains loaded successfully');

        // Simulate the quest generation logic
        const assignedVendors = mockAssignedVendors;

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

        console.log('Available domains:', availableDomains.map(d => d.name));

        if (availableDomains.length === 0) {
            console.warn('No domains with assigned vendors available for quest generation');
            return null;
        }

        // Select domains that have multiple vendors assigned (to ensure item distribution)
        const multiVendorDomains = availableDomains.filter(domain =>
            vendorsByDomain[domain.id] && vendorsByDomain[domain.id].length >= 1
        );

        console.log('Domains with multiple vendors:', multiVendorDomains.map(d => d.name));

        // If we don't have multiple domains, use what's available
        const domainsToUse = multiVendorDomains.length >= 2 ? multiVendorDomains : availableDomains;

        // Select 1-2 domains for the quest
        const numDomains = Math.min(2, domainsToUse.length);
        const selectedDomains = domainsToUse.slice(0, numDomains);

        console.log('Selected domains for quest:', selectedDomains.map(d => d.name));

        // For each selected domain, get items
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

        // Select items for the quest (up to 3)
        const numItems = Math.min(3, availableItems.length);
        const selectedItems = availableItems.slice(0, numItems);

        console.log('Selected items for quest:', selectedItems.map(i => i.name));

        // Create quest object
        const quest = {
            id: 'test_quest_' + Date.now(),
            type: 'collection',
            domains: selectedDomains.map(d => d.id),
            title: `Collect Retro Treasures`,
            description: `Find and collect these items from ${selectedDomains.map(d => d.name.toLowerCase()).join(' or ')} vendors: ${selectedItems.map(item => item.name).join(', ')}`,
            objectives: selectedItems.map(item => ({
                item: item,
                collected: false,
                vendor: null
            })),
            reward: {
                points: selectedItems.length * 10,
                description: `${selectedItems.length * 10} points for collecting retro treasures`
            },
            created: Date.now(),
            completed: false
        };

        console.log('Generated test quest:', quest);
        return quest;

    } catch (error) {
        console.error('Error in test quest generation:', error);
    }
}

// Run the test
testQuestGeneration();