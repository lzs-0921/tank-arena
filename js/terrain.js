import { TERRAIN_TYPES } from './config.js';
import { Terrain } from './entities.js';

export function createTerrain(x, y, type, angle = 0) {
  const config = TERRAIN_TYPES[type];
  const t = new Terrain(x, y, config, type);
  t.angle = angle;
  if (type === 'CONVEYOR') {
    t.direction = Math.random() > 0.5 ? 1 : -1;
  }
  return t;
}

export function updateTerrain(terrain, dt) {
  if (terrain.terrainType === 'BARRIER') {
    terrain.phase = (terrain.phase + dt * 2) % (Math.PI * 2);
  }
  if (terrain.terrainType === 'TESLA') {
    terrain.phase = (terrain.phase + dt * 4) % (Math.PI * 2);
  }
  return { alive: terrain.alive, active: isActive(terrain) };
}

function isActive(terrain) {
  if (terrain.terrainType === 'BARRIER') {
    return Math.sin(terrain.phase) > 0;
  }
  if (terrain.terrainType === 'TESLA') {
    return Math.sin(terrain.phase) > 0.5;
  }
  return true;
}

export function isTerrainBlocking(terrain) {
  if (!terrain.alive) return false;
  if (terrain.terrainType === 'BARRIER') return Math.sin(terrain.phase) > 0;
  if (terrain.terrainType === 'CONVEYOR') return false;
  return true;
}

// Terrain effect functions — called by combat system when entity overlaps terrain
export const TERRAIN_FUNCTIONS = {
  COVER: (terrain, entity, dt) => {
    // Cover blocks movement and bullets — handled in combat collision
  },
  BARRIER: (terrain, entity, dt) => {
    // Active barrier blocks bullets; when inactive, bullets pass through
  },
  CONVEYOR: (terrain, entity, dt) => {
    const pushSpeed = 120;
    const dx = Math.cos(terrain.angle) * pushSpeed * terrain.direction;
    const dy = Math.sin(terrain.angle) * pushSpeed * terrain.direction;
    entity.vx += dx * dt;
    entity.vy += dy * dt;
  },
  BARREL: (terrain, entity, dt) => {
    // Barrel explodes when destroyed — handled in combat
  },
  TESLA: (terrain, entity, dt) => {
    // Tesla damages entities when active — handled in combat
  },
};
