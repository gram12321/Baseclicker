import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RecipeName as RecipeNameEnum, ResourceType as ResourceTypeEnum, BuildingType as BuildingTypeEnum } from '../src/utils/types';
import type { Inventory as InventoryType } from '../src/lib/inventory';
import type { advanceProduction as AdvanceProductionType, buildFacility as BuildFacilityType, builtBuildings as BuiltBuildingsType, upgradeBuildingQuality as UpgradeBuildingQualityType } from '../src/lib/Building';
import type { researchRecipe as ResearchRecipeType } from '../src/lib/research';
import type { setBalance as SetBalanceType, setResearch as SetResearchType } from '../src/lib/game/gameState';
import type { setTechLevel as SetTechLevelType } from '../src/lib/game/technology';

describe('Production Quality System', () => {
      let RecipeName: typeof RecipeNameEnum;
      let ResourceType: typeof ResourceTypeEnum;
      let BuildingType: typeof BuildingTypeEnum;
      let Inventory: typeof InventoryType;
      let advanceProduction: typeof AdvanceProductionType;
      let buildFacility: typeof BuildFacilityType;
      let builtBuildings: typeof BuiltBuildingsType;
      let upgradeBuildingQuality: typeof UpgradeBuildingQualityType;
      let researchRecipe: typeof ResearchRecipeType;
      let setBalance: typeof SetBalanceType;
      let setResearch: typeof SetResearchType;
      let setTechLevel: typeof SetTechLevelType;

      beforeEach(async () => {
            await vi.resetModules();

            const typesModule = await import('../src/utils/types');
            const inventoryModule = await import('../src/lib/inventory');
            const buildingModule = await import('../src/lib/Building');
            const researchModule = await import('../src/lib/research');
            const gameStateModule = await import('../src/lib/game/gameState');
            const technologyModule = await import('../src/lib/game/technology');

            RecipeName = typesModule.RecipeName;
            ResourceType = typesModule.ResourceType;
            BuildingType = typesModule.BuildingType;
            Inventory = inventoryModule.Inventory;
            advanceProduction = buildingModule.advanceProduction;
            buildFacility = buildingModule.buildFacility;
            builtBuildings = buildingModule.builtBuildings;
            upgradeBuildingQuality = buildingModule.upgradeBuildingQuality;
            researchRecipe = researchModule.researchRecipe;
            setBalance = gameStateModule.setBalance;
            setResearch = gameStateModule.setResearch;
            setTechLevel = technologyModule.setTechLevel;
      });

      it('should cap output quality by tech level', () => {
            setBalance(100000);
            setResearch(1000);

            // Build and upgrade forestry to high quality
            researchRecipe(RecipeName.HarvestWood);
            buildFacility(BuildingType.Forestry);

            // Upgrade building quality multiple times
            for (let i = 0; i < 5; i++) {
                  upgradeBuildingQuality(BuildingType.Forestry);
            }

            const building = builtBuildings.get(BuildingType.Forestry)!;
            const buildingQuality = building.productionQuality;

            // Set tech level lower than building quality
            setTechLevel(ResourceType.Wood, 2);

            const inv = new Inventory({ [ResourceType.Electricity]: 100 });
            building.activate();
            advanceProduction(inv);

            // Output should be capped by tech level (2), not building quality
            expect(inv.getQuality(ResourceType.Wood)).toBe(2);
            expect(buildingQuality).toBeGreaterThan(2); // Verify building quality is actually higher
      });

      it('should cap output quality by input quality + 1', () => {
            setBalance(100000);
            setResearch(1000);

            // Build smelter with high quality and tech
            researchRecipe(RecipeName.SmeltOreBatch);
            buildFacility(BuildingType.Smelter);

            // Upgrade building quality
            for (let i = 0; i < 5; i++) {
                  upgradeBuildingQuality(BuildingType.Smelter);
            }

            const building = builtBuildings.get(BuildingType.Smelter)!;

            // Set high tech level
            setTechLevel(ResourceType.Iron, 10);

            const inv = new Inventory({ [ResourceType.Coal]: 1 });
            inv.add(ResourceType.OreBatch, 1, 1.5);

            building.selectRecipe(RecipeName.SmeltOreBatch);
            building.activate();
            // Smelting takes two work units, so advance twice to complete.
            advanceProduction(inv);
            advanceProduction(inv);

            // Verify production happened
            expect(inv.getAmount(ResourceType.Iron)).toBeGreaterThan(0);

            // Output should be capped by input quality + 1 = 2.25
            // (Average of OreBatch Q1.5 and Coal Q1.0 = 1.25)
            const ironQuality = inv.getQuality(ResourceType.Iron);
            expect(ironQuality).toBe(2.25);
            expect(building.productionQuality).toBeGreaterThan(2.5); // Building can do more
      });

      it('should use building quality when it is the limiting factor', () => {
            setBalance(100000);
            setResearch(1000);

            // Build smelter with LOW building quality
            researchRecipe(RecipeName.SmeltOreBatch);
            buildFacility(BuildingType.Smelter);

            const building = builtBuildings.get(BuildingType.Smelter)!;

            // Set high tech level
            setTechLevel(ResourceType.Iron, 10);

            const inv = new Inventory({ [ResourceType.Coal]: 1 });
            inv.add(ResourceType.OreBatch, 1, 5.0);

            building.selectRecipe(RecipeName.SmeltOreBatch);
            building.activate();
            advanceProduction(inv);
            advanceProduction(inv);

            // Output should be capped by building quality (1.0 base)
            expect(inv.getQuality(ResourceType.Iron)).toBe(1.0);
      });

      it('should apply all three caps correctly', () => {
            setBalance(100000);
            setResearch(1000);

            researchRecipe(RecipeName.SmeltOreBatch);
            buildFacility(BuildingType.Smelter);

            // Upgrade building quality to ~2.0
            upgradeBuildingQuality(BuildingType.Smelter);
            upgradeBuildingQuality(BuildingType.Smelter);

            const building = builtBuildings.get(BuildingType.Smelter)!;

            // Tech = 3, Building = ~2.0, Input = 1.0
            setTechLevel(ResourceType.Iron, 3);

            const inv = new Inventory({ [ResourceType.Coal]: 1 });
            inv.add(ResourceType.OreBatch, 1, 1.0);

            building.selectRecipe(RecipeName.SmeltOreBatch);
            building.activate();
            advanceProduction(inv);
            advanceProduction(inv);

            // Output should be min(~2.0, 3, 2.0) = 2.0
            // Input quality: (OreBatch Q1.0 + Coal Q1.0) / 2 = 1.0
            // Cap: 1.0 + 1.0 = 2.0
            expect(inv.getQuality(ResourceType.Iron)).toBe(2.0);
      });
});
