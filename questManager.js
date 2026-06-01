/**
 * QuestManager.js
 * Handles procedural quest generation and management for the VCF Midwest game.
 * Uses domain-based architecture for scalable, replayable quests.
 */

import DomainManager from './domainManager.js';
import { createEncounterChain, getEncounterForVendor } from './encounterChain.js';
import {
    clearQuestSessionState,
    normalizeSessionVendorIds,
    readQuestSessionState,
    writeQuestSessionState
} from './questSessionStore.js';
import { getVendorInventoryItems } from './vendorInventory.js';

class QuestManager {
    constructor({ state = null, testMode = false, discoveryTrails = [], activeVendorIds = [] } = {}) {
        this.sessionId = null;
        this.domainManager = null;
        this.npcManager = null;
        this.onQuestCompletion = null;
        this.onQuestStateChange = null;
        this.testMode = Boolean(testMode);
        this.testQuestCounter = 0;
        this.discoveryVendorPool = null;
        this.activeVendorIds = [];
        this.discoveryTrails = [];
        this.setSessionVendorIds(activeVendorIds);
        this.setDiscoveryTrails(discoveryTrails);
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
    init(vendors, { discoveryTrails = null } = {}) {
        this.vendors = vendors;
        if (Array.isArray(discoveryTrails)) {
            this.setDiscoveryTrails(discoveryTrails);
        }

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

    setQuestStateChangeHandler(onQuestStateChange) {
        this.onQuestStateChange = typeof onQuestStateChange === 'function' ? onQuestStateChange : null;
        return this;
    }

    notifyQuestStateChanged() {
        this.onQuestStateChange?.({
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests
        });
    }

    setDiscoveryVendorPool(vendors = []) {
        this.discoveryVendorPool = this.getUniqueVendors(vendors);
        return this;
    }

    setSessionVendorIds(vendorIds = []) {
        this.activeVendorIds = normalizeSessionVendorIds(vendorIds);
        return this;
    }

    setDiscoveryTrails(discoveryTrails = []) {
        this.discoveryTrails = Array.isArray(discoveryTrails) ? discoveryTrails : [];
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
            } else {
                this.ensureDiscoveryQuestForSession();
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
        this.notifyQuestStateChanged();

        console.log('New quest session started:', this.sessionId);
    }

    hasDiscoveryQuest() {
        return [...this.activeQuests, ...this.completedQuests]
            .some(quest => quest?.type === 'discovery');
    }

    ensureDiscoveryQuestForSession() {
        if (this.hasDiscoveryQuest()) {
            this.notifyQuestStateChanged();
            return false;
        }

        const discoveryQuest = this.generateDiscoveryQuest();
        if (!discoveryQuest) {
            this.notifyQuestStateChanged();
            return false;
        }

        this.activeQuests.push(discoveryQuest);
        this.saveSessionState();
        this.notifyQuestStateChanged();
        return true;
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

        const discoveryQuest = this.generateDiscoveryQuest();
        if (discoveryQuest) {
            this.activeQuests.push(discoveryQuest);
        }
    }

    /**
     * Generate a basic collection quest
     */
    generateCollectionQuest() {
        const objectives = this.createCollectionQuestObjectives();
        if (objectives.length === 0) {
            console.warn('No valid vendor inventory available for quest generation');
            return null;
        }

        const itemNames = objectives.map(objective => objective.item.name).join(', ');

        // Create quest object
        const quest = {
            id: this.createQuestId(),
            type: 'collection',
            domain: 'show_floor',
            title: 'Collect Show Floor Treasures',
            description: `Visit different exhibitors and collect these items: ${itemNames}`,
            objectives,
            reward: {
                points: objectives.length * 10,
                description: `${objectives.length * 10} points for collecting show floor items`
            },
            created: Date.now(),
            completed: false
        };

        return quest;
    }

    getCollectionCandidateVendors() {
        const hasAssignedVendorPool = Array.isArray(this.discoveryVendorPool);
        const vendorSource = hasAssignedVendorPool ? this.discoveryVendorPool : this.vendors;

        return this.getUniqueVendors(vendorSource).filter(vendor => (
            this.normalizeText(vendor.id)
            && getVendorInventoryItems(vendor, DomainManager.getDomainItems(vendor.domain_id)).length > 0
        ));
    }

    selectCollectionVendors(vendors) {
        const maxVendors = Math.min(3, vendors.length);

        if (maxVendors === 0) {
            return [];
        }

        if (this.testMode) {
            return vendors.slice(0, maxVendors);
        }

        return this.shuffleArray(vendors).slice(0, maxVendors);
    }

    selectCollectionItemForVendor(items, vendorIndex) {
        if (!Array.isArray(items) || items.length === 0) {
            return null;
        }

        if (this.testMode) {
            return items[vendorIndex % items.length];
        }

        return this.shuffleArray(items)[0];
    }

    createCollectionQuestObjectives() {
        return this.selectCollectionVendors(this.getCollectionCandidateVendors())
            .map((vendor, vendorIndex) => {
                const item = this.selectCollectionItemForVendor(
                    getVendorInventoryItems(vendor, DomainManager.getDomainItems(vendor.domain_id)),
                    vendorIndex
                );

                if (!item) {
                    return null;
                }

                return {
                    item,
                    collected: false,
                    vendor: null,
                    vendorId: this.normalizeText(vendor.id),
                    vendorName: this.normalizeText(vendor.name, 'Unknown Vendor'),
                    booth: this.normalizeText(vendor.booth)
                };
            })
            .filter(Boolean);
    }

    generateDiscoveryQuest() {
        const authoredQuest = this.generateAuthoredDiscoveryQuest();
        if (authoredQuest) {
            return authoredQuest;
        }

        const selectedVendors = this.selectDiscoveryVendors(this.getDiscoveryCandidateVendors());

        if (selectedVendors.length < 2) {
            return null;
        }

        const objectives = selectedVendors.map(vendor => this.createDiscoveryObjective(vendor));

        return {
            id: this.createQuestId(),
            type: 'discovery',
            title: 'Discovery Passport',
            description: 'Visit these exhibitors and collect a clue from each booth.',
            objectives,
            reward: {
                points: objectives.length * 15,
                description: `${objectives.length * 15} points for completing the discovery passport`
            },
            created: Date.now(),
            completed: false
        };
    }

    generateAuthoredDiscoveryQuest() {
        const selectedTrail = this.selectDiscoveryTrail(this.getDiscoveryTrailCandidates());

        if (!selectedTrail) {
            return null;
        }

        return this.createDiscoveryQuestFromTrail(selectedTrail);
    }

    getDiscoveryTrailCandidates() {
        const reachableVendorsById = this.getDiscoveryCandidateVendorById();

        return this.discoveryTrails.filter(trail => this.isDiscoveryTrailReachable(trail, reachableVendorsById));
    }

    getDiscoveryCandidateVendorById() {
        return new Map(
            this.getDiscoveryCandidateVendors().map(vendor => [this.normalizeText(vendor.id), vendor])
        );
    }

    getDiscoveryTrailStops(trail = {}) {
        if (!Array.isArray(trail.stops)) {
            return [];
        }

        return trail.stops.filter(stop => this.normalizeText(stop?.vendorId));
    }

    isDiscoveryTrailReachable(trail, reachableVendorsById) {
        const stops = this.getDiscoveryTrailStops(trail);

        return stops.length >= 2 && stops.every(stop => reachableVendorsById.has(this.normalizeText(stop.vendorId)));
    }

    selectDiscoveryTrail(trails) {
        if (!Array.isArray(trails) || trails.length === 0) {
            return null;
        }

        if (this.testMode) {
            return trails[0];
        }

        return this.shuffleArray(trails)[0];
    }

    createDiscoveryQuestFromTrail(trail) {
        const reachableVendorsById = this.getDiscoveryCandidateVendorById();
        const objectives = this.getDiscoveryTrailStops(trail).map(stop => (
            this.createDiscoveryObjective(reachableVendorsById.get(this.normalizeText(stop.vendorId)), stop)
        ));
        const reward = this.resolveDiscoveryTrailReward(trail, objectives.length);

        return {
            id: this.createQuestId(),
            type: 'discovery',
            source: 'authored-trail',
            trailId: this.normalizeText(trail.id),
            title: this.normalizeText(trail.title, 'Discovery Passport'),
            description: this.normalizeText(trail.description, 'Visit these exhibitors and collect a clue from each booth.'),
            ordered: trail.ordered === true,
            completionText: this.normalizeText(trail.completionText),
            objectives,
            reward,
            created: Date.now(),
            completed: false
        };
    }

    resolveDiscoveryTrailReward(trail, objectiveCount) {
        const rewardPoints = Number.isFinite(trail.reward?.points)
            ? trail.reward.points
            : objectiveCount * 15;

        return {
            points: rewardPoints,
            description: this.normalizeText(
                trail.reward?.description,
                `${rewardPoints} points for completing ${this.normalizeText(trail.title, 'the discovery trail')}`
            )
        };
    }

    getDiscoveryCandidateVendors() {
        const hasAssignedVendorPool = Array.isArray(this.discoveryVendorPool);
        const vendorSource = hasAssignedVendorPool ? this.discoveryVendorPool : this.vendors;

        return this.getUniqueVendors(vendorSource).filter(vendor => this.normalizeText(vendor.id));
    }

    selectDiscoveryVendors(vendors) {
        const maxVendors = Math.min(2, vendors.length);

        if (maxVendors < 2) {
            return [];
        }

        if (this.testMode) {
            return vendors.slice(0, maxVendors);
        }

        return this.shuffleArray(vendors).slice(0, maxVendors);
    }

    createDiscoveryObjective(vendorData = {}, trailStop = {}) {
        const clue = this.normalizeText(
            trailStop.clueText,
            this.normalizeText(trailStop.clue, this.resolveDiscoveryClue(vendorData))
        );

        return {
            trailStopId: this.normalizeText(trailStop.id),
            vendorId: this.normalizeText(vendorData.id),
            vendorName: this.normalizeText(vendorData.name, 'Unknown Vendor'),
            booth: this.normalizeText(vendorData.booth, 'Unknown Booth'),
            clue,
            goal: this.normalizeText(trailStop.goalText, this.normalizeText(trailStop.goal)),
            completionMarker: this.normalizeText(trailStop.completionMarker),
            visited: false,
            visitedAt: null
        };
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

    normalizeText(value, fallback = '') {
        return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
    }

    getUniqueVendors(vendors = []) {
        if (!Array.isArray(vendors)) {
            return [];
        }

        const seenVendorIds = new Set();
        const uniqueVendors = [];

        vendors.forEach(vendor => {
            const vendorId = this.normalizeText(vendor?.id);

            if (!vendorId || seenVendorIds.has(vendorId)) {
                return;
            }

            seenVendorIds.add(vendorId);
            uniqueVendors.push(vendor);
        });

        return uniqueVendors;
    }

    resolveDiscoveryClue(vendorData = {}) {
        const clueText = this.normalizeText(vendorData.clueText, this.normalizeText(vendorData.clue));
        if (clueText) {
            return clueText;
        }

        const vendorName = this.normalizeText(vendorData.name, 'this vendor');
        const booth = this.normalizeText(vendorData.booth, 'their booth');

        return `Visit ${vendorName} at ${booth} and ask what makes their exhibit stand out.`;
    }

    /**
     * Check if a collected item completes any quest objectives
     */
    checkItemCollection(itemName, vendorId) {
        let questUpdated = false;
        let questCompleted = false;

        this.activeQuests.forEach(quest => {
            if (quest.type === 'collection') {
                quest.objectives.forEach(objective => {
                    const vendorMatches = !objective.vendorId || this.normalizeText(objective.vendorId) === this.normalizeText(vendorId);
                    if (!objective.collected && objective.item.name === itemName && vendorMatches) {
                        objective.collected = true;
                        objective.vendor = vendorId;
                        questUpdated = true;

                        // Check if quest is complete
                        const allObjectivesComplete = quest.objectives.every(obj => obj.collected);
                        if (allObjectivesComplete) {
                            questCompleted = true;
                            this.completeQuest(quest.id);
                        }
                    }
                });
            }
        });

        if (questUpdated) {
            this.saveSessionState();
            if (!questCompleted) {
                this.notifyQuestStateChanged();
            }
        }

        return questUpdated;
    }

    checkVendorDiscovery(vendorId, vendorData = {}) {
        return this.checkVendorDiscoveryResult(vendorId, vendorData).updated;
    }

    createEmptyVendorDiscoveryResult(vendorId = '') {
        return {
            updated: false,
            blocked: false,
            reason: '',
            questCompleted: false,
            questId: null,
            questTitle: null,
            vendorId,
            vendorName: '',
            booth: '',
            clue: '',
            visitedCount: 0,
            totalCount: 0,
            nextVendorId: '',
            nextVendorName: '',
            nextBooth: '',
            message: ''
        };
    }

    createEncounterVendorLabel(encounter, fallbackName = 'this booth') {
        const vendorName = this.normalizeText(encounter?.vendorName, fallbackName);
        const booth = this.normalizeText(encounter?.booth);

        return booth ? `${vendorName} (${booth})` : vendorName;
    }

    createBlockedVendorDiscoveryResult({ quest, encounter, nextEncounter, vendorId }) {
        const result = this.createEmptyVendorDiscoveryResult(vendorId);
        const chain = createEncounterChain(quest);

        return {
            ...result,
            blocked: true,
            reason: 'encounter-locked',
            questId: quest.id,
            questTitle: quest.title,
            vendorName: this.normalizeText(encounter?.vendorName),
            booth: this.normalizeText(encounter?.booth),
            clue: this.normalizeText(encounter?.clue),
            visitedCount: chain.visitedCount,
            totalCount: chain.totalCount,
            nextVendorId: this.normalizeText(nextEncounter?.vendorId),
            nextVendorName: this.normalizeText(nextEncounter?.vendorName),
            nextBooth: this.normalizeText(nextEncounter?.booth),
            message: `${this.createEncounterVendorLabel(encounter)} is locked for ${quest.title}. Complete ${this.createEncounterVendorLabel(nextEncounter, 'the next encounter')} first.`
        };
    }

    createConversationTopicCompletion(topic, completionMarker, askedAt) {
        if (!topic || typeof topic !== 'object') {
            return null;
        }

        const topicId = this.normalizeText(topic.id, this.normalizeText(topic.topicId));
        const topicLabel = this.normalizeText(topic.label, this.normalizeText(topic.topicLabel));
        const topicResponse = this.normalizeText(topic.response, this.normalizeText(topic.topicResponse));
        const resolvedCompletionMarker = this.normalizeText(topic.completionMarker, completionMarker);

        if (!topicId && !topicLabel && !topicResponse && !resolvedCompletionMarker) {
            return null;
        }

        return {
            topicId,
            topicLabel,
            topicResponse,
            completionMarker: resolvedCompletionMarker,
            askedAt,
            verification: this.createConversationVerificationCompletion(topic.verificationResult)
        };
    }

    createConversationVerificationCompletion(verificationResult) {
        if (!verificationResult || typeof verificationResult !== 'object') {
            return null;
        }

        const selectedPhrase = this.normalizeText(verificationResult.selectedPhrase);
        const prompt = this.normalizeText(verificationResult.prompt);
        const expectedPhrase = this.normalizeText(verificationResult.expectedPhrase);
        const verified = verificationResult.verified === true;

        if (!selectedPhrase && !prompt && !expectedPhrase) {
            return null;
        }

        return {
            id: this.normalizeText(verificationResult.id),
            prompt,
            expectedPhrase,
            selectedLabel: this.normalizeText(verificationResult.selectedLabel),
            selectedPhrase,
            verified,
            message: this.normalizeText(verificationResult.message)
        };
    }

    recordObjectiveConversationTopic(objective, topic, completionMarker, askedAt) {
        const completion = this.createConversationTopicCompletion(topic, completionMarker, askedAt);
        if (!completion) {
            return;
        }

        objective.completedTopics = [
            ...(Array.isArray(objective.completedTopics) ? objective.completedTopics : []),
            completion
        ];
    }

    createVendorDiscoveryResult({ quest, objective, vendorId, visitedCount, totalCount, questCompleted, nextEncounter = null }) {
        const vendorName = this.normalizeText(objective?.vendorName, 'Unknown Vendor');
        const booth = this.normalizeText(objective?.booth);
        const boothLabel = booth ? ` (${booth})` : '';
        const nextEncounterText = !questCompleted && nextEncounter
            ? `\nNext encounter: ${this.createEncounterVendorLabel(nextEncounter)}.`
            : '';
        const verificationText = this.createVerificationFeedbackText(objective);
        const verificationPrefix = verificationText ? `${verificationText}\n` : '';

        return {
            updated: true,
            blocked: false,
            reason: '',
            questCompleted,
            questId: quest.id,
            questTitle: quest.title,
            vendorId,
            vendorName,
            booth,
            clue: this.normalizeText(objective?.clue),
            visitedCount,
            totalCount,
            nextVendorId: this.normalizeText(nextEncounter?.vendorId),
            nextVendorName: this.normalizeText(nextEncounter?.vendorName),
            nextBooth: this.normalizeText(nextEncounter?.booth),
            message: `${verificationPrefix}Passport stamp earned: ${vendorName}${boothLabel}\n${quest.title} progress: ${visitedCount}/${totalCount} vendors visited.${nextEncounterText}`
        };
    }

    createVerificationFeedbackText(objective) {
        const completedTopics = Array.isArray(objective?.completedTopics) ? objective.completedTopics : [];
        const latestTopic = completedTopics[completedTopics.length - 1] ?? null;
        const verification = latestTopic?.verification;

        if (verification?.verified !== true) {
            return '';
        }

        return this.normalizeText(verification.message, `Verification accepted: ${verification.selectedPhrase}.`);
    }

    checkVendorDiscoveryResult(vendorId, vendorData = {}) {
        const resolvedVendorId = this.normalizeText(vendorId ?? vendorData?.id);
        if (!resolvedVendorId) {
            return this.createEmptyVendorDiscoveryResult();
        }

        const requestedCompletionMarker = this.normalizeText(vendorData?.completionMarker);

        let questUpdated = false;
        let questCompleted = false;
        let discoveryResult = this.createEmptyVendorDiscoveryResult(resolvedVendorId);

        this.activeQuests.forEach(quest => {
            if (quest.type !== 'discovery') {
                return;
            }

            const encounter = getEncounterForVendor(quest, resolvedVendorId);
            if (!encounter) {
                return;
            }

            if (encounter.locked) {
                if (!questUpdated) {
                    discoveryResult = this.createBlockedVendorDiscoveryResult({
                        quest,
                        encounter,
                        nextEncounter: createEncounterChain(quest).nextEncounter,
                        vendorId: resolvedVendorId
                    });
                }
                return;
            }

            const encounterCompletionMarker = this.normalizeText(encounter?.completionMarker);
            if (encounterCompletionMarker !== requestedCompletionMarker) {
                return;
            }

            if (!encounter.available) {
                return;
            }

            quest.objectives.forEach(objective => {
                if (objective.visited || objective.vendorId !== resolvedVendorId) {
                    return;
                }

                const visitedAt = Date.now();

                objective.visited = true;
                objective.visitedAt = visitedAt;
                objective.vendorName = this.normalizeText(vendorData.name, objective.vendorName);
                objective.booth = this.normalizeText(vendorData.booth, objective.booth);
                objective.clue = this.resolveDiscoveryClue({
                    ...objective,
                    ...vendorData,
                    name: this.normalizeText(vendorData.name, objective.vendorName),
                    booth: this.normalizeText(vendorData.booth, objective.booth)
                });
                this.recordObjectiveConversationTopic(
                    objective,
                    vendorData.conversationTopic,
                    requestedCompletionMarker,
                    visitedAt
                );
                questUpdated = true;

                const allObjectivesComplete = quest.objectives.every(obj => obj.visited);
                const nextEncounter = allObjectivesComplete ? null : createEncounterChain(quest).nextEncounter;
                discoveryResult = this.createVendorDiscoveryResult({
                    quest,
                    objective,
                    vendorId: resolvedVendorId,
                    visitedCount: quest.objectives.filter(obj => obj.visited).length,
                    totalCount: quest.objectives.length,
                    questCompleted: allObjectivesComplete,
                    nextEncounter
                });

                if (allObjectivesComplete) {
                    questCompleted = true;
                    this.completeQuest(quest.id);
                }
            });
        });

        if (questUpdated) {
            this.saveSessionState();
            if (!questCompleted) {
                this.notifyQuestStateChanged();
            }
        }

        return discoveryResult;
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
        this.notifyQuestStateChanged();
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
            activeVendorIds: this.activeVendorIds,
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            timestamp: Date.now()
        };

        writeQuestSessionState(sessionData);
    }

    /**
     * Load session state from cookies
     */
    loadSessionState() {
        if (this.testMode) {
            return;
        }

        const sessionData = readQuestSessionState({
            onParseError: (error) => console.warn('Failed to parse quest session cookie:', error)
        });

        if (sessionData) {
            this.sessionId = sessionData.sessionId;
            this.activeQuests = sessionData.activeQuests || [];
            this.completedQuests = sessionData.completedQuests || [];
            if (Array.isArray(sessionData.activeVendorIds)) {
                this.setSessionVendorIds(sessionData.activeVendorIds);
            }
            console.log('Loaded quest session:', this.sessionId);
            return;
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
        this.activeVendorIds = [];

        clearQuestSessionState();

        console.log('Quest session cleared');
        this.notifyQuestStateChanged();
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

export default QuestManager;