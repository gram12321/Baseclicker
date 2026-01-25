
export type AchievementCategory = 'Wealth' | 'Knowledge' | 'Productivity' | 'Resources' | 'Infrastructure';

export type AchievementLevel = number;

export interface AchievementCondition {
      type: string;
      threshold: number;
      resource?: string;
}

export interface AchievementConfig {
      id: string;
      name: string;
      description: string;
      icon: string;
      category: AchievementCategory;
      level: AchievementLevel;
      condition: AchievementCondition;
      reward?: {
            resource?: string;
            multiplier: number;
      };
}

export interface AchievementStatus {
      id: string;
      unlocked: boolean;
      unlockedAt?: number;
      progress: number;
}
