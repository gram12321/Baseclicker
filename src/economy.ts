// economy.ts
import { Inventory } from './inventory';
import { Resource } from './resource';
import { ResourceType } from './types';
import { resources } from './resourcesRegistry';
import { formatCurrency } from './utils';

import { addToBalance } from './gameState';

const transactionLog: { amount: number; description: string; newBalance: number; timestamp: number }[] = [];
const marketSupply: Record<ResourceType, number> = Object.values(ResourceType).reduce(
  (acc, type) => {
    acc[type] = resources[type].initialSupply;
    return acc;
  },
  {} as Record<ResourceType, number>
);

export function getMarketSupply(resourceType: ResourceType): number {
  return marketSupply[resourceType];
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
  const currentMarketSupply = getMarketSupply(resourceType);
  const price = resource.getCurrentPrice(currentMarketSupply);
  if (!inventory.remove(resourceType, amount)) return false;
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
