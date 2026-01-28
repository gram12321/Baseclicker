export enum ResourceType {
      Wood = 'Wood',
      Stone = 'Stone',
      Iron = 'Iron',
      Grain = 'Grain',
      Sugar = 'Sugar',
}

export enum BuildingType {
      Forestry = 'Forestry',
      Quarry = 'Quarry',
      Mine = 'Mine',
      Farm = 'Farm',
}

export enum RecipeName {
      HarvestWood = 'Harvest Wood',
      QuarryStone = 'Quarry Stone',
      SmeltIron = 'Smelt Iron',
      GrowGrain = 'Grow Grain',
      GrowSugar = 'Grow Sugar',
}

export interface RecipeInput {
      resource: ResourceType;
      amount: number;
}

export interface Recipe {
      name: RecipeName;
      inputs: RecipeInput[];
      outputResource: ResourceType;
      outputAmount: number;
      workamount: number;
      researchCost: number;
}

export interface Player {
      balance: number;
      research: number;
      researchers: number;
      productionMultiplier: number;
}
