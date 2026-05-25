export function initializeInteractionReadiness({
    questManager,
    vendors,
    setInteractionsEnabled
}) {
    return questManager.init(vendors)
        .then(isReady => {
            setInteractionsEnabled(isReady);
            return isReady;
        });
}