import { describe, it, expect } from 'vitest';
import { Room, FloorMap, generateFloor, placeEntitiesInRoom } from './room.js';
import { ROOM_TYPES } from './config.js';

describe('Room', () => {
  it('creates a room with correct properties', () => {
    const room = new Room('combat', 1, ['north', 'east']);
    expect(room.type).toBe('combat');
    expect(room.floor).toBe(1);
    expect(room.cleared).toBe(false);
    expect(room.doors.length).toBe(2);
    expect(room.doors[0].side).toBe('north');
  });

  it('shop rooms start as cleared', () => {
    const room = new Room('shop', 2, ['west']);
    expect(room.cleared).toBe(true);
  });

  it('treasure rooms start as cleared', () => {
    const room = new Room('treasure', 2, ['west']);
    expect(room.cleared).toBe(true);
  });

  it('openDoors sets all doors to open and clears room', () => {
    const room = new Room('combat', 1, ['north', 'south']);
    room.openDoors();
    expect(room.cleared).toBe(true);
    expect(room.doors.every(d => d.open)).toBe(true);
  });

  it('closeDoors sets all doors to closed', () => {
    const room = new Room('combat', 1, ['north']);
    room.openDoors();
    room.closeDoors();
    expect(room.cleared).toBe(false);
    expect(room.doors[0].open).toBe(false);
  });
});

describe('FloorMap', () => {
  it('generates floor with rooms', () => {
    const map = new FloorMap(1, 8);
    expect(map.rooms.length).toBe(8);
    expect(map.rooms[map.rooms.length - 1].type).toBe('boss');
  });

  it('creates connections between rooms', () => {
    const map = new FloorMap(1, 6);
    expect(map.connections.length).toBeGreaterThan(0);
    expect(map.currentRoomIndex).toBe(0);
  });

  it('includes a shop room', () => {
    const map = new FloorMap(1, 10);
    const shops = map.rooms.filter(r => r.type === 'shop');
    expect(shops.length).toBe(1);
  });
});

describe('generateFloor', () => {
  it('returns FloorMap with rooms and connections', () => {
    const map = generateFloor(1);
    expect(map.rooms.length).toBeGreaterThanOrEqual(8);
    expect(map.rooms.length).toBeLessThanOrEqual(12);
    expect(map.connections.length).toBeGreaterThan(0);
  });
});

describe('placeEntitiesInRoom', () => {
  it('places enemies and terrains for combat room', () => {
    const room = new Room('combat', 1, ['north', 'south']);
    const { enemies, terrains } = placeEntitiesInRoom(room);
    expect(Array.isArray(enemies)).toBe(true);
    expect(Array.isArray(terrains)).toBe(true);
    expect(terrains.length).toBeGreaterThanOrEqual(3);
    expect(room.enemiesRemaining).toBeGreaterThan(0);
  });

  it('places boss enemy for boss room', () => {
    const room = new Room('boss', 2, ['west']);
    const { enemies } = placeEntitiesInRoom(room);
    expect(enemies.length).toBe(1);
    expect(enemies[0].enemyType).toBe('BOSS');
  });
});
