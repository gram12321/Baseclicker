import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Production', () => {
  beforeEach(async () => {
    await vi.resetModules();
  });

  it('only advances production on active recipes', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    const inv = new Inventory();

    // Activate only Wood
    manageProduction(ResourceType.Wood, 'activate');

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Wood)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(inv.getAmount(ResourceType.Iron)).toBe(0);
  });

  it('workamount 0 requires inputs be present and consumes them before producing', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    // Make Iron instantaneous (workamount = 0)
    resources[ResourceType.Iron].recipe.workamount = 0;
    manageProduction(ResourceType.Iron, 'activate');

    const inv = new Inventory({ [ResourceType.Stone]: 2 });

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
  });

  it('input is consumed for multiple productions when overflow restarts production', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    // Ensure iron has workamount 1
    resources[ResourceType.Iron].recipe.workamount = 1;
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
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    resources[ResourceType.Iron].recipe.workamount = 1;
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
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    resources[ResourceType.Iron].recipe.workamount = 1;
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
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    resources[ResourceType.Iron].recipe.workamount = 1;
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
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    // Setup: partial progress so +1.6 yields exactly 2.0 -> two productions
    resources[ResourceType.Iron].recipe.workamount = 1;
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
});
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Production', () => {
  beforeEach(async () => {
    await vi.resetModules();
  });

  it('only advances production on active recipes', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    const inv = new Inventory();

    // Activate only Wood
    manageProduction(ResourceType.Wood, 'activate');

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Wood)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(inv.getAmount(ResourceType.Iron)).toBe(0);
  });

  it('workamount 0 requires inputs be present and consumes them before producing', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    // Make Iron instantaneous (workamount = 0)
    resources[ResourceType.Iron].recipe.workamount = 0;
    manageProduction(ResourceType.Iron, 'activate');

    const inv = new Inventory({ [ResourceType.Stone]: 2 });

    advanceProduction(inv);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
  });

  it('input is consumed for multiple productions when overflow restarts production', async () => {
    const { Inventory } = await import('../src/inventory');
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    // Ensure iron has workamount 1
    resources[ResourceType.Iron].recipe.workamount = 1;
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
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    resources[ResourceType.Iron].recipe.workamount = 1;
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
    const { resources } = await import('../src/resourcesRegistry');
    const { ResourceType } = await import('../src/resource');
    const { advanceProduction, manageProduction } = await import('../src/production');

    resources[ResourceType.Iron].recipe.workamount = 1;
    resources[ResourceType.Iron].recipe.workamountCompleted = 1;
    manageProduction(ResourceType.Iron, 'activate');

    const inv = new Inventory({ [ResourceType.Stone]: 2 });

    // No extra production amount; but since completed === workamount it should still produce once
    advanceProduction(inv, 0);

    expect(inv.getAmount(ResourceType.Iron)).toBe(1);
    expect(inv.getAmount(ResourceType.Stone)).toBe(0);
    expect(resources[ResourceType.Iron].recipe.workamountCompleted).toBeCloseTo(0);
  });
});
