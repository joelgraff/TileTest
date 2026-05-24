class GameState {
    constructor({
        score = 0,
        inventory = [],
        activeQuests = [],
        completedQuests = [],
        isDialogOpen = false,
        isInventoryOpen = false,
        isQuestsOpen = false,
        isHelpOpen = false
    } = {}) {
        this.score = Number.isFinite(score) ? score : 0;
        this.inventory = Array.isArray(inventory) ? inventory : [];
        this.activeQuests = Array.isArray(activeQuests) ? activeQuests : [];
        this.completedQuests = Array.isArray(completedQuests) ? completedQuests : [];
        this.isDialogOpen = Boolean(isDialogOpen);
        this.isInventoryOpen = Boolean(isInventoryOpen);
        this.isQuestsOpen = Boolean(isQuestsOpen);
        this.isHelpOpen = Boolean(isHelpOpen);
    }
}

export default GameState;