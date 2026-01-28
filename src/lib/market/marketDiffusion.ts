
import { ResourceType } from '../../utils/types';
import { resources } from '../resources/resourcesRegistry';
import {
      getLocalMarketSupply,
      getGlobalMarketSupply,
      getLocalMarketQuality,
      getGlobalMarketQuality,
      addToLocalMarket,
      removeFromLocalMarket,
      addToGlobalMarket,
      removeFromGlobalMarket
} from './market';
import { mixQuality } from './market';

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
      const currentLocalQuality = getLocalMarketQuality(resourceType);
      const currentGlobalQuality = getGlobalMarketQuality(resourceType);

      const localPrice = resource.getLocalPrice(currentLocalSupply, currentLocalQuality);
      const globalPrice = resource.getGlobalPrice(currentGlobalSupply, currentGlobalQuality);

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
            if (result.direction === 'to-local') {
                  // Resources flowing from global (source) to local (target)
                  removeFromGlobalMarket(resourceType, result.amount);
                  addToLocalMarket(resourceType, result.amount, currentGlobalQuality);
            } else {
                  // Resources flowing from local (source) to global (target) (amount is negative)
                  const absAmount = Math.abs(result.amount);
                  removeFromLocalMarket(resourceType, absAmount);
                  addToGlobalMarket(resourceType, absAmount, currentLocalQuality);
            }
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
