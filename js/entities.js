import { PLAYER_RADIUS, PLAYER_MAX_HP, PLAYER_SPEED, PLAYER_SHOOT_COOLDOWN,
         PLAYER_TURRET_SPEED, PLAYER_BULLET_SPEED, PLAYER_BULLET_DAMAGE,
         BULLET_TYPES } from './config.js';

let nextId = 0;
export function resetEntityIds() { nextId = 0; }
function genId() { return ++nextId; }

export class Entity {
  constructor(x, y, radius) {
    this.id = genId();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.alive = true;
  }

  distTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export class Tank extends Entity {
  constructor(x, y, radius, hp, speed) {
    super(x, y, radius);
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.bodyAngle = 0;
    this.turretAngle = 0;
    this.turretSpeed = PLAYER_TURRET_SPEED;
    this.shootTimer = 0;
    this.shootCooldown = PLAYER_SHOOT_COOLDOWN;
    this.bulletType = BULLET_TYPES.NORMAL;
    this.bulletCount = 1;
    this.bulletSpeed = PLAYER_BULLET_SPEED;
    this.bulletDamage = PLAYER_BULLET_DAMAGE;
    this.shieldCount = 0;
    this.critChance = 0;
  }

  takeDamage(dmg) {
    if (this.shieldCount > 0) {
      this.shieldCount--;
      return true;
    }
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return false;
    }
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
  }
}

export function createPlayer() {
  return new Tank(0, 0, PLAYER_RADIUS, PLAYER_MAX_HP, PLAYER_SPEED);
}

export class Enemy extends Tank {
  constructor(x, y, config, enemyType) {
    super(x, y, config.radius, config.hp, config.speed);
    this.enemyType = enemyType;
    this.shootCooldown = config.shootCooldown;
    this.bulletSpeed = config.bulletSpeed;
    this.bulletDamage = config.bulletDamage;
    this.dropFragments = config.dropFragments;
    this.label = config.label;
    this.behaviorState = { timer: 0, target: null };
  }
}

export class Bullet extends Entity {
  constructor(x, y, radius, vx, vy, bulletType, damage, ownerId) {
    super(x, y, radius);
    this.vx = vx;
    this.vy = vy;
    this.bulletType = bulletType;
    this.damage = damage;
    this.ownerId = ownerId;
    this.bounces = 0;
    this.maxBounces = bulletType === BULLET_TYPES.BOUNCE ? 2 : 0;
  }
}

export class Pickup extends Entity {
  constructor(x, y, value) {
    super(x, y, 5);
    this.value = value;
  }
}

export class Terrain extends Entity {
  constructor(x, y, config, terrainType) {
    super(x, y, config.radius);
    this.terrainType = terrainType;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.label = config.label;
    this.color = config.color;
    this.angle = 0;
    this.direction = 1;
    this.phase = Math.random() * Math.PI * 2;
  }

  takeDamage(dmg) {
    if (this.terrainType === 'BARRIER' || this.terrainType === 'CONVEYOR' || this.terrainType === 'TESLA') {
      return true; // indestructible
    }
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.alive = false;
      return false;
    }
    return true;
  }
}

export class Particle {
  constructor(x, y, vx, vy, life, color, size = 2) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.alive = true;
  }
}
