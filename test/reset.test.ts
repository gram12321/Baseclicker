import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Inventory as InventoryType } from '../src/lib/inventory';
import type { ResourceType as ResourceTypeEnum, BuildingType as BuildingTypeEnum } from '../src/utils/types';
import type { builtBuildings as BuiltBuildingsType, buildFacility as BuildFacilityType } from '../src/lib/Building';
import type { getBalance as GetBalanceType, setBalance as SetBalanceType, getResearch as GetResearchType, setResearch as SetResearchType, getResearchers as GetResearchersType, addResearchers as AddResearchersType, getGlobalProductionMultiplier as GetGlobalProductionMultiplierType, setGlobalProductionMultiplier as SetGlobalProductionMultiplierType } from '../src/lib/game/gameState';
import type { getGameday as GetGamedayType, tick as TickType } from '../src/lib/game/gametick';
import type { resetGame as ResetGameType } from '../src/lib/game/gameControl';
import type { transaction as TransactionType, getTransactionLog as GetTransactionLogType } from '../src/lib/market/market';
import type { researchRecipe as ResearchRecipeType, isRecipeResearched as IsRecipeResearchedType, resetResearch as ResetResearchType, researchedRecipes as ResearchedRecipesType } from '../src/lib/research';

describe('Game Reset and Prestige', () => {
      let Inventory: typeof InventoryType;
      let ResourceType: typeof ResourceTypeEnum;
      let BuildingType: typeof BuildingTypeEnum;
      let builtBuildings: typeof BuiltBuildingsType;
      let buildFacility: typeof BuildFacilityType;
      let getBalance: typeof GetBalanceType;
      let setBalance: typeof SetBalanceType;
      let getResearch: typeof GetResearchType;
      let setResearch: typeof SetResearchType;
      let getResearchers: typeof GetResearchersType;
      let addResearchers: typeof AddResearchersType;
      let getGlobalProductionMultiplier: typeof GetGlobalProductionMultiplierType;
      let setGlobalProductionMultiplier: typeof SetGlobalProductionMultiplierType;
      let getGameday: typeof GetGamedayType;
      let tick: typeof TickType;
      let resetGame: typeof ResetGameType;
      let transaction: typeof TransactionType;
      let getTransactionLog: typeof GetTransactionLogType;
      let researchRecipe: typeof ResearchRecipeType;
      let isRecipeResearched: typeof IsRecipeResearchedType;
      let resetResearch: typeof ResetResearchType;
      let researchedRecipes: typeof ResearchedRecipesType;

      beforeEach(async () => {
            // Reset all modules to clear global state between tests
            await vi.resetModules();

            // Re-import modules after reset
            const inventoryModule = await import('../src/lib/inventory');
            const typesModule = await import('../src/utils/types');
            const buildingModule = await import('../src/lib/Building');
            const gameStateModule = await import('../src/lib/game/gameState');
            const gametickModule = await import('../src/lib/game/gametick');
            const gameControlModule = await import('../src/lib/game/gameControl');
            const economyModule = await import('../src/lib/market/market');
            const researchModule = await import('../src/lib/research');

            Inventory = inventoryModule.Inventory;
            ResourceType = typesModule.ResourceType;
            BuildingType = typesModule.BuildingType;
            builtBuildings = buildingModule.builtBuildings;
            buildFacility = buildingModule.buildFacility;
            getBalance = gameStateModule.getBalance;
            setBalance = gameStateModule.setBalance;
            getResearch = gameStateModule.getResearch;
            setResearch = gameStateModule.setResearch;
            getResearchers = gameStateModule.getResearchers;
            addResearchers = gameStateModule.addResearchers;
            getGlobalProductionMultiplier = gameStateModule.getGlobalProductionMultiplier;
            setGlobalProductionMultiplier = gameStateModule.setGlobalProductionMultiplier;
            getGameday = gametickModule.getGameday;
            tick = gametickModule.tick;
            resetGame = gameControlModule.resetGame;
            transaction = economyModule.transaction;
            getTransactionLog = economyModule.getTransactionLog;
            researchRecipe = researchModule.researchRecipe;
            isRecipeResearched = researchModule.isRecipeResearched;
            resetResearch = researchModule.resetResearch;
            researchedRecipes = researchModule.researchedRecipes;
      });

      it('resets progress but keeps researchers and calculates bonus', () => {
            const inv = new Inventory({ [ResourceType.Wood]: 100 });

            // Setup initial state
            setBalance(5000000); // 5 million
            setResearch(1000);
            addResearchers(5);
            setGlobalProductionMultiplier(1.0);

            // Build something
            buildFacility(BuildingType.Forestry);
            const forestry = builtBuildings.get(BuildingType.Forestry);
            if (forestry) {
                  forestry.productionUpgradeLevel = 5;
                  forestry.activate(); // Activates current recipe
            }

            // Simulate some time
            tick(inv);
            expect(getGameday()).toBe(1);

            // Ensure exact balance for bonus calculation (ignore building costs spent)
            setBalance(5000000);

            // Perform Reset
            resetGame(inv);

            // Verifications after reset
            expect(getBalance()).toBe(0);
            expect(getResearch()).toBe(0);
            expect(getGameday()).toBe(0);
            expect(inv.getAmount(ResourceType.Wood)).toBe(0);

            // Researchers should persist
            expect(getResearchers()).toBe(5);

            // Global multiplier should have prestige bonus: 1.0 + (5,000,000 / 1,000,000) = 6.0
            expect(getGlobalProductionMultiplier()).toBe(6.0);

            // Resources should be reset
            expect(builtBuildings.has(BuildingType.Forestry)).toBe(false);
            // Since the building is gone, getting it should return undefined
            expect(builtBuildings.get(BuildingType.Forestry)).toBeUndefined();
      });

      it('accumulates multiplier bonus over multiple resets', () => {
            const inv = new Inventory();

            // First reset: 2M balance -> +2.0 bonus
            setBalance(2000000);
            resetGame(inv);
            expect(getGlobalProductionMultiplier()).toBe(3.0); // 1.0 initial + 2.0

            // Second reset: 3M balance -> +3.0 bonus
            setBalance(3000000);
            resetGame(inv);
            expect(getGlobalProductionMultiplier()).toBe(6.0); // 3.0 + 3.0
      });

      it('preserves transaction log and adds reset entry', () => {
            const inv = new Inventory();

            transaction(100, "Initial sale");
            setBalance(1000000); // For 1.0 bonus

            resetGame(inv);

            const log = getTransactionLog();
            expect(log.length).toBe(2);
            expect(log[0].description).toBe("Initial sale");
            expect(log[1].description).toContain("COMPANY RESET & LIQUIDATION");
            expect(log[1].description).toContain("1,0000"); // 1.0000 formatted
      });

      describe('Research reset behavior', () => {
            it('clears all researched recipes on reset', () => {
                  setResearch(100);

                  // Research multiple recipes
                  researchRecipe(ResourceType.Wood);
                  researchRecipe(ResourceType.Stone);

                  expect(researchedRecipes.size).toBe(2);

                  // Reset research
                  resetResearch();

                  expect(researchedRecipes.size).toBe(0);
                  expect(isRecipeResearched(ResourceType.Wood)).toBe(false);
                  expect(isRecipeResearched(ResourceType.Stone)).toBe(false);
            });

            it('resets researched recipes during game reset', () => {
                  setResearch(100);
                  const inv = new Inventory();

                  // Research recipes
                  researchRecipe(ResourceType.Wood);
                  researchRecipe(ResourceType.Stone);

                  expect(isRecipeResearched(ResourceType.Wood)).toBe(true);
                  expect(isRecipeResearched(ResourceType.Stone)).toBe(true);

                  // Perform game reset
                  resetGame(inv);

                  // Researched recipes should be cleared
                  expect(isRecipeResearched(ResourceType.Wood)).toBe(false);
                  expect(isRecipeResearched(ResourceType.Stone)).toBe(false);
                  expect(researchedRecipes.size).toBe(0);
            });

            it('does NOT reset researchers during game reset', () => {
                  setResearch(100);
                  addResearchers(5);
                  const inv = new Inventory();

                  expect(getResearchers()).toBe(5);

                  // Perform game reset
                  resetGame(inv);

                  // Researchers should persist
                  expect(getResearchers()).toBe(5);
            });

            it('resets research points during game reset', () => {
                  setResearch(500);
                  const inv = new Inventory();

                  expect(getResearch()).toBe(500);

                  // Perform game reset
                  resetGame(inv);

                  // Research points should be reset to 0
                  expect(getResearch()).toBe(0);
            });
      });
});
