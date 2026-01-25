import { ResourceType, Recipe, RecipeInput } from '../types';


export class Resource {
  type: ResourceType;
  name: string;
  marketEquilibrium: number;
  initialSupply: number;
  productionMultiplier: number;
  productionUpgradeLevel: number;
  productionStartCost: number;
  productionResearchCost: number;
  productionBuilt: boolean;
  productionResearched: boolean;
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
    productionResearchCost: number = 0,
    productionBuilt: boolean = false,
    productionResearched: boolean = false
  ) {
    this.type = type;
    this.name = name;
    this.marketEquilibrium = marketEquilibrium;
    this.initialSupply = initialSupply;
    this.productionMultiplier = productionMultiplier;
    this.productionUpgradeLevel = productionUpgradeLevel;
    this.productionStartCost = productionStartCost;
    this.productionResearchCost = productionResearchCost;
    this.productionBuilt = productionBuilt;
    this.productionResearched = productionResearched;
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
    if (this.recipe) {
      this.recipe.active = false;
      this.recipe.workamountCompleted = 0;
    }
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
