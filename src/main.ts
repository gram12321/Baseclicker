// main.ts - Entry point for the HTML page
import { Inventory } from './inventory';
import { ResourceType } from './resource';
import { resources } from './resourcesRegistry';
import { manageProduction } from './production';
import { tick, getGameday } from './game/gametick';
import { getBalance, setAutoSellEnabled, isAutoSellEnabled, setAutoSellAmount, getAutoSellAmount } from './gameState';
import { getMarketSupply, getTransactionLog, sellResource as sellResourceEconomy } from './economy';
import { formatCurrency } from './utils';

// Game State
let inventory = new Inventory();

// UI Update Functions
function updateBalance() {
  const balance = getBalance();
  document.getElementById('balance')!.textContent = formatCurrency(balance, {
    maxDecimals: 2,
    minDecimals: 2,
  });
}

function updateInventory() {
  const amounts = document.querySelectorAll<HTMLElement>('[data-inventory-amount="true"]');
  amounts.forEach((el) => {
    const type = el.dataset.resourceType as ResourceType | undefined;
    if (!type) return;
    const currentSupply = inventory.getAmount(type);
    el.textContent = currentSupply.toString();
    const priceEl = document.querySelector<HTMLElement>(
      `[data-resource-price="true"][data-resource-type="${type}"]`
    );
    if (priceEl) {
      const marketSupply = getMarketSupply(type);
      const price = resources[type].getCurrentPrice(marketSupply);
      priceEl.textContent = `(${formatCurrency(price, { maxDecimals: 4, minDecimals: 0 })} each)`;
    }
  });
}

function updateProductionStatus() {
  const statuses = document.querySelectorAll<HTMLElement>('[data-production-status="true"]');
  statuses.forEach((el) => {
    const type = el.dataset.resourceType as ResourceType | undefined;
    if (!type) return;
    const isActive = manageProduction(type, 'isActive');
    if (isActive) {
      el.textContent = 'Active';
      el.className = 'production-status status-active';
    } else {
      el.textContent = 'Inactive';
      el.className = 'production-status status-inactive';
    }
  });

  const progressBars = document.querySelectorAll<HTMLElement>('[data-production-progress="true"]');
  progressBars.forEach((el) => {
    const type = el.dataset.resourceType as ResourceType | undefined;
    if (!type) return;
    const resource = resources[type];
    if (!resource || resource.recipe.workamount <= 0) return;
    const progress = ((resource.recipe.workamountCompleted ?? 0) / resource.recipe.workamount) * 100;
    el.style.width = `${Math.min(progress, 100)}%`;
  });
}

function updateTransactionLog() {
  const logEl = document.getElementById('transactionLog');
  if (!logEl) return;
  
  const transactions = getTransactionLog();
  if (transactions.length === 0) {
    logEl.innerHTML = '<div class="info-text">No transactions yet</div>';
    return;
  }

  logEl.innerHTML = transactions.slice().reverse().map(t => {
    const className = t.amount >= 0 ? 'transaction-positive' : 'transaction-negative';
    const time = new Date(t.timestamp).toLocaleTimeString();
    const amount = formatCurrency(t.amount, { maxDecimals: 4, minDecimals: 0, showSign: true });
    return `
      <div class="transaction-item ${className}">
        <strong>${amount}</strong> - ${t.description}
        <div style="font-size: 0.8em; color: #9ca3af; margin-top: 4px;">${time}</div>
      </div>
    `;
  }).join('');
}

function updateGameDay() {
  document.getElementById('gameDay')!.textContent = getGameday().toString();
}

function buildAutoSellControls() {
  const select = document.getElementById('autosell-resource-select') as HTMLSelectElement | null;
  if (!select) return;
  select.innerHTML = '';
  for (const [type, resource] of Object.entries(resources)) {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = resource.name;
    select.appendChild(option);
  }
  updateAutoSellSelection();
}

function updateAutoSellSelection() {
  const select = document.getElementById('autosell-resource-select') as HTMLSelectElement | null;
  const enabledEl = document.getElementById('autosell-enabled') as HTMLInputElement | null;
  const amountEl = document.getElementById('autosell-amount') as HTMLInputElement | null;
  if (!select || !enabledEl || !amountEl || !select.value) return;
  const resourceType = select.value as ResourceType;
  enabledEl.checked = isAutoSellEnabled(resourceType);
  amountEl.value = getAutoSellAmount(resourceType).toString();
}

