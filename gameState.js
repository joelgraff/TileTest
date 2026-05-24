class GameState {
    constructor({
        score = 0,
        inventory = [],
        activeQuests = [],
        completedQuests = []
    } = {}) {
        this.score = Number.isFinite(score) ? score : 0;
        this.inventory = Array.isArray(inventory) ? inventory : [];
        this.activeQuests = Array.isArray(activeQuests) ? activeQuests : [];
        this.completedQuests = Array.isArray(completedQuests) ? completedQuests : [];
    }
}

export default GameState;