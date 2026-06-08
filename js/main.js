import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config.js';
import { createPlayer, resetEntityIds, Bullet } from './entities.js';
import { loadMeta, applyMetaBonuses } from './meta.js';
import { generateFloor, placeEntitiesInRoom } from './room.js';
import { updateCombat, circleCollision } from './combat.js';
import { dropFragments } from './shop.js';
import { initRenderer, render } from './renderer.js';
import { updateHUD } from './hud.js';
import { showMainMenu, showDeathScreen, showShopScreen } from './overlay.js';
import { initInput, isKeyDown, clearFrameInput } from './input.js';

// Init canvas and input
const canvas = document.getElementById('gameCanvas');
const ctx = initRenderer(canvas);
const inputState = initInput(canvas);

// GameState
const gs = {
  state: 'MAIN_MENU',
  player: null,
  enemies: [],
  bullets: [],
  pickups: [],
  terrains: [],
  particles: [],
  currentRoom: null,
  floorMap: null,
  currentFloor: 1,
  roomsCleared: 0,
  fragments: 0,
  upgrades: [],
  meta: loadMeta(),
  input: inputState,
  screenShake: 0,
  dt: 0,
  time: 0,
  canvas,
  ctx,
};

// ─── Game Loop ────────────────────────────────────────────────────────────────

let lastTime = 0;
function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);
  gs.dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  gs.time = timestamp / 1000;
  lastTime = timestamp;

  if (gs.state === 'RUNNING') updateRunning(gs);
  else if (gs.state === 'ROOM_CLEAR') updateRoomClear(gs);

  if (gs.state === 'RUNNING' || gs.state === 'ROOM_CLEAR') {
    render(gs);
    updateHUD(gs);
  }
  clearFrameInput(gs.input);
}

// ─── Run Lifecycle ────────────────────────────────────────────────────────────

function startRun() {
  resetEntityIds();
  const player = createPlayer();
  player.x = CANVAS_WIDTH / 2;
  player.y = CANVAS_HEIGHT / 2;
  applyMetaBonuses(player, gs.meta);

  gs.player = player;
  gs.currentFloor = 1;
  gs.roomsCleared = 0;
  gs.fragments = player.startFrags || 0;
  gs.upgrades = [];
  gs.bullets = [];
  gs.particles = [];
  gs.pickups = [];

  gs.floorMap = generateFloor(1);
  enterRoom(0);
}

function enterRoom(index) {
  gs.floorMap.currentRoomIndex = index;
  gs.currentRoom = gs.floorMap.rooms[index];
  gs.currentRoom.closeDoors();
  const { enemies, terrains } = placeEntitiesInRoom(gs.currentRoom);
  gs.enemies = enemies;
  gs.terrains = terrains;
  gs.state = 'RUNNING';
}

function transitionRoom(gs, toIndex) {
  gs.roomsCleared++;

  if (toIndex >= gs.floorMap.rooms.length) {
    gs.currentFloor++;
    gs.floorMap = generateFloor(gs.currentFloor);
    toIndex = 0;
  }

  const nextRoom = gs.floorMap.rooms[toIndex];

  if (nextRoom.type === 'shop') {
    gs.currentRoom = nextRoom;
    gs.state = 'SHOP';
    repositionPlayer(gs, toIndex);
    showShopScreen(gs, () => enterRoom(toIndex));
  } else {
    enterRoom(toIndex);
    repositionPlayer(gs, toIndex);
  }
}

function repositionPlayer(gs, toIndex) {
  if (!gs.player) return;
  const room = gs.floorMap.rooms[toIndex];
  const conn = gs.floorMap.connections.find(c => c.to === toIndex);
  if (!conn) return;

  const entryDoor = room.doors.find(d => {
    if (conn.doorSide === 'east') return d.side === 'west';
    if (conn.doorSide === 'west') return d.side === 'east';
    if (conn.doorSide === 'north') return d.side === 'south';
    if (conn.doorSide === 'south') return d.side === 'north';
    return false;
  });
  if (entryDoor) {
    gs.player.x = entryDoor.x + entryDoor.width / 2;
    gs.player.y = entryDoor.y + entryDoor.height / 2;
    if (entryDoor.side === 'west') gs.player.x += 40;
    if (entryDoor.side === 'east') gs.player.x -= 40;
    if (entryDoor.side === 'north') gs.player.y += 40;
    if (entryDoor.side === 'south') gs.player.y -= 40;
  }
}

function handleDeath(gs) {
  // Drop fragments from dead enemies
  for (const enemy of gs.enemies) {
    if (!enemy.alive) {
      const amount = dropFragments(enemy, gs);
      if (amount > 0) gs.fragments += amount;
    }
  }
  gs.state = 'DEAD';
  showDeathScreen(gs, () => {
    gs.state = 'MAIN_MENU';
    showMainMenu(() => startRun());
  });
}

// ─── Update Functions ─────────────────────────────────────────────────────────

