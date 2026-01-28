import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ResourceType as ResourceTypeEnum, RecipeName as RecipeNameEnum, BuildingType as BuildingTypeEnum } from '../src/utils/types';
import type { researchRecipe as ResearchRecipeType, isRecipeResearched as IsRecipeResearchedType, isRecipeNameResearched as IsRecipeNameResearchedType, resetResearch as ResetResearchType, researchedRecipes as ResearchedRecipesType } from '../src/research';
import type { getResearch as GetResearchType, setResearch as SetResearchType, addToResearch as AddToResearchType, getResearchers as GetResearchersType, addResearchers as AddResearchersType, setBalance as SetBalanceType } from '../src/gameState';
import type { buildFacility as BuildFacilityType, builtBuildings as BuiltBuildingsType } from '../src/Building';
import type { Inventory as InventoryType } from '../src/inventory';
import type { resetGame as ResetGameType } from '../src/game/gameControl';

describe('Research System', () => {
      let ResourceType: typeof ResourceTypeEnum;
      let RecipeName: typeof RecipeNameEnum;
      let BuildingType: typeof BuildingTypeEnum;
      let researchRecipe: typeof ResearchRecipeType;
      let isRecipeResearched: typeof IsRecipeResearchedType;
      let isRecipeNameResearched: typeof IsRecipeNameResearchedType;
      let resetResearch: typeof ResetResearchType;
      let researchedRecipes: typeof ResearchedRecipesType;
      let getResearch: typeof GetResearchType;
      let setResearch: typeof SetResearchType;
      let addToResearch: typeof AddToResearchType;
      let getResearchers: typeof GetResearchersType;
      let addResearchers: typeof AddResearchersType;
      let setBalance: typeof SetBalanceType;
      let buildFacility: typeof BuildFacilityType;
      let builtBuildings: typeof BuiltBuildingsType;
      let Inventory: typeof InventoryType;
      let resetGame: typeof ResetGameType;

      beforeEach(async () => {
            await vi.resetModules();

            // Re-import modules after reset
            const typesModule = await import('../src/utils/types');
            const researchModule = await import('../src/research');
            const gameStateModule = await import('../src/gameState');
            const buildingModule = await import('../src/Building');
            const inventoryModule = await import('../src/inventory');
            const gameControlModule = await import('../src/game/gameControl');

            ResourceType = typesModule.ResourceType;
            RecipeName = typesModule.RecipeName;
            BuildingType = typesModule.BuildingType;
            researchRecipe = researchModule.researchRecipe;
            isRecipeResearched = researchModule.isRecipeResearched;
            isRecipeNameResearched = researchModule.isRecipeNameResearched;
            resetResearch = researchModule.resetResearch;
            researchedRecipes = researchModule.researchedRecipes;
            getResearch = gameStateModule.getResearch;
            setResearch = gameStateModule.setResearch;
            addToResearch = gameStateModule.addToResearch;
            getResearchers = gameStateModule.getResearchers;
            addResearchers = gameStateModule.addResearchers;
            setBalance = gameStateModule.setBalance;
            buildFacility = buildingModule.buildFacility;
            builtBuildings = buildingModule.builtBuildings;
            Inventory = inventoryModule.Inventory;
            resetGame = gameControlModule.resetGame;
      });

      describe('researchRecipe', () => {
            it('successfully researches a recipe with sufficient RP', () => {
                  setResearch(100);

                  const result = researchRecipe(ResourceType.Stone);

                  expect(result).toBe(true);
                  expect(isRecipeResearched(ResourceType.Stone)).toBe(true);
                  expect(getResearch()).toBe(90); // 100 - 10 (Stone research cost)
            });

            it('deducts correct RP amount when researching', () => {
                  setResearch(100);

                  researchRecipe(ResourceType.Iron); // Cost: 50 RP

                  expect(getResearch()).toBe(50); // 100 - 50
            });

            it('does not deduct RP for free recipes (0 cost)', () => {
                  setResearch(100);

                  researchRecipe(ResourceType.Wood); // Cost: 0 RP

                  expect(getResearch()).toBe(100); // No deduction
                  expect(isRecipeResearched(ResourceType.Wood)).toBe(true);
            });

            it('fails to research when insufficient RP', () => {
                  setResearch(5);

                  const result = researchRecipe(ResourceType.Stone); // Cost: 10 RP

                  expect(result).toBe(false);
                  expect(isRecipeResearched(ResourceType.Stone)).toBe(false);
                  expect(getResearch()).toBe(5); // No deduction
            });

            it('fails to research already researched recipe', () => {
                  setResearch(100);

                  researchRecipe(ResourceType.Stone);
                  const initialRP = getResearch();

                  const result = researchRecipe(ResourceType.Stone); // Try again

                  expect(result).toBe(false);
                  expect(getResearch()).toBe(initialRP); // No additional deduction
            });

            it('fails to research non-existent resource', () => {
                  setResearch(100);

                  const result = researchRecipe('NonExistent' as any);

                  expect(result).toBe(false);
            });
      });

      describe('isRecipeResearched', () => {
            it('returns true for researched recipes', () => {
                  setResearch(100);
                  researchRecipe(ResourceType.Stone);

                  expect(isRecipeResearched(ResourceType.Stone)).toBe(true);
            });

            it('returns false for unresearched recipes', () => {
                  expect(isRecipeResearched(ResourceType.Iron)).toBe(false);
            });

            it('returns false for non-existent resources', () => {
                  expect(isRecipeResearched('NonExistent' as any)).toBe(false);
            });
      });

      describe('isRecipeNameResearched', () => {
            it('returns true for researched recipe names', () => {
                  setResearch(100);
                  researchRecipe(ResourceType.Stone);

                  expect(isRecipeNameResearched(RecipeName.QuarryStone)).toBe(true);
            });

            it('returns false for unresearched recipe names', () => {
                  expect(isRecipeNameResearched(RecipeName.SmeltIron)).toBe(false);
            });
      });

      describe('Production without research', () => {
            it('prevents building selection without researching recipe', () => {
                  setResearch(100);
                  setBalance(10000);

                  // Build a facility without researching its recipe
                  const inv = new Inventory();
                  buildFacility(BuildingType.Farm);
                  const farm = builtBuildings.get(BuildingType.Farm);

                  // Try to select an unresearched recipe (Grain)
                  const result = farm?.selectRecipe(0);

                  expect(result).toBe(false);
                  // Even if the constructor auto-selected it, activation must fail
                  expect(farm?.activate()).toBe(false);
            });

            it('allows building selection after researching recipe', () => {
                  setResearch(100);
                  setBalance(10000);

                  // Research the recipe first
                  researchRecipe(ResourceType.Grain);

                  buildFacility(BuildingType.Farm);
                  const farm = builtBuildings.get(BuildingType.Farm);

                  // Now selection should work
                  const result = farm?.selectRecipe(0);

                  expect(result).toBe(true);
                  expect(farm?.hasRecipeSelected()).toBe(true);
            });

            it('prevents production on unresearched single-recipe building', () => {
                  setBalance(10000);

                  // Build Forestry WITHOUT researching Wood
                  buildFacility(BuildingType.Forestry);
                  const forestry = builtBuildings.get(BuildingType.Forestry);

                  // Even though Forestry auto-selects its only recipe, 
                  // activation should fail because Wood isn't researched
                  const result = forestry?.activate();

                  expect(result).toBe(false);
                  expect(forestry?.isActive()).toBe(false);
            });
      });



      describe('Multiple recipe research', () => {
            it('allows researching multiple recipes', () => {
                  setResearch(1000);

                  researchRecipe(ResourceType.Wood);   // 0 RP
                  researchRecipe(ResourceType.Stone);  // 10 RP
                  researchRecipe(ResourceType.Grain);  // 5 RP
                  researchRecipe(ResourceType.Iron);   // 50 RP

                  expect(isRecipeResearched(ResourceType.Wood)).toBe(true);
                  expect(isRecipeResearched(ResourceType.Stone)).toBe(true);
                  expect(isRecipeResearched(ResourceType.Grain)).toBe(true);
                  expect(isRecipeResearched(ResourceType.Iron)).toBe(true);
                  expect(getResearch()).toBe(935); // 1000 - 10 - 5 - 50
            });

            it('tracks all researched recipes in the set', () => {
                  setResearch(1000);

                  researchRecipe(ResourceType.Wood);
                  researchRecipe(ResourceType.Stone);
                  researchRecipe(ResourceType.Grain);

                  expect(researchedRecipes.size).toBe(3);
                  expect(researchedRecipes.has(RecipeName.HarvestWood)).toBe(true);
                  expect(researchedRecipes.has(RecipeName.QuarryStone)).toBe(true);
                  expect(researchedRecipes.has(RecipeName.GrowGrain)).toBe(true);
            });
      });

      describe('Edge cases', () => {
            it('handles exact RP amount for research', () => {
                  setResearch(10); // Exact amount for Stone

                  const result = researchRecipe(ResourceType.Stone);

                  expect(result).toBe(true);
                  expect(getResearch()).toBe(0);
                  expect(isRecipeResearched(ResourceType.Stone)).toBe(true);
            });

            it('handles research with 1 RP less than needed', () => {
                  setResearch(9); // 1 less than Stone's 10 RP cost

                  const result = researchRecipe(ResourceType.Stone);

                  expect(result).toBe(false);
                  expect(getResearch()).toBe(9);
                  expect(isRecipeResearched(ResourceType.Stone)).toBe(false);
            });

            it('handles negative RP values gracefully', () => {
                  setResearch(-10);

                  const result = researchRecipe(ResourceType.Wood); // Free recipe

                  // Should still fail because getResearch() < 0
                  expect(result).toBe(false);
            });
      });
});
