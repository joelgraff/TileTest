import DomainManager from './domainManager.js';

class QuestSession {
    constructor(questManager) {
        this.questManager = questManager;
        this.sessionId = null;
    }

    /**
     * Initialize the quest session with required dependencies
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
        this.questManager.activeQuests = [];
        this.questManager.completedQuests = [];

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
            this.questManager.generateInitialQuests();
            this.questManager.saveSessionState();
        } else {
            // Vendor assignment not done yet, check again next frame
            setTimeout(() => this.waitForVendorAssignment(), 100);
        }
    }

    /**
     * Clear session state (for testing/debugging)
     */
    clearSession() {
        console.log('Clearing quest session...');
        this.sessionId = null;
        this.questManager.activeQuests = [];
        this.questManager.completedQuests = [];

        // Clear cookie by setting it to expire in the past
        document.cookie = 'vcf_quest_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Also try clearing with different paths just in case
        document.cookie = 'vcf_quest_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';

        console.log('Quest session cleared, cookies:', document.cookie);
    }

    getSessionId() {
        return this.sessionId;
    }
}

export default QuestSession;