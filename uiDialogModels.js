export function createInventoryDialogData({ inventory = [], onClose }) {
    let inventoryText = 'INVENTORY\n\n';

    if (inventory.length === 0) {
        inventoryText += 'No items collected yet.';
    } else {
        inventory.forEach((item, index) => {
            inventoryText += `${index + 1}. ${item.name}\n`;

            if (item.description) {
                inventoryText += `   ${item.description}\n`;
            }

            inventoryText += `   Value: ${item.value || 0} points\n\n`;
        });
    }

    return {
        renderMode: 'dom',
        title: 'Inventory',
        text: inventoryText,
        buttons: [],
        exitButton: {
            label: 'Close',
            onClick: onClose
        }
    };
}

export function createQuestUnavailableDialogData({ onClose }) {
    return {
        renderMode: 'dom',
        title: 'Quests',
        text: 'Quest system not available',
        exitButton: {
            label: 'Close',
            onClick: onClose
        }
    };
}

function appendCollectionQuestProgress(questItems, quest) {
    const completedObjectives = quest.objectives.filter((objective) => objective.collected).length;
    const totalObjectives = quest.objectives.length;

    questItems.push(`   Progress: ${completedObjectives}/${totalObjectives} items collected`);
}

function appendDiscoveryQuestProgress(questItems, quest) {
    const completedObjectives = quest.objectives.filter((objective) => objective.visited).length;
    const totalObjectives = quest.objectives.length;

    questItems.push(`   Progress: ${completedObjectives}/${totalObjectives} vendors visited`);
    quest.objectives.forEach((objective) => {
        const status = objective.visited ? '✓' : '-';
        const booth = objective.booth ? ` (${objective.booth})` : '';
        const clue = objective.clue ? `: ${objective.clue}` : '';

        questItems.push(`   ${status} ${objective.vendorName}${booth}${clue}`);
    });
}

function appendQuestProgress(questItems, quest) {
    if (quest.type === 'discovery') {
        appendDiscoveryQuestProgress(questItems, quest);
        return;
    }

    appendCollectionQuestProgress(questItems, quest);
}

export function createQuestDialogData({ activeQuests = [], completedQuests = [], page = 0, onClose }) {
    const questItems = [];

    if (activeQuests.length > 0) {
        questItems.push('=== ACTIVE QUESTS ===');
        activeQuests.forEach((quest, index) => {
            questItems.push(`${index + 1}. ${quest.title}`);
            questItems.push(`   ${quest.description}`);
            appendQuestProgress(questItems, quest);
            questItems.push('');
        });
    } else {
        questItems.push('=== ACTIVE QUESTS ===');
        questItems.push('No active quests');
        questItems.push('');
    }

    if (completedQuests.length > 0) {
        questItems.push('=== COMPLETED QUESTS ===');
        completedQuests.forEach((quest, index) => {
            questItems.push(`${index + 1}. ${quest.title} ✓`);
            questItems.push(`   Reward: ${quest.reward.points} points`);
            questItems.push('');
        });
    }

    return {
        renderMode: 'dom',
        title: 'Quests',
        text: questItems,
        textPagination: {
            currentPage: page,
            text: questItems
        },
        buttons: [],
        exitButton: {
            label: 'Close',
            onClick: onClose
        }
    };
}

export function createQuestCompletionDialogData({ quest, onClose }) {
    return {
        renderMode: 'dom',
        title: 'Quest Completed!',
        text: `${quest.title}\n\nReward: ${quest.reward.points} points\n\n${quest.reward.description}`,
        buttons: [{
            label: 'Great!',
            onClick: onClose
        }]
    };
}

export function createHelpDialogData({ onClose }) {
    return {
        renderMode: 'dom',
        title: 'Help',
        text: 'HELP\n\n'
            + 'Controls:\n'
            + 'WASD or Arrow Keys: Move player\n'
            + 'Mouse Click: Interact with NPCs\n'
            + 'Spacebar: Interact with nearby vendor\n'
            + 'ESC: Close dialogs\n'
            + 'Backtick (`): Toggle debug mode\n\n'
            + 'Gameplay:\n'
            + 'Talk to vendors to collect items and complete quests.\n'
            + 'Check your inventory and quests using the buttons.\n'
            + 'Explore the map to find more vendors!',
        exitButton: {
            label: 'Close',
            onClick: onClose
        }
    };
}