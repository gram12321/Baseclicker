// Hook system for gametick

const tickHooks: Array<() => void> = [];

/**
 * Register a function to be called after each tick.
 */
export function onTick(hook: () => void) {
    tickHooks.push(hook);
}

/**
 * Call all registered hooks (used by the gametick system)
 */
export function runTickHooks() {
    for (const hook of tickHooks) {
        hook();
    }
}
