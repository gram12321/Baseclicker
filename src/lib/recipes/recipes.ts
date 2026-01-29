import { Recipe, RecipeName, ResourceType } from '../../utils/types';

export const HarvestWood: Recipe = {
      name: RecipeName.HarvestWood,
      inputs: [
            { resource: ResourceType.Electricity, amount: 0.1 },
      ],
      outputResource: ResourceType.Wood,
      outputAmount: 1,
      workamount: 1,
      researchCost: 0,
};

export const QuarryStone: Recipe = {
      name: RecipeName.QuarryStone,
      inputs: [
            { resource: ResourceType.Electricity, amount: 1 },
      ],
      outputResource: ResourceType.Stone,
      outputAmount: 1,
      workamount: 1,
      researchCost: 10,
};

export const MineIronOre: Recipe = {
      name: RecipeName.MineIronOre,
      inputs: [
            { resource: ResourceType.Electricity, amount: 3 },
      ],
      outputResource: ResourceType.OreBatch,
      outputAmount: 1,
      workamount: 3,
      researchCost: 50,
};

export const SmeltOreBatch: Recipe = {
      name: RecipeName.SmeltOreBatch,
      inputs: [
            { resource: ResourceType.OreBatch, amount: 1 },
            { resource: ResourceType.Coal, amount: 1 },
      ],
      outputResource: ResourceType.Iron,
      outputAmount: 1,
      workamount: 2,
      researchCost: 100,
};

export const GrowGrain: Recipe = {
      name: RecipeName.GrowGrain,
      inputs: [
            { resource: ResourceType.Water, amount: 1 },
      ],
      outputResource: ResourceType.Grain,
      outputAmount: 1,
      workamount: 5,
      researchCost: 5,
};

export const GrowSugar: Recipe = {
      name: RecipeName.GrowSugar,
      inputs: [
            { resource: ResourceType.Water, amount: 4 },
      ],
      outputResource: ResourceType.Sugar,
      outputAmount: 1,
      workamount: 3,
      researchCost: 10,
};

export const BakeBread: Recipe = {
      name: RecipeName.BakeBread,
      inputs: [
            { resource: ResourceType.Grain, amount: 2 },
            { resource: ResourceType.Electricity, amount: 1 },
            { resource: ResourceType.Water, amount: 1 },
      ],
      outputResource: ResourceType.Bread,
      outputAmount: 1,
      workamount: 10,
      researchCost: 100,
};

export const BakeCake: Recipe = {
      name: RecipeName.BakeCake,
      inputs: [
            { resource: ResourceType.Grain, amount: 1 },
            { resource: ResourceType.Sugar, amount: 0.5 },
            { resource: ResourceType.Electricity, amount: 2 },
            { resource: ResourceType.Water, amount: 2 },
      ],
      outputResource: ResourceType.Cake,
      outputAmount: 1,
      workamount: 15,
      researchCost: 250,
};


export const ManualPumping: Recipe = {
      name: RecipeName.ManualPumping,
      inputs: [],
      outputResource: ResourceType.Water,
      outputAmount: 1,
      workamount: 1,
      researchCost: 0,
};

export const ElectricPumping: Recipe = {
      name: RecipeName.ElectricPumping,
      inputs: [
            { resource: ResourceType.Electricity, amount: 1 },
      ],
      outputResource: ResourceType.Water,
      outputAmount: 5,
      workamount: 0.5,
      researchCost: 100,
};

export const MineCoal: Recipe = {
      name: RecipeName.MineCoal,
      inputs: [
            { resource: ResourceType.Electricity, amount: 3 },
      ],
      outputResource: ResourceType.Coal,
      outputAmount: 1,
      workamount: 3,
      researchCost: 1000,
};

export const CoalPower: Recipe = {
      name: RecipeName.CoalPower,
      inputs: [
            { resource: ResourceType.Coal, amount: 1 },
            { resource: ResourceType.Water, amount: 2 },
      ],
      outputResource: ResourceType.Electricity,
      outputAmount: 10,
      workamount: 5,
      researchCost: 2500,
};

export const SolarPower: Recipe = {
      name: RecipeName.SolarPower,
      inputs: [],
      outputResource: ResourceType.Electricity,
      outputAmount: 1,
      workamount: 10,
      researchCost: 50000,
};

export const ALL_RECIPES = {
      [RecipeName.HarvestWood]: HarvestWood,
      [RecipeName.QuarryStone]: QuarryStone,
      [RecipeName.MineIronOre]: MineIronOre,
      [RecipeName.SmeltOreBatch]: SmeltOreBatch,
      [RecipeName.GrowGrain]: GrowGrain,
      [RecipeName.GrowSugar]: GrowSugar,
      [RecipeName.BakeBread]: BakeBread,
      [RecipeName.BakeCake]: BakeCake,
      [RecipeName.ManualPumping]: ManualPumping,
      [RecipeName.ElectricPumping]: ElectricPumping,
      [RecipeName.MineCoal]: MineCoal,
      [RecipeName.CoalPower]: CoalPower,
      [RecipeName.SolarPower]: SolarPower,
};
