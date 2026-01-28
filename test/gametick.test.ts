import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { getGameday as GetGamedayType, tick as TickType } from '../src/game/gametick';
import type { onTick as OnTickType, runTickHooks as RunTickHooksType } from '../src/hooks/gametickHook';

describe('Gametick', () => {
  let getGameday: typeof GetGamedayType;
  let tick: typeof TickType;
  let onTick: typeof OnTickType;
  let runTickHooks: typeof RunTickHooksType;

  beforeEach(async () => {
    // reset module registry so module-level state is fresh between tests
    await vi.resetModules();

    // Re-import modules after reset
    const gametickModule = await import('../src/game/gametick');
    const gametickHookModule = await import('../src/hooks/gametickHook');

    getGameday = gametickModule.getGameday;
    tick = gametickModule.tick;
    onTick = gametickHookModule.onTick;
    runTickHooks = gametickHookModule.runTickHooks;
  });

  it('tick increments gameday', () => {
    expect(getGameday()).toBe(0);
    tick();
    expect(getGameday()).toBe(1);
  });

  it('runTickHooks calls registered hooks', () => {
    let called = false;
    onTick(() => {
      called = true;
    });
    runTickHooks();
    expect(called).toBe(true);
  });
});
