import React from 'react';
import { Button } from '../ui/button';
import { Resource } from '../../resource';
import { ResourceType } from '../../types';
import { formatCurrency } from '../../utils';

interface ProductionCardProps {
      type: ResourceType;
      resource: Resource;
      isActive: boolean;
      onActivate: (type: ResourceType) => void;
      onDeactivate: (type: ResourceType) => void;
      onBuild: (type: ResourceType) => void;
      onUpgrade: (type: ResourceType) => void;
      upgradeCost: number;
}

export const ProductionCard: React.FC<ProductionCardProps> = ({
      type,
      resource,
      isActive,
      onActivate,
      onDeactivate,
      onBuild,
      onUpgrade,
      upgradeCost,
}) => {
      const progress = resource.recipe.workamount
            ? (resource.recipe.workamountCompleted ?? 0) / resource.recipe.workamount
            : 0;

      const isBuilt = resource.productionBuilt;

      return (
            <div className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all
      ${isBuilt
                        ? isActive
                              ? 'border-emerald-500/30 bg-slate-900/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                              : 'border-slate-800 bg-slate-950/60'
                        : 'border-slate-800/50 bg-slate-950/30 opacity-75 grayscale-[0.5]'
                  }`}
            >
                  <div>
                        <div className="flex items-start justify-between">
                              <div>
                                    <div className="text-lg font-bold text-slate-100">{resource.name} Factory</div>
                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                                          <span className={isBuilt ? (isActive ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-500'}>
                                                {isBuilt ? (isActive ? 'Active' : 'Idle') : 'Not Built'}
                                          </span>
                                          {isBuilt && (
                                                <span className="text-slate-500">
                                                      • Level {resource.productionUpgradeLevel}
                                                </span>
                                          )}
                                    </div>
                              </div>
                              <div className="text-right">
                                    <div className="text-xs text-slate-400">Yield</div>
                                    <div className="font-mono text-emerald-400">x{resource.productionMultiplier.toFixed(2)}</div>
                              </div>
                        </div>

                        <div className="mt-4 min-h-[40px] text-sm text-slate-400">
                              {resource.recipe.inputs.length === 0 ? (
                                    <span className="text-slate-500 italic">No inputs required</span>
                              ) : (
                                    <div className="space-y-1">
                                          {resource.recipe.inputs.map((input, idx) => (
                                                <div key={idx} className="flex justify-between">
                                                      <span>{input.resource}</span>
                                                      <span className="text-slate-300">{input.amount}</span>
                                                </div>
                                          ))}
                                    </div>
                              )}
                        </div>
                  </div>

                  <div className="mt-6">
                        {/* Progress Bar */}
                        {resource.recipe.workamount > 0 && isBuilt && (
                              <div className="mb-4">
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                          <span>Production Progress</span>
                                          <span>{Math.floor(progress * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                          <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                                                style={{ width: `${Math.min(progress * 100, 100)}%` }}
                                          />
                                    </div>
                              </div>
                        )}

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                              {!isBuilt ? (
                                    <Button
                                          onClick={() => onBuild(type)}
                                          className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                                    >
                                          Build ({formatCurrency(resource.productionStartCost, { minDecimals: 0 })})
                                    </Button>
                              ) : (
                                    <>
                                          {isActive ? (
                                                <Button
                                                      onClick={() => onDeactivate(type)} variant="outline"
                                                      className="border-slate-700 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-900"
                                                >
                                                      Stop
                                                </Button>
                                          ) : (
                                                <Button
                                                      onClick={() => onActivate(type)}
                                                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-100" // Added text-slate-100
                                                >
                                                      Start
                                                </Button>
                                          )}

                                          <Button
                                                variant="outline"
                                                className="border-slate-700 hover:border-amber-700 hover:bg-amber-950/30 hover:text-amber-400 text-slate-100" // Added text-slate-100
                                                onClick={() => onUpgrade(type)}
                                          >
                                                Upgrade ({formatCurrency(upgradeCost, { minDecimals: 0 })})
                                          </Button>
                                    </>
                              )}
                        </div>
                  </div>
            </div>
      );
};
