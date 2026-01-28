import { ResourceType, BuildingType, Recipe, RecipeName } from './utils/types';
import { Inventory } from './inventory';
import { getBalance, getResearch, addToResearch, getGlobalProductionMultiplier } from './gameState';
import { transaction } from './economy';
import {
  HarvestWood,
  QuarryStone,
  SmeltIron,
  GrowGrain,
  GrowSugar,
  ALL_RECIPES
} from './recipes/recipes';

const UPGRADE_COST_GROWTH = 1.5;
const UPGRADE_BASE_MULTIPLIER_INCREASE = 0.2;
const UPGRADE_DIMINISHING_FACTOR = 0.9;

// Track researched recipes globally
export const researchedRecipes: Set<RecipeName> = new Set();

// Building costs per building type
export const BUILDING_COSTS: Record<BuildingType, number> = {
  [BuildingType.Forestry]: 50,
  [BuildingType.Quarry]: 75,
  [BuildingType.Mine]: 150,
  [BuildingType.Farm]: 60,
};

// Building display names
export const BUILDING_NAMES: Record<BuildingType, string> = {
  [BuildingType.Forestry]: 'Forestry',
  [BuildingType.Quarry]: 'Quarry',
  [BuildingType.Mine]: 'Mine',
  [BuildingType.Farm]: 'Farm',
};

// Building recipes per building type
export const BUILDING_RECIPES: Record<BuildingType, Recipe[]> = {
  [BuildingType.Forestry]: [HarvestWood],
  [BuildingType.Quarry]: [QuarryStone],
  [BuildingType.Mine]: [SmeltIron],
  [BuildingType.Farm]: [GrowGrain, GrowSugar],
};

// Map of built buildings
export const builtBuildings: Map<BuildingType, Building> = new Map();

/**
 * Reset all built buildings (for game reset)
 */
export function resetBuildings(): void {
  builtBuildings.clear();
  researchedRecipes.clear();
}

/**
 * Advance production for all active recipes by
 * `baseProduction * globalMultiplier * resource.productionMultiplier`.
 * If no inventory has been set via `setProductionInventory`, this is a no-op.
 */
export function advanceProduction(inventory: Inventory | null, baseProduction = 1): void {
  if (!inventory) return;

  for (const building of builtBuildings.values()) {
    building.advance(inventory, baseProduction);
  }
}

export function researchRecipe(resourceType: ResourceType): boolean {
  const recipe = Object.values(ALL_RECIPES).find(r => r.outputResource === resourceType);

  if (!recipe || researchedRecipes.has(recipe.name)) return false;

  const researchCost = Math.max(0, recipe.researchCost);

  if (getResearch() < researchCost) return false;

  researchedRecipes.add(recipe.name);
  if (researchCost > 0) {
    addToResearch(-researchCost);
  }
  return true;
}

// Utility to check if a resource's recipe is researched
export function isRecipeResearched(resourceType: ResourceType): boolean {
  const recipe = Object.values(ALL_RECIPES).find(r => r.outputResource === resourceType);
  return recipe ? researchedRecipes.has(recipe.name) : false;
}

export function buildFacility(buildingType: BuildingType): boolean {
  if (builtBuildings.has(buildingType)) return false; // Already built

  const moneyCost = BUILDING_COSTS[buildingType];
  if (getBalance() < moneyCost) return false;

  // Create the building instance
  const building = new Building(buildingType, BUILDING_RECIPES[buildingType], moneyCost);
  builtBuildings.set(buildingType, building);

  transaction(-moneyCost, `Built ${buildingType} facility`);
  return true;
}

export function upgradeBuilding(
  buildingType: BuildingType
): { success: boolean; cost: number; newMultiplier: number; upgradeLevel: number } {
  const building = builtBuildings.get(buildingType);
  return building ? building.upgrade() : { success: false, cost: 0, newMultiplier: 0, upgradeLevel: 0 };
}

export class Building {
  buildingType: BuildingType;
  recipes: Recipe[]; // Allow multiple recipes
  currentRecipeIndex: number;
  productionMultiplier: number;
  productionUpgradeLevel: number;
  productionStartCost: number;

  // Internal state
  private isActiveFlag: boolean = false;
  private recipeProgress: Map<RecipeName, number> = new Map();

