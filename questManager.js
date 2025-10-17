/**
 * QuestManager.js
 * Handles procedural quest generation and management for the VCF Midwest game.
 * Uses domain-based architecture for scalable, replayable quests.
 */

import DomainManager from './domainManager.js';

class QuestManager {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.sessionId = null;
        this.domainManager = null;
        this.npcManager = null;
        this.uiManager = null;
    }

    /**
     * Initialize the quest manager with required dependencies
     */
    init(vendors, uiManager, scene) {
        this.vendors = vendors;
        this.uiManager = uiManager;
        this.scene = scene;

        // For debugging: skip loading session and always start fresh
        console.log('Skipping session load for debugging');

        // Wait for DomainManager to load, then start session
        this.waitForDomainsAndStart();

        console.log('QuestManager initialized, waiting for domains...');
    }

    /**
     * Wait for DomainManager to load domains, then start quest session
     */
    async waitForDomainsAndStart() {
        try {
            await DomainManager.loadDomains();
            console.log('DomainManager ready, starting quest session');

            // For debugging: always start a new session
            console.log('Clearing session for debugging');
            this.clearSession();

            // Start new session if none exists
            if (!this.sessionId) {
                this.startNewSession();
            } else {
                console.log('Loaded existing session:', this.sessionId);
            }
        } catch (error) {
            console.error('Failed to load domains for quest system:', error);
        }
    }

    /**
     * Start a new quest session
     */
    startNewSession() {
        this.sessionId = 'session_' + Date.now();
        this.activeQuests = [];
        this.completedQuests = [];

        // Wait for vendor assignment to complete before generating quests
        this.waitForVendorAssignment();

        console.log('New quest session started:', this.sessionId);
    }

    /**
     * Wait for vendor assignment to complete, then generate quests
     */
    waitForVendorAssignment() {
        if (this.scene && this.scene.vendorManager && this.scene.vendorManager.vendorAssignmentDone) {
            // Vendor assignment is done, generate quests now
            this.generateInitialQuests();
            this.saveSessionState();
        } else {
            // Vendor assignment not done yet, check again next frame
            setTimeout(() => this.waitForVendorAssignment(), 100);
        }
    }

    /**
     * Generate initial quests for the session
     */
    generateInitialQuests() {
        // For Phase 1B, start with one basic collection quest
        const collectionQuest = this.generateCollectionQuest();
        if (collectionQuest) {
            this.activeQuests.push(collectionQuest);
        }
    }

    /**
     * Generate a basic collection quest
     */
    generateCollectionQuest() {
        // Get assigned vendors from the scene
        const assignedVendors = [];
        if (this.scene && this.scene.npcGroup) {
            this.scene.npcGroup.getChildren().forEach(npc => {
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
            objectives: selectedItems.map(item => ({
                item: item,
                collected: false,
                vendor: null // Will be set when collected
            })),
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
     * Check if a collected item completes any quest objectives
     */
    checkItemCollection(itemName, vendorId) {
        console.log(`Checking item collection: ${itemName} from vendor ${vendorId}`);
        let questUpdated = false;

        this.activeQuests.forEach(quest => {
            if (quest.type === 'collection') {
                // Check if the vendor's domain is one of the quest's required domains
                const vendor = this.vendors.find(v => v.id === vendorId);
                if (vendor && quest.domains.includes(vendor.domain_id)) {
                    quest.objectives.forEach(objective => {
                        if (!objective.collected && objective.item.name === itemName) {
                            objective.collected = true;
                            objective.vendor = vendorId;
                            questUpdated = true;
                            console.log(`Item ${itemName} collected for quest ${quest.id} from domain ${vendor.domain_id}`);

                            // Check if quest is complete
                            const allObjectivesComplete = quest.objectives.every(obj => obj.collected);
                            if (allObjectivesComplete) {
                                this.completeQuest(quest.id);
                            }
                        }
                    });
                }
            }
        });

        if (questUpdated) {
            this.saveSessionState();
        }

        return questUpdated;
    }

    /**
     * Complete a quest and award rewards
     */
    completeQuest(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;

        const quest = this.activeQuests[questIndex];
        quest.completed = true;
        quest.completedAt = Date.now();

        // Move to completed quests
        this.completedQuests.push(quest);
        this.activeQuests.splice(questIndex, 1);

        // Award points
        if (this.uiManager && quest.reward) {
            this.uiManager.updateScore(quest.reward.points);
            this.uiManager.showQuestCompletion(quest);
        }

        console.log('Quest completed:', quest.title);
        this.saveSessionState();
    }

    /**
     * Get active quests for display
     */
    getActiveQuests() {
        return this.activeQuests;
    }

    /**
     * Get completed quests for display
     */
    getCompletedQuests() {
        return this.completedQuests;
    }

    /**
     * Save session state to cookies
     */
    saveSessionState() {
        const sessionData = {
            sessionId: this.sessionId,
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            timestamp: Date.now()
        };

        // Save to cookie (expires in 24 hours)
        const expires = new Date();
        expires.setHours(expires.getHours() + 24);

        document.cookie = `vcf_quest_session=${JSON.stringify(sessionData)}; expires=${expires.toUTCString()}; path=/`;
    }

    /**
     * Load session state from cookies
     */
    loadSessionState() {
        const cookieName = 'vcf_quest_session=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(';');

        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(cookieName)) {
                try {
                    const sessionData = JSON.parse(cookie.substring(cookieName.length));
                    console.log('Found session cookie:', sessionData);
                    this.sessionId = sessionData.sessionId;
                    this.activeQuests = sessionData.activeQuests || [];
                    this.completedQuests = sessionData.completedQuests || [];
                    console.log('Loaded quest session:', this.sessionId, 'with', this.activeQuests.length, 'active quests');
                    return;
                } catch (e) {
                    console.warn('Failed to parse quest session cookie:', e);
                }
            }
        }

        console.log('No valid quest session found in cookies');
    }

    /**
     * Clear session state (for testing/debugging)
     */
    clearSession() {
        console.log('Clearing quest session...');
        this.sessionId = null;
        this.activeQuests = [];
        this.completedQuests = [];

        // Clear cookie by setting it to expire in the past
        document.cookie = 'vcf_quest_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Also try clearing with different paths just in case
        document.cookie = 'vcf_quest_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';

        console.log('Quest session cleared, cookies:', document.cookie);
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

    /**
     * Get quest progress summary
     */
    getQuestSummary() {
        return {
            sessionId: this.sessionId,
            activeCount: this.activeQuests.length,
            completedCount: this.completedQuests.length,
            totalPoints: this.completedQuests.reduce((sum, quest) => sum + (quest.reward?.points || 0), 0)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestManager;
}

export default QuestManager;