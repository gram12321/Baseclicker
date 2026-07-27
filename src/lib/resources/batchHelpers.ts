import { ResourceType, BatchComposition, Recipe, RecipeName } from '../../utils/types';
import { Inventory } from '../inventory';
import { getTechLevel } from '../game/technology';

/**
 * Creates the hidden composition for a newly mined ore batch. The composition
 * is generated once and remains attached to that batch until it is smelted.
 */
export function createOreBatchComposition(recipeName: RecipeName): BatchComposition {
      switch (recipeName) {
            case RecipeName.MineIronOre:
                  return {
                        oreType: 'IronOre',
                        yields: {
                              [ResourceType.Iron]: 1.0 + (Math.random() * 0.4 - 0.2),
                              [ResourceType.Slag]: 0.5 + (Math.random() * 0.4 - 0.2),
                        },
                  };
            default:
                  throw new Error(`No ore batch composition defined for ${recipeName}`);
      }
}

/** Adds newly mined ore batches with their fixed, recipe-specific composition. */
export function produceOreBatch(
      inventory: Inventory,
      recipeName: RecipeName,
      amount: number,
      quality: number,
): void {
      for (let batchNumber = 0; batchNumber < amount; batchNumber += 1) {
            inventory.addBatch(
                  ResourceType.OreBatch,
                  1,
                  quality,
                  createOreBatchComposition(recipeName),
            );
      }
}

/** Check if a recipe involves batch inputs. */
export function hasBatchInput(recipe: Recipe): boolean {
      return recipe.inputs.some(input => isBatchResource(input.resource));
}

/**
 * Process outputs when a batch was consumed (e.g. smelting).
 */
export function processBatchOutput(
      inventory: Inventory,
      composition: BatchComposition,
      productionQuality: number,
      inputQualityCap: number
): void {
      for (const [resourceType, yieldAmount] of Object.entries(composition.yields)) {
            const resType = resourceType as ResourceType;
            const resTechLevel = getTechLevel(resType);
            const resQuality = Math.min(
                  productionQuality,
                  resTechLevel,
                  inputQualityCap
            );

            inventory.add(resType, yieldAmount as number, resQuality);
      }
}
/**
 * Check if a resource type is handled as a batch.
 */
export function isBatchResource(resource: ResourceType): boolean {
      return resource === ResourceType.OreBatch;
}

/**
 * Consume an input resource (batch or standard) and return its quality/composition data.
 */
export function consumeInput(
      inventory: Inventory,
      resource: ResourceType,
      amount: number
): { quality: number, composition: BatchComposition | null } {
      if (isBatchResource(resource)) {
            const batch = inventory.removeBatch(resource, amount);
            if (batch) {
                  return {
                        quality: batch.quality,
                        composition: batch.composition ?? null,
                  };
            }
            throw new Error(`Unable to consume ${amount} ${resource} from inventory batches`);
      } else {
            const quality = inventory.getQuality(resource);
            inventory.remove(resource, amount);
            return { quality, composition: null };
      }
}
