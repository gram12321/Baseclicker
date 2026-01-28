import { Resource } from './resource';
import { ResourceType } from '../../utils/types';

// Resource instances
export const resources = {
  [ResourceType.Wood]: new Resource(ResourceType.Wood, 'Wood', 10000, 10000, 100000, 100000),
  [ResourceType.Stone]: new Resource(ResourceType.Stone, 'Stone', 10000, 2000, 100000, 20000),
  [ResourceType.Iron]: new Resource(ResourceType.Iron, 'Iron', 10000, 5000, 100000, 50000),
  [ResourceType.Grain]: new Resource(ResourceType.Grain, 'Grain', 10000, 10000, 100000, 100000),
  [ResourceType.Sugar]: new Resource(ResourceType.Sugar, 'Sugar', 10000, 10000, 100000, 100000),
};

export function resetResources(): void {
  for (const resource of Object.values(resources)) {
    resource.reset();
  }
}
