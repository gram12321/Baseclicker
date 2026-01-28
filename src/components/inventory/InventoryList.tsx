import React, { useState } from 'react';
import { Resource } from '../../resources/resource';
import { ResourceType } from '../../utils/types';
import { formatCurrency, formatNumber } from '../../utils/utils';
import { Inventory } from '../../lib/inventory';
import { getLocalMarketSupply, getGlobalMarketSupply } from '../../lib/economy';
import { Repeat, Box, Globe, Coins, ShoppingCart, Minus } from 'lucide-react';
import { getResourceIcon } from '../../utils/resourceIcons';

interface InventoryListProps {
      resources: [ResourceType, Resource][];
      inventory: Inventory;
      onSell?: (type: ResourceType, amount: number) => void;
      onToggleAutosell?: (type: ResourceType, enabled: boolean, amount: number) => void;
      isAutosellEnabled?: (type: ResourceType) => boolean;
      getAutoSellAmount?: (type: ResourceType) => number;
}

export const InventoryList: React.FC<InventoryListProps> = ({
      resources,
      inventory,
      onSell,
      onToggleAutosell,
      isAutosellEnabled,
      getAutoSellAmount
}) => {
      // Local state for trade amounts per resource
      const [tradeAmounts, setTradeAmounts] = useState<Record<string, number>>(
            Object.fromEntries(resources.map(([type]) => [type, 1]))
      );

      const handleSliderChange = (type: ResourceType, value: number) => {
            setTradeAmounts(prev => ({ ...prev, [type]: value }));
      };

      return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm overflow-x-auto w-full">
                  <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                              <Box className="w-5 h-5 text-indigo-400" />
                              Market & Inventory
                        </h2>
                  </div>

                  <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium">Resource</th>
                                    <th className="px-4 py-3 font-medium text-center">Local Price</th>
                                    <th className="px-4 py-3 font-medium text-center">Global Price</th>
                                    <th className="px-4 py-3 font-medium text-center">Local Quality</th>
                                    <th className="px-4 py-3 font-medium text-center">Global Quality</th>
                                    <th className="px-4 py-3 font-medium text-center">Local Market</th>
                                    <th className="px-4 py-3 font-medium text-center">Global Market</th>
                                    <th className="px-4 py-3 font-medium text-center">Flow</th>
                                    <th className="px-4 py-3 font-medium text-right">Inventory</th>
                                    <th className="px-4 py-3 font-medium text-center w-48">Trade Amount</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                              </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                              {resources.map(([type, resource]) => {
                                    const amount = inventory.getAmount(type);
                                    const localSupply = getLocalMarketSupply(type);
                                    const globalSupply = getGlobalMarketSupply(type);
                                    const localPrice = resource.getLocalPrice(localSupply);
                                    const globalPrice = resource.getGlobalPrice(globalSupply);
                                    const autosell = isAutosellEnabled?.(type) ?? false;
                                    const currentTradeAmount = tradeAmounts[type] || 1;
                                    const currentAutosellAmount = getAutoSellAmount?.(type) ?? 1;

                                    return (
                                          <tr
                                                key={`inventory-${type}`}
                                                className="group transition-colors hover:bg-slate-800/30"
                                          >
                                                {/* Resource */}
                                                <td className="px-4 py-4">
                                                      <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                                                                  {getResourceIcon(type)}
                                                            </div>
                                                            <div>
                                                                  <div className="font-semibold text-slate-100">{resource.name}</div>
                                                                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Tier 1</div>
                                                            </div>
                                                      </div>
                                                </td>

                                                {/* Local Price */}
                                                <td className="px-4 py-4 text-center">
                                                      <div className="inline-flex flex-col items-center">
                                                            <div className="flex items-center gap-1 font-mono font-medium text-amber-400">
                                                                  {formatCurrency(localPrice, { maxDecimals: 2, minDecimals: 2 })}
                                                                  <Coins className="w-3 h-3" />
                                                            </div>
                                                      </div>
                                                </td>

                                                {/* Global Price */}
                                                <td className="px-4 py-4 text-center text-slate-400">
                                                      <div className="inline-flex flex-col items-center">
                                                            <div className="flex items-center gap-1 font-mono">
                                                                  {formatCurrency(globalPrice, { maxDecimals: 2, minDecimals: 2 })}
                                                                  <Globe className="w-3 h-3 text-slate-500" />
                                                            </div>
                                                      </div>
                                                </td>

                                                {/* Local Quality */}
                                                <td className="px-4 py-4 text-center">
                                                      <span className="text-slate-500 font-mono text-xs italic">1.00</span>
                                                </td>

                                                {/* Global Quality */}
                                                <td className="px-4 py-4 text-center">
                                                      <span className="text-slate-500 font-mono text-xs italic">1.00</span>
                                                </td>

                                                {/* Local Market Supply */}
                                                <td className="px-4 py-4 text-center">
                                                      <div className="font-mono text-xs text-slate-300">
                                                            {formatNumber(localSupply, { decimals: 0 })}
                                                      </div>
                                                      <div className="text-[9px] text-slate-600">units</div>
                                                </td>

                                                {/* Global Market Supply */}
                                                <td className="px-4 py-4 text-center">
                                                      <div className="font-mono text-xs text-slate-400">
                                                            {formatNumber(globalSupply, { decimals: 0 })}
                                                      </div>
                                                      <div className="text-[9px] text-slate-600">units</div>
                                                </td>

                                                {/* Flow */}
                                                <td className="px-4 py-4 text-center">
                                                      <div className="inline-flex flex-col items-center text-slate-600">
                                                            <Minus className="w-4 h-4" />
                                                            <span className="text-[10px]">&plusmn;0</span>
                                                      </div>
                                                </td>

                                                {/* Inventory */}
                                                <td className="px-4 py-4 text-right">
                                                      <div className="text-lg font-mono font-semibold text-emerald-400">
                                                            {formatNumber(amount, { decimals: 0 })}
                                                      </div>
                                                </td>

                                                {/* Slider Input */}
                                                <td className="px-4 py-4">
                                                      <div className="flex flex-col gap-1 items-center px-2">
                                                            <input
                                                                  type="range"
                                                                  min="1"
                                                                  max={Math.max(100, amount)}
                                                                  value={currentTradeAmount}
                                                                  onChange={(e) => handleSliderChange(type, parseInt(e.target.value))}
                                                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                            />
                                                            <div className="flex justify-between w-full text-[10px] font-mono text-slate-500">
                                                                  <span>1</span>
                                                                  <span className="text-indigo-400 font-bold">{currentTradeAmount}</span>
                                                                  <span>{Math.max(100, amount)}</span>
                                                            </div>
                                                      </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-4 text-right">
                                                      <div className="flex items-center justify-end gap-2">
                                                            {/* Buy Placeholder */}
                                                            <button
                                                                  disabled
                                                                  className="p-2 rounded-lg bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                                                                  title="Buy (Not implemented)"
                                                            >
                                                                  <ShoppingCart className="w-4 h-4" />
                                                            </button>

                                                            {/* Sell Button */}
                                                            <button
                                                                  onClick={() => onSell?.(type, currentTradeAmount)}
                                                                  className="p-2 rounded-lg bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
                                                                  title={`Sell ${currentTradeAmount}`}
                                                            >
                                                                  <Coins className="w-4 h-4" />
                                                            </button>

                                                            {/* Autosell Toggle */}
                                                            <div className="flex flex-col items-center gap-1">
                                                                  <button
                                                                        onClick={() => onToggleAutosell?.(type, !autosell, currentTradeAmount)}
                                                                        className={`p-2 rounded-lg border transition-all active:scale-95 ${autosell
                                                                              ? 'bg-emerald-600 border-emerald-500 text-white active:bg-emerald-700'
                                                                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                                                                              }`}
                                                                        title={autosell ? `Disable Auto-sell (Current setting: ${currentAutosellAmount})` : `Enable Auto-sell for ${currentTradeAmount} units`}
                                                                  >
                                                                        <Repeat className={`w-4 h-4 ${autosell ? 'animate-spin-slow' : ''}`} />
                                                                  </button>
                                                            </div>
                                                      </div>
                                                </td>
                                          </tr>
                                    );
                              })}
                        </tbody>
                  </table>
            </div>
      );
};
