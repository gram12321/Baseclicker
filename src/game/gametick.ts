// Simple gametick system
import { runTickHooks } from '../hooks/gametickHook';
import { advanceProduction } from '../production';
import { Inventory } from '../inventory';
import { autoSellResource } from '../economy';
import { getAutoSellAmount, isAutoSellEnabled } from '../gameState';
import { ResourceType } from '../resource';

let gameday = 0;

/**
 * Advances the game by one tick (one day).
 */
export function tick(inventory?: Inventory) {
    gameday += 1;
    // Advance production first (no-op if inventory not provided)
    try {
        advanceProduction(inventory ?? null);
    } catch (e) {
        // swallow errors from production to avoid breaking core tick
    }
    if (inventory) {
        for (const resourceType of Object.values(ResourceType)) {
            if (isAutoSellEnabled(resourceType)) {
                autoSellResource(inventory, resourceType, 0, getAutoSellAmount(resourceType));
            }
        }
    }
    runTickHooks();
}

/**
 * Get the current gameday.
 */
export function getGameday() {
    return gameday;
}

