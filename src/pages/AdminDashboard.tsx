
import { useState } from 'react';
import { getBalance, setBalance, getResearch, setResearch } from '../lib/game/gameState';
import { formatCurrency } from '../utils/utils';
import { ResourceType } from '../utils/types';
import { Inventory } from '../lib/inventory';

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
            if (!isNaN(amount) && inventoryRef?.current) {
                  inventoryRef.current.add(resType, amount);
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
                                    <div className="space-y-2">
                                          <label className="text-sm font-medium text-slate-300">Add Resource</label>
                                          <div className="grid grid-cols-2 gap-2">
                                                <select
                                                      value={resType}
                                                      onChange={(e) => setResType(e.target.value as ResourceType)}
                                                      className="bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                      {Object.values(ResourceType).map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                      ))}
                                                </select>
                                                <input
                                                      type="number"
                                                      value={resAmount}
                                                      onChange={(e) => setResAmount(e.target.value)}
                                                      className="bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                          </div>
                                          <button
                                                onClick={handleAddResource}
                                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20 active:translate-y-0.5"
                                          >
                                                Add to Inventory
                                          </button>
                                    </div>
                              </div>
                        </div>
                  </div>
            </div>
      );
}
