import { ResourceType, RecipeName } from '../utils/types';
import { getResearch, addToResearch } from './game/gameState';
import { ALL_RECIPES } from './recipes/recipes';

/**
 * Track researched recipes globally
 */
export const researchedRecipes: Set<RecipeName> = new Set();

/**
 * Research a recipe for a given resource type
 * @param resourceType - The resource type to research
 * @returns true if research was successful, false otherwise
 */
export function researchRecipe(resourceType: ResourceType): boolean {
      const recipe = Object.values(ALL_RECIPES).find(r => r.outputResource === resourceType);

      if (!recipe || researchedRecipes.has(recipe.name)) return false;

      const researchCost = Math.max(0, recipe.researchCost);

      if (getResearch() < researchCost) return false;

      researchedRecipes.add(recipe.name);
      if (researchCost > 0) {
            addToResearch(-researchCost);
      }
      return true;
}

/**
 * Check if a resource's recipe is researched
 * @param resourceType - The resource type to check
 * @returns true if the recipe is researched, false otherwise
 */
export function isRecipeResearched(resourceType: ResourceType): boolean {
      const recipe = Object.values(ALL_RECIPES).find(r => r.outputResource === resourceType);
      return recipe ? researchedRecipes.has(recipe.name) : false;
}

/**
 * Check if a recipe name is researched
 * @param recipeName - The recipe name to check
 * @returns true if the recipe is researched, false otherwise
 */
export function isRecipeNameResearched(recipeName: RecipeName): boolean {
      return researchedRecipes.has(recipeName);
}

/**
 * Reset all researched recipes (for game reset)
 */
export function resetResearch(): void {
      researchedRecipes.clear();
}
