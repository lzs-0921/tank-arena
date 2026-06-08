import { SHOP_SLOTS, SHOP_REFRESH_COST, UPGRADES } from './config.js';

export function calculateUpgradeCost(upgradeId, currentLevel) {
  const def = UPGRADES[upgradeId];
  if (!def) return 999;
  return Math.floor(def.baseCost * Math.pow(1.3, currentLevel));
}

export function generateShopSlots(currentUpgrades, floor) {
  const slots = [];
  const upgradeIds = Object.keys(UPGRADES);
  const used = new Set();

  for (let i = 0; i < SHOP_SLOTS; i++) {
    let id;
    let attempts = 0;
    do {
      id = upgradeIds[Math.floor(Math.random() * upgradeIds.length)];
      attempts++;
    } while (used.has(id) && attempts < 50);
    used.add(id);

    const currentLevel = currentUpgrades.filter(u => u.id === id).length;
    const def = UPGRADES[id];
    const cost = calculateUpgradeCost(id, currentLevel);

    slots.push({
      id,
      name: def.name,
      category: def.category,
      cost,
      level: currentLevel,
      maxLevel: def.maxLevel,
      effect: def.effect,
    });
  }
  return slots;
}

export function purchaseUpgrade(gs, slot) {
  if (gs.fragments < slot.cost) {
    return { success: false, error: 'not enough fragments' };
  }
  if (slot.level >= slot.maxLevel) {
    return { success: false, error: 'max level reached' };
  }
  gs.fragments -= slot.cost;
  gs.upgrades.push({
    id: slot.id, name: slot.name, category: slot.category,
    level: slot.level + 1, effect: slot.effect,
  });
  applyUpgradeEffect(gs, slot);
  return { success: true };
}

export function refreshShop(gs, refreshCount) {
  const cost = SHOP_REFRESH_COST * Math.pow(2, refreshCount);
  if (gs.fragments < cost) {
    return { success: false, error: 'not enough fragments', slots: [], cost };
  }
  gs.fragments -= cost;
  return { success: true, cost, slots: generateShopSlots(gs.upgrades, gs.currentFloor) };
}

export function dropFragments(enemy, gs) {
  if (!enemy.dropFragments) return 0;
  const [min, max] = enemy.dropFragments;
  let amount = Math.floor(Math.random() * (max - min + 1)) + min;
  const fragUpgrades = gs.upgrades.filter(u => u.id === 'fragment');
  const mul = fragUpgrades.reduce((m, u) => m * u.effect.fragmentMul, 1);
  return Math.floor(amount * mul);
}

function applyUpgradeEffect(gs, slot) {
  const p = gs.player;
  if (!p) return;
  const eff = slot.effect;

  if (eff.fireRateMul)   p.shootCooldown *= eff.fireRateMul;
  if (eff.bulletCountAdd) p.bulletCount += eff.bulletCountAdd;
  if (eff.bulletSpeedMul) p.bulletSpeed = Math.floor(p.bulletSpeed * eff.bulletSpeedMul);
  if (eff.damageMul)      p.bulletDamage = Math.ceil(p.bulletDamage * eff.damageMul);
  if (eff.evolveBullet)   evolveBulletType(p);
  if (eff.shieldAdd)      p.shieldCount = Math.min((p.shieldCount || 0) + eff.shieldAdd, 3);
  if (eff.speedMul)       p.speed = Math.floor(p.speed * eff.speedMul);
  if (eff.hpMul)          { p.maxHp = Math.ceil(p.maxHp * eff.hpMul); p.hp = Math.min(p.hp + 1, p.maxHp); }
  if (eff.turretSpeedMul) p.turretSpeed *= eff.turretSpeedMul;
}

function evolveBulletType(player) {
  const evolution = ['normal', 'bounce', 'pierce', 'explosive', 'energy'];
  const idx = evolution.indexOf(player.bulletType);
  if (idx >= 0 && idx < evolution.length - 1) {
    player.bulletType = evolution[idx + 1];
  }
}
