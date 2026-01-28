import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Game Reset and Prestige', () => {
      beforeEach(async () => {
            // Reset all modules to clear global state between tests
            await vi.resetModules();
      });

      it('resets progress but keeps researchers and calculates bonus', async () => {
            const { Inventory } = await import('../src/inventory');
            const { resources } = await import('../src/resources/resourcesRegistry');
            const { ResourceType, BuildingType } = await import('../src/utils/types');
            const { builtBuildings, buildFacility } = await import('../src/Building');
            const {
                  getBalance,
                  setBalance,
                  getResearch,
                  setResearch,
                  getResearchers,
                  addResearchers,
                  getGlobalProductionMultiplier,
                  setGlobalProductionMultiplier
            } = await import('../src/gameState');
            const { getGameday, resetGameday, tick } = await import('../src/game/gametick');
            const { resetGame } = await import('../src/game/gameControl');

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
                  // (Removed invalid property assignment)
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

            // ... (removed invalid lines)
      });

      it('accumulates multiplier bonus over multiple resets', async () => {
            const { Inventory } = await import('../src/inventory');
            const { setBalance, getGlobalProductionMultiplier } = await import('../src/gameState');
            const { resetGame } = await import('../src/game/gameControl');

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

      it('preserves transaction log and adds reset entry', async () => {
            const { Inventory } = await import('../src/inventory');
            const { transaction, getTransactionLog } = await import('../src/economy');
            const { setBalance } = await import('../src/gameState');
            const { resetGame } = await import('../src/game/gameControl');

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
});