  constructor(buildingType: BuildingType, recipes: Recipe[] = [], productionStartCost: number = 0) {
    this.buildingType = buildingType;
    this.recipes = recipes.length > 0 ? recipes : [];
    this.currentRecipeIndex = this.recipes.length > 0 ? 0 : -1; // Default to first recipe if available
    this.productionMultiplier = 1;
    this.productionUpgradeLevel = 0;
    this.productionStartCost = productionStartCost;
  }

  get currentRecipe(): Recipe | null {
    return this.currentRecipeIndex >= 0 ? this.recipes[this.currentRecipeIndex] : null;
  }

  hasRecipeSelected(): boolean {
    return this.currentRecipeIndex >= 0;
  }

  selectRecipe(index: number): boolean {
    if (index < 0 || index >= this.recipes.length) return false;

    // Check if the recipe is researched before allowing selection
    const recipe = this.recipes[index];
    if (!researchedRecipes.has(recipe.name)) return false;

    this.currentRecipeIndex = index;
    return true;
  }

  // Activate the building
  activate(): boolean {
    if (!this.hasRecipeSelected()) return false;
    this.isActiveFlag = true;
    return true;
  }

  // Deactivate the building
  deactivate(): boolean {
    this.isActiveFlag = false;
    return true;
  }

  // Check if active
  isActive(): boolean {
    return this.isActiveFlag && this.hasRecipeSelected();
  }

  // Set active state
  setActive(active: boolean): boolean {
    if (!this.hasRecipeSelected() && active) return false;
    this.isActiveFlag = active;
    return true;
  }

  // Helper to get progress for current recipe
  getCurrentProgress(): number {
    const recipe = this.currentRecipe;
    return recipe ? (this.recipeProgress.get(recipe.name) || 0) : 0;
  }

  // Get upgrade cost
  getUpgradeCost(): number {
    const costGrowth = Math.max(1, UPGRADE_COST_GROWTH);
    const baseCost = Math.max(0, this.productionStartCost);
    const level = Math.max(0, this.productionUpgradeLevel);
    return Math.ceil(baseCost * Math.pow(costGrowth, level));
  }

  // Upgrade the building
  upgrade(): { success: boolean; cost: number; newMultiplier: number; upgradeLevel: number } {
    const cost = this.getUpgradeCost();
    if (getBalance() < cost) {
      return { success: false, cost, newMultiplier: this.productionMultiplier, upgradeLevel: this.productionUpgradeLevel };
    }

    const diminishing = Math.max(0, UPGRADE_DIMINISHING_FACTOR);
    const baseIncrease = Math.max(0, UPGRADE_BASE_MULTIPLIER_INCREASE);
    const level = Math.max(0, this.productionUpgradeLevel);
    const increase = baseIncrease * Math.pow(diminishing, level);
    this.productionMultiplier += increase;
    this.productionUpgradeLevel += 1;

    transaction(-cost, `Upgraded ${this.buildingType} production (x${this.productionUpgradeLevel})`);

    return {
      success: true,
      cost,
      newMultiplier: this.productionMultiplier,
      upgradeLevel: this.productionUpgradeLevel,
    };
  }

  // Advance production for this building
  advance(inventory: Inventory | null, baseProduction = 1): void {
    if (!inventory || !this.isActive() || !this.currentRecipe) return;

    const globalMultiplier = getGlobalProductionMultiplier();
    const amountToAdd = baseProduction * globalMultiplier * this.productionMultiplier;

    const recipe = this.currentRecipe;

    // Get current progress from internal state
    let currentProgress = this.recipeProgress.get(recipe.name) || 0;

    // Add work to the progress
    if (recipe.workamount > 0) {
      currentProgress += amountToAdd;
    } else {
      // For zero-work recipes, we consider them eligible once per tick
      // progress doesn't really matter but we track it for consistency
      currentProgress = 0;
    }

    // Try to complete productions while we have enough work accumulated.
    while (true) {
      if (recipe.workamount > 0) {
        if (currentProgress < recipe.workamount) break;
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
        currentProgress -= recipe.workamount;
        // continue loop to handle overflow
      } else {
        // workamount === 0: produce only once per tick
        break;
      }
    }

    // Save updated progress
    this.recipeProgress.set(recipe.name, currentProgress);
  }

  // Switch to a different recipe
  switchRecipe(index: number): boolean {
    return this.selectRecipe(index);
  }
}

