import { useState } from 'react';
import {
      getBalance,
      getResearch,
      getResearchers,
      getResearcherCost,
      addResearchers,
      addToBalance,
      getGlobalProductionMultiplier,
} from '../gameState';
import { getGameday } from '../game/gametick';
import { formatCurrency, formatNumber } from '../utils';
import { Resource } from '../resources/resource';
import { ResourceType } from '../types';
import { resources } from '../resources/resourcesRegistry';
import { manageProduction, getProductionCount, getProductionLevel } from '../production';
import { StatCard } from '../components/dashboard/StatCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const resourceEntries = Object.entries(resources) as [ResourceType, Resource][];

interface CompanyOverviewProps {
      refresh: () => void;
}

export default function CompanyOverview({ refresh }: CompanyOverviewProps) {
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
            const cost = getResearcherCost();
            if (balance >= cost) {
                  addToBalance(-cost);
                  addResearchers(1);
                  refresh();
            } else {
                  showNotification(`Insufficient funds to hire Researcher (Cost: ${formatCurrency(cost)})`);
            }
      };

      // Calculate production stats
      const totalFacilities = resourceEntries.reduce((sum, [type]) => sum + getProductionCount(type), 0);
      const activeFacilities = resourceEntries.filter(([type]) => manageProduction(type, 'isActive')).length;

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
                        <p className="text-sm text-slate-400 mt-1">Day {gameDay}</p>
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
                                    {resourceEntries
                                          .filter(([_, resource]) => resource.productionResearched)
                                          .map(([type, resource]) => {
                                                const count = getProductionCount(type);
                                                const level = getProductionLevel(type);
                                                const isActive = manageProduction(type, 'isActive');

                                                if (count === 0) return null;

                                                return (
                                                      <div
                                                            key={type}
                                                            className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/30"
                                                      >
                                                            <div className="flex items-center gap-3">
                                                                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                                                                  <div>
                                                                        <div className="font-medium text-slate-100">{resource.name} Factory</div>
                                                                        <div className="text-xs text-slate-500">
                                                                              {count} {count === 1 ? 'facility' : 'facilities'} • Level {level}
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
            </div>
      );
}
