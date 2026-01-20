// Simple gametick system
import { runTickHooks } from '../hooks/gametickHook';

let gameday = 0;

/**
 * Advances the game by one tick (one day).
 */
export function tick() {
    gameday += 1;
    runTickHooks();
}

/**
 * Get the current gameday.
 */
export function getGameday() {
    return gameday;
}