function updateAutoSellSummary() {
  const summary = document.getElementById('autosell-summary');
  if (!summary) return;
  const enabledResources = Object.entries(resources)
    .filter(([type]) => isAutoSellEnabled(type as ResourceType))
    .map(([, resource]) => resource.name);
  summary.textContent = enabledResources.length
    ? `Enabled: ${enabledResources.join(', ')}`
    : 'Enabled: none';
}

function buildInventory() {
  const container = document.getElementById('inventory');
  if (!container) return;
  container.innerHTML = '';
  for (const [type, resource] of Object.entries(resources)) {
    const resourceType = type as ResourceType;
    const item = document.createElement('div');
    item.className = 'resource-item';

    const label = document.createElement('div');
    const name = document.createElement('span');
    name.className = 'resource-name';
    name.textContent = resource.name;
    const price = document.createElement('span');
    price.className = 'resource-price';
    price.dataset.resourcePrice = 'true';
    price.dataset.resourceType = resourceType;
    const initialPrice = resource.getCurrentPrice(getMarketSupply(resourceType));
    price.textContent = `(${formatCurrency(initialPrice, { maxDecimals: 4, minDecimals: 0 })} each)`;
    label.appendChild(name);
    label.appendChild(price);

    const amount = document.createElement('div');
    amount.className = 'resource-amount';
    amount.dataset.inventoryAmount = 'true';
    amount.dataset.resourceType = resourceType;

    item.appendChild(label);
    item.appendChild(amount);
    container.appendChild(item);
  }
  updateInventory();
}

function buildProduction() {
  const container = document.getElementById('production');
  if (!container) return;
  container.innerHTML = '';
  for (const [type, resource] of Object.entries(resources)) {
    const resourceType = type as ResourceType;
    const item = document.createElement('div');
    item.className = 'resource-item';

    const header = document.createElement('div');
    const name = document.createElement('span');
    name.className = 'resource-name';
    name.textContent = resource.name;
    const status = document.createElement('span');
    status.className = 'production-status status-inactive';
    status.dataset.productionStatus = 'true';
    status.dataset.resourceType = resourceType;
    header.appendChild(name);
    header.appendChild(status);

    const buttons = document.createElement('div');
    buttons.className = 'button-group';
    const activateBtn = document.createElement('button');
    activateBtn.className = 'button button-success';
    activateBtn.textContent = 'Activate';
    activateBtn.addEventListener('click', () => {
      manageProduction(resourceType, 'activate');
      updateProductionStatus();
    });
    const deactivateBtn = document.createElement('button');
    deactivateBtn.className = 'button button-danger';
    deactivateBtn.textContent = 'Deactivate';
    deactivateBtn.addEventListener('click', () => {
      manageProduction(resourceType, 'deactivate');
      updateProductionStatus();
    });
    buttons.appendChild(activateBtn);
    buttons.appendChild(deactivateBtn);

    const info = document.createElement('div');
    info.className = 'info-text';
    if (resource.recipe.inputs.length === 0) {
      info.textContent = 'Base resource - no inputs needed';
    } else {
      const inputs = resource.recipe.inputs
        .map((input) => `${input.amount} ${input.resource}`)
        .join(', ');
      info.textContent = `Requires: ${inputs}`;
    }

    item.appendChild(header);
    item.appendChild(buttons);
    item.appendChild(info);

    if (resource.recipe.workamount > 0) {
      const progress = document.createElement('div');
      progress.className = 'progress-bar';
      const fill = document.createElement('div');
      fill.className = 'progress-fill';
      fill.dataset.productionProgress = 'true';
      fill.dataset.resourceType = resourceType;
      fill.style.width = '0%';
      progress.appendChild(fill);
      item.appendChild(progress);
    }

    container.appendChild(item);
  }
  updateProductionStatus();
}

