// Simple gametick system
import { runTickHooks } from '../../hooks/gametickHook';
import { advanceProduction } from '../Building';
import { Inventory } from '../inventory';
import { autoSellResource } from '../market/market';
import { getAutoSellAmount, isAutoSellEnabled, getResearchers, addToResearch, getAutoSellMinKeep, getGameState, getInventory } from './gameState';
import { ResourceType } from '../../utils/types';
import { achievementService } from '../../achievements/achievementService';
import { processMarketDiffusion } from '../market/marketDiffusion';

/**
 * Advances the game by one tick (one day).
 */
export function tick(inventory?: Inventory) {
    getGameState().day += 1;
    const activeInventory = inventory ?? getInventory();

    // Process research
    const researchers = getResearchers();
    if (researchers > 0) {
        addToResearch(researchers * 1); // 1 RP per researcher per tick
    }

    // Advance production first (no-op if inventory not provided)
    try {
        advanceProduction(activeInventory);
    } catch (e) {
        // swallow errors from production to avoid breaking core tick
    }
    if (activeInventory) {
        for (const resourceType of Object.values(ResourceType)) {
            if (isAutoSellEnabled(resourceType)) {
                autoSellResource(activeInventory, resourceType, getAutoSellMinKeep(resourceType), getAutoSellAmount(resourceType));
            }
        }
    }

    // Process market diffusion
    processMarketDiffusion();

    runTickHooks();

    // Check achievements
    const unlocked = achievementService.checkAchievements();
    if (unlocked.length > 0) {
        console.log('Achievements Unlocked:', unlocked);
    }
}

/**
 * Get the current gameday.
 */
export function getGameday() {
    return getGameState().day;
}

export function resetGameday(): void {
    getGameState().day = 0;
}

