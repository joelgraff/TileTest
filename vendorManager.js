import DomainManager from './domainManager.js';
import {
    createVendorContentProfile,
    createVendorFactLines
} from './vendorContentProfile.js';
import {
    createVendorBoothInfoDialogData,
    createVendorContinueDialogData,
    createVendorExitButton,
    createVendorFactsDialogData,
    createVendorItemsDialogData,
    createVendorMessageDialogData,
    createVendorResponseButtons,
    createVendorReturnButton,
    createVendorRootDialogData
} from './vendorDialogModels.js';

class VendorManager {
    constructor(scene, {
        uiManager = null,
        state = null,
        showDialog = null,
        closeDialog = null,
        collectVendorItem = null,
        isDialogOpen = null,
        npcGroup = null,
        player = null,
        camera = null,
        gameObjectFactory = null,
        liveContentService = null,
        testMode = null
    } = {}) {
        this.scene = scene;
        this.state = state ?? scene.gameState ?? null;
        this.vendors = scene.vendors || [];
        this.showDialog = showDialog ?? uiManager?.showDialog?.bind(uiManager) ?? null;
        this.closeDialog = closeDialog ?? uiManager?.closeDialog?.bind(uiManager) ?? null;
        this.collectVendorItem = collectVendorItem ?? uiManager?.collectVendorItem?.bind(uiManager) ?? null;
        this.isDialogOpen = typeof isDialogOpen === 'function'
            ? isDialogOpen
            : () => Boolean(uiManager?.isDialogOpen);
        this.npcGroup = npcGroup ?? scene.npcGroup ?? null;
        this.player = player ?? scene.player ?? null;
        this.camera = camera ?? scene.cameras?.main ?? null;
        this.gameObjectFactory = gameObjectFactory ?? scene.add ?? null;
        this.liveContentService = liveContentService ?? scene.liveVendorContentService ?? null;
        this.testMode = testMode ?? scene.testMode ?? false;
        this.interactionRange = 60;
        this.nearbyVendor = null;
        this.vendorAssignmentDone = false;

        this.assignVendorsToNPCs();
        this.createInteractionPrompt();
    }

    getNPCSprites() {
        return this.npcGroup?.getChildren?.() ?? [];
    }

    getAssignedVendors() {
        return this.getNPCSprites()
            .map(npcSprite => npcSprite.vendorData)
            .filter(Boolean);
    }

    isInteractionAvailable() {
        const isDialogOpen = typeof this.isDialogOpen === 'function'
            ? this.isDialogOpen()
            : Boolean(this.isDialogOpen ?? this.uiManager?.isDialogOpen);

        return Boolean(this.state?.interactionsEnabled) && DomainManager.isLoaded() && !isDialogOpen;
    }

    assignVendorsToNPCs() {
        if (this.vendorAssignmentDone) return;
        if (!this.npcGroup || !this.vendors.length || !this.gameObjectFactory) return;

        this.getNPCSprites().forEach((npcSprite, index) => {
            npcSprite.vendorData = this.getAssignedVendor(index);

            // Pulsing glow effect
            if (npcSprite.glowGraphic) {
                npcSprite.glowGraphic.destroy();
            }
            const glow = this.gameObjectFactory.graphics();
            glow.setDepth(npcSprite.depth ? npcSprite.depth - 1 : 0);
            glow.setVisible(false);
            npcSprite.glowGraphic = glow;
            npcSprite.glowPulse = 0;
        });
        this.vendorAssignmentDone = true;
    }

    getAssignedVendor(index) {
        if (this.testMode) {
            return this.vendors[index % this.vendors.length];
        }

        return this.vendors[Math.floor(Math.random() * this.vendors.length)];
    }

