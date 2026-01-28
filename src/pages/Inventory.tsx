import React, { useState } from 'react';
import { Resource } from '../lib/resources/resource';
import { ResourceType, BuildingType, RecipeName } from '../utils/types';
import { resources } from '../lib/resources/resourcesRegistry';
import { isAutoSellEnabled, setAutoSellEnabled, setAutoSellAmount, getAutoSellAmount, getAutoSellMinKeep, setAutoSellMinKeep } from '../lib/game/gameState';
import { sellResource as sellResourceEconomy } from '../lib/market/market';
import { Inventory } from '../lib/inventory';
import { getLocalMarketSupply, getGlobalMarketSupply } from '../lib/market/market';
import { getDiffusionInfo } from '../lib/market/marketDiffusion';
import { formatCurrency, formatNumber } from '../utils/utils';
import { getResourceIcon } from '../utils/resourceIcons';
import { builtBuildings, Building, BUILDING_RECIPES, BUILDING_NAMES, upgradeBuilding, buildFacility, BUILDING_COSTS } from '../lib/Building';
import { isRecipeResearched, researchRecipe } from '../lib/research';
import { ALL_RECIPES } from '../lib/recipes/recipes';

// Icons
import { Repeat, Box, Globe, Coins, ShoppingCart, Minus, MoveRight, MoveLeft, Settings, Hammer, Zap, Play, Square, ArrowUpCircle, AlertCircle } from 'lucide-react';


interface InventoryPageProps {
      inventoryRef: React.MutableRefObject<Inventory>;
      refresh: () => void;
      refreshToken: number;
}

