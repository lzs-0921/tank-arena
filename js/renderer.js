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
  drawCyberpunkBackground(ctx, gs);

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

function drawCyberpunkBackground(ctx, gs) {
  const W = CANVAS_WIDTH;
  const H = CANVAS_HEIGHT;
  const t = gs.time;

  // --- Layer 1: deep base fill ---
  ctx.fillStyle = '#050510';
  ctx.fillRect(-10, -10, W + 20, H + 20);

  // --- Layer 2: large hex grid (subtle, stationary) ---
  const hexR = 48;
  const hexH = hexR * Math.sqrt(3);
  ctx.strokeStyle = 'rgba(51, 68, 85, 0.18)';
  ctx.lineWidth = 0.6;
  for (let row = -1; row < H / hexH + 2; row++) {
    for (let col = -1; col < W / (hexR * 1.5) + 2; col++) {
      const cx = col * hexR * 1.5;
      const cy = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        const px = cx + hexR * Math.cos(angle);
        const py = cy + hexR * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  // --- Layer 3: fine square grid with dot intersections ---
  const gridSize = 40;
  ctx.strokeStyle = 'rgba(68, 85, 102, 0.15)';
  ctx.lineWidth = 0.4;
  for (let x = 0; x <= W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Glowing dots at grid intersections
  for (let x = 0; x <= W; x += gridSize) {
    for (let y = 0; y <= H; y += gridSize) {
      const pulse = 0.3 + Math.sin(t * 2 + x * 0.05 + y * 0.03) * 0.2;
      ctx.fillStyle = `rgba(0, 255, 136, ${pulse * 0.25})`;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = pulse * 4;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;

  // --- Layer 4: circuit traces (thin neon lines, random segments) ---
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.06)';
  ctx.lineWidth = 0.8;
  // Use deterministic pseudo-random based on floor so traces are consistent per room
  const seed = gs.currentFloor * 137 + (gs.currentRoom ? gs.currentRoom.type.charCodeAt(0) : 0);
  for (let i = 0; i < 18; i++) {
    const sx = ((seed * (i + 1) * 73 + i * 251) % W);
    const sy = ((seed * (i + 1) * 197 + i * 317) % H);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    let cx = sx, cy = sy;
    for (let j = 0; j < 3; j++) {
      cx += (((seed + i * 7 + j * 13) * 59) % 120) - 40;
      cy += (((seed + i * 11 + j * 17) * 43) % 120) - 40;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // --- Layer 5: corner HUD brackets ---
  const bracketLen = 30;
  const bracketGap = 16;
  const bracketColor = 'rgba(0, 255, 136, 0.35)';
  ctx.strokeStyle = bracketColor;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 6;
  // Top-left
  ctx.beginPath(); ctx.moveTo(bracketGap, bracketGap + bracketLen); ctx.lineTo(bracketGap, bracketGap); ctx.lineTo(bracketGap + bracketLen, bracketGap); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(W - bracketGap - bracketLen, bracketGap); ctx.lineTo(W - bracketGap, bracketGap); ctx.lineTo(W - bracketGap, bracketGap + bracketLen); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(bracketGap, H - bracketGap - bracketLen); ctx.lineTo(bracketGap, H - bracketGap); ctx.lineTo(bracketGap + bracketLen, H - bracketGap); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(W - bracketGap - bracketLen, H - bracketGap); ctx.lineTo(W - bracketGap, H - bracketGap); ctx.lineTo(W - bracketGap, H - bracketGap - bracketLen); ctx.stroke();
  ctx.shadowBlur = 0;

  // --- Layer 6: radial vignette (dark edges) ---
  const vignetteGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.75);
  vignetteGrad.addColorStop(0, 'rgba(5, 5, 16, 0)');
  vignetteGrad.addColorStop(1, 'rgba(5, 5, 16, 0.6)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, W, H);

  // --- Layer 7: scanlines ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }

  // --- Layer 8: floating data particles (background only, not interactable) ---
  for (let i = 0; i < 12; i++) {
    const px = ((Math.sin(t * 0.3 + i * 1.7) * 0.5 + 0.5) * W);
    const py = ((Math.cos(t * 0.4 + i * 2.1) * 0.5 + 0.5) * H);
    const alpha = 0.08 + Math.sin(t * 3 + i) * 0.04;
    ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
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
