import { Recipe, RecipeName, ResourceType } from '../../utils/types';

export const HarvestWood: Recipe = {
      name: RecipeName.HarvestWood,
      inputs: [],
      outputResource: ResourceType.Wood,
      outputAmount: 1,
      workamount: 1,
      researchCost: 0,
};

export const QuarryStone: Recipe = {
      name: RecipeName.QuarryStone,
      inputs: [],
      outputResource: ResourceType.Stone,
      outputAmount: 1,
      workamount: 1,
      researchCost: 10,
};

export const SmeltIron: Recipe = {
      name: RecipeName.SmeltIron,
      inputs: [
            { resource: ResourceType.Stone, amount: 2 },
      ],
      outputResource: ResourceType.Iron,
      outputAmount: 1,
      workamount: 2,
      researchCost: 50,
};

export const GrowGrain: Recipe = {
      name: RecipeName.GrowGrain,
      inputs: [],
      outputResource: ResourceType.Grain,
      outputAmount: 1,
      workamount: 5,
      researchCost: 5,
};

export const GrowSugar: Recipe = {
      name: RecipeName.GrowSugar,
      inputs: [],
      outputResource: ResourceType.Sugar,
      outputAmount: 1,
      workamount: 3,
      researchCost: 10,
};

export const BakeBread: Recipe = {
      name: RecipeName.BakeBread,
      inputs: [
            { resource: ResourceType.Grain, amount: 2 },
      ],
      outputResource: ResourceType.Bread,
      outputAmount: 1,
      workamount: 10,
      researchCost: 100,
};

export const BakeCake: Recipe = {
      name: RecipeName.BakeCake,
      inputs: [
            { resource: ResourceType.Grain, amount: 1 },
            { resource: ResourceType.Sugar, amount: 0.5 },
      ],
      outputResource: ResourceType.Cake,
      outputAmount: 1,
      workamount: 15,
      researchCost: 250,
};


export const ALL_RECIPES = {
      [RecipeName.HarvestWood]: HarvestWood,
      [RecipeName.QuarryStone]: QuarryStone,
      [RecipeName.SmeltIron]: SmeltIron,
      [RecipeName.GrowGrain]: GrowGrain,
      [RecipeName.GrowSugar]: GrowSugar,
      [RecipeName.BakeBread]: BakeBread,
      [RecipeName.BakeCake]: BakeCake,
};
