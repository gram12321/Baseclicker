import React from 'react';
import { Resource } from '../../resource';
import { ResourceType } from '../../types';
import { formatCurrency } from '../../utils';
import { Inventory } from '../../inventory';
import { getMarketSupply } from '../../economy';

interface InventoryListProps {
      resources: [ResourceType, Resource][];
      inventory: Inventory;
}

export const InventoryList: React.FC<InventoryListProps> = ({ resources, inventory }) => {
      return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-100">Inventory</h2>
                  <div className="space-y-3">
                        {resources.map(([type, resource]) => {
                              const amount = inventory.getAmount(type);
                              const price = resource.getCurrentPrice(getMarketSupply(type));
                              return (
                                    <div
                                          key={`inventory-${type}`}
                                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 transition-colors hover:bg-slate-900/60"
                                    >
                                          <div>
                                                <div className="font-semibold text-slate-100">{resource.name}</div>
                                                <div className="text-sm text-slate-400">
                                                      {formatCurrency(price, { maxDecimals: 2, minDecimals: 2 })} each
                                                </div>
                                          </div>
                                          <div className="text-xl font-mono font-semibold text-emerald-300">
                                                {formatCurrency(amount, { maxDecimals: 0, minDecimals: 0, currencySymbol: '' })}
                                          </div>
                                    </div>
                              );
                        })}
                  </div>
            </div>
      );
};
