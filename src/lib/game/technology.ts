import { ResourceType } from '../../utils/types';
import { resources } from '../resources/resourcesRegistry';
import { getBalance, addToBalance, getGameState } from './gameState';

const UPGRADE_COST_GROWTH = 1.5;

/**
 * Gets the current Technology Level for a specific resource.
 */
export function getTechLevel(type: ResourceType): number {
      return getGameState().techLevels[type] ?? 1;
}

/**
 * Calculates the cost for the NEXT technology upgrade.
 * Formula matches Facility Upgrades: ceil(BaseCost * 1.5^Level)
 */
export function getTechUpgradeCost(type: ResourceType): number {
      const level = getTechLevel(type);
      const startCost = resources[type].technologyBaseCost;
      return Math.ceil(startCost * Math.pow(UPGRADE_COST_GROWTH, level));
}

/**
 * Upgrades the technology for a resource if the player can afford it.
 * deducts cost from balance.
 * @returns true if successful, false otherwise.
 */
export function upgradeTech(type: ResourceType): boolean {
      const cost = getTechUpgradeCost(type);
      if (getBalance() >= cost) {
            addToBalance(-cost);
            getGameState().techLevels[type] = (getGameState().techLevels[type] ?? 0) + 1;
            return true;
      }
      return false;
}

/**
 * Debug/Admin function to set technology level directly.
 */
export function setTechLevel(type: ResourceType, level: number): void {
      getGameState().techLevels[type] = Math.max(0, Math.floor(level));
}
