import { BuildingType, Player, RecipeName, ResourceType } from '../../utils/types';
import { Inventory } from '../inventory';
import { resources } from '../resources/resourcesRegistry';
import type { Building } from '../Building';

export interface MarketState {
  localSupply: Record<ResourceType, number>;
  localQuality: Record<ResourceType, number>;
  globalSupply: Record<ResourceType, number>;
  globalQuality: Record<ResourceType, number>;
}

export interface RuntimeGameState {
  inventory: Inventory;
  player: Player;
  autoSellEnabled: Partial<Record<ResourceType, boolean>>;
  autoSellAmount: Partial<Record<ResourceType, number>>;
  autoSellMinKeep: Partial<Record<ResourceType, number>>;
  autoBuyEnabled: Partial<Record<ResourceType, boolean>>;
  autoBuyMaxPrice: Partial<Record<ResourceType, number>>;
  day: number;
  market: MarketState;
  buildings: Map<BuildingType, Building>;
  researchedRecipes: Set<RecipeName>;
  // Persistent Technology State: this intentionally survives standard game resets/prestige runs.
  techLevels: Record<ResourceType, number>;
  achievementIds: Set<string>;
}

function resourceRecord(value: number): Record<ResourceType, number> {
  return Object.values(ResourceType).reduce((record, resource) => {
    record[resource] = value;
    return record;
  }, {} as Record<ResourceType, number>);
}

function initialMarket(): MarketState {
  const localSupply = {} as Record<ResourceType, number>;
  const globalSupply = {} as Record<ResourceType, number>;

  for (const resource of Object.values(ResourceType)) {
    localSupply[resource] = resources[resource].localinitsupply;
    globalSupply[resource] = resources[resource].globalinitsupply;
  }

  return {
    localSupply,
    localQuality: resourceRecord(1),
    globalSupply,
    globalQuality: resourceRecord(1),
  };
}

export function createNewGameState(): RuntimeGameState {
  return {
    inventory: new Inventory(),
    player: { balance: 10000, research: 1000, researchers: 0, productionMultiplier: 1 },
    autoSellEnabled: {},
    autoSellAmount: {},
    autoSellMinKeep: {},
    autoBuyEnabled: {},
    autoBuyMaxPrice: {},
    day: 0,
    market: initialMarket(),
    buildings: new Map(),
    researchedRecipes: new Set(),
    techLevels: resourceRecord(1),
    achievementIds: new Set(),
  };
}

let gameState = createNewGameState();

export function getGameState(): RuntimeGameState {
  return gameState;
}

export function getInventory(): Inventory {
  return gameState.inventory;
}

export function getBalance(): number {
  return gameState.player.balance;
}

export function addToBalance(amount: number): number {
  gameState.player.balance += amount;
  return gameState.player.balance;
}

export function getResearch(): number {
  return gameState.player.research;
}

export function addToResearch(amount: number): number {
  gameState.player.research += amount;
  return gameState.player.research;
}

export function setBalance(amount: number): number {
  gameState.player.balance = amount;
  return gameState.player.balance;
}

export function setResearch(amount: number): number {
  gameState.player.research = amount;
  return gameState.player.research;
}

export function getResearchers(): number {
  return gameState.player.researchers;
}

export function addResearchers(amount: number): number {
  gameState.player.researchers += amount;
  return gameState.player.researchers;
}

export function getResearcherCost(): number {
  return Math.floor(100 * Math.pow(1.15, gameState.player.researchers));
}

export function isAutoSellEnabled(resourceType: ResourceType): boolean {
  return gameState.autoSellEnabled[resourceType] ?? false;
}

export function setAutoSellEnabled(resourceType: ResourceType, enabled: boolean): void {
  gameState.autoSellEnabled[resourceType] = enabled;
}

export function getAutoSellAmount(resourceType: ResourceType): number {
  return gameState.autoSellAmount[resourceType] ?? 1;
}

export function setAutoSellAmount(resourceType: ResourceType, amount: number): void {
  gameState.autoSellAmount[resourceType] = Math.max(1, Math.floor(amount));
}

export function getAutoSellMinKeep(resourceType: ResourceType): number {
  return gameState.autoSellMinKeep[resourceType] ?? 0;
}

export function setAutoSellMinKeep(resourceType: ResourceType, amount: number): void {
  gameState.autoSellMinKeep[resourceType] = Math.max(0, Math.floor(amount));
}

export function isAutoBuyEnabled(resourceType: ResourceType): boolean {
  return gameState.autoBuyEnabled[resourceType] ?? false;
}

export function setAutoBuyEnabled(resourceType: ResourceType, enabled: boolean): void {
  gameState.autoBuyEnabled[resourceType] = enabled;
}

export function getAutoBuyMaxPrice(resourceType: ResourceType): number {
  return gameState.autoBuyMaxPrice[resourceType] ?? Infinity;
}

export function setAutoBuyMaxPrice(resourceType: ResourceType, price: number): void {
  gameState.autoBuyMaxPrice[resourceType] = Math.max(0, price);
}

export function getGlobalProductionMultiplier(): number {
  return gameState.player.productionMultiplier;
}

export function setGlobalProductionMultiplier(value: number): void {
  gameState.player.productionMultiplier = Math.max(0, value);
}

export function resetGameState(): number {
  const bonus = gameState.player.balance / 1000000;
  gameState.player.productionMultiplier += bonus;
  gameState.player.balance = 0;
  gameState.player.research = 0;
  gameState.autoSellEnabled = {};
  gameState.autoSellAmount = {};
  gameState.autoSellMinKeep = {};
  gameState.autoBuyEnabled = {};
  gameState.autoBuyMaxPrice = {};
  return bonus;
}

export function hireResearcher(): boolean {
  const cost = getResearcherCost();
  if (gameState.player.balance < cost) return false;
  gameState.player.balance -= cost;
  gameState.player.researchers += 1;
  return true;
}
