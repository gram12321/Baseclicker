// gameState.ts
// Simple global game state for balance and transactions

// Global game state: balance
let balance = 0;



export function addToBalance(amount: number): number {
	balance += amount;
	return balance;
}
