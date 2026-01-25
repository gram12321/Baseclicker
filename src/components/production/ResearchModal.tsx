import { useState } from 'react';
import { Resource } from '../../resource';
import { ResourceType } from '../../types';
import { resources } from '../../resourcesRegistry';
import { formatNumber } from '../../utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

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

      const resourceEntries = Object.entries(resources) as [ResourceType, Resource][];

      // Filter to show only unresearched facilities
      const unresearchedFacilities = resourceEntries.filter(
            ([_, resource]) => !resource.productionResearched
      );

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
                                                Unlock new production facilities
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
                              {unresearchedFacilities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                          <div className="rounded-full bg-emerald-950/30 p-6 mb-4">
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
                                                      className="text-emerald-500"
                                                >
                                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                      <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                          </div>
                                          <h3 className="text-xl font-semibold text-slate-100 mb-2">
                                                All Facilities Researched!
                                          </h3>
                                          <p className="text-slate-400 max-w-md">
                                                You've researched all available production facilities. Check the Production page to build them.
                                          </p>
                                    </div>
                              ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {unresearchedFacilities.map(([type, resource]) => (
                                                <ResearchCard
                                                      key={type}
                                                      type={type}
                                                      resource={resource}
                                                      availableResearch={availableResearch}
                                                      onResearch={handleResearch}
                                                />
                                          ))}
                                    </div>
                              )}
                        </div>
                  </div>
            </div>
      );
};

interface ResearchCardProps {
      type: ResourceType;
      resource: Resource;
      availableResearch: number;
      onResearch: (type: ResourceType) => void;
}

const ResearchCard: React.FC<ResearchCardProps> = ({
      type,
      resource,
      availableResearch,
      onResearch,
}) => {
      const canAfford = availableResearch >= resource.productionResearchCost;

      return (
            <Card className="border-slate-800 bg-slate-950/60 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-200">
                  <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                              <div>
                                    <CardTitle className="text-slate-100 text-lg">{resource.name} Factory</CardTitle>
                                    <CardDescription className="text-slate-400 text-xs mt-1">
                                          Production Facility
                                    </CardDescription>
                              </div>
                              <div className="rounded-full bg-blue-950/50 px-3 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                                    {resource.productionResearchCost} RP
                              </div>
                        </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                        {/* Recipe Information */}
                        <div>
                              <div className="text-xs font-medium text-slate-400 mb-2">Production Recipe</div>
                              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                    {resource.recipe.inputs.length === 0 ? (
                                          <div className="text-sm text-slate-500 italic">
                                                Base resource - No inputs required
                                          </div>
                                    ) : (
                                          <div className="space-y-1">
                                                <div className="text-xs text-slate-500 mb-1">Requires:</div>
                                                {resource.recipe.inputs.map((input, idx) => (
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
                                                {resource.recipe.outputAmount}x {resource.name}
                                          </span>
                                    </div>
                              </div>
                        </div>

                        {/* Research Button */}
                        <Button
                              onClick={() => onResearch(type)}
                              disabled={!canAfford}
                              className={`w-full ${canAfford
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                        >
                              {canAfford ? (
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
                                          Research Facility
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
