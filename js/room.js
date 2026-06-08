import { ROOM_TYPES, ROOM_WEIGHTS, ROOMS_PER_FLOOR, TERRAIN_PER_ROOM,
         DOORS_PER_ROOM, WAVES_PER_ROOM, CANVAS_WIDTH, CANVAS_HEIGHT,
         ENEMY_TYPES, BOSS_CONFIG } from './config.js';
import { Enemy } from './entities.js';
import { createTerrain } from './terrain.js';

const DOOR_SIZE = 60;
const WALL_THICKNESS = 20;

export class Room {
  constructor(type, floor, doorSides) {
    this.type = type;
    this.floor = floor;
    this.cleared = (type === ROOM_TYPES.SHOP || type === ROOM_TYPES.TREASURE);
    this.wave = 0;
    this.totalWaves = (type === ROOM_TYPES.BOSS) ? 1
      : randomInt(WAVES_PER_ROOM.min, WAVES_PER_ROOM.max);
    this.doors = doorSides.map(side => ({
      side, open: this.cleared,
      x: 0, y: 0, width: 0, height: 0,
    }));
    this.enemiesRemaining = 0;
    this._computeDoorRects();
  }

  _computeDoorRects() {
    for (const door of this.doors) {
      switch (door.side) {
        case 'north':
          door.x = CANVAS_WIDTH / 2 - DOOR_SIZE / 2;
          door.y = 0;
          door.width = DOOR_SIZE;
          door.height = WALL_THICKNESS;
          break;
        case 'south':
          door.x = CANVAS_WIDTH / 2 - DOOR_SIZE / 2;
          door.y = CANVAS_HEIGHT - WALL_THICKNESS;
          door.width = DOOR_SIZE;
          door.height = WALL_THICKNESS;
          break;
        case 'east':
          door.x = CANVAS_WIDTH - WALL_THICKNESS;
          door.y = CANVAS_HEIGHT / 2 - DOOR_SIZE / 2;
          door.width = WALL_THICKNESS;
          door.height = DOOR_SIZE;
          break;
        case 'west':
          door.x = 0;
          door.y = CANVAS_HEIGHT / 2 - DOOR_SIZE / 2;
          door.width = WALL_THICKNESS;
          door.height = DOOR_SIZE;
          break;
      }
    }
  }

  openDoors() {
    this.doors.forEach(d => d.open = true);
    this.cleared = true;
  }

  closeDoors() {
    this.doors.forEach(d => d.open = false);
    this.cleared = false;
  }
}

export class FloorMap {
  constructor(floorNum, roomCount) {
    this.floorNum = floorNum;
    this.rooms = [];
    this.connections = [];
    this.currentRoomIndex = 0;
    this._generate(roomCount);
  }

  _generate(count) {
    const types = [];
    for (let i = 0; i < count - 1; i++) {
      types.push(randomRoomType());
    }
    types.push(ROOM_TYPES.BOSS);
    const shopIdx = randomInt(2, Math.max(3, count - 3));
    types[shopIdx] = ROOM_TYPES.SHOP;

    this.rooms = types.map((type, i) => {
      const doorSides = [];
      if (i > 0) doorSides.push('west');
      if (i < count - 1) doorSides.push('east');
      return new Room(type, this.floorNum, doorSides);
    });

    // Bidirectional connections between adjacent rooms
    for (let i = 0; i < this.rooms.length - 1; i++) {
      this.connections.push({ from: i, to: i + 1, doorSide: 'east' });
      this.connections.push({ from: i + 1, to: i, doorSide: 'west' });
    }
  }
}

export function generateFloor(floorNum) {
  const count = randomInt(ROOMS_PER_FLOOR.min, ROOMS_PER_FLOOR.max);
  return new FloorMap(floorNum, count);
}

export function placeEntitiesInRoom(room) {
  const enemies = [];
  const terrains = [];

  const terrainCount = randomInt(TERRAIN_PER_ROOM.min, TERRAIN_PER_ROOM.max);
  const terrainPool = getTerrainPool(room.floor);
  for (let i = 0; i < terrainCount; i++) {
    const { x, y } = randomPosition(40, 80);
    const type = terrainPool[randomInt(0, terrainPool.length - 1)];
    const angle = type === 'CONVEYOR' ? (Math.PI / 4) * randomInt(0, 7) : 0;
    terrains.push(createTerrain(x, y, type, angle));
  }

  if (room.type === ROOM_TYPES.COMBAT) {
    spawnWave(room, enemies, 1);
  } else if (room.type === ROOM_TYPES.ELITE) {
    spawnWave(room, enemies, 1.5);
  } else if (room.type === ROOM_TYPES.BOSS) {
    const bossConfig = BOSS_CONFIG[room.floor] || BOSS_CONFIG[1];
    enemies.push(new Enemy(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100, bossConfig, 'BOSS'));
  }

  room.enemiesRemaining = enemies.length;
  return { enemies, terrains };
}

function spawnWave(room, enemies, multiplier) {
  const floor = room.floor;
  const count = Math.floor((2 + floor * 2) * multiplier);
  const pool = getEnemyPool(floor);
  for (let i = 0; i < count; i++) {
    const type = pool[randomInt(0, pool.length - 1)];
    const config = ENEMY_TYPES[type];
    const { x, y } = randomPosition(80, 150);
    enemies.push(new Enemy(x, y, config, type));
  }
}

function getEnemyPool(floor) {
  const pool = ['DRONE'];
  if (floor >= 1) pool.push('ASSAULT');
  if (floor >= 2) pool.push('SNIPER', 'CRAWLER');
  if (floor >= 3) pool.push('SHIELD', 'HACKER');
  return pool;
}

function getTerrainPool(floor) {
  const pool = ['COVER', 'BARREL'];
  if (floor >= 1) pool.push('CONVEYOR');
  if (floor >= 2) pool.push('BARRIER');
  if (floor >= 4) pool.push('TESLA');
  return pool;
}

function randomRoomType() {
  const types = Object.entries(ROOM_WEIGHTS).filter(([, w]) => w > 0);
  const total = types.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [type, weight] of types) {
    r -= weight;
    if (r <= 0) return type;
  }
  return ROOM_TYPES.COMBAT;
}

function randomPosition(marginX, marginY) {
  return {
    x: marginX + Math.random() * (CANVAS_WIDTH - marginX * 2),
    y: marginY + Math.random() * (CANVAS_HEIGHT - marginY * 2),
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
