// Canvas
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;
export const TILE_SIZE = 40;

// Player
export const PLAYER_RADIUS = 16;
export const PLAYER_SPEED = 180;
export const PLAYER_MAX_HP = 5;
export const PLAYER_SHOOT_COOLDOWN = 0.4;
export const PLAYER_TURRET_SPEED = 6;
export const PLAYER_BULLET_SPEED = 350;
export const PLAYER_BULLET_DAMAGE = 1;

// Enemies
export const ENEMY_TYPES = {
  DRONE: {
    radius: 12, speed: 60, hp: 1, shootCooldown: 2.0,
    bulletSpeed: 200, bulletDamage: 1, dropFragments: [1, 3],
    label: '巡逻无人机', color: '#ff3355',
  },
  ASSAULT: {
    radius: 16, speed: 90, hp: 3, shootCooldown: 1.5,
    bulletSpeed: 280, bulletDamage: 1, dropFragments: [2, 4],
    label: '突击机甲', color: '#ff6644',
  },
  SNIPER: {
    radius: 14, speed: 0, hp: 2, shootCooldown: 2.5,
    bulletSpeed: 500, bulletDamage: 2, dropFragments: [2, 5],
    label: '狙击炮台', color: '#ff9900',
  },
  CRAWLER: {
    radius: 10, speed: 200, hp: 1, shootCooldown: 999,
    bulletSpeed: 0, bulletDamage: 2, dropFragments: [1, 2],
    label: '自爆蜘蛛', color: '#ff00aa',
  },
  SHIELD: {
    radius: 18, speed: 50, hp: 4, shootCooldown: 1.8,
    bulletSpeed: 250, bulletDamage: 1, dropFragments: [3, 6],
    label: '护盾守卫', color: '#8844ff',
  },
  HACKER: {
    radius: 13, speed: 40, hp: 2, shootCooldown: 999,
    bulletSpeed: 0, bulletDamage: 0, dropFragments: [3, 5],
    label: '骇客节点', color: '#ff44ff',
  },
};

// Boss (per floor)
export const BOSS_CONFIG = {
  1: { radius: 28, hp: 15, speed: 50, shootCooldown: 1.2, bulletSpeed: 220, bulletDamage: 1, dropFragments: [15, 20], label: '工业巨兽', color: '#ff8800' },
  2: { radius: 30, hp: 22, speed: 60, shootCooldown: 1.0, bulletSpeed: 260, bulletDamage: 1, dropFragments: [18, 25], label: '数据核心守卫', color: '#4488ff' },
  3: { radius: 32, hp: 30, speed: 70, shootCooldown: 0.8, bulletSpeed: 280, bulletDamage: 2, dropFragments: [20, 28], label: '黑市霸主', color: '#cc44ff' },
  4: { radius: 36, hp: 40, speed: 80, shootCooldown: 0.6, bulletSpeed: 300, bulletDamage: 2, dropFragments: [25, 35], label: '核心守护者', color: '#ff2244' },
};

// Bullet types
export const BULLET_TYPES = {
  NORMAL: 'normal',
  BOUNCE: 'bounce',
  PIERCE: 'pierce',
  SPREAD: 'spread',
  EXPLOSIVE: 'explosive',
  ENERGY: 'energy',
};
export const BULLET_EVOLUTION = ['normal', 'bounce', 'pierce', 'explosive', 'energy'];

// Terrain
export const TERRAIN_TYPES = {
  COVER: { hp: 3, radius: 18, label: '掩体', color: '#666644' },
  BARRIER: { hp: 999, radius: 16, label: '能量屏障', color: '#4488ff' },
  CONVEYOR: { hp: 999, radius: 20, label: '传送带', color: '#ffaa00' },
  BARREL: { hp: 1, radius: 14, label: '爆炸桶', color: '#ff4400' },
  TESLA: { hp: 999, radius: 22, label: '电网', color: '#ffff00' },
};

// Room
export const ROOM_TYPES = {
  COMBAT: 'combat',
  ELITE: 'elite',
  SHOP: 'shop',
  TREASURE: 'treasure',
  EVENT: 'event',
  BOSS: 'boss',
};
export const ROOM_WEIGHTS = { combat: 50, elite: 15, shop: 0, treasure: 8, event: 7, boss: 0 };
export const ROOMS_PER_FLOOR = { min: 8, max: 12 };
export const TERRAIN_PER_ROOM = { min: 3, max: 8 };
export const DOORS_PER_ROOM = { min: 2, max: 3 };
export const WAVES_PER_ROOM = { min: 1, max: 3 };

