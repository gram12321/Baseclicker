
import { useState } from 'react';
import { getBalance, setBalance, getResearch, setResearch } from '../lib/game/gameState';
import { formatCurrency } from '../utils/utils';
import { ResourceType } from '../utils/types';
import { Inventory } from '../lib/inventory';
import { addToGlobalMarket, addToLocalMarket } from '../lib/market/market';
import { setTechLevel, getTechLevel } from '../lib/game/technology';

interface AdminDashboardProps {
      refresh?: () => void;
      inventoryRef?: React.MutableRefObject<Inventory>;
}

export default function AdminDashboard({ refresh, inventoryRef }: AdminDashboardProps) {
      const [balanceInput, setBalanceInput] = useState<string>('');
      const [researchInput, setResearchInput] = useState<string>('');

      const currentBalance = getBalance();
      const currentResearch = getResearch();

      const [resType, setResType] = useState<ResourceType>(ResourceType.Wood);
      const [resAmount, setResAmount] = useState<string>('100');
      const [resQuality, setResQuality] = useState<string>('1.0');
      const [resTarget, setResTarget] = useState<'inventory' | 'local' | 'global'>('inventory');
      const [techInput, setTechInput] = useState<string>('1');

      const handleSetBalance = () => {
            const amount = parseInt(balanceInput.replace(/,/g, ''), 10);
            if (!isNaN(amount)) {
                  setBalance(amount);
                  setBalanceInput('');
                  if (refresh) refresh();
            }
      };

      const handleSetResearch = () => {
            const amount = parseInt(researchInput.replace(/,/g, ''), 10);
            if (!isNaN(amount)) {
                  setResearch(amount);
                  setResearchInput('');
                  if (refresh) refresh();
            }
      };

      const handleAddResource = () => {
            const amount = parseInt(resAmount, 10);
            const quality = parseFloat(resQuality);

            if (!isNaN(amount) && !isNaN(quality)) {
                  if (resTarget === 'inventory' && inventoryRef?.current) {
                        inventoryRef.current.add(resType, amount, quality);
                  } else if (resTarget === 'local') {
                        addToLocalMarket(resType, amount, quality);
                  } else if (resTarget === 'global') {
                        addToGlobalMarket(resType, amount, quality);
                  }
                  if (refresh) refresh();
            }
      };

      const handleSetTech = () => {
            const level = parseInt(techInput, 10);
            if (!isNaN(level)) {
                  setTechLevel(resType, level);
                  if (refresh) refresh();
            }
      };

      return (
            <div className="space-y-6">
                  <div>
                        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
                        <p className="text-sm text-slate-400 mt-1">Manage game state and settings</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Balance Controls */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                              <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                    <span>💰</span> Balance Management
                              </h2>

                              <div className="space-y-4">
                                    <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                                          <span className="text-sm text-slate-400 block mb-1">Current Balance</span>
                                          <span className="text-2xl font-mono text-emerald-400">
                                                {formatCurrency(currentBalance)}
                                          </span>
                                    </div>

                                    <div className="space-y-2">
                                          <label htmlFor="balance-input" className="text-sm font-medium text-slate-300">
                                                Set Balance
                                          </label>
                                          <div className="flex gap-2">
                                                <input
                                                      id="balance-input"
                                                      type="number"
                                                      value={balanceInput}
                                                      onChange={(e) => setBalanceInput(e.target.value)}
                                                      placeholder="Enter amount..."
                                                      className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                                />
                                                <button
                                                      onClick={handleSetBalance}
                                                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 active:translate-y-0.5"
                                                >
                                                      Set
                                                </button>
                                          </div>
                                          <p className="text-xs text-slate-500">
                                                Directly sets the player's balance to this value.
                                          </p>
                                    </div>
                              </div>
                        </div>

                        {/* Research Controls */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                              <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                    <span>🔬</span> Research Management
                              </h2>

                              <div className="space-y-4">
                                    <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                                          <span className="text-sm text-slate-400 block mb-1">Current Research</span>
                                          <span className="text-2xl font-mono text-blue-400">
                                                {currentResearch.toLocaleString()} pts
                                          </span>
                                    </div>

                                    <div className="space-y-2">
                                          <label htmlFor="research-input" className="text-sm font-medium text-slate-300">
                                                Set Research
                                          </label>
                                          <div className="flex gap-2">
                                                <input
                                                      id="research-input"
                                                      type="number"
                                                      value={researchInput}
                                                      onChange={(e) => setResearchInput(e.target.value)}
                                                      placeholder="Enter amount..."
                                                      className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                                />
                                                <button
                                                      onClick={handleSetResearch}
                                                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 active:translate-y-0.5"
                                                >
                                                      Set
                                                </button>
                                          </div>
                                    </div>
                              </div>
                        </div>

                        {/* Inventory Controls */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                              <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                    <span>📦</span> Inventory Management
                              </h2>

                              <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-400">Resource</label>
                                                <select
                                                      value={resType}
                                                      onChange={(e) => setResType(e.target.value as ResourceType)}
                                                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                      {Object.values(ResourceType).map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                      ))}
                                                </select>
                                          </div>
                                          <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-400">Target</label>
                                                <select
                                                      value={resTarget}
                                                      onChange={(e) => setResTarget(e.target.value as 'inventory' | 'local' | 'global')}
                                                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                      <option value="inventory">Player Inventory</option>
                                                      <option value="local">Local Market</option>
                                                      <option value="global">Global Market</option>
                                                </select>
                                          </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-400">Amount</label>
                                                <input
                                                      type="number"
                                                      value={resAmount}
                                                      onChange={(e) => setResAmount(e.target.value)}
                                                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                          </div>
                                          <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-400">Quality</label>
                                                <input
                                                      type="number"
                                                      step="0.1"
                                                      value={resQuality}
                                                      onChange={(e) => setResQuality(e.target.value)}
                                                      className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                          </div>
                                    </div>

                                    <button
                                          onClick={handleAddResource}
                                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20 active:translate-y-0.5"
                                    >
                                          Grant Resources
                                    </button>
                                    <p className="text-[10px] text-slate-500 text-center italic">
                                          * Uses mix quality logic: (Existing × Q + New × Q) / Total
                                    </p>
                              </div>
                        </div>

                        {/* Technology Controls */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                              <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
                                    <span>🔬</span> Technology Management
                              </h2>

                              <div className="space-y-4">
                                    <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 flex justify-between items-center">
                                          <div>
                                                <span className="text-sm text-slate-400 block mb-1">{resType} Tech Level</span>
                                                <span className="text-2xl font-mono text-blue-400">
                                                      Lvl {getTechLevel(resType)}
                                                </span>
                                          </div>
                                    </div>

                                    <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-300">Set {resType} Tech</label>
                                          <div className="flex gap-2">
                                                <input
                                                      type="number"
                                                      value={techInput}
                                                      onChange={(e) => setTechInput(e.target.value)}
                                                      className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                      onClick={handleSetTech}
                                                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                                >
                                                      Set
                                                </button>
                                          </div>
                                    </div>
                              </div>
                        </div>
                  </div>
            </div>
      );
}
