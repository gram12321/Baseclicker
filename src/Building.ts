import { ResourceType, BuildingType } from './types';
import { Resource } from './resources/resource';
import { Inventory } from './inventory';
import { getBalance, getResearch, addToResearch, getGlobalProductionMultiplier } from './gameState';
import { transaction } from './economy';
import { resources } from './resources/resourcesRegistry';
import { grainRecipe, sugarRecipe } from './resources/resourcesRegistry';

const UPGRADE_COST_GROWTH = 1.5;
const UPGRADE_BASE_MULTIPLIER_INCREASE = 0.2;
const UPGRADE_DIMINISHING_FACTOR = 0.9;

// Building costs per building type
const BUILDING_COSTS: Record<BuildingType, number> = {
  [BuildingType.Forestry]: 50,
  [BuildingType.Quarry]: 75,
  [BuildingType.Mine]: 150,
  [BuildingType.Farm]: 60,
};

// Building recipes per building type
export const BUILDING_RECIPES: Record<BuildingType, Recipe | null> = {
  [BuildingType.Forestry]: resources[ResourceType.Wood].recipe,
  [BuildingType.Quarry]: resources[ResourceType.Stone].recipe,
  [BuildingType.Mine]: resources[ResourceType.Iron].recipe,
  [BuildingType.Farm]: null,
};

function getRecipesForBuilding(buildingType: BuildingType): any[] {
  if (buildingType === BuildingType.Farm) {
    return [grainRecipe, sugarRecipe];
  }
  const recipe = BUILDING_RECIPES[buildingType];
  return recipe ? [recipe] : [];
}

export function getBuildingCost(buildingType: BuildingType): number {
  return BUILDING_COSTS[buildingType] || 0;
}

// Map of built buildings
export const builtBuildings: Map<BuildingType, Building> = new Map();

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

export function researchRecipe(resource: ResourceType): boolean {
  const resourceObj = resources[resource];
  if (!resourceObj || resourceObj.recipeResearched) return false;

  const researchCost = Math.max(0, resourceObj.recipe.researchCost);

  if (getResearch() < researchCost) return false;

  resourceObj.recipeResearched = true;
  if (researchCost > 0) {
    addToResearch(-researchCost);
  }
  return true;
}

export function buildFacility(buildingType: BuildingType): boolean {
  if (builtBuildings.has(buildingType)) return false; // Already built

  const moneyCost = BUILDING_COSTS[buildingType];
  if (getBalance() < moneyCost) return false;

  // Create the building instance
  const building = new Building(buildingType, getRecipesForBuilding(buildingType), moneyCost);
  builtBuildings.set(buildingType, building);

  transaction(-moneyCost, `Built ${buildingType} facility`);
  return true;
}

export function getBuildingUpgradeCost(buildingType: BuildingType): number {
  const building = builtBuildings.get(buildingType);
  return building ? building.getUpgradeCost() : 0;
}

export function upgradeBuilding(
  buildingType: BuildingType
): { success: boolean; cost: number; newMultiplier: number; upgradeLevel: number } {
  const building = builtBuildings.get(buildingType);
  return building ? building.upgrade() : { success: false, cost: 0, newMultiplier: 0, upgradeLevel: 0 };
}

export function getBuildingCount(buildingType: BuildingType): number {
  return builtBuildings.has(buildingType) ? 1 : 0;
}

export function getBuildingLevel(buildingType: BuildingType): number {
  const building = builtBuildings.get(buildingType);
  return building ? building.productionUpgradeLevel || 0 : 0;
}

export class Building {
  buildingType: BuildingType;
  recipes: any[]; // Allow multiple recipes
  currentRecipeIndex: number;
  productionMultiplier: number;
  productionUpgradeLevel: number;
  productionStartCost: number;

  constructor(buildingType: BuildingType, recipes: any[] = [], productionStartCost: number = 0) {
    this.buildingType = buildingType;
    this.recipes = recipes.length > 0 ? recipes : [];
    this.currentRecipeIndex = this.recipes.length > 0 ? 0 : -1; // Default to first recipe if available
    this.productionMultiplier = 1;
    this.productionUpgradeLevel = 0;
    this.productionStartCost = productionStartCost;
  }

  get currentRecipe(): any {
    return this.currentRecipeIndex >= 0 ? this.recipes[this.currentRecipeIndex] : null;
  }

  hasRecipeSelected(): boolean {
    return this.currentRecipeIndex >= 0;
  }

  selectRecipe(index: number): boolean {
    if (index < 0 || index >= this.recipes.length) return false;
    this.currentRecipeIndex = index;
    return true;
  }

  // Activate the building
  activate(): boolean {
    if (!this.hasRecipeSelected()) return false;
    this.currentRecipe.active = true;
    return true;
  }

  // Deactivate the building
  deactivate(): boolean {
    if (this.currentRecipe) {
      this.currentRecipe.active = false;
    }
    return true;
  }

  // Check if active
  isActive(): boolean {
    return this.currentRecipe ? Boolean(this.currentRecipe.active) : false;
  }

  // Set active state
  setActive(active: boolean): boolean {
    if (!this.hasRecipeSelected()) return false;
    this.currentRecipe.active = active;
    return true;
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
    if (!inventory || !this.currentRecipe.active) return;

    const globalMultiplier = getGlobalProductionMultiplier();
    const amountToAdd = baseProduction * globalMultiplier * this.productionMultiplier;

    const recipe = this.currentRecipe;

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

  // Switch to a different recipe
  switchRecipe(index: number): boolean {
    if (index < 0 || index >= this.recipes.length) return false;
    this.currentRecipeIndex = index;
    return true;
  }
}

