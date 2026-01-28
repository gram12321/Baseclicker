
import { ALL_ACHIEVEMENTS } from './constants';
import { AchievementConfig, AchievementStatus } from './types';
import { getBalance, getResearch, getResearchers, getGlobalProductionMultiplier } from '../gameState';
import { Inventory } from '../inventory';
import { ResourceType } from '../utils/types';
import { resources } from '../resources/resourcesRegistry';

const STORAGE_KEY = 'baseclicker_achievements';

class AchievementService {
      private unlockedIds: Set<string> = new Set();
      private inventory: Inventory | null = null;

      constructor() {
            this.load();
      }

      private load() {
            try {
                  if (typeof localStorage !== 'undefined') {
                        const saved = localStorage.getItem(STORAGE_KEY);
                        if (saved) {
                              const ids = JSON.parse(saved);
                              this.unlockedIds = new Set(ids);
                        }
                  }
                  this.refreshResourceModifiers();
            } catch (e) {
                  console.error('Failed to load achievements', e);
            }
      }

      public setInventory(inventory: Inventory) {
            this.inventory = inventory;
      }

      private save() {
            if (typeof localStorage !== 'undefined') {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.unlockedIds)));
            }
      }

      public getStatus(achievementId: string): AchievementStatus {
            const config = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
            const unlocked = this.unlockedIds.has(achievementId);

            let progress = 0;
            if (config) {
                  progress = this.calculateProgress(config);
            }

            return {
                  id: achievementId,
                  unlocked,
                  progress
            };
      }

      public getAllStatuses(): (AchievementConfig & AchievementStatus)[] {
            return ALL_ACHIEVEMENTS.map(config => ({
                  ...config,
                  ...this.getStatus(config.id)
            }));
      }

      private calculateProgress(config: AchievementConfig): number {
            const { type, threshold } = config.condition;
            let currentValue = 0;

            switch (type) {
                  case 'balance':
                        currentValue = getBalance();
                        break;
                  case 'research':
                        currentValue = getResearch();
                        break;
                  case 'researchers':
                        currentValue = getResearchers();
                        break;
                  case 'multiplier':
                        currentValue = getGlobalProductionMultiplier();
                        break;
                  case 'resource_total':
                        if (this.inventory && config.condition.resource) {
                              currentValue = this.inventory.getLifetimeAmount(config.condition.resource as ResourceType);
                        }
                        break;
                  default:
                        currentValue = 0;
            }

            return Math.min(100, (currentValue / threshold) * 100);
      }

      public checkAchievements(): string[] {
            const newlyUnlocked: string[] = [];

            for (const config of ALL_ACHIEVEMENTS) {
                  if (this.unlockedIds.has(config.id)) continue;

                  const progress = this.calculateProgress(config);
                  if (progress >= 100) {
                        this.unlockedIds.add(config.id);
                        newlyUnlocked.push(config.name);
                  }
            }

            if (newlyUnlocked.length > 0) {
                  this.save();
                  this.refreshResourceModifiers();
            }
            return newlyUnlocked;
      }

      public getPriceMultiplier(resourceType: ResourceType): number {
            let totalMultiplier = 1.0;
            for (const config of ALL_ACHIEVEMENTS) {
                  if (this.unlockedIds.has(config.id) && config.reward && config.reward.resource === resourceType) {
                        // If we have multiple achievements for the same resource, we take the highest multiplier from each baseId?
                        // Or sum them up? 
                        // The way createTieredAchievements is written, it gives 1 + (level * bonus).
                        // Usually, you only count the HIGHEST level of a tiered achievement.
                        // But here they are different IDs.
                  }
            }

            // Simpler approach for now: find all unlocked rewards for this resource and multiply them?
            // Actually, for tiered achievements, we should probably only take the highest multiplier for each "group".
            // But let's see how they are structured. baseId is like 'wood_prod'.
            const groups: Record<string, number> = {};
            for (const config of ALL_ACHIEVEMENTS) {
                  if (this.unlockedIds.has(config.id) && config.reward && config.reward.resource === resourceType) {
                        const baseId = config.id.split('_tier_')[0];
                        groups[baseId] = Math.max(groups[baseId] || 1.0, config.reward.multiplier);
                  }
            }

            for (const mult of Object.values(groups)) {
                  totalMultiplier *= mult;
            }

            return totalMultiplier;
      }

      public refreshResourceModifiers() {
            for (const resourceType of Object.values(ResourceType)) {
                  const r = resources[resourceType];
                  if (r) {
                        r.priceModifier = this.getPriceMultiplier(resourceType);
                  }
            }
      }

      public reset() {
            this.unlockedIds.clear();
            this.save();
      }
}

export const achievementService = new AchievementService();
