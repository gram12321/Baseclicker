import React, { useState } from 'react';
import { Resource } from '../../resources/resource';
import { ResourceType } from '../../types';
import { Button } from '../ui/button';
import { formatCurrency } from '../../utils';

interface ActionPanelProps {
      resources: [ResourceType, Resource][];
      onAdd: (type: ResourceType, amount: number) => void;
      onSell: (type: ResourceType, amount: number) => void;
      onApplyAutosell: (type: ResourceType, enabled: boolean, amount: number) => void;
      enabledAutosells: string[];
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
      resources,
      onAdd,
      onSell,
      onApplyAutosell,
      enabledAutosells,
}) => {
      const [activeTab, setActiveTab] = useState<'manage' | 'autosell'>('manage');

      // Local state for inputs
      const [selectedResource, setSelectedResource] = useState<ResourceType>(resources[0][0]);
      const [amount, setAmount] = useState('1');

      // Autosell state
      const [asResource, setAsResource] = useState<ResourceType>(resources[0][0]);
      const [asAmount, setAsAmount] = useState('1');
      const [asEnabled, setAsEnabled] = useState(false);

      const handleAction = (action: 'add' | 'sell') => {
            const val = parseInt(amount);
            if (val > 0) {
                  if (action === 'add') onAdd(selectedResource, val);
                  if (action === 'sell') onSell(selectedResource, val);
            }
      };

      return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg backdrop-blur-sm">
                  <div className="flex border-b border-slate-800">
                        <button
                              onClick={() => setActiveTab('manage')}
                              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'manage' ? 'bg-slate-800/50 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                        >
                              Manual Actions
                        </button>
                        <button
                              onClick={() => setActiveTab('autosell')}
                              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'autosell' ? 'bg-slate-800/50 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                        >
                              Automation
                        </button>
                  </div>

                  <div className="p-6">
                        {activeTab === 'manage' ? (
                              <div className="space-y-4">
                                    <div className="grid grid-cols-[2fr_1fr] gap-4">
                                          <select
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                value={selectedResource}
                                                onChange={(e) => setSelectedResource(e.target.value as ResourceType)}
                                          >
                                                {resources.map(([type, res]) => (
                                                      <option key={type} value={type}>{res.name}</option>
                                                ))}
                                          </select>
                                          <input
                                                type="number"
                                                min="1"
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                          />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                          <Button
                                                onClick={() => handleAction('add')}
                                                className="bg-slate-800 hover:bg-slate-700 text-slate-200"
                                          >
                                                Add Inventory
                                          </Button>
                                          <Button
                                                onClick={() => handleAction('sell')}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                                          >
                                                Sell Market
                                          </Button>
                                    </div>
                              </div>
                        ) : (
                              <div className="space-y-4">
                                    <div className="grid grid-cols-[2fr_1fr] gap-4">
                                          <select
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                value={asResource}
                                                onChange={(e) => setAsResource(e.target.value as ResourceType)}
                                          >
                                                {resources.map(([type, res]) => (
                                                      <option key={type} value={type}>{res.name}</option>
                                                ))}
                                          </select>
                                          <input
                                                type="number"
                                                min="1"
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                value={asAmount}
                                                onChange={(e) => setAsAmount(e.target.value)}
                                          />
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3">
                                          <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                      type="checkbox"
                                                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
                                                      checked={asEnabled}
                                                      onChange={(e) => setAsEnabled(e.target.checked)}
                                                />
                                                <span className="text-sm font-medium text-slate-300">Enable Auto-Sell</span>
                                          </label>
                                          <Button
                                                size="sm"
                                                onClick={() => onApplyAutosell(asResource, asEnabled, parseInt(asAmount) || 1)}
                                                className="bg-slate-800 hover:bg-slate-700"
                                          >
                                                Save Config
                                          </Button>
                                    </div>

                                    <div className="mt-4 border-t border-slate-800 pt-4">
                                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Active Automations</div>
                                          {enabledAutosells.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                      {enabledAutosells.map(name => (
                                                            <span key={name} className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                                                                  {name}
                                                            </span>
                                                      ))}
                                                </div>
                                          ) : (
                                                <div className="text-sm text-slate-400 italic">No automated sales active</div>
                                          )}
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      );
};
