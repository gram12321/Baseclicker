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

export interface Player {
      balance: number;
      research: number;
      researchers: number;
}
