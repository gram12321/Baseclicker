import type { Inventory } from '../inventory';
import { Resource } from '../resources/resource';
import { ResourceType } from '../../utils/types';
import { resources } from '../resources/resourcesRegistry';
import { formatCurrency } from '../../utils/utils';
import { addToBalance } from '../game/gameState';

const transactionLog: { amount: number; description: string; newBalance: number; timestamp: number }[] = [];

const marketSupply: Record<ResourceType, number> = Object.values(ResourceType).reduce(
  (acc, type) => {
    acc[type] = resources[type].localinitsupply;
    return acc;
  },
  {} as Record<ResourceType, number>
);

const localMarketQuality: Record<ResourceType, number> = Object.values(ResourceType).reduce(
  (acc, type) => {
    acc[type] = 1.0;
    return acc;
  },
  {} as Record<ResourceType, number>
);

const globalMarketSupply: Record<ResourceType, number> = Object.values(ResourceType).reduce(
  (acc, type) => {
    acc[type] = resources[type].globalinitsupply;
    return acc;
  },
  {} as Record<ResourceType, number>
);

const globalMarketQuality: Record<ResourceType, number> = Object.values(ResourceType).reduce(
  (acc, type) => {
    acc[type] = 1.0;
    return acc;
  },
  {} as Record<ResourceType, number>
);

export function mixQuality(
  existingQuantity: number,
  existingQuality: number,
  addedQuantity: number,
  addedQuality: number
): number {
  if (existingQuantity + addedQuantity <= 0) {
    return 1.0;
  }

  const totalWeight = existingQuantity + addedQuantity;
  const weightedQuality = (existingQuantity * existingQuality + addedQuantity * addedQuality) / totalWeight;

  return weightedQuality;
}

export function getLocalMarketSupply(resourceType: ResourceType): number {
  return marketSupply[resourceType];
}

export function getGlobalMarketSupply(resourceType: ResourceType): number {
  return globalMarketSupply[resourceType];
}

export function getLocalMarketQuality(resourceType: ResourceType): number {
  return localMarketQuality[resourceType] ?? 1.0;
}

export function getGlobalMarketQuality(resourceType: ResourceType): number {
  return globalMarketQuality[resourceType] ?? 1.0;
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
  localMarketQuality[resourceType] = mixQuality(
    currentMarketSupply,
    currentMarketQuality,
    amount,
    sellingQuality
  );

  marketSupply[resourceType] = currentMarketSupply + amount;

  const total = price * amount;
  transaction(total, `Sold ${amount} ${resourceType} for ${formatCurrency(total, { maxDecimals: 4, minDecimals: 0 })}`);
  return true;
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
    marketSupply[type] = resources[type].localinitsupply;
    localMarketQuality[type] = 1.0;
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
    globalMarketSupply[type] = resources[type].globalinitsupply;
    globalMarketQuality[type] = 1.0;
  }
}


export function addToLocalMarket(resourceType: ResourceType, amount: number, quality: number = 1.0): void {
  if (amount <= 0) return;
  const currentSupply = getLocalMarketSupply(resourceType);
  const currentQuality = getLocalMarketQuality(resourceType);
  localMarketQuality[resourceType] = mixQuality(currentSupply, currentQuality, amount, quality);
  marketSupply[resourceType] = currentSupply + amount;
}

export function removeFromLocalMarket(resourceType: ResourceType, amount: number): void {
  marketSupply[resourceType] = Math.max(0, marketSupply[resourceType] - amount);
}

export function addToGlobalMarket(resourceType: ResourceType, amount: number, quality: number = 1.0): void {
  if (amount <= 0) return;
  const currentSupply = getGlobalMarketSupply(resourceType);
  const currentQuality = getGlobalMarketQuality(resourceType);
  globalMarketQuality[resourceType] = mixQuality(currentSupply, currentQuality, amount, quality);
  globalMarketSupply[resourceType] = currentSupply + amount;
}


export function removeFromGlobalMarket(resourceType: ResourceType, amount: number): void {
  globalMarketSupply[resourceType] = Math.max(0, globalMarketSupply[resourceType] - amount);
}
