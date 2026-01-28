import { ResourceType } from './types';

export const RESOURCE_ICONS: Record<ResourceType, string> = {
      [ResourceType.Wood]: '🪵',
      [ResourceType.Stone]: '🪨',
      [ResourceType.Iron]: '⛓️', // Changed from ⚙️/gear to match standard ⛓️/chains or similar metal icon often used for iron in these games
      [ResourceType.Grain]: '🌾',
      [ResourceType.Sugar]: '🍬',
};

export function getResourceIcon(type: ResourceType): string {
      return RESOURCE_ICONS[type] || '📦';
}
