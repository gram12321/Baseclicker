import React from 'react';

interface StatCardProps {
      title: string;
      value: React.ReactNode;
      subtitle?: string;
      icon?: React.ReactNode;
      className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, className }) => {
      return (
            <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700 ${className}`}>
                  {icon && (
                        <div className="absolute right-6 top-6 text-slate-700 opacity-20">
                              {icon}
                        </div>
                  )}
                  <h3 className="text-sm font-medium uppercase tracking-wider text-slate-400">{title}</h3>
                  <div className="mt-2 text-3xl font-bold text-slate-100">{value}</div>
                  {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
      );
};
