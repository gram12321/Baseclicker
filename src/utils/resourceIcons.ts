import { ResourceType } from './types';

export const RESOURCE_ICONS: Record<ResourceType, string> = {
      [ResourceType.Wood]: '🪵',
      [ResourceType.Stone]: '🪨',
      [ResourceType.Iron]: '⛓️',
      [ResourceType.Grain]: '🌾',
      [ResourceType.Sugar]: '🍬',
};

export function getResourceIcon(type: ResourceType): string {
      return RESOURCE_ICONS[type] || '📦';
}
