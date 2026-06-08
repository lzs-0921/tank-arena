import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';

export function initRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  return ctx;
}

export function render(gs) {
  const ctx = gs.ctx;
  const shakeX = gs.screenShake > 0 ? (Math.random() - 0.5) * gs.screenShake * 2 : 0;
  const shakeY = gs.screenShake > 0 ? (Math.random() - 0.5) * gs.screenShake * 2 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Background
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20);

  // Grid lines (subtle cyberpunk grid)
  ctx.strokeStyle = 'rgba(51, 68, 85, 0.2)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
  }

  // Walls
  drawWalls(ctx);

  // Doors
  if (gs.currentRoom) {
    for (const door of gs.currentRoom.doors) {
      drawDoor(ctx, door);
    }
  }

  // Terrain
  for (const t of gs.terrains) {
    if (t.alive) drawTerrain(ctx, t);
  }

  // Pickups
  for (const p of gs.pickups) {
    drawPickup(ctx, p, gs.time);
  }

  // Enemies
  for (const enemy of gs.enemies) {
    if (enemy.alive) drawTank(ctx, enemy, gs.time);
  }

  // Player
  if (gs.player && gs.player.alive) {
    drawTank(ctx, gs.player, gs.time);
  }

  // Bullets
  for (const b of gs.bullets) {
    if (b.alive) drawBullet(ctx, b);
  }

  // Particles
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of gs.particles) {
    drawParticle(ctx, p);
  }
  ctx.restore();

  ctx.restore();

  // Screen shake decay
  if (gs.screenShake > 0) {
    gs.screenShake = Math.max(0, gs.screenShake - gs.dt * 30);
  }
}

function drawWalls(ctx) {
  ctx.strokeStyle = COLORS.WALL;
  ctx.lineWidth = 3;
  ctx.shadowColor = COLORS.WALL;
  ctx.shadowBlur = 6;
  ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
  ctx.shadowBlur = 0;
}

function drawDoor(ctx, door) {
  if (door.open) {
    ctx.fillStyle = COLORS.DOOR;
    ctx.shadowColor = COLORS.DOOR;
    ctx.shadowBlur = 12;
  } else {
    ctx.fillStyle = COLORS.DOOR_LOCKED;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 4;
  }
  ctx.fillRect(door.x, door.y, door.width, door.height);
  ctx.shadowBlur = 0;
}

function drawTank(ctx, tank, time) {
  ctx.save();
  ctx.translate(tank.x, tank.y);

  const isPlayer = !tank.enemyType;
  const color = isPlayer ? COLORS.PLAYER : (tank.enemyType === 'BOSS' ? '#ff8800' : COLORS.ENEMY);

  // Body glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;

  // Body (rectangle with rounded appearance via overlapping rects)
  ctx.save();
  ctx.rotate(tank.bodyAngle);
  ctx.fillStyle = color;
  ctx.fillRect(-tank.radius, -tank.radius * 0.6, tank.radius * 2, tank.radius * 1.2);
  ctx.shadowBlur = 0;

  // Treads (moving dashes)
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  const treadOffset = (time * 60) % 8;
  for (let i = -tank.radius + 2; i < tank.radius - 2; i += 5) {
    const tx = i + treadOffset;
    if (tx > -tank.radius && tx < tank.radius) {
      ctx.beginPath();
      ctx.moveTo(tx, -tank.radius * 0.7);
      ctx.lineTo(tx + 3, -tank.radius * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx - 2, tank.radius * 0.7);
      ctx.lineTo(tx + 1, tank.radius * 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Turret
  ctx.save();
  ctx.rotate(tank.turretAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tank.radius * 1.5, 0);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Turret ring
  ctx.beginPath();
  ctx.arc(0, 0, tank.radius * 0.45, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Shield indicator
  if (tank.shieldCount > 0) {
    ctx.strokeStyle = COLORS.ALLY;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.ALLY;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, tank.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // HP bar (enemies only)
  if (!isPlayer && tank.maxHp > 1) {
    const barW = tank.radius * 2;
    const barH = 4;
    const barY = -tank.radius - 14;
    ctx.fillStyle = '#222';
    ctx.fillRect(-barW / 2, barY, barW, barH);
    ctx.fillStyle = tank.hp / tank.maxHp > 0.3 ? color : '#ff3355';
    ctx.fillRect(-barW / 2, barY, barW * (tank.hp / tank.maxHp), barH);
  }

  ctx.restore();
}

function drawBullet(ctx, bullet) {
  const color = bullet.ownerId === 'player' ? COLORS.PLAYER : COLORS.ENEMY;
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, bullet.radius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawTerrain(ctx, terrain) {
  ctx.save();
  ctx.translate(terrain.x, terrain.y);

  if (terrain.terrainType === 'BARRIER') {
    const alpha = 0.3 + (Math.sin(terrain.phase) + 1) * 0.35;
    ctx.strokeStyle = `rgba(68, 136, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 4 + (Math.sin(terrain.phase) + 1) * 4;
    ctx.beginPath();
    ctx.arc(0, 0, terrain.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (terrain.terrainType === 'CONVEYOR') {
    ctx.fillStyle = 'rgba(255,170,0,0.08)';
    ctx.fillRect(-terrain.radius, -terrain.radius, terrain.radius * 2, terrain.radius * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.save();
    ctx.rotate(terrain.angle);
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * 6 - 2, -8, 3, 16);
    }
    ctx.restore();
  } else if (terrain.terrainType === 'BARREL') {
    ctx.fillStyle = '#993300';
    ctx.fillRect(-terrain.radius + 2, -terrain.radius + 2, terrain.radius * 2 - 4, terrain.radius * 2 - 4);
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.arc(0, 0, terrain.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Cap
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(-3, -terrain.radius - 4, 6, 5);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(-terrain.radius, -terrain.radius, terrain.radius * 2, terrain.radius * 2);
  } else if (terrain.terrainType === 'TESLA') {
    const active = Math.sin(terrain.phase) > 0.5;
    ctx.fillStyle = active ? '#ffff00' : '#444400';
    if (active) {
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.arc(0, 0, terrain.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Lightning bolts
    if (active) {
      ctx.strokeStyle = '#ffff88';
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
        ctx.lineTo(Math.cos(a) * (terrain.radius + 4 + Math.random() * 8), Math.sin(a) * (terrain.radius + 4 + Math.random() * 8));
        ctx.stroke();
      }
    }
  } else {
    // COVER
    ctx.fillStyle = '#555533';
    ctx.fillRect(-terrain.radius, -terrain.radius, terrain.radius * 2, terrain.radius * 2);
    ctx.strokeStyle = '#888866';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-terrain.radius, -terrain.radius, terrain.radius * 2, terrain.radius * 2);
    // Cross pattern
    ctx.strokeStyle = '#777755';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-terrain.radius, 0); ctx.lineTo(terrain.radius, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -terrain.radius); ctx.lineTo(0, terrain.radius); ctx.stroke();
  }

  ctx.restore();
}

function drawPickup(ctx, pickup, time) {
  ctx.save();
  ctx.translate(pickup.x, pickup.y);
  const pulse = 1 + Math.sin(time * 6 + pickup.id * 0.5) * 0.15;
  ctx.scale(pulse, pulse);
  ctx.fillStyle = COLORS.FRAGMENT;
  ctx.shadowColor = COLORS.FRAGMENT;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(3, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawParticle(ctx, p) {
  const alpha = p.life / p.maxLife;
  ctx.fillStyle = p.color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}
