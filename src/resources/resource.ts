import { ResourceType, Recipe, RecipeInput } from '../types';


export class Resource {
  type: ResourceType;
  name: string;
  localbenchmarksupply: number;
  localinitsupply: number;
  globalbenchmarksupply: number;
  globalinitsupply: number;
  recipeResearched: boolean;
  priceModifier: number;
  recipe: Recipe;

  constructor(
    type: ResourceType,
    name: string,
    localbenchmarksupply: number,
    localinitsupply: number,
    globalbenchmarksupply: number,
    globalinitsupply: number,
    recipe: Recipe,
    recipeResearched: boolean = false
  ) {
    this.type = type;
    this.name = name;
    this.localbenchmarksupply = localbenchmarksupply;
    this.localinitsupply = localinitsupply;
    this.globalbenchmarksupply = globalbenchmarksupply;
    this.globalinitsupply = globalinitsupply;
    this.recipeResearched = recipeResearched;
    this.priceModifier = 1.0;
    // Ensure runtime progress field exists on the recipe for persistence
    if (recipe.workamountCompleted === undefined) {
      recipe.workamountCompleted = 0;
    }
    this.recipe = recipe;
  }

  reset(): void {
    this.recipeResearched = false;
    // Note: priceModifier is specifically NOT reset here as per requirements
    if (this.recipe) {
      this.recipe.active = false;
      this.recipe.workamountCompleted = 0;
    }
  }

  // Calculate current local price based on supply vs. local benchmark supply.
  getLocalPrice(currentSupply: number = this.localinitsupply, modifiers: number[] = []): number {
    let price = (this.localbenchmarksupply / Math.max(currentSupply, 1)) * this.priceModifier;
    for (const mod of modifiers) {
      price *= mod;
    }
    return price;
  }

  // Calculate current global price based on supply vs. global benchmark supply.
  getGlobalPrice(currentSupply: number = this.globalinitsupply, modifiers: number[] = []): number {
    let price = (this.globalbenchmarksupply / Math.max(currentSupply, 1)) * this.priceModifier;
    for (const mod of modifiers) {
      price *= mod;
    }
    return price;
  }
}
