import { ResourceType, RecipeName, BatchComposition } from '../../utils/types';
import { Inventory } from '../inventory';

/**
 * Helper functions for OreBatch production and consumption.
 */

/**
 * Produce an OreBatch with composition based on the mining recipe.
 */
export function produceOreBatch(
      inventory: Inventory,
      recipeName: RecipeName,
      amount: number,
      quality: number
): void {
      const composition = generateBatchComposition(recipeName);
      const batchQuality = calculateBatchQuality(composition);

      inventory.addBatch(
            ResourceType.OreBatch,
            amount,
            Math.min(quality, batchQuality),
            composition
      );
}

/**
 * Consume an OreBatch and produce outputs based on its composition.
 */
export function consumeOreBatch(
      inventory: Inventory,
      amount: number,
      outputQuality: number
): boolean {
      const batch = inventory.removeBatch(ResourceType.OreBatch, amount);

      if (!batch || !batch.composition) {
            return false;
      }

      // Produce outputs based on batch composition
      if (batch.composition.yields) {
            for (const [resourceType, yieldAmount] of Object.entries(batch.composition.yields)) {
                  inventory.add(resourceType as ResourceType, yieldAmount, outputQuality);
            }
      }

      return true;
}

/**
 * Generate batch composition based on mining recipe.
 */
function generateBatchComposition(recipeName: RecipeName): BatchComposition {
      // Iron Ore composition (Fe: 60-70%, Slag: 30-40%)
      if (recipeName === RecipeName.MineIronOre) {
            const ironYield = 1.0 + (Math.random() * 0.4 - 0.2);  // 0.8 - 1.2
            const slagYield = 0.5 + (Math.random() * 0.4 - 0.2);  // 0.3 - 0.7

            return {
                  oreType: 'IronOre',
                  yields: {
                        [ResourceType.Iron]: ironYield,
                        [ResourceType.Slag]: slagYield
                  }
            };
      }

      // Default fallback
      return {
            oreType: 'Unknown',
            yields: {}
      };
}

/**
 * Calculate quality from batch composition (average of yields).
 */
function calculateBatchQuality(composition: BatchComposition): number {
      if (!composition || !composition.yields) return 1.0;

      const yields = Object.values(composition.yields) as number[];
      if (yields.length === 0) return 1.0;

      const sum = yields.reduce((a, b) => a + b, 0);
      return sum / yields.length;
}