    createInteractionPrompt() {
        this.interactionPrompt = this.gameObjectFactory.text(400, 100, 'PRESS SPACE TO TALK', {
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
    }

    interactWithVendorSprite(npcSprite = null) {
        const vendorData = npcSprite?.vendorData;
        if (!vendorData) {
            return false;
        }

        return this.interactWithVendor(vendorData, npcSprite);
    }

    getVendorImageKey(vendorData, npcSprite = null) {
        return npcSprite ? npcSprite.texture.key : (vendorData.imageKey || 'npc1');
    }

    getLiveAnnouncementsForVendor(vendorId) {
        return this.liveContentService?.getAnnouncementsForVendor?.(vendorId) ?? [];
    }

    getLiveContentForVendor(vendorId) {
        const liveContent = this.liveContentService?.getContentForVendor?.(vendorId);
        if (liveContent) {
            return liveContent;
        }

        return {
            announcements: this.getLiveAnnouncementsForVendor(vendorId)
        };
    }

    getVendorContentProfile(vendorData, { includeFacts = false } = {}) {
        const allDomainFacts = includeFacts ? DomainManager.getDomainFacts(vendorData.domain_id) : [];
        const maxFactsPerVendor = 6;
        const selectedFacts = allDomainFacts.length <= maxFactsPerVendor
            ? allDomainFacts
            : this.getRandomFacts(allDomainFacts, maxFactsPerVendor);

        return createVendorContentProfile(vendorData, {
            domainName: DomainManager.getDomainName(vendorData.domain_id),
            items: DomainManager.getDomainItems(vendorData.domain_id),
            facts: selectedFacts,
            ...(this.getLiveContentForVendor?.(vendorData.id) ?? {
                announcements: this.getLiveAnnouncementsForVendor?.(vendorData.id) ?? []
            })
        });
    }

    createReturnButton(dialogData, label = 'Back') {
        return createVendorReturnButton(dialogData, {
            showDialog: this.showDialog,
            label
        });
    }

    buildVendorMessageDialogData(text, originalDialogData) {
        return createVendorMessageDialogData(text, {
            returnButton: this.createReturnButton(originalDialogData)
        });
    }

    buildVendorContinueDialogData(message, onContinue) {
        return createVendorContinueDialogData(message, { onContinue });
    }

    buildVendorBoothInfoDialogData(vendorData, imageKey, originalDialogData) {
        const vendorContent = this.getVendorContentProfile?.(vendorData) ?? createVendorContentProfile(vendorData, {
            domainName: DomainManager.getDomainName(vendorData.domain_id)
        });

        return createVendorBoothInfoDialogData(vendorContent, imageKey, {
            returnButton: this.createReturnButton(originalDialogData)
        });
    }

    getVendorFactDisplayItems(vendorData) {
        const vendorContent = this.getVendorContentProfile?.(vendorData, { includeFacts: true }) ?? createVendorContentProfile(vendorData, {
            facts: DomainManager.getDomainFacts(vendorData.domain_id)
        });
        if (vendorContent.facts.length === 0) {
            return [];
        }

        return createVendorFactLines(vendorContent);
    }

    buildVendorFactsDialogData(vendorData, imageKey, originalDialogData) {
        const formattedFacts = this.getVendorFactDisplayItems(vendorData);
        if (formattedFacts.length === 0) {
            return this.buildVendorMessageDialogData('No facts available at this time.', originalDialogData);
        }

        return createVendorFactsDialogData(vendorData, imageKey, {
            formattedFacts,
            exitButton: this.createReturnButton(originalDialogData)
        });
    }

    buildVendorItemsDialogData(vendorData, imageKey, originalDialogData, page = 0) {
        const vendorContent = this.getVendorContentProfile?.(vendorData) ?? createVendorContentProfile(vendorData, {
            domainName: DomainManager.getDomainName(vendorData.domain_id),
            items: DomainManager.getDomainItems(vendorData.domain_id)
        });
        if (vendorContent.items.length === 0) {
            return this.buildVendorMessageDialogData('No items available at this time.', originalDialogData);
        }

        const itemsPerPage = 4;
        const totalPages = Math.ceil(vendorContent.items.length / itemsPerPage);
        const startIndex = page * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, vendorContent.items.length);
        const pageItems = vendorContent.items.slice(startIndex, endIndex);

        const itemButtons = pageItems.map(item => ({
            label: item.name,
            onClick: () => {
                const collectionResult = this.collectVendorItem?.(item, vendorData.id);

                this.showDialog?.(this.buildVendorContinueDialogData(
                    collectionResult.message,
                    () => this.showDialog?.(this.buildVendorItemsDialogData(vendorData, imageKey, originalDialogData, page))
                ));
            }
        }));

        const bottomButtons = [];
        if (totalPages > 1) {
            bottomButtons.push({
                label: '<',
                disabled: page <= 0,
                onClick: page > 0
                    ? () => this.showDialog?.(this.buildVendorItemsDialogData(vendorData, imageKey, originalDialogData, page - 1))
                    : () => {}
            });
            bottomButtons.push({
                label: '>',
                disabled: page >= totalPages - 1,
                onClick: page < totalPages - 1
                    ? () => this.showDialog?.(this.buildVendorItemsDialogData(vendorData, imageKey, originalDialogData, page + 1))
                    : () => {}
            });
        } else {
            bottomButtons.push({ label: '<', disabled: true, onClick: () => {} });
            bottomButtons.push({ label: '>', disabled: true, onClick: () => {} });
        }

        return createVendorItemsDialogData(vendorData, imageKey, {
            page,
            totalPages,
            domainName: vendorContent.domainName,
            itemButtons,
            bottomButtons,
            exitButton: this.createReturnButton(originalDialogData)
        });
    }

    handleVendorResponse(response, vendorData, imageKey, originalDialogData) {
        if (response.action === 'show_items') {
            this.showDialog?.(this.buildVendorItemsDialogData(vendorData, imageKey, originalDialogData));
            return;
        }

        if (response.action === 'booth_info') {
            this.showDialog?.(this.buildVendorBoothInfoDialogData(vendorData, imageKey, originalDialogData));
            return;
        }

        if (response.action === 'tech_facts') {
            this.showDialog?.(this.buildVendorFactsDialogData(vendorData, imageKey, originalDialogData));
            return;
        }

        this.showDialog?.(this.buildVendorMessageDialogData('', originalDialogData));
    }

    createVendorResponseButtons(vendorData, imageKey, originalDialogData, vendorContent = vendorData) {
        return createVendorResponseButtons(vendorContent, {
            imageKey,
            originalDialogData,
            handleVendorResponse: (response, _dialogVendorData, dialogImageKey, dialogData) => {
                this.handleVendorResponse(response, vendorData, dialogImageKey, dialogData);
            }
        });
    }

    createVendorExitButton(vendorData) {
        return createVendorExitButton(vendorData, {
            closeDialog: () => this.closeDialog?.()
        });
    }

    buildVendorRootDialogData(vendorData, imageKey, resolvedVendorContent = null) {
        const vendorContent = resolvedVendorContent ?? this.getVendorContentProfile?.(vendorData) ?? createVendorContentProfile(vendorData, {
            domainName: DomainManager.getDomainName(vendorData.domain_id)
        });
        const dialogData = createVendorRootDialogData(vendorContent, {
            imageKey,
            buttons: [],
            exitButton: this.createVendorExitButton(vendorContent)
        });

        dialogData.buttons = this.createVendorResponseButtons(vendorData, imageKey, dialogData, vendorContent);
        return dialogData;
    }

    buildVendorDiscoveryFeedbackText(discoveryResult) {
        if (!discoveryResult?.updated || discoveryResult.questCompleted) {
            return '';
        }

        return discoveryResult.message ?? '';
    }

    withVendorDiscoveryFeedback(dialogData, feedbackText) {
        if (!feedbackText) {
            return dialogData;
        }

        return {
            ...dialogData,
            text: `${feedbackText}\n\n${dialogData.text ?? ''}`
        };
    }

    showVendorDiscoveryFeedback(discoveryResult, { vendorData, imageKey, vendorContent }) {
        const feedbackText = this.buildVendorDiscoveryFeedbackText(discoveryResult);
        if (!feedbackText) {
            return;
        }

        this.showDialog?.(this.withVendorDiscoveryFeedback(
            this.buildVendorRootDialogData(vendorData, imageKey, vendorContent),
            feedbackText
        ));
    }

    markVendorDiscovery(vendorData, vendorContent) {
        const questManager = this.scene?.questManager;

        if (typeof questManager?.checkVendorDiscoveryResult === 'function') {
            return questManager.checkVendorDiscoveryResult(vendorData?.id, vendorContent ?? vendorData);
        }

        const updated = questManager?.checkVendorDiscovery?.(vendorData?.id, vendorContent ?? vendorData) ?? false;

        return {
            updated: Boolean(updated),
            questCompleted: false,
            message: ''
        };
    }

    interactWithVendor(vendorData, npcSprite = null) {
        console.log('Attempting to interact with vendor:', vendorData);
        if (!vendorData || !DomainManager.isLoaded() || !this.showDialog) {
            return false;
        }

        this.interactionPrompt.setVisible(false);

        const imageKey = this.getVendorImageKey(vendorData, npcSprite);
        const vendorContent = this.getVendorContentProfile?.(vendorData) ?? createVendorContentProfile(vendorData, {
            domainName: DomainManager.getDomainName(vendorData.domain_id)
        });

        this.showDialog(this.buildVendorRootDialogData(vendorData, imageKey, vendorContent));
        const discoveryResult = this.markVendorDiscovery(vendorData, vendorContent);
        this.showVendorDiscoveryFeedback(discoveryResult, { vendorData, imageKey, vendorContent });
        return true;
    }

    getRandomFacts(factsArray, count) {
        // Create a copy of the array to avoid modifying the original
        const facts = [...factsArray];

        // Shuffle the array using Fisher-Yates algorithm
        for (let i = facts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [facts[i], facts[j]] = [facts[j], facts[i]];
        }

        // Return the first 'count' facts
        return facts.slice(0, count);
    }

    update() {
        this.assignVendorsToNPCs();

        if (!this.player || !this.npcGroup || !this.camera) return;

        if (!DomainManager.isLoaded()) {
            this.nearbyVendor = null;
            this.interactionPrompt.setVisible(false);
            return;
        }

        this.nearbyVendor = null;

        // Clear all effects
        this.getNPCSprites().forEach(npcSprite => {
            if (npcSprite.glowGraphic) npcSprite.glowGraphic.setVisible(false);
        });

        // Find the closest vendor in range
        let closestVendor = null;
        let closestDistance = this.interactionRange;

        this.getNPCSprites().forEach(npcSprite => {
            if (!npcSprite.vendorData) return;

            const distance = Phaser.Math.Distance.Between(
                this.player.x,
                this.player.y,
                npcSprite.x,
                npcSprite.y
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestVendor = npcSprite;
            }
        });

        // Apply effect to the closest one
        if (closestVendor) {
            this.nearbyVendor = closestVendor;
            this.interactionPrompt.x = closestVendor.x - this.camera.scrollX;
            this.interactionPrompt.y = closestVendor.y - this.camera.scrollY - 40;

            // Pulsing circular glow effect
            if (closestVendor.glowGraphic) {
                closestVendor.glowPulse = (closestVendor.glowPulse || 0) + 0.08;
                const pulse = 0.7 + 0.3 * Math.sin(closestVendor.glowPulse);
                closestVendor.glowGraphic.clear();
                closestVendor.glowGraphic.fillStyle(0x00FFFF, 0.25 + 0.25 * pulse);
                closestVendor.glowGraphic.fillCircle(
                    closestVendor.x,
                    closestVendor.y,
                    (closestVendor.displayWidth * 0.7) + (closestVendor.displayWidth * 0.3 * pulse)
                );
                closestVendor.glowGraphic.setVisible(true);
            }
        } else {
            this.nearbyVendor = null;
        }

        if (this.nearbyVendor && this.isInteractionAvailable()) {
            this.interactionPrompt.setVisible(true);
        } else {
            this.interactionPrompt.setVisible(false);
        }
    }
}

export default VendorManager;