// Shop
export const SHOP_SLOTS = 4;
export const SHOP_REFRESH_COST = 5;
export const SHOP_PRICE_INCREASE = 0.2;

// Upgrades
export const UPGRADES = {
  firerate:  { category: 'weapon', name: '射速提升', maxLevel: 5, effect: { fireRateMul: 0.85 }, baseCost: 10 },
  multishot: { category: 'weapon', name: '弹道+1', maxLevel: 4, effect: { bulletCountAdd: 1 }, baseCost: 15 },
  bulletSpd: { category: 'weapon', name: '弹速提升', maxLevel: 3, effect: { bulletSpeedMul: 1.25 }, baseCost: 8 },
  damage:    { category: 'weapon', name: '伤害强化', maxLevel: 99, effect: { damageMul: 1.2 }, baseCost: 12 },
  evolve:    { category: 'weapon', name: '弹道进化', maxLevel: 1, effect: { evolveBullet: true }, baseCost: 30 },
  shield:    { category: 'defense', name: '护盾', maxLevel: 3, effect: { shieldAdd: 1 }, baseCost: 18 },
  speed:     { category: 'defense', name: '移速提升', maxLevel: 5, effect: { speedMul: 1.1 }, baseCost: 8 },
  maxHp:     { category: 'defense', name: '生命上限', maxLevel: 99, effect: { hpMul: 1.15 }, baseCost: 10 },
  fragment:  { category: 'special', name: '碎片加成', maxLevel: 99, effect: { fragmentMul: 1.3 }, baseCost: 10 },
  turretSpd: { category: 'special', name: '炮塔转速', maxLevel: 4, effect: { turretSpeedMul: 1.3 }, baseCost: 8 },
  drone:     { category: 'special', name: '无人机随从', maxLevel: 2, effect: { droneAdd: 1 }, baseCost: 25 },
};

// Meta
export const TALENT_TREE = {
  attack: [
    { id: 'atk_firerate', name: '起始射速+10%', cost: 5, apply: (p) => { p.shootCooldown *= 0.9; } },
    { id: 'atk_damage', name: '子弹伤害+5%', cost: 8, apply: (p) => { p.bulletDamage += 0.05; } },
    { id: 'atk_crit', name: '暴击 5%', cost: 12, apply: (p) => { p.critChance = (p.critChance || 0) + 0.05; } },
    { id: 'atk_boss', name: 'Boss额外掉落', cost: 20, apply: (p) => { p.bossFragBonus = true; } },
  ],
  defense: [
    { id: 'def_hp', name: '起始HP+1', cost: 5, apply: (p) => { p.maxHp += 1; } },
    { id: 'def_shield', name: '护盾上限+1', cost: 8, apply: (p) => { p.maxShields = (p.maxShields || 0) + 1; } },
    { id: 'def_cover', name: '掩体减伤15%', cost: 12, apply: (p) => { p.coverDR = (p.coverDR || 0) + 0.15; } },
    { id: 'def_revive', name: '复活1次', cost: 25, apply: (p) => { p.revive = true; } },
  ],
  utility: [
    { id: 'util_frags', name: '初始碎片+5', cost: 5, apply: (p) => { p.startFrags = (p.startFrags || 0) + 5; } },
    { id: 'util_refresh', name: '刷新-1碎片', cost: 8, apply: (p) => { p.refreshDiscount = (p.refreshDiscount || 0) + 1; } },
    { id: 'util_bullet', name: '起始弹道+1', cost: 15, apply: (p) => { p.bulletCount += 1; } },
    { id: 'util_skin', name: '解锁新涂装', cost: 30, apply: (p) => { p.skinUnlocked = true; } },
  ],
};

// Colors
export const COLORS = {
  BG: '#0a0a0f',
  PLAYER: '#00ff88',
  ENEMY: '#ff3355',
  ALLY: '#44aaff',
  UI: '#ffcc00',
  FRAGMENT: '#ff66ff',
  WALL: '#334455',
  DOOR: '#ffcc00',
  DOOR_LOCKED: '#442222',
};

// Input keys
export const KEY_BINDS = {
  UP: ['KeyW', 'ArrowUp'],
  DOWN: ['KeyS', 'ArrowDown'],
  LEFT: ['KeyA', 'ArrowLeft'],
  RIGHT: ['KeyD', 'ArrowRight'],
};
