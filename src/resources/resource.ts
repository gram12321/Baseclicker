import { ResourceType, Recipe, RecipeInput } from '../types';


export class Resource {
  type: ResourceType;
  name: string;
  localbenchmarksupply: number;
  localinitsupply: number;
  globalbenchmarksupply: number;
  globalinitsupply: number;
  productionMultiplier: number;
  productionUpgradeLevel: number;
  productionStartCost: number;
  productionResearchCost: number;
  productionBuilt: boolean;
  productionResearched: boolean;
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
    productionMultiplier: number = 1,
    productionUpgradeLevel: number = 0,
    productionStartCost: number = 0,
    productionResearchCost: number = 0,
    productionBuilt: boolean = false,
    productionResearched: boolean = false
  ) {
    this.type = type;
    this.name = name;
    this.localbenchmarksupply = localbenchmarksupply;
    this.localinitsupply = localinitsupply;
    this.globalbenchmarksupply = globalbenchmarksupply;
    this.globalinitsupply = globalinitsupply;
    this.productionMultiplier = productionMultiplier;
    this.productionUpgradeLevel = productionUpgradeLevel;
    this.productionStartCost = productionStartCost;
    this.productionResearchCost = productionResearchCost;
    this.productionBuilt = productionBuilt;
    this.productionResearched = productionResearched;
    this.priceModifier = 1.0;
    // Ensure runtime progress field exists on the recipe for persistence
    if (recipe.workamountCompleted === undefined) {
      recipe.workamountCompleted = 0;
    }
    this.recipe = recipe;
  }

  reset(): void {
    this.productionMultiplier = 1;
    this.productionUpgradeLevel = 0;
    this.productionBuilt = false;
    this.productionResearched = false;
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
