// resourcesRegistry.ts
// Example resource definitions and registry
import { Resource, ResourceType, Recipe } from './resource';

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
  [ResourceType.Wood]: new Resource(ResourceType.Wood, 'Wood', 1, woodRecipe),
  [ResourceType.Stone]: new Resource(ResourceType.Stone, 'Stone', 2, stoneRecipe),
  [ResourceType.Iron]: new Resource(ResourceType.Iron, 'Iron', 5, ironRecipe),
  [ResourceType.Grain]: new Resource(ResourceType.Grain, 'Grain', 1, grainRecipe),
};
