/**
 * QuestManager.js
 * Handles procedural quest generation and management for the VCF Midwest game.
 * Uses domain-based architecture for scalable, replayable quests.
 */

import DomainManager from './domainManager.js';

class QuestManager {
    constructor({ state = null, testMode = false } = {}) {
        this.sessionId = null;
        this.domainManager = null;
        this.npcManager = null;
        this.onQuestCompletion = null;
        this.testMode = Boolean(testMode);
        this.testQuestCounter = 0;
        this.setState(state);
    }

    setState(state) {
        const nextState = state ?? this.state ?? {
            score: 0,
            inventory: [],
            activeQuests: [],
            completedQuests: []
        };

        nextState.score = Number.isFinite(nextState.score) ? nextState.score : 0;
        nextState.inventory = Array.isArray(nextState.inventory) ? nextState.inventory : [];
        nextState.activeQuests = Array.isArray(nextState.activeQuests) ? nextState.activeQuests : [];
        nextState.completedQuests = Array.isArray(nextState.completedQuests) ? nextState.completedQuests : [];

        this.state = nextState;

        Object.defineProperty(this, 'activeQuests', {
            configurable: true,
            enumerable: true,
            get: () => this.state.activeQuests,
            set: (activeQuests) => {
                this.state.activeQuests = Array.isArray(activeQuests) ? activeQuests : [];
            }
        });

        Object.defineProperty(this, 'completedQuests', {
            configurable: true,
            enumerable: true,
            get: () => this.state.completedQuests,
            set: (completedQuests) => {
                this.state.completedQuests = Array.isArray(completedQuests) ? completedQuests : [];
            }
        });

        return this;
    }

    /**
     * Initialize the quest manager with required dependencies
     */
    init(vendors) {
        this.vendors = vendors;

        if (this.testMode) {
            this.sessionId = null;
            this.activeQuests = [];
            this.completedQuests = [];
        } else {
            // Load session state from cookies
            this.loadSessionState();
        }

        // Wait for DomainManager to load, then start session
        const startupPromise = this.waitForDomainsAndStart();

        console.log('QuestManager initialized, waiting for domains...');

        return startupPromise;
    }

    setQuestCompletionHandler(onQuestCompletion) {
        this.onQuestCompletion = onQuestCompletion;
        return this;
    }

    /**
     * Wait for DomainManager to load domains, then start quest session
     */
    async waitForDomainsAndStart() {
        try {
            await DomainManager.loadDomains();
            console.log('DomainManager ready, starting quest session');

            // Start new session if none exists
            if (!this.sessionId) {
                this.startNewSession();
            }

            return true;
        } catch (error) {
            console.error('Failed to load domains for quest system:', error);
            return false;
        }
    }

    /**
     * Start a new quest session
     */
    startNewSession() {
        this.sessionId = this.testMode ? 'test_session' : 'session_' + Date.now();
        this.activeQuests = [];
        this.completedQuests = [];
        this.testQuestCounter = 0;

        // Generate initial quests
        this.generateInitialQuests();

        // Save session state
        this.saveSessionState();

        console.log('New quest session started:', this.sessionId);
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
        const candidateDomains = this.getQuestCandidateDomains();
        if (candidateDomains.length === 0) {
            console.warn('No valid domains available for quest generation');
            return null;
        }

        const selectedDomain = this.selectQuestDomain(candidateDomains);

        // Get items from this domain
        const domainItems = DomainManager.getDomainItems(selectedDomain.id);
        if (!domainItems || domainItems.length === 0) {
            console.warn('No items available in domain:', selectedDomain.id);
            return null;
        }

        const selectedItems = this.selectQuestItems(domainItems);

        // Get vendors in this domain (for now, use all vendors - will be limited to active set later)
        const domainVendors = this.vendors.filter(vendor =>
            vendor.domain_id === selectedDomain.id
        );

        if (domainVendors.length === 0) {
            console.warn('No vendors in domain:', selectedDomain.id);
            return null;
        }

        // Create quest object
        const quest = {
            id: this.createQuestId(),
            type: 'collection',
            domain: selectedDomain.id,
            title: `Collect ${selectedDomain.name} Treasures`,
            description: `Find and collect these items from ${selectedDomain.name} vendors: ${selectedItems.map(item => item.name).join(', ')}`,
            objectives: selectedItems.map(item => ({
                item: item,
                collected: false,
                vendor: null // Will be set when collected
            })),
            reward: {
                points: selectedItems.length * 10,
                description: `${selectedItems.length * 10} points for collecting ${selectedDomain.name} items`
            },
            created: Date.now(),
            completed: false
        };

        return quest;
    }

    getQuestCandidateDomains() {
        const domains = DomainManager.getAllDomains();
        if (!domains || domains.length === 0) {
            return [];
        }

        return domains.filter(domain => {
            const items = DomainManager.getDomainItems(domain.id);
            const vendors = this.vendors.filter(vendor => vendor.domain_id === domain.id);

            return items.length > 0 && vendors.length > 0;
        });
    }

    selectQuestDomain(domains) {
        if (this.testMode) {
            return domains[0];
        }

        return domains[Math.floor(Math.random() * domains.length)];
    }

    selectQuestItems(items) {
        const maxItems = Math.min(3, items.length);

        if (this.testMode) {
            return items.slice(0, maxItems);
        }

        return this.shuffleArray(items).slice(0, maxItems);
    }

    createQuestId() {
        if (this.testMode) {
            this.testQuestCounter += 1;
            return `test_quest_${this.testQuestCounter}`;
        }

        return 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Check if a collected item completes any quest objectives
     */
    checkItemCollection(itemName, vendorId) {
        let questUpdated = false;

        this.activeQuests.forEach(quest => {
            if (quest.type === 'collection') {
                quest.objectives.forEach(objective => {
                    if (!objective.collected && objective.item.name === itemName) {
                        objective.collected = true;
                        objective.vendor = vendorId;
                        questUpdated = true;

                        // Check if quest is complete
                        const allObjectivesComplete = quest.objectives.every(obj => obj.collected);
                        if (allObjectivesComplete) {
                            this.completeQuest(quest.id);
                        }
                    }
                });
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

        if (quest.reward) {
            this.onQuestCompletion?.(quest);
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
        if (this.testMode) {
            return;
        }

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
        if (this.testMode) {
            return;
        }

        const cookieName = 'vcf_quest_session=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(';');

        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(cookieName)) {
                try {
                    const sessionData = JSON.parse(cookie.substring(cookieName.length));
                    this.sessionId = sessionData.sessionId;
                    this.activeQuests = sessionData.activeQuests || [];
                    this.completedQuests = sessionData.completedQuests || [];
                    console.log('Loaded quest session:', this.sessionId);
                    return;
                } catch (e) {
                    console.warn('Failed to parse quest session cookie:', e);
                }
            }
        }

        // No valid session found, will create new one when needed
        console.log('No valid quest session found');
    }

    /**
     * Clear session state (for testing/debugging)
     */
    clearSession() {
        this.sessionId = null;
        this.activeQuests = [];
        this.completedQuests = [];

        // Clear cookie
        document.cookie = 'vcf_quest_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        console.log('Quest session cleared');
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