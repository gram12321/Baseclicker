// Simple gametick system
import { runTickHooks } from '../../hooks/gametickHook';
import { advanceProduction } from '../Building';
import { Inventory } from '../inventory';
import { autoSellResource } from '../market/market';
import { getAutoSellAmount, isAutoSellEnabled, getResearchers, addToResearch, getAutoSellMinKeep } from './gameState';
import { ResourceType } from '../../utils/types';
import { achievementService } from '../../achievements/achievementService';
import { processMarketDiffusion } from '../market/marketDiffusion';

let gameday = 0;

/**
 * Advances the game by one tick (one day).
 */
export function tick(inventory?: Inventory) {
    gameday += 1;

    // Process research
    const researchers = getResearchers();
    if (researchers > 0) {
        addToResearch(researchers * 1); // 1 RP per researcher per tick
    }

    // Advance production first (no-op if inventory not provided)
    try {
        advanceProduction(inventory ?? null);
    } catch (e) {
        // swallow errors from production to avoid breaking core tick
    }
    if (inventory) {
        for (const resourceType of Object.values(ResourceType)) {
            if (isAutoSellEnabled(resourceType)) {
                autoSellResource(inventory, resourceType, getAutoSellMinKeep(resourceType), getAutoSellAmount(resourceType));
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
    return gameday;
}

export function resetGameday(): void {
    gameday = 0;
}

