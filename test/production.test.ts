import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RecipeName as RecipeNameEnum, ResourceType as ResourceTypeEnum, BuildingType as BuildingTypeEnum } from '../src/utils/types';
import type { Inventory as InventoryType } from '../src/lib/inventory';
import type { advanceProduction as AdvanceProductionType, buildFacility as BuildFacilityType, builtBuildings as BuiltBuildingsType } from '../src/lib/Building';
import type { researchRecipe as ResearchRecipeType } from '../src/lib/research';
import type { setBalance as SetBalanceType, setResearch as SetResearchType, setGlobalProductionMultiplier as SetGlobalProductionMultiplierType } from '../src/game/gameState';
import type { ALL_RECIPES as AllRecipesType } from '../src/recipes/recipes';

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
    const gameStateModule = await import('../src/game/gameState');
    const recipesModule = await import('../src/recipes/recipes');

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
    ALL_RECIPES[RecipeName.SmeltIron].workamount = 2;
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
    // Set up initial game state
    setBalance(1000);
    setResearch(1000);

    const inv = new Inventory();

    // Research and build Wood production
    researchRecipe(ResourceType.Wood);
    buildFacility(BuildingType.Forestry);
    builtBuildings.get(BuildingType.Forestry)?.activate();

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Wood)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(inv.getAmount(ResourceType.Iron)).toBe(0);
  });

  it('workamount 0 requires inputs be present and consumes them before producing', () => {
    // Set up initial game state
    setBalance(1000);
    setResearch(1000);

    // Make Iron instantaneous (workamount = 0)
    ALL_RECIPES[RecipeName.SmeltIron].workamount = 0;
    researchRecipe(ResourceType.Iron);
    buildFacility(BuildingType.Mine);
    builtBuildings.get(BuildingType.Mine)?.activate();

    const inv = new Inventory({ [ResourceType.Stone]: 2 });

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
  });

  it('input is consumed for multiple productions when overflow restarts production', () => {
    setBalance(1000);
    setResearch(1000);

    // Ensure iron has workamount 1
    ALL_RECIPES[RecipeName.SmeltIron].workamount = 1;
    researchRecipe(ResourceType.Iron);
    buildFacility(BuildingType.Mine);

    // Seed partial progress
    setBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron, 0.5);
    builtBuildings.get(BuildingType.Mine)?.activate();

    // Provide inputs for two productions (2 stone per iron -> need 4)
    const inv = new Inventory({ [ResourceType.Stone]: 4 });

    // This adds 1.5 (baseProduction) to reach 2.0 total -> two productions
    advanceProduction(inv, 1.5);

    expect(inv.getAmount(ResourceType.Iron)).toBe(2);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBeCloseTo(0);
  });

  it('produces output and restarts when inputs available and workoverflow exists', () => {
    setBalance(1000);
    setResearch(1000);

    ALL_RECIPES[RecipeName.SmeltIron].workamount = 1;
    researchRecipe(ResourceType.Iron);
    buildFacility(BuildingType.Mine);

    setBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron, 0.75);
    builtBuildings.get(BuildingType.Mine)?.activate();

    const inv = new Inventory({ [ResourceType.Stone]: 4 });

    // Add 1.5 => total 2.25 -> two productions (consume 4 stone)
    advanceProduction(inv, 1.5);

    expect(inv.getAmount(ResourceType.Iron)).toBe(2);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBeCloseTo(0.25);
  });

  it('edge case: workamountCompleted === workamount triggers a production', () => {
    setBalance(1000);
    setResearch(1000);

    ALL_RECIPES[RecipeName.SmeltIron].workamount = 1;
    researchRecipe(ResourceType.Iron);
    buildFacility(BuildingType.Mine);

    setBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron, 1);
    builtBuildings.get(BuildingType.Mine)?.activate();

    const inv = new Inventory({ [ResourceType.Stone]: 2 });

    // No extra production amount; but since completed === workamount it should still produce once
    advanceProduction(inv, 0);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBeCloseTo(0);
  });

  it('exact completion consumes inputs for one production and does not double-produce', () => {
    setBalance(1000);
    setResearch(1000);

    ALL_RECIPES[RecipeName.SmeltIron].workamount = 1;
    researchRecipe(ResourceType.Iron);
    buildFacility(BuildingType.Mine);

    setBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron, 1);
    builtBuildings.get(BuildingType.Mine)?.activate();

    const inv = new Inventory({ [ResourceType.Stone]: 4 });

    advanceProduction(inv, 0);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(2);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBeCloseTo(0);
  });

  it('overflow ends at 0 and restarts next tick consuming again', () => {
    setBalance(1000);
    setResearch(1000);

    ALL_RECIPES[RecipeName.SmeltIron].workamount = 1;
    researchRecipe(ResourceType.Iron);
    buildFacility(BuildingType.Mine);

    setBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron, 0.4);
    builtBuildings.get(BuildingType.Mine)?.activate();

    const inv = new Inventory({ [ResourceType.Stone]: 6 });

    // First tick: add 1.6 -> total 2.0 -> two productions, consume 4 stone
    advanceProduction(inv, 1.6);

    expect(inv.getAmount(ResourceType.Iron)).toBe(2);
    expect(inv.getAmount(ResourceType.Stone)).toBe(2);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBeCloseTo(0);

    // Next tick: add 1.0 -> progress 1.0 -> one production, consume remaining 2 stone
    advanceProduction(inv, 1.0);

    expect(inv.getAmount(ResourceType.Iron)).toBe(3);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(getBuildingProgress(BuildingType.Mine, RecipeName.SmeltIron)).toBeCloseTo(0);
  });

  it('global production multiplier scales production', () => {
    setBalance(1000);
    setResearch(1000);

    const inv = new Inventory();
    researchRecipe(ResourceType.Wood);
    buildFacility(BuildingType.Forestry);
    builtBuildings.get(BuildingType.Forestry)?.activate();

    // Default multiplier is 1.0, so 1 tick = 1 wood
    advanceProduction(inv);
    expect(inv.getAmount(ResourceType.Wood)).toBe(1);

    // Set multiplier to 2.0, so 1 tick = 2 wood
    setGlobalProductionMultiplier(2.0);
    advanceProduction(inv);
    expect(inv.getAmount(ResourceType.Wood)).toBe(3); // 1 from before + 2 new

    setGlobalProductionMultiplier(1.0);
  });

  it('global production multiplier affects partial progress on complex recipes', () => {
    setBalance(1000);
    setResearch(1000);

    const inv = new Inventory();

    researchRecipe(ResourceType.Grain);
    buildFacility(BuildingType.Farm);
    const farmBuilding = builtBuildings.get(BuildingType.Farm);
    farmBuilding?.selectRecipe(0);
    farmBuilding?.activate();

    setBuildingProgress(BuildingType.Farm, RecipeName.GrowGrain, 0);

    // With 0.5x multiplier, adding 1 base work per tick results in 0.5 progress
    setGlobalProductionMultiplier(0.5);
    advanceProduction(inv, 1);
    expect(getBuildingProgress(BuildingType.Farm, RecipeName.GrowGrain)).toBe(0.5);
    expect(inv.getAmount(ResourceType.Grain)).toBe(0);

    // With 10x multiplier, adding 1 base work results in 10 work -> 2 completions (workamount 5)
    setGlobalProductionMultiplier(10.0);
    advanceProduction(inv, 1);
    expect(inv.getAmount(ResourceType.Grain)).toBe(2);
    expect(getBuildingProgress(BuildingType.Farm, RecipeName.GrowGrain)).toBeCloseTo(0.5);
  });
});
