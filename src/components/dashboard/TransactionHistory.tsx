import React from 'react';
import { formatCurrency } from '../../utils/utils';

interface TransactionLogProps {
      transactions: {
            timestamp: number;
            description: string;
            amount: number;
      }[];
}

export const TransactionHistory: React.FC<TransactionLogProps> = ({ transactions }) => {
      return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                  <h2 className="mb-4 text-lg font-semibold text-slate-100">Transaction History</h2>

                  <div className="h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
                        {transactions.length === 0 ? (
                              <div className="flex h-full flex-col items-center justify-center text-slate-500">
                                    <p>No transactions yet</p>
                                    <p className="text-xs">Trades will appear here</p>
                              </div>
                        ) : (
                              <div className="space-y-2">
                                    {transactions
                                          .slice()
                                          .reverse()
                                          .map((entry) => (
                                                <div
                                                      key={entry.timestamp + entry.description}
                                                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 transition-colors hover:bg-slate-800/60"
                                                >
                                                      <div>
                                                            <div className="text-sm font-medium text-slate-300">{entry.description}</div>
                                                            <div className="text-[10px] text-slate-500">
                                                                  {new Date(entry.timestamp).toLocaleTimeString()}
                                                            </div>
                                                      </div>
                                                      <div className={`font-mono text-sm font-semibold ${entry.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}>
                                                            {formatCurrency(entry.amount, { maxDecimals: 2, minDecimals: 0, showSign: true })}
                                                      </div>
                                                </div>
                                          ))}
                              </div>
                        )}
                  </div>
            </div>
      );
};
