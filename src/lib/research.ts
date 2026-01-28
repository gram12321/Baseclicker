import { ResourceType, RecipeName } from '../utils/types';
import { getResearch, addToResearch } from './game/gameState';
import { ALL_RECIPES } from './recipes/recipes';

/**
 * Track researched recipes globally
 */
export const researchedRecipes: Set<RecipeName> = new Set();

/**
 * Research a specific recipe
 * @param recipeName - The recipe name to research
 * @returns true if research was successful, false otherwise
 */
export function researchRecipe(recipeName: RecipeName): boolean {
      const recipe = ALL_RECIPES[recipeName];

      if (!recipe || researchedRecipes.has(recipeName)) return false;

      const researchCost = Math.max(0, recipe.researchCost);

      if (getResearch() < researchCost) return false;

      researchedRecipes.add(recipeName);
      if (researchCost > 0) {
            addToResearch(-researchCost);
      }
      return true;
}

/**
 * Check if a specific recipe is researched
 * @param recipeName - The recipe name to check
 * @returns true if the recipe is researched, false otherwise
 */
export function isRecipeResearched(recipeName: RecipeName): boolean {
      return researchedRecipes.has(recipeName);
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
