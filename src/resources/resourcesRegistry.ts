import { Resource } from './resource';
import { ResourceType, Recipe } from '../types';

// Example recipes
const woodRecipe: Recipe = {
  inputs: [], // Wood is a base resource, no input required
  outputResource: ResourceType.Wood,
  outputAmount: 1,
  workamount: 1,
  active: false,
  workamountCompleted: 0,
};

const stoneRecipe: Recipe = {
  inputs: [], // Stone is a base resource, no input required
  outputResource: ResourceType.Stone,
  outputAmount: 1,
  workamount: 1,
  active: false,
  workamountCompleted: 0,
};

const ironRecipe: Recipe = {
  inputs: [
    { resource: ResourceType.Stone, amount: 2 },
  ],
  outputResource: ResourceType.Iron,
  outputAmount: 1,
  workamount: 2,
  active: false,
  workamountCompleted: 0,
};

const grainRecipe: Recipe = {
  inputs: [], // Grain is a base resource, no input required
  outputResource: ResourceType.Grain,
  outputAmount: 1,
  workamount: 5,
  active: false,
  workamountCompleted: 0,
};

// Resource instances
export const resources = {
  [ResourceType.Wood]: new Resource(ResourceType.Wood, 'Wood', 10000, 10000, 100000, 100000, woodRecipe, 1, 0, 50, 0, false),
  [ResourceType.Stone]: new Resource(ResourceType.Stone, 'Stone', 10000, 2000, 100000, 20000, stoneRecipe, 1, 0, 75, 10, false),
  [ResourceType.Iron]: new Resource(ResourceType.Iron, 'Iron', 10000, 5000, 100000, 50000, ironRecipe, 1, 0, 150, 50, false),
  [ResourceType.Grain]: new Resource(ResourceType.Grain, 'Grain', 10000, 10000, 100000, 100000, grainRecipe, 1, 0, 60, 5, false),
};

export function resetResources(): void {
  for (const resource of Object.values(resources)) {
    resource.reset();
  }
}
