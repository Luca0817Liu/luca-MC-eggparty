/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Sparkles, Zap, Play, Hammer, Bomb } from 'lucide-react';
import { gameAudio } from '../audio';

interface InstructionsProps {
  onClose: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#2e2e2e] border-4 border-black rounded-xl shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#1c1c1c] p-4 border-b-4 border-black flex justify-between items-center">
          <h2 className="text-lg font-bold text-yellow-400 font-sans tracking-wide flex items-center gap-2">
            🎮 蛋仔方块大冒险：新手生存指南
          </h2>
          <button
            onClick={() => { gameAudio.playCoin(); onClose(); }}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 border-2 border-black rounded text-xs font-bold font-mono transition-transform active:scale-95 cursor-pointer"
          >
            ❌ 关闭
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#383838] space-y-6 text-sm">
          
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Keyboard Controls */}
            <div className="bg-[#2a2a2a] border-2 border-black rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-yellow-400 font-mono border-b border-gray-700 pb-1 flex items-center gap-2">
                ⌨️ 电脑键盘操作
              </h3>
              <ul className="space-y-2 font-mono text-xs text-gray-300">
                <li className="flex justify-between">
                  <span className="text-gray-400">左右移动:</span>
                  <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600 text-yellow-500 font-bold">A / D 或 ← / →</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">跳跃 / 二段跳:</span>
                  <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600 text-yellow-500 font-bold">Space 空格键</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">扑身滑铲 / 砸墙:</span>
                  <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600 text-yellow-500 font-bold">Shift 键</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">切换 / 使用道具:</span>
                  <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600 text-yellow-500 font-bold">数字键 1 - 4</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">暂停游戏:</span>
                  <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-600 text-yellow-500 font-bold">P 键</span>
                </li>
              </ul>
            </div>

            {/* Mobile Controls */}
            <div className="bg-[#2a2a2a] border-2 border-black rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-yellow-400 font-mono border-b border-gray-700 pb-1 flex items-center gap-2">
                📱 手机触屏操作
              </h3>
              <p className="text-xs text-gray-400 font-mono leading-relaxed">
                游戏在手机上打开时，会自动显示定制的蛋仔触屏摇杆与按键：
              </p>
              <ul className="space-y-1.5 text-xs text-gray-300 font-mono">
                <li>🟢 **左下角虚拟摇杆**：无缝滑动控制蛋仔左右奔跑跑位</li>
                <li>🔵 **右下角跳跃/扑铲**：单独的圆润蛋仔弹性触控大按键</li>
                <li>🟡 **下方道具栏**：点击直接点选并向前丢出道具或释放特效</li>
              </ul>
            </div>

          </div>

          {/* Gameplay Systems */}
          <div className="space-y-3">
            <h3 className="font-bold text-yellow-400 font-mono border-b border-gray-700 pb-1 flex items-center gap-2">
              🛠️ 核心融合玩法与强力变身
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-[#222] p-3 rounded border border-gray-700 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <Shield className="w-4 h-4"/> 扑击砸墙 (Dive)
                </div>
                <p className="text-gray-400 text-[11px]">
                  空中按 Shift 触发向前滑扑，可击碎带裂痕的「泥土」或「玻璃」墙体，探寻隐藏的矿洞或秘道！
                </p>
              </div>

              <div className="bg-[#222] p-3 rounded border border-gray-700 space-y-1">
                <div className="font-bold text-yellow-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4"/> 金苹果无敌
                </div>
                <p className="text-gray-400 text-[11px]">
                  吃下金苹果（可在部分问号箱撞出）全身散发耀眼金色颗粒，移速暴增且免疫一切岩浆、尖刺与怪物！
                </p>
              </div>

              <div className="bg-[#222] p-3 rounded border border-gray-700 space-y-1">
                <div className="font-bold text-cyan-400 flex items-center gap-1">
                  <Zap className="w-4 h-4"/> 粘液块防摔
                </div>
                <p className="text-gray-400 text-[11px]">
                  吃下粘液球会变身绿色粘稠蛋，落地能原地反弹复原，并且大幅削减掉落深渊的扣血伤害。
                </p>
              </div>
            </div>
          </div>

          {/* Item description */}
          <div className="bg-black/30 p-4 border border-gray-800 rounded-lg space-y-2">
            <h4 className="text-xs font-bold text-yellow-500 font-mono">🎒 道具包方块用途:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="bg-gray-800/60 p-2 rounded"><span className="text-green-400">🟢 弹性粘液</span>: 脚下生成蹦蹦弹跳垫</div>
              <div className="bg-gray-800/60 p-2 rounded"><span className="text-red-400">🔴 TNT炸药</span>: 投掷爆炸，炸飞机关怪物</div>
              <div className="bg-gray-800/60 p-2 rounded"><span className="text-purple-400">🟣 末影珍珠</span>: 丢出瞬间瞬移到落点</div>
              <div className="bg-gray-800/60 p-2 rounded"><span className="text-amber-400">🟡 蜂蜜方块</span>: 洒向敌人，使其极速减速</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#1c1c1c] p-4 text-center border-t-4 border-black">
          <button
            onClick={() => { gameAudio.playWin(); onClose(); }}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black border-2 border-black rounded-lg font-bold font-sans flex items-center gap-2 mx-auto cursor-pointer shadow active:scale-95 transition-transform"
          >
            <Play className="w-4 h-4 fill-black"/> 我已熟读，立即启程！
          </button>
        </div>

      </div>
    </div>
  );
};
