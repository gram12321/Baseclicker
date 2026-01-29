import { ResourceType, ResourceBatch, BatchComposition } from '../utils/types';
import { mixQuality } from './market/market';

export class Inventory {
  private amounts: Record<ResourceType, number>;
  private qualities: Record<ResourceType, number>;
  private lifetimeTotals: Record<ResourceType, number>;

  // Batch tracking: FIFO queue of batches per resource type
  private batches: Map<ResourceType, ResourceBatch[]>;
  private nextBatchId: number = 0;

  constructor(initial?: Partial<Record<ResourceType, number>>) {
    this.amounts = {} as Record<ResourceType, number>;
    this.qualities = {} as Record<ResourceType, number>;
    this.lifetimeTotals = {} as Record<ResourceType, number>;
    this.batches = new Map();

    for (const r of Object.values(ResourceType)) {
      this.amounts[r] = initial?.[r] ?? 0;
      this.qualities[r] = 1.0; // Default quality
      this.lifetimeTotals[r] = initial?.[r] ?? 0;
      this.batches.set(r, []);
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

    // Special handling for OreBatch - always create with composition
    if (resource === ResourceType.OreBatch) {
      // Generate composition based on quality (market batches use quality as yield indicator)
      const composition: BatchComposition = {
        oreType: 'IronOre',
        yields: {
          [ResourceType.Iron]: 1.0 + (Math.random() * 0.4 - 0.2),  // 0.8 - 1.2
          [ResourceType.Slag]: 0.5 + (Math.random() * 0.4 - 0.2)   // 0.3 - 0.7
        }
      };

      // Use addBatch instead of regular add
      this.addBatch(resource, amount, quality, composition);
      return;
    }

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
      this.batches.set(r, []);
    }
  }

  // ==================== Batch Management ====================

  private generateBatchId(): string {
    return `batch_${this.nextBatchId++}_${Date.now()}`;
  }

  /**
   * Add a resource with batch composition tracking.
   * Used for resources like OreBatch that have hidden composition.
   */
  addBatch(
    resource: ResourceType,
    amount: number,
    quality: number,
    composition?: BatchComposition
  ): void {
    if (amount <= 0) return;

    // Update totals using regular add method
    this.add(resource, amount, quality);

    // Create and store batch
    const batch: ResourceBatch = {
      batchId: this.generateBatchId(),
      resourceType: resource,
      amount,
      quality,
      composition
    };

    const batchQueue = this.batches.get(resource) || [];
    batchQueue.push(batch);
    this.batches.set(resource, batchQueue);
  }

  /**
   * Remove and return a batch (FIFO).
   * Returns null if not enough resources or no batches available.
   */
  removeBatch(resource: ResourceType, amount: number): ResourceBatch | null {
    if (!this.has(resource, amount)) return null;

    const batchQueue = this.batches.get(resource) || [];

    if (batchQueue.length === 0) {
      // No batches tracked - this is an orphaned OreBatch (from old system or market)
      // Generate a random composition for it
      if (this.remove(resource, amount)) {
        const composition: BatchComposition | undefined = resource === ResourceType.OreBatch ? {
          oreType: 'IronOre',
          yields: {
            [ResourceType.Iron]: 1.0 + (Math.random() * 0.4 - 0.2),  // 0.8 - 1.2
            [ResourceType.Slag]: 0.5 + (Math.random() * 0.4 - 0.2)   // 0.3 - 0.7
          }
        } : undefined;

        return {
          batchId: this.generateBatchId(),
          resourceType: resource,
          amount,
          quality: this.getQuality(resource),
          composition
        };
      }
      return null;
    }

    // FIFO: take from the oldest batch
    const oldestBatch = batchQueue[0];

    if (oldestBatch.amount >= amount) {
      // Enough in this batch
      oldestBatch.amount -= amount;
      this.remove(resource, amount);

      const result: ResourceBatch = {
        ...oldestBatch,
        amount
      };

      // Remove batch if depleted
      if (oldestBatch.amount <= 0) {
        batchQueue.shift();
      }

      return result;
    } else {
      // Need to consume multiple batches - for now, just take from first batch
      // This is a simplified implementation
      const availableAmount = oldestBatch.amount;
      this.remove(resource, availableAmount);
      const result = { ...oldestBatch };
      batchQueue.shift();
      return result;
    }
  }

  /**
   * Peek at the next batch without removing it.
   */
  peekBatch(resource: ResourceType): ResourceBatch | null {
    const batchQueue = this.batches.get(resource) || [];
    return batchQueue.length > 0 ? { ...batchQueue[0] } : null;
  }

  /**
   * Get all batches for a resource (for debugging/display).
   */
  getBatches(resource: ResourceType): ResourceBatch[] {
    return [...(this.batches.get(resource) || [])];
  }

}
