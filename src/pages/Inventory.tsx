import { useState, useEffect } from 'react';
import { Resource } from '../resource';
import { ResourceType } from '../types';
import { resources } from '../resourcesRegistry';
import {
      isAutoSellEnabled,
      setAutoSellEnabled,
      setAutoSellAmount,
} from '../gameState';
import { getGameday } from '../game/gametick';
import { sellResource as sellResourceEconomy } from '../economy';
import { Inventory } from '../inventory';

// Components
import { InventoryList } from '../components/inventory/InventoryList';
import { ActionPanel } from '../components/controls/ActionPanel';

const resourceEntries = Object.entries(resources) as [ResourceType, Resource][];

interface InventoryPageProps {
      inventoryRef: React.MutableRefObject<Inventory>;
      refresh: () => void;
      refreshToken: number;
}

export default function InventoryPage({ inventoryRef, refresh, refreshToken }: InventoryPageProps) {
      const [enabledAutosells, setEnabledAutosells] = useState<string[]>([]);
      const gameDay = getGameday();

      // Sync autosell list
      useEffect(() => {
            const enabled = resourceEntries
                  .filter(([type]) => isAutoSellEnabled(type))
                  .map(([, resource]) => resource.name);
            setEnabledAutosells(enabled);
      }, [refreshToken]);

      const handleAddResource = (type: ResourceType, amount: number) => {
            inventoryRef.current.add(type, amount);
            refresh();
      };

      const handleSellResource = (type: ResourceType, amount: number) => {
            const success = sellResourceEconomy(inventoryRef.current, type, amount);
            if (success) refresh();
      };

      const handleApplyAutosell = (type: ResourceType, enabled: boolean, amount: number) => {
            setAutoSellEnabled(type, enabled);
            setAutoSellAmount(type, amount);
            refresh();
      };

      return (
            <div className="space-y-6">
                  <div>
                        <h1 className="text-2xl font-bold text-slate-100">Inventory Management</h1>
                        <p className="text-sm text-slate-400 mt-1">Day {gameDay}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Actions */}
                        <div className="space-y-6">
                              <ActionPanel
                                    resources={resourceEntries}
                                    onAdd={handleAddResource}
                                    onSell={handleSellResource}
                                    onApplyAutosell={handleApplyAutosell}
                                    enabledAutosells={enabledAutosells}
                              />
                        </div>

                        {/* Right Column: Inventory List */}
                        <div className="space-y-6">
                              <InventoryList
                                    resources={resourceEntries}
                                    inventory={inventoryRef.current}
                              />
                        </div>
                  </div>
            </div>
      );
}
