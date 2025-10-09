class DomainManager {
    static domains = null;

    static async loadDomains() {
        if (DomainManager.domains) {
            return DomainManager.domains;
        }

        try {
            const response = await fetch('technology_domains.json');
            if (!response.ok) {
                throw new Error(`Failed to load domains: ${response.status}`);
            }
            DomainManager.domains = await response.json();
            console.log(`Loaded ${DomainManager.domains.length} technology domains`);
            return DomainManager.domains;
        } catch (error) {
            console.error('Error loading technology domains:', error);
            // Return empty array as fallback
            DomainManager.domains = [];
            return DomainManager.domains;
        }
    }

    static getDomainById(domainId) {
        if (!DomainManager.domains) {
            console.warn('Domains not loaded yet. Call loadDomains() first.');
            return null;
        }

        return DomainManager.domains.find(domain => domain.id === domainId) || null;
    }

    static getAllDomains() {
        if (!DomainManager.domains) {
            console.warn('Domains not loaded yet. Call loadDomains() first.');
            return [];
        }

        return [...DomainManager.domains];
    }

    static getDomainName(domainId) {
        const domain = DomainManager.getDomainById(domainId);
        return domain ? domain.name : 'Unknown Domain';
    }

    static getDomainDescription(domainId) {
        const domain = DomainManager.getDomainById(domainId);
        return domain ? domain.description : 'No description available';
    }

    static getDomainKeywords(domainId) {
        const domain = DomainManager.getDomainById(domainId);
        return domain ? domain.keywords : [];
    }

    static isValidDomain(domainId) {
        return DomainManager.getDomainById(domainId) !== null;
    }

    // Get a random domain (useful for procedural generation)
    static getRandomDomain() {
        if (!DomainManager.domains || DomainManager.domains.length === 0) {
            console.warn('No domains available');
            return null;
        }

        const randomIndex = Math.floor(Math.random() * DomainManager.domains.length);
        return DomainManager.domains[randomIndex];
    }

    // Get domains suitable for quest generation (exclude hardware as it's too generic)
    static getQuestDomains() {
        if (!DomainManager.domains) {
            console.warn('Domains not loaded yet. Call loadDomains() first.');
            return [];
        }

        // Filter out hardware domain as it's too generic for quests
        return DomainManager.domains.filter(domain => domain.id !== 'hardware');
    }
}

export default DomainManager;