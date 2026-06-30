/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SkinId, Skin, GameProgress } from '../types';
import { Sparkles, Check, Lock, Star, Award } from 'lucide-react';
import { gameAudio } from '../audio';

interface SkinsShopProps {
  progress: GameProgress;
  onSelectSkin: (id: SkinId) => void;
  onClose: () => void;
}

export const SKINS: Skin[] = [
  {
    id: 'default',
    name: '经典黄蛋仔',
    color: '#ffdd22',
    faceColor: '#333333',
    description: '软萌经典的弹力蛋仔，充满了冒险精神。',
    unlockedAt: '初始赠送',
    rarity: 'common'
  },
  {
    id: 'wood',
    name: '原木方块蛋',
    color: '#a05a2c',
    faceColor: '#ffffff',
    description: '采用MC原生橡木板质感，坚固耐用，摔落声音格外清脆！',
    unlockedAt: '通关 主线第2关 即可解锁',
    rarity: 'rare'
  },
  {
    id: 'diamond',
    name: '璀璨钻石蛋',
    color: '#55ffea',
    faceColor: '#1d3e3a',
    description: '尊贵的钻石方块打造，浑身闪烁着淡蓝色微光，金钱的芬芳。',
    unlockedAt: '收集总数满 15 颗钻石 即可解锁',
    rarity: 'epic'
  },
  {
    id: 'obsidian',
    name: '哭泣曜石蛋',
    color: '#2e114d',
    faceColor: '#c355ff',
    description: '由坚不可摧的黑曜石及哭泣曜石纹路熔炼而成，抗炸性能满分！',
    unlockedAt: '通关 终极火山（第5关） 即可解锁',
    rarity: 'epic'
  },
  {
    id: 'gold_apple',
    name: '附魔金苹果蛋',
    color: '#ffd700',
    faceColor: '#3d2b00',
    description: '吃下附魔金苹果之后的终极形态！通体散发着耀眼金光与附魔流光，极具排面。',
    unlockedAt: '在任意 3 个关卡中获得 3星评分 即可解锁',
    rarity: 'legendary'
  }
];

