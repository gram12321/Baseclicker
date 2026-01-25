import { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from './inventory';
import { Resource } from './resource';
import { ResourceType } from './types';
import { resources } from './resourcesRegistry';
import {
  manageProduction,
  upgradeProduction,
  getProductionUpgradeCost,
  buildProduction as buildProductionAction,
} from './production';
import { tick, getGameday } from './game/gametick';
import {
  getBalance,
  getResearch,
  setAutoSellEnabled,
  isAutoSellEnabled,
  setAutoSellAmount,
  getAutoSellAmount,
  getResearchers,
  addResearchers,
  getResearcherCost,
  addToBalance,
} from './gameState';
import { sellResource as sellResourceEconomy, getTransactionLog } from './economy';
import { formatCurrency, formatNumber } from './utils';

// Components
import { Header } from './components/layout/Header';
import { StatCard } from './components/dashboard/StatCard';
import { InventoryList } from './components/inventory/InventoryList';
import { ProductionCard } from './components/production/ProductionCard';
import { ActionPanel } from './components/controls/ActionPanel';
import { TransactionHistory } from './components/dashboard/TransactionHistory';
import { Button } from './components/ui/button';

const resourceEntries = Object.entries(resources) as [ResourceType, Resource][];
const defaultResource = resourceEntries[0]?.[0] ?? ResourceType.Wood;

export default function App() {
  const inventoryRef = useRef(new Inventory());
  const [refreshToken, setRefreshToken] = useState(0);

  // Autosell state tracking for UI
  const [enabledAutosells, setEnabledAutosells] = useState<string[]>([]);

  const refresh = () => {
    setRefreshToken((value) => value + 1);
  };

  // Sync autosell list
  useEffect(() => {
    const enabled = resourceEntries
      .filter(([type]) => isAutoSellEnabled(type))
      .map(([, resource]) => resource.name);
    setEnabledAutosells(enabled);
  }, [refreshToken]);

  const balance = getBalance();
  const research = getResearch();
  const researchers = getResearchers();
  const researcherCost = getResearcherCost();
  const gameDay = getGameday();
  const transactions = getTransactionLog();

  const handleAdvanceDay = () => {
    tick(inventoryRef.current);
    refresh();
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

  const handleAddResource = (type: ResourceType, amount: number) => {
    inventoryRef.current.add(type, amount);
    refresh();
  };

  const handleSellResource = (type: ResourceType, amount: number) => {
    const success = sellResourceEconomy(inventoryRef.current, type, amount);
    if (success) refresh();
  };

  const handleApplyAutosell = (type: ResourceType, enabled: boolean, amount: number) => {
    setAutoSellEnabled(type, enabled);
    setAutoSellAmount(type, amount);
    refresh();
  };

  const handleActivate = (type: ResourceType) => {
    manageProduction(type, 'activate');
    refresh();
  };

  const handleDeactivate = (type: ResourceType) => {
    manageProduction(type, 'deactivate');
    refresh();
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Error Notification Toast */}
        {errorMsg && (
          <div className="fixed top-4 right-4 z-50 rounded-lg border border-rose-500 bg-rose-950/90 px-4 py-3 text-rose-200 shadow-lg backdrop-blur animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
          </div>
        )}

        <Header day={gameDay} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Stats & Inventory */}
          <div className="space-y-6 lg:col-span-1">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">Researchers</h3>
                <div className="text-2xl font-bold text-slate-100">{researchers}</div>
                <div className="text-xs text-slate-500">+{researchers} RP/day</div>
              </div>
              <Button onClick={handleHireResearcher} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                Hire ({formatCurrency(researcherCost, { maxDecimals: 0, showSign: false })})
              </Button>
            </div>

            <ActionPanel
              resources={resourceEntries}
              onAdd={handleAddResource}
              onSell={handleSellResource}
              onApplyAutosell={handleApplyAutosell}
              enabledAutosells={enabledAutosells}
            />

            <InventoryList
              resources={resourceEntries}
              inventory={inventoryRef.current}
            />
          </div>

          {/* Middle Column: Production */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Production Facilities</h2>
                <Button onClick={handleAdvanceDay} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Advance Day
                </Button>
              </div>

              <div className="space-y-4">
                {resourceEntries.map(([type, resource]) => (
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
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: History & Logs */}
          <div className="space-y-6 lg:col-span-1">
            <TransactionHistory transactions={transactions} />

            {/* Placeholder for future charts or news */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm opacity-50">
              <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">Market Trends</h3>
              <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-800 text-slate-600">
                Chart Placeholder
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
