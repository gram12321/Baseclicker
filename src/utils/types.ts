export enum ResourceType {
      Wood = 'Wood',
      Stone = 'Stone',
      Iron = 'Iron',
      Grain = 'Grain',
      Sugar = 'Sugar',
      // Add more resource types as needed
}

export enum BuildingType {
      Forestry = 'Forestry',
      Quarry = 'Quarry',
      Mine = 'Mine',
      Farm = 'Farm',
      // Add more building types as needed
}

export enum RecipeName {
      HarvestWood = 'Harvest Wood',
      QuarryStone = 'Quarry Stone',
      SmeltIron = 'Smelt Iron',
      GrowGrain = 'Grow Grain',
      GrowSugar = 'Grow Sugar',
      // Add more recipe names as needed
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