function buildActionSelectors() {
  const addSelect = document.getElementById('add-resource-select') as HTMLSelectElement | null;
  const sellSelect = document.getElementById('sell-resource-select') as HTMLSelectElement | null;
  if (!addSelect || !sellSelect) return;
  addSelect.innerHTML = '';
  sellSelect.innerHTML = '';
  for (const [type, resource] of Object.entries(resources)) {
    const optionA = document.createElement('option');
    optionA.value = type;
    optionA.textContent = resource.name;
    addSelect.appendChild(optionA);

    const optionB = document.createElement('option');
    optionB.value = type;
    optionB.textContent = resource.name;
    sellSelect.appendChild(optionB);
  }
}

function wireAutoSellSelection() {
  const select = document.getElementById('autosell-resource-select') as HTMLSelectElement | null;
  if (!select) return;
  select.addEventListener('change', () => {
    updateAutoSellSelection();
  });
}

// Game Actions - Expose to window for onclick handlers
(window as any).activateProduction = (resourceType: string) => {
  manageProduction(resourceType as ResourceType, 'activate');
  updateProductionStatus();
};

(window as any).deactivateProduction = (resourceType: string) => {
  manageProduction(resourceType as ResourceType, 'deactivate');
  updateProductionStatus();
};

(window as any).advanceDay = () => {
  tick(inventory);
  updateGameDay();
  updateInventory();
  updateProductionStatus();
  updateBalance();
  updateTransactionLog();
};

(window as any).addResource = (resourceType: string, amount: number) => {
  inventory.add(resourceType as ResourceType, amount);
  updateInventory();
};

(window as any).setAutoSellEnabled = (resourceType: string, enabled: boolean) => {
  setAutoSellEnabled(resourceType as ResourceType, Boolean(enabled));
  updateAutoSellSelection();
  updateAutoSellSummary();
};

(window as any).isAutoSellEnabled = (resourceType: string) => {
  return isAutoSellEnabled(resourceType as ResourceType);
};

(window as any).setAutoSellAmount = (resourceType: string, amount: string) => {
  const parsed = Number.parseInt(amount, 10);
  setAutoSellAmount(resourceType as ResourceType, Number.isFinite(parsed) ? parsed : 1);
  updateAutoSellSelection();
  updateAutoSellSummary();
};

(window as any).applyAutoSellSettings = () => {
  const select = document.getElementById('autosell-resource-select') as HTMLSelectElement | null;
  const enabledEl = document.getElementById('autosell-enabled') as HTMLInputElement | null;
  const amountEl = document.getElementById('autosell-amount') as HTMLInputElement | null;
  if (!select || !enabledEl || !amountEl || !select.value) return;
  const resourceType = select.value as ResourceType;
  const parsed = Number.parseInt(amountEl.value, 10);
  setAutoSellEnabled(resourceType, enabledEl.checked);
  setAutoSellAmount(resourceType, Number.isFinite(parsed) ? parsed : 1);
  updateAutoSellSelection();
  updateAutoSellSummary();
};

(window as any).sellResource = (resourceType: string, amount: number) => {
  const success = sellResourceEconomy(inventory, resourceType as ResourceType, amount);
  if (success) {
    updateInventory();
    updateBalance();
    updateTransactionLog();
  }
  return success;
};

function getSelectedResource(selectId: string): ResourceType | null {
  const select = document.getElementById(selectId) as HTMLSelectElement | null;
  if (!select || !select.value) return null;
  return select.value as ResourceType;
}

(window as any).addSelectedResource = () => {
  const resourceType = getSelectedResource('add-resource-select');
  const amountEl = document.getElementById('add-resource-amount') as HTMLInputElement | null;
  const parsed = Number.parseInt(amountEl?.value ?? '0', 10);
  if (!resourceType || !Number.isFinite(parsed) || parsed <= 0) return;
  inventory.add(resourceType, parsed);
  updateInventory();
};

(window as any).sellSelectedResource = () => {
  const resourceType = getSelectedResource('sell-resource-select');
  const amountEl = document.getElementById('sell-resource-amount') as HTMLInputElement | null;
  const parsed = Number.parseInt(amountEl?.value ?? '0', 10);
  if (!resourceType || !Number.isFinite(parsed) || parsed <= 0) return;
  (window as any).sellResource(resourceType, parsed);
};

// Initialize
updateBalance();
buildInventory();
buildProduction();
buildActionSelectors();
updateGameDay();
updateTransactionLog();
buildAutoSellControls();
wireAutoSellSelection();
updateAutoSellSummary();
