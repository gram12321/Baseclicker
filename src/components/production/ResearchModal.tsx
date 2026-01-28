import React from 'react';
import { Resource } from '../../resources/resource';
import { ResourceType, Recipe } from '../../utils/types';
import { resources } from '../../resources/resourcesRegistry';
import { formatNumber } from '../../utils/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ALL_RECIPES } from '../../recipes/recipes';
import { isRecipeResearched } from '../../Building';

interface ResearchModalProps {
      isOpen: boolean;
      onClose: () => void;
      onResearch: (type: ResourceType) => void;
      availableResearch: number;
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
      isOpen,
      onClose,
      onResearch,
      availableResearch,
}) => {
      if (!isOpen) return null;

      // Show all recipes
      const allRecipes = Object.values(ALL_RECIPES);

      const handleResearch = (type: ResourceType) => {
            onResearch(type);
      };

      return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm px-6 py-4">
                              <div className="flex items-center justify-between">
                                    <div>
                                          <h2 className="text-2xl font-bold text-slate-100">Research & Development</h2>
                                          <p className="text-sm text-slate-400 mt-1">
                                                Research production recipes to unlock building facilities
                                          </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                          <div className="text-right">
                                                <div className="text-xs text-slate-400">Available Research</div>
                                                <div className="text-xl font-bold text-blue-400">
                                                      {formatNumber(availableResearch, { compact: true })} RP
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
                                    {allRecipes.map((recipe) => (
                                          <ResearchCard
                                                key={recipe.name}
                                                recipe={recipe}
                                                availableResearch={availableResearch}
                                                onResearch={handleResearch}
                                          />
                                    ))}
                              </div>
                        </div>
                  </div>
            </div>
      );
};

interface ResearchCardProps {
      recipe: Recipe;
      availableResearch: number;
      onResearch: (type: ResourceType) => void;
}

const ResearchCard: React.FC<ResearchCardProps> = ({
      recipe,
      availableResearch,
      onResearch,
}) => {
      const isResearched = isRecipeResearched(recipe.outputResource);
      const canAfford = !isResearched && availableResearch >= recipe.researchCost;

      return (
            <Card className={`border-slate-800 backdrop-blur-sm transition-all duration-200 ${isResearched
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-950/60 hover:border-blue-500/30'
                  }`}>
                  <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                              <div>
                                    <CardTitle className={`text-lg ${isResearched ? 'text-emerald-100' : 'text-slate-100'}`}>
                                          {recipe.name}
                                    </CardTitle>
                                    <CardDescription className={`text-xs mt-1 ${isResearched ? 'text-emerald-400' : 'text-slate-400'}`}>
                                          {isResearched ? 'Researched' : 'Production Recipe'}
                                    </CardDescription>
                              </div>
                              <div className={`rounded-full px-3 py-1 text-xs font-medium border ${isResearched
                                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20'
                                    : 'bg-blue-950/50 text-blue-400 border-blue-500/20'
                                    }`}>
                                    {isResearched ? '✓' : `${recipe.researchCost} RP`}
                              </div>
                        </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                        {/* Recipe Information */}
                        <div>
                              <div className="text-xs font-medium text-slate-400 mb-2">Production Recipe</div>
                              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                    {recipe.inputs.length === 0 ? (
                                          <div className="text-sm text-slate-500 italic">
                                                Base resource - No inputs required
                                          </div>
                                    ) : (
                                          <div className="space-y-1">
                                                <div className="text-xs text-slate-500 mb-1">Requires:</div>
                                                {recipe.inputs.map((input, idx) => (
                                                      <div key={idx} className="flex justify-between text-sm">
                                                            <span className="text-slate-400">{input.resource}</span>
                                                            <span className="text-slate-300 font-medium">{input.amount}x</span>
                                                      </div>
                                                ))}
                                          </div>
                                    )}
                                    <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-sm">
                                          <span className="text-slate-400">Produces:</span>
                                          <span className="text-emerald-400 font-medium">
                                                {recipe.outputAmount}x {resources[recipe.outputResource].name}
                                          </span>
                                    </div>
                              </div>
                        </div>

                        {/* Research Button */}
                        <Button
                              onClick={() => onResearch(recipe.outputResource)}
                              disabled={isResearched || !canAfford}
                              className={`w-full ${isResearched
                                    ? 'bg-emerald-600 text-white cursor-not-allowed opacity-75'
                                    : canAfford
                                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                        >
                              {isResearched ? (
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
                                          Already Researched
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
                                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                          </svg>
                                          Research Recipe
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
                                          Insufficient Research Points
                                    </>
                              )}
                        </Button>
                  </CardContent>
            </Card>
      );
};
