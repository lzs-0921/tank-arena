import { loadMeta, saveMeta, getTalentTree, unlockTalent, addDataCores, updateBestDepth, applyMetaBonuses } from './meta.js';
import { generateShopSlots, purchaseUpgrade, refreshShop } from './shop.js';

const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');

export function showMainMenu(onStart) {
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h1>TANK ARENA</h1>
    <p class="subtitle">WASD Move &bull; Mouse Aim &bull; Click to Shoot</p>
    <button id="startBtn" class="cyber-btn">START RUN</button>
    <button id="talentBtn" class="cyber-btn secondary">TALENT MATRIX</button>
  `;

  document.getElementById('startBtn').onclick = () => {
    overlay.classList.add('hidden');
    onStart();
  };

  document.getElementById('talentBtn').onclick = () => showTalentScreen(() => showMainMenu(onStart));
}

export function showDeathScreen(gs, onRestart) {
  const cores = calculateRunReward(gs);
  const meta = loadMeta();
  addDataCores(meta, cores);
  updateBestDepth(meta, gs.currentFloor);

  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>SYSTEM OFFLINE</h2>
    <p class="final-score">Floor: ${gs.currentFloor} | Rooms Cleared: ${gs.roomsCleared}</p>
    <p class="final-score">Data Cores Earned: <span style="color:#ff66ff">+${cores}</span></p>
    <p class="final-score" style="color:#667788">Total Cores: ${meta.dataCores}</p>
    <button id="restartBtn" class="cyber-btn">RETURN TO BASE</button>
  `;
  document.getElementById('restartBtn').onclick = () => {
    overlay.classList.add('hidden');
    onRestart();
  };
}

export function showShopScreen(gs, onContinue) {
  overlay.classList.remove('hidden');
  renderShop(gs, onContinue, 0);
}

function renderShop(gs, onContinue, refreshCount) {
  const slots = generateShopSlots(gs.upgrades, gs.currentFloor);
  const refreshCost = 5 * Math.pow(2, refreshCount);

  overlayContent.innerHTML = `
    <h2 style="color:#ff66ff">DATA MARKET</h2>
    <p style="color:#ffcc00;margin-bottom:16px">Fragments: ${gs.fragments}</p>
    <div class="shop-grid">
      ${slots.map((s, i) => `
        <div class="shop-slot" id="shopSlot${i}">
          <div class="slot-name">${s.name}</div>
          <div class="slot-info">${s.category} | Lv.${s.level}/${s.maxLevel}</div>
          <div class="slot-cost">${s.cost} frags</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:16px">
      <button id="refreshBtn" class="cyber-btn secondary">REFRESH (${refreshCost} frags)</button>
      <button id="continueBtn" class="cyber-btn">CONTINUE</button>
    </div>
  `;

  slots.forEach((s, i) => {
    const el = document.getElementById(`shopSlot${i}`);
    if (el) el.onclick = () => {
      const result = purchaseUpgrade(gs, s);
      if (result.success) renderShop(gs, onContinue, refreshCount);
    };
  });

  const refreshEl = document.getElementById('refreshBtn');
  if (refreshEl) refreshEl.onclick = () => {
    const result = refreshShop(gs, refreshCount);
    if (result.success) renderShop(gs, onContinue, refreshCount + 1);
  };

  const continueEl = document.getElementById('continueBtn');
  if (continueEl) continueEl.onclick = () => {
    overlay.classList.add('hidden');
    onContinue();
  };
}

function showTalentScreen(onBack) {
  const meta = loadMeta();
  const tree = getTalentTree();

  overlayContent.innerHTML = `
    <h2 style="color:#ffcc00">TALENT MATRIX</h2>
    <p style="color:#ff66ff;margin-bottom:16px">Data Cores: ${meta.dataCores}</p>
    <div class="talent-grid">
      ${['attack', 'defense', 'utility'].map(branch => `
        <div class="talent-branch">
          <h3 style="color:${branch === 'attack' ? '#ff3355' : branch === 'defense' ? '#44aaff' : '#ffcc00'}">
            ${branch.toUpperCase()}
          </h3>
          ${tree[branch].map(t => {
            const unlocked = meta.unlockedTalents.includes(t.id);
            return `<div class="talent-node ${unlocked ? 'unlocked' : ''}" id="talent_${t.id}">
              <span>${t.name}</span>
              <span style="font-size:10px">${unlocked ? 'UNLOCKED' : t.cost + ' cores'}</span>
            </div>`;
          }).join('')}
        </div>
      `).join('')}
    </div>
    <button id="backBtn" class="cyber-btn secondary" style="margin-top:16px">BACK</button>
  `;

  for (const branch of Object.values(tree)) {
    for (const t of branch) {
      const el = document.getElementById('talent_' + t.id);
      if (el && !meta.unlockedTalents.includes(t.id)) {
        el.style.cursor = 'pointer';
        el.onclick = () => {
          const updated = loadMeta();
          const result = unlockTalent(updated, t.id);
          if (result.success) showTalentScreen(onBack);
        };
      }
    }
  }

  document.getElementById('backBtn').onclick = onBack;
}

function calculateRunReward(gs) {
  let cores = gs.roomsCleared * 2;
  if (gs.currentRoom && gs.currentRoom.type === 'boss') cores += 10;
  if (gs.currentFloor > (loadMeta().bestDepth || 0)) cores += 15;
  return cores;
}
