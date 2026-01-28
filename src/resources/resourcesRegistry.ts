import { Resource } from './resource';
import { ResourceType, Recipe, RecipeName } from '../types';

// Example recipes
const woodRecipe: Recipe = {
  name: RecipeName.HarvestWood,
  inputs: [], // Wood is a base resource, no input required
  outputResource: ResourceType.Wood,
  outputAmount: 1,
  workamount: 1,
  active: false,
  workamountCompleted: 0,
  researchCost: 0,
};

const stoneRecipe: Recipe = {
  name: RecipeName.QuarryStone,
  inputs: [], // Stone is a base resource, no input required
  outputResource: ResourceType.Stone,
  outputAmount: 1,
  workamount: 1,
  active: false,
  workamountCompleted: 0,
  researchCost: 10,
};

const ironRecipe: Recipe = {
  name: RecipeName.SmeltIron,
  inputs: [
    { resource: ResourceType.Stone, amount: 2 },
  ],
  outputResource: ResourceType.Iron,
  outputAmount: 1,
  workamount: 2,
  active: false,
  workamountCompleted: 0,
  researchCost: 50,
};

const grainRecipe: Recipe = {
  name: RecipeName.GrowGrain,
  inputs: [], // Grain is a base resource, no input required
  outputResource: ResourceType.Grain,
  outputAmount: 1,
  workamount: 5,
  active: false,
  workamountCompleted: 0,
  researchCost: 5,
};

const sugarRecipe: Recipe = {
  name: RecipeName.GrowSugar,
  inputs: [], // Sugar is a base resource, no input required
  outputResource: ResourceType.Sugar,
  outputAmount: 1,
  workamount: 3,
  active: false,
  workamountCompleted: 0,
  researchCost: 0,
};

export { grainRecipe, sugarRecipe };

// Resource instances
export const resources = {
  [ResourceType.Wood]: new Resource(ResourceType.Wood, 'Forestry', 10000, 10000, 100000, 100000, woodRecipe, false),
  [ResourceType.Stone]: new Resource(ResourceType.Stone, 'Quarry', 10000, 2000, 100000, 20000, stoneRecipe, false),
  [ResourceType.Iron]: new Resource(ResourceType.Iron, 'Mine', 10000, 5000, 100000, 50000, ironRecipe, false),
  [ResourceType.Grain]: new Resource(ResourceType.Grain, 'Farm', 10000, 10000, 100000, 100000, grainRecipe, false),
  [ResourceType.Sugar]: new Resource(ResourceType.Sugar, 'Farm', 10000, 10000, 100000, 100000, sugarRecipe, false),
};

export function resetResources(): void {
  for (const resource of Object.values(resources)) {
    resource.reset();
  }
}
