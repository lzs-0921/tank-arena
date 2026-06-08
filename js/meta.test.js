import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadMeta, saveMeta, getTalentTree, unlockTalent, applyMetaBonuses, addDataCores, updateBestDepth } from './meta.js';

const store = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  });
});

describe('loadMeta', () => {
  it('returns default meta when localStorage is empty', () => {
    const meta = loadMeta();
    expect(meta.dataCores).toBe(0);
    expect(meta.unlockedTalents).toEqual([]);
    expect(meta.bestDepth).toBe(0);
  });

  it('loads saved meta from localStorage', () => {
    store['tankArena_meta'] = JSON.stringify({ dataCores: 50, unlockedTalents: ['atk_firerate'], bestDepth: 2 });
    const meta = loadMeta();
    expect(meta.dataCores).toBe(50);
    expect(meta.unlockedTalents).toEqual(['atk_firerate']);
  });
});

describe('saveMeta', () => {
  it('saves meta to localStorage', () => {
    saveMeta({ dataCores: 30, unlockedTalents: ['def_hp'], bestDepth: 1 });
    const saved = JSON.parse(store['tankArena_meta']);
    expect(saved.dataCores).toBe(30);
  });
});

describe('unlockTalent', () => {
  it('unlocks talent if enough cores and not already unlocked', () => {
    const meta = { dataCores: 10, unlockedTalents: [], bestDepth: 1 };
    const result = unlockTalent(meta, 'atk_firerate');
    expect(result.success).toBe(true);
    expect(meta.dataCores).toBe(5);
    expect(meta.unlockedTalents).toContain('atk_firerate');
  });

  it('fails if not enough cores', () => {
    const meta = { dataCores: 2, unlockedTalents: [], bestDepth: 0 };
    const result = unlockTalent(meta, 'atk_damage');
    expect(result.success).toBe(false);
    expect(result.error).toBe('not enough cores');
  });

  it('fails if already unlocked', () => {
    const meta = { dataCores: 10, unlockedTalents: ['atk_firerate'], bestDepth: 0 };
    const result = unlockTalent(meta, 'atk_firerate');
    expect(result.success).toBe(false);
    expect(result.error).toBe('already unlocked');
  });
});

describe('applyMetaBonuses', () => {
  it('applies unlocked talent effects to player stats', () => {
    const player = { shootCooldown: 0.4, bulletDamage: 1, maxHp: 5, bulletCount: 1 };
    const meta = { unlockedTalents: ['atk_firerate', 'def_hp'] };
    applyMetaBonuses(player, meta);
    expect(player.shootCooldown).toBeCloseTo(0.36); // 0.4 * 0.9
    expect(player.maxHp).toBe(6); // 5 + 1
  });
});

describe('getTalentTree', () => {
  it('returns talent tree with attack, defense, utility branches', () => {
    const tree = getTalentTree();
    expect(tree.attack).toBeDefined();
    expect(tree.defense).toBeDefined();
    expect(tree.utility).toBeDefined();
    expect(tree.attack.length).toBeGreaterThan(0);
  });
});

describe('addDataCores', () => {
  it('adds cores and persists to localStorage', () => {
    const meta = { dataCores: 10, unlockedTalents: [], bestDepth: 0 };
    addDataCores(meta, 15);
    expect(meta.dataCores).toBe(25);
    const saved = JSON.parse(store['tankArena_meta']);
    expect(saved.dataCores).toBe(25);
  });
});

describe('updateBestDepth', () => {
  it('updates bestDepth when new depth is higher', () => {
    const meta = { dataCores: 0, unlockedTalents: [], bestDepth: 1 };
    updateBestDepth(meta, 3);
    expect(meta.bestDepth).toBe(3);
  });

  it('does not update when new depth is lower', () => {
    const meta = { dataCores: 0, unlockedTalents: [], bestDepth: 3 };
    updateBestDepth(meta, 2);
    expect(meta.bestDepth).toBe(3);
  });
});

describe('unlockTalent error branch', () => {
  it('fails for invalid talent id', () => {
    const meta = { dataCores: 100, unlockedTalents: [], bestDepth: 0 };
    const result = unlockTalent(meta, 'nonexistent_id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('talent not found');
  });
});
