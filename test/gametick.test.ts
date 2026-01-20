import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Gametick', () => {
  beforeEach(async () => {
    // reset module registry so module-level state is fresh between tests
    await vi.resetModules();
  });

  it('tick increments gameday', async () => {
    const { getGameday, tick } = await import('../src/game/gametick');
    expect(getGameday()).toBe(0);
    tick();
    expect(getGameday()).toBe(1);
  });

  it('runTickHooks calls registered hooks', async () => {
    const { onTick, runTickHooks } = await import('../src/hooks/gametickHook');
    let called = false;
    onTick(() => {
      called = true;
    });
    runTickHooks();
    expect(called).toBe(true);
  });
});
