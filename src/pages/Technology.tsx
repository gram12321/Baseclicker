import { useState } from 'react';
import { ResourceType } from '../utils/types';
import { getTechLevel, getTechUpgradeCost, upgradeTech } from '../lib/game/technology';
import { getBalance } from '../lib/game/gameState';
import { formatCurrency } from '../utils/utils';
import { getResourceIcon } from '../utils/resourceIcons';

interface TechnologyProps {
      refresh?: () => void;
}

export default function Technology({ refresh }: TechnologyProps) {
      const [, forceUpdate] = useState(0);

      const handleUpgrade = (type: ResourceType) => {
            if (upgradeTech(type)) {
                  forceUpdate(n => n + 1);
                  if (refresh) refresh();
            }
      };

      return (
            <div className="space-y-6">
                  {/* Header */}
                  <div>
                        <h1 className="text-2xl font-bold text-slate-100 mb-1">Technology</h1>
                        <p className="text-slate-400 text-sm">Upgrade specific resource technologies to improve efficiency. These upgrades persist through resets.</p>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.values(ResourceType).map(type => {
                              const level = getTechLevel(type);
                              const cost = getTechUpgradeCost(type);
                              const canAfford = getBalance() >= cost;

                              return (
                                    <div key={type} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                                          <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                      <span className="text-3xl bg-slate-950 p-2 rounded-lg border border-slate-800">{getResourceIcon(type)}</span>
                                                      <div>
                                                            <h3 className="font-semibold text-slate-200">{type} Tech</h3>
                                                            <div className="text-xs text-slate-500 font-mono">Level {level}</div>
                                                      </div>
                                                </div>
                                                <div className="text-right">
                                                      <div className="text-blue-400 font-mono font-medium">+{level} Tech</div>
                                                </div>
                                          </div>

                                          <button
                                                onClick={() => handleUpgrade(type)}
                                                disabled={!canAfford}
                                                className={`w-full py-2 px-4 rounded-lg font-medium transition-all active:translate-y-0.5 border ${canAfford
                                                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-900/20'
                                                            : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                                                      }`}
                                          >
                                                <div className="flex items-center justify-between text-sm">
                                                      <span>Upgrade</span>
                                                      <span className={canAfford ? 'text-blue-100' : 'text-slate-600'}>{formatCurrency(cost)}</span>
                                                </div>
                                          </button>
                                    </div>
                              );
                        })}
                  </div>
            </div>
      );
}
