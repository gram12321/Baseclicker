import React, { useRef, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Inventory } from './lib/inventory';

// Pages
import Production from './pages/Production';
import Finance from './pages/Finance';
import InventoryPage from './pages/Inventory';
import CompanyOverview from './pages/CompanyOverview';
import AdminDashboard from './pages/AdminDashboard';
import Achievements from './pages/Achievements';

// Components
import { Header } from './components/layout/Header';
import { getGameday, tick } from './lib/game/gametick';
import { achievementService } from './achievements/achievementService';
import { getBalance } from './lib/game/gameState';

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview', icon: '📊' },
    { path: '/production', label: 'Production', icon: '🏭' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/finance', label: 'Finance', icon: '💰' },
    { path: '/achievements', label: 'Achievements', icon: '🏆' },
    { path: '/admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <nav className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-2 shadow-lg backdrop-blur-sm">
      <div className="flex gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                font-medium transition-all duration-200
                ${isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AppContent() {
  const inventoryRef = useRef(new Inventory());
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    achievementService.setInventory(inventoryRef.current);
  }, []);

  const refresh = () => {
    setRefreshToken((value) => value + 1);
  };

  const gameDay = getGameday();
  const balance = getBalance();

  const handleAdvanceDay = () => {
    tick(inventoryRef.current);
    refresh();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header day={gameDay} balance={balance} onAdvanceDay={handleAdvanceDay} />

        <Navigation />

        <Routes>
          <Route
            path="/"
            element={<CompanyOverview inventoryRef={inventoryRef} refresh={refresh} />}
          />
          <Route
            path="/production"
            element={<Production refresh={refresh} inventoryRef={inventoryRef} />}
          />
          <Route
            path="/inventory"
            element={<InventoryPage inventoryRef={inventoryRef} refresh={refresh} refreshToken={refreshToken} />}
          />
          <Route
            path="/finance"
            element={<Finance />}
          />
          <Route
            path="/achievements"
            element={<Achievements />}
          />
          <Route
            path="/admin"
            element={<AdminDashboard refresh={refresh} inventoryRef={inventoryRef} />}
          />
        </Routes>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
