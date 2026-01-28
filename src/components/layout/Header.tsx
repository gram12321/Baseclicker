import React from 'react';
import { Button } from '../ui/button';
import { formatCurrency } from '../../utils/utils';
import { Coins, Calendar, ChevronRight } from 'lucide-react';

interface HeaderProps {
      day: number;
      balance: number;
      onAdvanceDay: () => void;
}

export const Header: React.FC<HeaderProps> = ({ day, balance, onAdvanceDay }) => {
      return (
            <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                  {/* Decorative background element */}
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-1000" />

                  <div className="flex flex-col items-center md:items-start relative">
                        <h1 className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-3xl font-black tracking-tighter text-transparent drop-shadow-sm">
                              ANTIGRAVITY <span className="text-slate-500 font-light ml-1 opacity-50 text-xl tracking-normal">BASECLICKER</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    V-0.4.2 <span className="text-slate-700">|</span> PRODUCTION STAGE
                              </div>
                        </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 relative">
                        {/* Day Display */}
                        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/50 shadow-inner group/day">
                              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover/day:scale-110 transition-transform">
                                    <Calendar className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Timeline</span>
                                    <div className="text-sm font-mono font-bold text-slate-100 uppercase">
                                          Day <span className="text-indigo-400">{day}</span>
                                    </div>
                              </div>
                        </div>

                        {/* Balance Display */}
                        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/50 shadow-inner group/balance">
                              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 group-hover/balance:rotate-12 transition-transform">
                                    <Coins className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Liquid Assets</span>
                                    <div className="text-lg font-mono font-bold text-emerald-400 tracking-tighter leading-none">
                                          {formatCurrency(balance, { maxDecimals: 2, minDecimals: 2 })}
                                    </div>
                              </div>
                        </div>

                        {/* Advance Day Button */}
                        <Button
                              onClick={onAdvanceDay}
                              size="lg"
                              className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-tight shadow-xl shadow-indigo-900/30 ring-1 ring-indigo-400/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 group/btn"
                        >
                              <span>TERMINATE CYCLE</span>
                              <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                  </div>
            </header>
      );
};
