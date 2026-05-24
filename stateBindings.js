export function bindSceneBooleanFlag(scene, state, key) {
    Object.defineProperty(scene, key, {
        configurable: true,
        enumerable: true,
        get: () => Boolean(state[key]),
        set: (value) => {
            state[key] = Boolean(value);
        }
    });

    return scene;
}