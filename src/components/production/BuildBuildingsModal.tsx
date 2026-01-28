import React from 'react';
import { BuildingType } from '../../utils/types';
import { BUILDING_RECIPES, BUILDING_COSTS, BUILDING_NAMES, builtBuildings } from '../../Building';
import { isRecipeResearched } from '../../research';
import { formatNumber } from '../../utils/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getResourceIcon } from '../../utils/resourceIcons';

interface BuildBuildingsModalProps {
      isOpen: boolean;
      onClose: () => void;
      onBuild: (type: BuildingType) => void;
      availableBalance: number;
}

export const BuildBuildingsModal: React.FC<BuildBuildingsModalProps> = ({
      isOpen,
      onClose,
      onBuild,
      availableBalance,
}) => {
      if (!isOpen) return null;

      const buildingTypes = Object.values(BuildingType);

      const handleBuild = (type: BuildingType) => {
            onBuild(type);
      };

      return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm px-6 py-4">
                              <div className="flex items-center justify-between">
                                    <div>
                                          <h2 className="text-2xl font-bold text-slate-100">Construction Yard</h2>
                                          <p className="text-sm text-slate-400 mt-1">
                                                View all production facilities and build researched ones
                                          </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                          <div className="text-right">
                                                <div className="text-xs text-slate-400">Available Funds</div>
                                                <div className="text-xl font-bold text-emerald-400">
                                                      ${formatNumber(availableBalance, { compact: true })}
                                                </div>
                                          </div>
                                          <Button
                                                onClick={onClose}
                                                variant="outline"
                                                className="border-slate-700 hover:bg-slate-800 text-slate-300"
                                          >
                                                Close
                                          </Button>
                                    </div>
                              </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {buildingTypes.map((type) => (
                                          <BuildCard
                                                key={type}
                                                type={type}
                                                availableBalance={availableBalance}
                                                onBuild={handleBuild}
                                          />
                                    ))}
                              </div>
                        </div>
                  </div>
            </div>
      );
};

interface BuildCardProps {
      type: BuildingType;
      availableBalance: number;
      onBuild: (type: BuildingType) => void;
}

const BuildCard: React.FC<BuildCardProps> = ({
      type,
      availableBalance,
      onBuild,
}) => {
      const canAfford = availableBalance >= BUILDING_COSTS[type];
      const isBuilt = builtBuildings.has(type);

      const buildingName = BUILDING_NAMES[type];
      const recipes = BUILDING_RECIPES[type];

      // Filter to only show researched recipes
      const researchedRecipesList = recipes.filter(r => isRecipeResearched(r.outputResource));

      // Only show detailed stats if there is exactly one recipe type
      const singleRecipe = recipes.length === 1 ? recipes[0] : null;

      return (
            <Card className="border-slate-800 bg-slate-950/60 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-200">
                  <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                              <div>
                                    <CardTitle className="text-slate-100 text-lg">{buildingName}</CardTitle>
                                    <CardDescription className="text-slate-400 text-xs mt-1">
                                          Production Facility
                                    </CardDescription>
                              </div>
                              <div className="rounded-full bg-emerald-950/50 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                                    ${BUILDING_COSTS[type]}
                              </div>
                        </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                        {/* Recipe Information */}
                        <div>
                              <div className="text-xs font-medium text-slate-400 mb-2">
                                    {recipes.length > 1 ? 'Available Recipes' : 'Recipe'}
                              </div>
                              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                    {singleRecipe ? (
                                          <>
                                                <div className="text-sm text-slate-300 font-medium mb-2">{singleRecipe.name}</div>
                                                {singleRecipe.inputs.length === 0 ? (
                                                      <div className="text-sm text-slate-500 italic">
                                                            Base resource - No inputs required
                                                      </div>
                                                ) : (
                                                      <div className="space-y-1">
                                                            <div className="text-xs text-slate-500 mb-1">Requires:</div>
                                                            {singleRecipe.inputs.map((input, idx) => (
                                                                  <div key={idx} className="flex justify-between text-sm">
                                                                        <span className="text-slate-400">{getResourceIcon(input.resource)} {input.resource}</span>
                                                                        <span className="text-slate-300 font-medium">{input.amount}x</span>
                                                                  </div>
                                                            ))}
                                                      </div>
                                                )}
                                                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                                                      <div className="flex justify-between text-sm">
                                                            <span className="text-slate-400">Produces:</span>
                                                            <span className="text-emerald-400 font-medium">
                                                                  {singleRecipe.outputAmount}x {getResourceIcon(singleRecipe.outputResource)} {singleRecipe.outputResource}
                                                            </span>
                                                      </div>
                                                      <div className="flex justify-between text-sm">
                                                            <span className="text-slate-400">Work Required:</span>
                                                            <span className="text-slate-300 font-medium">{singleRecipe.workamount} ticks</span>
                                                      </div>
                                                </div>
                                          </>
                                    ) : (
                                          <div className="space-y-2">
                                                <div className="text-sm text-slate-400 italic mb-2">
                                                      Versatile facility with multiple specialized recipes.
                                                </div>
                                                {researchedRecipesList.length > 0 && (
                                                      <div className="text-xs text-slate-500">
                                                            Researched: {researchedRecipesList.map(r => r.name).join(', ')}
                                                      </div>
                                                )}
                                                {researchedRecipesList.length === 0 && (
                                                      <div className="text-xs text-amber-400">
                                                            Research recipes to enable production
                                                      </div>
                                                )}
                                          </div>
                                    )}
                              </div>
                        </div>

                        {/* Build Button */}
                        <Button
                              onClick={() => onBuild(type)}
                              disabled={!canAfford || isBuilt}
                              className={`w-full ${!canAfford || isBuilt
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                        >
                              {isBuilt ? (
                                    <>
                                          <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="mr-2"
                                          >
                                                <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                          Already Built
                                    </>
                              ) : canAfford ? (
                                    <>
                                          <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
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
                                          Build Facility
                                    </>
                              ) : (
                                    <>
                                          <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="mr-2"
                                          >
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                          </svg>
                                          Insufficient Funds
                                    </>
                              )}
                        </Button>
                  </CardContent>
            </Card>
      );
};