export const SkinsShop: React.FC<SkinsShopProps> = ({ progress, onSelectSkin, onClose }) => {
  // Check skin unlock conditions dynamically to ensure stability
  const isSkinUnlocked = (skinId: SkinId): boolean => {
    if (skinId === 'default') return true;
    if (progress.unlockedSkins.includes(skinId)) return true;

    // Additional backup safety check based on actual progress
    if (skinId === 'wood') {
      return progress.unlockedLevels.includes(3) || progress.unlockedLevels.includes(4) || progress.unlockedLevels.includes(5);
    }
    if (skinId === 'obsidian') {
      return progress.stars[5] !== undefined; // beaten level 5
    }
    if (skinId === 'diamond') {
      return progress.totalDiamonds >= 12;
    }
    if (skinId === 'gold_apple') {
      const threeStarCount = Object.values(progress.stars).filter((s: any) => s >= 3).length;
      return threeStarCount >= 3;
    }
    return false;
  };

  const handleSelect = (id: SkinId) => {
    if (isSkinUnlocked(id)) {
      onSelectSkin(id);
      gameAudio.playCoin();
    }
  };

  const getRarityBadge = (rarity: Skin['rarity']) => {
    switch (rarity) {
      case 'common':
        return <span className="bg-gray-700 text-gray-200 px-2 py-0.5 rounded text-xs font-mono border border-gray-600">普通</span>;
      case 'rare':
        return <span className="bg-green-800 text-green-200 px-2 py-0.5 rounded text-xs font-mono border border-green-700">稀有</span>;
      case 'epic':
        return <span className="bg-purple-800 text-purple-200 px-2 py-0.5 rounded text-xs font-mono border border-purple-700">史诗</span>;
      case 'legendary':
        return <span className="bg-yellow-600 text-yellow-100 px-2 py-0.5 rounded text-xs font-mono border border-yellow-500 animate-pulse flex items-center gap-1"><Sparkles className="w-3 h-3"/> 传说</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#2a2a2a] border-4 border-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        
        {/* Header with pixel styling */}
        <div className="bg-[#1e1e1e] border-b-4 border-[#121212] p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold font-sans tracking-wide text-yellow-400 flex items-center gap-2">
                蛋仔方块试衣间 <span className="text-xs text-gray-400 font-mono">EGGER SKINS</span>
              </h2>
              <p className="text-xs text-gray-400">通关或收集特定方块即可唤醒酷炫皮肤！</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 border-2 border-black rounded text-sm font-bold font-mono transition-transform active:scale-95 cursor-pointer"
          >
            ❌ 关闭
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#333333]">
          
          {/* Left: Skin Grid */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-yellow-400 font-mono tracking-wider border-b border-gray-600 pb-1 flex items-center gap-2">
              📦 可选蛋仔外观 ({SKINS.filter(s => isSkinUnlocked(s.id)).length}/{SKINS.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {SKINS.map((skin) => {
                const unlocked = isSkinUnlocked(skin.id);
                const isSelected = progress.activeSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    onClick={() => unlocked && handleSelect(skin.id)}
                    className={`p-3 border-4 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-yellow-600/20 border-yellow-500 scale-[1.01]'
                        : unlocked
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-500'
                        : 'bg-black/40 border-gray-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Squishy Render preview icon */}
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-black/50 relative flex items-center justify-center shadow-inner overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${skin.color}, ${skin.color}dd)`,
                          boxShadow: isSelected ? '0 0 12px rgba(234, 179, 8, 0.4)' : 'none'
                        }}
                      >
                        {/* MC Cube outline bevel effect */}
                        <div className="absolute inset-0.5 border border-white/20 rounded"></div>
                        {/* Eggy face cute eyes */}
                        <div className="flex gap-1.5 items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full relative flex items-center justify-center" style={{ backgroundColor: skin.faceColor }}>
                            <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full relative flex items-center justify-center" style={{ backgroundColor: skin.faceColor }}>
                            <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                          </div>
                        </div>
                        {/* Blushing cheeks */}
                        <div className="absolute bottom-1.5 left-2 w-1.5 h-1 bg-pink-400/50 rounded-full"></div>
                        <div className="absolute bottom-1.5 right-2 w-1.5 h-1 bg-pink-400/50 rounded-full"></div>
                        {/* Eggy mouth */}
                        <div className="absolute bottom-2 w-2 h-1 bg-red-500/80 rounded-b-md"></div>

                        {/* Enchanted Golden Apple Glint overlay */}
                        {skin.id === 'gold_apple' && (
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/20 to-transparent animate-pulse pointer-events-none"></div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{skin.name}</h4>
                          {getRarityBadge(skin.rarity)}
                        </div>
                        <p className="text-xs text-gray-300 mt-1 line-clamp-1">{skin.description}</p>
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
                        <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold font-mono flex items-center gap-1 border border-black shadow">
                          <Check className="w-3.5 h-3.5" /> 已装配
                        </div>
                      ) : unlocked ? (
                        <div className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded text-xs font-mono border border-gray-600 transition-colors">
                          装配
                        </div>
                      ) : (
                        <div className="bg-black text-gray-500 px-2 py-1 rounded text-xs font-mono border border-gray-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> 未解锁
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Skin Detailed Profile & Accomplishments */}
          <div className="bg-[#242424] border-4 border-[#121212] rounded-lg p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-bold text-sm text-yellow-400 font-mono tracking-wider border-b border-gray-600 pb-1 flex items-center gap-2 mb-3">
                ⭐ 解锁成就条件
              </h3>

              {/* Stats and Conditions summary */}
              <div className="space-y-3 font-mono text-xs text-gray-300">
                <div className="flex justify-between items-center bg-[#1e1e1e] p-2.5 rounded border border-gray-700">
                  <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400"/> 当前三星关卡:</span>
                  <span className="text-yellow-400 font-bold">
                    {Object.values(progress.stars).filter((s: any) => s >= 3).length} / 3 关
                  </span>
                </div>
                <div className="flex justify-between items-center bg-[#1e1e1e] p-2.5 rounded border border-gray-700">
                  <span className="flex items-center gap-1.5">💎 当前钻石总数:</span>
                  <span className="text-cyan-400 font-bold">{progress.totalDiamonds} 颗 / 15 颗</span>
                </div>
                <div className="flex justify-between items-center bg-[#1e1e1e] p-2.5 rounded border border-gray-700">
                  <span className="flex items-center gap-1.5">🚩 隐藏关卡解锁数:</span>
                  <span className="text-purple-400 font-bold">
                    {progress.unlockedLevels.filter(id => id >= 100).length} / 5 个
                  </span>
                </div>
              </div>

              {/* Tips Section */}
              <div className="mt-5 p-4 bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-700 space-y-2">
                <h4 className="text-xs font-bold font-mono text-yellow-400">💡 穿搭大师秘诀:</h4>
                <ul className="list-disc list-inside text-[11px] text-gray-400 space-y-1">
                  <li>通关特定主线，可以获取木板皮或黑曜石皮。</li>
                  <li>细心探索地图上任何可疑管道、易碎墙壁或高空，解锁隐藏世界能收获海量砖石和高难度印记。</li>
                  <li>收集特定数量的钻石或获得完美的3星评价，即可拥有最耀眼的**璀璨钻石蛋**或**附魔金苹果蛋**！</li>
                </ul>
              </div>
            </div>

            {/* Render 3D-ish model visualizer */}
            <div className="bg-black/50 border-2 border-black rounded-lg p-3 text-center space-y-2 flex flex-col items-center justify-center relative py-6">
              <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-500">REALTIME RENDER VIEW</div>
              {(() => {
                const active = SKINS.find(s => s.id === progress.activeSkin) || SKINS[0];
                return (
                  <>
                    <div
                      className="w-16 h-16 rounded-xl border-2 border-black relative flex items-center justify-center animate-bounce duration-1000 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${active.color}, ${active.color}aa)`,
                      }}
                    >
                      <div className="absolute inset-0.5 border border-white/20 rounded"></div>
                      <div className="flex gap-2 items-center justify-center">
                        <div className="w-3.5 h-3.5 rounded-full relative flex items-center justify-center" style={{ backgroundColor: active.faceColor }}>
                          <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                        </div>
                        <div className="w-3.5 h-3.5 rounded-full relative flex items-center justify-center" style={{ backgroundColor: active.faceColor }}>
                          <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 w-2 h-1 bg-pink-400/50 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-2.5 right-2.5 w-2 h-1 bg-pink-400/50 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-3 w-3 h-1.5 bg-red-500/90 rounded-b-md"></div>
                      
                      {active.id === 'gold_apple' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent mix-blend-screen animate-pulse pointer-events-none"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{active.name}</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        解锁要求: <span className="text-yellow-500 font-mono">{active.unlockedAt}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
