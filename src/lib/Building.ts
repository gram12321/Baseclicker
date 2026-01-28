import { BuildingType, Recipe, RecipeName } from '../utils/types';
import { Inventory } from './inventory';
import { getBalance, getGlobalProductionMultiplier } from './game/gameState';
import { transaction } from './market/market';
import { isRecipeNameResearched, resetResearch } from './research';
import {
  HarvestWood, QuarryStone, SmeltIron, GrowGrain, GrowSugar, BakeBread, BakeCake,
} from './recipes/recipes';

const UPGRADE_COST_GROWTH = 1.5;
const UPGRADE_BASE_MULTIPLIER_INCREASE = 0.2;
const UPGRADE_DIMINISHING_FACTOR = 0.9;

export const BUILDING_COSTS: Record<BuildingType, number> = {
  [BuildingType.Forestry]: 50,
  [BuildingType.Quarry]: 75,
  [BuildingType.Mine]: 150,
  [BuildingType.Farm]: 60,
  [BuildingType.Bakery]: 300,
};

export const BUILDING_NAMES: Record<BuildingType, string> = {
  [BuildingType.Forestry]: 'Forestry',
  [BuildingType.Quarry]: 'Quarry',
  [BuildingType.Mine]: 'Mine',
  [BuildingType.Farm]: 'Farm',
  [BuildingType.Bakery]: 'Bakery',
};

export const BUILDING_RECIPES: Record<BuildingType, Recipe[]> = {
  [BuildingType.Forestry]: [HarvestWood],
  [BuildingType.Quarry]: [QuarryStone],
  [BuildingType.Mine]: [SmeltIron],
  [BuildingType.Farm]: [GrowGrain, GrowSugar],
  [BuildingType.Bakery]: [BakeBread, BakeCake],
};

export const builtBuildings: Map<BuildingType, Building> = new Map();

export function resetBuildings(): void {
  builtBuildings.clear();
  resetResearch();
}

export function advanceProduction(inventory: Inventory | null, baseProduction = 1): void {
  if (!inventory) return;
  for (const building of builtBuildings.values()) {
    building.advance(inventory, baseProduction);
  }
}

