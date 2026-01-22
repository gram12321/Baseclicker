import { ResourceType } from './resource';

// Global game state: balance
let balance = 0;
const autoSellEnabled: Partial<Record<ResourceType, boolean>> = {};
const autoSellAmount: Partial<Record<ResourceType, number>> = {};

export function getBalance(): number {
	return balance;
}

export function addToBalance(amount: number): number {
	balance += amount;
	return balance;
}

export function isAutoSellEnabled(resourceType: ResourceType): boolean {
	return autoSellEnabled[resourceType] ?? false;
}

export function setAutoSellEnabled(resourceType: ResourceType, enabled: boolean): void {
	autoSellEnabled[resourceType] = enabled;
}

export function getAutoSellAmount(resourceType: ResourceType): number {
	return autoSellAmount[resourceType] ?? 1;
}

export function setAutoSellAmount(resourceType: ResourceType, amount: number): void {
	autoSellAmount[resourceType] = Math.max(1, Math.floor(amount));
}
