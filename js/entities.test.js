import { describe, it, expect } from 'vitest';
import { Entity, Tank, Enemy, Bullet, Pickup, Terrain, Particle } from './entities.js';

describe('Entity', () => {
  it('creates an entity with default values', () => {
    const e = new Entity(100, 200, 10);
    expect(e.x).toBe(100);
    expect(e.y).toBe(200);
    expect(e.radius).toBe(10);
    expect(e.vx).toBe(0);
    expect(e.vy).toBe(0);
    expect(e.alive).toBe(true);
  });
});

describe('Tank', () => {
  it('extends Entity with tank properties', () => {
    const t = new Tank(100, 200, 16, 5, 180);
    expect(t.hp).toBe(5);
    expect(t.maxHp).toBe(5);
    expect(t.speed).toBe(180);
    expect(t.bodyAngle).toBe(0);
    expect(t.turretAngle).toBe(0);
  });

  it('takesDamage reduces hp and returns true when alive', () => {
    const t = new Tank(0, 0, 16, 5, 100);
    expect(t.takeDamage(2)).toBe(true);
    expect(t.hp).toBe(3);
  });

  it('takeDamage returns false when hp reaches 0', () => {
    const t = new Tank(0, 0, 16, 1, 100);
    expect(t.takeDamage(1)).toBe(false);
    expect(t.alive).toBe(false);
  });

  it('shield absorbs damage first', () => {
    const t = new Tank(0, 0, 16, 3, 100);
    t.shieldCount = 2;
    t.takeDamage(1);
    expect(t.shieldCount).toBe(1);
    expect(t.hp).toBe(3);
  });
});

describe('Enemy', () => {
  it('creates enemy from config type', () => {
    const config = { radius: 12, speed: 60, hp: 1, shootCooldown: 2.0, bulletSpeed: 200, bulletDamage: 1, dropFragments: [1, 3], label: 'Drone', color: '#f00' };
    const e = new Enemy(100, 100, config, 'DRONE');
    expect(e.enemyType).toBe('DRONE');
    expect(e.hp).toBe(1);
    expect(e.speed).toBe(60);
  });
});

describe('Bullet', () => {
  it('creates bullet with type and damage', () => {
    const b = new Bullet(0, 0, 3, 1, 0, 'normal', 1, 'player');
    expect(b.bulletType).toBe('normal');
    expect(b.damage).toBe(1);
    expect(b.ownerId).toBe('player');
  });
});

describe('Pickup', () => {
  it('creates pickup with value', () => {
    const p = new Pickup(50, 50, 3);
    expect(p.value).toBe(3);
  });
});

describe('Terrain', () => {
  it('creates terrain from config', () => {
    const config = { hp: 3, radius: 18, label: 'Cover', color: '#666' };
    const t = new Terrain(200, 200, config, 'COVER');
    expect(t.terrainType).toBe('COVER');
    expect(t.hp).toBe(3);
  });
});