function updateRunning(gs) {
  const { player, input } = gs;

  if (player && player.alive) {
    // Movement
    let moveX = 0;
    let moveY = 0;
    if (isKeyDown(input, 'UP')) moveY -= 1;
    if (isKeyDown(input, 'DOWN')) moveY += 1;
    if (isKeyDown(input, 'LEFT')) moveX -= 1;
    if (isKeyDown(input, 'RIGHT')) moveX += 1;

    const len = Math.sqrt(moveX * moveX + moveY * moveY);
    if (len > 1) {
      moveX /= len;
      moveY /= len;
    }

    player.x += moveX * player.speed * gs.dt;
    player.y += moveY * player.speed * gs.dt;

    // Clamp to canvas bounds
    player.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.y));

    // Body angle toward movement direction
    if (len > 0.1) {
      player.bodyAngle = Math.atan2(moveY, moveX);
    }

    // Turret follows mouse with rotation speed limit
    const targetAngle = Math.atan2(input.mouseY - player.y, input.mouseX - player.x);
    let angleDiff = targetAngle - player.turretAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const maxRot = player.turretSpeed * gs.dt;
    player.turretAngle += Math.max(-maxRot, Math.min(maxRot, angleDiff));

    // Shooting
    player.shootTimer -= gs.dt;
    if (input.mouseDown && player.shootTimer <= 0) {
      shoot(player, gs);
      player.shootTimer = player.shootCooldown;
    }

    // Pickup collection on overlap
    for (const pickup of gs.pickups) {
      if (circleCollision(player, pickup)) {
        gs.fragments += pickup.value;
        pickup.alive = false;
      }
    }
    gs.pickups = gs.pickups.filter(p => p.alive);

    // Magnetic pull toward player within 120px
    for (const pickup of gs.pickups) {
      const dx = player.x - pickup.x;
      const dy = player.y - pickup.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      if (dist < 120) {
        pickup.vx = (dx / dist) * 250;
        pickup.vy = (dy / dist) * 250;
      }
      pickup.x += pickup.vx * gs.dt;
      pickup.y += pickup.vy * gs.dt;
    }
  }

  // Enemy AI updates
  for (const enemy of gs.enemies) {
    if (!enemy.alive) continue;
    updateEnemyAI(enemy, gs);
  }

  // Bullet movement + canvas-leave cleanup
  for (const b of gs.bullets) {
    b.x += b.vx * gs.dt;
    b.y += b.vy * gs.dt;
    if (b.x < -10 || b.x > CANVAS_WIDTH + 10 || b.y < -10 || b.y > CANVAS_HEIGHT + 10) {
      b.alive = false;
    }
  }

  // Combat — collisions, damage, entity cleanup
  updateCombat(gs, gs.dt);

  // Check player death
  if (gs.player && !gs.player.alive) {
    handleDeath(gs);
    return;
  }

  // Check room cleared (no alive enemies remaining)
  if (
    gs.currentRoom &&
    gs.enemies.filter(e => e.alive).length === 0 &&
    !gs.currentRoom.cleared
  ) {
    gs.currentRoom.openDoors();
    gs.state = 'ROOM_CLEAR';
  }
}

function updateRoomClear(gs) {
  const { player, input } = gs;
  if (!player || !player.alive) return;

  // Continue player movement so they can walk to doors
  let moveX = 0, moveY = 0;
  if (isKeyDown(input, 'UP')) moveY -= 1;
  if (isKeyDown(input, 'DOWN')) moveY += 1;
  if (isKeyDown(input, 'LEFT')) moveX -= 1;
  if (isKeyDown(input, 'RIGHT')) moveX += 1;
  const len = Math.sqrt(moveX * moveX + moveY * moveY);
  if (len > 1) { moveX /= len; moveY /= len; }
  player.x += moveX * player.speed * gs.dt;
  player.y += moveY * player.speed * gs.dt;
  player.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.y));
  if (len > 0.1) player.bodyAngle = Math.atan2(moveY, moveX);

  // Turret still follows mouse
  const targetAngle = Math.atan2(input.mouseY - player.y, input.mouseX - player.x);
  let angleDiff = targetAngle - player.turretAngle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  const maxRot = player.turretSpeed * gs.dt;
  player.turretAngle += Math.max(-maxRot, Math.min(maxRot, angleDiff));

  // Check door proximity
  for (let i = 0; i < gs.currentRoom.doors.length; i++) {
    const door = gs.currentRoom.doors[i];
    if (!door.open) continue;
    const doorCenterX = door.x + door.width / 2;
    const doorCenterY = door.y + door.height / 2;
    const dx = player.x - doorCenterX;
    const dy = player.y - doorCenterY;
    if (Math.abs(dx) < 50 && Math.abs(dy) < 50) {
      const conn = gs.floorMap.connections.find(
        c => c.from === gs.floorMap.currentRoomIndex && c.doorSide === door.side
      );
      if (conn) {
        transitionRoom(gs, conn.to);
        return;
      }
      // No connection — last room, advance floor
      if (gs.floorMap.currentRoomIndex >= gs.floorMap.rooms.length - 1) {
        gs.currentFloor++;
        gs.floorMap = generateFloor(gs.currentFloor);
        enterRoom(0);
        return;
      }
    }
  }
}

