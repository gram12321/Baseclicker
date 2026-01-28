import { ResourceType, Player } from './utils/types';

// Global game state: player

const player: Player = {
	balance: 0,
	research: 0,
	researchers: 0,
	productionMultiplier: 1.0,
};

const autoSellEnabled: Partial<Record<ResourceType, boolean>> = {};
const autoSellAmount: Partial<Record<ResourceType, number>> = {};

export function getBalance(): number {
	return player.balance;
}

export function addToBalance(amount: number): number {
	player.balance += amount;
	return player.balance;
}

export function getResearch(): number {
	return player.research;
}

export function addToResearch(amount: number): number {
	player.research += amount;
	return player.research;
}

export function setBalance(amount: number): number {
	player.balance = amount;
	return player.balance;
}

export function setResearch(amount: number): number {
	player.research = amount;
	return player.research;
}

export function getResearchers(): number {
	return player.researchers;
}

export function addResearchers(amount: number): number {
	player.researchers += amount;
	return player.researchers;
}

export function getResearcherCost(): number {
	// Base cost 100, increases by 15% per researcher
	return Math.floor(100 * Math.pow(1.15, player.researchers));
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

export function getGlobalProductionMultiplier(): number {
	return player.productionMultiplier;
}

export function setGlobalProductionMultiplier(value: number): void {
	player.productionMultiplier = Math.max(0, value);
}

export function resetGameState(): number {
	const bonus = player.balance / 1000000;
	player.productionMultiplier += bonus;

	player.balance = 0;
	player.research = 0;

	// Clear auto-sell records
	for (const key in autoSellEnabled) {
		delete autoSellEnabled[key as ResourceType];
	}
	for (const key in autoSellAmount) {
		delete autoSellAmount[key as ResourceType];
	}

	return bonus;
}
