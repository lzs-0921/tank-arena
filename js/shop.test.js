import { describe, it, expect } from 'vitest';
import { generateShopSlots, purchaseUpgrade, refreshShop, calculateUpgradeCost, dropFragments } from './shop.js';
import { Enemy } from './entities.js';

describe('calculateUpgradeCost', () => {
  it('returns base cost for level 0', () => {
    expect(calculateUpgradeCost('firerate', 0)).toBe(10);
  });

  it('cost increases per level', () => {
    const c0 = calculateUpgradeCost('damage', 0);
    const c1 = calculateUpgradeCost('damage', 1);
    expect(c1).toBeGreaterThan(c0);
  });
});

describe('generateShopSlots', () => {
  it('returns 4 slots', () => {
    const slots = generateShopSlots([], 1);
    expect(slots.length).toBe(4);
  });

  it('each slot has id, name, cost', () => {
    const slots = generateShopSlots([], 1);
    for (const s of slots) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(typeof s.cost).toBe('number');
      expect(s.cost).toBeGreaterThan(0);
    }
  });
});

describe('purchaseUpgrade', () => {
  it('deducts fragments and adds upgrade', () => {
    const gs = { fragments: 20, upgrades: [], player: null };
    const result = purchaseUpgrade(gs, { id: 'firerate', level: 0, cost: 10, maxLevel: 5, effect: { fireRateMul: 0.85 } });
    expect(result.success).toBe(true);
    expect(gs.fragments).toBe(10);
    expect(gs.upgrades.length).toBe(1);
  });

  it('fails when not enough fragments', () => {
    const gs = { fragments: 1, upgrades: [] };
    const result = purchaseUpgrade(gs, { id: 'damage', level: 0, cost: 12, maxLevel: 99, effect: {} });
    expect(result.success).toBe(false);
    expect(result.error).toBe('not enough fragments');
  });

  it('fails when at max level', () => {
    const gs = { fragments: 100, upgrades: [] };
    const result = purchaseUpgrade(gs, { id: 'firerate', level: 5, cost: 10, maxLevel: 5, effect: {} });
    expect(result.success).toBe(false);
    expect(result.error).toBe('max level reached');
  });
});

describe('refreshShop', () => {
  it('costs fragments and returns new slots', () => {
    const gs = { fragments: 20, upgrades: [], currentFloor: 1 };
    const result = refreshShop(gs, 0);
    expect(result.success).toBe(true);
    expect(result.cost).toBe(5);
    expect(result.slots.length).toBe(4);
  });

  it('cost doubles with each refresh', () => {
    const gs = { fragments: 100, upgrades: [], currentFloor: 1 };
    refreshShop(gs, 0);
    expect(gs.fragments).toBe(95);
    const r2 = refreshShop(gs, 1);
    expect(r2.cost).toBe(10);
  });

  it('fails if not enough fragments to refresh', () => {
    const gs = { fragments: 2, upgrades: [] };
    const result = refreshShop(gs, 0);
    expect(result.success).toBe(false);
  });
});

describe('dropFragments', () => {
  it('returns amount based on enemy drop range', () => {
    const enemy = new Enemy(0, 0, { radius: 12, speed: 60, hp: 1, shootCooldown: 2, bulletSpeed: 200, bulletDamage: 1, dropFragments: [2, 4], label: 'Test' }, 'TEST');
    const gs = { upgrades: [] };
    const amount = dropFragments(enemy, gs);
    expect(amount).toBeGreaterThanOrEqual(2);
    expect(amount).toBeLessThanOrEqual(4);
  });
});
