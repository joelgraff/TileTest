export function initializeInteractionReadiness({
    questManager,
    vendors,
    setInteractionsEnabled,
    discoveryTrails = [],
    liveVendorContentService = null,
    liveContentReadyPromise = null
}) {
    return Promise.resolve(liveContentReadyPromise)
        .then(() => {
            const liveDiscoveryTrails = liveVendorContentService?.getDiscoveryTrails?.() ?? [];
            const resolvedDiscoveryTrails = Array.isArray(liveDiscoveryTrails) && liveDiscoveryTrails.length > 0
                ? liveDiscoveryTrails
                : discoveryTrails;

            return questManager.init(vendors, { discoveryTrails: resolvedDiscoveryTrails });
        })
        .then(isReady => {
            setInteractionsEnabled(isReady);
            return isReady;
        });
}