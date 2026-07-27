import { describe, it, expect, beforeEach } from 'vitest';
import { Inventory } from '../src/lib/inventory';
import { ResourceType } from '../src/utils/types';

describe('Inventory System', () => {
      let inventory: Inventory;

      beforeEach(() => {
            inventory = new Inventory();
      });

      it('should add normal resources correctly', () => {
            inventory.add(ResourceType.Wood, 100);
            expect(inventory.getAmount(ResourceType.Wood)).toBe(100);
      });

      it('should add OreBatch without infinite recursion', () => {
            // This test will hang/crash with "Maximum call stack size exceeded" if the recursion bug exists
            inventory.add(ResourceType.OreBatch, 10);

            expect(inventory.getAmount(ResourceType.OreBatch)).toBe(10);

            // Check if a batch was created
            const batches = inventory.getBatches(ResourceType.OreBatch);
            expect(batches.length).toBeGreaterThan(0);
            expect(batches[0].amount).toBe(10);
      });

      it('should addBatch OreBatch without infinite recursion', () => {
            // Direct call to addBatch
            inventory.addBatch(ResourceType.OreBatch, 5, 1.0, { oreType: 'Test', yields: {} });

            expect(inventory.getAmount(ResourceType.OreBatch)).toBe(5);
            expect(inventory.getBatches(ResourceType.OreBatch).length).toBeGreaterThan(0);
      });
});
