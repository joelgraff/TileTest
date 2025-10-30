class QuestStorage {
    constructor(questManager) {
        this.questManager = questManager;
    }

    /**
     * Save session state to cookies
     */
    saveSessionState() {
        const sessionData = {
            sessionId: this.questManager.sessionId,
            activeQuests: this.questManager.activeQuests,
            completedQuests: this.questManager.completedQuests,
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
                    this.questManager.sessionId = sessionData.sessionId;
                    this.questManager.activeQuests = sessionData.activeQuests || [];
                    this.questManager.completedQuests = sessionData.completedQuests || [];
                    console.log('Loaded quest session:', this.questManager.sessionId, 'with', this.questManager.activeQuests.length, 'active quests');
                    return;
                } catch (e) {
                    console.warn('Failed to parse quest session cookie:', e);
                }
            }
        }

        console.log('No valid quest session found in cookies');
    }
}

export default QuestStorage;