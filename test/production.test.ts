import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Production', () => {
  beforeEach(async () => {
    await vi.resetModules();
  });

  it('only advances production on active recipes', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');

    const inv = new Inventory();

    // Ensure Wood is built so it can be activated
    resources[ResourceType.Wood].productionBuilt = true;
    manageProduction(ResourceType.Wood, 'activate');

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Wood)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(inv.getAmount(ResourceType.Iron)).toBe(0);
  });

  it('workamount 0 requires inputs be present and consumes them before producing', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');

    // Make Iron instantaneous (workamount = 0)
    resources[ResourceType.Iron].recipe.workamount = 0;
    resources[ResourceType.Iron].productionBuilt = true;
    manageProduction(ResourceType.Iron, 'activate');

    const inv = new Inventory({ [ResourceType.Stone]: 2 });

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
  });

  it('input is consumed for multiple productions when overflow restarts production', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');

    // Ensure iron has workamount 1
    resources[ResourceType.Iron].recipe.workamount = 1;
    resources[ResourceType.Iron].productionBuilt = true;
    // Seed partial progress so combined with baseProduction gives >=2
    resources[ResourceType.Iron].recipe.workamountCompleted = 0.5;
    manageProduction(ResourceType.Iron, 'activate');

    // Provide inputs for two productions (2 stone per iron -> need 4)
    const inv = new Inventory({ [ResourceType.Stone]: 4 });

    // This adds 1.5 (baseProduction) to reach 2.0 total -> two productions
    advanceProduction(inv, 1.5);

    expect(inv.getAmount(ResourceType.Iron)).toBe(2);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    // leftover progress should be zero (exactly consumed)
    expect(resources[ResourceType.Iron].recipe.workamountCompleted).toBeCloseTo(0);
  });

  it('produces output and restarts when inputs available and workoverflow exists', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');

    resources[ResourceType.Iron].recipe.workamount = 1;
    resources[ResourceType.Iron].productionBuilt = true;
    resources[ResourceType.Iron].recipe.workamountCompleted = 0.75;
    manageProduction(ResourceType.Iron, 'activate');

    const inv = new Inventory({ [ResourceType.Stone]: 4 });

    // Add 1.5 => total 2.25 -> two productions (consume 4 stone)
    advanceProduction(inv, 1.5);

    expect(inv.getAmount(ResourceType.Iron)).toBe(2);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(resources[ResourceType.Iron].recipe.workamountCompleted).toBeCloseTo(0.25);
  });

  it('edge case: workamountCompleted === workamount triggers a production', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');

    resources[ResourceType.Iron].recipe.workamount = 1;
    resources[ResourceType.Iron].productionBuilt = true;
    resources[ResourceType.Iron].recipe.workamountCompleted = 1;
    manageProduction(ResourceType.Iron, 'activate');

    const inv = new Inventory({ [ResourceType.Stone]: 2 });

    // No extra production amount; but since completed === workamount it should still produce once
    advanceProduction(inv, 0);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(resources[ResourceType.Iron].recipe.workamountCompleted).toBeCloseTo(0);
  });

  it('exact completion consumes inputs for one production and does not double-produce', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');

    resources[ResourceType.Iron].recipe.workamount = 1;
    resources[ResourceType.Iron].productionBuilt = true;
    resources[ResourceType.Iron].recipe.workamountCompleted = 1;
    manageProduction(ResourceType.Iron, 'activate');

    // Provide inputs for two productions but expect only one to run
    const inv = new Inventory({ [ResourceType.Stone]: 4 });

    advanceProduction(inv, 0);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    // Only consumed inputs for a single production (2 stone per iron)
    expect(inv.getAmount(ResourceType.Stone)).toBe(2);
    expect(resources[ResourceType.Iron].recipe.workamountCompleted).toBeCloseTo(0);
  });

  it('overflow ends at 0 and restarts next tick consuming again', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');

    // Setup: partial progress so +1.6 yields exactly 2.0 -> two productions
    resources[ResourceType.Iron].recipe.workamount = 1;
    resources[ResourceType.Iron].productionBuilt = true;
    resources[ResourceType.Iron].recipe.workamountCompleted = 0.4;
    manageProduction(ResourceType.Iron, 'activate');

    // Provide inputs for three productions (2 stone per iron -> need 6)
    const inv = new Inventory({ [ResourceType.Stone]: 6 });

    // First tick: add 1.6 -> total 2.0 -> two productions, consume 4 stone
    advanceProduction(inv, 1.6);

    expect(inv.getAmount(ResourceType.Iron)).toBe(2);
    expect(inv.getAmount(ResourceType.Stone)).toBe(2);
    expect(resources[ResourceType.Iron].recipe.workamountCompleted).toBeCloseTo(0);

    // Next tick: add 1.0 -> progress 1.0 -> one production, consume remaining 2 stone
    advanceProduction(inv, 1.0);

    expect(inv.getAmount(ResourceType.Iron)).toBe(3);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(resources[ResourceType.Iron].recipe.workamountCompleted).toBeCloseTo(0);
  });

  it('global production multiplier scales production', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');
    const { setGlobalProductionMultiplier } = await import('../src/gameState');

    const inv = new Inventory();
    resources[ResourceType.Wood].productionBuilt = true;
    manageProduction(ResourceType.Wood, 'activate');

    // Default multiplier is 1.0, so 1 tick = 1 wood
    advanceProduction(inv);
    expect(inv.getAmount(ResourceType.Wood)).toBe(1);

    // Set multiplier to 2.0, so 1 tick = 2 wood
    setGlobalProductionMultiplier(2.0);
    advanceProduction(inv);
    expect(inv.getAmount(ResourceType.Wood)).toBe(3); // 1 from before + 2 new

    // Reset multiplier
    setGlobalProductionMultiplier(1.0);
  });

  it('global production multiplier affects partial progress on complex recipes', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resources/resourcesRegistry');
    const { ResourceType } = await import('../src/types');
    const { advanceProduction, manageProduction } = await import('../src/production');
    const { setGlobalProductionMultiplier } = await import('../src/gameState');

    const inv = new Inventory();

    // Grain has workamount 5
    resources[ResourceType.Grain].productionBuilt = true;
    manageProduction(ResourceType.Grain, 'activate');
    resources[ResourceType.Grain].recipe.workamountCompleted = 0;

    // With 0.5x multiplier, adding 1 base work per tick results in 0.5 progress
    setGlobalProductionMultiplier(0.5);
    advanceProduction(inv, 1);
    expect(resources[ResourceType.Grain].recipe.workamountCompleted).toBe(0.5);
    expect(inv.getAmount(ResourceType.Grain)).toBe(0);

    // With 10x multiplier, adding 1 base work results in 10 work -> 2 completions (workamount 5)
    setGlobalProductionMultiplier(10.0);
    advanceProduction(inv, 1);
    expect(inv.getAmount(ResourceType.Grain)).toBe(2);
    // 0.5 (prev) + 10.0 (new) = 10.5 total. 2 completions = 10.0. Remainder 0.5.
    expect(resources[ResourceType.Grain].recipe.workamountCompleted).toBeCloseTo(0.5);
  });
});
