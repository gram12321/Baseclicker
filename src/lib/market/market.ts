import type { Inventory } from '../inventory';
import { Resource } from '../resources/resource';
import { ResourceType } from '../../utils/types';
import { resources } from '../resources/resourcesRegistry';
import { formatCurrency } from '../../utils/utils';
import { addToBalance, isAutoBuyEnabled, getAutoBuyMaxPrice } from '../game/gameState';
import { getGameState } from '../game/gameState';
import { mixQuality } from '../resources/quality';

const transactionLog: { amount: number; description: string; newBalance: number; timestamp: number }[] = [];

export { mixQuality } from '../resources/quality';

export function getLocalMarketSupply(resourceType: ResourceType): number {
  return getGameState().market.localSupply[resourceType];
}

export function getGlobalMarketSupply(resourceType: ResourceType): number {
  return getGameState().market.globalSupply[resourceType];
}

export function getLocalMarketQuality(resourceType: ResourceType): number {
  return getGameState().market.localQuality[resourceType] ?? 1.0;
}

export function getGlobalMarketQuality(resourceType: ResourceType): number {
  return getGameState().market.globalQuality[resourceType] ?? 1.0;
}

// Keep getMarketSupply for backward compatibility, mapping to local
export function getMarketSupply(resourceType: ResourceType): number {
  return getLocalMarketSupply(resourceType);
}

export function transaction(amount: number, description: string): void {
  const newBalance = addToBalance(amount);
  transactionLog.push({
    amount,
    description,
    newBalance,
    timestamp: Date.now(),
  });
}

export function getTransactionLog() {
  return transactionLog.slice();
}

/**
 * Sells a given amount of a resource from inventory, adds money to balance.
 * @param inventory The player's inventory
 * @param resourceType The type of resource to sell
 * @param amount The amount to sell
 * @returns true if sale succeeded, false otherwise
 */
export function sellResource(
  inventory: Inventory,
  resourceType: ResourceType,
  amount: number
): boolean {
  if (amount <= 0) return false;
  if (!inventory.has(resourceType, amount)) return false;

  const resource: Resource = resources[resourceType];
  const currentMarketSupply = getLocalMarketSupply(resourceType);
  const currentMarketQuality = getLocalMarketQuality(resourceType);

  // Price depends on CURRENT market quality
  const price = resource.getLocalPrice(currentMarketSupply, currentMarketQuality);

  // Get quality of the resource being sold
  const sellingQuality = inventory.getQuality(resourceType);

  if (!inventory.remove(resourceType, amount)) return false;

  // Mix quality into the market
  getGameState().market.localQuality[resourceType] = mixQuality(
    currentMarketSupply,
    currentMarketQuality,
    amount,
    sellingQuality
  );

  getGameState().market.localSupply[resourceType] = currentMarketSupply + amount;

  const total = price * amount;
  transaction(total, `Sold ${amount} ${resourceType} for ${formatCurrency(total, { maxDecimals: 4, minDecimals: 0 })}`);
  return true;
}

/**
 * Buys a given amount of a resource from the local market, deducts money from balance.
 * @param inventory The player's inventory
 * @param resourceType The type of resource to buy
 * @param amount The amount to buy
 * @param currentBalance The player's current balance
 * @returns true if purchase succeeded, false otherwise
 */
export function buyResource(
  inventory: Inventory,
  resourceType: ResourceType,
  amount: number,
  currentBalance: number
): boolean {
  if (amount <= 0) return false;

  const resource: Resource = resources[resourceType];
  const currentMarketSupply = getLocalMarketSupply(resourceType);
  const currentMarketQuality = getLocalMarketQuality(resourceType);

  // Check if market has enough supply
  if (currentMarketSupply < amount) return false;

  // Price depends on CURRENT market quality
  const price = resource.getLocalPrice(currentMarketSupply, currentMarketQuality);
  const total = price * amount;

  // Check if player has enough money
  if (currentBalance < total) return false;

  // Remove from market supply
  getGameState().market.localSupply[resourceType] = currentMarketSupply - amount;

  // Deduct money from balance
  transaction(-total, `Bought ${amount} ${resourceType} for ${formatCurrency(total, { maxDecimals: 4, minDecimals: 0 })}`);

  // Add to inventory with market quality
  inventory.add(resourceType, amount, currentMarketQuality);

  return true;
}

