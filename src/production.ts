import { ResourceType } from './resource';
import { resources } from './resourcesRegistry';
import { Inventory } from './inventory';

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
      r.recipe.active = value;
      return true;
    case 'activate':
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
 * Advance production for all active recipes by `baseProduction * modifiersProduct`.
 * If no inventory has been set via `setProductionInventory`, this is a no-op.
 */
export function advanceProduction(inventory: Inventory | null, baseProduction = 1, modifiers: number[] = []): void {
  if (!inventory) return;

  const multiplier = modifiers.length ? modifiers.reduce((a, b) => a * b, 1) : 1;
  const amountToAdd = baseProduction * multiplier;

  for (const r of Object.values(resources)) {
    const recipe = r.recipe;
    if (!recipe || !recipe.active) continue;

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

