// economy.ts
import { Inventory } from './inventory';
import { ResourceType, Resource } from './resource';
import { resources } from './resourcesRegistry';

import { addToBalance } from './gameState';

const transactionLog: { amount: number; description: string; newBalance: number; timestamp: number }[] = [];

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
  const price = resource.getCurrentPrice();
  if (!inventory.remove(resourceType, amount)) return false;
  const total = price * amount;
  transaction(total, `Sold ${amount} ${resourceType} for ${total}`);
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
