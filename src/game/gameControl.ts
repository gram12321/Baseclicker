import { resetGameState } from '../gameState';
import { resetResources } from '../resources/resourcesRegistry';
import { resetEconomy, transaction } from '../economy';
import { Inventory } from '../inventory';
import { resetGameday } from './gametick';
import { formatNumber } from '../utils';

/**
 * Resets the entire game state to initial values.
 * This includes:
 * - Player balance, research, and multipliers
 * - All production facilities, upgrades, and research
 * - Global inventory
 * - Market supply and transaction logs
 */
export function resetGame(inventory: Inventory): void {
      const bonus = resetGameState();
      resetResources();
      resetEconomy();
      resetGameday();
      inventory.clear();

      transaction(0, `--- COMPANY RESET & LIQUIDATION (Bonus: +${formatNumber(bonus, { decimals: 4, forceDecimals: true })}x Multiplier) ---`);

      console.log('Game has been reset with bonus:', bonus);
}
