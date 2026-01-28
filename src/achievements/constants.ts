
import { AchievementConfig, AchievementCategory } from './types';
import { ResourceType } from '../utils/types';
import { RESOURCE_ICONS } from '../utils/resourceIcons';

function toRoman(num: number): string {
      if (num > 10) return num.toString();
      const lookup: Record<string, number> = { X: 10, IX: 9, V: 5, IV: 4, I: 1 };
      let roman = '';
      for (const i in lookup) {
            while (num >= lookup[i]) {
                  roman += i;
                  num -= lookup[i];
            }
      }
      return roman;
}

export function createTieredAchievements(
      baseId: string,
      baseName: string,
      baseDescription: string,
      icon: string,
      category: AchievementCategory,
      conditionType: string,
      thresholds: number[],
      resource?: string,
      rewardMultiplierPerTier?: number
): AchievementConfig[] {
      return thresholds.map((threshold, index) => {
            const level = index + 1;
            const config: AchievementConfig = {
                  id: `${baseId}_tier_${level}`,
                  name: `${baseName} ${toRoman(level)}`,
                  description: baseDescription.replace('{threshold}', threshold.toLocaleString()),
                  icon,
                  category,
                  level,
                  condition: {
                        type: conditionType,
                        threshold,
                        resource
                  }
            };

            if (rewardMultiplierPerTier && resource) {
                  config.reward = {
                        resource,
                        multiplier: 1 + (level * rewardMultiplierPerTier)
                  };
            }

            return config;
      });
}

function generateThresholds(base: number, count: number): number[] {
      const thresholds = [];
      for (let i = 0; i < count; i++) {
            thresholds.push(base * Math.pow(10, i));
      }
      return thresholds;
}

export const WEALTH_ACHIEVEMENTS = createTieredAchievements(
      'wealth',
      'Capitalist',
      'Accumulate {threshold} credits',
      '💰',
      'Wealth',
      'balance',
      generateThresholds(1000, 15)
);

export const KNOWLEDGE_ACHIEVEMENTS = createTieredAchievements(
      'knowledge',
      'Thinker',
      'Generate {threshold} research points',
      '🔬',
      'Knowledge',
      'research',
      generateThresholds(100, 15)
);

export const PRODUCTIVITY_ACHIEVEMENTS = createTieredAchievements(
      'productivity',
      'Efficiency Expert',
      'Achieve a production multiplier of {threshold}x',
      '⚡',
      'Productivity',
      'multiplier',
      [1.5, 2, 5, 10, 50]
);

export const LABOR_ACHIEVEMENTS = createTieredAchievements(
      'labor',
      'Resource Manager',
      'Hire {threshold} researchers',
      '👨‍🔬',
      'Productivity',
      'researchers',
      [5, 10, 25, 50, 100]
);

export const WOOD_PRODUCTION_ACHIEVEMENTS = createTieredAchievements(
      'wood_prod',
      'Lumberjack',
      'Produce {threshold} Wood in total',
      RESOURCE_ICONS[ResourceType.Wood],
      'Resources',
      'resource_total',
      generateThresholds(100, 20),
      'Wood',
      0.05 // 5% price bonus per tier
);

export const IRON_PRODUCTION_ACHIEVEMENTS = createTieredAchievements(
      'iron_prod',
      'Blacksmith',
      'Produce {threshold} Iron in total',
      RESOURCE_ICONS[ResourceType.Iron],
      'Resources',
      'resource_total',
      generateThresholds(100, 20),
      'Iron',
      0.05 // 5% price bonus per tier
);

export const STONE_PRODUCTION_ACHIEVEMENTS = createTieredAchievements(
      'stone_prod',
      'Mason',
      'Produce {threshold} Stone in total',
      RESOURCE_ICONS[ResourceType.Stone],
      'Resources',
      'resource_total',
      generateThresholds(100, 20),
      'Stone',
      0.05 // 5% price bonus per tier
);

export const GRAIN_PRODUCTION_ACHIEVEMENTS = createTieredAchievements(
      'grain_prod',
      'Harvester',
      'Produce {threshold} Grain in total',
      RESOURCE_ICONS[ResourceType.Grain],
      'Resources',
      'resource_total',
      generateThresholds(100, 20),
      'Grain',
      0.05 // 5% price bonus per tier
);

export const ALL_ACHIEVEMENTS: AchievementConfig[] = [
      ...WEALTH_ACHIEVEMENTS,
      ...KNOWLEDGE_ACHIEVEMENTS,
      ...PRODUCTIVITY_ACHIEVEMENTS,
      ...LABOR_ACHIEVEMENTS,
      ...WOOD_PRODUCTION_ACHIEVEMENTS,
      ...IRON_PRODUCTION_ACHIEVEMENTS,
      ...STONE_PRODUCTION_ACHIEVEMENTS,
      ...GRAIN_PRODUCTION_ACHIEVEMENTS
];
