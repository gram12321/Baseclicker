export enum ResourceType {
  Wood = 'Wood',
  Stone = 'Stone',
  Iron = 'Iron',
  Grain = 'Grain',
  // Add more resource types as needed
}

export interface RecipeInput {
  resource: ResourceType;
  amount: number;
}

export interface Recipe {
  inputs: RecipeInput[];
  outputResource: ResourceType;
  outputAmount: number;
  workamount: number;
  active: boolean;
  workamountCompleted?: number;
}

export class Resource {
  type: ResourceType;
  name: string;
  marketEquilibrium: number;
  initialSupply: number;
  productionMultiplier: number;
  productionUpgradeLevel: number;
  productionStartCost: number;
  productionBuilt: boolean;
  recipe: Recipe;

  constructor(
    type: ResourceType,
    name: string,
    marketEquilibrium: number,
    initialSupply: number,
    recipe: Recipe,
    productionMultiplier: number = 1,
    productionUpgradeLevel: number = 0,
    productionStartCost: number = 0,
    productionBuilt: boolean = false
  ) {
    this.type = type;
    this.name = name;
    this.marketEquilibrium = marketEquilibrium;
    this.initialSupply = initialSupply;
    this.productionMultiplier = productionMultiplier;
    this.productionUpgradeLevel = productionUpgradeLevel;
    this.productionStartCost = productionStartCost;
    this.productionBuilt = productionBuilt;
    // Ensure runtime progress field exists on the recipe for persistence
    if (recipe.workamountCompleted === undefined) {
      recipe.workamountCompleted = 0;
    }
    this.recipe = recipe;
  }

  // Calculate current price based on supply vs. market equilibrium.
  getCurrentPrice(currentSupply: number = this.initialSupply, modifiers: number[] = []): number {
    let price = this.marketEquilibrium / Math.max(currentSupply, 1);
    for (const mod of modifiers) {
      price *= mod;
    }
    return price;
  }
}
