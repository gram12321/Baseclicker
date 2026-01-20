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
