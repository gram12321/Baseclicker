import { useState, useEffect } from 'react';
import { Resource } from '../resources/resource';
import { ResourceType } from '../utils/types';
import { resources } from '../resources/resourcesRegistry';
import {
      isAutoSellEnabled,
      setAutoSellEnabled,
      setAutoSellAmount,
      getAutoSellAmount,
} from '../gameState';
import { getGameday } from '../game/gametick';
import { sellResource as sellResourceEconomy } from '../economy';
import { Inventory } from '../inventory';

// Components
import { InventoryList } from '../components/inventory/InventoryList';

const resourceEntries = Object.entries(resources) as [ResourceType, Resource][];

interface InventoryPageProps {
      inventoryRef: React.MutableRefObject<Inventory>;
      refresh: () => void;
      refreshToken: number;
}

export default function InventoryPage({ inventoryRef, refresh, refreshToken }: InventoryPageProps) {
      const gameDay = getGameday();

      const handleSellResource = (type: ResourceType, amount: number) => {
            const success = sellResourceEconomy(inventoryRef.current, type, amount);
            if (success) refresh();
      };

      const handleToggleAutosell = (type: ResourceType, enabled: boolean, amount: number) => {
            setAutoSellEnabled(type, enabled);
            setAutoSellAmount(type, amount);
            refresh();
      };

      return (
            <div className="space-y-6">
                  <div>
                        <h1 className="text-2xl font-bold text-slate-100">Market & Inventory</h1>
                  </div>

                  <div className="w-full">
                        <InventoryList
                              resources={resourceEntries}
                              inventory={inventoryRef.current}
                              onSell={handleSellResource}
                              onToggleAutosell={handleToggleAutosell}
                              isAutosellEnabled={isAutoSellEnabled}
                              getAutoSellAmount={getAutoSellAmount}
                        />
                  </div>
            </div>
      );
}