export default function InventoryPage({ inventoryRef, refresh, refreshToken }: InventoryPageProps) {
      const resourceEntries = Object.entries(resources) as [ResourceType, Resource][];

      // Local state for trade amounts per resource (moved from InventoryList)
      const [tradeAmounts, setTradeAmounts] = useState<Record<string, number>>(
            Object.fromEntries(resourceEntries.map(([type]) => [type, 1]))
      );
      const [expandedResource, setExpandedResource] = useState<ResourceType | null>(null);

      const handleSliderChange = (type: ResourceType, value: number) => {
            setTradeAmounts(prev => ({ ...prev, [type]: value }));
      };

      const handleSellResource = (type: ResourceType, amount: number) => {
            const success = sellResourceEconomy(inventoryRef.current, type, amount);
            if (success) refresh();
      };

      const handleToggleAutosell = (type: ResourceType, enabled: boolean) => {
            setAutoSellEnabled(type, enabled);
            // If enabling for the first time on 0, set defaults
            if (enabled && getAutoSellAmount(type) <= 1) {
                  setAutoSellAmount(type, 50); // Default sell amount
                  setAutoSellMinKeep(type, 0); // Default keep amount
            }
            refresh();
      };

      const handleUpdateAutosellConfig = (type: ResourceType, field: 'keep' | 'sell', value: number) => {
            if (field === 'keep') {
                  setAutoSellMinKeep(type, value);
            } else {
                  setAutoSellAmount(type, value);
            }
            refresh();
      };

      const handleSetProduction = (building: Building, recipeName: RecipeName | null) => {
            building.setProduction(recipeName);
            refresh();
      };

      const handleUpgradeBuilding = (buildingType: BuildingType) => {
            upgradeBuilding(buildingType);
            refresh();
      };

      const handleBuildFacility = (buildingType: BuildingType) => {
            buildFacility(buildingType);
            refresh();
      };

      return (
            <div className="space-y-6">
                  <div>
                        <h1 className="text-2xl font-bold text-slate-100 mb-2">Market & Inventory</h1>
                        <p className="text-slate-400 text-sm">Manage your resources and trade with the global market.</p>
                  </div>

                  <div className="w-full">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm overflow-x-auto w-full">
                              <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                                          <Box className="w-5 h-5 text-indigo-400" />
                                          Resource Market
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
                                          {resourceEntries.map(([type, resource]) => {
                                                const amount = inventoryRef.current.getAmount(type);
                                                const localSupply = getLocalMarketSupply(type);
                                                const globalSupply = getGlobalMarketSupply(type);
                                                const localPrice = resource.getLocalPrice(localSupply);
                                                const globalPrice = resource.getGlobalPrice(globalSupply);
                                                const autosell = isAutoSellEnabled(type);
                                                const currentTradeAmount = tradeAmounts[type] || 1;
                                                const autoSellAmount = getAutoSellAmount(type);
                                                const autoSellMinKeep = getAutoSellMinKeep(type);
                                                const isExpanded = expandedResource === type;

                                                return (
                                                      <React.Fragment key={`inventory-${type}`}>
                                                            <tr className={`group transition-colors ${isExpanded ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`}>
                                                                  {/* Resource */}
                                                                  <td className="px-4 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                                                                                    {getResourceIcon(type)}
                                                                              </div>
                                                                              <div>
                                                                                    <div className="font-semibold text-slate-100">{resource.name}</div>
                                                                              </div>
                                                                        </div>
                                                                  </td>

                                                                  {/* Local Price */}
                                                                  <td className="px-4 py-4 text-center">
                                                                        {(() => {
                                                                              const priceModifier = resource.priceModifier || 1;
                                                                              const basePrice = localPrice / priceModifier;
                                                                              const bonusPercent = Math.round((priceModifier - 1) * 100);

                                                                              return (
                                                                                    <div className="inline-flex flex-col items-center">
                                                                                          <div className="flex items-center gap-1 font-mono font-medium text-amber-400">
                                                                                                {formatCurrency(basePrice, { maxDecimals: 4, minDecimals: 2 })}
                                                                                                <Coins className="w-3 h-3" />
                                                                                          </div>
                                                                                          <div className="flex items-center gap-1 text-[10px] font-mono whitespace-nowrap text-slate-500">
                                                                                                <span>{formatCurrency(localPrice, { maxDecimals: 2, minDecimals: 2 })}</span>
                                                                                                {bonusPercent > 0 && (
                                                                                                      <span className="text-emerald-500"> (+{bonusPercent}%)</span>
                                                                                                )}
                                                                                          </div>
                                                                                    </div>
                                                                              );
                                                                        })()}
                                                                  </td>

                                                                  {/* Global Price */}
                                                                  <td className="px-4 py-4 text-center text-slate-400">
                                                                        {(() => {
                                                                              const priceModifier = resource.priceModifier || 1;
                                                                              const basePrice = globalPrice / priceModifier;
                                                                              const bonusPercent = Math.round((priceModifier - 1) * 100);

                                                                              return (
                                                                                    <div className="inline-flex flex-col items-center">
                                                                                          <div className="flex items-center gap-1 font-mono">
                                                                                                {formatCurrency(basePrice, { maxDecimals: 4, minDecimals: 2 })}
                                                                                                <Globe className="w-3 h-3 text-slate-500" />
                                                                                          </div>
                                                                                          <div className="flex items-center gap-1 text-[10px] font-mono whitespace-nowrap text-slate-600">
                                                                                                <span>{formatCurrency(globalPrice, { maxDecimals: 2, minDecimals: 2 })}</span>
                                                                                                {bonusPercent > 0 && (
                                                                                                      <span className="text-emerald-400/70"> (+{bonusPercent}%)</span>
                                                                                                )}
                                                                                          </div>
                                                                                    </div>
                                                                              );
                                                                        })()}
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
                                                                        {(() => {
                                                                              const diffusion = getDiffusionInfo(type);
                                                                              const isToLocal = diffusion.direction === 'to-local';
                                                                              const isToGlobal = diffusion.direction === 'to-global';
                                                                              const flowColor = isToLocal ? 'text-emerald-500' : isToGlobal ? 'text-amber-500' : 'text-slate-600';

                                                                              if (diffusion.direction === 'none') {
                                                                                    return (
                                                                                          <div className="inline-flex flex-col items-center text-slate-600">
                                                                                                <Minus className="w-4 h-4" />
                                                                                                <span className="text-[10px]">&plusmn;0</span>
                                                                                          </div>
                                                                                    );
                                                                              }

                                                                              return (
                                                                                    <div className={`inline-flex flex-col items-center ${flowColor}`}>
                                                                                          {isToLocal ? (
                                                                                                <MoveLeft className="w-4 h-4" />
                                                                                          ) : (
                                                                                                <MoveRight className="w-4 h-4" />
                                                                                          )}
                                                                                          <span className="text-[10px] font-mono font-medium">
                                                                                                {formatNumber(Math.abs(diffusion.amount), { decimals: 0 })}/d
                                                                                          </span>
                                                                                    </div>
                                                                              );
                                                                        })()}
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
                                                                                    className="p-2 rounded-lg bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700 hover:bg-slate-700/50"
                                                                                    title="Buy (Not implemented)"
                                                                              >
                                                                                    <ShoppingCart className="w-4 h-4" />
                                                                              </button>

                                                                              {/* Sell Button */}
                                                                              <button
                                                                                    onClick={() => handleSellResource(type, currentTradeAmount)}
                                                                                    className="p-2 rounded-lg bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
                                                                                    title={`Sell ${currentTradeAmount}`}
                                                                              >
                                                                                    <Coins className="w-4 h-4" />
                                                                              </button>

                                                                              {/* Autosell Toggle */}
                                                                              <button
                                                                                    onClick={() => handleToggleAutosell(type, !autosell)}
                                                                                    className={`p-2 rounded-lg border transition-all active:scale-95 ${autosell
                                                                                          ? 'bg-emerald-600 border-emerald-500 text-white active:bg-emerald-700'
                                                                                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                                                                                          }`}
                                                                                    title={autosell ? "Disable Auto-sell" : "Enable Auto-sell"}
                                                                              >
                                                                                    <Repeat className={`w-4 h-4 ${autosell ? 'animate-spin-slow' : ''}`} />
                                                                              </button>

                                                                              {/* Config Toggle */}
                                                                              <button
                                                                                    onClick={() => setExpandedResource(expandedResource === type ? null : type)}
                                                                                    className={`p-2 rounded-lg border transition-all active:scale-95 ${isExpanded
                                                                                          ? 'bg-slate-700 border-slate-600 text-white'
                                                                                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                                                                                          }`}
                                                                                    title="Autosell Settings"
                                                                              >
                                                                                    <Settings className="w-4 h-4" />
                                                                              </button>
                                                                        </div>
                                                                  </td>
                                                            </tr>
                                                            {isExpanded && (
                                                                  <tr className="bg-slate-800/30 animate-in slide-in-from-top-2 duration-200">
                                                                        <td colSpan={11} className="px-4 py-4 border-b border-slate-800/50 shadow-inner">
                                                                              <div className="flex items-center gap-8 px-4">
                                                                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                                                                          <Settings className="w-4 h-4" />
                                                                                          <span className="font-semibold text-slate-300">Autosell Configuration</span>
                                                                                    </div>

                                                                                    <div className="flex items-center gap-4">
                                                                                          <div className="flex flex-col gap-1">
                                                                                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Min Keep Amount</label>
                                                                                                <div className="relative">
                                                                                                      <input
                                                                                                            type="number"
                                                                                                            value={autoSellMinKeep}
                                                                                                            onChange={(e) => handleUpdateAutosellConfig(type, 'keep', parseInt(e.target.value) || 0)}
                                                                                                            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 w-32 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                                                      />
                                                                                                      <div className="absolute right-2 top-1.5 text-xs text-slate-600 select-none">units</div>
                                                                                                </div>
                                                                                                <p className="text-[10px] text-slate-600">Keep at least this many</p>
                                                                                          </div>

                                                                                          <div className="flex flex-col gap-1">
                                                                                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Max Sell / Day</label>
                                                                                                <div className="relative">
                                                                                                      <input
                                                                                                            type="number"
                                                                                                            value={autoSellAmount}
                                                                                                            onChange={(e) => handleUpdateAutosellConfig(type, 'sell', parseInt(e.target.value) || 0)}
                                                                                                            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 w-32 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                                                      />
                                                                                                      <div className="absolute right-2 top-1.5 text-xs text-slate-600 select-none">/day</div>
                                                                                                </div>
                                                                                                <p className="text-[10px] text-slate-600">Max to sell per tick</p>
                                                                                          </div>
                                                                                    </div>

                                                                                    <div className="flex-1 text-right text-xs text-slate-500 italic">
                                                                                          Changes apply immediately on next tick.
                                                                                    </div>
                                                                              </div>

                                                                              {/* Production Facilities for this resource */}
                                                                              <div className="mt-6 border-t border-slate-800 pt-6 px-4">
                                                                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                                                                                          <Zap className="w-4 h-4 text-emerald-400" />
                                                                                          <span className="font-semibold text-slate-300">Associated Production Facilities</span>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                          {Object.entries(BUILDING_RECIPES).map(([bType, recipes]) => {
                                                                                                const buildingType = bType as BuildingType;
                                                                                                const relevantRecipes = recipes.filter(r => r.outputResource === type);
                                                                                                if (relevantRecipes.length === 0) return null;

                                                                                                const building = builtBuildings.get(buildingType);
                                                                                                const isBuilt = !!building;
                                                                                                const displayName = BUILDING_NAMES[buildingType];

                                                                                                return (
                                                                                                      <div key={buildingType} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                                                                                                            <div className="flex items-center justify-between mb-3">
                                                                                                                  <div className="flex items-center gap-2">
                                                                                                                        <Hammer className="w-4 h-4 text-slate-500" />
                                                                                                                        <span className="font-medium text-slate-200">{displayName}</span>
                                                                                                                        {isBuilt && (
                                                                                                                              <>
                                                                                                                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Lv. {building.productionUpgradeLevel}</span>
                                                                                                                                    {building.isActive() && building.isStalled(inventoryRef.current) && (
                                                                                                                                          <div className="flex items-center gap-1 text-[10px] text-amber-500 animate-pulse ml-2">
                                                                                                                                                <AlertCircle className="w-3 h-3" />
                                                                                                                                                <span>Missing Resources</span>
                                                                                                                                          </div>
                                                                                                                                    )}
                                                                                                                              </>
                                                                                                                        )}
                                                                                                                  </div>
                                                                                                                  {!isBuilt ? (
                                                                                                                        <button
                                                                                                                              onClick={() => handleBuildFacility(buildingType)}
                                                                                                                              className="text-xs px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-600/30 transition-colors"
                                                                                                                        >
                                                                                                                              Build (${BUILDING_COSTS[buildingType]})
                                                                                                                        </button>
                                                                                                                  ) : (
                                                                                                                        <button
                                                                                                                              onClick={() => handleUpgradeBuilding(buildingType)}
                                                                                                                              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
                                                                                                                        >
                                                                                                                              <ArrowUpCircle className="w-3 h-3" />
                                                                                                                              Upgrade (${building.getUpgradeCost()})
                                                                                                                        </button>
                                                                                                                  )}
                                                                                                            </div>

                                                                                                            {isBuilt ? (
                                                                                                                  <div className="space-y-2">
                                                                                                                        {relevantRecipes.map(recipe => {
                                                                                                                              const isResearched = isRecipeResearched(recipe.outputResource);
                                                                                                                              const isCurrent = building.activeRecipeName === recipe.name && building.isActive();

                                                                                                                              return (
                                                                                                                                    <div key={recipe.name} className="flex items-center justify-between gap-3">
                                                                                                                                          <div className="flex flex-col">
                                                                                                                                                <span className={`text-sm ${isCurrent ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                                                                                                                                                      {recipe.name}
                                                                                                                                                </span>
                                                                                                                                                {recipe.inputs.length > 0 && (
                                                                                                                                                      <span className="text-[10px] text-slate-600">
                                                                                                                                                            In: {recipe.inputs.map(i => `${i.amount} ${i.resource}`).join(', ')}
                                                                                                                                                      </span>
                                                                                                                                                )}
                                                                                                                                          </div>

                                                                                                                                          {!isResearched ? (
                                                                                                                                                <span className="text-[10px] text-slate-600 italic">Not Researched</span>
                                                                                                                                          ) : (
                                                                                                                                                <button
                                                                                                                                                      onClick={() => handleSetProduction(building, isCurrent ? null : recipe.name)}
                                                                                                                                                      className={`p-1.5 rounded-lg transition-all ${isCurrent
                                                                                                                                                            ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                                                                                                                                            : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                                                                                                                                            }`}
                                                                                                                                                >
                                                                                                                                                      {isCurrent ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                                                                                                                </button>
                                                                                                                                          )}
                                                                                                                                    </div>
                                                                                                                              );
                                                                                                                        })}
                                                                                                                  </div>
                                                                                                            ) : (
                                                                                                                  <div className="text-xs text-slate-600 italic">Build this facility to start production</div>
                                                                                                            )}
                                                                                                      </div>
                                                                                                );
                                                                                          })}
                                                                                    </div>
                                                                              </div>
                                                                        </td>
                                                                  </tr>
                                                            )}
                                                      </React.Fragment>
                                                );
                                          })}

                                    </tbody>
                              </table>
                        </div>
                  </div>
            </div>
      );
}
