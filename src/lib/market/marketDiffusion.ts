
import { ResourceType } from '../../utils/types';
import { resources } from '../resources/resourcesRegistry';
import { getLocalMarketSupply, getGlobalMarketSupply, updateMarketSupplies } from './market';

export type DiffusionDirection = 'to-local' | 'to-global' | 'none';

export interface DiffusionInfo {
      direction: DiffusionDirection;
      amount: number;
      priceRatio: number;
      localPrice: number;
      globalPrice: number;
}

function processDiffusionForResource(
      resourceType: ResourceType,
      applyChanges: boolean = true
): DiffusionInfo {
      const resource = resources[resourceType];
      const currentLocalSupply = getLocalMarketSupply(resourceType);
      const currentGlobalSupply = getGlobalMarketSupply(resourceType);

      const localPrice = resource.getLocalPrice(currentLocalSupply);
      const globalPrice = resource.getGlobalPrice(currentGlobalSupply);

      const result: DiffusionInfo = {
            direction: 'none',
            amount: 0,
            priceRatio: 1,
            localPrice,
            globalPrice
      };

      if (localPrice === 0 || globalPrice === 0) {
            return result;
      }

      const priceRatio = localPrice / globalPrice;
      result.priceRatio = priceRatio;

      let calculatedAmount = 0;

      // Base the diffusion amount on the initial local supply magnitude (stable baseline)
      // This matches the old logic: (resource.initLocalSupply / 1000)
      const diffusionBase = resource.localinitsupply / 1000;

      if (localPrice > globalPrice) {
            result.direction = 'to-local';
            // Price is higher locally, resources flow in from global
            calculatedAmount = (priceRatio - 1) * diffusionBase;
      } else if (localPrice < globalPrice) {
            result.direction = 'to-global';
            // Price is lower locally, resources flow out to global
            calculatedAmount = -((1 - priceRatio) * diffusionBase);
      } else {
            return result;
      }

      result.amount = calculatedAmount;

      if (applyChanges && result.amount !== 0) {
            let localChange = 0;
            let globalChange = 0;

            // Quality Placeholders
            // const currentLocalQuality = 1.0; // Placeholder: resource.localMarketQuality
            // const currentGlobalQuality = 1.0; // Placeholder: globalMarketData.globalMarketQuality

            if (result.direction === 'to-local') {
                  // Resources flowing from global to local
                  localChange = result.amount;
                  globalChange = -result.amount;

                  // Placeholder for Quality Mixing Logic:
                  // newLocalQuality = mixQuality(
                  //   currentLocalSupply, currentLocalQuality,
                  //   result.amount, currentGlobalQuality
                  // );
                  // newGlobalQuality = currentGlobalQuality;
            } else {
                  // Resources flowing from local to global (amount is negative)
                  const absAmount = Math.abs(result.amount);
                  localChange = -absAmount;
                  globalChange = absAmount;

                  // Placeholder for Quality Mixing Logic:
                  // newGlobalQuality = mixQuality(
                  //   currentGlobalSupply, currentGlobalQuality,
                  //   absAmount, currentLocalQuality
                  // );
                  // newLocalQuality = currentLocalQuality;
            }

            // Apply changes
            updateMarketSupplies(resourceType, localChange, globalChange);

            // Update Quality (Placeholder)
            // updateResourceQuality(resourceType, newLocalQuality, newGlobalQuality);
      }

      return result;
}

export function processMarketDiffusion() {
      for (const resourceType of Object.values(ResourceType)) {
            processDiffusionForResource(resourceType, true);
      }
}

export function getDiffusionInfo(resourceType: ResourceType): DiffusionInfo {
      return processDiffusionForResource(resourceType, false);
}
