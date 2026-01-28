
import React, { useState, useEffect } from 'react';
import { achievementService } from '../achievements/achievementService';
import { AchievementConfig, AchievementStatus, AchievementCategory } from '../achievements/types';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const AchievementsPage: React.FC = () => {
      const [achievements, setAchievements] = useState<(AchievementConfig & AchievementStatus)[]>([]);
      const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'All'>('All');

      useEffect(() => {
            setAchievements(achievementService.getAllStatuses());

            // Refresh every second to show progress
            const interval = setInterval(() => {
                  setAchievements(achievementService.getAllStatuses());
            }, 1000);

            return () => clearInterval(interval);
      }, []);

      const filterBySeries = (list: (AchievementConfig & AchievementStatus)[]) => {
            const seriesMap = new Map<string, (AchievementConfig & AchievementStatus)[]>();
            const result: (AchievementConfig & AchievementStatus)[] = [];

            list.forEach(a => {
                  if (a.id.includes('_tier_')) {
                        const baseId = a.id.split('_tier_')[0];
                        if (!seriesMap.has(baseId)) seriesMap.set(baseId, []);
                        seriesMap.get(baseId)!.push(a);
                  } else {
                        result.push(a);
                  }
            });

            seriesMap.forEach(series => {
                  const sorted = series.sort((a, b) => a.level - b.level);
                  let foundOneLocked = false;

                  sorted.forEach(a => {
                        if (a.unlocked) {
                              result.push(a);
                        } else if (!foundOneLocked) {
                              result.push(a);
                              foundOneLocked = true;
                        }
                  });
            });

            return result;
      };

      const baseList = selectedCategory === 'All'
            ? achievements
            : achievements.filter(a => a.category === selectedCategory);

      const filteredAchievements = filterBySeries(baseList);

      const categories: (AchievementCategory | 'All')[] = ['All', 'Wealth', 'Knowledge', 'Productivity', 'Resources', 'Infrastructure'];

      return (
            <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                              <h1 className="text-3xl font-bold text-slate-100">Achievements</h1>
                              <p className="text-slate-400">Track your progress toward becoming a base clicking legend.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                              {categories.map(cat => (
                                    <button
                                          key={cat}
                                          onClick={() => setSelectedCategory(cat)}
                                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                                }`}
                                    >
                                          {cat}
                                    </button>
                              ))}
                        </div>
                  </div>

                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAchievements.map(achievement => (
                              <Card
                                    key={achievement.id}
                                    className={`border-slate-800 transition-all ${achievement.unlocked
                                          ? 'bg-slate-900/80 border-emerald-500/30'
                                          : 'bg-slate-900/40 opacity-60'
                                          }`}
                              >
                                    <CardContent className="p-5 pt-5">
                                          <div className="flex items-start gap-4">
                                                <div className={`text-3xl p-3 rounded-xl ${achievement.unlocked ? 'bg-emerald-500/10' : 'bg-slate-800'
                                                      }`}>
                                                      {achievement.unlocked ? achievement.icon : '🔒'}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                      <div className="flex items-center justify-between">
                                                            <h3 className={`font-bold transition-colors ${achievement.unlocked ? 'text-emerald-400' : 'text-slate-400'
                                                                  }`}>
                                                                  {achievement.name}
                                                            </h3>
                                                            <Badge variant="outline" className="text-[10px] uppercase border-slate-700 text-slate-500">
                                                                  Lvl {achievement.level}
                                                            </Badge>
                                                      </div>
                                                      <p className="text-sm text-slate-400 leading-relaxed">
                                                            {achievement.description}
                                                      </p>

                                                      {!achievement.unlocked && (
                                                            <div className="mt-4 space-y-1.5">
                                                                  <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                                                        <span>Progress</span>
                                                                        <span>{Math.floor(achievement.progress)}%</span>
                                                                  </div>
                                                                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                                        <div
                                                                              className="h-full bg-emerald-600 transition-all duration-500"
                                                                              style={{ width: `${achievement.progress}%` }}
                                                                        />
                                                                  </div>
                                                            </div>
                                                      )}

                                                      {achievement.unlocked && (
                                                            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-500/80">
                                                                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                  Unlocked
                                                            </div>
                                                      )}
                                                </div>
                                          </div>
                                    </CardContent>
                              </Card>
                        ))}
                  </div>
            </div>
      );
};

export default AchievementsPage;
