/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TileType =
  | 'empty'
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'wood'
  | 'obsidian'
  | 'glass'
  | 'cactus'
  | 'lava'
  | 'water'
  | 'sand'
  | 'ice'
  | 'end_stone'
  | 'breakable_dirt'
  | 'breakable_glass'
  | 'spring'
  | 'flagpole'
  | 'portal_pipe'    // Secret 1
  | 'portal_mine'    // Secret 2
  | 'portal_cloud'   // Secret 3
  | 'portal_water'   // Secret 4
  | 'portal_ender'   // Secret 5
  | 'portal_back'    // Return portal from secrets
  | 'question_block' // Easter Egg box
  | 'coin'
  | 'diamond';

export type GameItem =
  | 'slime_block'
  | 'tnt'
  | 'lava_bucket'
  | 'honey_block'
  | 'ender_pearl'
  | 'star_block'
  | 'spring_item';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export type SkinId = 'default' | 'diamond' | 'obsidian' | 'wood' | 'gold_apple';

export interface Skin {
  id: SkinId;
  name: string;
  color: string;
  faceColor: string;
  description: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  doubleJumpAvailable: boolean;
  
  // Stats
  health: number;
  maxHealth: number;
  invulnFrames: number;
  
  // Diving / sliding ("扑")
  isDiving: boolean;
  diveTimer: number;
  diveCooldown: number;
  diveDirection: 1 | -1;

  // Squish animations parameters
  squishX: number; // multipliers for drawing width/height
  squishY: number;

  // State modifiers
  isGoldApple: boolean; // enchanted golden apple invuln & speed boost
  goldAppleTimer: number;
  isSlimeBody: boolean; // reduce fall damage & automatic bounce
  slimeBodyTimer: number;

  // Inventory / Items
  items: { [key in GameItem]?: number };
  activeItem: GameItem | null;
}

export type EnemyType =
  | 'zombie'
  | 'creeper'
  | 'slime'
  | 'magma_cube'
  | 'shulker'
  | 'minecart'
  | 'shulker_bullet';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  patrolLeft: number;
  patrolRight: number;
  direction: number; // -1 or 1
  health: number;
  
  // Creeper specific
  swellTimer: number; // goes up when close to player, explodes at max
  isSwelling: boolean;

  // Slime specific
  jumpCooldown: number;

  // Shulker specific
  shootCooldown: number;
}

export interface Projectile {
  id: string;
  type: 'tnt' | 'ender_pearl' | 'shulker_bullet';
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  fuse?: number; // TNT fuse frames
  isPlayerOwned: boolean;
}

export interface MovingPlatform {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  speed: number;
  progress: number; // 0 to 1 back and forth
  direction: 1 | -1;
  isPiston?: boolean; // Piston extends and retracts
  pistonState?: 'extending' | 'extended' | 'retracting' | 'retracted';
  pistonTimer?: number;
}

export interface SwingingRope {
  id: string;
  pivotX: number;
  pivotY: number;
  length: number;
  angle: number;
  angularVelocity: number;
  weightX: number;
  weightY: number;
}

export interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'pixel' | 'slime' | 'fire' | 'portal' | 'star' | 'smoke' | 'sparkle';
}

export interface LevelData {
  id: number; // 1-5 for main, 101-105 for secrets
  name: string;
  isSecret: boolean;
  biome: 'grassland' | 'forest' | 'desert' | 'ice' | 'volcano' | 'mineshaft' | 'cloud' | 'deepsea' | 'ender';
  grid: TileType[][];
  startX: number;
  startY: number;
  width: number; // columns count
  height: number; // rows count
  diamondsToCollect: number;
  bgMusicType: 'grassland' | 'mineshaft' | 'cloud' | 'deepsea' | 'ender';
  description: string;
  unlockedByScore?: number;
}

export interface GameProgress {
  unlockedLevels: number[]; // Array of Level ID numbers (1-5, 101-105)
  stars: { [levelId: number]: number }; // Star ratings (1-3)
  highScores: { [levelId: number]: number }; // Diamond count or best time
  bestTime: { [levelId: number]: number }; // in seconds
  totalDiamonds: number;
  unlockedSkins: SkinId[];
  activeSkin: SkinId;
}
