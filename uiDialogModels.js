import { createFestivalLog, hasFestivalLogActivity } from './festivalLog.js';

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
        const goal = objective.goal ? ` Goal: ${objective.goal}` : '';

        questItems.push(`   ${status} ${objective.vendorName}${booth}${clue}${goal}`);
    });
}

function appendQuestProgress(questItems, quest) {
    if (quest.type === 'discovery') {
        appendDiscoveryQuestProgress(questItems, quest);
        return;
    }

    appendCollectionQuestProgress(questItems, quest);
}

function appendStampLine(questItems, stamp) {
    const booth = stamp.booth ? ` (${stamp.booth})` : '';
    const clue = stamp.clue ? `: ${stamp.clue}` : '';
    const goal = stamp.goal ? ` Goal: ${stamp.goal}` : '';

    questItems.push(`   ✓ ${stamp.vendorName}${booth}${clue}${goal}`);
}

function createEncounterLine(encounter) {
    const booth = encounter.booth ? ` (${encounter.booth})` : '';
    const clue = encounter.clue ? `: ${encounter.clue}` : '';
    const goal = encounter.goal ? ` Goal: ${encounter.goal}` : '';

    return `${encounter.vendorName}${booth}${clue}${goal}`;
}

function appendCompletedFestivalTrails(questItems, completedDiscoveryTrails) {
    if (completedDiscoveryTrails.length === 0) {
        return;
    }

    questItems.push('Completed trails:');
    completedDiscoveryTrails.forEach((trail, index) => {
        questItems.push(`${index + 1}. ${trail.title} ✓`);
        if (trail.rewardPoints > 0) {
            questItems.push(`   Reward: ${trail.rewardPoints} points`);
        }
        if (trail.completionText) {
            questItems.push(`   ${trail.completionText}`);
        }
        trail.stamps.forEach(stamp => appendStampLine(questItems, stamp));
    });
}

function appendActiveFestivalStamps(questItems, activeDiscoveryTrails) {
    const activeStamps = activeDiscoveryTrails.flatMap(trail => trail.stamps.map(stamp => ({
        ...stamp,
        trailTitle: trail.title
    })));

    if (activeStamps.length === 0) {
        return;
    }

    questItems.push('Stamps in progress:');
    activeStamps.forEach(stamp => {
        questItems.push(`- ${stamp.trailTitle}`);
        appendStampLine(questItems, stamp);
    });
}

function appendNextFestivalEncounters(questItems, activeDiscoveryTrails) {
    const nextEncounters = activeDiscoveryTrails
        .filter(trail => trail.nextEncounter)
        .map(trail => ({
            trailTitle: trail.title,
            encounter: trail.nextEncounter
        }));

    if (nextEncounters.length === 0) {
        return;
    }

    questItems.push('Next encounters:');
    nextEncounters.forEach(({ trailTitle, encounter }) => {
        questItems.push(`- ${trailTitle}: ${createEncounterLine(encounter)}`);
    });
}

function appendFestivalLog(questItems, festivalLog) {
    questItems.push('=== FESTIVAL LOG ===');

    if (!hasFestivalLogActivity(festivalLog)) {
        questItems.push('No passport stamps logged yet.');
        questItems.push('');
        return;
    }

    questItems.push(`Score: ${festivalLog.score} points`);
    questItems.push(`Passport stamps: ${festivalLog.stampCount}`);

    if (festivalLog.rewardPoints > 0) {
        questItems.push(`Quest rewards earned: ${festivalLog.rewardPoints} points`);
    }

    if (festivalLog.collectedItemCount > 0) {
        questItems.push(`Items collected: ${festivalLog.collectedItemCount}`);
    }

    appendNextFestivalEncounters(questItems, festivalLog.activeDiscoveryTrails);
    appendCompletedFestivalTrails(questItems, festivalLog.completedDiscoveryTrails);
    appendActiveFestivalStamps(questItems, festivalLog.activeDiscoveryTrails);
    questItems.push('');
}

export function createQuestDialogData({
    activeQuests = [],
    completedQuests = [],
    inventory = [],
    score = 0,
    festivalLog = null,
    page = 0,
    onClose
}) {
    const questItems = [];
    const resolvedFestivalLog = festivalLog ?? createFestivalLog({
        activeQuests,
        completedQuests,
        inventory,
        score
    });

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

    appendFestivalLog(questItems, resolvedFestivalLog);

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