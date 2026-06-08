import { TALENT_TREE } from './config.js';

const STORAGE_KEY = 'tankArena_meta';

export function loadMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupted data, return default */ }
  return { dataCores: 0, unlockedTalents: [], bestDepth: 0 };
}

export function saveMeta(meta) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
}

export function getTalentTree() {
  return TALENT_TREE;
}

export function unlockTalent(meta, talentId) {
  if (meta.unlockedTalents.includes(talentId)) {
    return { success: false, error: 'already unlocked' };
  }
  const talent = findTalent(talentId);
  if (!talent) return { success: false, error: 'talent not found' };
  if (meta.dataCores < talent.cost) {
    return { success: false, error: 'not enough cores' };
  }
  meta.dataCores -= talent.cost;
  meta.unlockedTalents.push(talentId);
  saveMeta(meta);
  return { success: true };
}

export function applyMetaBonuses(player, meta) {
  for (const talentId of meta.unlockedTalents) {
    const talent = findTalent(talentId);
    if (talent) talent.apply(player);
  }
}

export function addDataCores(meta, amount) {
  meta.dataCores += amount;
  saveMeta(meta);
}

export function updateBestDepth(meta, depth) {
  if (depth > meta.bestDepth) {
    meta.bestDepth = depth;
    saveMeta(meta);
  }
}

function findTalent(id) {
  for (const branch of Object.values(TALENT_TREE)) {
    for (const t of branch) {
      if (t.id === id) return t;
    }
  }
  return null;
}
