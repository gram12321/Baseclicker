import { describe, it, expect, beforeEach } from 'vitest';
import { BuildingType } from '../src/utils/types';
import { buildFacility, builtBuildings, resetBuildings, upgradeBuildingQuality } from '../src/lib/Building';
import { setBalance, resetGameState } from '../src/lib/game/gameState';

describe('Building Quality System', () => {
      beforeEach(() => {
            resetGameState();
            resetBuildings();
      });

      describe('Quality Upgrades', () => {
            it('should start with base quality of 1.0 and level 0', () => {
                  setBalance(10000);
                  buildFacility(BuildingType.Forestry);

                  const building = builtBuildings.get(BuildingType.Forestry);
                  expect(building?.productionQuality).toBe(1.0);
                  expect(building?.qualityUpgradeLevel).toBe(0);
            });

            it('should upgrade quality with diminishing returns', () => {
                  setBalance(100000);
                  buildFacility(BuildingType.Forestry);

                  const building = builtBuildings.get(BuildingType.Forestry);
                  const initialQuality = building!.productionQuality;

                  // First upgrade
                  const result1 = upgradeBuildingQuality(BuildingType.Forestry);
                  expect(result1.success).toBe(true);
                  expect(result1.upgradeLevel).toBe(1);
                  expect(result1.newQuality).toBeGreaterThan(initialQuality);

                  const firstIncrease = result1.newQuality - initialQuality;

                  // Second upgrade
                  const result2 = upgradeBuildingQuality(BuildingType.Forestry);
                  const secondIncrease = result2.newQuality - result1.newQuality;

                  // Third upgrade
                  const result3 = upgradeBuildingQuality(BuildingType.Forestry);
                  const thirdIncrease = result3.newQuality - result2.newQuality;

                  // Each increase should be larger than the previous (sigmoid grows)
                  // but the rate of growth should slow down
                  expect(secondIncrease).toBeGreaterThan(firstIncrease);
                  expect(thirdIncrease).toBeGreaterThan(secondIncrease);
            });

            it('should have quality increase bounded between 0 and 1', () => {
                  setBalance(1000000);
                  buildFacility(BuildingType.Forestry);

                  // Perform many upgrades
                  for (let i = 0; i < 20; i++) {
                        const prevQuality = builtBuildings.get(BuildingType.Forestry)!.productionQuality;
                        upgradeBuildingQuality(BuildingType.Forestry);
                        const newQuality = builtBuildings.get(BuildingType.Forestry)!.productionQuality;

                        const increase = newQuality - prevQuality;
                        expect(increase).toBeGreaterThan(0);
                        expect(increase).toBeLessThanOrEqual(1);
                  }
            });

            it('should fail upgrade if insufficient balance', () => {
                  setBalance(50); // Exactly enough to build Forestry, nothing left for upgrade
                  buildFacility(BuildingType.Forestry);

                  const result = upgradeBuildingQuality(BuildingType.Forestry);
                  expect(result.success).toBe(false);
                  expect(builtBuildings.get(BuildingType.Forestry)?.qualityUpgradeLevel).toBe(0);
            });

            it('should have exponentially increasing costs', () => {
                  setBalance(1000000);
                  buildFacility(BuildingType.Forestry);

                  const building = builtBuildings.get(BuildingType.Forestry)!;
                  const cost1 = building.getQualityUpgradeCost();

                  upgradeBuildingQuality(BuildingType.Forestry);
                  const cost2 = building.getQualityUpgradeCost();

                  upgradeBuildingQuality(BuildingType.Forestry);
                  const cost3 = building.getQualityUpgradeCost();

                  // Each cost should be 1.5x the previous (QUALITY_UPGRADE_COST_GROWTH = 1.5)
                  expect(cost2).toBeGreaterThan(cost1);
                  expect(cost3).toBeGreaterThan(cost2);
                  expect(cost2 / cost1).toBeCloseTo(1.5, 1);
                  expect(cost3 / cost2).toBeCloseTo(1.5, 1);
            });
      });
});
