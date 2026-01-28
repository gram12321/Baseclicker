import { useState } from 'react';
import { ResourceType, BuildingType } from '../utils/types';
import { resources } from '../lib/resources/resourcesRegistry';
import { builtBuildings, upgradeBuilding, upgradeBuildingQuality, buildFacility as buildFacilityAction, BUILDING_NAMES } from '../lib/Building';
import { researchRecipe, isRecipeResearched } from '../lib/research';
import { getGameday } from '../lib/game/gametick';
import { Inventory } from '../lib/inventory';
import { getBalance, getResearch } from '../lib/game/gameState';
import { ALL_RECIPES } from '../lib/recipes/recipes';
import { formatCurrency, formatNumber } from '../utils/utils';

import { ResearchModal } from '../components/production/ResearchModal';
import { BuildBuildingsModal } from '../components/production/BuildBuildingsModal';
import { Button } from '../components/ui/button';
import { Hammer, Zap, Play, Square, AlertCircle } from 'lucide-react';

const buildingTypes = Object.values(BuildingType);

interface ProductionProps {
      refresh: () => void;
      inventoryRef: React.MutableRefObject<Inventory>;
}

export default function Production({ refresh, inventoryRef }: ProductionProps) {
      const [errorMsg, setErrorMsg] = useState<string | null>(null);
      const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
      const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
      const balance = getBalance();
      const research = getResearch();
      const gameDay = getGameday();

      const showNotification = (msg: string) => {
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(null), 3000);
      };

      const handleActivate = (buildingType: BuildingType) => {
            const building = builtBuildings.get(buildingType);
            if (building?.activate()) {
                  refresh();
            } else {
                  if (building?.hasRecipeSelected()) {
                        const recipe = building.currentRecipe;
                        if (recipe && !isRecipeResearched(recipe.outputResource)) {
                              showNotification(`Research required for ${resources[recipe.outputResource].name} production`);
                        } else {
                              showNotification(`Cannot activate ${BUILDING_NAMES[buildingType]}`);
                        }
                  } else {
                        showNotification('Select a recipe first');
                  }
            }
      };

      const handleDeactivate = (buildingType: BuildingType) => {
            const building = builtBuildings.get(buildingType);
            building?.deactivate();
            refresh();
      };

      const handleBuildProduction = (buildingType: BuildingType) => {
            if (buildFacilityAction(buildingType)) {
                  refresh();
            } else {
                  const facilityName = BUILDING_NAMES[buildingType];
                  showNotification(`Insufficient funds to build ${facilityName}`);
            }
      };

      const handleUpgradeProduction = (buildingType: BuildingType) => {
            if (upgradeBuilding(buildingType).success) {
                  refresh();
            } else {
                  const facilityName = BUILDING_NAMES[buildingType];
                  showNotification(`Insufficient funds to upgrade ${facilityName} speed`);
            }
      };

      const handleUpgradeQuality = (buildingType: BuildingType) => {
            if (upgradeBuildingQuality(buildingType).success) {
                  refresh();
            } else {
                  const facilityName = BUILDING_NAMES[buildingType];
                  showNotification(`Insufficient funds to upgrade ${facilityName} quality`);
            }
      };

      const handleResearch = (type: ResourceType) => {
            if (researchRecipe(type)) {
                  showNotification(`Successfully researched ${resources[type].name} Recipe!`);
                  refresh();
            } else {
                  showNotification(`Insufficient research points to research ${resources[type].name} Recipe`);
            }
      };

      // Filter to only show built facilities
      const builtFacilities = buildingTypes.filter(bt => builtBuildings.has(bt));

      // Check if there are any unresearched recipes
      const hasUnresearchedRecipes = Object.values(ALL_RECIPES).some(
            recipe => !isRecipeResearched(recipe.outputResource)
      );

      // Check if there are any not-built facilities (no research requirement)
      const hasBuildableFacilities = buildingTypes.some(bt => !builtBuildings.has(bt));

      return (
            <div className="space-y-6">
                  {/* Error Notification Toast */}
                  {errorMsg && (
                        <div className="fixed top-4 right-4 z-50 rounded-lg border border-rose-500 bg-rose-950/90 px-4 py-3 text-rose-200 shadow-lg backdrop-blur animate-in slide-in-from-top-2 fade-in duration-300">
                              <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                    <span className="text-sm font-medium">{errorMsg}</span>
                              </div>
                        </div>
                  )}

                  {/* Research Modal */}
                  <ResearchModal
                        isOpen={isResearchModalOpen}
                        onClose={() => setIsResearchModalOpen(false)}
                        onResearch={handleResearch}
                        availableResearch={research}
                  />

                  {/* Build Buildings Modal */}
                  <BuildBuildingsModal
                        isOpen={isBuildModalOpen}
                        onClose={() => setIsBuildModalOpen(false)}
                        onBuild={handleBuildProduction}
                        availableBalance={balance}
                  />

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                        <div className="mb-6 flex items-center justify-between">
                              <div>
                                    <h1 className="text-2xl font-bold text-slate-100">Production</h1>
                                    <p className="text-sm text-slate-400 mt-1">Day {gameDay} • Balance: {formatCurrency(balance, { maxDecimals: 2, minDecimals: 2 })}</p>
                              </div>
                              <div className="flex gap-3">
                                    {hasBuildableFacilities && (
                                          <Button
                                                onClick={() => setIsBuildModalOpen(true)}
                                                size="lg"
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                                          >
                                                <svg
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      width="18"
                                                      height="18"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      strokeWidth="2"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      className="mr-2"
                                                >
                                                      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                                                      <circle cx="9" cy="9" r="2" />
                                                      <circle cx="20" cy="16" r="2" />
                                                </svg>
                                                Build Facilities
                                          </Button>
                                    )}
                                    <Button
                                          onClick={() => setIsResearchModalOpen(true)}
                                          size="lg"
                                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                                    >
                                          <Zap className="mr-2 w-4 h-4" />
                                          Research Lab
                                    </Button>
                              </div>
                        </div>

                        <div className="space-y-4">
                              {builtFacilities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                          <div className="rounded-full bg-slate-950/30 p-6 mb-4">
                                                <Hammer className="text-slate-500 w-12 h-12" />
                                          </div>
                                          <h3 className="text-xl font-semibold text-slate-100 mb-2">
                                                Industrial Desert
                                          </h3>
                                          <p className="text-slate-400 max-w-md mb-6">
                                                Your empire has no production facilities. Build some to start generating resources.
                                          </p>
                                          <div className="flex gap-3">
                                                {hasBuildableFacilities && (
                                                      <Button
                                                            onClick={() => setIsBuildModalOpen(true)}
                                                            size="lg"
                                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                                                      >
                                                            Open Construction Yard
                                                      </Button>
                                                )}
                                          </div>
                                    </div>
                              ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {builtFacilities.map(buildingType => {
                                                const building = builtBuildings.get(buildingType)!;
                                                const recipes = building.recipes;
                                                const isActive = building.isActive();
                                                const currentRecipe = building.currentRecipe;

                                                return (
                                                      <div key={buildingType} className={`rounded-xl border p-5 transition-all ${isActive ? 'border-emerald-500/30 bg-slate-900/80' : 'border-slate-800 bg-slate-950/60'}`}>
                                                            <div className="flex items-center justify-between mb-4">
                                                                  <div>
                                                                        <h3 className="text-lg font-bold text-slate-100">{BUILDING_NAMES[buildingType]}</h3>
                                                                        <div className="flex items-center gap-2">
                                                                              {isActive && building.isStalled(inventoryRef.current) && (
                                                                                    <div className="flex items-center gap-1 text-[10px] text-amber-500 animate-pulse">
                                                                                          <AlertCircle className="w-3 h-3" />
                                                                                          <span>Missing Resources</span>
                                                                                    </div>
                                                                              )}
                                                                        </div>
                                                                  </div>
                                                                  <div className="flex flex-col gap-2">
                                                                        <Button
                                                                              variant="outline"
                                                                              size="sm"
                                                                              className="border-slate-700 h-7 text-[9px] w-full"
                                                                              onClick={() => handleUpgradeProduction(buildingType)}
                                                                        >
                                                                              Speed Lvl {building.productionUpgradeLevel} (${formatNumber(building.getUpgradeCost(), { compact: true })})
                                                                        </Button>
                                                                        <Button
                                                                              variant="outline"
                                                                              size="sm"
                                                                              className="border-blue-900/50 hover:border-blue-500/50 h-7 text-[9px] text-blue-300 w-full"
                                                                              onClick={() => handleUpgradeQuality(buildingType)}
                                                                        >
                                                                              Quality Lvl {building.qualityUpgradeLevel} (${formatNumber(building.getQualityUpgradeCost(), { compact: true })})
                                                                        </Button>
                                                                  </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 mb-4 text-[10px] bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                                                                  <div className="flex flex-col">
                                                                        <span className="text-slate-500 uppercase tracking-tighter text-[8px] font-bold">Multiplier</span>
                                                                        <span className="text-emerald-400 font-mono">x{building.productionMultiplier.toFixed(2)}</span>
                                                                  </div>
                                                                  <div className="w-px h-4 bg-slate-800" />
                                                                  <div className="flex flex-col">
                                                                        <span className="text-slate-500 uppercase tracking-tighter text-[8px] font-bold">Avg Quality</span>
                                                                        <span className="text-blue-400 font-mono">Q{building.productionQuality.toFixed(2)}</span>
                                                                  </div>
                                                            </div>

                                                            <div className="space-y-2 mb-6">
                                                                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Active Recipe</div>
                                                                  {recipes.map(recipe => {
                                                                        const researched = isRecipeResearched(recipe.outputResource);
                                                                        const isSelected = building.activeRecipeName === recipe.name;

                                                                        return (
                                                                              <button
                                                                                    key={recipe.name}
                                                                                    disabled={!researched}
                                                                                    onClick={() => {
                                                                                          if (isSelected && isActive) {
                                                                                                building.deactivate();
                                                                                          } else {
                                                                                                building.setProduction(recipe.name);
                                                                                          }
                                                                                          refresh();
                                                                                    }}
                                                                                    className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${isSelected && isActive
                                                                                          ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-100'
                                                                                          : isSelected
                                                                                                ? 'bg-slate-800 border-slate-700 text-slate-300'
                                                                                                : researched
                                                                                                      ? 'hover:bg-slate-800/50 border-transparent text-slate-500'
                                                                                                      : 'opacity-30 cursor-not-allowed border-transparent text-slate-600'
                                                                                          }`}
                                                                              >
                                                                                    <div className="flex flex-col items-start gap-1 py-1">
                                                                                          <div className="flex items-center gap-2">
                                                                                                <span className="text-sm font-bold">{recipe.name}</span>
                                                                                          </div>
                                                                                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                                                                                                <div className="flex items-center gap-1">
                                                                                                      <span className="text-slate-500">Stock:</span>
                                                                                                      <span className="text-emerald-400 font-medium">
                                                                                                            {formatNumber(inventoryRef.current.getAmount(recipe.outputResource), { compact: true })}
                                                                                                      </span>
                                                                                                </div>
                                                                                                {recipe.inputs.length > 0 && (
                                                                                                      <div className="flex gap-2 border-l border-slate-700/50 pl-2">
                                                                                                            {recipe.inputs.map(input => {
                                                                                                                  const owned = inventoryRef.current.getAmount(input.resource);
                                                                                                                  const isLow = owned < input.amount;
                                                                                                                  return (
                                                                                                                        <div key={input.resource} className="flex items-center gap-1">
                                                                                                                              <span className="text-slate-500">{input.resource}:</span>
                                                                                                                              <span className={isLow ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                                                                                                                    {formatNumber(owned, { compact: true })}/{input.amount}
                                                                                                                              </span>
                                                                                                                        </div>
                                                                                                                  );
                                                                                                            })}
                                                                                                      </div>
                                                                                                )}
                                                                                          </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                          {isSelected && isActive ? <Square className="w-3 h-3 fill-current" /> : researched ? <Play className="w-3 h-3 fill-current" /> : null}
                                                                                    </div>
                                                                              </button>
                                                                        );
                                                                  })}
                                                            </div>

                                                            {isActive && currentRecipe && (
                                                                  <div className="space-y-1">
                                                                        <div className="flex justify-between text-[10px] text-slate-500">
                                                                              <span>Progress</span>
                                                                              <span>{Math.floor((building.getCurrentProgress() / (currentRecipe.workamount || 1)) * 100)}%</span>
                                                                        </div>
                                                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                                              <div
                                                                                    className="h-full bg-emerald-500 transition-all duration-300"
                                                                                    style={{ width: `${Math.min(100, (building.getCurrentProgress() / (currentRecipe.workamount || 1)) * 100)}%` }}
                                                                              />
                                                                        </div>
                                                                  </div>
                                                            )}
                                                      </div>
                                                );
                                          })}
                                    </div>
                              )}
                        </div>
                  </div>
            </div>
      );
}
