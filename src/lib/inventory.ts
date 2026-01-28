import { ResourceType } from '../utils/types';
import { mixQuality } from './market/market';

export class Inventory {
  private amounts: Record<ResourceType, number>;
  private qualities: Record<ResourceType, number>;
  private lifetimeTotals: Record<ResourceType, number>;

  constructor(initial?: Partial<Record<ResourceType, number>>) {
    this.amounts = {} as Record<ResourceType, number>;
    this.qualities = {} as Record<ResourceType, number>;
    this.lifetimeTotals = {} as Record<ResourceType, number>;
    for (const r of Object.values(ResourceType)) {
      this.amounts[r] = initial?.[r] ?? 0;
      this.qualities[r] = 1.0; // Default quality
      this.lifetimeTotals[r] = initial?.[r] ?? 0;
    }
  }

  getAmount(resource: ResourceType): number {
    return this.amounts[resource] ?? 0;
  }

  getQuality(resource: ResourceType): number {
    return this.qualities[resource] ?? 1.0;
  }

  has(resource: ResourceType, amount = 1): boolean {
    return this.getAmount(resource) >= amount;
  }

  add(resource: ResourceType, amount = 1, quality = 1.0): void {
    if (amount <= 0) return;

    // Mix quality before updating amount
    const currentAmount = this.getAmount(resource);
    const currentQuality = this.getQuality(resource);

    this.qualities[resource] = mixQuality(currentAmount, currentQuality, amount, quality);
    this.amounts[resource] = currentAmount + amount;
    this.lifetimeTotals[resource] = (this.lifetimeTotals[resource] ?? 0) + amount;
  }

  getLifetimeAmount(resource: ResourceType): number {
    return this.lifetimeTotals[resource] ?? 0;
  }

  remove(resource: ResourceType, amount = 1): boolean {
    if (amount <= 0) return true;
    if (!this.has(resource, amount)) return false;
    this.amounts[resource] = this.getAmount(resource) - amount;
    // Note: Quality doesn't change when removing resources (assumes removing average quality)
    return true;
  }

  clear(): void {
    for (const r of Object.values(ResourceType)) {
      this.amounts[r] = 0;
      this.qualities[r] = 1.0;
    }
  }


}
