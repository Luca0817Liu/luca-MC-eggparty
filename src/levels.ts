/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelData, TileType } from './types';

// Let's programmatically generate each grid to save space and create extremely rich, scrollable levels!
export function generateLevelGrid(id: number): { grid: TileType[][]; width: number; height: number; startX: number; startY: number } {
  const height = 15;
  let width = 120; // scrolling width
  let startX = 3;
  let startY = 10;

  // Initialize empty grid
  const grid: TileType[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill('empty'));

  // Utility to set rectangle of blocks
  const setRect = (x1: number, y1: number, w: number, h: number, tile: TileType) => {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          grid[y][x] = tile;
        }
      }
    }
  };

  if (id === 1) {
    // ----------------------------------------------------
    // LEVEL 1: Grassland Plains (Grass, dirt, hills, spring)
    // ----------------------------------------------------
    width = 100;
    // Ground
    setRect(0, 12, width, 3, 'dirt');
    for (let x = 0; x < width; x++) {
      grid[12][x] = 'grass';
    }

    // Add some pits/voids to jump over
    setRect(25, 12, 4, 3, 'empty');
    setRect(55, 12, 5, 3, 'empty');

    // Platforms
    setRect(10, 9, 4, 1, 'grass');
    setRect(18, 7, 5, 1, 'grass');
    
    // Spring block
    grid[11][16] = 'spring';

    // Obstacles
    setRect(35, 10, 2, 2, 'stone');
    grid[9][36] = 'diamond';

    // Secret entry: Portal Pipe (Secret 1)
    // Squeeze under a low ledge at x=45
    setRect(43, 9, 6, 1, 'stone');
    setRect(43, 10, 2, 2, 'stone');
    grid[11][47] = 'portal_pipe'; // Pipe portal hidden behind the wall!
    // Question blocks
    grid[8][20] = 'question_block';
    grid[8][22] = 'question_block';

    // High altitude secret spring
    grid[11][70] = 'spring';
    setRect(68, 5, 3, 1, 'grass');
    grid[4][69] = 'diamond';

    // Coins and diamonds
    for (let x = 8; x < 90; x += 6) {
      if (grid[11][x] === 'empty' && grid[12][x] !== 'empty') {
        grid[11][x] = 'coin';
      }
    }
    grid[11][23] = 'diamond';
    grid[11][52] = 'diamond';
    grid[11][78] = 'diamond';

    // Goal Flagpole
    grid[11][93] = 'flagpole';
    setRect(92, 12, 3, 3, 'stone'); // platform for flagpole
    grid[11][92] = 'stone';
    grid[11][94] = 'stone';

  } else if (id === 2) {
    // ----------------------------------------------------
    // LEVEL 2: Forest Mechanisms (Pistons, wood, breakable)
    // ----------------------------------------------------
    width = 110;
    // Ground
    setRect(0, 13, width, 2, 'dirt');
    for (let x = 0; x < width; x++) {
      grid[13][x] = 'grass';
    }

    // Gaps
    setRect(30, 13, 6, 2, 'empty');
    setRect(65, 13, 8, 2, 'empty');

    // Forest trees
    for (let tx of [12, 24, 48, 80, 95]) {
      setRect(tx, 9, 2, 4, 'wood');
      setRect(tx - 2, 6, 6, 3, 'grass'); // Leaves as grass
    }

    // Platforms
    setRect(32, 9, 3, 1, 'wood');
    setRect(38, 7, 4, 1, 'wood');

    // Breakable Wall holding Secret 2 Entrance (portal_mine)
    setRect(52, 11, 2, 2, 'breakable_dirt');
    setRect(54, 10, 3, 3, 'stone');
    grid[12][55] = 'portal_mine'; // Behind the breakable wall!

    // Rotating obstacles simulated around x=68
    // High diamonds
    grid[5][13] = 'diamond';
    grid[5][25] = 'diamond';
    grid[11][60] = 'coin';
    grid[11][62] = 'diamond';

    // End Goal
    grid[12][102] = 'flagpole';
    setRect(101, 13, 3, 2, 'stone');

  } else if (id === 3) {
    // ----------------------------------------------------
    // LEVEL 3: Desert Traps (Sand, quicksand, cactus, TNT)
    // ----------------------------------------------------
    width = 120;
    setRect(0, 13, width, 2, 'sand'); // Sand causes slow movement

    // Quicksand holes (using lava/custom hazard, but visually sand)
    // Cacti
    for (let cx of [15, 28, 42, 58, 75, 90]) {
      grid[12][cx] = 'cactus';
      grid[11][cx] = 'cactus';
    }

    // Platforms
    setRect(20, 10, 4, 1, 'stone');
    setRect(25, 8, 3, 1, 'stone');

    // Secret entry 3: Cloud Portal (High springs!)
    grid[12][48] = 'spring';
    setRect(47, 5, 3, 1, 'sand');
    grid[4][48] = 'portal_cloud'; // cloud portal high up!

    // Desert ruins
    setRect(60, 8, 6, 5, 'stone');
    setRect(62, 5, 2, 3, 'empty'); // Tunnel inside ruins
    setRect(61, 11, 4, 2, 'empty'); // secret cavern inside
    grid[12][62] = 'coin';
    grid[12][63] = 'diamond';

    // TNT items placed on map
    grid[12][35] = 'stone';
    grid[11][35] = 'question_block';

    // Cactus Crevice shortcut (Cactus on left and right, coin in middle)
    grid[12][80] = 'cactus';
    grid[12][82] = 'cactus';
    grid[12][81] = 'coin';

    // End Goal
    grid[12][112] = 'flagpole';
    setRect(111, 13, 3, 2, 'stone');

  } else if (id === 4) {
    // ----------------------------------------------------
    // LEVEL 4: Glacial High Altitude (Ice, voids, long jumps)
    // ----------------------------------------------------
    width = 120;
    // Slips and slides!
    setRect(0, 13, 25, 2, 'ice');
    setRect(35, 13, 20, 2, 'ice');
    setRect(65, 13, 15, 2, 'ice');
    setRect(90, 13, 30, 2, 'ice');

    // Extreme Voids
    // Floating high altitude ice platforms
    setRect(23, 10, 4, 1, 'ice');
    setRect(28, 7, 3, 1, 'ice');
    setRect(56, 11, 3, 1, 'ice');
    setRect(60, 9, 4, 1, 'ice');
    setRect(82, 10, 5, 1, 'ice');

    // Deep sea portal (Secret 4) submerged at the bottom of a glacial pit
    setRect(79, 13, 12, 2, 'empty'); // Deep pit
    setRect(79, 14, 12, 1, 'water'); // water at bottom
    grid[14][85] = 'portal_water'; // Underwater portal!

    // High launch spring
    grid[12][102] = 'spring';
    grid[5][102] = 'diamond';

    // Floating diamonds
    grid[4][29] = 'diamond';
    grid[6][61] = 'diamond';
    grid[8][84] = 'diamond';

    // End Goal
    grid[12][115] = 'flagpole';

  } else if (id === 5) {
    // ----------------------------------------------------
    // LEVEL 5: Volcanic Ultimate (Lava, magma, obsidian, creeper)
    // ----------------------------------------------------
    width = 130;
    // Lava flows everywhere
    setRect(0, 13, width, 2, 'stone');
    // Lava pools
    setRect(18, 13, 12, 2, 'lava');
    setRect(40, 13, 15, 2, 'lava');
    setRect(70, 13, 20, 2, 'lava');
    setRect(100, 13, 10, 2, 'lava');

    // Safe obsidian platforms
    setRect(22, 10, 4, 1, 'obsidian');
    setRect(45, 9, 5, 1, 'obsidian');
    setRect(76, 11, 3, 1, 'obsidian');
    setRect(82, 8, 3, 1, 'obsidian');
    setRect(103, 10, 4, 1, 'obsidian');

    // Smashed glass cage containing diamond
    setRect(60, 8, 3, 3, 'breakable_glass');
    grid[9][61] = 'diamond';

    // High challenge elements
    grid[12][35] = 'spring';
    grid[6][35] = 'diamond';

    // End Goal
    grid[12][122] = 'flagpole';
    setRect(121, 13, 3, 2, 'obsidian');

    // Hidden Portal to Level 105 (Ender Void Ultimate Hidden Level)
    // Placed strictly BEHIND the finish flagpole
    grid[12][126] = 'portal_ender';
    setRect(124, 13, 6, 2, 'obsidian');

  } else if (id === 101) {
    // ----------------------------------------------------
    // HIDDEN LEVEL 1: Grassland Pipe Flower Forest
    // ----------------------------------------------------
    width = 60;
    setRect(0, 12, width, 3, 'dirt');
    for (let x = 0; x < width; x++) {
      grid[12][x] = 'grass';
    }

    // No monsters, tons of diamonds & coins
    for (let x = 10; x < 50; x += 4) {
      grid[11][x] = 'coin';
      grid[10][x] = 'coin';
      if (x % 8 === 0) {
        grid[9][x] = 'diamond';
      }
    }

    // Return portal
    grid[11][55] = 'portal_back';

  } else if (id === 102) {
    // ----------------------------------------------------
    // HIDDEN LEVEL 2: Underground Mine Shaft (Rails & Minecarts)
    // ----------------------------------------------------
    width = 70;
    setRect(0, 13, width, 2, 'stone');
    // Obstacles
    setRect(15, 10, 3, 3, 'stone');
    setRect(30, 9, 4, 4, 'stone');
    setRect(45, 11, 3, 2, 'stone');

    // Diamonds and coins
    grid[9][16] = 'diamond';
    grid[8][32] = 'diamond';
    grid[10][46] = 'diamond';

    // Return portal
    grid[12][62] = 'portal_back';

  } else if (id === 103) {
    // ----------------------------------------------------
    // HIDDEN LEVEL 3: Cloudy Glass skyway (Ethereal glass)
    // ----------------------------------------------------
    width = 80;
    // No solid ground! Only sparse glass platforms over deep void!
    setRect(0, 13, 6, 2, 'glass');
    setRect(10, 11, 4, 1, 'glass');
    setRect(20, 9, 3, 1, 'glass');
    setRect(30, 11, 3, 1, 'glass');
    setRect(40, 8, 4, 1, 'glass');
    setRect(50, 10, 3, 1, 'glass');
    setRect(60, 12, 5, 1, 'glass');

    // Coins on platforms
    grid[10][11] = 'coin';
    grid[8][21] = 'diamond';
    grid[10][31] = 'coin';
    grid[7][41] = 'diamond';
    grid[9][51] = 'coin';
    grid[11][62] = 'diamond';

    // Return portal
    grid[11][63] = 'portal_back';

  } else if (id === 104) {
    // ----------------------------------------------------
    // HIDDEN LEVEL 4: Deep Sea Water ruins (Sinking pressure)
    // ----------------------------------------------------
    width = 70;
    setRect(0, 13, width, 2, 'stone');
    // The entire level area has water blocks
    setRect(0, 0, width, 13, 'water');

    // Coral blocks (represented by cactus or lava traps visually submerged)
    for (let cx of [18, 32, 48]) {
      grid[12][cx] = 'cactus';
      grid[11][cx] = 'cactus';
    }

    // Platforms
    setRect(10, 9, 4, 1, 'stone');
    setRect(25, 7, 5, 1, 'stone');
    setRect(40, 10, 4, 1, 'stone');

    grid[8][11] = 'diamond';
    grid[6][27] = 'diamond';
    grid[9][41] = 'diamond';

    // Return portal
    grid[12][60] = 'portal_back';

  } else if (id === 105) {
    // ----------------------------------------------------
    // HIDDEN LEVEL 5: Ender Void (Ender platform, Shulkers)
    // ----------------------------------------------------
    width = 80;
    // Floating end stone islands
    setRect(0, 12, 8, 3, 'end_stone');
    setRect(15, 10, 6, 2, 'end_stone');
    setRect(28, 8, 5, 1, 'end_stone');
    setRect(40, 11, 6, 2, 'end_stone');
    setRect(55, 9, 8, 3, 'end_stone');

    // Coins and items
    grid[9][17] = 'diamond';
    grid[7][30] = 'diamond';
    grid[10][42] = 'diamond';

    // Return portal
    grid[8][60] = 'portal_back';
    setRect(59, 9, 3, 3, 'end_stone');
  }

  return { grid, width, height, startX, startY };
}

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: "草原第一关: 弹跳平原",
    isSecret: false,
    biome: "grassland",
    grid: [],
    startX: 3,
    startY: 10,
    width: 100,
    height: 15,
    diamondsToCollect: 4,
    bgMusicType: "grassland",
    description: "绿草如茵的起点。掌握弹跳、二段跳以及向右探索隐藏绿色管道。收集草地之星！"
  },
  {
    id: 2,
    name: "树林第二关: 密林活塞",
    isSecret: false,
    biome: "forest",
    grid: [],
    startX: 3,
    startY: 11,
    width: 110,
    height: 15,
    diamondsToCollect: 3,
    bgMusicType: "grassland",
    description: "机关重重的大森林。注意移动的方块以及碎裂的泥土。角落的易碎墙面背后隐藏着什么？"
  },
  {
    id: 3,
    name: "沙漠第三关: 荒漠仙人掌",
    isSecret: false,
    biome: "desert",
    grid: [],
    startX: 3,
    startY: 11,
    width: 120,
    height: 15,
    diamondsToCollect: 2,
    bgMusicType: "mineshaft",
    description: "流沙与仙人掌齐飞。使用TNT方块来开路或击退阻碍！最高处的弹簧能飞跃到云端。"
  },
  {
    id: 4,
    name: "冰川第四关: 浮空碎冰",
    isSecret: false,
    biome: "ice",
    grid: [],
    startX: 3,
    startY: 11,
    width: 120,
    height: 15,
    diamondsToCollect: 4,
    bgMusicType: "cloud",
    description: "极其滑溜的冰面！小心漫天冰川深渊，依靠精妙的空中划行。深谷水底似乎另有洞天。"
  },
  {
    id: 5,
    name: "火山第五关: 终极熔岩",
    isSecret: false,
    biome: "volcano",
    grid: [],
    startX: 3,
    startY: 11,
    width: 130,
    height: 15,
    diamondsToCollect: 2,
    bgMusicType: "ender",
    description: "炽热岩浆涌动！避开暴躁的苦力怕与岩浆怪。通关终点旗杆后方藏有通往虚空末地的传送门！"
  },

  // SECRETS
  {
    id: 101,
    name: "【隐藏】青草管道金币林",
    isSecret: true,
    biome: "grassland",
    grid: [],
    startX: 3,
    startY: 10,
    width: 60,
    height: 15,
    diamondsToCollect: 5,
    bgMusicType: "grassland",
    description: "通过草原隐秘管道进入的奇迹花海！在这里没有怪物的威胁，满地都是闪耀的财富。"
  },
  {
    id: 102,
    name: "【隐藏】地下矿山竞速矿车",
    isSecret: true,
    biome: "mineshaft",
    grid: [],
    startX: 3,
    startY: 11,
    width: 70,
    height: 15,
    diamondsToCollect: 3,
    bgMusicType: "mineshaft",
    description: "击碎松软泥土跌入的古老矿洞。避开飞驰的矿车和突发的熔岩，体验极速狂奔！"
  },
  {
    id: 103,
    name: "【隐藏】云端玻璃浮空廊",
    isSecret: true,
    biome: "cloud",
    grid: [],
    startX: 3,
    startY: 11,
    width: 80,
    height: 15,
    diamondsToCollect: 3,
    bgMusicType: "cloud",
    description: "跃上极高弹簧触碰到的隐形浮空廊！每一步都悬在万米高空，玻璃平台晶莹，考研微操！"
  },
  {
    id: 104,
    name: "【隐藏】深海水流失重遗迹",
    isSecret: true,
    biome: "deepsea",
    grid: [],
    startX: 3,
    startY: 11,
    width: 70,
    height: 15,
    diamondsToCollect: 3,
    bgMusicType: "deepsea",
    description: "从冰谷最深处水流潜入的海底宫殿。享受水流失重感，在氧气耗尽前逃回现实！"
  },
  {
    id: 105,
    name: "【隐藏】末地虚空终极挑战",
    isSecret: true,
    biome: "ender",
    grid: [],
    startX: 3,
    startY: 10,
    width: 80,
    height: 15,
    diamondsToCollect: 3,
    bgMusicType: "ender",
    description: "位于火山终点之畔的末影入口。挑战飞翔的潜影贝和灼热末影水晶，夺取最后的无上荣耀！"
  }
];

export function getLevel(id: number): LevelData | null {
  const meta = LEVELS.find(l => l.id === id);
  if (!meta) return null;

  // Hydrate grid dynamically to save memory and avoid cloning issues
  const { grid, width, height, startX, startY } = generateLevelGrid(id);
  return {
    ...meta,
    grid,
    width,
    height,
    startX,
    startY
  };
}
