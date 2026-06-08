import { describe, it, expect } from 'vitest';
import { createTerrain, updateTerrain, isTerrainBlocking } from './terrain.js';

describe('createTerrain', () => {
  it('creates COVER terrain', () => {
    const t = createTerrain(100, 100, 'COVER', 0);
    expect(t.terrainType).toBe('COVER');
    expect(t.hp).toBe(3);
    expect(t.alive).toBe(true);
  });

  it('creates CONVEYOR with direction angle', () => {
    const t = createTerrain(200, 200, 'CONVEYOR', Math.PI / 2);
    expect(t.terrainType).toBe('CONVEYOR');
    expect(t.angle).toBe(Math.PI / 2);
  });

  it('creates BARRIER terrain', () => {
    const t = createTerrain(50, 50, 'BARRIER', 0);
    expect(t.terrainType).toBe('BARRIER');
    expect(t.alive).toBe(true);
  });

  it('creates BARREL terrain', () => {
    const t = createTerrain(300, 300, 'BARREL', 0);
    expect(t.terrainType).toBe('BARREL');
    expect(t.hp).toBe(1);
  });
});

describe('updateTerrain', () => {
  it('advances barrier phase over time', () => {
    const t = createTerrain(100, 100, 'BARRIER', 0);
    t.phase = 0;
    const result = updateTerrain(t, 1.0);
    expect(t.phase).toBeGreaterThan(0);
    expect(result.alive).toBe(true);
  });

  it('updates tesla phase over time', () => {
    const t = createTerrain(100, 100, 'TESLA', 0);
    t.phase = 0;
    updateTerrain(t, 0.5);
    expect(t.phase).toBeGreaterThan(0);
  });
});

describe('isTerrainBlocking', () => {
  it('cover always blocks movement', () => {
    const t = createTerrain(0, 0, 'COVER', 0);
    expect(isTerrainBlocking(t)).toBe(true);
  });

  it('barrel blocks when alive', () => {
    const t = createTerrain(0, 0, 'BARREL', 0);
    expect(isTerrainBlocking(t)).toBe(true);
    t.alive = false;
    expect(isTerrainBlocking(t)).toBe(false);
  });

  it('conveyor does not block movement', () => {
    const t = createTerrain(0, 0, 'CONVEYOR', 0);
    expect(isTerrainBlocking(t)).toBe(false);
  });

  it('barrier blocks when active (sin(phase) > 0)', () => {
    const t = createTerrain(0, 0, 'BARRIER', 0);
    t.phase = Math.PI / 2; // sin = 1 (active)
    expect(isTerrainBlocking(t)).toBe(true);
    t.phase = Math.PI * 1.5; // sin = -1 (inactive)
    expect(isTerrainBlocking(t)).toBe(false);
  });
});
