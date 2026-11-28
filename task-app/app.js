// LocalStorage からデータ読み込み、なければ初期データ
let cards = JSON.parse(localStorage.getItem('trello-cards')) || [
  { id: '1', title: 'デザインを決める', desc: 'ワイヤーフレームを作成する', column: 'todo' },
  { id: '2', title: '要件定義書を書く', desc: '', column: 'done' },
];

let currentColumn = '';
let dragCardId = '';

// 保存
function save() {
  localStorage.setItem('trello-cards', JSON.stringify(cards));
}

// ユニークID生成
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ボード全体を再描画
function render() {
  ['todo', 'in-progress', 'done'].forEach(col => {
    const container = document.getElementById(`cards-${col}`);
    const colCards = cards.filter(c => c.column === col);
    container.innerHTML = '';
    colCards.forEach(card => container.appendChild(createCardEl(card)));
    document.getElementById(`count-${col}`).textContent = colCards.length;
  });
}

// カード要素を生成
function createCardEl(card) {
  const el = document.createElement('div');
  el.className = 'card';
  el.setAttribute('draggable', 'true');
  el.dataset.id = card.id;

  el.innerHTML = `
    <div class="card-title">${escapeHtml(card.title)}</div>
    ${card.desc ? `<div class="card-desc">${escapeHtml(card.desc)}</div>` : ''}
    <div class="card-footer">
      <button class="btn-delete" onclick="deleteCard('${card.id}')" title="削除">✕</button>
    </div>
  `;

  el.addEventListener('dragstart', e => {
    dragCardId = card.id;
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('.column').forEach(c => c.classList.remove('drag-over'));
  });

  return el;
}

// XSS対策
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// カード削除
function deleteCard(id) {
  if (!confirm('このカードを削除しますか？')) return;
  cards = cards.filter(c => c.id !== id);
  save();
  render();
}

// モーダルを開く
function openModal(column) {
  currentColumn = column;
  document.getElementById('card-title').value = '';
  document.getElementById('card-desc').value = '';
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('card-title').focus(), 50);
}

// モーダルを閉じる
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  currentColumn = '';
}

// オーバーレイクリックで閉じる
function closeModalOnOverlay(e) {
  if (e.target.id === 'modal') closeModal();
}

// カード追加
function addCard() {
  const title = document.getElementById('card-title').value.trim();
  if (!title) {
    document.getElementById('card-title').focus();
    return;
  }
  const desc = document.getElementById('card-desc').value.trim();
  cards.push({ id: generateId(), title, desc, column: currentColumn });
  save();
  render();
  closeModal();
}

// ドラッグオーバー（ドロップ先を受け付ける）
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

// ドロップ（カラムを変更）
function onDrop(e, targetColumn) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!dragCardId) return;
  const card = cards.find(c => c.id === dragCardId);
  if (card) {
    card.column = targetColumn;
    save();
    render();
  }
  dragCardId = '';
}

// Enterキーでカード追加
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && e.ctrlKey && document.getElementById('modal').classList.contains('open')) {
    addCard();
  }
});

// 初期描画
render();
