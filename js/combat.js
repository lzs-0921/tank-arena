import { Particle } from './entities.js';
import { TERRAIN_FUNCTIONS } from './terrain.js';

export function circleCollision(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const minDist = a.radius + b.radius;
  return (dx * dx + dy * dy) <= (minDist * minDist);
}

export function rectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x2 > x1 + w1 || x2 + w2 < x1 || y2 > y1 + h1 || y2 + h2 < y1);
}

export function resolveEntityCollisions(entities) {
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i];
      const b = entities[j];
      if (!a.alive || !b.alive) continue;
      if (circleCollision(a, b)) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const overlap = (a.radius + b.radius) - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x += nx * overlap * 0.5;
        a.y += ny * overlap * 0.5;
        b.x -= nx * overlap * 0.5;
        b.y -= ny * overlap * 0.5;
      }
    }
  }
}

export function bulletHitTest(bullet, entity) {
  return circleCollision(bullet, entity);
}

export function spawnExplosion(particles, x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 80 + Math.random() * 160;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0.3 + Math.random() * 0.4,
      color,
      2 + Math.random() * 3
    ));
  }
}

export function updateCombat(gs, dt) {
  // Apply terrain effects
  applyTerrainEffects(gs, dt);

  // Bullet vs enemy hits
  for (const bullet of gs.bullets) {
    if (!bullet.alive) continue;
    for (const enemy of gs.enemies) {
      if (!enemy.alive) continue;
      if (bullet.ownerId === 'enemy') continue;
      if (bulletHitTest(bullet, enemy)) {
        const isCrit = bullet.ownerId === 'player' && gs.player && Math.random() < gs.player.critChance;
        const dmg = isCrit ? bullet.damage * 2 : bullet.damage;
        enemy.takeDamage(dmg);
        if (!enemy.alive) {
          spawnExplosion(gs.particles, enemy.x, enemy.y, '#ff3355', 12);
        }
        if (bullet.bulletType === 'pierce') {
          // pierce continues through enemy
        } else if (bullet.bulletType === 'explosive') {
          spawnExplosion(gs.particles, bullet.x, bullet.y, '#ff8800', 16);
          for (const other of gs.enemies) {
            if (other === enemy || !other.alive) continue;
            if (circleCollision({ x: bullet.x, y: bullet.y, radius: 60 }, other)) {
              other.takeDamage(Math.floor(bullet.damage * 0.5));
            }
          }
          bullet.alive = false;
        } else {
          bullet.alive = false;
        }
        break;
      }
    }
  }

  // Bullet vs player
  for (const bullet of gs.bullets) {
    if (!bullet.alive) continue;
    if (bullet.ownerId === 'player') continue;
    if (gs.player && gs.player.alive && bulletHitTest(bullet, gs.player)) {
      gs.player.takeDamage(bullet.damage);
      bullet.alive = false;
      spawnExplosion(gs.particles, gs.player.x, gs.player.y, '#00ff88', 6);
      if (!gs.player.alive) {
        spawnExplosion(gs.particles, gs.player.x, gs.player.y, '#00ff88', 20);
      }
    }
  }

  // Bullet vs terrain
  for (const bullet of gs.bullets) {
    if (!bullet.alive) continue;
    for (const t of gs.terrains) {
      if (!t.alive) continue;
      if (bulletHitTest(bullet, t)) {
        if (bullet.bulletType === 'energy' && t.terrainType === 'BARRIER') {
          bullet.vx *= -1;
          bullet.vy *= -1;
          bullet.ownerId = 'enemy';
          break;
        }
        t.takeDamage(1);
        if (!t.alive && t.terrainType === 'BARREL') {
          spawnExplosion(gs.particles, t.x, t.y, '#ff4400', 20);
          for (const enemy of gs.enemies) {
            if (!enemy.alive) continue;
            if (circleCollision({ x: t.x, y: t.y, radius: 80 }, enemy)) {
              enemy.takeDamage(2);
            }
          }
          if (gs.player && gs.player.alive && circleCollision({ x: t.x, y: t.y, radius: 80 }, gs.player)) {
            gs.player.takeDamage(1);
          }
        }
        if (bullet.bulletType !== 'pierce') {
          bullet.alive = false;
        }
        break;
      }
    }
  }

  // Clean up dead entities
  gs.bullets = gs.bullets.filter(b => b.alive);
  gs.enemies = gs.enemies.filter(e => e.alive);
  gs.terrains = gs.terrains.filter(t => t.alive);
  gs.particles = gs.particles.filter(p => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return p.life > 0;
  });
}

function applyTerrainEffects(gs, dt) {
  const entities = [];
  if (gs.player && gs.player.alive) entities.push(gs.player);
  for (const enemy of gs.enemies) {
    if (enemy.alive) entities.push(enemy);
  }
  for (const entity of entities) {
    for (const t of gs.terrains) {
      if (!t.alive) continue;
      if (circleCollision(entity, t) && TERRAIN_FUNCTIONS[t.terrainType]) {
        TERRAIN_FUNCTIONS[t.terrainType](t, entity, dt);
      }
    }
  }
}
