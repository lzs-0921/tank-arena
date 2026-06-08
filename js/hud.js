export function updateHUD(gs) {
  setText('fragments', gs.fragments);
  setText('level', gs.currentFloor);

  if (gs.player) {
    const hearts = gs.player.alive
      ? Array(Math.max(0, gs.player.hp)).fill('♥').join('')
      : '';
    const shields = gs.player.shieldCount > 0
      ? ' ◆'.repeat(gs.player.shieldCount)
      : '';
    setText('lives', hearts + shields || 'DEAD');
  }

  setText('enemies', gs.enemies.filter(e => e.alive).length);
  setText('upgrades', gs.upgrades.length);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}
