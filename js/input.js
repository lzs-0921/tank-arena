import { KEY_BINDS } from './config.js';

export function initInput(canvas) {
  const inputState = {
    keys: {},
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    mouseJustPressed: false,
  };

  window.addEventListener('keydown', (e) => {
    inputState.keys[e.code] = true;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    inputState.keys[e.code] = false;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    inputState.mouseX = e.clientX - rect.left;
    inputState.mouseY = e.clientY - rect.top;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      if (!inputState.mouseDown) inputState.mouseJustPressed = true;
      inputState.mouseDown = true;
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      inputState.mouseDown = false;
    }
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return inputState;
}

export function isKeyDown(inputState, action) {
  const binds = KEY_BINDS[action];
  if (!binds) return false;
  return binds.some(key => inputState.keys[key]);
}

export function clearFrameInput(inputState) {
  inputState.mouseJustPressed = false;
}
