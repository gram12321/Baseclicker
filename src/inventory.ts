import { ResourceType } from './types';

export class Inventory {
  private amounts: Record<ResourceType, number>;

  constructor(initial?: Partial<Record<ResourceType, number>>) {
    this.amounts = {} as Record<ResourceType, number>;
    for (const r of Object.values(ResourceType)) {
      this.amounts[r] = initial?.[r] ?? 0;
    }
  }

  getAmount(resource: ResourceType): number {
    return this.amounts[resource] ?? 0;
  }

  has(resource: ResourceType, amount = 1): boolean {
    return this.getAmount(resource) >= amount;
  }

  add(resource: ResourceType, amount = 1): void {
    if (amount <= 0) return;
    this.amounts[resource] = this.getAmount(resource) + amount;
  }

  remove(resource: ResourceType, amount = 1): boolean {
    if (amount <= 0) return true;
    if (!this.has(resource, amount)) return false;
    this.amounts[resource] = this.getAmount(resource) - amount;
    return true;
  }

  clear(): void {
    for (const r of Object.values(ResourceType)) {
      this.amounts[r] = 0;
    }
  }


}
