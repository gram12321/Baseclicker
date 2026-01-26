import { useState } from 'react';
import { Resource } from '../resources/resource';
import { ResourceType } from '../types';
import { resources } from '../resources/resourcesRegistry';
import {
      manageProduction,
      upgradeProduction,
      getProductionUpgradeCost,
      buildProduction as buildProductionAction,
      researchProduction,
} from '../production';
import { tick, getGameday } from '../game/gametick';
import { getBalance, getResearch } from '../gameState';
import { formatCurrency } from '../utils';
import { Inventory } from '../inventory';

// Components
import { ProductionCard } from '../components/production/ProductionCard';
import { ResearchModal } from '../components/production/ResearchModal';
import { Button } from '../components/ui/button';

const resourceEntries = Object.entries(resources) as [ResourceType, Resource][];

interface ProductionProps {
      inventoryRef: React.MutableRefObject<Inventory>;
      refresh: () => void;
}

export default function Production({ inventoryRef, refresh }: ProductionProps) {
      const [errorMsg, setErrorMsg] = useState<string | null>(null);
      const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
      const balance = getBalance();
      const research = getResearch();
      const gameDay = getGameday();

      const showNotification = (msg: string) => {
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(null), 3000);
      };



      const handleActivate = (type: ResourceType) => {
            manageProduction(type, 'activate');
            refresh();
      };

      const handleDeactivate = (type: ResourceType) => {
            manageProduction(type, 'deactivate');
            refresh();
      };

      const handleBuildProduction = (type: ResourceType) => {
            if (buildProductionAction(type)) {
                  refresh();
            } else {
                  showNotification(`Insufficient funds to build ${type} Factory`);
            }
      };

      const handleUpgradeProduction = (type: ResourceType) => {
            if (upgradeProduction(type).success) {
                  refresh();
            } else {
                  showNotification(`Insufficient funds to upgrade ${type} Factory`);
            }
      };

      const handleResearch = (type: ResourceType) => {
            if (researchProduction(type)) {
                  showNotification(`Successfully researched ${type} Factory!`);
                  refresh();
            } else {
                  showNotification(`Insufficient research points to research ${type} Factory`);
            }
      };

      // Filter to only show researched facilities
      const researchedFacilities = resourceEntries.filter(
            ([_, resource]) => resource.productionResearched
      );

      // Check if there are any unresearched facilities
      const hasUnresearchedFacilities = resourceEntries.some(
            ([_, resource]) => !resource.productionResearched
      );

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

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                        <div className="mb-6 flex items-center justify-between">
                              <div>
                                    <h1 className="text-2xl font-bold text-slate-100">Production Facilities</h1>
                                    <p className="text-sm text-slate-400 mt-1">Day {gameDay} • Balance: {formatCurrency(balance, { maxDecimals: 2, minDecimals: 2 })}</p>
                              </div>
                              <div className="flex gap-3">
                                    {hasUnresearchedFacilities && (
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
                                                Research Facilities
                                          </Button>
                                    )}
                              </div>
                        </div>

                        <div className="space-y-4">
                              {researchedFacilities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                          <div className="rounded-full bg-blue-950/30 p-6 mb-4">
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
                                                      className="text-blue-500"
                                                >
                                                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                </svg>
                                          </div>
                                          <h3 className="text-xl font-semibold text-slate-100 mb-2">
                                                No Facilities Researched Yet
                                          </h3>
                                          <p className="text-slate-400 max-w-md mb-6">
                                                Research production facilities to unlock them for building. Click the "Research Facilities" button to get started.
                                          </p>
                                          {hasUnresearchedFacilities && (
                                                <Button
                                                      onClick={() => setIsResearchModalOpen(true)}
                                                      size="lg"
                                                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                                                >
                                                      Open Research Lab
                                                </Button>
                                          )}
                                    </div>
                              ) : (
                                    researchedFacilities.map(([type, resource]) => (
                                          <ProductionCard
                                                key={type}
                                                type={type}
                                                resource={resource}
                                                isActive={manageProduction(type, 'isActive')}
                                                onActivate={handleActivate}
                                                onDeactivate={handleDeactivate}
                                                onBuild={handleBuildProduction}
                                                onUpgrade={handleUpgradeProduction}
                                                upgradeCost={getProductionUpgradeCost(type)}
                                          />
                                    ))
                              )}
                        </div>
                  </div>
            </div>
      );
}
