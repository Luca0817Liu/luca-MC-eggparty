/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Player, Enemy, Projectile, TileType, GameItem, LevelData, GameProgress, SkinId, GameParticle, MovingPlatform } from '../types';
import { getLevel } from '../levels';
import { gameAudio } from '../audio';
import { SKINS } from './SkinsShop';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Award, Sparkles, AlertTriangle, ArrowRight, Home, Star } from 'lucide-react';

interface GameCanvasProps {
  levelId: number;
  activeSkin: SkinId;
  progress: GameProgress;
  onWin: (stars: number, diamonds: number, timeSpent: number, damagedCount: number, unlockedSecretId?: number) => void;
  onBackToMenu: () => void;
  onUnlockSecret: (secretId: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelId,
  activeSkin,
  progress,
  onWin,
  onBackToMenu,
  onUnlockSecret
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game state
  const [level, setLevel] = useState<LevelData | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  
  // Game stats
  const [hearts, setHearts] = useState(5);
  const [diamondsCollected, setDiamondsCollected] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [timer, setTimer] = useState(0);
  const [damageCount, setDamageCount] = useState(0);
  
  // Inventory status
  const [selectedItem, setSelectedItem] = useState<GameItem>('tnt');
  const [inventory, setInventory] = useState<{ [key in GameItem]?: number }>({
    tnt: 5,
    ender_pearl: 3,
    slime_block: 3,
    honey_block: 3
  });

  // Sound toggle state
  const [musicMuted, setMusicMuted] = useState(gameAudio.getMusicMuteState());
  const [sfxMuted, setSfxMuted] = useState(gameAudio.getSfxMuteState());

  // Input States
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mobileInput = useRef({ left: false, right: false, jump: false, dive: false });

  // Physics loop refs
  const playerRef = useRef<Player>({
    x: 100, y: 100, vx: 0, vy: 0, width: 32, height: 32,
    grounded: false, doubleJumpAvailable: true,
    health: 5, maxHealth: 5, invulnFrames: 0,
    isDiving: false, diveTimer: 0, diveCooldown: 0, diveDirection: 1,
    squishX: 1, squishY: 1,
    isGoldApple: false, goldAppleTimer: 0,
    isSlimeBody: false, slimeBodyTimer: 0,
    items: {}, activeItem: null
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const platformsRef = useRef<MovingPlatform[]>([]);
  const particlesRef = useRef<GameParticle[]>([]);
  const cameraRef = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);
  const timerIntervalId = useRef<any>(null);

  const TILE_SIZE = 40;

  // Load level on start or change
  useEffect(() => {
    const loadedLevel = getLevel(levelId);
    if (loadedLevel) {
      setLevel(loadedLevel);
      resetLevelState(loadedLevel);
      gameAudio.startMusic(loadedLevel.bgMusicType);
    }

    return () => {
      gameAudio.stopMusic();
    };
  }, [levelId]);

  // Audio mute togglers
  const toggleMusic = () => {
    const isMuted = gameAudio.toggleMusic();
    setMusicMuted(isMuted);
  };

  const toggleSfx = () => {
    const isMuted = gameAudio.toggleSfx();
    setSfxMuted(isMuted);
  };

  // Setup main keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      
      // Numbers for inventory
      if (['1', '2', '3', '4'].includes(e.key)) {
        const itemsList: GameItem[] = ['tnt', 'ender_pearl', 'slime_block', 'honey_block'];
        const selected = itemsList[parseInt(e.key) - 1];
        setSelectedItem(selected);
        gameAudio.playCoin();
      }

      // P for pause
      if (e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
      }

      // Space trigger for single jumps
      if (e.key === ' ') {
        triggerJump();
      }

      // Shift trigger for dive/撲
      if (e.key === 'Shift') {
        triggerDive();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Time tracker
  useEffect(() => {
    if (isPaused || gameOver || gameWon) {
      if (timerIntervalId.current) clearInterval(timerIntervalId.current);
      return;
    }

    timerIntervalId.current = setInterval(() => {
      setTimer(t => t + 0.1);
    }, 100);

    return () => {
      if (timerIntervalId.current) clearInterval(timerIntervalId.current);
    };
  }, [isPaused, gameOver, gameWon]);

  // Reset Level function
  const resetLevelState = (lvl: LevelData) => {
    setHearts(5);
    setDiamondsCollected(0);
    setCoinsCollected(0);
    setTimer(0);
    setDamageCount(0);
    setGameOver(false);
    setGameWon(false);
    setIsPaused(false);

    // Initial position
    playerRef.current = {
      x: lvl.startX * TILE_SIZE,
      y: lvl.startY * TILE_SIZE,
      vx: 0,
      vy: 0,
      width: 32,
      height: 32,
      grounded: false,
      doubleJumpAvailable: true,
      health: 5,
      maxHealth: 5,
      invulnFrames: 0,
      isDiving: false,
      diveTimer: 0,
      diveCooldown: 0,
      diveDirection: 1,
      squishX: 1,
      squishY: 1,
      isGoldApple: false,
      goldAppleTimer: 0,
      isSlimeBody: false,
      slimeBodyTimer: 0,
      items: {},
      activeItem: null
    };

    cameraRef.current = { x: 0, y: 0 };
    projectilesRef.current = [];
    particlesRef.current = [];

    // Reset moving platforms programmatically
    const platforms: MovingPlatform[] = [];
    // Spawn some moving platforms dynamically based on level
    if (lvl.id === 2 || lvl.id === 5) {
      platforms.push({
        id: 'plat1',
        x: 35 * TILE_SIZE, y: 8 * TILE_SIZE,
        startX: 32 * TILE_SIZE, startY: 8 * TILE_SIZE,
        endX: 42 * TILE_SIZE, endY: 8 * TILE_SIZE,
        vx: 1.5, vy: 0, width: 80, height: 18, speed: 1.5, progress: 0, direction: 1
      });
      // Piston platforms
      platforms.push({
        id: 'pist1',
        x: 60 * TILE_SIZE, y: 11 * TILE_SIZE,
        startX: 60 * TILE_SIZE, startY: 11 * TILE_SIZE,
        endX: 60 * TILE_SIZE, endY: 6 * TILE_SIZE,
        vx: 0, vy: -1.2, width: 80, height: 18, speed: 1.2, progress: 0, direction: 1,
        isPiston: true, pistonState: 'retracted', pistonTimer: 0
      });
    } else if (lvl.id === 4) {
      platforms.push({
        id: 'ice_plat1',
        x: 45 * TILE_SIZE, y: 9 * TILE_SIZE,
        startX: 45 * TILE_SIZE, startY: 9 * TILE_SIZE,
        endX: 52 * TILE_SIZE, endY: 9 * TILE_SIZE,
        vx: 1, vy: 0, width: 80, height: 18, speed: 1, progress: 0, direction: 1
      });
    }
    platformsRef.current = platforms;

    // Load Enemies based on levels
    const enemies: Enemy[] = [];
    if (lvl.id === 1) {
      enemies.push(createEnemy('zombie', 12, 11, 8, 16));
      enemies.push(createEnemy('slime', 38, 11, 35, 42));
    } else if (lvl.id === 2) {
      enemies.push(createEnemy('zombie', 20, 12, 15, 26));
      enemies.push(createEnemy('slime', 45, 12, 40, 50));
      enemies.push(createEnemy('zombie', 78, 12, 72, 85));
    } else if (lvl.id === 3) {
      enemies.push(createEnemy('creeper', 22, 12, 18, 26));
      enemies.push(createEnemy('creeper', 50, 12, 44, 56));
      enemies.push(createEnemy('magma_cube', 66, 12, 60, 72));
    } else if (lvl.id === 4) {
      enemies.push(createEnemy('zombie', 40, 12, 35, 45));
      enemies.push(createEnemy('slime', 70, 12, 65, 75));
    } else if (lvl.id === 5) {
      enemies.push(createEnemy('creeper', 15, 12, 10, 17));
      enemies.push(createEnemy('creeper', 52, 12, 48, 56));
      enemies.push(createEnemy('magma_cube', 65, 12, 60, 70));
      enemies.push(createEnemy('magma_cube', 88, 12, 82, 94));
    } else if (lvl.id === 105) { // Ender Secret
      enemies.push(createEnemy('shulker', 18, 9, 17, 19));
      enemies.push(createEnemy('shulker', 42, 10, 41, 43));
    }
    enemiesRef.current = enemies;
  };

  const createEnemy = (type: Enemy['type'], tx: number, ty: number, leftBound: number, rightBound: number): Enemy => {
    return {
      id: `enemy_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: tx * TILE_SIZE,
      y: ty * TILE_SIZE,
      vx: type === 'minecart' ? 3.5 : 1,
      vy: 0,
      width: type === 'slime' || type === 'magma_cube' ? 24 : 28,
      height: type === 'slime' || type === 'magma_cube' ? 24 : 32,
      patrolLeft: leftBound * TILE_SIZE,
      patrolRight: rightBound * TILE_SIZE,
      direction: 1,
      health: type === 'creeper' ? 1 : 2,
      swellTimer: 0,
      isSwelling: false,
      jumpCooldown: 0,
      shootCooldown: 0
    };
  };

  // Jump trigger (works for regular/double)
  const triggerJump = () => {
    if (gameOver || gameWon || isPaused) return;
    const player = playerRef.current;

    if (player.grounded) {
      player.vy = -8.5;
      player.grounded = false;
      player.doubleJumpAvailable = true;
      player.squishX = 0.75; // stretch upwards
      player.squishY = 1.25;
      gameAudio.playJump();
      spawnJumpParticles(player.x + player.width/2, player.y + player.height, '#ffffff');
    } else if (player.doubleJumpAvailable) {
      player.vy = -7.2;
      player.doubleJumpAvailable = false;
      player.squishX = 0.8;
      player.squishY = 1.2;
      gameAudio.playDoubleJump();
      spawnJumpParticles(player.x + player.width/2, player.y + player.height/2, '#a7f3d0');
    }
  };

  // Dive trigger ("扑")
  const triggerDive = () => {
    if (gameOver || gameWon || isPaused) return;
    const player = playerRef.current;

    if (player.diveCooldown <= 0) {
      player.isDiving = true;
      player.diveTimer = 18; // duration frames
      player.diveCooldown = 30; // cooldown frames
      
      // Determine facing direction
      let dir: 1 | -1 = 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft'] || mobileInput.current.left) {
        dir = -1;
      } else if (keysPressed.current['d'] || keysPressed.current['arrowright'] || mobileInput.current.right) {
        dir = 1;
      } else {
        dir = player.diveDirection;
      }
      player.diveDirection = dir;
      player.vx = dir * 6.5; // diving horizontal boost
      player.vy = -2.0; // slight upward pop
      gameAudio.playDive();
    }
  };

  // Item Use trigger
  const handleUseItem = () => {
    if (gameOver || gameWon || isPaused || !level) return;
    const player = playerRef.current;
    const count = inventory[selectedItem] || 0;
    if (count <= 0) return;

    // Deduct count
    setInventory(prev => ({ ...prev, [selectedItem]: count - 1 }));

    // Determine direction
    let dir = player.diveDirection;
    if (keysPressed.current['a'] || keysPressed.current['arrowleft'] || mobileInput.current.left) dir = -1;
    if (keysPressed.current['d'] || keysPressed.current['arrowright'] || mobileInput.current.right) dir = 1;

    if (selectedItem === 'tnt') {
      // Throw TNT projectile
      projectilesRef.current.push({
        id: `tnt_${Date.now()}`,
        type: 'tnt',
        x: player.x + player.width/2 + (dir * 10) - 10,
        y: player.y,
        vx: dir * 5.5,
        vy: -3.5,
        width: 20,
        height: 20,
        fuse: 90, // Ticks down
        isPlayerOwned: true
      });
      gameAudio.playJump();
    } else if (selectedItem === 'ender_pearl') {
      // Throw Ender Pearl
      projectilesRef.current.push({
        id: `pearl_${Date.now()}`,
        type: 'ender_pearl',
        x: player.x + player.width/2 - 8,
        y: player.y + 4,
        vx: dir * 7.5,
        vy: -4.5,
        width: 14,
        height: 14,
        isPlayerOwned: true
      });
      gameAudio.playDoubleJump();
    } else if (selectedItem === 'slime_block') {
      // Drop Slime pad right underneath player if standing
      const tx = Math.floor((player.x + player.width/2) / TILE_SIZE);
      const ty = Math.floor((player.y + player.height + 5) / TILE_SIZE);
      if (ty >= 0 && ty < level.height && tx >= 0 && tx < level.width) {
        level.grid[ty - 1][tx] = 'spring';
        gameAudio.playLand();
        // Spawn particles
        spawnImpactParticles(tx * TILE_SIZE + TILE_SIZE/2, (ty - 1) * TILE_SIZE + TILE_SIZE, '#22c55e');
      }
    } else if (selectedItem === 'honey_block') {
      // Drop slow honey puddle
      const tx = Math.floor((player.x + player.width/2) / TILE_SIZE);
      const ty = Math.floor((player.y + player.height + 5) / TILE_SIZE);
      if (ty >= 0 && ty < level.height && tx >= 0 && tx < level.width) {
        level.grid[ty - 1][tx] = 'sand'; // Visually honey/slow block
        gameAudio.playLand();
        spawnImpactParticles(tx * TILE_SIZE + TILE_SIZE/2, (ty - 1) * TILE_SIZE + TILE_SIZE, '#eab308');
      }
    }
  };

  // MAIN PHYSICS AND RENDERING LOOP
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;
      
      updatePhysics();
      renderGame();
      
      animationFrameId.current = requestAnimationFrame(tick);
    };

    if (level && !isPaused && !gameOver && !gameWon) {
      animationFrameId.current = requestAnimationFrame(tick);
    }

    return () => {
      active = false;
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [level, isPaused, gameOver, gameWon, selectedItem, activeSkin]);

  // PHYSICS UPDATE LOGIC
  const updatePhysics = () => {
    if (!level) return;
    const player = playerRef.current;

    // Ticks invincibility frames
    if (player.invulnFrames > 0) player.invulnFrames--;

    // Ticks powerup states
    if (player.isGoldApple) {
      player.goldAppleTimer--;
      if (player.goldAppleTimer <= 0) {
        player.isGoldApple = false;
      }
    }
    if (player.isSlimeBody) {
      player.slimeBodyTimer--;
      if (player.slimeBodyTimer <= 0) {
        player.isSlimeBody = false;
      }
    }

    // Cooldown on diving
    if (player.diveCooldown > 0) player.diveCooldown--;

    // Handle diving motion
    if (player.isDiving) {
      player.diveTimer--;
      if (player.diveTimer <= 0) {
        player.isDiving = false;
      }
      // Sparkle dive particle trail
      particlesRef.current.push({
        x: player.x + Math.random() * player.width,
        y: player.y + Math.random() * player.height,
        vx: -player.vx * 0.2 + (Math.random() - 0.5),
        vy: (Math.random() - 0.5),
        color: activeSkin === 'diamond' ? '#55ffea' : activeSkin === 'gold_apple' ? '#ffd700' : '#ffffff',
        size: 3 + Math.random() * 3,
        alpha: 0.8,
        life: 0,
        maxLife: 15 + Math.random() * 10,
        type: 'smoke'
      });
    }

    // 1. HORIZONTAL CONTROLS
    let targetSpeed = 0;
    const accel = 0.45;
    const decel = 0.82;
    const maxSpeed = player.isGoldApple ? 4.8 : 3.2;

    if (keysPressed.current['a'] || keysPressed.current['arrowleft'] || mobileInput.current.left) {
      targetSpeed = -maxSpeed;
      player.diveDirection = -1;
    } else if (keysPressed.current['d'] || keysPressed.current['arrowright'] || mobileInput.current.right) {
      targetSpeed = maxSpeed;
      player.diveDirection = 1;
    }

    // Slip and slide logic for Ice Biome
    const isSlippery = level.biome === 'ice';
    const frictionCoef = isSlippery ? 0.96 : decel;

    if (targetSpeed !== 0) {
      player.vx += (targetSpeed - player.vx) * accel;
    } else {
      player.vx *= frictionCoef;
    }

    // Clip minimal speed to zero
    if (Math.abs(player.vx) < 0.05) player.vx = 0;

    // Apply Dive momentum override
    if (player.isDiving) {
      player.vx = player.diveDirection * 5.8;
    }

    // Apply gravity
    player.vy += 0.38; // gravity force

    // Limit maximum falling speed
    if (player.vy > 9.8) player.vy = 9.8;

    // 2. MOVE AND RESOLVE SOLID COLLISION (AABB split axis technique)
    // --- X Axis movement first ---
    player.x += player.vx;
    resolveGridCollisions(player, 'x');

    // --- Y Axis movement second ---
    player.y += player.vy;
    resolveGridCollisions(player, 'y');

    // 3. MOVING PLATFORMS PHYSICS UPDATE
    platformsRef.current.forEach(plat => {
      // Update position
      if (plat.isPiston) {
        // Piston extends and retracts behavior
        plat.pistonTimer = (plat.pistonTimer || 0) + 1;
        if (plat.pistonState === 'retracted' && plat.pistonTimer > 60) {
          plat.pistonState = 'extending';
          plat.pistonTimer = 0;
        } else if (plat.pistonState === 'extending') {
          plat.y += plat.vy;
          if (plat.y <= plat.endY) {
            plat.y = plat.endY;
            plat.pistonState = 'extended';
            plat.pistonTimer = 0;
          }
        } else if (plat.pistonState === 'extended' && plat.pistonTimer > 40) {
          plat.pistonState = 'retracting';
          plat.pistonTimer = 0;
        } else if (plat.pistonState === 'retracting') {
          plat.y -= plat.vy;
          if (plat.y >= plat.startY) {
            plat.y = plat.startY;
            plat.pistonState = 'retracted';
            plat.pistonTimer = 0;
          }
        }
      } else {
        // Normal horizontal/vertical looping platform
        plat.progress += plat.speed * 0.005 * plat.direction;
        if (plat.progress >= 1) {
          plat.progress = 1;
          plat.direction = -1;
        } else if (plat.progress <= 0) {
          plat.progress = 0;
          plat.direction = 1;
        }
        plat.x = plat.startX + (plat.endX - plat.startX) * plat.progress;
        plat.y = plat.startY + (plat.endY - plat.startY) * plat.progress;
      }

      // Check player riding platform
      const riding = (
        player.x + player.width > plat.x &&
        player.x < plat.x + plat.width &&
        player.y + player.height >= plat.y - 4 &&
        player.y + player.height <= plat.y + 6 &&
        player.vy >= 0
      );

      if (riding) {
        player.y = plat.y - player.height;
        player.vy = 0;
        player.grounded = true;
        player.doubleJumpAvailable = true;
        // Transfer platform X/Y shifts
        if (!plat.isPiston) {
          player.x += (plat.endX - plat.startX) * plat.speed * 0.005 * plat.direction;
        } else if (plat.pistonState === 'extending') {
          player.y += plat.vy;
        } else if (plat.pistonState === 'retracting') {
          player.y -= plat.vy;
        }
      }
    });

    // 4. DAMAGE AND PIT ZONE HANDLERS
    const centerGridX = Math.floor((player.x + player.width/2) / TILE_SIZE);
    const centerGridY = Math.floor((player.y + player.height/2) / TILE_SIZE);

    // Fall into void
    if (player.y > level.height * TILE_SIZE + 20) {
      applyHurt(1);
      respawnPlayer();
    }

    // Touch custom cells in grid
    const checkCell = (gx: number, gy: number) => {
      if (gx < 0 || gx >= level.width || gy < 0 || gy >= level.height) return;
      const tile = level.grid[gy][gx];
      
      if (tile === 'lava') {
        // Continuous burns unless Golden Apple
        if (!player.isGoldApple) {
          applyHurt(1);
          player.vy = -4; // bounce up slightly
        }
        spawnLavaBubbles(player.x + player.width/2, player.y + player.height);
      } else if (tile === 'cactus') {
        applyHurt(0.5);
        player.vx = -player.diveDirection * 3;
        player.vy = -3;
      }
    };
    checkCell(centerGridX, centerGridY);
    checkCell(Math.floor(player.x/TILE_SIZE), Math.floor((player.y + player.height)/TILE_SIZE));
    checkCell(Math.floor((player.x + player.width)/TILE_SIZE), Math.floor((player.y + player.height)/TILE_SIZE));

    // 5. UPDATE PROJECTILES
    const nextProjectiles: Projectile[] = [];
    projectilesRef.current.forEach(proj => {
      // Apply simple gravity
      if (proj.type === 'tnt' || proj.type === 'ender_pearl') {
        proj.vy += 0.22;
      }

      proj.x += proj.vx;
      proj.y += proj.vy;

      // Simple map boundaries
      if (proj.x < 0 || proj.x > level.width * TILE_SIZE || proj.y > level.height * TILE_SIZE + 50) {
        return; // drop
      }

      // Check collision with solid tiles
      const gridX = Math.floor((proj.x + proj.width/2) / TILE_SIZE);
      const gridY = Math.floor((proj.y + proj.height/2) / TILE_SIZE);

      let col = false;
      if (gridX >= 0 && gridX < level.width && gridY >= 0 && gridY < level.height) {
        const tile = level.grid[gridY][gridX];
        if (tile !== 'empty' && tile !== 'water' && tile !== 'coin' && tile !== 'diamond' && tile !== 'portal_pipe' && tile !== 'portal_mine' && tile !== 'portal_cloud' && tile !== 'portal_water' && tile !== 'portal_ender' && tile !== 'portal_back' && tile !== 'flagpole') {
          col = true;
        }
      }

      if (proj.type === 'tnt') {
        proj.fuse = (proj.fuse || 0) - 1;
        if (proj.fuse <= 0 || col) {
          triggerExplosion(proj.x + proj.width/2, proj.y + proj.height/2);
          return; // remove projectile
        }
        nextProjectiles.push(proj);
      } else if (proj.type === 'ender_pearl') {
        if (col) {
          // Instant teleport player to coordinates!
          player.x = proj.x - player.width/2;
          player.y = proj.y - player.height;
          // Clean velocities
          player.vx = 0;
          player.vy = 0;
          gameAudio.playEnderTeleport();
          spawnEnderSparkles(player.x + player.width/2, player.y + player.height/2);
          return; // remove
        }
        nextProjectiles.push(proj);
      } else if (proj.type === 'shulker_bullet') {
        // heat seeking logic towards player!
        const dx = player.x + player.width/2 - proj.x;
        const dy = player.y + player.height/2 - proj.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          proj.vx = (dx / len) * 2;
          proj.vy = (dy / len) * 2;
        }
        
        // check hit player
        const hit = (
          proj.x + proj.width > player.x &&
          proj.x < player.x + player.width &&
          proj.y + proj.height > player.y &&
          proj.y < player.y + player.height
        );

        if (hit) {
          if (!player.isGoldApple) {
            applyHurt(0.5);
            // Floating levitation effect!
            player.vy = -4.5;
            player.grounded = false;
          }
          return; // explode bullet
        }
        nextProjectiles.push(proj);
      }
    });
    projectilesRef.current = nextProjectiles;

    // 6. UPDATE ENEMIES
    enemiesRef.current.forEach(enemy => {
      if (enemy.type === 'shulker') {
        // stationary shooting turret
        enemy.shootCooldown--;
        if (enemy.shootCooldown <= 0) {
          enemy.shootCooldown = 150; // frames
          // Shoot heat seeking projectile
          projectilesRef.current.push({
            id: `shulk_${Date.now()}`,
            type: 'shulker_bullet',
            x: enemy.x + enemy.width/2 - 8,
            y: enemy.y + enemy.height/2 - 8,
            vx: 0,
            vy: 0,
            width: 16,
            height: 16,
            isPlayerOwned: false
          });
          gameAudio.playDoubleJump();
        }
        return;
      }

      // Normal patrols
      enemy.vy += 0.35; // gravity
      
      // X patrol logic
      if (enemy.type === 'minecart') {
        enemy.x += enemy.vx * enemy.direction;
        if (enemy.x < 5 * TILE_SIZE || enemy.x > (level.width - 5) * TILE_SIZE) {
          enemy.direction = -enemy.direction as 1 | -1;
        }
      } else {
        enemy.x += enemy.vx * enemy.direction;
        if (enemy.x <= enemy.patrolLeft) {
          enemy.x = enemy.patrolLeft;
          enemy.direction = 1;
        } else if (enemy.x >= enemy.patrolRight) {
          enemy.x = enemy.patrolRight;
          enemy.direction = -1;
        }
      }

      // Resolve basic gravity check on tilemap
      enemy.y += enemy.vy;
      resolveEnemyCollisions(enemy);

      // Creeper swell logic
      if (enemy.type === 'creeper') {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < 80) {
          enemy.isSwelling = true;
          enemy.vx = 0; // stands still and swells!
          enemy.swellTimer++;
          if (enemy.swellTimer >= 40) {
            // EXPLODE!
            triggerExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            enemy.health = 0; // dies
          }
        } else {
          enemy.isSwelling = false;
          if (enemy.swellTimer > 0) enemy.swellTimer--;
          enemy.vx = 0.8; // resumes speed
        }
      }

      // Slime/Magma hop logic
      if (enemy.type === 'slime' || enemy.type === 'magma_cube') {
        if (enemy.vy === 0 && Math.random() < 0.05) {
          enemy.vy = -5.0; // hop up!
          enemy.vx = enemy.direction * 1.5;
        }
      }

      // Check collision with player
      const overlap = (
        player.x + player.width > enemy.x &&
        player.x < enemy.x + enemy.width &&
        player.y + player.height > enemy.y &&
        player.y < enemy.y + enemy.height
      );

      if (overlap && enemy.health > 0) {
        // If falling downwards, stomp head to defeat
        if (player.vy > 0.5 && player.y + player.height < enemy.y + enemy.height/2 && enemy.type !== 'creeper' && enemy.type !== 'shulker') {
          enemy.health = 0; // dead
          player.vy = -5.5; // bounce player
          gameAudio.playSmashBlock();
          spawnImpactParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#10b981');
        } else {
          if (!player.isGoldApple) {
            applyHurt(1);
            player.vx = (player.x < enemy.x ? -1 : 1) * 4; // knockback
          }
        }
      }
    });

    // Remove defeated enemies
    enemiesRef.current = enemiesRef.current.filter(e => e.health > 0);

    // 7. PARTICLES PROGRESSION
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

    // Camera dynamic scroll bounds
    const desiredCamX = player.x - 300;
    cameraRef.current.x += (desiredCamX - cameraRef.current.x) * 0.12;
    // clamp bounds
    if (cameraRef.current.x < 0) cameraRef.current.x = 0;
    const maxCamX = level.width * TILE_SIZE - 800;
    if (cameraRef.current.x > maxCamX) cameraRef.current.x = maxCamX;
  };

  // GRID SOLID COLLISIONS RESOLUTION
  const resolveGridCollisions = (ent: Player, axis: 'x' | 'y') => {
    if (!level) return;

    const buffer = 1;
    const startCol = Math.floor(ent.x / TILE_SIZE);
    const endCol = Math.floor((ent.x + ent.width - buffer) / TILE_SIZE);
    const startRow = Math.floor(ent.y / TILE_SIZE);
    const endRow = Math.floor((ent.y + ent.height - buffer) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < 0 || r >= level.height || c < 0 || c >= level.width) continue;
        const tile = level.grid[r][c];

        // Solid block criteria
        const isSolid = (
          tile !== 'empty' &&
          tile !== 'water' &&
          tile !== 'coin' &&
          tile !== 'diamond' &&
          tile !== 'portal_pipe' &&
          tile !== 'portal_mine' &&
          tile !== 'portal_cloud' &&
          tile !== 'portal_water' &&
          tile !== 'portal_ender' &&
          tile !== 'portal_back' &&
          tile !== 'flagpole' &&
          tile !== 'question_block' // we resolve custom below
        );

        if (isSolid) {
          if (axis === 'x') {
            if (ent.vx > 0) {
              ent.x = c * TILE_SIZE - ent.width;
              ent.vx = 0;
            } else if (ent.vx < 0) {
              ent.x = (c + 1) * TILE_SIZE;
              ent.vx = 0;
            }

            // Dive crash smash check for breakable blocks!
            if (ent.isDiving && (tile === 'breakable_dirt' || tile === 'breakable_glass')) {
              level.grid[r][c] = 'empty';
              gameAudio.playSmashBlock();
              spawnBlockShatter(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, tile === 'breakable_dirt' ? '#854d0e' : '#e0f2fe');
            }
          } else {
            if (ent.vy > 0) {
              ent.y = r * TILE_SIZE - ent.height;
              ent.vy = 0;
              ent.grounded = true;
              ent.doubleJumpAvailable = true;

              // Spring trampoline block launch
              if (tile === 'spring') {
                ent.vy = -12.5; // mega springboard bounce!
                ent.grounded = false;
                ent.squishX = 0.6;
                ent.squishY = 1.4;
                gameAudio.playSpring();
                spawnJumpParticles(ent.x + ent.width/2, ent.y + ent.height, '#eab308');
              }
            } else if (ent.vy < 0) {
              ent.y = (r + 1) * TILE_SIZE;
              ent.vy = 0;
            }
          }
        }

        // Bumping Question blocks from underneath
        if (tile === 'question_block' && axis === 'y' && ent.vy < 0) {
          level.grid[r][c] = 'stone'; // Turn into solid grey stone
          ent.vy = 0.5; // knock down
          gameAudio.playSmashBlock();
          spawnImpactParticles(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, '#ffd700');
          
          // Randomly spawn diamond, gold-apple, or coin inside!
          const rnd = Math.random();
          if (rnd < 0.15) {
            // Gold Apple变身 item!
            ent.isGoldApple = true;
            ent.goldAppleTimer = 300; // 5 seconds
            gameAudio.playWin();
            spawnEnderSparkles(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2);
          } else if (rnd < 0.35) {
            // Diamond spawn!
            setDiamondsCollected(prev => prev + 1);
            gameAudio.playDiamond();
          } else {
            // Coin
            setCoinsCollected(prev => prev + 1);
            gameAudio.playCoin();
          }
        }

        // Collectibles collision check
        if (tile === 'coin') {
          level.grid[r][c] = 'empty';
          setCoinsCollected(prev => prev + 1);
          gameAudio.playCoin();
          spawnCollectParticle(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, '#ffd700');
        } else if (tile === 'diamond') {
          level.grid[r][c] = 'empty';
          setDiamondsCollected(prev => prev + 1);
          gameAudio.playDiamond();
          spawnCollectParticle(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, '#55ffea');
        }

        // Goal flagpole win condition
        if (tile === 'flagpole') {
          triggerLevelWin();
          return;
        }

        // Portal Entry checks
        if (tile.startsWith('portal_')) {
          handlePortalTransition(tile);
          return;
        }
      }
    }
  };

  // ENEMY COLLISIONS RESOLVING
  const resolveEnemyCollisions = (enemy: Enemy) => {
    if (!level) return;
    const startCol = Math.floor(enemy.x / TILE_SIZE);
    const endCol = Math.floor((enemy.x + enemy.width) / TILE_SIZE);
    const startRow = Math.floor(enemy.y / TILE_SIZE);
    const endRow = Math.floor((enemy.y + enemy.height) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < 0 || r >= level.height || c < 0 || c >= level.width) continue;
        const tile = level.grid[r][c];

        if (tile !== 'empty' && tile !== 'water' && tile !== 'coin' && tile !== 'diamond' && !tile.startsWith('portal_') && tile !== 'flagpole') {
          if (enemy.vy > 0) {
            enemy.y = r * TILE_SIZE - enemy.height;
            enemy.vy = 0;
          }
        }
      }
    }
  };

  // PORTAL LOGIC HANDLERS
  const handlePortalTransition = (portalTile: string) => {
    if (!level) return;

    gameAudio.playPortalEnter();
    
    let targetSecretId = 0;
    if (portalTile === 'portal_pipe') targetSecretId = 101;
    else if (portalTile === 'portal_mine') targetSecretId = 102;
    else if (portalTile === 'portal_cloud') targetSecretId = 103;
    else if (portalTile === 'portal_water') targetSecretId = 104;
    else if (portalTile === 'portal_ender') targetSecretId = 105;
    else if (portalTile === 'portal_back') {
      // Return back to main corresponding level!
      let originalLevelId = 1;
      if (levelId === 101) originalLevelId = 1;
      else if (levelId === 102) originalLevelId = 2;
      else if (levelId === 103) originalLevelId = 3;
      else if (levelId === 104) originalLevelId = 4;
      else if (levelId === 105) originalLevelId = 5;

      const loaded = getLevel(originalLevelId);
      if (loaded) {
        setLevel(loaded);
        resetLevelState(loaded);
        gameAudio.startMusic(loaded.bgMusicType);
      }
      return;
    }

    if (targetSecretId > 0) {
      onUnlockSecret(targetSecretId);
      const loaded = getLevel(targetSecretId);
      if (loaded) {
        setLevel(loaded);
        resetLevelState(loaded);
        gameAudio.startMusic(loaded.bgMusicType);
      }
    }
  };

  // HURT SYSTEM
  const applyHurt = (amt: number) => {
    const player = playerRef.current;
    if (player.invulnFrames > 0 || player.isGoldApple || gameOver) return;

    player.health -= amt;
    setHearts(Math.max(0, player.health));
    player.invulnFrames = 60; // 1 second invuln
    setDamageCount(prev => prev + 1);
    gameAudio.playHurt();

    if (player.health <= 0) {
      setGameOver(true);
      gameAudio.playExplosion();
    }
  };

  // RESPAWN
  const respawnPlayer = () => {
    if (!level) return;
    const player = playerRef.current;
    player.x = level.startX * TILE_SIZE;
    player.y = level.startY * TILE_SIZE;
    player.vx = 0;
    player.vy = 0;
  };

  // EXPLOSION BLAST LOGIC
  const triggerExplosion = (ex: number, ey: number) => {
    gameAudio.playExplosion();
    spawnExplosionParticles(ex, ey);

    const blastRadius = 90;
    
    // Impact player
    const player = playerRef.current;
    const pdist = Math.hypot(player.x + player.width/2 - ex, player.y + player.height/2 - ey);
    if (pdist < blastRadius) {
      const force = (blastRadius - pdist) / blastRadius;
      const angle = Math.atan2(player.y + player.height/2 - ey, player.x + player.width/2 - ex);
      if (!player.isGoldApple) {
        applyHurt(1);
        player.vx = Math.cos(angle) * force * 8;
        player.vy = Math.sin(angle) * force * 8 - 2.5;
        player.grounded = false;
      }
    }

    // Impact enemies
    enemiesRef.current.forEach(enemy => {
      const edist = Math.hypot(enemy.x + enemy.width/2 - ex, enemy.y + enemy.height/2 - ey);
      if (edist < blastRadius) {
        const force = (blastRadius - edist) / blastRadius;
        const angle = Math.atan2(enemy.y + enemy.height/2 - ey, enemy.x + enemy.width/2 - ex);
        enemy.health -= 1;
        enemy.vx = Math.cos(angle) * force * 9;
        enemy.vy = Math.sin(angle) * force * 9 - 3;
      }
    });

    // Destroy breakable blocks nearby
    if (level) {
      const blockRadius = 2;
      const bx = Math.floor(ex / TILE_SIZE);
      const by = Math.floor(ey / TILE_SIZE);
      for (let r = by - blockRadius; r <= by + blockRadius; r++) {
        for (let c = bx - blockRadius; c <= bx + blockRadius; c++) {
          if (r >= 0 && r < level.height && c >= 0 && c < level.width) {
            const tile = level.grid[r][c];
            if (tile === 'breakable_dirt' || tile === 'breakable_glass') {
              level.grid[r][c] = 'empty';
              spawnBlockShatter(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, tile === 'breakable_dirt' ? '#854d0e' : '#e0f2fe');
            }
          }
        }
      }
    }
  };

  // LEVEL COMPLETED
  const triggerLevelWin = () => {
    setGameWon(true);
    gameAudio.playWin();

    // Calculate rating stars
    let earnedStars = 1;
    if (timer < 45 && damageCount <= 2) earnedStars = 2;
    if (timer < 35 && damageCount === 0 && diamondsCollected >= level!.diamondsToCollect) earnedStars = 3;

    onWin(earnedStars, diamondsCollected, timer, damageCount);
  };

  // PARTICLE EMITTERS
  const spawnJumpParticles = (x: number, y: number, col: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        color: col,
        size: 3 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 10,
        type: 'pixel'
      });
    }
  };

  const spawnCollectParticle = (x: number, y: number, col: string) => {
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color: col,
        size: 4 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 15,
        type: 'star'
      });
    }
  };

  const spawnBlockShatter = (x: number, y: number, col: string) => {
    for (let i = 0; i < 16; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5 - 1,
        color: col,
        size: 4 + Math.random() * 5,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 15,
        type: 'pixel'
      });
    }
  };

  const spawnExplosionParticles = (x: number, y: number) => {
    // sparks
    for (let i = 0; i < 25; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 2,
        color: Math.random() < 0.5 ? '#f97316' : '#ef4444',
        size: 4 + Math.random() * 6,
        alpha: 1,
        life: 0,
        maxLife: 40,
        type: 'fire'
      });
    }
    // grey smoke cloud
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: '#4b5563',
        size: 12 + Math.random() * 15,
        alpha: 0.8,
        life: 0,
        maxLife: 50,
        type: 'smoke'
      });
    }
  };

  const spawnImpactParticles = (x: number, y: number, col: string) => {
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        color: col,
        size: 4 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 25,
        type: 'pixel'
      });
    }
  };

  const spawnLavaBubbles = (x: number, y: number) => {
    if (Math.random() > 0.15) return;
    particlesRef.current.push({
      x, y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 1,
      color: '#ef4444',
      size: 3 + Math.random() * 3,
      alpha: 1,
      life: 0,
      maxLife: 20,
      type: 'fire'
    });
  };

  const spawnEnderSparkles = (x: number, y: number) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color: '#c084fc',
        size: 3 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 30,
        type: 'portal'
      });
    }
  };

  // RENDER GRAPHICS CYCLE
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !level) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Biome-specific Skies gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (level.biome === 'grassland' || level.biome === 'forest') {
      gradient.addColorStop(0, '#bae6fd'); // blue sky
      gradient.addColorStop(1, '#bae6fd');
    } else if (level.biome === 'desert') {
      gradient.addColorStop(0, '#fef08a'); // dusty amber
      gradient.addColorStop(1, '#fed7aa');
    } else if (level.biome === 'ice') {
      gradient.addColorStop(0, '#c084fc'); // lavender skies
      gradient.addColorStop(1, '#e0f2fe');
    } else if (level.biome === 'volcano') {
      gradient.addColorStop(0, '#1c1917'); // dark ash
      gradient.addColorStop(1, '#450a0a');
    } else if (level.biome === 'mineshaft') {
      gradient.addColorStop(0, '#111827');
      gradient.addColorStop(1, '#1f2937');
    } else if (level.biome === 'cloud') {
      gradient.addColorStop(0, '#4f46e5');
      gradient.addColorStop(1, '#818cf8');
    } else if (level.biome === 'deepsea') {
      gradient.addColorStop(0, '#020617');
      gradient.addColorStop(1, '#1e3a8a');
    } else if (level.biome === 'ender') {
      gradient.addColorStop(0, '#030712'); // void purple
      gradient.addColorStop(1, '#1e1b4b');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Cloud decoration floating in background
    if (level.biome === 'grassland' || level.biome === 'forest' || level.biome === 'cloud' || level.biome === 'ice') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      // Programmatic clouds sliding left
      const cTime = Date.now() * 0.003;
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 240 - cTime) % (canvas.width + 150)) - 100;
        const cy = 40 + (i % 3) * 30;
        // pixel clouds
        ctx.fillRect(cx, cy, 80, 20);
        ctx.fillRect(cx + 15, cy - 10, 50, 10);
      }
    }

    // Save Context for Camera translation
    ctx.save();
    ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

    // 1. DRAW TILE GRID MAP
    const startX = Math.floor(cameraRef.current.x / TILE_SIZE);
    const endX = Math.ceil((cameraRef.current.x + canvas.width) / TILE_SIZE);

    for (let r = 0; r < level.height; r++) {
      for (let c = startX; c <= endX; c++) {
        if (c < 0 || c >= level.width) continue;
        const tile = level.grid[r][c];
        if (tile === 'empty') continue;

        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        drawBlock(ctx, tile, x, y);
      }
    }

    // 2. DRAW PLATFORMS
    platformsRef.current.forEach(plat => {
      ctx.fillStyle = plat.isPiston ? '#78716c' : '#7c2d12'; // stone/wood look
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      // Bevel boarder lines
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(plat.x + 1, plat.y + 1, plat.width - 2, plat.height - 2);

      // Yellow/Red hazard stripe on piston
      if (plat.isPiston) {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(plat.x + 4, plat.y + 4, 12, plat.height - 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(plat.x + 16, plat.y + 4, 8, plat.height - 8);
      }
    });

    // 3. DRAW ENEMIES
    enemiesRef.current.forEach(enemy => {
      drawEnemy(ctx, enemy);
    });

    // 4. DRAW PROJECTILES
    projectilesRef.current.forEach(proj => {
      if (proj.type === 'tnt') {
        // Red flashing TNT
        const isFlash = Math.floor(Date.now() / 150) % 2 === 0;
        ctx.fillStyle = isFlash ? '#ffffff' : '#ef4444';
        ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        
        // white wrap lines
        ctx.fillStyle = isFlash ? '#ef4444' : '#ffffff';
        ctx.fillRect(proj.x + 1, proj.y + 6, proj.width - 2, 8);
        
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(proj.x, proj.y, proj.width, proj.height);
      } else if (proj.type === 'ender_pearl') {
        // glowing orb
        ctx.fillStyle = '#2dd4bf';
        ctx.beginPath();
        ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#115e59';
        ctx.stroke();
      } else if (proj.type === 'shulker_bullet') {
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(proj.x + proj.width/2, proj.y + proj.height/2, proj.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(proj.x + 6, proj.y + 6, 4, 4);
      }
    });

    // 5. DRAW PARTICLES
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1.0; // reset

    // 6. DRAW PLAYER EGGY (The squishy block eggy!)
    const p = playerRef.current;
    ctx.save();
    
    // Position at base pivot for squish scaling
    ctx.translate(p.x + p.width/2, p.y + p.height);

    // Apply squish factor multipliers
    ctx.scale(p.squishX, p.squishY);

    // Invulnerability flashing
    const isVisible = p.invulnFrames === 0 || Math.floor(p.invulnFrames / 4) % 2 === 0;
    
    if (isVisible) {
      // 1. Draw Body base shape (Minecraft rounded cube block)
      let bodyColor = '#ffdd22'; // Default
      let faceColor = '#333333';
      const skin = SKINS.find(s => s.id === activeSkin);
      if (skin) {
        bodyColor = skin.color;
        faceColor = skin.faceColor;
      }

      // Enchanted Gold Apple Override sparkle color
      if (p.isGoldApple) {
        bodyColor = '#facc15';
      }

      // Draw cube-like base with gradient
      const pGrad = ctx.createLinearGradient(-p.width/2, -p.height, p.width/2, 0);
      pGrad.addColorStop(0, bodyColor);
      pGrad.addColorStop(1, adjustColorBrightness(bodyColor, -25));
      ctx.fillStyle = pGrad;

      // Draw roundish-rect (Eggy rounded square)
      const rad = 8;
      ctx.beginPath();
      ctx.roundRect(-p.width/2, -p.height, p.width, p.height, rad);
      ctx.fill();

      // Outer blocky border outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3D Inner block shadow bevel line
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-p.width/2 + 2, -p.height + 2, p.width - 4, p.height - 4, rad - 2);
      ctx.stroke();

      // 2. Draw Face details
      // Cute eyes
      ctx.fillStyle = faceColor;
      ctx.beginPath();
      // left eye
      ctx.arc(-6, -p.height/2 - 3, 3.5, 0, Math.PI * 2);
      // right eye
      ctx.arc(6, -p.height/2 - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye shines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7.5, -p.height/2 - 5, 1.5, 1.5);
      ctx.fillRect(4.5, -p.height/2 - 5, 1.5, 1.5);

      // Blushing cheeks
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.roundRect(-12, -p.height/2 + 2, 4, 2, 1);
      ctx.roundRect(8, -p.height/2 + 2, 4, 2, 1);
      ctx.fill();

      // Smiling mouth
      ctx.strokeStyle = faceColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -p.height/2 + 1, 3.5, 0, Math.PI);
      ctx.stroke();

      // Enchanted purple shine flow overlay
      if (p.isGoldApple) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.beginPath();
        ctx.roundRect(-p.width/2, -p.height, p.width, p.height, rad);
        ctx.fill();
      }
    }

    ctx.restore(); // Restore Player Matrix

    ctx.restore(); // Restore Camera translation

    // Slow interpolation back to neutral squishing state
    p.squishX += (1 - p.squishX) * 0.12;
    p.squishY += (1 - p.squishY) * 0.12;
  };

  // BLOCK DRAWING SUBROUTINE (Procedural pixel MC textures!)
  const drawBlock = (ctx: CanvasRenderingContext2D, tile: TileType, x: number, y: number) => {
    ctx.save();

    // Standard 3D shadow shading
    let baseCol = '#78716c';
    let borderCol = '#1c1917';
    let detailCol = '#a8a29e';

    if (tile === 'grass') {
      baseCol = '#854d0e'; // dirt base
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      
      // green lush cap top
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(x, y, TILE_SIZE, 10);
      
      // grass hanging pixel blades
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x + 4, y + 10, 4, 4);
      ctx.fillRect(x + 16, y + 10, 6, 6);
      ctx.fillRect(x + 28, y + 10, 5, 4);
    } else if (tile === 'dirt') {
      baseCol = '#78350f';
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // Speckled dirt bits
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + 4, y + 6, 3, 3);
      ctx.fillRect(x + 18, y + 24, 4, 3);
      ctx.fillRect(x + 28, y + 10, 3, 4);
    } else if (tile === 'stone') {
      baseCol = '#57534e';
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // Stone noise lines
      ctx.fillStyle = '#292524';
      ctx.fillRect(x + 2, y + 4, 36, 2);
      ctx.fillRect(x + 4, y + 18, 12, 2);
      ctx.fillRect(x + 20, y + 26, 16, 2);
    } else if (tile === 'wood') {
      baseCol = '#78350f'; // rich brown plank
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // wood rings details
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 2);
      ctx.fillRect(x + 2, y + TILE_SIZE - 4, TILE_SIZE - 4, 2);
      ctx.fillRect(x + TILE_SIZE/2 - 2, y + 2, 4, TILE_SIZE - 4);
    } else if (tile === 'obsidian') {
      baseCol = '#1e1b4b'; // deep indigo
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // weeping sparkles
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(x + 8, y + 12, 4, 4);
      ctx.fillRect(x + 24, y + 26, 4, 4);
      ctx.fillRect(x + 18, y + 4, 3, 3);
    } else if (tile === 'glass') {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // diagonal shines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + TILE_SIZE - 4);
      ctx.lineTo(x + TILE_SIZE - 4, y + 4);
      ctx.stroke();
    } else if (tile === 'cactus') {
      baseCol = '#15803d';
      ctx.fillStyle = baseCol;
      ctx.fillRect(x + 4, y, TILE_SIZE - 8, TILE_SIZE);
      // little needles
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 2, y + 8, 3, 2);
      ctx.fillRect(x + TILE_SIZE - 5, y + 18, 3, 2);
      ctx.fillRect(x + 2, y + 26, 3, 2);
    } else if (tile === 'lava') {
      // undulating liquid red/orange
      const flow = Math.floor(Date.now() / 200) % 3;
      ctx.fillStyle = flow === 0 ? '#ea580c' : flow === 1 ? '#ef4444' : '#f97316';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(x, y, TILE_SIZE, 8);
    } else if (tile === 'water') {
      ctx.fillStyle = 'rgba(37, 99, 235, 0.65)';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // waves lines
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x + TILE_SIZE, y + 4);
      ctx.stroke();
    } else if (tile === 'sand') {
      baseCol = '#fef08a';
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(x + 6, y + 14, 3, 3);
      ctx.fillRect(x + 26, y + 24, 3, 3);
    } else if (tile === 'ice') {
      baseCol = '#bae6fd';
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    } else if (tile === 'end_stone') {
      baseCol = '#fef08a'; // beige
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // end stone noise veins
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 2, y + 4, 15, 2);
      ctx.fillRect(x + 14, y + 18, 20, 2);
    } else if (tile === 'breakable_dirt') {
      baseCol = '#a16207';
      ctx.fillStyle = baseCol;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // crack lines
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
      ctx.moveTo(x + TILE_SIZE - 4, y + 4);
      ctx.lineTo(x + 4, y + TILE_SIZE - 4);
      ctx.stroke();
    } else if (tile === 'breakable_glass') {
      ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      // intense fracture spiderwebs
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + TILE_SIZE/2, y + TILE_SIZE/2);
      ctx.lineTo(x + 2, y + 4);
      ctx.moveTo(x + TILE_SIZE/2, y + TILE_SIZE/2);
      ctx.lineTo(x + TILE_SIZE - 4, y + 28);
      ctx.stroke();
    } else if (tile === 'spring') {
      // Coiled spring
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 6, y + TILE_SIZE - 12, TILE_SIZE - 12, 12); // baseplate
      // metal rings coil
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + TILE_SIZE - 12);
      ctx.lineTo(x + TILE_SIZE - 12, y + TILE_SIZE - 20);
      ctx.lineTo(x + 12, y + TILE_SIZE - 28);
      ctx.lineTo(x + TILE_SIZE - 12, y + TILE_SIZE - 32);
      ctx.stroke();
      // yellow headcap
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 4, y + TILE_SIZE - 36, TILE_SIZE - 8, 6);
    } else if (tile.startsWith('portal_')) {
      // Swirling Vortex portal blocks
      let vortexCol = '#22c55e'; // default pipe green
      if (tile === 'portal_mine') vortexCol = '#f97316';
      else if (tile === 'portal_cloud') vortexCol = '#38bdf8';
      else if (tile === 'portal_water') vortexCol = '#2563eb';
      else if (tile === 'portal_ender') vortexCol = '#c084fc';
      else if (tile === 'portal_back') vortexCol = '#a855f7';

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

      // drawn concentric spinning squares
      ctx.strokeStyle = vortexCol;
      ctx.lineWidth = 3;
      const angle = (Date.now() * 0.005) % (Math.PI * 2);
      ctx.translate(x + TILE_SIZE/2, y + TILE_SIZE/2);
      ctx.rotate(angle);
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.rotate(-angle * 1.8);
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.translate(-(x + TILE_SIZE/2), -(y + TILE_SIZE/2));
    } else if (tile === 'flagpole') {
      // goal flag post
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + TILE_SIZE/2 - 2, y, 4, TILE_SIZE);
      // huge Red flag at top
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(x + TILE_SIZE/2, y + 4);
      ctx.lineTo(x + TILE_SIZE/2 + 24, y + 12);
      ctx.lineTo(x + TILE_SIZE/2, y + 20);
      ctx.closePath();
      ctx.fill();
    } else if (tile === 'coin') {
      // golden spinning cube coin
      const scale = Math.abs(Math.sin(Date.now() * 0.004));
      ctx.fillStyle = '#facc15';
      ctx.translate(x + TILE_SIZE/2, y + TILE_SIZE/2);
      ctx.scale(scale, 1);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.scale(1/scale, 1);
      ctx.translate(-(x + TILE_SIZE/2), -(y + TILE_SIZE/2));
    } else if (tile === 'diamond') {
      // shining skyblue diamond block
      const scale = 1 + Math.sin(Date.now() * 0.008) * 0.1;
      ctx.fillStyle = '#22d3ee';
      ctx.translate(x + TILE_SIZE/2, y + TILE_SIZE/2);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      // glint sparkle eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -4, 4, 4);
      ctx.scale(1/scale, 1/scale);
      ctx.translate(-(x + TILE_SIZE/2), -(y + TILE_SIZE/2));
    } else if (tile === 'question_block') {
      // yellow box with a black question mark
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

      // Question mark drawn in pixels
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + TILE_SIZE/2, y + TILE_SIZE/2);
    }

    // Outer absolute black grid line for MC pixel voxel look
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.restore();
  };

  // ENEMY RENDERER
  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    ctx.save();
    
    if (enemy.type === 'zombie') {
      // green cube face zombie Eggy
      ctx.fillStyle = '#10b981'; // green face
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
      // zombie eyes
      ctx.fillStyle = '#ef4444'; // glowing red angry eyes
      ctx.fillRect(enemy.x + 4, enemy.y + 8, 6, 4);
      ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 8, 6, 4);
      // blue outfit clothes strip
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(enemy.x, enemy.y + enemy.height - 8, enemy.width, 8);
    } else if (enemy.type === 'creeper') {
      // Green creeper
      // Scaling hissing visual expansion!
      const scale = enemy.isSwelling ? 1 + (enemy.swellTimer / 40) * 0.25 : 1;
      const isWhiteFlash = enemy.isSwelling && Math.floor(enemy.swellTimer / 4) % 2 === 0;

      ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height);
      ctx.scale(scale, scale);

      ctx.fillStyle = isWhiteFlash ? '#ffffff' : '#15803d'; // swelling flashing white
      ctx.fillRect(-enemy.width/2, -enemy.height, enemy.width, enemy.height);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(-enemy.width/2, -enemy.height, enemy.width, enemy.height);

      // face lines
      ctx.fillStyle = '#000000';
      ctx.fillRect(-8, -24, 5, 5); // left eye
      ctx.fillRect(3, -24, 5, 5); // right eye
      ctx.fillRect(-3, -15, 6, 8); // frown mouth
      ctx.fillRect(-6, -11, 4, 6);
      ctx.fillRect(2, -11, 4, 6);

      ctx.scale(1/scale, 1/scale);
      ctx.translate(-(enemy.x + enemy.width/2), -(enemy.y + enemy.height));
    } else if (enemy.type === 'slime') {
      // bouncy translucent green square
      ctx.fillStyle = 'rgba(34, 197, 94, 0.72)';
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
      // eyes
      ctx.fillStyle = '#166534';
      ctx.fillRect(enemy.x + 4, enemy.y + 6, 4, 4);
      ctx.fillRect(enemy.x + enemy.width - 8, enemy.y + 6, 4, 4);
    } else if (enemy.type === 'magma_cube') {
      ctx.fillStyle = '#991b1b'; // magma dark lava
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      // orange core segment
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(enemy.x + 3, enemy.y + 8, enemy.width - 6, 6);
      // glowing eyes
      ctx.fillStyle = '#facc15';
      ctx.fillRect(enemy.x + 4, enemy.y + 16, 4, 4);
      ctx.fillRect(enemy.x + enemy.width - 8, enemy.y + 16, 4, 4);
    } else if (enemy.type === 'shulker') {
      ctx.fillStyle = '#7c3aed'; // Purple box shulker shell
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // small peering yellow eye inside opening shell
      const wave = Math.floor(Date.now() / 300) % 2 === 0;
      if (wave) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(enemy.x + 4, enemy.y + 6, enemy.width - 8, enemy.height - 12);
        ctx.fillStyle = '#facc15'; // yellow eye
        ctx.fillRect(enemy.x + enemy.width/2 - 3, enemy.y + enemy.height/2 - 3, 6, 6);
      }
    }

    ctx.restore();
  };

  // HELPERS
  const adjustColorBrightness = (hex: string, percent: number) => {
    let num = parseInt(hex.replace("#",""),16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<0?0:R:255)*0x10000 + (G<255?G<0?0:G:255)*0x100 + (B<255?B<0?0:B:255)).toString(16).slice(1);
  };

  // TOUCH Virtual Buttons
  const handleTouchStart = (dir: 'left' | 'right' | 'jump' | 'dive') => {
    mobileInput.current[dir] = true;
    if (dir === 'jump') triggerJump();
    if (dir === 'dive') triggerDive();
  };

  const handleTouchEnd = (dir: 'left' | 'right' | 'jump' | 'dive') => {
    mobileInput.current[dir] = false;
  };

  return (
    <div className="w-full flex flex-col items-center select-none animate-in fade-in duration-300">
      
      {/* Immersive HUD Header stats row */}
      <div className="w-full max-w-3xl bg-black/85 border-t-4 border-x-4 border-black rounded-t-2xl p-3 flex flex-col sm:flex-row justify-between items-center text-white font-mono text-sm z-10 shadow-2xl gap-3 sm:gap-0">
        
        {/* Left Side: HP Hearts & XP Progress Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Hearts indicators in rotated diamond style */}
          <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
            <span className="text-[11px] uppercase font-black tracking-widest text-red-500 font-mono">HP</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((hIdx) => (
                <div
                  key={hIdx}
                  className={`w-4 h-4 rotate-45 border-2 border-black transition-all duration-300 ${
                    hIdx <= hearts ? 'bg-[#ff4444] shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110' : 'bg-gray-700/60'
                  }`}
                  style={{ transformOrigin: 'center' }}
                />
              ))}
            </div>
          </div>

          {/* Minecraft Thematic XP bar */}
          <div className="w-full sm:w-36 h-4 bg-[#333] border border-black relative overflow-hidden shadow-inner flex-shrink-0 rounded-sm">
            <div className="h-full bg-[#55ff55] transition-all duration-300" style={{ width: `${Math.min(100, (coinsCollected / 20) * 100)}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white font-mono drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.9)]">
              XP {coinsCollected} / 20
            </div>
          </div>
        </div>

        {/* Right Side: Diamonds and Control Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Immersive Diamonds Collected Panel */}
          <div className="flex items-center space-x-1.5 bg-black/40 px-2.5 py-1.5 rounded-full border border-white/10 shadow-md">
            <div className="w-3 h-3 bg-cyan-400 rotate-45 shadow-[0_0_8px_rgba(34,211,238,0.7)] animate-pulse" />
            <span className="font-mono font-bold text-cyan-400 text-sm">×{diamondsCollected < 10 ? `0${diamondsCollected}` : diamondsCollected}</span>
            {level && <span className="text-[10px] text-gray-500 font-normal">/ 0{level.diamondsToCollect}</span>}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={toggleMusic}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-md transition-colors cursor-pointer"
              title="Music Toggle"
            >
              {musicMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-green-400" />}
            </button>
            <button
              onClick={() => resetLevelState(level!)}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-md transition-colors cursor-pointer"
              title="Reset Level"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* CANVAS ELEMENT STAGE & OVERLAYS */}
      <div className="relative w-full max-w-3xl border-x-4 border-b-4 border-black rounded-b-2xl shadow-2xl overflow-hidden bg-[#71A1FF]">
        <canvas
          ref={canvasRef}
          width={800}
          height={420}
          className="w-full h-auto block bg-[#71A1FF]"
        />

        {/* Immersive Level Banner panel inside game (replacing the generic tag) */}
        {level && (
          <div className="absolute top-4 left-4 bg-black/80 border-4 border-[#888] p-4 text-center rounded-lg shadow-2xl pointer-events-none select-none z-10 animate-fade-in">
            <h2 className="text-[#ffcc00] font-black tracking-widest text-base md:text-lg font-mono">LEVEL 0{levelId}</h2>
            <p className="text-[10px] uppercase tracking-tighter opacity-70 font-sans text-gray-300">{level.name}</p>
          </div>
        )}

        {/* Dynamic Radar Mini Map Box */}
        {level && (
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md p-1.5 border border-white/25 rounded-lg shadow-2xl hidden sm:block select-none pointer-events-none z-10">
            <div className="text-[8px] uppercase font-bold text-cyan-400 mb-1 font-mono flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              雷达 Mini Map
            </div>
            <div className="w-20 h-12 bg-[#1a1a1a] border border-white/25 relative rounded overflow-hidden">
              {/* Goal Flag marker */}
              <div className="absolute right-2 top-1/2 w-1.5 h-1.5 bg-red-500 rotate-45 border border-black shadow-[0_0_4px_rgba(239,68,68,0.7)]" />
              {/* Decorative block layouts */}
              <div className="absolute left-6 bottom-1.5 w-4 h-0.5 bg-green-500/30" />
              
              {/* Dynamic Player dot */}
              <div
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse border border-black shadow-[0_0_6px_#fbbf24]"
                style={{
                  left: `${Math.max(6, Math.min(90, (playerRef.current.x / (level.width * 38)) * 100))}%`,
                  top: `${Math.max(6, Math.min(90, (playerRef.current.y / (level.height * 38)) * 100))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          </div>
        )}

        {/* Hidden Stages Sidebar Panel on the Right Side */}
        <div className="absolute top-[35%] right-0 bg-black/85 border-y border-l border-white/20 p-3 pr-4 rounded-l-2xl flex flex-col gap-2 shadow-2xl hidden lg:flex z-10 select-none">
          <div className="text-[9px] uppercase font-black text-[#ffcc00] tracking-wider font-mono">
            隐藏密道 Hidden Stages
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono border transition-all duration-300 ${
              progress.unlockedLevels.includes(101) 
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                : 'bg-gray-900/90 border-gray-700/50 text-gray-500 opacity-30'
            }`}>
              01
            </div>
            <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono border transition-all duration-300 ${
              progress.unlockedLevels.includes(102) 
                ? 'bg-blue-950/90 border-blue-500 text-blue-300 font-bold shadow-[0_0_8px_rgba(59,130,246,0.4)]' 
                : 'bg-gray-900/90 border-gray-700/50 text-gray-500 opacity-30'
            }`}>
              02
            </div>
            <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono border transition-all duration-300 ${
              progress.unlockedLevels.includes(103) 
                ? 'bg-purple-950/90 border-purple-500 text-purple-300 font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]' 
                : 'bg-gray-900/90 border-gray-700/50 text-gray-500 opacity-30'
            }`}>
              03
            </div>
          </div>
        </div>

        {/* Blink alert overlay when player is Gold Apple Invulnerable */}
        {playerRef.current.isGoldApple && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-yellow-400/20 px-3 py-1.5 border border-yellow-400/50 rounded pointer-events-none z-10 animate-pulse">
            <div className="text-[10px] font-bold text-yellow-400 tracking-widest font-mono">
              ⚡ NEW PATH DETECTED: SUPER EGGY ACTIVE ⚡
            </div>
          </div>
        )}

        {/* PAUSE MODAL OVERLAY */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white z-20">
            <div className="bg-[#1a1a1a] border-4 border-black p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
              <h3 className="text-xl font-bold text-[#ffcc00] font-sans tracking-wide">⏸ 冒险暂停中</h3>
              <p className="text-xs text-gray-400 font-mono">
                当前耗时: {timer.toFixed(1)}s | 收集钻石: {diamondsCollected}
              </p>
              
              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={() => setIsPaused(false)}
                  className="w-full py-2 bg-[#ffcc00] hover:bg-yellow-400 text-black border-2 border-black rounded-lg font-bold font-sans cursor-pointer transition-transform active:scale-95"
                >
                  继续冒险
                </button>
                <button
                  onClick={() => resetLevelState(level!)}
                  className="w-full py-2 bg-[#333] hover:bg-gray-700 border-2 border-[#555] rounded-lg font-bold font-mono text-gray-200 cursor-pointer transition-transform active:scale-95"
                >
                  🔄 重新开始
                </button>
                <button
                  onClick={onBackToMenu}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 border-2 border-black rounded-lg font-bold font-mono text-white cursor-pointer transition-transform active:scale-95"
                >
                  🚪 返回首页
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {gameOver && (
          <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center text-white z-20">
            <div className="bg-[#1a1a1a] border-4 border-red-800 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-pulse">
              <div className="text-4xl">💀</div>
              <h3 className="text-2xl font-black text-red-500 font-sans tracking-wider">掉落虚空 / 挑战失败</h3>
              <p className="text-xs text-gray-400 font-mono leading-relaxed">
                生命值归零！这片虚空危机四伏。重新整理方块与弹跳状态，再试一次！
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => resetLevelState(level!)}
                  className="py-2.5 bg-[#ffcc00] hover:bg-yellow-400 text-black border-2 border-black rounded-lg font-bold font-sans cursor-pointer flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-4 h-4"/> 重新挑战
                </button>
                <button
                  onClick={onBackToMenu}
                  className="py-2.5 bg-[#333] hover:bg-gray-700 border-2 border-[#555] rounded-lg font-bold font-mono text-gray-200 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Home className="w-4 h-4"/> 首页
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME WON / SETTLEMENT OVERLAY */}
        {gameWon && (
          <div className="absolute inset-0 bg-emerald-950/85 flex flex-col items-center justify-center text-white z-20 animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border-4 border-emerald-600 p-6 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="text-4xl animate-bounce">🏆</div>
              <h3 className="text-2xl font-black text-emerald-400 font-sans tracking-wide">
                {level?.isSecret ? '【隐藏密道】通关成功' : '关卡挑战成功！'}
              </h3>
              
              {/* Star Rating calculations */}
              <div className="flex justify-center gap-2 my-2">
                {[1, 2, 3].map((starIdx) => {
                  let active = false;
                  if (starIdx === 1) active = true;
                  if (starIdx === 2 && timer < 45 && damageCount <= 2) active = true;
                  if (starIdx === 3 && timer < 35 && damageCount === 0 && diamondsCollected >= (level?.diamondsToCollect || 1)) active = true;

                  return (
                    <Star
                      key={starIdx}
                      className={`w-8 h-8 ${
                        active ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] scale-110' : 'text-gray-600'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Achievements stats board */}
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 text-xs font-mono text-gray-300 space-y-2 text-left">
                <div className="flex justify-between border-b border-white/5 pb-1"><span>⏱️ 通关耗时:</span> <span className="text-yellow-500 font-bold">{timer.toFixed(1)}s</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span>💎 收集钻石:</span> <span className="text-cyan-400 font-bold">{diamondsCollected} / {level?.diamondsToCollect}</span></div>
                <div className="flex justify-between border-b border-white/5 pb-1"><span>🪙 收集金币:</span> <span className="text-yellow-400 font-bold">{coinsCollected} 块</span></div>
                <div className="flex justify-between"><span>💥 受伤次数:</span> <span className="text-red-400 font-bold">{damageCount} 次</span></div>
              </div>

              {/* Conditional Unlock Secret text */}
              {level?.id === 1 && progress.unlockedLevels.includes(101) && (
                <div className="bg-purple-950/40 border border-purple-800 rounded-lg p-2 text-left text-[11px] font-mono text-purple-300 animate-pulse">
                  🎉 【隐藏彩蛋发现】恭喜！你在关卡一探秘到隐藏的**青草管道隐藏关**！跳跃高度永久获得增幅！
                </div>
              )}
              {level?.id === 2 && progress.unlockedLevels.includes(102) && (
                <div className="bg-purple-950/40 border border-purple-800 rounded-lg p-2 text-left text-[11px] font-mono text-purple-300 animate-pulse">
                  🎉 【隐藏彩蛋发现】恭喜！你在关卡二砸碎墙体解锁了**地下矿洞隐藏关**！无限末影珍珠已觉醒。
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    let stars = 1;
                    if (timer < 45 && damageCount <= 2) stars = 2;
                    if (timer < 35 && damageCount === 0 && diamondsCollected >= (level?.diamondsToCollect || 1)) stars = 3;
                    onWin(stars, diamondsCollected, timer, damageCount);
                  }}
                  className="flex-1 py-3 bg-[#ffcc00] hover:bg-yellow-400 text-black border-2 border-black rounded-xl font-bold font-sans cursor-pointer text-center text-sm transition-transform active:scale-95 shadow-[0_4px_0_#997300]"
                >
                  领取奖励 & 返回首页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MINECRAFT HOTBAR SELECTOR COMPONENT */}
      <div className="w-full max-w-3xl mt-3 bg-black/85 border-4 border-[#555] rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center text-white font-mono shadow-2xl gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-gray-400 font-black uppercase tracking-wider font-mono">快捷方块栏 Hotbar:</span>
          
          <div className="bg-[#222] p-1 flex space-x-1.5 border-2 border-[#444] rounded-lg">
            {(['tnt', 'ender_pearl', 'slime_block', 'honey_block'] as GameItem[]).map((item, idx) => {
              const count = inventory[item] || 0;
              const isSelected = selectedItem === item;

              let icon = '🔴';
              let name = 'TNT';
              if (item === 'ender_pearl') { icon = '🟣'; name = '珍珠'; }
              if (item === 'slime_block') { icon = '🟢'; name = '粘液'; }
              if (item === 'honey_block') { icon = '🟡'; name = '蜂蜜'; }

              return (
                <button
                  key={item}
                  onClick={() => { setSelectedItem(item); gameAudio.playCoin(); }}
                  className={`w-14 h-14 bg-[#333] border-2 flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#ffcc00] shadow-[inset_0_0_10px_rgba(255,204,0,0.6)] scale-105'
                      : 'border-[#555] hover:border-gray-400'
                  }`}
                >
                  <span className="text-lg leading-none">{icon}</span>
                  <div className="text-[8px] font-bold text-gray-400 leading-none mt-1">{name}</div>
                  <span className="absolute bottom-0.5 right-1 text-[10px] text-yellow-500 font-bold">{count}</span>
                  <span className="absolute top-0.5 left-1 text-[8px] text-gray-500">{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleUseItem}
          className="w-full sm:w-auto px-5 py-3 bg-[#ffcc00] hover:bg-yellow-400 text-black border-2 border-black rounded-lg font-black font-sans text-xs tracking-wider transition-all active:scale-95 cursor-pointer shadow-[0_4px_0_#997300] flex items-center justify-center gap-1.5"
        >
          🚀 投掷/使用方块 (SPACE)
        </button>
      </div>

      {/* MOBILE SCENE CONTROLLER (IMMERSIBLE CIRCULAR HUD ACTION PADS) */}
      <div className="w-full max-w-3xl mt-4 bg-black/60 backdrop-blur-md border-2 border-white/10 rounded-2xl p-4 flex justify-between items-center md:hidden select-none">
        
        {/* Left joystick buttons in translucent round style */}
        <div className="flex gap-4">
          <button
            onMouseDown={() => handleTouchStart('left')}
            onMouseUp={() => handleTouchEnd('left')}
            onTouchStart={(e) => { e.preventDefault(); handleTouchStart('left'); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('left'); }}
            className="w-16 h-16 bg-white/10 active:bg-white/30 border-2 border-white/30 rounded-full flex items-center justify-center text-xl font-bold text-white transition-all duration-100 active:scale-90 shadow-md"
          >
            ◀
          </button>
          <button
            onMouseDown={() => handleTouchStart('right')}
            onMouseUp={() => handleTouchEnd('right')}
            onTouchStart={(e) => { e.preventDefault(); handleTouchStart('right'); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('right'); }}
            className="w-16 h-16 bg-white/10 active:bg-white/30 border-2 border-white/30 rounded-full flex items-center justify-center text-xl font-bold text-white transition-all duration-100 active:scale-90 shadow-md"
          >
            ▶
          </button>
        </div>

        {/* Right jump and dive action buttons exactly matching layout specification */}
        <div className="flex items-center gap-4">
          {/* DASH / PUKAN (扑铲) - circular style */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerDive(); }}
            className="w-18 h-18 bg-white/15 active:bg-white/30 border-2 border-white/40 rounded-full flex flex-col items-center justify-center text-xs font-black text-white transition-all duration-100 active:scale-90 shadow-md"
          >
            <div className="text-sm">DASH</div>
            <span className="text-[9px] text-gray-300 mt-0.5">扑铲</span>
          </button>
          {/* JUMP / JUMP (弹性跳) - high-contrast layout circle */}
          <button
            onTouchStart={(e) => { e.preventDefault(); triggerJump(); }}
            className="w-22 h-22 bg-[#ffcc00] active:bg-yellow-400 border-4 border-white/80 rounded-full flex flex-col items-center justify-center text-sm font-black text-black transition-all duration-100 active:scale-90 shadow-2xl"
          >
            <div className="text-base font-black">JUMP</div>
            <span className="text-[10px] text-black font-semibold">弹性跳</span>
          </button>
        </div>
      </div>

    </div>
  );
};
