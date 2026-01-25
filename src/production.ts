import { ResourceType } from './types';
import { resources } from './resources/resourcesRegistry';
import { Inventory } from './inventory';
import { getBalance, getResearch, addToResearch, getGlobalProductionMultiplier } from './gameState';
import { transaction } from './economy';

/**
 * Manage production state for a resource.
 * Actions:
 * - 'set': set to provided boolean `value` (returns true if set)
 * - 'activate': set active = true (returns true if set)
 * - 'deactivate': set active = false (returns true if set)
 * - 'isActive': return current active state (false if resource missing)
 *
 * Returns boolean for success or active state depending on action.
 */
export function manageProduction(
  resource: ResourceType,
  action: 'set' | 'activate' | 'deactivate' | 'isActive',
  value?: boolean
): boolean {
  const r = resources[resource];
  if (!r || !r.recipe) return false;

  switch (action) {
    case 'set':
      if (typeof value !== 'boolean') return false;
      if (value && !r.productionBuilt) return false;
      r.recipe.active = value;
      return true;
    case 'activate':
      if (!r.productionBuilt) return false;
      r.recipe.active = true;
      return true;
    case 'deactivate':
      r.recipe.active = false;
      return true;
    case 'isActive':
      return Boolean(r.recipe.active);
    default:
      return false;
  }
}

// Progress is stored on each recipe as `workamountCompleted` so it can be
// persisted with resources. No module-level progress map required.

// `advanceProduction` now accepts an `Inventory` parameter directly instead
// of relying on a module-level stored inventory. This keeps the function
// pure and avoids implicit dependencies / initialization order issues.

/**
 * Advance production for all active recipes by
 * `baseProduction * globalMultiplier * resource.productionMultiplier`.
 * If no inventory has been set via `setProductionInventory`, this is a no-op.
 */
export function advanceProduction(inventory: Inventory | null, baseProduction = 1): void {
  if (!inventory) return;

  const globalMultiplier = getGlobalProductionMultiplier();

  for (const r of Object.values(resources)) {
    const recipe = r.recipe;
    if (!recipe || !recipe.active) continue;

    const amountToAdd = baseProduction * globalMultiplier * r.productionMultiplier;

    // Add work to the recipe's persisted progress field
    if (recipe.workamount > 0) {
      recipe.workamountCompleted = (recipe.workamountCompleted ?? 0) + amountToAdd;
    } else {
      // For zero-work recipes, we consider them eligible once per tick
      recipe.workamountCompleted = recipe.workamountCompleted ?? 0;
    }

    // Try to complete productions while we have enough work accumulated.
    while (true) {
      if (recipe.workamount > 0) {
        if ((recipe.workamountCompleted ?? 0) < recipe.workamount) break;
      } else {
        // workamount === 0: attempt a single production per tick if inputs available
        // proceed to input check below
      }

      // Check inputs availability
      let canConsume = true;
      for (const input of recipe.inputs) {
        if (!inventory.has(input.resource, input.amount)) {
          canConsume = false;
          break;
        }
      }

      if (!canConsume) break;

      // Consume inputs
      for (const input of recipe.inputs) {
        inventory.remove(input.resource, input.amount);
      }

      // Produce output
      inventory.add(recipe.outputResource, recipe.outputAmount);

      if (recipe.workamount > 0) {
        recipe.workamountCompleted = (recipe.workamountCompleted ?? 0) - recipe.workamount;
        // continue loop to handle overflow
      } else {
        // workamount === 0: produce only once per tick
        break;
      }
    }
  }
}

const UPGRADE_COST_GROWTH = 1.5;
const UPGRADE_BASE_MULTIPLIER_INCREASE = 0.2;
const UPGRADE_DIMINISHING_FACTOR = 0.9;

export function researchProduction(resource: ResourceType): boolean {
  const r = resources[resource];
  if (!r || r.productionResearched) return false;

  const researchCost = Math.max(0, r.productionResearchCost);

  if (getResearch() < researchCost) return false;

  r.productionResearched = true;
  if (researchCost > 0) {
    addToResearch(-researchCost);
  }
  return true;
}

export function buildProduction(resource: ResourceType): boolean {
  const r = resources[resource];
  if (!r || r.productionBuilt || !r.productionResearched) return false;

  const moneyCost = Math.max(0, r.productionStartCost);

  if (getBalance() < moneyCost) return false;

  r.productionBuilt = true;
  transaction(-moneyCost, `Built ${r.name} production`);
  return true;
}

export function getProductionUpgradeCost(resource: ResourceType): number {
  const r = resources[resource];
  if (!r) return 0;
  const costGrowth = Math.max(1, UPGRADE_COST_GROWTH);
  const baseCost = Math.max(0, r.productionStartCost);
  const level = Math.max(0, r.productionUpgradeLevel);
  return Math.ceil(baseCost * Math.pow(costGrowth, level));
}

export function upgradeProduction(
  resource: ResourceType
): { success: boolean; cost: number; newMultiplier: number; upgradeLevel: number } {
  const r = resources[resource];
  if (!r) {
    return { success: false, cost: 0, newMultiplier: 0, upgradeLevel: 0 };
  }
  if (!r.productionBuilt) {
    return { success: false, cost: 0, newMultiplier: r.productionMultiplier, upgradeLevel: r.productionUpgradeLevel };
  }

  const cost = getProductionUpgradeCost(resource);
  if (getBalance() < cost) {
    return { success: false, cost, newMultiplier: r.productionMultiplier, upgradeLevel: r.productionUpgradeLevel };
  }

  const diminishing = Math.max(0, UPGRADE_DIMINISHING_FACTOR);
  const baseIncrease = Math.max(0, UPGRADE_BASE_MULTIPLIER_INCREASE);
  const level = Math.max(0, r.productionUpgradeLevel);
  const increase = baseIncrease * Math.pow(diminishing, level);
  r.productionMultiplier += increase;
  r.productionUpgradeLevel += 1;

  transaction(-cost, `Upgraded ${r.name} production (x${r.productionUpgradeLevel})`);

  return {
    success: true,
    cost,
    newMultiplier: r.productionMultiplier,
    upgradeLevel: r.productionUpgradeLevel,
  };
}

/**
 * Get the number of production facilities built for a resource type.
 * Returns 1 if built, 0 if not built.
 */
export function getProductionCount(resource: ResourceType): number {
  const r = resources[resource];
  if (!r) return 0;
  return r.productionBuilt ? 1 : 0;
}

/**
 * Get the current upgrade level for a resource's production facility.
 */
export function getProductionLevel(resource: ResourceType): number {
  const r = resources[resource];
  if (!r) return 0;
  return r.productionUpgradeLevel || 0;
}

