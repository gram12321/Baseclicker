import { ResourceType } from '../utils/types';


export class Resource {
  type: ResourceType;
  name: string;
  localbenchmarksupply: number;
  localinitsupply: number;
  globalbenchmarksupply: number;
  globalinitsupply: number;
  priceModifier: number;

  constructor(
    type: ResourceType,
    name: string,
    localbenchmarksupply: number,
    localinitsupply: number,
    globalbenchmarksupply: number,
    globalinitsupply: number
  ) {
    this.type = type;
    this.name = name;
    this.localbenchmarksupply = localbenchmarksupply;
    this.localinitsupply = localinitsupply;
    this.globalbenchmarksupply = globalbenchmarksupply;
    this.globalinitsupply = globalinitsupply;
    this.priceModifier = 1.0;
  }

  reset(): void {
    // Note: priceModifier is specifically NOT reset here as per requirements
  }

  // Calculate current local price based on supply vs. local benchmark supply.
  getLocalPrice(currentSupply: number = this.localinitsupply, modifiers: number[] = []): number {
    let price = (this.localbenchmarksupply / Math.max(currentSupply, 1)) * this.priceModifier;
    for (const mod of modifiers) {
      price *= mod;
    }
    return price;
  }

  // Calculate current global price based on supply vs. global benchmark supply.
  getGlobalPrice(currentSupply: number = this.globalinitsupply, modifiers: number[] = []): number {
    let price = (this.globalbenchmarksupply / Math.max(currentSupply, 1)) * this.priceModifier;
    for (const mod of modifiers) {
      price *= mod;
    }
    return price;
  }
}