/**
 * Attempts to auto-buy a resource if autobuy is enabled and price is acceptable.
 * Used by production system to prevent stalling when inputs are missing.
 * @param inventory The player's inventory
 * @param resourceType The type of resource to buy
 * @param amount The amount needed
 * @param currentBalance The player's current balance
 * @returns true if purchase succeeded or autobuy is disabled, false if autobuy failed
 */
export function tryAutoBuy(
  inventory: Inventory,
  resourceType: ResourceType,
  amount: number,
  currentBalance: number
): boolean {
  // If autobuy is not enabled for this resource, return true (don't block production)
  if (!isAutoBuyEnabled(resourceType)) {
    return false;
  }

  const resource: Resource = resources[resourceType];
  const currentMarketSupply = getLocalMarketSupply(resourceType);
  const currentMarketQuality = getLocalMarketQuality(resourceType);

  // Check if market has enough supply
  if (currentMarketSupply < amount) return false;

  // Get current price
  const price = resource.getLocalPrice(currentMarketSupply, currentMarketQuality);
  const maxPrice = getAutoBuyMaxPrice(resourceType);

  // Check if price is acceptable
  if (price > maxPrice) return false;

  // Try to buy
  return buyResource(inventory, resourceType, amount, currentBalance);
}

export function autoSellResource(
  inventory: Inventory,
  resourceType: ResourceType,
  minKeep = 0,
  maxSell?: number
): number {
  const available = inventory.getAmount(resourceType);
  let sellAmount = Math.max(0, available - Math.max(0, minKeep));
  if (maxSell !== undefined && maxSell > 0) {
    sellAmount = Math.min(sellAmount, maxSell);
  }
  if (sellAmount <= 0) return 0;
  return sellResource(inventory, resourceType, sellAmount) ? sellAmount : 0;
}

export function autoSellAll(
  inventory: Inventory,
  minKeepByType: Partial<Record<ResourceType, number>> = {}
): number {
  let totalSold = 0;
  for (const resourceType of Object.values(ResourceType)) {
    totalSold += autoSellResource(
      inventory,
      resourceType,
      minKeepByType[resourceType] ?? 0
    );
  }
  return totalSold;
}

export function resetEconomy(): void {
  // Reset ONLY local market supply and quality
  // Global market supply and quality are preserved as per requirements
  for (const type of Object.values(ResourceType)) {
    getGameState().market.localSupply[type] = resources[type].localinitsupply;
    getGameState().market.localQuality[type] = 1.0;
  }
}

/**
 * WARNING: THIS FUNCTION IS FOR TESTING PURPOSES ONLY!
 * 
 * The global economy state is persistent and should NOT be reset during normal gameplay.
 * Using this in production code will destroy the shared global market state.
 * Only use this in test suites (e.g. beforeEach blocks) to ensure isolation.
 */
export function resetGlobalEconomy(): void {
  for (const type of Object.values(ResourceType)) {
    getGameState().market.globalSupply[type] = resources[type].globalinitsupply;
    getGameState().market.globalQuality[type] = 1.0;
  }
}


export function addToLocalMarket(resourceType: ResourceType, amount: number, quality: number = 1.0): void {
  if (amount <= 0) return;
  const currentSupply = getLocalMarketSupply(resourceType);
  const currentQuality = getLocalMarketQuality(resourceType);
  getGameState().market.localQuality[resourceType] = mixQuality(currentSupply, currentQuality, amount, quality);
  getGameState().market.localSupply[resourceType] = currentSupply + amount;
}

export function removeFromLocalMarket(resourceType: ResourceType, amount: number): void {
  getGameState().market.localSupply[resourceType] = Math.max(0, getGameState().market.localSupply[resourceType] - amount);
}

export function addToGlobalMarket(resourceType: ResourceType, amount: number, quality: number = 1.0): void {
  if (amount <= 0) return;
  const currentSupply = getGlobalMarketSupply(resourceType);
  const currentQuality = getGlobalMarketQuality(resourceType);
  getGameState().market.globalQuality[resourceType] = mixQuality(currentSupply, currentQuality, amount, quality);
  getGameState().market.globalSupply[resourceType] = currentSupply + amount;
}


export function removeFromGlobalMarket(resourceType: ResourceType, amount: number): void {
  getGameState().market.globalSupply[resourceType] = Math.max(0, getGameState().market.globalSupply[resourceType] - amount);
}
