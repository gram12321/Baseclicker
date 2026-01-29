export enum ResourceType {
      Wood = 'Wood',
      Stone = 'Stone',
      Iron = 'Iron',
      Grain = 'Grain',
      Sugar = 'Sugar',
      Bread = 'Bread',
      Cake = 'Cake',
      Water = 'Water',
      Electricity = 'Electricity',
      Coal = 'Coal',
      OreBatch = 'Ore Batch',
      Slag = 'Slag',
}

export enum BuildingType {
      Forestry = 'Forestry',
      Quarry = 'Quarry',
      Mine = 'Mine',
      Farm = 'Farm',
      Bakery = 'Bakery',
      WaterWell = 'Water Well',
      PowerPlant = 'Power Plant',
      Smelter = 'Smelter',
}

export enum RecipeName {
      HarvestWood = 'Harvest Wood',
      QuarryStone = 'Quarry Stone',
      MineIronOre = 'Mine Iron Ore',
      SmeltOreBatch = 'Smelt Ore Batch',
      GrowGrain = 'Grow Grain',
      GrowSugar = 'Grow Sugar',
      BakeBread = 'Bake Bread',
      BakeCake = 'Bake Cake',
      ManualPumping = 'Manual Pumping',
      ElectricPumping = 'Electric Pumping',
      MineCoal = 'Mine Coal',
      CoalPower = 'Coal Power',
      SolarPower = 'Solar Power',
}

export interface RecipeInput {
      resource: ResourceType;
      amount: number;
}

export interface RecipeOutput {
      resource: ResourceType;
      amount: number;
}

export interface Recipe {
      name: RecipeName;
      inputs: RecipeInput[];
      outputResource: ResourceType;
      outputAmount: number;
      workamount: number;
      researchCost: number;
}

export interface Player {
      balance: number;
      research: number;
      researchers: number;
      productionMultiplier: number;
}

export interface BatchComposition {
      oreType: string;  // e.g., 'IronOre', 'CopperOre'
      yields: Partial<Record<ResourceType, number>>;  // e.g., { Iron: 1.05, Slag: 0.48 }
}

export interface ResourceBatch {
      batchId: string;
      resourceType: ResourceType;
      amount: number;
      quality: number;
      composition?: BatchComposition;
}
