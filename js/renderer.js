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
  ctx.fillStyle = '#020208';
  ctx.fillRect(-10, -10, W + 20, H + 20);

  // --- Layer 2: industrial panel sections ---
  // Divide background into large mechanical panels with subtle borders
  const panelW = 160;
  const panelH = 120;
  ctx.strokeStyle = 'rgba(40, 55, 70, 0.5)';
  ctx.lineWidth = 1;
  for (let px = 0; px < W; px += panelW) {
    for (let py = 0; py < H; py += panelH) {
      ctx.strokeRect(px + 2, py + 2, panelW - 4, panelH - 4);
      // Rivet dots at panel corners
      ctx.fillStyle = 'rgba(80, 100, 120, 0.6)';
      ctx.beginPath(); ctx.arc(px + 8, py + 8, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + panelW - 8, py + 8, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 8, py + panelH - 8, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + panelW - 8, py + panelH - 8, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // --- Layer 3: square grid with visible dot intersections ---
  const gridSize = 40;
  ctx.strokeStyle = 'rgba(60, 80, 100, 0.2)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Grid intersection dots with individual flicker
  for (let x = 0; x <= W; x += gridSize) {
    for (let y = 0; y <= H; y += gridSize) {
      const flicker = 0.4 + Math.sin(t * 5 + x * 0.1 + y * 0.07) * 0.3
                        + Math.sin(t * 7 + x * 0.05 - y * 0.04) * 0.2;
      const alpha = Math.max(0.1, flicker);
      ctx.fillStyle = `rgba(0, 255, 136, ${alpha * 0.5})`;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = alpha * 6;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;

  // --- Layer 4: mechanical warning stripes along walls ---
  const stripeH = 16;
  const stripeW = 12;
  // Top wall
  for (let x = 0; x < W; x += stripeW * 2) {
    ctx.fillStyle = (Math.floor(x / stripeW) % 2 === 0) ? 'rgba(255, 170, 0, 0.12)' : 'rgba(80, 80, 80, 0.06)';
    ctx.fillRect(x, 0, stripeW, stripeH);
    ctx.fillRect(x, H - stripeH, stripeW, stripeH);
  }
  // Left/right walls
  for (let y = 0; y < H; y += stripeW * 2) {
    ctx.fillStyle = (Math.floor(y / stripeW) % 2 === 0) ? 'rgba(255, 170, 0, 0.12)' : 'rgba(80, 80, 80, 0.06)';
    ctx.fillRect(0, y, stripeH, stripeW);
    ctx.fillRect(W - stripeH, y, stripeH, stripeW);
  }

  // --- Layer 5: glowing machinery pipes (horizontal + vertical) ---
  const pipeColor = 'rgba(40, 60, 80, 0.4)';
  ctx.strokeStyle = pipeColor;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const py = 60 + i * 240 + Math.sin(t * 0.2 + i) * 30;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    // Pipe joints
    for (let jx = 80; jx < W; jx += 160) {
      ctx.fillStyle = 'rgba(60, 85, 110, 0.5)';
      ctx.fillRect(jx - 6, py - 8, 12, 16);
      // Joint glow pulse
      const glow = 0.2 + Math.sin(t * 3 + jx) * 0.15;
      ctx.fillStyle = `rgba(0, 255, 136, ${glow})`;
      ctx.fillRect(jx - 3, py - 4, 6, 8);
    }
  }
  for (let i = 0; i < 3; i++) {
    const px = 100 + i * 300 + Math.cos(t * 0.25 + i) * 40;
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    for (let jy = 80; jy < H; jy += 160) {
      ctx.fillStyle = 'rgba(60, 85, 110, 0.5)';
      ctx.fillRect(px - 5, jy - 5, 10, 10);
    }
  }

  // --- Layer 6: random blinking status lights (like server rack LEDs) ---
  const seed = gs.currentFloor * 137 + gs.roomsCleared * 59;
  for (let i = 0; i < 40; i++) {
    const lx = ((seed * (i + 1) * 73 + i * 251) % W);
    const ly = ((seed * (i + 1) * 197 + i * 317) % H);
    // Skip if too close to walls (inside warning stripe zone)
    if (lx < 20 || lx > W - 20 || ly < 20 || ly > H - 20) continue;
    const blink = Math.sin(t * (3 + i * 0.7) + i * 2.3);
    // Different colors for variety
    const ledColors = ['#ff3355', '#00ff88', '#ffaa00', '#44aaff'];
    const col = ledColors[i % 4];
    if (blink > 0.3) {
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 5;
    } else {
      ctx.fillStyle = '#222233';
      ctx.shadowBlur = 0;
    }
    ctx.beginPath();
    ctx.arc(lx, ly, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // --- Layer 7: corner HUD brackets (more visible) ---
  const bracketLen = 36;
  const bracketGap = 14;
  const bracketColor = 'rgba(0, 255, 136, 0.45)';
  ctx.strokeStyle = bracketColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(bracketGap, bracketGap + bracketLen); ctx.lineTo(bracketGap, bracketGap); ctx.lineTo(bracketGap + bracketLen, bracketGap); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - bracketGap - bracketLen, bracketGap); ctx.lineTo(W - bracketGap, bracketGap); ctx.lineTo(W - bracketGap, bracketGap + bracketLen); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bracketGap, H - bracketGap - bracketLen); ctx.lineTo(bracketGap, H - bracketGap); ctx.lineTo(bracketGap + bracketLen, H - bracketGap); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - bracketGap - bracketLen, H - bracketGap); ctx.lineTo(W - bracketGap, H - bracketGap); ctx.lineTo(W - bracketGap, H - bracketGap - bracketLen); ctx.stroke();
  ctx.shadowBlur = 0;

  // --- Layer 8: radial vignette (dark edges) ---
  const vignetteGrad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
  vignetteGrad.addColorStop(0, 'rgba(2, 2, 8, 0)');
  vignetteGrad.addColorStop(0.7, 'rgba(2, 2, 8, 0.3)');
  vignetteGrad.addColorStop(1, 'rgba(2, 2, 8, 0.7)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, W, H);

  // --- Layer 9: scanlines ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }

  // --- Layer 10: ambient floating particles ---
  for (let i = 0; i < 16; i++) {
    const px = ((Math.sin(t * 0.25 + i * 1.7) * 0.5 + 0.5) * W);
    const py = ((Math.cos(t * 0.35 + i * 2.1) * 0.5 + 0.5) * H);
    const alpha = 0.1 + Math.sin(t * 4 + i) * 0.06;
    ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
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
