import { useState } from 'react';
import { ResourceType, BuildingType } from '../utils/types';
import { resources } from '../resources/resourcesRegistry';
import { builtBuildings, upgradeBuilding, buildFacility as buildFacilityAction, BUILDING_NAMES } from '../lib/Building';
import { researchRecipe, isRecipeResearched } from '../lib/research';
import { getGameday } from '../game/gametick';
import { getBalance, getResearch } from '../game/gameState';
import { ALL_RECIPES } from '../recipes/recipes';
import { formatCurrency } from '../utils/utils';
import { ProductionCard } from '../components/production/ProductionCard';
import { ResearchModal } from '../components/production/ResearchModal';
import { BuildBuildingsModal } from '../components/production/BuildBuildingsModal';
import { Button } from '../components/ui/button';

const buildingTypes = Object.values(BuildingType);

interface ProductionProps {
      refresh: () => void;
}

export default function Production({ refresh }: ProductionProps) {
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
            building?.activate();
            refresh();
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
                  showNotification(`Insufficient funds to upgrade ${facilityName}`);
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
                                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                          </svg>
                                          Research Recipes
                                    </Button>
                              </div>
                        </div>

                        <div className="space-y-4">
                              {builtFacilities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                          <div className="rounded-full bg-slate-950/30 p-6 mb-4">
                                                <svg
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      width="48"
                                                      height="48"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      strokeWidth="2"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      className="text-slate-500"
                                                >
                                                      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                                                      <circle cx="9" cy="9" r="2" />
                                                      <circle cx="20" cy="16" r="2" />
                                                </svg>
                                          </div>
                                          <h3 className="text-xl font-semibold text-slate-100 mb-2">
                                                No Facilities Built Yet
                                          </h3>
                                          <p className="text-slate-400 max-w-md mb-6">
                                                Research production recipes and build facilities to start generating resources. Click the buttons above to get started.
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
                                                <Button
                                                      onClick={() => setIsResearchModalOpen(true)}
                                                      size="lg"
                                                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                                                >
                                                      Open Research Lab
                                                </Button>
                                          </div>
                                    </div>
                              ) : (
                                    builtFacilities.map(buildingType => (
                                          <ProductionCard
                                                key={buildingType}
                                                buildingType={buildingType}
                                                isBuilt={true}
                                                isActive={builtBuildings.get(buildingType)?.isActive() ?? false}
                                                onActivate={handleActivate}
                                                onDeactivate={handleDeactivate}
                                                onUpgrade={handleUpgradeProduction}
                                                onBuild={handleBuildProduction}
                                                upgradeCost={builtBuildings.get(buildingType)?.getUpgradeCost() ?? 0}
                                                buildCost={0}
                                                level={builtBuildings.get(buildingType)?.productionUpgradeLevel ?? 0}
                                          />
                                    ))
                              )}
                        </div>
                  </div>
            </div>
      );
}
