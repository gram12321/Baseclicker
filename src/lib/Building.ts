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

// Quality upgrade constants
const QUALITY_UPGRADE_COST_GROWTH = 1.5;
const QUALITY_DIMINISHING_STEEPNESS = 0.15; // Controls how quickly diminishing returns kick in

import { getTechLevel } from './game/technology';

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

export function upgradeBuildingQuality(
  buildingType: BuildingType
): { success: boolean; cost: number; newQuality: number; upgradeLevel: number } {
  const building = builtBuildings.get(buildingType);
  return building ? building.upgradeQuality() : { success: false, cost: 0, newQuality: 0, upgradeLevel: 0 };
}

export class Building {
  buildingType: BuildingType;
  recipes: Recipe[];
  productionMultiplier: number;
  productionUpgradeLevel: number;
  productionStartCost: number;

  // Quality upgrade system
  productionQuality: number;
  qualityUpgradeLevel: number;

  activeRecipeName: RecipeName | null = null;
  private isActiveFlag: boolean = false;
  private recipeProgress: Map<RecipeName, number> = new Map();
  private currentCycleInputQuality: number = 1.0;

  constructor(buildingType: BuildingType, recipes: Recipe[] = [], productionStartCost: number = 0) {
    this.buildingType = buildingType;
    this.recipes = recipes;
    this.productionMultiplier = 1;
    this.productionUpgradeLevel = 1;
    this.productionStartCost = productionStartCost;

    // Initialize quality system
    this.productionQuality = 1.0; // Base quality
    this.qualityUpgradeLevel = 0; // No quality upgrades initially

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

  /**
   * Calculates the diminishing return multiplier for quality upgrades.
   * Uses a sigmoid-like function that approaches 1 as level increases.
   * Formula: 1 / (1 + exp(-steepness * level))
   * This ensures the value stays between 0 and 1, with diminishing returns.
   */
  private getQualityDiminishingReturn(level: number): number {
    // Sigmoid function centered and scaled to give good diminishing returns
    // At level 0: ~0.5, at level 5: ~0.69, at level 10: ~0.82, at level 20: ~0.95
    return 1 / (1 + Math.exp(-QUALITY_DIMINISHING_STEEPNESS * level));
  }

  /**
   * Gets the cost for the next quality upgrade.
   */
  getQualityUpgradeCost(): number {
    return Math.ceil(this.productionStartCost * Math.pow(QUALITY_UPGRADE_COST_GROWTH, this.qualityUpgradeLevel));
  }

  /**
   * Upgrades the production quality of this building.
   * Each level adds: +1 * diminishingReturn to quality.
   */
  upgradeQuality(): { success: boolean; cost: number; newQuality: number; upgradeLevel: number } {
    const cost = this.getQualityUpgradeCost();
    if (getBalance() < cost) {
      return {
        success: false,
        cost,
        newQuality: this.productionQuality,
        upgradeLevel: this.qualityUpgradeLevel
      };
    }

    // Calculate quality increase with diminishing returns
    const diminishingReturn = this.getQualityDiminishingReturn(this.qualityUpgradeLevel);
    const qualityIncrease = 1.0 * diminishingReturn;

    this.productionQuality += qualityIncrease;
    this.qualityUpgradeLevel += 1;

    transaction(-cost, `Upgraded ${this.buildingType} quality (Lvl ${this.qualityUpgradeLevel})`);

    return {
      success: true,
      cost,
      newQuality: this.productionQuality,
      upgradeLevel: this.qualityUpgradeLevel,
    };
  }

  advance(inventory: Inventory | null, baseProduction = 1): void {
    const recipe = this.currentRecipe;
    if (!inventory || !this.isActive() || !recipe) return;

    const globalMultiplier = getGlobalProductionMultiplier();
    const workToAdd = baseProduction * globalMultiplier * this.productionMultiplier;

    let progress = this.recipeProgress.get(recipe.name) || 0;
    let remainingWork = workToAdd;

    // ═══════════════════════════════════════════════════════════════════════════
    // PRODUCTION STATE MACHINE - "Pay-at-Start" Model
    // ═══════════════════════════════════════════════════════════════════════════
    // 
    // IMPORTANT CONCEPTS:
    // 
    // 1. INPUTS ARE ONLY CONSUMED AT CYCLE START (progress = 0%)
    //    - NOT when completing a cycle
    //    - NOT when crossing checkpoints like 50% or 75%
    //    - ONLY when progress = 0 AND we have work to apply
    // 
    // 2. OVERFLOW BEHAVIOR (when work > 100%):
    //    Example: 60% → 110% with 50 work
    //    - Apply work: progress becomes 110%
    //    - Complete cycle: produce output, reset progress = 0, remainingWork = 10
    //    - Loop continues (remainingWork > 0)
    //    - Consume inputs for NEXT cycle (progress = 0 and work available)
    //    - Apply remaining 10 work: progress = 10%
    //    
    //    This consumes inputs TWICE in one tick, which is CORRECT BEHAVIOR:
    //    - First consumption: for the cycle that just completed
    //    - Second consumption: for the next cycle that we're starting with overflow
    // 
    // 3. EXACTLY 100% EDGE CASE (prevents "phantom" double consumption):
    //    Example: 0% → 100% with exactly 100 work
    //    - Apply work: progress = 100%
    //    - Complete cycle: produce output, reset progress = 0, remainingWork = 0
    //    - Loop check fails (remainingWork = 0)
    //    - BREAK immediately - do NOT consume for next cycle
    //    - Next tick starts at 0% and will consume then
    //    
    //    This ensures we only consume ONCE per cycle completed
    // 
    // 4. PARTIAL PROGRESS (no boundary crossing):
    //    Example: 60% → 80% with 20 work
    //    - Apply work: progress = 80%
    //    - Cycle NOT complete (< 100%)
    //    - BREAK - no consumption occurs
    //    - Next tick continues from 80%
    // 
    // ═══════════════════════════════════════════════════════════════════════════

    while (true) {
      // 1. Try to start a new cycle ONLY if we have work to do
      // and we are at the very beginning (progress 0).
      if (progress === 0 && remainingWork > 0) {
        if (recipe.inputs.length > 0) {
          if (recipe.inputs.every(i => inventory.has(i.resource, i.amount))) {
            // Calculate average input quality for this cycle
            let totalQuality = 0;
            recipe.inputs.forEach(i => {
              totalQuality += inventory.getQuality(i.resource);
              inventory.remove(i.resource, i.amount);
            });
            this.currentCycleInputQuality = totalQuality / recipe.inputs.length;
            // Cycle started!
          } else {
            // Cannot start next cycle.
            break;
          }
        } else {
          // No inputs - use base nature quality
          this.currentCycleInputQuality = 1.0;
        }
      }

      // 2. Apply work
      if (remainingWork > 0) {
        const workNeeded = recipe.workamount - progress;
        const workToApply = Math.min(remainingWork, workNeeded);
        progress += workToApply;
        remainingWork -= workToApply;
      }

      // 3. Complete Cycle?
      if (progress >= recipe.workamount) {
        // Output Quality Calculation:
        // Base quality = building's productionQuality (upgraded over time)
        // Capped by:
        //   1. Tech Level (hard cap - cannot exceed your technology)
        //   2. Input Quality + 1 (can only improve inputs by +1 max)
        const techLevel = getTechLevel(recipe.outputResource);
        const inputQualityCap = this.currentCycleInputQuality + 1;
        const outputQuality = Math.min(
          this.productionQuality,    // What the building can produce
          techLevel,                 // Tech cap (hard limit)
          inputQualityCap            // Input cap (can improve by +1 max)
        );

        inventory.add(recipe.outputResource, recipe.outputAmount, outputQuality);
        progress = 0;

        // If we have overflow work, loop back to:
        // 1. Consume inputs for the next cycle (since progress = 0 again)
        // 2. Apply the overflow work to start the next cycle
        // This is NOT a bug - we're legitimately starting the next cycle!
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
