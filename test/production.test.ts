import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RecipeName as RecipeNameEnum, ResourceType as ResourceTypeEnum, BuildingType as BuildingTypeEnum } from '../src/utils/types';
import type { Inventory as InventoryType } from '../src/lib/inventory';
import type { advanceProduction as AdvanceProductionType, buildFacility as BuildFacilityType, builtBuildings as BuiltBuildingsType } from '../src/lib/Building';
import type { researchRecipe as ResearchRecipeType } from '../src/lib/research';
import type { setBalance as SetBalanceType, setResearch as SetResearchType, setGlobalProductionMultiplier as SetGlobalProductionMultiplierType } from '../src/lib/game/gameState';
import type { ALL_RECIPES as AllRecipesType } from '../src/lib/recipes/recipes';

describe('Production', () => {
  let RecipeName: typeof RecipeNameEnum;
  let ResourceType: typeof ResourceTypeEnum;
  let BuildingType: typeof BuildingTypeEnum;
  let Inventory: typeof InventoryType;
  let advanceProduction: typeof AdvanceProductionType;
  let buildFacility: typeof BuildFacilityType;
  let builtBuildings: typeof BuiltBuildingsType;
  let researchRecipe: typeof ResearchRecipeType;
  let setBalance: typeof SetBalanceType;
  let setResearch: typeof SetResearchType;
  let setGlobalProductionMultiplier: typeof SetGlobalProductionMultiplierType;
  let ALL_RECIPES: typeof AllRecipesType;

  beforeEach(async () => {
    await vi.resetModules();

    // Re-import modules after reset
    const typesModule = await import('../src/utils/types');
    const inventoryModule = await import('../src/lib/inventory');
    const buildingModule = await import('../src/lib/Building');
    const researchModule = await import('../src/lib/research');
    const gameStateModule = await import('../src/lib/game/gameState');
    const recipesModule = await import('../src/lib/recipes/recipes');

    RecipeName = typesModule.RecipeName;
    ResourceType = typesModule.ResourceType;
    BuildingType = typesModule.BuildingType;
    Inventory = inventoryModule.Inventory;
    advanceProduction = buildingModule.advanceProduction;
    buildFacility = buildingModule.buildFacility;
    builtBuildings = buildingModule.builtBuildings;
    researchRecipe = researchModule.researchRecipe;
    setBalance = gameStateModule.setBalance;
    setResearch = gameStateModule.setResearch;
    setGlobalProductionMultiplier = gameStateModule.setGlobalProductionMultiplier;
    ALL_RECIPES = recipesModule.ALL_RECIPES;

    // Reset recipe values that might be modified by tests
    ALL_RECIPES[RecipeName.SmeltOreBatch].workamount = 2;
  });

  // Helper to set private recipe progress for testing
  function setBuildingProgress(buildingType: any, recipeName: RecipeNameEnum, progress: number) {
    const building = builtBuildings.get(buildingType);
    if (building) {
      (building as any).recipeProgress.set(recipeName, progress);
    }
  }

  function getBuildingProgress(buildingType: any, recipeName: RecipeNameEnum) {
    const building = builtBuildings.get(buildingType);
    return building ? (building as any).recipeProgress.get(recipeName) || 0 : 0;
  }

  it('only advances production on active recipes', () => {
    setBalance(1000);
    setResearch(1000);
    const inv = new Inventory({ [ResourceType.Electricity]: 10 });
    researchRecipe(RecipeName.HarvestWood);
    buildFacility(BuildingType.Forestry);
    builtBuildings.get(BuildingType.Forestry)?.activate();

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Wood)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
  });

  it('Pay-at-Start: input is consumed for next cycle when overflow restarts production', () => {
    setBalance(1000);
    setResearch(1000);
    ALL_RECIPES[RecipeName.SmeltIron].workamount = 1;
    researchRecipe(RecipeName.SmeltIron);
    buildFacility(BuildingType.Mine);

    // Initial state: 0 progress.
    const inv = new Inventory({ [ResourceType.Stone]: 4, [ResourceType.Electricity]: 20 });
    const mine = builtBuildings.get(BuildingType.Mine);
    mine?.selectRecipe(RecipeName.SmeltIron);
    mine?.activate();

    // Tick 1: 1.5 work added.
    // 1. Progress 0 -> Consume inputs for Cycle 1 (Stone: 4 → 2).
    // 2. Apply 1.0 work -> Progress 100% -> Complete Cycle 1, produce Iron, progress = 0, remainingWork = 0.5
    // 3. Continue loop (have overflow work)
    // 4. Progress 0 -> Consume inputs for Cycle 2 (Stone: 2 → 0).
    // 5. Apply 0.5 work -> Progress 50%. Done.
    advanceProduction(inv, 1.5);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0); // Consumed for both cycle 1 AND cycle 2
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBeCloseTo(0.5);
  });

  it('Pay-at-Start: does NOT consume for tomorrow if no work left in current tick', () => {
    setBalance(1000);
    setResearch(1000);
    ALL_RECIPES[RecipeName.SmeltIron].workamount = 1;
    researchRecipe(RecipeName.SmeltIron);
    buildFacility(BuildingType.Mine);
    const mine1 = builtBuildings.get(BuildingType.Mine);
    mine1?.selectRecipe(RecipeName.SmeltIron);
    mine1?.activate();

    const inv = new Inventory({ [ResourceType.Stone]: 6, [ResourceType.Electricity]: 50 });

    // Tick 1: 1.0 work.
    // Starts at 0 -> consumes 2 stone. Progress moves to 1.0. Finishes. Progress 0. 
    // Remaining work is 0 -> STOPS (does not consume for Cycle 2 yet).
    advanceProduction(inv, 1.0);
    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(4);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBe(0);

    // Tick 2: 1.0 work.
    // Starts at 0 -> consumes 2 stone. Progress moves to 1.0. Finishes.
    advanceProduction(inv, 1.0);
    expect(inv.getAmount(ResourceType.Iron)).toBe(2);
    expect(inv.getAmount(ResourceType.Stone)).toBe(2);
  });

  it('global production multiplier scales production', () => {
    setBalance(5000); // Higher balance for upgrades
    setResearch(1000);
    const inv = new Inventory({ [ResourceType.Electricity]: 10 });
    researchRecipe(RecipeName.HarvestWood);
    buildFacility(BuildingType.Forestry);
    builtBuildings.get(BuildingType.Forestry)?.activate();

    advanceProduction(inv);
    expect(inv.getAmount(ResourceType.Wood)).toBe(1);

    setGlobalProductionMultiplier(2.0);
    advanceProduction(inv);
    expect(inv.getAmount(ResourceType.Wood)).toBe(3);
    setGlobalProductionMultiplier(1.0);
  });

  it('stalls at 0% when blocked by inputs (Pay-at-Start)', () => {
    setBalance(1000);
    setResearch(1000);
    ALL_RECIPES[RecipeName.SmeltIron].workamount = 1;
    researchRecipe(RecipeName.SmeltIron);
    buildFacility(BuildingType.Mine);
    const mine2 = builtBuildings.get(BuildingType.Mine);
    mine2?.selectRecipe(RecipeName.SmeltIron);
    mine2?.activate();

    const inv = new Inventory({ [ResourceType.Stone]: 0, [ResourceType.Electricity]: 50 });

    advanceProduction(inv, 1.0);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBe(0);
    expect(inv.getAmount(ResourceType.Iron)).toBe(0);

    inv.add(ResourceType.Stone, 2);
    advanceProduction(inv, 1.0);
    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBe(0);
  });
});
