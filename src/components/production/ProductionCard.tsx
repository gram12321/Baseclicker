import { Resource } from '../../resources/resource';
import { ResourceType, BuildingType } from '../../types';
import { formatCurrency } from '../../utils';
import { builtBuildings, Building, BUILDING_RECIPES } from '../../Building';
import { resources } from '../../resources/resourcesRegistry';
import { getResourceIcon } from '../../resourceIcons';

interface ProductionCardProps {
      buildingType: BuildingType;
      isBuilt: boolean;
      isActive: boolean;
      onActivate: (buildingType: BuildingType) => void;
      onDeactivate: (buildingType: BuildingType) => void;
      onUpgrade: (buildingType: BuildingType) => void;
      onBuild: (buildingType: BuildingType) => void;
      upgradeCost: number;
      buildCost: number;
      level: number;
}

export const ProductionCard: React.FC<ProductionCardProps> = ({
      buildingType,
      isBuilt,
      isActive,
      onActivate,
      onDeactivate,
      onUpgrade,
      onBuild,
      upgradeCost,
      buildCost,
      level,
}) => {
      const building = builtBuildings.get(buildingType);
      const [recipeSelected, setRecipeSelected] = useState(building?.hasRecipeSelected() ?? false);

      useEffect(() => {
            const selected = building?.hasRecipeSelected() ?? false;
            setRecipeSelected(selected);
      }, [building]);

      const handleSelectRecipe = (index: number) => {
            if (building?.selectRecipe(index)) {
                  setRecipeSelected(true);
            }
      };

      const currentRecipe = building?.currentRecipe;
      const resource = currentRecipe ? resources[currentRecipe.outputResource] : null;

      const progress = currentRecipe?.workamount
            ? (currentRecipe.workamountCompleted ?? 0) / currentRecipe.workamount
            : 0;

      const outputResource = BUILDING_RECIPES[buildingType]?.output;
      const icon = getResourceIcon(outputResource);

      if (!isBuilt) {
            return (
                  <div className="relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                        <div>
                              <div className="flex items-center gap-2 text-lg font-bold text-slate-100">
                                    {icon} {resources[outputResource].name} Facility
                              </div>
                              <div className="text-sm text-slate-400">Not built yet</div>
                        </div>
                        <Button onClick={() => onBuild(buildingType)} className="mt-4">
                              Build ({formatCurrency(buildCost, { minDecimals: 0 })})
                        </Button>
                  </div>
            );
      }

      return (
            <div className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all
      ${isActive
                        ? 'border-emerald-500/30 bg-slate-900/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'border-slate-800 bg-slate-950/60'
                  }`}
            >
                  <div>
                        <div className="flex items-start justify-between">
                              <div>
                                    <div className="flex items-center gap-2 text-lg font-bold text-slate-100">
                                          {icon} {resources[outputResource].name} Facility
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                                          <span className={isActive ? 'text-emerald-400' : 'text-amber-400'}>
                                                {isActive ? 'Active' : 'Idle'}
                                          </span>
                                          <span className="text-slate-500">
                                                • Level {level}
                                          </span>
                                    </div>
                              </div>
                              <div className="text-right">
                                    <div className="text-xs text-slate-400">Yield</div>
                                    <div className="font-mono text-emerald-400">x{building?.productionMultiplier.toFixed(2)}</div>
                              </div>
                        </div>

                        <div className="mt-4 min-h-[40px] text-sm text-slate-400">
                              {currentRecipe?.inputs.length === 0 ? (
                                    <span className="text-slate-500 italic">No inputs required</span>
                              ) : (
                                    <div className="space-y-1">
                                          {currentRecipe?.inputs.map((input, idx) => (
                                                <div key={idx} className="flex justify-between">
                                                      <span>{input.resource}</span>
                                                      <span className="text-slate-300">{input.amount}</span>
                                                </div>
                                          ))}
                                    </div>
                              )}
                        </div>

                        {/* Recipe Selection */}
                        <div className="mt-4">
                              <div className="text-xs font-medium text-slate-400 mb-2">Recipe</div>
                              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                                    {currentRecipe ? (
                                          <div className="space-y-1">
                                                <div className="text-sm text-slate-300">
                                                      {resource?.name} Production
                                                </div>
                                                {currentRecipe.inputs.length > 0 && (
                                                      <div className="text-xs text-slate-500">
                                                            Requires: {currentRecipe.inputs.map(input => `${input.amount}x ${input.resource}`).join(', ')}
                                                      </div>
                                                )}
                                          </div>
                                    ) : (
                                          <div className="space-y-2">
                                                <div className="text-sm text-slate-500 italic">
                                                      No recipe selected
                                                </div>
                                          </div>
                                    )}
                                    {building && building.recipes.length > 1 && (
                                          <div className="mt-2 space-y-1">
                                                {building.recipes.map((recipe, index) => (
                                                      <Button
                                                            key={index}
                                                            onClick={() => handleSelectRecipe(index)}
                                                            size="sm"
                                                            className={`w-full ${building.currentRecipeIndex === index ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'} text-slate-300`}
                                                      >
                                                            {resources[recipe.outputResource].name}
                                                      </Button>
                                                ))}
                                          </div>
                                    )}
                              </div>
                        </div>
                  </div>

                  <div className="mt-6">
                        {/* Progress Bar */}
                        {currentRecipe?.workamount > 0 && (
                              <div className="mb-4">
                                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                          <span>Production Progress</span>
                                          <span>{Math.floor(progress * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                          <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                                                style={{ width: `${Math.min(progress * 100, 100)}%` }}
                                          />
                                    </div>
                              </div>
                        )}

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                              {isActive ? (
                                    <Button
                                          onClick={() => onDeactivate(buildingType)} variant="outline"
                                          className="border-slate-700 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-900"
                                    >
                                          Stop
                                    </Button>
                              ) : (
                                    <Button
                                          onClick={() => onActivate(buildingType)}
                                          disabled={!recipeSelected}
                                          className={`${
                                                recipeSelected
                                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-100'
                                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                          }`}
                                    >
                                          {recipeSelected ? 'Start' : 'Select Recipe'}
                                    </Button>
                              )}

                              <Button
                                    variant="outline"
                                    className="border-slate-700 hover:border-amber-700 hover:bg-amber-950/30 hover:text-amber-400 text-slate-100"
                                    onClick={() => onUpgrade(buildingType)}
                              >
                                    Upgrade ({formatCurrency(upgradeCost, { minDecimals: 0 })})
                              </Button>
                        </div>
                  </div>
            </div>
      );
};