// ─── Combat Helpers ───────────────────────────────────────────────────────────

function shoot(tank, gs) {
  const count = tank.bulletCount;
  const spreadAngle = 0.12;
  const baseAngle = tank.turretAngle;

  for (let i = 0; i < count; i++) {
    const offset = count > 1 ? (i - (count - 1) / 2) * spreadAngle : 0;
    const angle = baseAngle + offset;
    const vx = Math.cos(angle) * tank.bulletSpeed;
    const vy = Math.sin(angle) * tank.bulletSpeed;
    const bx = tank.x + Math.cos(angle) * (tank.radius + 8);
    const by = tank.y + Math.sin(angle) * (tank.radius + 8);
    gs.bullets.push(new Bullet(
      bx, by, 3, vx, vy,
      tank.bulletType,
      tank.bulletDamage,
      tank.enemyType ? 'enemy' : 'player'
    ));
  }
}

// ─── Enemy AI ─────────────────────────────────────────────────────────────────

function updateEnemyAI(enemy, gs) {
  enemy.behaviorState.timer += gs.dt;
  const player = gs.player;
  if (!player || !player.alive) return;

  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angleToPlayer = Math.atan2(dy, dx);

  switch (enemy.enemyType) {
    case 'DRONE':
      // Patrol slowly, face player, shoot on cooldown
      enemy.turretAngle = angleToPlayer;
      if (dist > 300) {
        enemy.x += Math.cos(angleToPlayer) * enemy.speed * gs.dt;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed * gs.dt;
      } else if (dist < 150) {
        enemy.x -= Math.cos(angleToPlayer) * enemy.speed * 0.5 * gs.dt;
        enemy.y -= Math.sin(angleToPlayer) * enemy.speed * 0.5 * gs.dt;
      }
      break;

    case 'ASSAULT':
      // Chase player, face and shoot
      enemy.turretAngle = angleToPlayer;
      if (dist > 200) {
        enemy.x += Math.cos(angleToPlayer) * enemy.speed * gs.dt;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed * gs.dt;
      }
      break;

    case 'SNIPER':
      // Stationary, slowly track player, shoot at range
      enemy.turretAngle = angleToPlayer;
      break;

    case 'CRAWLER':
      // Rush toward player at high speed; self-destruct on contact handled by combat.js
      enemy.turretAngle = angleToPlayer;
      enemy.x += Math.cos(angleToPlayer) * enemy.speed * gs.dt;
      enemy.y += Math.sin(angleToPlayer) * enemy.speed * gs.dt;
      break;

    case 'SHIELD':
      // Move toward player, face them
      enemy.turretAngle = angleToPlayer;
      if (dist > 250) {
        enemy.x += Math.cos(angleToPlayer) * enemy.speed * gs.dt;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed * gs.dt;
      }
      break;

    case 'HACKER':
      // Stay away from player, buff nearby enemies
      enemy.turretAngle = angleToPlayer;
      if (dist < 300) {
        enemy.x -= Math.cos(angleToPlayer) * enemy.speed * gs.dt;
        enemy.y -= Math.sin(angleToPlayer) * enemy.speed * gs.dt;
      }
      break;

    case 'BOSS':
      // Chase player, shoot frequently, move unpredictably
      enemy.turretAngle = angleToPlayer;
      if (dist > 150) {
        enemy.x += Math.cos(angleToPlayer) * enemy.speed * gs.dt;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed * gs.dt;
      }
      break;
  }

  // Enemy shooting
  enemy.shootTimer -= gs.dt;
  if (enemy.shootTimer <= 0 && enemy.shootCooldown < 900) {
    const vx = Math.cos(enemy.turretAngle) * enemy.bulletSpeed;
    const vy = Math.sin(enemy.turretAngle) * enemy.bulletSpeed;
    const bx = enemy.x + Math.cos(enemy.turretAngle) * (enemy.radius + 6);
    const by = enemy.y + Math.sin(enemy.turretAngle) * (enemy.radius + 6);
    gs.bullets.push(new Bullet(bx, by, 3, vx, vy, 'normal', enemy.bulletDamage, 'enemy'));
    enemy.shootTimer = enemy.shootCooldown;

    // ASSAULT double-tap
    if (enemy.enemyType === 'ASSAULT') {
      setTimeout(() => {
        if (enemy.alive && gs.player && gs.player.alive) {
          const a = Math.atan2(gs.player.y - enemy.y, gs.player.x - enemy.x);
          const bx2 = enemy.x + Math.cos(a) * (enemy.radius + 6);
          const by2 = enemy.y + Math.sin(a) * (enemy.radius + 6);
          gs.bullets.push(new Bullet(
            bx2, by2, 3,
            Math.cos(a) * enemy.bulletSpeed,
            Math.sin(a) * enemy.bulletSpeed,
            'normal', enemy.bulletDamage, 'enemy'
          ));
        }
      }, 150);
    }
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

showMainMenu(() => startRun());
requestAnimationFrame(gameLoop);
