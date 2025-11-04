// CrisisManager.js
// Manages NPC crisis states and resolution mechanics

class CrisisManager {
    constructor() {
        this.crisisTypes = this.defineCrisisTypes();
    }

    /**
     * Define all available crisis types with their solutions
     */
    defineCrisisTypes() {
        return {
            'hardware_failure': {
                name: 'Hardware Failure',
                description: 'My computer won\'t turn on! I think the power supply is dead.',
                symptoms: ['Computer won\'t power on', 'No lights or fans', 'Power button unresponsive'],
                solutions: [
                    {
                        type: 'item',
                        itemName: 'Power Supply Unit',
                        description: 'Replace the faulty power supply with a new one',
                        successMessage: 'The power supply replacement worked! My computer is back online.'
                    }
                ],
                domain: 'hardware'
            },
            'software_crash': {
                name: 'Software Crash',
                description: 'My program keeps crashing with memory errors. I need help understanding RAM issues.',
                symptoms: ['Blue screen of death', 'Application freezing', 'Out of memory errors'],
                solutions: [
                    {
                        type: 'fact',
                        factKeyword: 'memory management',
                        description: 'Explain memory management and RAM troubleshooting',
                        successMessage: 'Your memory management knowledge helped me fix the crashes!'
                    }
                ],
                domain: 'software'
            },
            'network_issue': {
                name: 'Network Problem',
                description: 'I can\'t connect to the internet! Something\'s wrong with my network setup.',
                symptoms: ['No internet connection', 'Connection drops', 'Network configuration issues'],
                solutions: [
                    {
                        type: 'fact',
                        factKeyword: 'network protocol',
                        description: 'Explain TCP/IP and network troubleshooting',
                        successMessage: 'Your network knowledge helped me fix the connection!'
                    }
                ],
                domain: 'networking'
            },
            'storage_failure': {
                name: 'Storage Failure',
                description: 'My hard drive is making clicking sounds and won\'t read data!',
                symptoms: ['Clicking hard drive', 'Data corruption', 'Drive not recognized'],
                solutions: [
                    {
                        type: 'item',
                        itemName: 'Hard Drive',
                        description: 'Replace the failing hard drive',
                        successMessage: 'The new drive works perfectly! My data is safe.'
                    }
                ],
                domain: 'storage'
            },
            'display_problem': {
                name: 'Display Issue',
                description: 'My monitor shows strange colors and distorted images. Graphics card problem?',
                symptoms: ['Color distortion', 'Screen flickering', 'Display artifacts'],
                solutions: [
                    {
                        type: 'fact',
                        factKeyword: 'graphics processing',
                        description: 'Explain GPU and display technology troubleshooting',
                        successMessage: 'Your graphics knowledge helped me fix the display!'
                    }
                ],
                domain: 'graphics'
            },
            'keyboard_failure': {
                name: 'Keyboard Problem',
                description: 'My keyboard isn\'t working properly. Some keys are stuck or unresponsive.',
                symptoms: ['Unresponsive keys', 'Stuck keys', 'Wrong characters appearing'],
                solutions: [
                    {
                        type: 'item',
                        itemName: 'Keyboard',
                        description: 'Replace the faulty keyboard',
                        successMessage: 'The new keyboard works perfectly! Thanks for the replacement.'
                    }
                ],
                domain: 'hardware'
            },
            'printer_jam': {
                name: 'Printer Jam',
                description: 'My printer is jammed and I can\'t clear it. Need help with printer maintenance.',
                symptoms: ['Paper jam', 'Printer not responding', 'Error lights flashing'],
                solutions: [
                    {
                        type: 'fact',
                        factKeyword: 'printer maintenance',
                        description: 'Explain printer jam clearing and maintenance',
                        successMessage: 'Your printer knowledge helped me clear the jam!'
                    }
                ],
                domain: 'hardware'
            }
        };
    }

    /**
     * Assign a random crisis to an NPC
     */
    assignRandomCrisis(npcSprite) {
        const crisisKeys = Object.keys(this.crisisTypes);
        const randomCrisisKey = crisisKeys[Math.floor(Math.random() * crisisKeys.length)];
        const crisis = { ...this.crisisTypes[randomCrisisKey] };

        // Add crisis state to NPC sprite
        npcSprite.crisisState = {
            type: randomCrisisKey,
            crisis: crisis,
            assigned: Date.now(),
            resolved: false
        };

        // Also set crisis data in vendorData for dialog system
        if (npcSprite.vendorData) {
            npcSprite.vendorData.crisis = crisis;
        }

        // Create visual exclamation point indicator
        this.createCrisisIndicator(npcSprite);

        console.log(`Assigned crisis "${crisis.name}" to NPC ${npcSprite.vendorData?.name || 'Unknown'}`);
        return npcSprite.crisisState;
    }

    /**
     * Check if an NPC has an active crisis
     */
    hasActiveCrisis(npcSprite) {
        return npcSprite.crisisState && !npcSprite.crisisState.resolved;
    }

