import { BuildingSave, builtBuildings, restoreBuildings } from '../Building';
import { InventorySave } from '../inventory';
import { getGameState } from './gameState';
import { RecipeName, ResourceType } from '../../utils/types';

const STORAGE_KEY = 'baseclicker.save.v1';

export interface GameSave {
  version: 1;
  savedAt: string;
  inventory: InventorySave;
  player: {
    balance: number;
    research: number;
    researchers: number;
    productionMultiplier: number;
  };
  autoSellEnabled: Partial<Record<ResourceType, boolean>>;
  autoSellAmount: Partial<Record<ResourceType, number>>;
  autoSellMinKeep: Partial<Record<ResourceType, number>>;
  autoBuyEnabled: Partial<Record<ResourceType, boolean>>;
  autoBuyMaxPrice: Partial<Record<ResourceType, number>>;
  day: number;
  market: {
    localSupply: Record<ResourceType, number>;
    localQuality: Record<ResourceType, number>;
    globalSupply: Record<ResourceType, number>;
    globalQuality: Record<ResourceType, number>;
  };
  buildings: BuildingSave[];
  researchedRecipes: RecipeName[];
  technologyLevels: Record<ResourceType, number>;
  achievements: string[];
}

export function createGameSave(): GameSave {
  const state = getGameState();
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    inventory: state.inventory.toSave(),
    player: { ...state.player },
    autoSellEnabled: { ...state.autoSellEnabled },
    autoSellAmount: { ...state.autoSellAmount },
    autoSellMinKeep: { ...state.autoSellMinKeep },
    autoBuyEnabled: { ...state.autoBuyEnabled },
    autoBuyMaxPrice: { ...state.autoBuyMaxPrice },
    day: state.day,
    market: {
      localSupply: { ...state.market.localSupply },
      localQuality: { ...state.market.localQuality },
      globalSupply: { ...state.market.globalSupply },
      globalQuality: { ...state.market.globalQuality },
    },
    buildings: [...builtBuildings.values()].map(building => building.toSave()),
    researchedRecipes: [...state.researchedRecipes],
    technologyLevels: { ...state.techLevels },
    achievements: [...state.achievementIds],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGameSave(value: unknown): value is GameSave {
  if (!isRecord(value) || value.version !== 1) return false;
  return isRecord(value.inventory) && isRecord(value.player) && isRecord(value.market) &&
    Array.isArray(value.buildings) && Array.isArray(value.researchedRecipes) &&
    Array.isArray(value.achievements);
}

export function saveGame(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(createGameSave()));
}

export function loadGame(): boolean {
  if (typeof localStorage === 'undefined') return false;

  const rawSave = localStorage.getItem(STORAGE_KEY);
  if (!rawSave) return false;

  try {
    const parsed: unknown = JSON.parse(rawSave);
    if (!isGameSave(parsed)) return false;

    const state = getGameState();
    state.inventory.restoreFromSave(parsed.inventory);
    Object.assign(state.player, parsed.player);
    state.autoSellEnabled = { ...parsed.autoSellEnabled };
    state.autoSellAmount = { ...parsed.autoSellAmount };
    state.autoSellMinKeep = { ...parsed.autoSellMinKeep };
    state.autoBuyEnabled = { ...parsed.autoBuyEnabled };
    state.autoBuyMaxPrice = { ...parsed.autoBuyMaxPrice };
    state.day = parsed.day;
    state.market.localSupply = { ...parsed.market.localSupply };
    state.market.localQuality = { ...parsed.market.localQuality };
    state.market.globalSupply = { ...parsed.market.globalSupply };
    state.market.globalQuality = { ...parsed.market.globalQuality };
    state.researchedRecipes.clear();
    parsed.researchedRecipes.forEach(recipe => state.researchedRecipes.add(recipe));
    Object.assign(state.techLevels, parsed.technologyLevels);
    state.achievementIds.clear();
    parsed.achievements.forEach(id => state.achievementIds.add(id));
    restoreBuildings(parsed.buildings);
    return true;
  } catch {
    return false;
  }
}

export function clearSavedGame(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}