export function buildFacility(buildingType: BuildingType): boolean {
  if (builtBuildings.has(buildingType)) return false;
  const moneyCost = BUILDING_COSTS[buildingType];
  if (getBalance() < moneyCost) return false;

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
  recipes: Recipe[];
  productionMultiplier: number;
  productionUpgradeLevel: number;
  productionStartCost: number;

  activeRecipeName: RecipeName | null = null;
  private isActiveFlag: boolean = false;
  private recipeProgress: Map<RecipeName, number> = new Map();

  constructor(buildingType: BuildingType, recipes: Recipe[] = [], productionStartCost: number = 0) {
    this.buildingType = buildingType;
    this.recipes = recipes;
    this.productionMultiplier = 1;
    this.productionUpgradeLevel = 1;
    this.productionStartCost = productionStartCost;

    // Auto-select first recipe if only one exists and it is researched
    if (this.recipes.length === 1 && isRecipeNameResearched(this.recipes[0].name)) {
      this.activeRecipeName = this.recipes[0].name;
    }
  }

  get currentRecipe(): Recipe | null {
    if (!this.activeRecipeName) return null;
    return this.recipes.find(r => r.name === this.activeRecipeName) || null;
  }

  hasRecipeSelected(): boolean {
    return this.activeRecipeName !== null && isRecipeNameResearched(this.activeRecipeName);
  }

  selectRecipe(recipeName: RecipeName): boolean {
    if (!this.recipes.some(r => r.name === recipeName)) return false;
    if (!isRecipeNameResearched(recipeName)) return false;
    this.activeRecipeName = recipeName;
    return true;
  }

  activate(): boolean {
    if (!this.hasRecipeSelected()) return false;
    this.isActiveFlag = true;
    return true;
  }

  deactivate(): void {
    this.isActiveFlag = false;
  }

  isActive(): boolean {
    return this.isActiveFlag && this.hasRecipeSelected();
  }

  getCurrentProgress(): number {
    const recipe = this.currentRecipe;
    return recipe ? (this.recipeProgress.get(recipe.name) || 0) : 0;
  }

  isStalled(inventory: Inventory): boolean {
    if (!this.isActive()) return false;
    const recipe = this.currentRecipe;
    if (!recipe || recipe.inputs.length === 0) return false;

    // Stalled if we are at 0 progress and cannot afford inputs
    return this.getCurrentProgress() === 0 && !recipe.inputs.every(i => inventory.has(i.resource, i.amount));
  }

  getUpgradeCost(): number {
    return Math.ceil(this.productionStartCost * Math.pow(UPGRADE_COST_GROWTH, this.productionUpgradeLevel));
  }

  upgrade(): { success: boolean; cost: number; newMultiplier: number; upgradeLevel: number } {
    const cost = this.getUpgradeCost();
    if (getBalance() < cost) {
      return { success: false, cost, newMultiplier: this.productionMultiplier, upgradeLevel: this.productionUpgradeLevel };
    }

    const increase = UPGRADE_BASE_MULTIPLIER_INCREASE * Math.pow(UPGRADE_DIMINISHING_FACTOR, this.productionUpgradeLevel - 1);
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

  advance(inventory: Inventory | null, baseProduction = 1): void {
    const recipe = this.currentRecipe;
    if (!inventory || !this.isActive() || !recipe) return;

    const globalMultiplier = getGlobalProductionMultiplier();
    const workToAdd = baseProduction * globalMultiplier * this.productionMultiplier;

    let progress = this.recipeProgress.get(recipe.name) || 0;
    let remainingWork = workToAdd;

    // Production State Machine
    while (true) {
      // 1. Try to start a new cycle ONLY if we have work to do (or it's an instant recipe)
      // and we are at the very beginning (progress 0).
      if (progress === 0 && (remainingWork > 0 || recipe.workamount === 0)) {
        if (recipe.inputs.length > 0) {
          if (recipe.inputs.every(i => inventory.has(i.resource, i.amount))) {
            recipe.inputs.forEach(i => inventory.remove(i.resource, i.amount));
            // Cycle started!
          } else {
            // Cannot start next cycle.
            break;
          }
        }
      }

      // 2. Special case for instant recipes
      if (recipe.workamount === 0) {
        // Quality Placeholder: For now, produce at base quality 1.0
        // Future logic will calculate this based on input quality and building upgrades.
        const outputQuality = 1.0;
        inventory.add(recipe.outputResource, recipe.outputAmount, outputQuality);
        progress = 0;
        // Instant recipes run exactly once per tick
        break;
      }

      // 3. Apply work
      if (remainingWork > 0) {
        const workNeeded = recipe.workamount - progress;
        const workToApply = Math.min(remainingWork, workNeeded);
        progress += workToApply;
        remainingWork -= workToApply;
      }

      // 4. Complete Cycle?
      if (progress >= recipe.workamount) {
        // Quality Placeholder: For now, produce at base quality 1.0
        const outputQuality = 1.0;
        inventory.add(recipe.outputResource, recipe.outputAmount, outputQuality);
        progress = 0;
        // Only continue if we still have work to apply to the NEXT cycle.
        // This solves the 'double consume' bug because it prevents "priming" 
        // for next tick at the end of this tick (which would be re-consumed 
        // at the start of next tick).
        if (remainingWork > 0) {
          continue;
        }
      }

      // If we got here, we're done for this tick.
      break;
    }

    this.recipeProgress.set(recipe.name, progress);
  }

  setProduction(recipeName: RecipeName | null): boolean {
    if (!recipeName) {
      this.deactivate();
      this.activeRecipeName = null;
      return true;
    }

    if (this.selectRecipe(recipeName)) {
      this.activate();
      return true;
    }
    return false;
  }
}
