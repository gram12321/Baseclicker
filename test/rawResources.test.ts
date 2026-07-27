import { beforeEach, describe, expect, it } from 'vitest';
import { BuildingType, RecipeName, ResourceType } from '../src/utils/types';
import { advanceProduction, buildFacility, builtBuildings, resetBuildings } from '../src/lib/Building';
import { resetGameState, setBalance, setResearch } from '../src/lib/game/gameState';
import { Inventory } from '../src/lib/inventory';
import { researchRecipe } from '../src/lib/research';

describe('raw resource production', () => {
  beforeEach(() => {
    resetGameState();
    resetBuildings();
    setBalance(10_000);
    setResearch(1_000);
  });

  it('mines a fixed ore batch, then smelts that exact composition into iron and slag', () => {
    researchRecipe(RecipeName.MineIronOre);
    researchRecipe(RecipeName.SmeltOreBatch);
    buildFacility(BuildingType.Mine);
    buildFacility(BuildingType.Smelter);

    const mine = builtBuildings.get(BuildingType.Mine)!;
    const smelter = builtBuildings.get(BuildingType.Smelter)!;
    mine.selectRecipe(RecipeName.MineIronOre);
    smelter.selectRecipe(RecipeName.SmeltOreBatch);
    mine.activate();

    const inventory = new Inventory({
      [ResourceType.Electricity]: 3,
      [ResourceType.Coal]: 1,
    });

    advanceProduction(inventory, 3);

    expect(inventory.getAmount(ResourceType.OreBatch)).toBe(1);
    expect(inventory.getAmount(ResourceType.Iron)).toBe(0);
    expect(inventory.getAmount(ResourceType.Slag)).toBe(0);

    const composition = inventory.peekBatch(ResourceType.OreBatch)?.composition;
    expect(composition?.oreType).toBe('IronOre');
    expect(composition?.yields[ResourceType.Iron]).toBeGreaterThanOrEqual(0.8);
    expect(composition?.yields[ResourceType.Iron]).toBeLessThanOrEqual(1.2);
    expect(composition?.yields[ResourceType.Slag]).toBeGreaterThanOrEqual(0.3);
    expect(composition?.yields[ResourceType.Slag]).toBeLessThanOrEqual(0.7);

    smelter.activate();
    advanceProduction(inventory, 2);

    expect(inventory.getAmount(ResourceType.OreBatch)).toBe(0);
    expect(inventory.getAmount(ResourceType.Coal)).toBe(0);
    expect(inventory.getAmount(ResourceType.Iron)).toBeCloseTo(composition!.yields[ResourceType.Iron]!);
    expect(inventory.getAmount(ResourceType.Slag)).toBeCloseTo(composition!.yields[ResourceType.Slag]!);
  });
});
