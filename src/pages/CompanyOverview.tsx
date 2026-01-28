import { useState, MutableRefObject } from 'react';
import {
      getBalance,
      getResearch,
      getResearchers,
      getResearcherCost,
      hireResearcher,
      getGlobalProductionMultiplier,
} from '../game/gameState';
import { getGameday } from '../game/gametick';
import { formatCurrency, formatNumber } from '../utils/utils';
import { Resource } from '../resources/resource';
import { ResourceType } from '../utils/types';
import { resources } from '../resources/resourcesRegistry';
import { builtBuildings } from '../lib/Building';
import { StatCard } from '../components/dashboard/StatCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { resetGame } from '../game/gameControl';
import { Inventory } from '../lib/inventory';

const resourceEntries = Object.entries(resources) as [ResourceType, Resource][];

interface CompanyOverviewProps {
      inventoryRef?: MutableRefObject<Inventory>;
      refresh: () => void;
}

export default function CompanyOverview({ inventoryRef, refresh }: CompanyOverviewProps) {
      const [errorMsg, setErrorMsg] = useState<string | null>(null);

      const balance = getBalance();
      const research = getResearch();
      const researchers = getResearchers();
      const researcherCost = getResearcherCost();
      const gameDay = getGameday();
      const globalMultiplier = getGlobalProductionMultiplier();

      const showNotification = (msg: string) => {
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(null), 3000);
      };

      const handleHireResearcher = () => {
            if (hireResearcher()) {
                  refresh();
            } else {
                  const cost = getResearcherCost();
                  showNotification(`Insufficient funds to hire Researcher (Cost: ${formatCurrency(cost)})`);
            }
      };

      const handleResetGame = () => {
            if (window.confirm('Are you absolutely sure you want to reset the game? This will erase ALL progress!')) {
                  if (inventoryRef?.current) {
                        resetGame(inventoryRef.current);
                        refresh();
                        alert('Game progress has been cleared.');
                  }
            }
      };

      // Calculate production stats
      const totalFacilities = builtBuildings.size;
      const activeFacilities = Array.from(builtBuildings.values()).filter(building => building.isActive()).length;

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

                  <div>
                        <h1 className="text-2xl font-bold text-slate-100">Company Overview</h1>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatCard
                              title="Balance"
                              value={formatCurrency(balance, { maxDecimals: 2, minDecimals: 2 })}
                              subtitle="Available Funds"
                              className="border-emerald-500/20 bg-emerald-950/10"
                        />
                        <StatCard
                              title="Research"
                              value={formatNumber(research, { compact: true })}
                              subtitle="Research Points"
                              className="border-blue-500/20 bg-blue-950/10"
                        />
                        <StatCard
                              title="Facilities"
                              value={`${activeFacilities}/${totalFacilities}`}
                              subtitle="Active / Total"
                              className="border-purple-500/20 bg-purple-950/10"
                        />
                        <StatCard
                              title="Researchers"
                              value={researchers.toString()}
                              subtitle={`+${researchers} RP/day`}
                              className="border-cyan-500/20 bg-cyan-950/10"
                        />
                        <StatCard
                              title="Global Multiplier"
                              value={`${globalMultiplier.toFixed(2)}x`}
                              subtitle="Production Scaling"
                              className="border-amber-500/20 bg-amber-950/10"
                        />
                  </div>

                  {/* Research & Development */}
                  <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                        <CardHeader>
                              <CardTitle className="text-slate-100">Research & Development</CardTitle>
                              <CardDescription className="text-slate-400">Manage your research team</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-950/50">
                                    <div>
                                          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">Active Researchers</h3>
                                          <div className="text-3xl font-bold text-slate-100 mt-1">{researchers}</div>
                                          <div className="text-xs text-slate-500 mt-1">+{researchers} Research Points per day</div>
                                    </div>
                                    <Button
                                          onClick={handleHireResearcher}
                                          size="lg"
                                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                                    >
                                          Hire Researcher
                                          <div className="text-xs opacity-80 mt-1">
                                                ({formatCurrency(researcherCost, { maxDecimals: 0, showSign: false })})
                                          </div>
                                    </Button>
                              </div>
                        </CardContent>
                  </Card>

                  {/* Production Summary */}
                  <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-sm">
                        <CardHeader>
                              <CardTitle className="text-slate-100">Production Overview</CardTitle>
                              <CardDescription className="text-slate-400">Summary of all production facilities</CardDescription>
                        </CardHeader>
                        <CardContent>
                              <div className="space-y-3">
                                    {Array.from(builtBuildings.entries()).map(([buildingType, building]) => {
                                          const isActive = building.isActive();
                                          const resource = building.currentRecipe ? resources[building.currentRecipe.outputResource] : null;

                                          return (
                                                <div
                                                      key={buildingType}
                                                      className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/30"
                                                >
                                                      <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                                                            <div>
                                                                  <div className="font-medium text-slate-100">{buildingType}</div>
                                                                  <div className="text-xs text-slate-500">
                                                                        Level {building.productionUpgradeLevel} • {resource ? resource.name : 'No recipe'}
                                                                  </div>
                                                            </div>
                                                      </div>
                                                      <div className="text-right">
                                                            <div className="text-sm font-medium text-slate-300">
                                                                  {isActive ? 'Active' : 'Inactive'}
                                                            </div>
                                                      </div>
                                                </div>
                                          );
                                    })}
                                    {totalFacilities === 0 && (
                                          <div className="text-center py-8 text-slate-500">
                                                No production facilities built yet
                                          </div>
                                    )}
                              </div>
                        </CardContent>
                  </Card>

                  {/* Danger Zone */}
                  <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-6 shadow-lg backdrop-blur-sm mt-12">
                        <h2 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                              <span>⚠️</span> Company Liquidation
                        </h2>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-red-950/20 rounded-xl border border-red-900/20">
                              <div>
                                    <h3 className="font-medium text-slate-100 text-base">Full Reset</h3>
                                    <p className="text-sm text-slate-400">
                                          Terminate all operations and wipe all progress, balance, and inventory.
                                    </p>
                              </div>
                              <Button
                                    onClick={handleResetGame}
                                    variant="destructive"
                                    className="w-full md:w-auto px-8 py-6 h-auto font-bold bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20"
                              >
                                    LIQUIDATE ALL ASSETS
                              </Button>
                        </div>
                  </div>
            </div>
      );
}
