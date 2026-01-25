import React from 'react';

interface HeaderProps {
      day: number;
}

export const Header: React.FC<HeaderProps> = ({ day }) => {
      return (
            <header className="mb-8 text-center">
                  <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow-sm">
                        Baseclicker
                  </h1>
                  <div className="mt-2 text-lg font-medium text-slate-400">
                        Current Day: <span className="text-slate-200">{day}</span>
                  </div>
            </header>
      );
};
