/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LevelData, GameProgress } from '../types';
import { LEVELS } from '../levels';
import { Star, Lock, EyeOff, Award, Flame, Snowflake, Compass, Eye } from 'lucide-react';
import { gameAudio } from '../audio';

interface LevelSelectorProps {
  progress: GameProgress;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({ progress, onSelectLevel, onClose }) => {
  const getLevelStatus = (level: LevelData) => {
    if (level.isSecret) {
      const isUnlocked = progress.unlockedLevels.includes(level.id);
      return { unlocked: isUnlocked, label: isUnlocked ? '已解锁' : '未探索' };
    } else {
      // Main levels are unlocked in order: 1 is always unlocked, 2 requires 1 beaten, etc.
      if (level.id === 1) return { unlocked: true, label: '可挑战' };
      const previousLevelId = level.id - 1;
      const isBeaten = progress.stars[previousLevelId] !== undefined;
      return { unlocked: isBeaten, label: isBeaten ? '可挑战' : '未解锁' };
    }
  };

  const handleSelect = (level: LevelData, unlocked: boolean) => {
    if (unlocked) {
      gameAudio.playCoin();
      onSelectLevel(level.id);
    } else {
      gameAudio.playHurt();
    }
  };

  const getBiomeBadge = (biome: LevelData['biome']) => {
    switch (biome) {
      case 'grassland':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono">🍀 辽阔草原</span>;
      case 'forest':
        return <span className="bg-teal-950 text-teal-300 border border-teal-800 text-[10px] px-2 py-0.5 rounded font-mono">🌲 茂密森林</span>;
      case 'desert':
        return <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] px-2 py-0.5 rounded font-mono">🏜️ 荒芜沙漠</span>;
      case 'ice':
        return <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] px-2 py-0.5 rounded font-mono">❄️ 极寒冰川</span>;
      case 'volcano':
        return <span className="bg-red-950 text-red-300 border border-red-800 text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1"><Flame className="w-3 h-3 text-red-400 animate-pulse"/> 炽热火山</span>;
      case 'mineshaft':
        return <span className="bg-orange-950 text-orange-300 border border-orange-800 text-[10px] px-2 py-0.5 rounded font-mono">⛏️ 地下铁轨</span>;
      case 'cloud':
        return <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-2 py-0.5 rounded font-mono">☁️ 云顶浮空</span>;
      case 'deepsea':
        return <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] px-2 py-0.5 rounded font-mono">💧 海底深渊</span>;
      case 'ender':
        return <span className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px] px-2 py-0.5 rounded font-mono">👁️ 末地虚空</span>;
    }
  };

  const mainLevels = LEVELS.filter(l => !l.isSecret);
  const secretLevels = LEVELS.filter(l => l.isSecret);

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#262626] border-4 border-black rounded-xl shadow-2xl flex flex-col max-h-[92vh] text-white">
        
        {/* Header */}
        <div className="bg-[#1b1b1b] p-4 border-b-4 border-black flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Compass className="w-8 h-8 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold font-sans text-emerald-400 flex items-center gap-2">
                方块大陆关卡图鉴 <span className="text-xs text-gray-400 font-mono">LEVEL DIRECTORY</span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                主线关卡通关后解锁后续世界；隐秘传送门在主线游玩中需要仔细寻找并触碰方能激活！
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 border-2 border-black rounded text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer"
          >
            ❌ 关闭
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#2c2c2c] space-y-8">
          
          {/* Main Levels Deck */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-emerald-400 font-mono tracking-wider border-b border-gray-600 pb-1 flex items-center gap-2">
              🧭 主线闯关大陆 (PROGRESS: {Object.keys(progress.stars).length}/5)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {mainLevels.map((level) => {
                const { unlocked, label } = getLevelStatus(level);
                const stars = progress.stars[level.id] || 0;
                const bestTime = progress.bestTime[level.id];

                return (
                  <div
                    key={level.id}
                    onClick={() => handleSelect(level, unlocked)}
                    className={`border-4 rounded-xl p-4 flex flex-col justify-between min-h-[170px] relative overflow-hidden transition-all duration-300 ${
                      unlocked
                        ? 'bg-gray-800 border-emerald-800 hover:border-emerald-500 hover:-translate-y-1 cursor-pointer shadow-lg'
                        : 'bg-black/40 border-gray-900 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Level Number Watermark */}
                    <div className="absolute -bottom-4 -right-2 text-8xl font-black font-mono text-white/5 select-none pointer-events-none">
                      {level.id}
                    </div>

                    <div className="space-y-2 z-10">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-semibold text-gray-400">关卡 0{level.id}</span>
                        {getBiomeBadge(level.biome)}
                      </div>
                      <h4 className="font-bold text-sm text-white line-clamp-1">{level.name.split(':')[1] || level.name}</h4>
                      <p className="text-[11px] text-gray-400 leading-tight line-clamp-3">{level.description}</p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-gray-700/60 flex justify-between items-end z-10">
                      {/* Rating stars */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-3.5 h-3.5 ${
                              starIdx <= stars
                                ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>

                      {unlocked ? (
                        <div className="text-right">
                          {bestTime ? (
                            <span className="text-[9px] font-mono text-emerald-400 block">⚡ {bestTime.toFixed(1)}s</span>
                          ) : (
                            <span className="text-[9px] font-mono text-yellow-500 block">待挑战</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-right text-gray-500">
                          <Lock className="w-4 h-4 ml-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hidden/Secret Levels Deck */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-purple-400 font-mono tracking-wider border-b border-gray-600 pb-1 flex items-center gap-2">
              👾 隐秘密道隐藏关 (UNLOCKED: {progress.unlockedLevels.filter(id => id >= 100).length}/5)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {secretLevels.map((level) => {
                const { unlocked } = getLevelStatus(level);
                const stars = progress.stars[level.id] || 0;
                const bestTime = progress.bestTime[level.id];

                // Map secrets back to hints to help player explore
                let hint = '';
                if (level.id === 101) hint = '提示：在【第一关】向右上角高台探索隐藏绿色管道。';
                if (level.id === 102) hint = '提示：在【第二关】树木后方扑身击碎开裂泥土。';
                if (level.id === 103) hint = '提示：在【第三关】最高弹力弹簧飞跃上万米高空。';
                if (level.id === 104) hint = '提示：在【第四关】在极度深谷跳入冰原水潭底部。';
                if (level.id === 105) hint = '提示：在【第五关】冲过终点大红旗杆的背阴传送区。';

                return (
                  <div
                    key={level.id}
                    onClick={() => handleSelect(level, unlocked)}
                    className={`border-4 rounded-xl p-4 flex flex-col justify-between min-h-[170px] relative overflow-hidden transition-all duration-300 ${
                      unlocked
                        ? 'bg-purple-950/20 border-purple-800 hover:border-purple-500 hover:-translate-y-1 cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.1)]'
                        : 'bg-black/60 border-gray-950 opacity-60'
                    }`}
                  >
                    {/* Watermark */}
                    <div className="absolute -bottom-4 -right-2 text-8xl font-black font-mono text-purple-500/5 select-none pointer-events-none">
                      H
                    </div>

                    <div className="space-y-2 z-10">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-semibold text-purple-400">隐藏关 0{level.id - 100}</span>
                        {getBiomeBadge(level.biome)}
                      </div>
                      
                      {unlocked ? (
                        <>
                          <h4 className="font-bold text-sm text-purple-200 line-clamp-1">{level.name.replace('【隐藏】', '')}</h4>
                          <p className="text-[11px] text-gray-300 leading-tight line-clamp-3">{level.description}</p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <EyeOff className="w-4 h-4 text-gray-500" />
                            <h4 className="font-bold text-sm text-gray-500">未被发现的隐藏世界</h4>
                          </div>
                          <p className="text-[11px] text-yellow-600 font-mono leading-tight bg-yellow-500/5 p-1 rounded border border-yellow-500/20">
                            {hint}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="mt-4 pt-2 border-t border-purple-900/60 flex justify-between items-end z-10">
                      {unlocked ? (
                        <>
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx <= stars
                                    ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]'
                                    : 'text-purple-900'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-right">
                            {bestTime ? (
                              <span className="text-[9px] font-mono text-purple-300 block">⚡ {bestTime.toFixed(1)}s</span>
                            ) : (
                              <span className="text-[9px] font-mono text-yellow-500 block">待重玩</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-full flex justify-between items-center text-[10px] font-mono text-gray-500">
                          <span>待激活印记</span>
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
