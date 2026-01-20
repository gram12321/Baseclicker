// Resource.ts
// Basic resource class and recipe interface for clicker game mechanics


export enum ResourceType {
  Wood = 'Wood',
  Stone = 'Stone',
  Iron = 'Iron',
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
  basePrice: number;
  recipe: Recipe;

  constructor(type: ResourceType, name: string, basePrice: number, recipe: Recipe) {
    this.type = type;
    this.name = name;
    this.basePrice = basePrice;
    // Ensure runtime progress field exists on the recipe for persistence
    if (recipe.workamountCompleted === undefined) {
      recipe.workamountCompleted = 0;
    }
    this.recipe = recipe;
  }

  // Calculate current price (can be extended with modifiers)
  getCurrentPrice(modifiers: number[] = []): number {
    let price = this.basePrice;
    for (const mod of modifiers) {
      price *= mod;
    }
    return price;
  }
}
