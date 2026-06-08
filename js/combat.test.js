import { describe, it, expect } from 'vitest';
import { circleCollision, rectOverlap, resolveEntityCollisions, bulletHitTest, updateCombat } from './combat.js';
import { Tank, Bullet, Particle } from './entities.js';

describe('circleCollision', () => {
  it('detects overlapping circles', () => {
    expect(circleCollision({ x: 0, y: 0, radius: 10 }, { x: 15, y: 0, radius: 10 })).toBe(true);
  });

  it('returns false for non-overlapping circles', () => {
    expect(circleCollision({ x: 0, y: 0, radius: 5 }, { x: 20, y: 20, radius: 5 })).toBe(false);
  });

  it('returns true for touching circles', () => {
    expect(circleCollision({ x: 0, y: 0, radius: 10 }, { x: 20, y: 0, radius: 10 })).toBe(true);
  });
});

describe('rectOverlap', () => {
  it('detects overlapping rectangles', () => {
    expect(rectOverlap(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
  });

  it('returns false for non-overlapping rects', () => {
    expect(rectOverlap(0, 0, 10, 10, 30, 30, 10, 10)).toBe(false);
  });
});

describe('resolveEntityCollisions', () => {
  it('pushes apart two overlapping entities', () => {
    const a = new Tank(0, 0, 16, 5, 100);
    const b = new Tank(10, 0, 16, 5, 100);
    resolveEntityCollisions([a, b]);
    const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    expect(dist).toBeGreaterThanOrEqual(30);
  });

  it('does nothing for non-overlapping entities', () => {
    const a = new Tank(0, 0, 16, 5, 100);
    const b = new Tank(100, 100, 16, 5, 100);
    const ax = a.x, ay = a.y, bx = b.x, by = b.y;
    resolveEntityCollisions([a, b]);
    expect(a.x).toBe(ax);
    expect(b.x).toBe(bx);
  });
});

describe('bulletHitTest', () => {
  it('detects when bullet hits entity', () => {
    const bullet = new Bullet(0, 0, 3, 1, 0, 'normal', 1, 'player');
    const enemy = new Tank(5, 0, 16, 3, 100);
    expect(bulletHitTest(bullet, enemy)).toBe(true);
  });

  it('returns false when bullet is far from entity', () => {
    const bullet = new Bullet(0, 0, 3, 1, 0, 'normal', 1, 'player');
    const enemy = new Tank(100, 100, 16, 3, 100);
    expect(bulletHitTest(bullet, enemy)).toBe(false);
  });
});

describe('updateCombat', () => {
  it('bullet hits enemy and kills it', () => {
    const enemy = new Tank(10, 0, 16, 1, 100);
    const bullet = new Bullet(0, 0, 3, 10, 0, 'normal', 5, 'player');
    const gs = {
      enemies: [enemy],
      bullets: [bullet],
      terrains: [],
      particles: [],
      player: null,
    };
    updateCombat(gs, 0.016);
    expect(enemy.alive).toBe(false);
    expect(bullet.alive).toBe(false);
  });

  it('removes dead entities after combat update', () => {
    const gs = {
      enemies: [new Tank(10, 0, 16, 1, 100)],
      bullets: [new Bullet(0, 0, 3, 10, 0, 'normal', 5, 'player')],
      terrains: [],
      particles: [],
      player: null,
    };
    updateCombat(gs, 0.016);
    expect(gs.enemies.length).toBe(0);
    expect(gs.bullets.length).toBe(0);
  });
});