    /**
     * Attempt to resolve an NPC's crisis with an item or fact
     */
    attemptCrisisResolution(npcSprite, itemOrFact, type = 'item') {
        if (!this.hasActiveCrisis(npcSprite)) {
            return { success: false, message: 'This NPC doesn\'t have an active crisis.' };
        }

        const crisis = npcSprite.crisisState.crisis;

        // Check if the item/fact can solve this crisis
        const solution = crisis.solutions.find(sol =>
            sol.type === type &&
            (type === 'item' ? sol.itemName === itemOrFact.name : itemOrFact.toLowerCase().includes(sol.factKeyword))
        );

        if (solution) {
            // Crisis resolved!
            npcSprite.crisisState.resolved = true;
            npcSprite.crisisState.resolvedAt = Date.now();
            npcSprite.crisisState.solution = solution;

            return {
                success: true,
                message: solution.successMessage,
                crisis: crisis,
                solution: solution
            };
        } else {
            // Wrong solution
            return {
                success: false,
                message: 'That doesn\'t seem to help with this particular problem.',
                crisis: crisis
            };
        }
    }

    /**
     * Get crisis description for display (works with crisis object)
     */
    getCrisisDescription(crisis) {
        if (!crisis) return null;

        return {
            title: `EMERGENCY: ${crisis.name}`,
            description: crisis.description,
            symptoms: crisis.symptoms,
            solutions: crisis.solutions.map(sol => ({
                type: sol.type,
                description: sol.description,
                itemName: sol.itemName,
                factKeyword: sol.factKeyword
            }))
        };
    }

    /**
     * Check if an item can resolve a crisis
     */
    canItemResolveCrisis(item, crisis) {
        if (!crisis || !item) return false;

        return crisis.solutions.some(sol =>
            sol.type === 'item' && sol.itemName === item.name
        );
    }

    /**
     * Check if a fact can resolve a crisis
     */
    canFactResolveCrisis(fact, crisis) {
        if (!crisis || !fact) return false;

        return crisis.solutions.some(sol =>
            sol.type === 'fact' && fact.toLowerCase().includes(sol.factKeyword)
        );
    }

    /**
     * Attempt to resolve a crisis with an item or fact (works with crisis object)
     */
    attemptCrisisResolution(crisis, resolutionItem, resolutionType = 'item') {
        if (!crisis) {
            return false;
        }

        // Check if the item/fact can solve this crisis
        const solution = crisis.solutions.find(sol => {
            if (sol.type !== resolutionType) return false;

            if (resolutionType === 'item') {
                return sol.itemName === resolutionItem.name;
            } else {
                return resolutionItem.toLowerCase().includes(sol.factKeyword);
            }
        });

        return !!solution; // Return true if a solution was found
    }

    /**
     * Get all crisis types for quest generation
     */
    getAllCrisisTypes() {
        return Object.values(this.crisisTypes);
    }

    /**
     * Clear crisis from an NPC (used when crisis is resolved)
     */
    clearCrisis(npcSprite) {
        // Clear crisis state from sprite
        if (npcSprite.crisisState) {
            npcSprite.crisisState.resolved = true;
            npcSprite.crisisState.resolvedAt = Date.now();
        }

        // Clear crisis data from vendorData
        if (npcSprite.vendorData && npcSprite.vendorData.crisis) {
            delete npcSprite.vendorData.crisis;
        }

        // Remove visual crisis indicator
        this.removeCrisisIndicator(npcSprite);

        console.log(`Cleared crisis from NPC ${npcSprite.vendorData?.name || 'Unknown'}`);
    }

    /**
     * Create visual exclamation point indicator above NPC with crisis
     */
    createCrisisIndicator(npcSprite) {
        // Remove existing indicator if present
        this.removeCrisisIndicator(npcSprite);

        // Create exclamation point text above the NPC
        const indicator = npcSprite.scene.add.text(
            npcSprite.x,
            npcSprite.y - 60, // Position higher above NPC head
            '!',
            {
                fontSize: '38px',
                fontFamily: 'Arial',
                color: '#ff0000', // Red color for urgency
                stroke: '#ffffff',
                strokeThickness: 4
            }
        );

        // Set depth higher than NPC so it appears above
        indicator.setDepth(npcSprite.depth + 100);

        // Make sure it's visible
        indicator.setVisible(true);

        // Store reference to indicator on the NPC sprite
        npcSprite.crisisIndicator = indicator;

        // Make indicator follow the NPC
        npcSprite.crisisIndicatorUpdater = () => {
            if (npcSprite.crisisIndicator && npcSprite.crisisIndicator.active) {
                npcSprite.crisisIndicator.setPosition(npcSprite.x, npcSprite.y - 60);
            }
        };
    }

    /**
     * Remove visual crisis indicator from NPC
     */
    removeCrisisIndicator(npcSprite) {
        if (npcSprite.crisisIndicator) {
            npcSprite.crisisIndicator.destroy();
            npcSprite.crisisIndicator = null;
        }

        if (npcSprite.crisisIndicatorUpdater) {
            npcSprite.crisisIndicatorUpdater = null;
        }

        console.log(`Removed crisis indicator from NPC ${npcSprite.vendorData?.name || 'Unknown'}`);
    }

    /**
     * Update all crisis indicators (call this in game update loop)
     */
    updateCrisisIndicators(scene) {
        if (!scene.npcGroup) return;

        scene.npcGroup.getChildren().forEach(npcSprite => {
            if (npcSprite.crisisIndicatorUpdater) {
                npcSprite.crisisIndicatorUpdater();
            }
        });
    }
}

export default CrisisManager;