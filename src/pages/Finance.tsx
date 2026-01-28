import { getBalance } from '../game/gameState';
import { getGameday } from '../game/gametick';
import { getTransactionLog } from '../lib/economy';
import { formatCurrency } from '../utils/utils';

// Components
import { TransactionHistory } from '../components/dashboard/TransactionHistory';
import { StatCard } from '../components/dashboard/StatCard';

export default function Finance() {
      const balance = getBalance();
      const gameDay = getGameday();
      const transactions = getTransactionLog();

      // Calculate some financial metrics
      const recentTransactions = transactions.slice(0, 10);
      const totalRevenue = transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = Math.abs(
            transactions
                  .filter(t => t.amount < 0)
                  .reduce((sum, t) => sum + t.amount, 0)
      );
      const netProfit = totalRevenue - totalExpenses;

      return (
            <div className="space-y-6">
                  <div>
                        <h1 className="text-2xl font-bold text-slate-100">Financial Overview</h1>
                        <p className="text-sm text-slate-400 mt-1">Day {gameDay}</p>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                              title="Current Balance"
                              value={formatCurrency(balance, { maxDecimals: 2, minDecimals: 2 })}
                              subtitle="Available Funds"
                              className="border-emerald-500/20 bg-emerald-950/10"
                        />
                        <StatCard
                              title="Total Revenue"
                              value={formatCurrency(totalRevenue, { maxDecimals: 0 })}
                              subtitle="All-Time Sales"
                              className="border-blue-500/20 bg-blue-950/10"
                        />
                        <StatCard
                              title="Total Expenses"
                              value={formatCurrency(totalExpenses, { maxDecimals: 0 })}
                              subtitle="All-Time Costs"
                              className="border-amber-500/20 bg-amber-950/10"
                        />
                        <StatCard
                              title="Net Profit"
                              value={formatCurrency(netProfit, { maxDecimals: 0 })}
                              subtitle={netProfit >= 0 ? "Positive" : "Negative"}
                              className={netProfit >= 0 ? "border-emerald-500/20 bg-emerald-950/10" : "border-rose-500/20 bg-rose-950/10"}
                        />
                  </div>

                  {/* Transaction History */}
                  <TransactionHistory transactions={transactions} />

                  {/* Market Trends Placeholder */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">Market Trends</h3>
                        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-800 text-slate-600">
                              <div className="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                                          <line x1="12" x2="12" y1="20" y2="10" />
                                          <line x1="18" x2="18" y1="20" y2="4" />
                                          <line x1="6" x2="6" y1="20" y2="16" />
                                    </svg>
                                    <p className="text-sm">Chart Placeholder</p>
                                    <p className="text-xs mt-1 text-slate-700">Coming Soon</p>
                              </div>
                        </div>
                  </div>
            </div>
      );
}
