/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { SkinsShop } from './components/SkinsShop';
import { LevelSelector } from './components/LevelSelector';
import { Instructions } from './components/Instructions';
import { GameProgress, SkinId } from './types';
import { gameAudio } from './audio';
import { Play, Award, Compass, HelpCircle, Gamepad2, Volume2, VolumeX, Sparkles, Star, Trophy, ArrowRight } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'mc_eggy_party_adventure_progress_v1';

const DEFAULT_PROGRESS: GameProgress = {
  unlockedLevels: [1], // Level 1 unlocked initially
  stars: {},
  highScores: {},
  bestTime: {},
  totalDiamonds: 0,
  unlockedSkins: ['default'],
  activeSkin: 'default'
};

export default function App() {
  const [progress, setProgress] = useState<GameProgress>(DEFAULT_PROGRESS);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'playing'>('home');
  const [activeLevelId, setActiveLevelId] = useState<number>(1);
  
  // Modal visibility toggles
  const [showSkinsShop, setShowSkinsShop] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Audio status
  const [musicMuted, setMusicMuted] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GameProgress;
        // Validate fields
        if (parsed.unlockedLevels && parsed.stars && parsed.unlockedSkins) {
          setProgress(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read game progress from localStorage, using default.', e);
    }
  }, []);

  // Save progress on change
  const saveProgress = (newProgress: GameProgress) => {
    setProgress(newProgress);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProgress));
    } catch (e) {
      console.error('Failed to save progress to localStorage', e);
    }
  };

  // Level Won Callback Handler
  const handleLevelWin = (
    stars: number,
    diamonds: number,
    timeSpent: number,
    damagedCount: number
  ) => {
    const updatedStars = { ...progress.stars, [activeLevelId]: Math.max(progress.stars[activeLevelId] || 0, stars) };
    const updatedTimes = { ...progress.bestTime, [activeLevelId]: Math.min(progress.bestTime[activeLevelId] || 9999, timeSpent) };

    const newlyUnlockedLevels = [...progress.unlockedLevels];
    
    // If it's a main level (1-5), unlock the next one!
    if (activeLevelId >= 1 && activeLevelId < 5) {
      const nextLevel = activeLevelId + 1;
      if (!newlyUnlockedLevels.includes(nextLevel)) {
        newlyUnlockedLevels.push(nextLevel);
      }
    }

    // Accumulate total diamonds count
    const levelPrevBestDiamonds = progress.highScores[activeLevelId] || 0;
    const diamondDiff = Math.max(0, diamonds - levelPrevBestDiamonds);
    const newTotalDiamonds = progress.totalDiamonds + diamondDiff;

    const updatedHighScores = { ...progress.highScores, [activeLevelId]: Math.max(levelPrevBestDiamonds, diamonds) };

    // Update skins unlocking criteria
    const unlockedSkinsList = [...progress.unlockedSkins];
    
    // Wood Skin: Beaten level 2
    if (activeLevelId === 2 && !unlockedSkinsList.includes('wood')) {
      unlockedSkinsList.push('wood');
    }
    // Obsidian Skin: Beaten level 5
    if (activeLevelId === 5 && !unlockedSkinsList.includes('obsidian')) {
      unlockedSkinsList.push('obsidian');
    }
    // Diamond Skin: collected at least 12 diamonds
    if (newTotalDiamonds >= 12 && !unlockedSkinsList.includes('diamond')) {
      unlockedSkinsList.push('diamond');
    }
    // Gold Apple Skin: earned 3 stars on at least 3 levels
    const threeStarCount = Object.values(updatedStars).filter((s: any) => s >= 3).length;
    if (threeStarCount >= 3 && !unlockedSkinsList.includes('gold_apple')) {
      unlockedSkinsList.push('gold_apple');
    }

    const nextProgress: GameProgress = {
      ...progress,
      unlockedLevels: newlyUnlockedLevels,
      stars: updatedStars,
      highScores: updatedHighScores,
      bestTime: updatedTimes,
      totalDiamonds: newTotalDiamonds,
      unlockedSkins: unlockedSkinsList
    };

    saveProgress(nextProgress);
    setCurrentScreen('home');
  };

  const handleSelectSkin = (id: SkinId) => {
    const updated = { ...progress, activeSkin: id };
    saveProgress(updated);
  };

  const handleUnlockSecret = (secretId: number) => {
    if (!progress.unlockedLevels.includes(secretId)) {
      const updatedLevels = [...progress.unlockedLevels, secretId];
      const nextProgress = {
        ...progress,
        unlockedLevels: updatedLevels
      };
      saveProgress(nextProgress);
    }
  };

  const startPlaying = (lvlId: number) => {
    setActiveLevelId(lvlId);
    setCurrentScreen('playing');
    gameAudio.playCoin();
  };

  const handleMuteToggle = () => {
    const muted = gameAudio.toggleMusic();
    setMusicMuted(muted);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans flex flex-col justify-between selection:bg-yellow-500 selection:text-black">
      
      {/* Top ambient glow headers */}
      <header className="bg-[#1a1a1a] border-b-4 border-black p-4 flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gradient-to-tr from-yellow-500 to-emerald-500 border-2 border-black flex items-center justify-center font-black text-black font-mono text-xl shadow shadow-yellow-500/30">
            MC
          </div>
          <div>
            <h1 className="text-md font-bold font-sans tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-emerald-400">
              我的世界 × 蛋仔派对
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">方块蛋仔大冒险 v1.2</p>
          </div>
        </div>

        {/* Global Sound Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMuteToggle}
            className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded cursor-pointer transition-colors"
          >
            {musicMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        {currentScreen === 'home' ? (
          /* HOME HUB MAIN LAUNCHER SCREEN */
          <div className="w-full max-w-4xl bg-[#1d1d1d] border-4 border-black rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-6">
            
            {/* Minecraft Block particle floating background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/15 via-transparent to-transparent opacity-60 pointer-events-none"></div>

            {/* Title Logo Frame */}
            <div className="relative space-y-2 select-none">
              <div className="bg-yellow-500 text-black px-3 py-1 text-xs font-mono font-black uppercase rounded border-2 border-black rotate-[-2deg] w-fit mx-auto shadow-md">
                EGGY PARTY × MINECRAFT
              </div>
              <h2 className="text-4xl md:text-5xl font-black font-sans tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight">
                方块蛋仔<span className="text-yellow-400">大冒险</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                MC像素方块质感，搭配蛋仔派对极限软萌物理。收集钻石解封**璀璨金苹果**！
              </p>
            </div>

            {/* Quick stats board */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl bg-black/40 p-4 border border-gray-800 rounded-xl font-mono text-xs">
              <div className="flex flex-col items-center">
                <span className="text-gray-500">钻石总收集</span>
                <span className="text-cyan-400 font-extrabold text-lg mt-1">💎 {progress.totalDiamonds}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500">已三星关卡</span>
                <span className="text-yellow-400 font-extrabold text-lg mt-1">⭐ {Object.values(progress.stars).filter((s: any) => s >= 3).length} / 5</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500">解锁隐藏图</span>
                <span className="text-purple-400 font-extrabold text-lg mt-1">🚩 {progress.unlockedLevels.filter(id => id >= 100).length} / 5</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500">已装配外观</span>
                <span className="text-emerald-400 font-extrabold text-lg mt-1">👕 {progress.unlockedSkins.length} 套</span>
              </div>
            </div>

            {/* Action launcher buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-4">
              <button
                onClick={() => startPlaying(1)}
                className="flex-1 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black border-2 border-black rounded-lg font-bold font-sans flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 cursor-pointer shadow-[0_4px_0_#ca8a04]"
              >
                <Play className="w-5 h-5 fill-black" /> 开启主线冲锋
              </button>
              
              <button
                onClick={() => { gameAudio.playCoin(); setShowLevelSelector(true); }}
                className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 border-2 border-black rounded-lg font-bold font-sans flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 cursor-pointer text-white shadow-[0_4px_0_#111827]"
              >
                <Compass className="w-5 h-5 text-emerald-400" /> 选择/重玩关卡
              </button>
            </div>

            {/* Minor functional items (Skins, Help) */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => { gameAudio.playCoin(); setShowSkinsShop(true); }}
                className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <Award className="w-4 h-4 text-yellow-400" /> 蛋仔试衣间
              </button>
              
              <button
                onClick={() => { gameAudio.playCoin(); setShowInstructions(true); }}
                className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" /> 生存玩法说明
              </button>
            </div>

            {/* Quick tips scroll bar */}
            <div className="w-full bg-[#161616] py-2 rounded-lg border border-gray-800/80 max-w-lg mt-4">
              <p className="text-[10px] font-mono text-gray-500">
                💡 贴士：空中按下 **Shift 键**滑铲能撞破裂纹泥土和玻璃，解锁矿山和海底世界哦！
              </p>
            </div>

          </div>
        ) : (
          /* PLAYING CANVAS STAGE CONTAINER */
          <div className="w-full flex justify-center py-2 animate-in fade-in duration-200">
            <GameCanvas
              levelId={activeLevelId}
              activeSkin={progress.activeSkin}
              progress={progress}
              onWin={handleLevelWin}
              onBackToMenu={() => setCurrentScreen('home')}
              onUnlockSecret={handleUnlockSecret}
            />
          </div>
        )}
      </main>

      {/* Footer credits */}
      <footer className="bg-[#131313] border-t border-black p-4 text-center text-[10px] text-gray-500 font-mono">
        <p>© 2026 方块蛋仔大冒险 Studio. Built on modern 2D Physics & Web Audio Engine.</p>
        <p className="mt-1 text-[9px] text-gray-600">本游戏为创意同人合成网页轻量应用，数据及成就保存在当前浏览器本地中。</p>
      </footer>

      {/* PORTALS/MODALS LAYER */}
      {showSkinsShop && (
        <SkinsShop
          progress={progress}
          onSelectSkin={handleSelectSkin}
          onClose={() => setShowSkinsShop(false)}
        />
      )}

      {showLevelSelector && (
        <LevelSelector
          progress={progress}
          onSelectLevel={(id) => {
            setShowLevelSelector(false);
            startPlaying(id);
          }}
          onClose={() => setShowLevelSelector(false)}
        />
      )}

      {showInstructions && (
        <Instructions
          onClose={() => setShowInstructions(false)}
        />
      )}

    </div>
  );
}
