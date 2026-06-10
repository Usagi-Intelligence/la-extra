/* ═══════════════════════════════════════════════════════════════════════════
   LA EXTRA — MODERN / RETRO GLOSSY DESK — Application Logic with Web Audio SFX
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Web Audio Synth (High-Tech Retro Sounds) ───────────────────────────────
const SFX = {
  ctx: null,
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  chargeOsc: null,
  chargeGain: null,
  startChargeSound() {
    if (localStorage.getItem('mute-system-sounds') === 'true') return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.stopChargeSound();
      const t = this.ctx.currentTime;
      this.chargeOsc = this.ctx.createOscillator();
      this.chargeGain = this.ctx.createGain();
      this.chargeOsc.type = 'sine';
      this.chargeOsc.frequency.setValueAtTime(180, t);
      this.chargeOsc.frequency.linearRampToValueAtTime(700, t + 3.0);
      this.chargeGain.gain.setValueAtTime(0.04, t);
      this.chargeOsc.connect(this.chargeGain);
      this.chargeGain.connect(this.ctx.destination);
      this.chargeOsc.start(t);
    } catch(e) {
      console.warn("SFX Charge error:", e);
    }
  },
  stopChargeSound() {
    try {
      if (this.chargeOsc) {
        this.chargeOsc.stop();
        this.chargeOsc.disconnect();
        this.chargeOsc = null;
      }
      if (this.chargeGain) {
        this.chargeGain.disconnect();
        this.chargeGain = null;
      }
    } catch(e) {}
  },
  play(type) {
    if (type !== 'msg-notification' && localStorage.getItem('mute-system-sounds') === 'true') {
      return;
    }
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      if (type === 'msg-notification') {
        // High-tech sci-fi double ping for new message notification
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, t); // D5
        osc.frequency.setValueAtTime(880, t + 0.1); // A5
        
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        
        osc.start(t);
        osc.stop(t + 0.35);
      } else if (type === 'hover') {
        // High-tech micro tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(700, t + 0.03);
        
        gain.gain.setValueAtTime(0.012, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        
        osc.start(t);
        osc.stop(t + 0.03);
      } else if (type === 'click') {
        // High-tech terminal press click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(350, t + 0.07);
        
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        
        osc.start(t);
        osc.stop(t + 0.07);
      } else if (type === 'success') {
        // Sci-fi positive confirmation chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.setValueAtTime(780, t + 0.07);
        osc.frequency.setValueAtTime(1040, t + 0.14);
        
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        
        osc.start(t);
        osc.stop(t + 0.28);
      } else if (type === 'error') {
        // Low sci-fi alarm/buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(90, t + 0.32);
        
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        
        osc.start(t);
        osc.stop(t + 0.32);
      } else if (type === 'nav') {
        // Telemetry sweep for tabs/navigation
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(840, t + 0.12);
        
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        
        osc.start(t);
        osc.stop(t + 0.12);
      }
    } catch(e) {
      console.warn("SFX Error: ", e);
    }
  }
};

let lastHoveredEl = null;
document.addEventListener('mouseover', (e) => {
  const el = e.target.closest('button, .nav-tab, .sub-tab, .variant-pill, .nier-list-item, .pedido-card, .stock-card, .sf-check, input, select');
  if (el && el !== lastHoveredEl) {
    lastHoveredEl = el;
    SFX.play('hover');
  }
});
document.addEventListener('mouseout', (e) => {
  const el = e.target.closest('button, .nav-tab, .sub-tab, .variant-pill, .nier-list-item, .pedido-card, .stock-card, .sf-check, input, select');
  if (el && (!e.relatedTarget || !el.contains(e.relatedTarget))) {
    lastHoveredEl = null;
  }
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('button, .nav-tab, .sub-tab, .variant-pill, .nier-list-item, .sf-check input');
  if (el) {
    if (el.classList.contains('nav-tab')) {
      SFX.play('nav');
    } else {
      SFX.play('click');
    }
  }
});

const API = '/api';

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function fmtMoney(n) {
  if (n == null) return '$0';
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function formatNumberWithSpaces(value) {
  let clean = String(value || '').replace(/\D/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}


function fmtElapsed(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function cleanVariantName(v) {
  if (!v) return '';
  return v.replace(/\{[^}]+\}/g, '').trim();
}

function getVariantMultiplier(varCant) {
  if (!varCant) return 1.0;
  const match = varCant.match(/\{([^}]+)\}/);
  if (match) {
    const fracStr = match[1].trim();
    if (fracStr.includes('/')) {
      const parts = fracStr.split('/');
      const num = parseFloat(parts[0]);
      const denom = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
        return num / denom;
      }
    } else {
      const val = parseFloat(fracStr);
      if (!isNaN(val)) return val;
    }
  }
  return 1.0;
}

function formatStockValue(val) {
  if (val == null) return '0';
  const num = parseFloat(val);
  if (isNaN(num)) return '0';
  const integerPart = Math.floor(num);
  const decimalPart = num - integerPart;
  
  let fracChar = '';
  if (Math.abs(decimalPart - 0.5) < 0.01) {
    fracChar = '½';
  } else if (Math.abs(decimalPart - 0.25) < 0.01) {
    fracChar = '¼';
  } else if (Math.abs(decimalPart - 0.75) < 0.01) {
    fracChar = '¾';
  } else if (Math.abs(decimalPart - 0.333) < 0.05) {
    fracChar = '⅓';
  } else if (Math.abs(decimalPart - 0.666) < 0.05) {
    fracChar = '⅔';
  } else if (Math.abs(decimalPart - 0.125) < 0.01) {
    fracChar = '⅛';
  } else if (Math.abs(decimalPart - 0.375) < 0.01) {
    fracChar = '⅜';
  } else if (Math.abs(decimalPart - 0.625) < 0.01) {
    fracChar = '⅝';
  } else if (Math.abs(decimalPart - 0.875) < 0.01) {
    fracChar = '⅞';
  } else if (decimalPart > 0) {
    return Number(num.toFixed(2)).toString().replace('.', ',');
  }
  
  if (integerPart === 0 && fracChar !== '') {
    return fracChar;
  }
  return integerPart.toString() + fracChar;
}


async function api(path, opts = {}) {
  const url = API + path;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Servidor temporalmente ocupado o en mantenimiento (${res.status})`);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

function toast(msg, type = '') {
  if (type === 'success') SFX.play('success');
  if (type === 'error') SFX.play('error');
  const c = $('#toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

function showConfirm(title, text, onOk) {
  SFX.play('error'); // Warnings sound like errors
  $('#confirm-title').textContent = '// ' + title.toUpperCase();
  $('#confirm-text').textContent = text;
  $('#modal-confirm').classList.add('open');
  const okBtn = $('#confirm-ok-btn');
  const newBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newBtn, okBtn);
  newBtn.id = 'confirm-ok-btn';
  newBtn.addEventListener('click', () => { closeConfirm(); onOk(); });
}

function closeConfirm() { $('#modal-confirm').classList.remove('open'); }

// ── Stock Alert Helpers ─────────────────────────────────────────────────────

function updateCloseAllToastsButton() {
  const c = $('#toast-container');
  if (!c) return;
  const warnings = c.querySelectorAll('.toast.warning');
  
  let closeBtn = $('#toast-close-all-btn');
  
  if (warnings.length >= 3) {
    if (!closeBtn) {
      closeBtn = document.createElement('div');
      closeBtn.id = 'toast-close-all-btn';
      closeBtn.className = 'toast';
      closeBtn.style.cssText = `
        display: flex; justify-content: center; align-items: center;
        cursor: pointer; font-family: var(--font-head); font-size: 0.8rem;
        font-weight: 700; letter-spacing: 0.05em; padding: 8px 16px;
        background: #e74c3c; border: 1px solid #c0392b;
        color: #ffffff; border-radius: var(--radius); margin-top: 8px;
        transition: all 0.15s ease; width: 100%; box-sizing: border-box;
      `;
      closeBtn.textContent = 'CERRAR NOTIFICACIONES';
      
      closeBtn.addEventListener('mouseover', () => {
        closeBtn.style.background = '#c0392b';
      });
      closeBtn.addEventListener('mouseout', () => {
        closeBtn.style.background = '#e74c3c';
      });
      
      closeBtn.addEventListener('click', () => {
        const allWarnings = c.querySelectorAll('.toast.warning');
        allWarnings.forEach(w => {
          w.style.opacity = '0';
          w.style.transform = 'translateY(10px) scale(0.95)';
          setTimeout(() => w.remove(), 250);
        });
        closeBtn.style.opacity = '0';
        setTimeout(() => closeBtn.remove(), 250);
      });
      
      c.appendChild(closeBtn);
    }
  } else {
    if (closeBtn) {
      closeBtn.remove();
    }
  }
}

function toastWarning(msg, sub) {
  SFX.play('error');
  const c = $('#toast-container');
  const t = document.createElement('div');
  t.className = 'toast warning';
  t.style.display = 'flex';
  t.style.justifyContent = 'space-between';
  t.style.alignItems = 'center';
  t.style.gap = '12px';
  t.style.pointerEvents = 'auto';
  
  t.innerHTML = `
    <div style="flex:1;">
      <span style="display:block;">${msg}</span>
      ${sub ? `<span class="toast-sub">${sub}</span>` : ''}
    </div>
    <button class="btn-ghost" style="
      padding: 4px 10px;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      font-weight: 700;
      color: #d35400;
      border: 1px solid rgba(230, 126, 34, 0.4);
      border-radius: 4px;
      cursor: pointer;
      background: rgba(230, 126, 34, 0.05);
      transition: all 0.2s;
    " onmouseover="this.style.background='rgba(230, 126, 34, 0.15)'" onmouseout="this.style.background='rgba(230, 126, 34, 0.05)'">
      OK
    </button>
  `;
  
  const okBtn = t.querySelector('button');
  okBtn.addEventListener('click', () => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => {
      t.remove();
      updateCloseAllToastsButton();
    }, 300);
  });
  
  c.appendChild(t);
  updateCloseAllToastsButton();
}



// Track which stock items have already shown a low-stock notification today
// to avoid spamming the user with the same alert every time stock loads
let _lowStockNotified = new Set();

function checkLowStock() {
  if (!stockData || !stockData.length) return;
  stockData.forEach(s => {
    if (s.cantidad_inicial <= 0) return;
    const threshold = Math.max(0.10 * s.cantidad_inicial, 3);
    if (s.cantidad_actual <= threshold && s.cantidad_actual >= 0 && !_lowStockNotified.has(s.id)) {
      _lowStockNotified.add(s.id);
      // Find tipo name from the product
      const prod = (catalogoForStock || []).find(p => p.id === s.producto_id);
      const tipo = prod ? (stockTipos || []).find(t => t.id === prod.tipo_id) : null;
      const tipoName = tipo ? tipo.nombre.toLowerCase() : '';
      const prodName = (s.nombre || '').toLowerCase();
      toastWarning(
        `Hay pocas ${tipoName} de ${prodName}`,
        `quedan ${s.cantidad_actual} unidades`
      );
    }
  });
}

async function checkLowStockBackground() {
  try {
    stockData = await api('/stock');
    if (!catalogoForStock || !catalogoForStock.length) {
      catalogoForStock = await api('/productos');
    }
    if (!stockTipos || !stockTipos.length) {
      stockTipos = await api('/tipos');
    }
    checkLowStock();
  } catch (e) {
    console.error("Failed to check low stock in background:", e);
  }
}

function isProductStockSeparated(productId) {
  const prod = (catalogoForStock || []).find(p => p.id === productId);
  if (!prod) return false;
  const list = (typeof stockTipos !== 'undefined' && stockTipos && stockTipos.length) ? stockTipos : ((typeof tiposData !== 'undefined') ? tiposData : []);
  const tipo = list.find(t => t.id === prod.tipo_id);
  return !!(tipo && tipo.separar_stock_coccion);
}

function getEffectiveStockLimit(productId, stockEntry) {
  if (!stockEntry) return 0;
  let limit = stockEntry.cantidad_actual;
  const varTipo = stockEntry.var_tipo || '';
  if (editingOrderId && originalOrderItems.length) {
    const originalQty = originalOrderItems.reduce((sum, it) => {
      if (it.producto_id !== productId) return sum;
      if (isProductStockSeparated(productId)) {
        if ((it.var_tipo || '') !== varTipo) return sum;
      }
      return sum + (it.cantidad * getVariantMultiplier(it.var_cantidad));
    }, 0);
    limit += originalQty;
  }
  return limit;
}

function getStockForProduct(productoId, varTipo = '') {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const fechaHoy = `${dd}/${mm}/${yyyy}`;
  if (!stockData || !stockData.length) return null;
  
  // Try matching product, date, and specific var_tipo
  const matched = stockData.find(s => s.producto_id === productoId && s.fecha === fechaHoy && (s.var_tipo || '') === varTipo);
  if (matched) return matched;
  
  // Fallback to general stock entry if specific not found
  return stockData.find(s => s.producto_id === productoId && s.fecha === fechaHoy && (s.var_tipo || '') === '') || null;
}

function getOrderQtyForProduct(productoId, varTipo = '') {
  return orderItems.reduce((sum, it) => {
    if (it.producto_id !== productoId) return sum;
    if (isProductStockSeparated(productoId)) {
      if ((it.var_tipo || '') !== varTipo) return sum;
    }
    return sum + (it.cantidad * getVariantMultiplier(it.var_cantidad));
  }, 0);
}

let _stockWarningIgnoreCallback = null;
let _stockWarningUndoCallback = null;

function showStockWarning(faltante, prodName, onIgnore, onUndo) {
  SFX.play('error');
  $('#stock-warning-text').textContent =
    `Faltarían ${faltante} ${prodName.toLowerCase()} en stock para realizar el pedido`;
  $('#modal-stock-warning').classList.add('open');
  _stockWarningIgnoreCallback = onIgnore;
  _stockWarningUndoCallback = onUndo;
}





const SECTIONS = {
  pedidos:      { title: 'PEDIDOS',        subtitle: '// Cola de trabajo' },
  catalogo:     { title: 'CATÁLOGO',       subtitle: '// Gestión de productos y categorías' },
  resumen:      { title: 'RESUMEN',        subtitle: '// Panel de finanzas' },
  gastosstock:  { title: 'STOCK',          subtitle: '// Control de stock' },
  sistema:      { title: 'INFORMACIÓN',    subtitle: '// Configuración' },
};

let currentSection = 'pedidos';
let currentResumenTab = 'ingresos';

function switchResumenTab(tab) {
  currentResumenTab = tab;
  $$('#resumen-main-tabs .sub-tab').forEach(t => t.classList.toggle('active', t.dataset.resumen === tab));
  $('#resumen-ingresos-section').style.display = tab === 'ingresos' ? '' : 'none';
  $('#resumen-gastos-section').style.display   = tab === 'gastos'   ? '' : 'none';
  $('#resumen-balance-section').style.display  = tab === 'balance'  ? '' : 'none';
  if (tab === 'ingresos') {
    loadResumen();
  } else if (tab === 'gastos') {
    loadGastos();
    loadBalanceCards();
  }
}

function navigateTo(section) {
  currentSection = section;
  $$('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.section === section));
  $$('.section').forEach(s => s.classList.toggle('active', s.id === 'sec-' + section));
  $('#header-title').textContent = SECTIONS[section].title;
  $('#header-subtitle').textContent = SECTIONS[section].subtitle;
  const fab = $('#fab-new-order');
  if (fab) fab.style.display = section === 'pedidos' ? 'flex' : 'none';

  if (section === 'pedidos') loadPedidos();
  if (section === 'catalogo') switchCatTab(currentCatTab);
  if (section === 'resumen') {
    if (currentResumenTab === 'ingresos') {
      loadResumen();
    } else if (currentResumenTab === 'gastos') {
      loadGastos();
      loadBalanceCards();
    } else if (currentResumenTab === 'balance') {
      // Nothing specific needed
    }
  }
  if (section === 'gastosstock') loadGastosStock();
  if (section === 'sistema') loadSistema();
}

function showSection(section) {
  navigateTo(section);
}



$$('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => navigateTo(tab.dataset.section));
});

// ── Clock ───────────────────────────────────────────────────────────────────

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  $('#status-clock').textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ═══ PEDIDOS ════════════════════════════════════════════════════════════════

let pedidoFilter = 'Todos';
let pedidosData = [];
let timerInterval;

$$('#pedidos-tabs .sub-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('#pedidos-tabs .sub-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    pedidoFilter = tab.dataset.filter;
    renderPedidos();
  });
});

async function loadPedidos() {
  const fecha = $('#pedidos-fecha').value;
  const search = $('#pedidos-search').value;
  let params = [];
  if (fecha) {
    const [y, m, d] = fecha.split('-');
    params.push(`fecha=${d}/${m}/${y}`);
  }
  if (search) params.push(`search=${encodeURIComponent(search)}`);

  try {
    pedidosData = await api('/pedidos' + (params.length ? '?' + params.join('&') : ''));
    renderPedidos();
    updateTimers();
    if (document.body.classList.contains('layout-vertical')) {
      updateSidebarTelemetry();
    }
    checkLowStockBackground();
  } catch (e) {
    toast('SYS ERROR: ' + e.message, 'error');
  }
}

function goToToday() {
  const today = new Date();
  const yy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  $('#pedidos-fecha').value = `${yy}-${mm}-${dd}`;
  loadPedidos();
}

function renderPedidos() {
  const container = $('#pedidos-list');
  let filtered = pedidosData;
  if (pedidoFilter !== 'Todos') {
    filtered = pedidosData.filter(p => p.estado === pedidoFilter);
  }

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">&lt;/&gt;</div><p>// No hay pedidos ${pedidoFilter === 'Todos' ? '' : 'con estado "' + pedidoFilter + '"'}</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const estadoClass = p.estado === 'En curso' ? 'estado-en-curso' : p.estado === 'Listo' ? 'estado-listo' : 'estado-entregado';
    const envioTag = p.envio && p.envio.envio ? ' <span style="font-size:0.68rem;color:var(--accent-dim);font-family:var(--font-mono);">▸ ENVÍO</span>' : '';

    let timerHtml = '';
    if (p.estado === 'En curso' && p.ts_inicio) {
      const elapsed = Date.now() / 1000 - p.ts_inicio;
      timerHtml = `<span class="pc-timer" data-ts="${p.ts_inicio}">[${fmtElapsed(elapsed)}]</span>`;
    } else if (p.elapsed) {
      timerHtml = `<span style="font-size:0.72rem; color:var(--text-light); font-family:var(--font-mono);">[${fmtElapsed(p.elapsed)}]</span>`;
    }

    const isPaid = p.pagado === true;
    const dollarBtnStyle = isPaid 
      ? 'border: 1px solid var(--accent-red); color: var(--accent-red); background: rgba(231, 76, 60, 0.06); font-family: var(--font-mono);' 
      : 'border: 1px solid var(--bg-cool-gray); color: var(--text-light); background: transparent; font-family: var(--font-mono);';
    
    const dollarButton = `
      <button class="btn-action-text" style="min-width: 40px; width: 40px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; font-weight: 700; border-radius: 6px; transition: all 0.15s; ${dollarBtnStyle}" onmouseover="this.style.background='${isPaid ? 'rgba(231, 76, 60, 0.18)' : 'rgba(231, 76, 60, 0.08)'}'; this.style.borderColor='var(--accent-red)'; this.style.color='var(--accent-red)';" onmouseout="this.style.background='${isPaid ? 'rgba(231, 76, 60, 0.06)' : 'transparent'}'; this.style.borderColor='${isPaid ? 'var(--accent-red)' : 'var(--bg-cool-gray)'}'; this.style.color='${isPaid ? 'var(--accent-red)' : 'var(--text-light)'}';" onclick="event.stopPropagation(); togglePago(${p.id}, ${isPaid})">$</button>
    `;

    const editButton = `
      <button class="btn-solid-status" style="min-width: 40px; width: 40px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.05rem;" onclick="event.stopPropagation(); openEditPedidoModal(${p.id})" title="Editar Pedido">✎</button>
    `;

    let bottomRowHtml = '';
    if (p.estado === 'En curso') {
      bottomRowHtml = `
        ${editButton}
        <button class="btn-solid-status listo" style="min-width: 100px; height: 32px; padding: 0 16px; font-size: 0.8rem;" onclick="event.stopPropagation(); cambiarEstado(${p.id}, 'Listo')">LISTO</button>
      `;
    } else if (p.estado === 'Listo') {
      bottomRowHtml = `
        ${editButton}
        <button class="btn-solid-status entregar" style="min-width: 100px; height: 32px; padding: 0 16px; font-size: 0.8rem;" onclick="event.stopPropagation(); cambiarEstado(${p.id}, 'Entregado')">ENTREGAR</button>
      `;
    } else {
      bottomRowHtml = `
        <button class="btn-solid-status" style="min-width: 40px; width: 40px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 1.05rem;" onclick="event.stopPropagation(); cambiarEstado(${p.id}, 'En curso')" title="Reabrir Pedido">↩</button>
      `;
    }

    return `
      <div class="pedido-card" onclick="showPedidoDetails(${p.id})">
        <div class="pc-left">
          <div class="pc-top-left">
            <span class="pc-cliente">${p.cliente || '?'}</span>
            ${envioTag}
          </div>
          <div style="font-family:var(--font-mono); font-size:0.78rem; color:var(--text-light); display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:4px;">
            <span class="pc-total-meta" style="color:var(--text-light); font-weight:700;">[${fmtMoney(p.total)} ${p.pago ? p.pago.metodo : ''}]</span>
            ${p.hora_retiro ? `<span class="pc-retiro-meta" style="color:var(--text-light);">[RET:${p.hora_retiro}]</span>` : ''}
            ${p.hora_registro ? `<span class="pc-retiro-meta" style="color:var(--text-light);">[${p.hora_registro}]</span>` : ''}
            ${timerHtml}
          </div>
        </div>
        <div class="pc-right" style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end; justify-content: center; min-width: 160px !important;">
          <!-- Top Row: $ Button & Status Badge -->
          <div style="display: flex; gap: 8px; align-items: center;">
            ${dollarButton}
            <span class="pc-estado ${estadoClass}" style="min-width: 100px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">
              ${p.estado === 'Entregado' ? 'ENTREGADO' : p.estado.toUpperCase()}
            </span>
          </div>
          <!-- Bottom Row: Pencil/Reopen Button & Solid Action Button -->
          <div style="display: flex; gap: 8px; align-items: center;">
            ${bottomRowHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function togglePago(id, isPaid) {
  const p = pedidosData.find(x => x.id === id);
  if (p && p.estado === 'Entregado') {
    if (isPaid) {
      toast('No se puede deshacer el pago de un pedido entregado', 'error');
      return;
    }
  }

  if (isPaid) {
    showConfirm('Deshacer pago', `Se va a deshacer el pago del pedido #${id} y se restará de los ingresos. ¿Continuar?`, async () => {
      try {
        await api(`/pedidos/${id}/pagado`, { method: 'PUT', body: JSON.stringify({ pagado: false }) });
        toast('PAGO DESHECHO', 'success');
        loadPedidos();
      } catch (e) { toast('ERROR: ' + e.message, 'error'); }
    });
  } else {
    try {
      await api(`/pedidos/${id}/pagado`, { method: 'PUT', body: JSON.stringify({ pagado: true }) });
      toast('PEDIDO MARCADO COMO PAGO', 'success');
      loadPedidos();
    } catch (e) { toast('ERROR: ' + e.message, 'error'); }
  }
}

function updateTimers() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    $$('.pc-timer[data-ts]').forEach(el => {
      const ts = parseFloat(el.dataset.ts);
      const elapsed = Date.now() / 1000 - ts;
      el.textContent = '[' + fmtElapsed(elapsed) + ']';
    });
  }, 1000);
}

async function cambiarEstado(id, estado) {
  try {
    await api(`/pedidos/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) });
    toast(`PEDIDO #${id} → ${estado.toUpperCase()}`, 'success');
    loadPedidos();
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

function deletePedido(id) {
  showConfirm('Eliminar Pedido', `¿Eliminar pedido #${id}?`, async () => {
    try {
      await api(`/pedidos/${id}`, { method: 'DELETE' });
      toast('PEDIDO ELIMINADO', 'success');
      loadPedidos();
    } catch (e) { toast('ERROR: ' + e.message, 'error'); }
  });
}

function showPedidoDetails(pedidoId) {
  const p = pedidosData.find(x => x.id === pedidoId);
  if (!p) return;
  
  SFX.play('click');
  const existing = $('#modal-pedido-details');
  if (existing) existing.remove();

  // Group items by category
  const groups = {};
  (p.items || []).forEach(it => {
    const prod = (catalogoForStock || []).find(x => x.id === it.producto_id);
    const catId = prod ? prod.tipo_id : 999;
    const catName = catId === 999 ? 'Otros' : ((stockTipos || []).find(x => x.id === catId)?.nombre || 'Otros');
    if (!groups[catName]) groups[catName] = [];
    groups[catName].push(it);
  });

  let itemsHtml = '';
  Object.keys(groups).forEach(catName => {
    itemsHtml += `
      <div style="margin-bottom: 14px; text-align: left;">
        <div style="font-family: var(--font-head); font-size: 0.85rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text-muted); margin-top: 14px; margin-bottom: 6px; text-transform: uppercase;">
          // ${catName}
        </div>
        <ul style="list-style: none; padding: 0; margin: 0; font-family: var(--font-mono) !important; font-size: 0.88rem; color: var(--text-dark); line-height: 1.5;">
          ${groups[catName].map(it => {
            const coccion = it.var_tipo ? ` - ${it.var_tipo}` : '';
            const tamano = it.var_cantidad ? ` (${cleanVariantName(it.var_cantidad)})` : '';
            return `<li style="display: flex; justify-content: space-between; margin-bottom: 4px; padding: 2px 0; font-family: var(--font-mono) !important;">
              <span style="font-family: var(--font-mono) !important;"><span style="color: var(--accent); font-weight: 700; margin-right: 6px; font-family: var(--font-mono) !important;">${it.cantidad}x</span><strong style="font-weight: 600; color: var(--text-dark); font-family: var(--font-mono) !important;">${it.nombre}</strong>${coccion}${tamano}</span>
              <span style="color: var(--text-light); font-weight: 700; font-family: var(--font-mono) !important;">${fmtMoney(it.precio * it.cantidad)}</span>
            </li>`;
          }).join('')}
        </ul>
      </div>
    `;
  });

  // Spanish-compliant Humanized Delivery Section
  let deliveryHtml = '';
  if (p.envio && p.envio.envio) {
    const isInterno = p.envio.cliente_paga_envio === false;
    if (isInterno) {
      const hasDir = p.envio.direccion && p.envio.direccion.trim();
      deliveryHtml = `
        <div style="margin-bottom: 6px; font-family: var(--font-mono); font-size: 0.92rem; color: var(--text-dark);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--accent); font-weight: 700;">▸</span>
            <span>Envío interno</span>
          </div>
          ${hasDir ? `
          <div style="padding-left: 24px; font-size: 0.88rem; color: var(--text-muted); margin-top: 4px; line-height: 1.45; display: flex; align-items: center; gap: 6px;">
            <span style="color: var(--text-light); font-family: var(--font-mono); font-weight: normal;">▷</span>
            <span>${p.envio.direccion}</span>
          </div>` : ''}
        </div>
      `;
    } else {
      const costoEnvio = fmtMoney(p.envio.costo_envio);
      deliveryHtml = `
        <div style="margin-bottom: 6px; font-family: var(--font-mono); font-size: 0.92rem; color: var(--text-dark);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--accent); font-weight: 700;">▸</span>
            <span>Envío externo</span>
          </div>
          <div style="padding-left: 24px; font-size: 0.88rem; color: var(--text-muted); margin-top: 4px; line-height: 1.45;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
              <span style="color: var(--text-light); font-family: var(--font-mono); font-weight: normal;">▷</span>
              <span style="color: var(--text-muted); font-weight: 700;">${costoEnvio}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--text-light); font-family: var(--font-mono); font-weight: normal;">▷</span>
              <span>${p.envio.direccion || 'dirección no especificada'}</span>
            </div>
          </div>
        </div>
      `;
    }
  } else if (p.hora_retiro) {
    deliveryHtml = `
      <div style="margin-bottom: 6px; font-family: var(--font-mono); font-size: 0.92rem; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
        <span style="color: var(--accent); font-weight: 700;">▸</span>
        <span>Retiro en local a las ${p.hora_retiro}</span>
      </div>
    `;
  } else {
    deliveryHtml = `
      <div style="margin-bottom: 6px; font-family: var(--font-mono); font-size: 0.92rem; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
        <span style="color: var(--accent); font-weight: 700;">▸</span>
        <span>Retiro en local</span>
      </div>
    `;
  }

  // Spanish-compliant Humanized Payment Line
  let paymentText = 'No especificó pago';
  if (p.pago && p.pago.metodo && p.pago.metodo !== 'Mixto') {
    const met = p.pago.metodo.trim();
    if (met.toLowerCase() === 'mercado pago') {
      paymentText = 'Paga con Mercado Pago';
    } else {
      paymentText = `Paga con ${met.toLowerCase()}`;
    }
  }

  // Phone Line
  let phoneHtml = '';
  if (p.telefono) {
    phoneHtml = `
      <div style="margin-bottom: 6px; font-family: var(--font-mono); font-size: 0.92rem; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
        <span style="color: var(--accent); font-weight: 700;">▸</span>
        <span>
          <a href="tel:${p.telefono}" onclick="event.stopPropagation();" style="color: var(--text-muted); text-decoration: none; font-weight: 700;">📞 ${p.telefono}</a>
        </span>
      </div>
    `;
  }

  const overlay = document.createElement('div');
  overlay.id = 'modal-pedido-details';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
    animation: fadeIn 0.18s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: var(--bg-white, #fff);
      border: 2px solid var(--bg-cool-gray);
      border-left: 8px solid ${p.estado === 'En curso' ? 'var(--accent)' : p.estado === 'Listo' ? '#f39c12' : '#2ecc71'};
      border-radius: 8px;
      padding: 24px 28px;
      max-width: 480px; width: 90%;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      animation: slideUp 0.2s cubic-bezier(.4,1.2,.6,1) both;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span style="font-family: var(--font-head); font-size: 1.15rem; font-weight: 700; color: var(--text-dark); letter-spacing: 0.04em;">
          // PEDIDO #${p.id} [${p.hora_registro || '--:--'}]
        </span>
        <span class="pc-estado ${p.estado === 'En curso' ? 'estado-en-curso' : p.estado === 'Listo' ? 'estado-listo' : 'estado-entregado'}" style="
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid;
          min-width: 100px;
          text-align: center;
        ">
          ${p.estado === 'Entregado' ? 'ENTREGADO' : p.estado.toUpperCase()}
        </span>
      </div>

      <div style="text-align: left; margin-bottom: 18px;">
        <!-- Client Name: Bold & 4pt Larger than details -->
        <div style="font-family: var(--font-head); font-size: 1.35rem; font-weight: 700; color: var(--text-dark); margin-bottom: 10px; letter-spacing: 0.02em;">
          ${p.cliente || '?'}
        </div>
        
        <!-- Humanized Metadata Rows with Terminal arrows -->
        ${deliveryHtml}
        
        <div style="margin-bottom: 6px; font-family: var(--font-mono); font-size: 0.92rem; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent); font-weight: 700;">▸</span>
          <span>${paymentText}</span>
        </div>
        
        ${phoneHtml}
      </div>

      <div class="scan-sep" style="margin: 12px 0;"></div>

      ${itemsHtml}

      <div class="scan-sep" style="margin: 12px 0;"></div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-family: var(--font-mono);">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted);">TOTAL</span>
        <span style="font-size: 1.25rem; font-weight: 700; color: var(--accent);">${fmtMoney(p.total)}</span>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;">
        <button class="btn btn-sm" id="details-close-btn" style="padding: 6px 18px;">CERRAR</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closePopup = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 180); };
  overlay.querySelector('#details-close-btn').addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
}

$('#pedidos-search').addEventListener('input', debounce(loadPedidos, 400));
$('#pedidos-fecha').addEventListener('change', loadPedidos);

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function addMinutesToRetiro(mins) {
  let hhVal = $('#ped-hora-hh').value.trim();
  let mmVal = $('#ped-hora-mm').value.trim();
  let baseDate = new Date();
  
  if (hhVal !== '' && mmVal !== '') {
    let h = parseInt(hhVal, 10);
    let m = parseInt(mmVal, 10);
    if (!isNaN(h) && !isNaN(m)) {
      baseDate.setHours(h);
      baseDate.setMinutes(m);
    }
  }
  
  baseDate.setMinutes(baseDate.getMinutes() + mins);
  const hh = String(baseDate.getHours()).padStart(2, '0');
  const mm = String(baseDate.getMinutes()).padStart(2, '0');
  $('#ped-hora-hh').value = hh;
  $('#ped-hora-mm').value = mm;
  if (typeof SFX !== 'undefined' && SFX.play) {
    SFX.play('click');
  }
}

let editingOrderId = null;
let originalOrderItems = [];
let promoItems = [];
let currentPromoProduct = null;
let currentPromoQty = 1;
let currentPromoSelections = {};
let currentPromoStepRows = {};
let currentPromoStepChoices = {};

async function openPedidoModal(orderId = null) {
  orderItems = [];
  selectedProduct = null;
  currentSearchQty = 1;

  if (orderId) {
    editingOrderId = orderId;
    $('#ped-delete-btn').style.display = 'inline-flex';
    const orderData = pedidosData.find(p => p.id === orderId);
    if (!orderData) return;
    $('#ped-cliente').value = orderData.cliente || '';
    $('#ped-telefono').value = orderData.telefono || '';
    if (orderData && orderData.hora_retiro && orderData.hora_retiro.includes(':')) {
      const [hh, mm] = orderData.hora_retiro.split(':');
      $('#ped-hora-hh').value = hh;
      $('#ped-hora-mm').value = mm;
    } else {
      $('#ped-hora-hh').value = '';
      $('#ped-hora-mm').value = '';
    }
    $('#ped-search').value = '';
    $('#ped-descuento').value = orderData.descuento_pct || '0';
    $('#ped-pago-metodo').value = orderData.pago ? orderData.pago.metodo : 'Mixto';

    if (orderData.envio && orderData.envio.envio) {
      $('#ped-envio-toggle').checked = true;
      $('#ped-envio-dir').value = orderData.envio.direccion || '';
      $('#ped-envio-costo').value = orderData.envio.costo_envio || '0';
      const isExterno = orderData.envio.cliente_paga_envio !== false;
      $('#ped-envio-tipo-interno').checked = !isExterno;
      $('#ped-envio-tipo-externo').checked = isExterno;
    } else {
      $('#ped-envio-toggle').checked = false;
      $('#ped-envio-dir').value = '';
      $('#ped-envio-costo').value = '0';
      $('#ped-envio-tipo-interno').checked = true;
      $('#ped-envio-tipo-externo').checked = false;
    }
    onEnvioTipoChange();
    toggleEnvio();
    orderItems = JSON.parse(JSON.stringify(orderData.items || []));
    originalOrderItems = JSON.parse(JSON.stringify(orderData.items || []));
    $('#ped-variant-area').style.display = 'none';
    $('#pedido-modal-title').textContent = '// EDITAR PEDIDO #' + orderId;
    $('#ped-submit-btn').textContent = 'GUARDAR CAMBIOS';
  } else {
    editingOrderId = null;
    originalOrderItems = [];
    $('#ped-delete-btn').style.display = 'none';
    $('#ped-cliente').value = '';
    $('#ped-telefono').value = '';
    $('#ped-hora-hh').value = '';
    $('#ped-hora-mm').value = '';
    $('#ped-search').value = '';
    $('#ped-descuento').value = '0';
    $('#ped-pago-metodo').value = 'Mixto';
    $('#ped-envio-toggle').checked = false;
    $('#ped-envio-section').classList.remove('envio-active');
    $('#ped-envio-dir').value = '';
    $('#ped-envio-costo').value = '0';
    $('#ped-envio-tipo-interno').checked = true;
    $('#ped-envio-tipo-externo').checked = false;
    onEnvioTipoChange();
    $('#ped-variant-area').style.display = 'none';
    $('#pedido-modal-title').textContent = '// NUEVO PEDIDO';
    $('#ped-submit-btn').textContent = 'CONFIRMAR PEDIDO';
  }

  renderOrderItems();
  updateOrderTotals();
  toggleEnvio();
  updatePaymentUI();
  $('#modal-pedido').classList.add('open');
  setTimeout(() => $('#ped-cliente').focus(), 100);

  // Silently pre-load today's stock data for insufficient stock checks
  try {
    stockData = await api('/stock');
    if (!catalogoForStock.length) catalogoForStock = await api('/productos');
    if (!stockTipos.length) stockTipos = await api('/tipos');
  } catch(e) { /* non-critical, stock check will just be skipped */ }
}

function closePedidoModal() {
  $('#modal-pedido').classList.remove('open');
  $('#ped-search-results').classList.remove('visible');
  editingOrderId = null;
  originalOrderItems = [];
}

function deletePedidoFromModal() {
  if (!editingOrderId) return;
  showConfirm('Eliminar Pedido', `¿Eliminar pedido #${editingOrderId}?`, async () => {
    try {
      await api(`/pedidos/${editingOrderId}`, { method: 'DELETE' });
      toast('PEDIDO ELIMINADO', 'success');
      closePedidoModal();
      loadPedidos();
    } catch (e) { toast('ERROR: ' + e.message, 'error'); }
  });
}

let searchDebounce;
let currentSearchQty = 1;

$('#ped-search').addEventListener('input', function() {
  clearTimeout(searchDebounce);
  const rawVal = this.value;
  let q = rawVal.trim();
  let parsedQty = 1;

  // Regex to parse quantities prefix (e.g., "2 car", "3x pizza", "4 * empanada")
  const qtyMatch = q.match(/^\s*(\d+)\s*[xX\*]?\s+(.*)$/);
  if (qtyMatch) {
    parsedQty = parseInt(qtyMatch[1]) || 1;
    q = qtyMatch[2].trim();
  }
  currentSearchQty = parsedQty;

  if (q.length < 1) {
    $('#ped-search-results').classList.remove('visible');
    $('#ped-search-results').innerHTML = '';
    return;
  }
  searchDebounce = setTimeout(async () => {
    try {
      const results = await api('/productos/search?q=' + encodeURIComponent(q));
      const container = $('#ped-search-results');
      if (!results.length) {
        container.innerHTML = '<div style="padding:12px; color:var(--text-dim); font-family:var(--font-mono); font-size:0.78rem;">// SIN RESULTADOS</div>';
      } else {
        container.innerHTML = results.map((r, rIdx) => {
          const p = r.product;
          const t = r.tipo;
          const tipoName = t ? t.nombre : '?';
          const price = p.precio_u ? fmtMoney(p.precio_u) : 'VAR';
          const isSelected = rIdx === 0 ? 'selected' : '';
          return `
            <div class="search-result-item ${isSelected}" tabindex="0" onclick='selectProduct(${JSON.stringify(p).replace(/'/g, "&#39;")}, ${JSON.stringify(t).replace(/'/g, "&#39;")})'>
              <div>
                <span class="sr-name">${p.nombre}</span>
                <span class="sr-abrev">[${p.abrev}]</span>
              </div>
              <div style="text-align:right;">
                <span class="sr-price">${price}</span>
                <span class="sr-tipo">${tipoName}</span>
              </div>
            </div>
          `;
        }).join('');
      }
      container.classList.add('visible');
    } catch (e) { console.error(e); }
  }, 250);
});

// Keyboard navigation for search dropdown (Enter, ArrowDown, and Tab)
$('#ped-search').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!this.value.trim()) return;
    const selectedItem = $('#ped-search-results .search-result-item.selected');
    if (selectedItem) {
      selectedItem.click();
    } else {
      const firstItem = $('#ped-search-results .search-result-item');
      if (firstItem) firstItem.click();
    }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const firstItem = $('#ped-search-results .search-result-item');
    if (firstItem) firstItem.focus();
    return;
  }
  if (e.key === 'Tab') {
    const firstItem = $('#ped-search-results .search-result-item');
    if (firstItem && $('#ped-search-results').classList.contains('visible')) {
      e.preventDefault();
      firstItem.focus();
    }
  }
});

// Manage active/selected class on hover or focus of search result items
$('#ped-search-results').addEventListener('focusin', function(e) {
  const item = e.target.closest('.search-result-item');
  if (item) {
    $$('#ped-search-results .search-result-item').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
  }
});
$('#ped-search-results').addEventListener('mouseover', function(e) {
  const item = e.target.closest('.search-result-item');
  if (item) {
    $$('#ped-search-results .search-result-item').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
  }
});

// Make search results keyboard navigable
$('#ped-search-results').addEventListener('keydown', function(e) {
  const items = Array.from($$('#ped-search-results .search-result-item'));
  const focused = document.activeElement;
  const idx = items.indexOf(focused);

  if (e.key === 'Enter') {
    e.preventDefault();
    if (focused && items.includes(focused)) focused.click();
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    $('#ped-search-results').classList.remove('visible');
    $('#ped-search').focus();
    return;
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    if (idx === -1) { items[0] && items[0].focus(); return; }
    const next = e.shiftKey ? idx - 1 : idx + 1;
    if (next < 0) { $('#ped-search').focus(); return; }
    if (next >= items.length) { items[0].focus(); return; }
    items[next].focus();
    return;
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(idx + 1, items.length - 1)]?.focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); if (idx <= 0) { $('#ped-search').focus(); } else items[idx - 1].focus(); }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) $('#ped-search-results').classList.remove('visible');
});

async function selectProduct(product, tipo) {
  selectedProduct = product;
  selectedVariantTipo = '';
  selectedVariantCant = '';
  $('#ped-search-results').classList.remove('visible');
  $('#ped-search').value = '';

  const finalQty = currentSearchQty || 1;
  currentSearchQty = 1; // Reset after usage

  if (product.tipo_id === 999) {
    await showPromoPicker(product, finalQty);
    return;
  }

  try {
    const vars = await api(`/productos/${product.id}/variants`);
    if (vars.has_tipo || vars.has_cant) {
      showVariantSelector(product, tipo, vars, finalQty);
    } else {
      const newItem = {
        producto_id: product.id, nombre: product.nombre, tipo_id: product.tipo_id,
        tipo: tipo ? tipo.nombre : '', var_tipo: '', var_cantidad: '',
        precio: product.precio_u, cantidad: finalQty,
        descuento_efectivo: product.excluir_descuento_efectivo ? false : (tipo ? tipo.descuento_efectivo : false)
      };

      const stockEntry = getStockForProduct(product.id);
      if (stockEntry) {
        const alreadyOrdered = getOrderQtyForProduct(product.id);
        const totalNeeded = alreadyOrdered + finalQty;
        const limit = getEffectiveStockLimit(product.id, stockEntry);
        if (totalNeeded > limit) {
          const faltante = totalNeeded - limit;
          showStockWarning(faltante, product.nombre, () => {
            orderItems.push(newItem);
            renderOrderItems(); updateOrderTotals();
            requestAnimationFrame(() => $('#ped-search').focus());
          }, () => {
            requestAnimationFrame(() => $('#ped-search').focus());
          });
          return;
        }
      }

      orderItems.push(newItem);
      renderOrderItems(); updateOrderTotals();
      requestAnimationFrame(() => $('#ped-search').focus());
    }
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

function getMatchingVariantsForPromoItem(p, it, tipo) {
  const choices = [];
  const pId = p.id;
  const pName = p.nombre;
  
  const admitsTipo = tipo.admite_variantes_tipo;
  const admitsCant = tipo.admite_variantes_cantidad;
  
  if (!admitsTipo && !admitsCant) {
    choices.push({
      display: pName,
      key: `${pId}`,
      product: p,
      var_tipo: '',
      var_cantidad: ''
    });
  } else if (admitsTipo && admitsCant) {
    const varsT = tipo.variantes_tipo || [];
    const varsC = tipo.variantes_cantidad || [];
    for (const vt of varsT) {
      if (!it.libre_eleccion_tipo && it.var_tipo && vt !== it.var_tipo) continue;
      for (const vc of varsC) {
        if (it.var_cantidad && vc !== it.var_cantidad) continue;
        const key = `${vt}|${vc}`;
        const inactivas = p.variantes_inactivas || [];
        if (!inactivas.includes(key)) {
          choices.push({
            display: `${pName} (${vt} · ${vc})`,
            key: `${pId}|${vt}|${vc}`,
            product: p,
            var_tipo: vt,
            var_cantidad: vc
          });
        }
      }
    }
  } else if (admitsTipo) {
    const varsT = tipo.variantes_tipo || [];
    for (const vt of varsT) {
      if (!it.libre_eleccion_tipo && it.var_tipo && vt !== it.var_tipo) continue;
      const key = vt;
      const inactivas = p.variantes_inactivas || [];
      if (!inactivas.includes(key)) {
        choices.push({
          display: `${pName} (${vt})`,
          key: `${pId}|${vt}`,
          product: p,
          var_tipo: vt,
          var_cantidad: ''
        });
      }
    }
  } else if (admitsCant) {
    const varsC = tipo.variantes_cantidad || [];
    for (const vc of varsC) {
      if (it.var_cantidad && vc !== it.var_cantidad) continue;
      const key = vc;
      const inactivas = p.variantes_inactivas || [];
      if (!inactivas.includes(key)) {
        choices.push({
          display: `${pName} (${vc})`,
          key: `${pId}||${vc}`,
          product: p,
          var_tipo: '',
          var_cantidad: vc
        });
      }
    }
  }
  
  return choices;
}

async function showPromoPicker(product, qty) {
  currentPromoProduct = product;
  currentPromoQty = qty;
  currentPromoSelections = {};
  currentPromoStepRows = {};
  currentPromoStepChoices = {};

  // Pre-fill promo manual price input (hidden in DOM but still set for safety)
  $('#ped-promo-price').value = product.precio_u || 0;

  // Make sure we have fresh, all active catalog products and type definitions
  try {
    const [allProducts, allTipos] = await Promise.all([
      api('/productos'),
      api('/tipos')
    ]);
    catalogoData = allProducts;
    tiposData = allTipos;
  } catch (e) {
    toast('ERROR AL CARGAR DATOS DEL CATÁLOGO: ' + e.message, 'error');
    return;
  }

  const stepsContainer = $('#ped-promo-picker-steps');
  stepsContainer.innerHTML = '';

  const promo_items = product.promo_items || [];
  promo_items.forEach((it, idx) => {
    const tipo = tiposData.find(t => t.id === it.tipo_id);
    const tipoName = tipo ? tipo.nombre : '?';

    // Get all active catalog products of this tipo
    const catProds = catalogoData.filter(p => p.tipo_id === it.tipo_id && !p.sin_stock);
    
    // Get all matching active choices across all these products
    let allChoices = [];
    catProds.forEach(p => {
      allChoices = allChoices.concat(getMatchingVariantsForPromoItem(p, it, tipo));
    });

    currentPromoStepChoices[idx] = allChoices;

    const firstChoice = allChoices[0];
    currentPromoStepRows[idx] = [{
      qty: it.cantidad,
      productId: firstChoice ? firstChoice.product.id : 0,
      varTipo: firstChoice ? firstChoice.var_tipo : '',
      varCantidad: firstChoice ? firstChoice.var_cantidad : ''
    }];

    stepsContainer.innerHTML += `
      <div class="panel" style="margin-bottom:8px; border:1px solid var(--bg-cool-gray);">
        <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center; font-size:0.82rem; padding:6px 12px; background: var(--bg-off-white); border-bottom: 1px solid var(--bg-cool-gray);">
          <span style="color:var(--text-dark); font-weight:700;">${tipoName.toUpperCase()} ${it.var_cantidad ? `(${it.var_cantidad})` : ''}</span>
          <span id="picker-status-${idx}" style="font-family:var(--font-mono); font-weight:bold; color:var(--accent-red);">FALTAN ${it.cantidad}</span>
        </div>
        <div class="panel-body" style="padding:8px;">
          <div id="promo-step-rows-${idx}" style="display:flex; flex-direction:column; gap:6px; margin-bottom:8px;">
            <!-- Row dropdowns will be rendered here -->
          </div>
          ${allChoices.length > 0 
            ? `<button id="add-row-btn-${idx}" class="btn btn-sm btn-ghost" type="button" onclick="addPromoRow(${idx})" style="padding: 4px 8px; font-size:0.75rem;">+ AGREGAR SABOR / VARIANTE</button>`
            : '<div style="padding:8px; color:var(--text-dim);">// No hay productos activos para este tipo</div>'
          }
        </div>
      </div>
    `;

    renderPromoStepRows(idx);
  });

  $('#ped-variant-area').style.display = 'none';
  $('#ped-promo-picker-area').style.display = 'block';
  updatePickerStatus();
}

function renderPromoStepRows(idx) {
  const container = document.getElementById(`promo-step-rows-${idx}`);
  if (!container) return;

  const it = currentPromoProduct.promo_items[idx];
  const tipo = tiposData.find(t => t.id === it.tipo_id);
  if (!tipo) return;

  const allChoices = currentPromoStepChoices[idx] || [];
  const rows = currentPromoStepRows[idx] || [];

  if (rows.length === 0) {
    container.innerHTML = '<div style="padding:4px; color:var(--text-dim); font-size:0.75rem;">// Sin elecciones</div>';
    return;
  }

  container.innerHTML = rows.map((row, rowIdx) => {
    // 1. Dynamic Quantity Dropdown: clamped to maxAllowed to prevent exceeding promo limit
    const sumOtherRows = rows.reduce((sum, r, rIdx) => {
      return sum + (rIdx === rowIdx ? 0 : r.qty);
    }, 0);
    const maxAllowed = Math.max(1, it.cantidad - sumOtherRows);
    
    // Clamp row.qty if it somehow exceeds maxAllowed (should be rare)
    if (row.qty > maxAllowed) {
      row.qty = maxAllowed;
    }

    let qtySelectHtml = `<select onchange="updatePromoRowQty(${idx}, ${rowIdx}, parseInt(this.value))" style="width:65px; background:var(--bg-white); border:1px solid var(--bg-cool-gray); border-radius:var(--radius); padding:6px; font-family:var(--font-mono); font-weight:bold; text-align:center;">`;
    for (let q = 1; q <= maxAllowed; q++) {
      qtySelectHtml += `<option value="${q}" ${q === row.qty ? 'selected' : ''}>${q}</option>`;
    }
    qtySelectHtml += `</select>`;

    // 2. Sabor / Producto Dropdown
    const uniqueProducts = [];
    const seenProdIds = new Set();
    allChoices.forEach(choice => {
      if (!seenProdIds.has(choice.product.id)) {
        seenProdIds.add(choice.product.id);
        uniqueProducts.push(choice.product);
      }
    });

    let productSelectHtml = `<select onchange="updatePromoRowProduct(${idx}, ${rowIdx}, parseInt(this.value))" style="flex:1.5; background:var(--bg-white); border:1px solid var(--bg-cool-gray); border-radius:var(--radius); padding:6px; font-weight:600; font-family:var(--font-body); font-size:0.85rem;">`;
    uniqueProducts.forEach(p => {
      productSelectHtml += `<option value="${p.id}" ${p.id === row.productId ? 'selected' : ''}>${p.nombre}</option>`;
    });
    productSelectHtml += `</select>`;

    // 3. Style / Variante de Tipo Dropdown (conditional)
    let styleSelectHtml = '';
    if (tipo.admite_variantes_tipo) {
      const validStyles = [];
      const seenStyles = new Set();
      allChoices.forEach(choice => {
        if (choice.product.id === row.productId) {
          if (choice.var_tipo && !seenStyles.has(choice.var_tipo)) {
            seenStyles.add(choice.var_tipo);
            validStyles.push(choice.var_tipo);
          }
        }
      });

      styleSelectHtml = `<select onchange="updatePromoRowStyle(${idx}, ${rowIdx}, this.value)" style="flex:1; background:var(--bg-white); border:1px solid var(--bg-cool-gray); border-radius:var(--radius); padding:6px; font-family:var(--font-body); font-size:0.85rem;">`;
      if (validStyles.length === 0) {
        styleSelectHtml += `<option value="" selected>-</option>`;
      } else {
        validStyles.forEach(style => {
          styleSelectHtml += `<option value="${style}" ${style === row.varTipo ? 'selected' : ''}>${style}</option>`;
        });
      }
      styleSelectHtml += `</select>`;
    }

    // 4. Size / Variante de Cantidad Dropdown (conditional)
    let sizeSelectHtml = '';
    if (tipo.admite_variantes_cantidad) {
      const validSizes = [];
      const seenSizes = new Set();
      allChoices.forEach(choice => {
        if (choice.product.id === row.productId && (choice.var_tipo || '') === (row.varTipo || '')) {
          if (choice.var_cantidad && !seenSizes.has(choice.var_cantidad)) {
            seenSizes.add(choice.var_cantidad);
            validSizes.push(choice.var_cantidad);
          }
        }
      });

      sizeSelectHtml = `<select onchange="updatePromoRowSize(${idx}, ${rowIdx}, this.value)" style="flex:1; background:var(--bg-white); border:1px solid var(--bg-cool-gray); border-radius:var(--radius); padding:6px; font-family:var(--font-body); font-size:0.85rem;">`;
      if (validSizes.length === 0) {
        sizeSelectHtml += `<option value="" selected>-</option>`;
      } else {
        validSizes.forEach(size => {
          sizeSelectHtml += `<option value="${size}" ${size === row.varCantidad ? 'selected' : ''}>${size}</option>`;
        });
      }
      sizeSelectHtml += `</select>`;
    }

    // 5. Action Delete Button
    const deleteBtn = rows.length > 1
      ? `<button class="btn btn-sm btn-ghost btn-danger" type="button" onclick="deletePromoRow(${idx}, ${rowIdx})" style="padding:4px 8px; font-weight:bold; margin-left:4px;">✕</button>`
      : `<div style="width:28px;"></div>`;

    return `
      <div style="display:flex; align-items:center; gap:6px;">
        ${qtySelectHtml}
        ${productSelectHtml}
        ${styleSelectHtml}
        ${sizeSelectHtml}
        ${deleteBtn}
      </div>
    `;
  }).join('');
}

function addPromoRow(idx) {
  const it = currentPromoProduct.promo_items[idx];
  const allChoices = currentPromoStepChoices[idx] || [];
  if (!allChoices.length) return;

  // Calculate current sum of quantities
  const currentSum = currentPromoStepRows[idx].reduce((sum, r) => sum + r.qty, 0);
  if (currentSum >= it.cantidad) {
    toast(`CANTIDAD MÁXIMA ALCANZADA (${it.cantidad})`, 'warning');
    return;
  }

  const remaining = Math.max(1, it.cantidad - currentSum);
  const firstChoice = allChoices[0];

  // Add a new row using the new schema
  currentPromoStepRows[idx].push({
    qty: remaining,
    productId: firstChoice ? firstChoice.product.id : 0,
    varTipo: firstChoice ? firstChoice.var_tipo : '',
    varCantidad: firstChoice ? firstChoice.var_cantidad : ''
  });

  renderPromoStepRows(idx);
  updatePickerStatus();
  if (typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
}

function deletePromoRow(idx, rowIdx) {
  if (currentPromoStepRows[idx].length <= 1) return;
  currentPromoStepRows[idx].splice(rowIdx, 1);
  renderPromoStepRows(idx);
  updatePickerStatus();
  if (typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
}

function updatePromoRowQty(idx, rowIdx, newQty) {
  currentPromoStepRows[idx][rowIdx].qty = newQty;
  renderPromoStepRows(idx); // Cascade update options in sibling quantity selects
  updatePickerStatus();
}

function updatePromoRowProduct(idx, rowIdx, newProductId) {
  const row = currentPromoStepRows[idx][rowIdx];
  row.productId = newProductId;

  // Set default variants for the new product
  const allChoices = currentPromoStepChoices[idx] || [];
  const prodChoices = allChoices.filter(c => c.product.id === newProductId);
  if (prodChoices.length > 0) {
    row.varTipo = prodChoices[0].var_tipo || '';
    row.varCantidad = prodChoices[0].var_cantidad || '';
  } else {
    row.varTipo = '';
    row.varCantidad = '';
  }

  renderPromoStepRows(idx);
  if (typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
}

function updatePromoRowStyle(idx, rowIdx, newStyle) {
  const row = currentPromoStepRows[idx][rowIdx];
  row.varTipo = newStyle;

  // Set default size for the new style
  const allChoices = currentPromoStepChoices[idx] || [];
  const styleChoices = allChoices.filter(c => c.product.id === row.productId && (c.var_tipo || '') === (newStyle || ''));
  if (styleChoices.length > 0) {
    row.varCantidad = styleChoices[0].var_cantidad || '';
  } else {
    row.varCantidad = '';
  }

  renderPromoStepRows(idx);
  if (typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
}

function updatePromoRowSize(idx, rowIdx, newSize) {
  const row = currentPromoStepRows[idx][rowIdx];
  row.varCantidad = newSize;

  renderPromoStepRows(idx);
  if (typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
}

function updatePickerStatus() {
  const promo_items = currentPromoProduct.promo_items || [];
  let allSatisfied = true;

  promo_items.forEach((it, idx) => {
    const rows = currentPromoStepRows[idx] || [];
    const selectedSum = rows.reduce((sum, r) => sum + r.qty, 0);
    const remaining = it.cantidad - selectedSum;
    const statusEl = document.getElementById(`picker-status-${idx}`);
    
    if (statusEl) {
      if (remaining > 0) {
        statusEl.textContent = `FALTAN ${remaining}`;
        statusEl.style.color = 'var(--accent-red)';
        allSatisfied = false;
      } else if (remaining < 0) {
        statusEl.textContent = `EXCEDE EN ${Math.abs(remaining)}`;
        statusEl.style.color = 'var(--accent-red)';
        allSatisfied = false;
      } else {
        statusEl.textContent = 'LISTO';
        statusEl.style.color = 'var(--success)';
      }
    } else {
      if (remaining !== 0) allSatisfied = false;
    }

    // Disable "+ AGREGAR SABOR / VARIANTE" button if the total qty has already been fully selected
    const btnEl = document.getElementById(`add-row-btn-${idx}`);
    if (btnEl) {
      if (selectedSum >= it.cantidad) {
        btnEl.disabled = true;
        btnEl.style.opacity = '0.5';
        btnEl.style.cursor = 'not-allowed';
      } else {
        btnEl.disabled = false;
        btnEl.style.opacity = '1';
        btnEl.style.cursor = 'pointer';
      }
    }
  });

  return allSatisfied;
}

function getConstituentStandardPrice(tipoId, varCantidad, varTipo) {
  const product = catalogoData.find(p => p.tipo_id === tipoId && !p.sin_stock);
  if (!product) return 0;

  const key = [varTipo, varCantidad].filter(Boolean).join('|');
  const flatKey = varTipo || varCantidad || '';
  
  if (product.precios_variantes) {
    if (key in product.precios_variantes) return product.precios_variantes[key];
    if (flatKey in product.precios_variantes) return product.precios_variantes[flatKey];
  }
  return product.precio_u || 0;
}

function confirmPromoPicker() {
  if (!updatePickerStatus()) {
    toast('POR FAVOR COMPLETAR TODAS LAS OPCIONES EXACTAMENTE', 'error');
    return;
  }

  const customPrice = parseFloat($('#ped-promo-price').value) || 0;
  if (customPrice < 0) {
    toast('PRECIO DE LA PROMO INVÁLIDO', 'error');
    return;
  }

  // Reconstruct currentPromoSelections from currentPromoStepRows using the new schema
  currentPromoSelections = {};
  const promo_items = currentPromoProduct.promo_items || [];
  promo_items.forEach((it, idx) => {
    currentPromoSelections[idx] = {};
    const rows = currentPromoStepRows[idx] || [];
    rows.forEach(r => {
      if (r.productId && r.qty > 0) {
        const choiceKey = `${r.productId}|${r.varTipo || ''}|${r.varCantidad || ''}`;
        currentPromoSelections[idx][choiceKey] = (currentPromoSelections[idx][choiceKey] || 0) + r.qty;
      }
    });
  });

  let sumAllStandard = 0.0;
  let sumDiscountableStandard = 0.0;
  
  promo_items.forEach((it, idx) => {
    const isDiscountable = !!it.descuento_efectivo;
    const selections = currentPromoSelections[idx] || {};
    for (const [choiceKey, count] of Object.entries(selections)) {
      if (count > 0) {
        const parts = choiceKey.split('|');
        const pId = parseInt(parts[0]);
        const p = catalogoData.find(x => x.id === pId);
        if (p) {
          const vt = parts[1] || '';
          const vc = parts[2] || '';
          const itemPrice = getConstituentStandardPrice(it.tipo_id, vc, vt);
          const totalItemPrice = itemPrice * count;
          sumAllStandard += totalItemPrice;
          if (isDiscountable) {
            sumDiscountableStandard += totalItemPrice;
          }
        }
      }
    }
  });

  const finalDiscountFactor = sumAllStandard > 0 ? Math.min(1.0, Math.max(0.0, sumDiscountableStandard / sumAllStandard)) : 0.0;

  const constituentParts = [];
  promo_items.forEach((it, idx) => {
    const tipo = tiposData.find(t => t.id === it.tipo_id);
    const tipoName = tipo ? tipo.nombre : '?';
    
    const stepSelections = [];
    const selections = currentPromoSelections[idx] || {};
    for (const [choiceKey, count] of Object.entries(selections)) {
      if (count > 0) {
        const parts = choiceKey.split('|');
        const pId = parseInt(parts[0]);
        const p = catalogoData.find(x => x.id === pId);
        const pName = p ? p.nombre : '?';
        const vt = parts[1] || '';
        const vc = parts[2] || '';
        const variantDetail = [vt, vc].filter(Boolean).join(' · ');
        stepSelections.push(`${count} ${pName}${variantDetail ? ` (${variantDetail})` : ''}`);
      }
    }
    constituentParts.push(`${it.cantidad}x ${tipoName} [${stepSelections.join(', ')}]`);
  });
  
  const finalVarTipo = constituentParts.join(' + ');

  orderItems.push({
    producto_id: currentPromoProduct.id,
    nombre: currentPromoProduct.nombre,
    tipo_id: currentPromoProduct.tipo_id,
    tipo: 'Promociones',
    var_tipo: finalVarTipo,
    var_cantidad: '',
    precio: customPrice,
    cantidad: currentPromoQty,
    descuento_efectivo: finalDiscountFactor
  });

  $('#ped-promo-picker-area').style.display = 'none';
  currentPromoProduct = null;
  currentPromoQty = 1;
  currentPromoSelections = {};
  currentPromoStepRows = {};
  currentPromoStepChoices = {};

  if (typeof SFX !== 'undefined' && SFX.play) SFX.play('success');

  renderOrderItems();
  updateOrderTotals();
  requestAnimationFrame(() => $('#ped-search').focus());
}

function cancelPromoPicker() {
  $('#ped-promo-picker-area').style.display = 'none';
  currentPromoProduct = null;
  currentPromoQty = 1;
  currentPromoSelections = {};
  currentPromoStepRows = {};
  currentPromoStepChoices = {};
  requestAnimationFrame(() => $('#ped-search').focus());
}

// ── Step-based Variant Selector (closed keyboard environments) ───────────────
// variantStep tracks the current selection phase: 'tipo', 'cant', or null
let variantStep = null;
let variantFocusIndex = 0;

function showVariantSelector(product, tipo, vars, qty = 1) {
  const area = $('#ped-variant-area');
  area.style.display = 'block';
  $('#ped-variant-product-name').textContent = product.nombre;
  $('#ped-variant-qty').value = qty;
  $('#ped-variant-price').value = product.precio_u || 0;

  const hasTipo = vars.has_tipo && vars.variantes_tipo.length;
  const hasCant = vars.has_cant && vars.variantes_cantidad.length;

  const tipoRow = $('#ped-variant-tipo-row');
  if (hasTipo) {
    tipoRow.style.display = 'block';
    renderVariantPills('tipo', vars.variantes_tipo);
  } else { tipoRow.style.display = 'none'; }

  const cantRow = $('#ped-variant-cant-row');
  if (hasCant) {
    cantRow.style.display = 'block';
    renderVariantPills('cant', vars.variantes_cantidad);
  } else { cantRow.style.display = 'none'; }

  selectedVariantTipo = '';
  selectedVariantCant = '';
  area._product = product;
  area._tipo = tipo;
  area._vars = vars;

  // Determine starting step
  if (hasTipo) {
    variantStep = 'tipo';
  } else if (hasCant) {
    variantStep = 'cant';
  } else {
    // No variants at all — shouldn't reach here, but just add directly
    variantStep = null;
    addItemToOrder();
    return;
  }

  variantFocusIndex = 0;
  updateVariantStepUI();

  // Auto-focus the first pill in the current step
  requestAnimationFrame(() => {
    focusCurrentStepPill(0);
  });
}

function renderVariantPills(group, values) {
  const containerId = group === 'tipo' ? 'ped-variant-tipo-pills' : 'ped-variant-cant-pills';
  $(`#${containerId}`).innerHTML = values.map(v => {
    const displayName = group === 'cant' ? cleanVariantName(v) : v;
    return `<div class="variant-pill" tabindex="-1" role="button"
       onclick="onVariantPillClick('${group}', this, '${v}')">${displayName}</div>`;
  }).join('');
}

function updateVariantStepUI() {
  // Dim/undim groups based on current step
  const tipoRow = $('#ped-variant-tipo-row');
  const cantRow = $('#ped-variant-cant-row');

  if (tipoRow) {
    tipoRow.classList.toggle('variant-step-active', variantStep === 'tipo');
    tipoRow.classList.toggle('variant-step-done', variantStep === 'cant' || variantStep === null);
    tipoRow.classList.toggle('variant-step-pending', false);
  }
  if (cantRow) {
    cantRow.classList.toggle('variant-step-active', variantStep === 'cant');
    cantRow.classList.toggle('variant-step-done', variantStep === null);
    cantRow.classList.toggle('variant-step-pending', variantStep === 'tipo');
  }

  // Set tabindex: only pills in the active step are tabbable
  $$('#ped-variant-tipo-pills .variant-pill').forEach(p => {
    p.setAttribute('tabindex', variantStep === 'tipo' ? '0' : '-1');
  });
  $$('#ped-variant-cant-pills .variant-pill').forEach(p => {
    p.setAttribute('tabindex', variantStep === 'cant' ? '0' : '-1');
  });
}

function getCurrentStepPills() {
  if (variantStep === 'tipo') return Array.from($$('#ped-variant-tipo-pills .variant-pill'));
  if (variantStep === 'cant') return Array.from($$('#ped-variant-cant-pills .variant-pill'));
  return [];
}

function focusCurrentStepPill(idx) {
  const pills = getCurrentStepPills();
  if (!pills.length) return;
  const safeIdx = Math.max(0, Math.min(idx, pills.length - 1));
  variantFocusIndex = safeIdx;
  pills[safeIdx].focus();
}

function onVariantPillClick(group, el, value) {
  // Clicking a pill in the active step selects it and advances
  if (group === 'tipo' && variantStep === 'tipo') {
    selectVariantTipoAndAdvance(el, value);
  } else if (group === 'cant' && variantStep === 'cant') {
    selectVariantCantAndFinish(el, value);
  } else if (group === 'tipo' && variantStep !== 'tipo') {
    // Allow re-clicking tipo to go back
    variantStep = 'tipo';
    selectedVariantTipo = '';
    selectedVariantCant = '';
    $$('#ped-variant-tipo-pills .variant-pill').forEach(p => p.classList.remove('selected'));
    updateVariantStepUI();
    updateVariantPrice();
    requestAnimationFrame(() => focusCurrentStepPill(0));
  }
}

// Global keydown handler for variant pills — attached to the variant area container
function setupVariantAreaKeyboard() {
  const area = $('#ped-variant-area');
  if (!area) return;

  area.addEventListener('keydown', function(e) {
    if (!variantStep) return;
    const pills = getCurrentStepPills();
    if (!pills.length) return;

    const focused = document.activeElement;
    const idx = pills.indexOf(focused);

    // If focus is not on a pill in the current step, ignore
    if (idx === -1) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      // Closed loop: Tab cycles within the current group only
      if (e.shiftKey) {
        const prev = idx - 1 < 0 ? pills.length - 1 : idx - 1;
        focusCurrentStepPill(prev);
      } else {
        const next = idx + 1 >= pills.length ? 0 : idx + 1;
        focusCurrentStepPill(next);
      }
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = idx + 1 >= pills.length ? 0 : idx + 1;
      focusCurrentStepPill(next);
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = idx - 1 < 0 ? pills.length - 1 : idx - 1;
      focusCurrentStepPill(prev);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const pill = pills[idx];
      const value = pill.textContent;
      if (variantStep === 'tipo') {
        selectVariantTipoAndAdvance(pill, value);
      } else if (variantStep === 'cant') {
        selectVariantCantAndFinish(pill, value);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      cancelVariant();
      $('#ped-search').focus();
      return;
    }
  });
}

async function selectVariantTipoAndAdvance(el, value) {
  selectedVariantTipo = value;
  $$('#ped-variant-tipo-pills .variant-pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');

  const area = $('#ped-variant-area');
  SFX.play('click');

  // Fetch cant variants for this tipo selection
  try {
    const vars = await api(`/productos/${area._product.id}/variants?var_tipo=${encodeURIComponent(value)}`);
    if (vars.has_cant && vars.variantes_cantidad.length) {
      $('#ped-variant-cant-row').style.display = 'block';
      selectedVariantCant = '';
      renderVariantPills('cant', vars.variantes_cantidad);

      // Advance to cant step
      variantStep = 'cant';
      variantFocusIndex = 0;
      updateVariantStepUI();
      await updateVariantPrice();

      requestAnimationFrame(() => focusCurrentStepPill(0));
    } else {
      // No cant variants — finish immediately
      variantStep = null;
      updateVariantStepUI();
      await updateVariantPrice();
      addItemToOrder();
    }
  } catch (e) {
    toast('ERROR: ' + e.message, 'error');
  }
}

async function selectVariantCantAndFinish(el, value) {
  selectedVariantCant = value;
  $$('#ped-variant-cant-pills .variant-pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');

  SFX.play('click');

  variantStep = null;
  updateVariantStepUI();
  await updateVariantPrice();

  // Small delay so user sees the selection highlight before the panel closes
  setTimeout(() => addItemToOrder(), 120);
}

// Legacy click handlers (kept for backward compat with direct pill clicks)
async function selectVariantTipo(el, value) {
  selectVariantTipoAndAdvance(el, value);
}

function selectVariantCant(el, value) {
  selectVariantCantAndFinish(el, value);
}

async function updateVariantPrice() {
  const area = $('#ped-variant-area');
  try {
    let params = [];
    if (selectedVariantTipo) params.push('var_tipo=' + encodeURIComponent(selectedVariantTipo));
    if (selectedVariantCant) params.push('var_cant=' + encodeURIComponent(selectedVariantCant));
    const res = await api(`/productos/${area._product.id}/price?${params.join('&')}`);
    $('#ped-variant-price').value = res.price || 0;
  } catch (e) {}
}

function cancelVariant() {
  $('#ped-variant-area').style.display = 'none';
  selectedProduct = null;
  variantStep = null;
}

// Allow enter in variant quantity to submit the item
$('#ped-variant-qty').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addItemToOrder();
  }
});

function addItemToOrder() {
  const area = $('#ped-variant-area');
  const product = area._product;
  const tipo = area._tipo;
  const qty = parseInt($('#ped-variant-qty').value) || 1;
  const price = parseFloat($('#ped-variant-price').value) || 0;
  if (price <= 0) { toast('PRECIO INVÁLIDO', 'error'); return; }

  const newItem = {
    producto_id: product.id, nombre: product.nombre, tipo_id: product.tipo_id,
    tipo: tipo ? tipo.nombre : '', var_tipo: selectedVariantTipo, var_cantidad: selectedVariantCant,
    precio: price, cantidad: qty, descuento_efectivo: product.excluir_descuento_efectivo ? false : (tipo ? tipo.descuento_efectivo : false)
  };

  const stockEntry = getStockForProduct(product.id, selectedVariantTipo);
  if (stockEntry) {
    const alreadyOrdered = getOrderQtyForProduct(product.id, selectedVariantTipo);
    const totalNeeded = alreadyOrdered + (qty * getVariantMultiplier(selectedVariantCant));
    const limit = getEffectiveStockLimit(product.id, stockEntry);
    if (totalNeeded > limit) {
      const faltante = totalNeeded - limit;
      showStockWarning(formatStockValue(faltante), product.nombre, () => {
        orderItems.push(newItem);
        $('#ped-variant-area').style.display = 'none';
        variantStep = null;
        renderOrderItems(); updateOrderTotals();
        requestAnimationFrame(() => $('#ped-search').focus());
      }, () => {
        // Deshacer: close variant area, don't add item
        $('#ped-variant-area').style.display = 'none';
        variantStep = null;
        requestAnimationFrame(() => $('#ped-search').focus());
      });
      return;
    }
  }

  orderItems.push(newItem);
  $('#ped-variant-area').style.display = 'none';
  variantStep = null;
  renderOrderItems(); updateOrderTotals();
  // Use requestAnimationFrame to ensure focus is set after DOM updates
  requestAnimationFrame(() => $('#ped-search').focus());
}

function renderOrderItems() {
  const list = $('#ped-items-list');
  const header = $('#ped-items-header');
  $('#ped-item-count').textContent = `[${orderItems.length}]`;
  if (header) {
    header.style.display = orderItems.length ? 'grid' : 'none';
  }
  if (!orderItems.length) {
    list.innerHTML = '<li class="empty-state" style="padding:20px;"><p>// No hay items</p></li>';
    return;
  }
  list.innerHTML = orderItems.map((it, i) => {
    const variant = [it.var_tipo, cleanVariantName(it.var_cantidad)].filter(Boolean).join(' · ');
    return `
      <li class="order-item">
        <span class="oi-qty">${it.cantidad}x</span>
        <div>
          <span class="oi-name">${it.nombre}</span>
          ${variant ? `<span class="oi-variant"> — ${variant}</span>` : ''}
        </div>
        <span class="oi-price">${fmtMoney(it.precio)}</span>
        <span style="font-family: var(--font-mono); color: var(--accent); font-weight: 600; text-align: right;">${fmtMoney(it.precio * it.cantidad)}</span>
        <div class="oi-actions">
          <button class="btn-ghost btn-sm" tabindex="-1" onclick="changeItemQty(${i}, -1)">−</button>
          <button class="btn-ghost btn-sm" tabindex="-1" onclick="changeItemQty(${i}, 1)">+</button>
          <button class="btn-ghost btn-sm btn-danger" tabindex="-1" onclick="removeItem(${i})">✕</button>
        </div>
      </li>
    `;
  }).join('');
}

function changeItemQty(index, delta) {
  const newQty = orderItems[index].cantidad + delta;
  if (newQty < 1) { removeItem(index); return; }

  // Check stock only when increasing
  if (delta > 0) {
    const item = orderItems[index];
    const stockEntry = getStockForProduct(item.producto_id, item.var_tipo);
    if (stockEntry) {
      const alreadyOrdered = getOrderQtyForProduct(item.producto_id, item.var_tipo);
      const totalNeeded = alreadyOrdered + (delta * getVariantMultiplier(item.var_cantidad));
      const limit = getEffectiveStockLimit(item.producto_id, stockEntry);
      if (totalNeeded > limit) {
        const faltante = totalNeeded - limit;
        showStockWarning(formatStockValue(faltante), item.nombre, () => {
          orderItems[index].cantidad = newQty;
          renderOrderItems(); updateOrderTotals();
        }, () => { /* Deshacer: don't change qty */ });
        return;
      }
    }
  }

  orderItems[index].cantidad = newQty;
  renderOrderItems(); updateOrderTotals();
}

function removeItem(index) { orderItems.splice(index, 1); renderOrderItems(); updateOrderTotals(); }

async function updateOrderTotals() {
  const subtotal = orderItems.reduce((s, it) => s + it.precio * it.cantidad, 0);
  const descPct = parseFloat($('#ped-descuento').value) || 0;
  const descuento = subtotal * descPct / 100;
  const metodo = $('#ped-pago-metodo').value;
  const esEnvio = $('#ped-envio-toggle').checked;
  const isExterno = $('#ped-envio-tipo-externo').checked;
  let envioCost = 0;
  if (esEnvio && isExterno) envioCost = parseFloat($('#ped-envio-costo').value) || 0;

  $('#ped-subtotal').textContent = fmtMoney(subtotal);
  $('#ped-desc-row').style.display = descPct > 0 ? 'flex' : 'none';
  if (descPct > 0) $('#ped-descuento-val').textContent = '-' + fmtMoney(descuento);
  $('#ped-envio-row').style.display = envioCost > 0 ? 'flex' : 'none';
  if (envioCost > 0) $('#ped-envio-val').textContent = fmtMoney(envioCost);

  // Hide the independent cash discount row
  $('#ped-efectivo-row').style.display = 'none';

  let total = subtotal - descuento + envioCost;
  let hasDiscount = false;

  if (metodo === 'Efectivo' && orderItems.length) {
    try {
      const res = await api('/calcular-efectivo', { method: 'POST', body: JSON.stringify({ items: orderItems, envio_cost: envioCost }) });
      if (res.total_efectivo < total) {
        total = res.total_efectivo;
        hasDiscount = true;
      }
    } catch (e) {
      // Ignore API errors, fallback to normal total
    }
  }

  // Update total value
  $('#ped-total').textContent = fmtMoney(total);

  // Dynamic label based on cash discount application
  const totalLabel = $('#ped-totals .total-final span:first-child');
  if (totalLabel) {
    totalLabel.textContent = hasDiscount ? 'TOTAL (DESC. EFECTIVO)' : 'TOTAL';
  }
}

$('#ped-descuento').addEventListener('input', updateOrderTotals);
$('#ped-pago-metodo').addEventListener('change', updateOrderTotals);
$('#ped-envio-costo').addEventListener('input', updateOrderTotals);
$('#ped-envio-tipo-interno').addEventListener('change', onEnvioTipoChange);
$('#ped-envio-tipo-externo').addEventListener('change', onEnvioTipoChange);

function toggleEnvio() {
  const checked = $('#ped-envio-toggle').checked;
  $('#ped-envio-section').classList.toggle('envio-active', checked);
  
  const btnNo = $('#btn-envio-no');
  const btnSi = $('#btn-envio-si');
  if (btnNo && btnSi) {
    if (checked) {
      btnSi.classList.add('active');
      btnNo.classList.remove('active');
    } else {
      btnNo.classList.add('active');
      btnSi.classList.remove('active');
    }
  }
  updateOrderTotals();
}

function setEnvioActive(active) {
  $('#ped-envio-toggle').checked = active;
  toggleEnvio();
  if (typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
}

function onEnvioTipoChange() {
  const isExterno = $('#ped-envio-tipo-externo').checked;
  const costoInput = $('#ped-envio-costo');
  if (costoInput) {
    if (isExterno) {
      costoInput.disabled = false;
      costoInput.style.opacity = '1';
      costoInput.style.pointerEvents = 'auto';
    } else {
      costoInput.disabled = true;
      costoInput.value = '0';
      costoInput.style.opacity = '0.5';
      costoInput.style.pointerEvents = 'none';
    }
  }
  updateOrderTotals();
}

// ── Custom Interactive Keyboard-Navizable Payment Widget ─────────────────────
let paymentSelectionMode = false;
let paymentPendingIndex = -1;

const paymentMethods = [
  'Efectivo',        // index 1
  'Transferencia',   // index 2
  'Débito',          // index 3
  'Crédito',         // index 4
  'Mixto'         // index 5
];

function selectPaymentByIndex(idx) {
  if (idx < 1 || idx > 5) return;
  const val = paymentMethods[idx - 1];
  $('#ped-pago-metodo').value = val;
  updateOrderTotals();
  updatePaymentUI();
}

function updatePaymentUI() {
  const confirmedVal = $('#ped-pago-metodo').value || 'Mixto';
  const confirmedIdx = paymentMethods.indexOf(confirmedVal) + 1;

  document.querySelectorAll('.pay-option').forEach(opt => {
    const idx = parseInt(opt.getAttribute('data-index'));
    opt.classList.remove('active', 'pending-focus');
    
    if (paymentSelectionMode) {
      if (idx === paymentPendingIndex) {
        opt.classList.add('pending-focus');
      }
    } else {
      if (idx === confirmedIdx) {
        opt.classList.add('active');
      }
    }
  });
}

function setupPaymentWidgetEvents() {
  const pagoContainer = $('#ped-pago-container');
  if (!pagoContainer) return;
  
  // Mouse clicks
  document.querySelectorAll('.pay-option').forEach(opt => {
    opt.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-index'));
      selectPaymentByIndex(idx);
      paymentSelectionMode = false;
      paymentPendingIndex = -1;
      updatePaymentUI();
    });
  });

  pagoContainer.addEventListener('focus', function() {
    paymentSelectionMode = false;
    paymentPendingIndex = -1;
    updatePaymentUI();
  });

  pagoContainer.addEventListener('blur', function() {
    setTimeout(() => {
      if (paymentSelectionMode) {
        paymentSelectionMode = false;
        paymentPendingIndex = -1;
        updatePaymentUI();
      }
    }, 150);
  });

  pagoContainer.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.shiftKey) {
      if (paymentSelectionMode && paymentPendingIndex >= 1 && paymentPendingIndex <= 5) {
        selectPaymentByIndex(paymentPendingIndex);
      }
      paymentSelectionMode = false;
      paymentPendingIndex = -1;
      updatePaymentUI();
      return;
    }

    // 1-5 direct selection keys
    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      paymentSelectionMode = true;
      paymentPendingIndex = parseInt(e.key);
      updatePaymentUI();
      return;
    }

    if (paymentSelectionMode) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (paymentPendingIndex >= 1 && paymentPendingIndex <= 5) {
          selectPaymentByIndex(paymentPendingIndex);
        }
        paymentSelectionMode = false;
        paymentPendingIndex = -1;
        updatePaymentUI();
        if (typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        paymentSelectionMode = false;
        paymentPendingIndex = -1;
        updatePaymentUI();
      } else if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) {
          paymentPendingIndex = paymentPendingIndex - 1;
          if (paymentPendingIndex < 1) paymentPendingIndex = 5;
        } else {
          paymentPendingIndex = paymentPendingIndex + 1;
          if (paymentPendingIndex > 5) paymentPendingIndex = 1;
        }
        updatePaymentUI();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        paymentPendingIndex = paymentPendingIndex - 1;
        if (paymentPendingIndex < 1) paymentPendingIndex = 5;
        updatePaymentUI();
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        paymentSelectionMode = true;
        const confirmedVal = $('#ped-pago-metodo').value || 'Mixto';
        paymentPendingIndex = paymentMethods.indexOf(confirmedVal) + 1;
        updatePaymentUI();
        if (typeof SFX !== 'undefined' && SFX.play) SFX.play('click');
      }
    }
  });
}

// ── Strict Tab Focus Loop inside Modal Pedido ────────────────────────────────
function setupStrictTabCycle() {
  const cliente = $('#ped-cliente');
  const telefono = $('#ped-telefono');
  const search = $('#ped-search');
  const pago = $('#ped-pago-container');

  if (!cliente || !telefono || !search || !pago) return;

  telefono.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
  });

  cliente.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        pago.focus();
      } else {
        telefono.focus();
      }
    }
  });

  telefono.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        cliente.focus();
      } else {
        search.focus();
      }
    }
  });

  search.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      // If dropdown is visible with results, Tab enters the dropdown (closed loop)
      const dropdownVisible = $('#ped-search-results').classList.contains('visible');
      const dropdownItems = $$('#ped-search-results .search-result-item');
      if (!e.shiftKey && dropdownVisible && dropdownItems.length) {
        dropdownItems[0].focus();
        return;
      }
      if (e.shiftKey) {
        telefono.focus();
      } else {
        pago.focus();
      }
    }
  });

  pago.addEventListener('keydown', function(e) {
    if (e.key === 'Tab' && !paymentSelectionMode) {
      e.preventDefault();
      if (e.shiftKey) {
        search.focus();
      } else {
        cliente.focus();
      }
    }
  });
}

// ── Shift+Enter to submit pedido from anywhere in the modal ──────────────────
function setupPedidoShiftEnter() {
  const modal = $('#modal-pedido');
  if (!modal) return;

  modal.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      // Don't trigger during variant selection
      if (variantStep) return;
      // Only if modal is open
      if (!modal.classList.contains('open')) return;
      submitPedido();
    }
  });
}

// ── Auto-Select / Auto-Clear for Numeric Inputs Focus ─────────────────────────
function setupNumericInputsAutoSelect() {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('focus', function() {
      if (this.value === '0') {
        this.value = '';
      } else {
        this.select();
      }
    });

    input.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.value = '0';
      }
    });
  });
}

async function submitPedido() {
  const cliente = $('#ped-cliente').value.trim();
  if (!cliente) { toast('CLIENTE REQUERIDO', 'error'); return; }
  if (!orderItems.length) { toast('AGREGAR ITEMS', 'error'); return; }

  const esEnvio = $('#ped-envio-toggle').checked;
  const isExterno = $('#ped-envio-tipo-externo').checked;
  const envio = esEnvio ? {
    envio: true, direccion: $('#ped-envio-dir').value,
    costo_envio: parseFloat($('#ped-envio-costo').value) || 0,
    cliente_paga_envio: isExterno,
    costo_desconocido: false, _confirmado: true
  } : { envio: false };

  const metodo = $('#ped-pago-metodo').value;
  const pago = { metodo };
  if (metodo === 'Efectivo') {
    try {
      const ec = esEnvio && envio.cliente_paga_envio ? envio.costo_envio : 0;
      const res = await api('/calcular-efectivo', { method: 'POST', body: JSON.stringify({ items: orderItems, envio_cost: ec }) });
      pago.total_efectivo = res.total_efectivo;
    } catch (e) { pago.total_efectivo = null; }
  }

  try {
    const isEdit = !!editingOrderId;
    const url = isEdit ? `/pedidos/${editingOrderId}` : '/pedidos';
    const method = isEdit ? 'PUT' : 'POST';

    await api(url, { method, body: JSON.stringify({
      cliente, telefono: $('#ped-telefono').value,
      hora_retiro: ($('#ped-hora-hh').value.trim() && $('#ped-hora-mm').value.trim()) ? `${$('#ped-hora-hh').value.trim().padStart(2, '0')}:${$('#ped-hora-mm').value.trim().padStart(2, '0')}` : '',
      items: orderItems, descuento_pct: parseFloat($('#ped-descuento').value) || 0, pago, envio
    }) });
    toast(isEdit ? 'PEDIDO ACTUALIZADO' : 'PEDIDO REGISTRADO', 'success');
    closePedidoModal(); loadPedidos();
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

// ── EDIT PEDIDO ──────────────────────────────────────────────────────────────

function openEditPedidoModal(id) {
  openPedidoModal(id);
}
// ── CATÁLOGO ─────────────────────────────────────────────────────────────────

let currentCatTab = 'productos';
let catalogoData = [];
let tiposData = [];
let editingProductId = null;

async function switchCatTab(tab) {
  currentCatTab = tab;
  $$('#cat-main-tabs .sub-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === tab));
  $('#cat-productos-section').style.display = tab === 'productos' ? '' : 'none';
  $('#cat-tipos-section').style.display = tab === 'tipos' ? '' : 'none';
  if (tab === 'productos') await loadCatalogo();
  if (tab === 'tipos') await loadTipos();
}

async function loadCatalogo() {
  try {
    const tf = $('#catalogo-tipo-filter').value;
    catalogoData = await api('/productos' + (tf ? `?tipo_id=${tf}` : ''));
    tiposData = await api('/tipos');
    renderCatalogo(); populateTipoFilter();
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

function populateTipoFilter() {
  const sel = $('#catalogo-tipo-filter');
  const cur = sel.value;
  sel.innerHTML = '<option value="">// TODOS</option>' +
    tiposData.map(t => `<option value="${t.id}" ${t.id == cur ? 'selected' : ''}>${t.nombre}</option>`).join('');
}

$('#catalogo-tipo-filter').addEventListener('change', loadCatalogo);

function renderCatalogo() {
  const container = $('#catalogo-table-container');
  if (!catalogoData.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">&lt;/&gt;</div><p>// Catálogo vacío</p></div>';
    return;
  }
  const tipoMap = {};
  tiposData.forEach(t => tipoMap[t.id] = t.nombre);

  const filterVal = $('#catalogo-tipo-filter').value;
  const showTipo = !filterVal; // only show Tipo column in "TODOS"

  // Sort by tipo name when showing all
  let data = [...catalogoData];
  if (showTipo) {
    data.sort((a, b) => {
      const ta = tipoMap[a.tipo_id] || '?';
      const tb = tipoMap[b.tipo_id] || '?';
      return ta.localeCompare(tb);
    });
  }

  const colgroup = showTipo
    ? `<colgroup>
        <col class="col-nombre">
        <col class="col-abrev">
        <col class="col-tipo">
        <col class="col-stock">
        <col class="col-acc">
       </colgroup>`
    : `<colgroup>
        <col style="width:45%">
        <col style="width:16%">
        <col style="width:22%">
        <col style="width:17%">
       </colgroup>`;

  const thead = showTipo
    ? `<thead><tr><th>Nombre</th><th>Abrev</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>`
    : `<thead><tr><th>Nombre</th><th>Abrev</th><th>Estado</th><th>Acciones</th></tr></thead>`;

  const rows = data.map(p => {
    const tn = tipoMap[p.tipo_id] || '?';
    const tipoCell = showTipo ? `<td>${tn}</td>` : '';
    return `<tr>
      <td><strong>${p.nombre}</strong></td>
      <td style="font-family:var(--font-mono); font-size:0.72rem; color:var(--accent-dim);">${p.abrev}</td>
      ${tipoCell}
      <td>${p.sin_stock ? '<span class="stock-off">INACTIVO</span>' : '<span class="stock-on">ACTIVO</span>'}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="editProducto(${p.id})">✎</button>
        <button class="btn btn-sm btn-ghost" onclick="toggleStock(${p.id}, ${!p.sin_stock})">
          ${p.sin_stock ? '↑' : '↓'}
        </button>
        <button class="btn btn-sm btn-ghost btn-danger" onclick="deleteProducto(${p.id})">✕</button>
      </td>
    </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="data-table">
      ${colgroup}
      ${thead}
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function toggleStock(id, sinStock) {
  try {
    await api(`/productos/${id}`, { method: 'PUT', body: JSON.stringify({ sin_stock: sinStock }) });
    SFX.play('success');
    loadCatalogo();
  } catch (e) {
    toast('ERROR: ' + e.message, 'error');
  }
}

async function deleteProducto(id) {
  showConfirm('Eliminar Producto', '¿Eliminar este producto?', async () => {
    try { await api(`/productos/${id}`, { method: 'DELETE' }); toast('ELIMINADO', 'success'); loadCatalogo(); }
    catch (e) { toast('ERROR: ' + e.message, 'error'); }
  });
}

function updateExcluirDiscountVisibility() {
  const val = $('#prod-tipo').value;
  const exclGroup = $('#prod-excluir-desc-efectivo')?.closest('.form-group');
  if (!val) {
    if (exclGroup) exclGroup.style.display = 'none';
    return;
  }
  const tipoId = parseInt(val);
  if (tipoId === 999) {
    if (exclGroup) exclGroup.style.display = 'none';
    return;
  }
  const tipo = (tiposData || []).find(t => t.id === tipoId);
  if (tipo && tipo.descuento_efectivo) {
    if (exclGroup) exclGroup.style.display = 'block';
  } else {
    if (exclGroup) exclGroup.style.display = 'none';
  }
}

function openProductoModal(product = null) {
  editingProductId = product ? product.id : null;
  $('#producto-modal-title').textContent = product ? '// EDITAR PRODUCTO' : '// NUEVO PRODUCTO';
  $('#prod-nombre').value = product ? product.nombre : '';
  $('#prod-abrev').value = product ? product.abrev : '';
  $('#prod-precio').value = product ? product.precio_u : 0;
  $('#prod-desc-efectivo').checked = product ? product.descuento_efectivo !== false : true;
  $('#prod-excluir-desc-efectivo').checked = product ? !!product.excluir_descuento_efectivo : false;
  
  promoItems = product ? (product.promo_items || []) : [];

  const sel = $('#prod-tipo');
  if (!tiposData || tiposData.length === 0) {
    sel.innerHTML = '<option value="" disabled selected>// CREÁ UN TIPO PRIMERO</option>';
  } else {
    let optionsHtml = '';
    if (!product) {
      optionsHtml += '<option value="" disabled selected>// SELECCIONAR TIPO DE PRODUCTO</option>';
    }
    optionsHtml += tiposData.map(t =>
      `<option value="${t.id}" ${product && product.tipo_id === t.id ? 'selected' : ''}>${t.nombre}</option>`
    ).join('');
    sel.innerHTML = optionsHtml;
  }

  const tipoId = product ? product.tipo_id : null;
  const precioLabel = $('#prod-precio-label');
  const precioGroup = $('#prod-precio-group');
  const tipo = product ? (tiposData || []).find(t => t.id === tipoId) : null;

  if (tipoId === null) {
    $('#prod-promo-area').style.display = 'none';
    $('#prod-variantes-area').style.display = 'none';
    $('#prod-excluir-desc-efectivo').closest('.form-group').style.display = 'none';
    if (precioGroup) precioGroup.style.display = 'none';
  } else if (tipoId === 999) {
    $('#prod-promo-area').style.display = 'block';
    $('#prod-variantes-area').style.display = 'none';
    $('#prod-excluir-desc-efectivo').closest('.form-group').style.display = 'none';
    if (precioGroup) precioGroup.style.display = 'block';
    if (precioLabel) precioLabel.textContent = 'Precio de la Promo ($) *';
    renderPromoItems();
  } else {
    $('#prod-promo-area').style.display = 'none';
    if (precioLabel) precioLabel.textContent = 'Precio';
    loadVariantesGrid(product);
    updateExcluirDiscountVisibility();
  }

  $('#modal-producto').classList.add('open');
}

function closeProductoModal() { $('#modal-producto').classList.remove('open'); }
function editProducto(id) { const p = catalogoData.find(x => x.id === id); if (p) openProductoModal(p); }

function loadVariantesGrid(product) {
  const tipoId = parseInt($('#prod-tipo').value);
  const tipo = tiposData.find(t => t.id === tipoId);
  const grid = $('#prod-variantes-grid');
  if (!tipo) { grid.innerHTML = ''; return; }
  const varTipo = tipo.variantes_tipo || [];
  const varCant = tipo.variantes_cantidad || [];
  const existing = product ? product.precios_variantes || {} : {};
  const inactivas = product ? product.variantes_inactivas || [] : [];

  if (!tipo.admite_variantes_tipo && !tipo.admite_variantes_cantidad) {
    $('#prod-variantes-area').style.display = 'none';
    $('#prod-precio').closest('.form-group').style.display = 'block';
    return;
  }

  $('#prod-variantes-area').style.display = 'block';
  $('#prod-precio').closest('.form-group').style.display = 'none';

  // ── Matrix layout: tipo (rows) × cantidad (columns) ──
  if (tipo.admite_variantes_tipo && tipo.admite_variantes_cantidad && varTipo.length && varCant.length) {
    let html = '<div class="var-matrix-wrap"><table class="var-matrix">';
    // Header row: empty corner + cant headers
    html += '<thead><tr><th class="var-matrix-corner"></th>';
    for (const vc of varCant) {
      html += `<th class="var-matrix-col-head">${vc}</th>`;
    }
    html += '</tr></thead><tbody>';
    // Data rows: tipo label + cells for each cant
    for (const vt of varTipo) {
      html += `<tr><td class="var-matrix-row-head">${vt}</td>`;
      for (const vc of varCant) {
        const key = `${vt}|${vc}`;
        const price = existing[key] || 0;
        const active = !inactivas.includes(key);
        html += `<td class="var-matrix-cell ${active ? '' : 'var-cell-inactive'}">
          <input type="number" class="var-price var-matrix-input" data-key="${key}" value="${price}" min="0"
                 onchange="onVariantCellChange(this)">
          <label class="sf-check sf-check-sm var-matrix-check">
            <input type="checkbox" class="var-active" data-key="${key}" ${active ? 'checked' : ''}
                   onchange="onVariantActiveToggle(this)">
            <span class="box"></span>
          </label>
        </td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    grid.innerHTML = html;

  // ── Flat list: only tipo OR only cant ──
  } else {
    const variants = (tipo.admite_variantes_tipo && varTipo.length) ? varTipo : varCant;
    let html = '<table class="data-table"><thead><tr><th>Variante</th><th>Precio</th><th>Activa</th></tr></thead><tbody>';
    for (const v of variants) {
      const price = existing[v] || 0, active = !inactivas.includes(v);
      html += `<tr class="${active ? '' : 'var-row-inactive'}">
        <td>${v}</td>
        <td><input type="number" class="var-price" data-key="${v}" value="${price}" min="0" style="width:100px;"
                   onchange="onVariantCellChange(this)"></td>
        <td><label class="sf-check"><input type="checkbox" class="var-active" data-key="${v}" ${active ? 'checked' : ''}
                   onchange="onVariantActiveToggle(this)"><span class="box"></span></label></td>
      </tr>`;
    }
    html += '</tbody></table>';
    grid.innerHTML = html;
  }
}

// Visual feedback when toggling active/inactive on a variant cell
function onVariantActiveToggle(checkbox) {
  const cell = checkbox.closest('.var-matrix-cell') || checkbox.closest('tr');
  if (cell) {
    if (checkbox.checked) {
      cell.classList.remove('var-cell-inactive', 'var-row-inactive');
    } else {
      cell.classList.add(cell.classList.contains('var-matrix-cell') ? 'var-cell-inactive' : 'var-row-inactive');
    }
  }
}

// Visual feedback when changing price (warn if 0 and active)
function onVariantCellChange(input) {
  const key = input.dataset.key;
  const activeCheckbox = document.querySelector(`.var-active[data-key="${key}"]`);
  const price = parseFloat(input.value) || 0;
  if (price <= 0 && activeCheckbox && activeCheckbox.checked) {
    input.style.borderColor = 'var(--accent-red)';
    input.style.boxShadow = '0 0 8px rgba(231, 76, 60, 0.3)';
  } else {
    input.style.borderColor = '';
    input.style.boxShadow = '';
  }
}

$('#prod-tipo').addEventListener('change', function() {
  const val = this.value;
  const precioLabel = $('#prod-precio-label');
  const precioGroup = $('#prod-precio-group');

  if (!val) {
    $('#prod-promo-area').style.display = 'none';
    $('#prod-variantes-area').style.display = 'none';
    $('#prod-excluir-desc-efectivo').closest('.form-group').style.display = 'none';
    if (precioGroup) precioGroup.style.display = 'none';
    return;
  }
  const tipoId = parseInt(val);
  const tipo = (tiposData || []).find(t => t.id === tipoId);

  if (tipoId === 999) {
    $('#prod-promo-area').style.display = 'block';
    $('#prod-variantes-area').style.display = 'none';
    $('#prod-excluir-desc-efectivo').closest('.form-group').style.display = 'none';
    if (precioGroup) precioGroup.style.display = 'block';
    if (precioLabel) precioLabel.textContent = 'Precio de la Promo ($) *';
    renderPromoItems();
  } else {
    $('#prod-promo-area').style.display = 'none';
    if (precioLabel) precioLabel.textContent = 'Precio';
    loadVariantesGrid(null);
    updateExcluirDiscountVisibility();
  }
});

function addPromoItemRow() {
  const availableTipos = tiposData.filter(t => t.id !== 999);
  if (!availableTipos.length) {
    toast('DEBE EXISTIR AL MENOS UN TIPO PARA AGREGAR ITEMS', 'error');
    return;
  }
  const firstTipo = availableTipos[0];
  promoItems.push({
    tipo_id: firstTipo.id,
    cantidad: 1,
    var_cantidad: firstTipo.variantes_cantidad && firstTipo.variantes_cantidad.length ? firstTipo.variantes_cantidad[0] : '',
    libre_eleccion_tipo: false,
    var_tipo: firstTipo.variantes_tipo && firstTipo.variantes_tipo.length ? firstTipo.variantes_tipo[0] : '',
    descuento_efectivo: !!firstTipo.descuento_efectivo
  });
  renderPromoItems();
}

function removePromoItem(index) {
  promoItems.splice(index, 1);
  renderPromoItems();
}

function onPromoRowTypeChange(index, tipoId) {
  const tipo = tiposData.find(t => t.id === parseInt(tipoId));
  if (!tipo) return;
  promoItems[index].tipo_id = tipo.id;
  promoItems[index].var_cantidad = tipo.variantes_cantidad && tipo.variantes_cantidad.length ? tipo.variantes_cantidad[0] : '';
  promoItems[index].var_tipo = '';
  promoItems[index].libre_eleccion_tipo = true;
  promoItems[index].descuento_efectivo = !!tipo.descuento_efectivo;
  renderPromoItems();
}

function onPromoRowSaborChange(index, value) {
  if (value === 'libre') {
    promoItems[index].libre_eleccion_tipo = true;
    promoItems[index].var_tipo = '';
  } else {
    promoItems[index].libre_eleccion_tipo = false;
    promoItems[index].var_tipo = value;
  }
  renderPromoItems();
}

function renderPromoItems() {
  const list = $('#prod-promo-builder-list');
  if (!list) return;
  
  if (!promoItems.length) {
    list.innerHTML = '<div style="padding:12px; color:var(--text-dim); font-family:var(--font-mono); font-size:0.78rem; text-align:center; border:1px dashed var(--bg-cool-gray); border-radius:6px;">// PROMOCIÓN SIN ITEMS</div>';
    return;
  }

  const availableTipos = tiposData.filter(t => t.id !== 999);

  list.innerHTML = promoItems.map((it, index) => {
    const tipo = tiposData.find(t => t.id === it.tipo_id) || availableTipos[0];
    if (!tipo) return '';

    const tipoOptions = availableTipos.map(t => `<option value="${t.id}" ${it.tipo_id === t.id ? 'selected' : ''}>${t.nombre}</option>`).join('');

    const hasQtyVariants = tipo.admite_variantes_cantidad && tipo.variantes_cantidad && tipo.variantes_cantidad.length;
    const hasStyleVariants = tipo.admite_variantes_tipo && tipo.variantes_tipo && tipo.variantes_tipo.length;

    const qtyVarSelect = hasQtyVariants 
      ? `<select onchange="promoItems[${index}].var_cantidad = this.value" style="background:var(--bg-white); border: 1px solid var(--bg-cool-gray); border-radius: var(--radius);">
          ${tipo.variantes_cantidad.map(vc => `<option value="${vc}" ${it.var_cantidad === vc ? 'selected' : ''}>${cleanVariantName(vc)}</option>`).join('')}
         </select>`
      : `<span style="font-size:0.75rem; color:var(--text-dim); font-family:var(--font-mono);">—</span>`;

    const styleVarSelect = hasStyleVariants
      ? `<select onchange="onPromoRowSaborChange(${index}, this.value)" style="background:var(--bg-white); border: 1px solid var(--bg-cool-gray); border-radius: var(--radius);">
          <option value="libre" ${it.libre_eleccion_tipo ? 'selected' : ''}>LIBRE</option>
          ${tipo.variantes_tipo.map(vt => `<option value="${vt}" ${(!it.libre_eleccion_tipo && it.var_tipo === vt) ? 'selected' : ''}>${vt}</option>`).join('')}
         </select>`
      : `<span style="font-size:0.75rem; color:var(--text-dim); font-family:var(--font-mono);">—</span>`;

    const isDescApplicable = !!tipo.descuento_efectivo;
    const descCheckbox = isDescApplicable
      ? `<label class="sf-check sf-check-sm" style="margin:0; justify-content:center;">
          <input type="checkbox" ${it.descuento_efectivo ? 'checked' : ''} onchange="promoItems[${index}].descuento_efectivo = this.checked;">
          <span class="box"></span>
         </label>`
      : `<span style="font-size:0.75rem; color:var(--text-dim); font-family:var(--font-mono);">NO</span>`;

    return `
      <div class="promo-item-row">
        <!-- Tipo -->
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size: 0.65rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Tipo de Item</label>
          <select onchange="onPromoRowTypeChange(${index}, this.value)" style="background:var(--bg-white); border: 1px solid var(--bg-cool-gray); border-radius: var(--radius);">
            ${tipoOptions}
          </select>
        </div>
        <!-- Cantidad -->
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size: 0.65rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Cant.</label>
          <input type="number" value="${it.cantidad}" min="1" onchange="promoItems[${index}].cantidad = parseInt(this.value) || 1" style="background:var(--bg-white); border: 1px solid var(--bg-cool-gray); border-radius: var(--radius); text-align:center;">
        </div>
        <!-- Tamaño/Cantidad Variant -->
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size: 0.65rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Tamaño</label>
          ${qtyVarSelect}
        </div>
        <!-- Sabor/Variante -->
        <div style="display:flex; flex-direction:column; gap:4px;">
          <label style="font-size: 0.65rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase;">Sabor</label>
          ${styleVarSelect}
        </div>
        <!-- Aplica descuento -->
        <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
          <label style="font-size: 0.65rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase; white-space:nowrap;">Desc ?</label>
          ${descCheckbox}
        </div>
        <!-- Eliminar -->
        <div style="display:flex; align-items:center; height:100%; margin-top:14px;">
          <button class="btn btn-sm btn-ghost btn-danger" type="button" onclick="removePromoItem(${index})" style="padding: 4px 8px;">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

async function submitProducto() {
  const nombre = $('#prod-nombre').value.trim();
  if (!nombre) { toast('NOMBRE REQUERIDO', 'error'); return; }

  const tipoIdRaw = $('#prod-tipo').value;
  if (!tipoIdRaw) { toast('TIPO DE PRODUCTO REQUERIDO', 'error'); return; }
  const tipoId = parseInt(tipoIdRaw);
  if (isNaN(tipoId)) { toast('TIPO DE PRODUCTO REQUERIDO', 'error'); return; }
  const pv = {}, vi = [];
  $$('.var-price').forEach(i => { pv[i.dataset.key] = parseFloat(i.value) || 0; });
  $$('.var-active').forEach(i => { if (!i.checked) vi.push(i.dataset.key); });

  // Validate: active variants must have price > 0
  let invalidKeys = [];
  for (const [key, price] of Object.entries(pv)) {
    if (price <= 0 && !vi.includes(key)) {
      invalidKeys.push(key);
    }
  }
  if (invalidKeys.length) {
    toast(`${invalidKeys.length} VARIANTE(S) ACTIVA(S) CON PRECIO $0`, 'error');
    // Highlight the invalid inputs
    invalidKeys.forEach(key => {
      const input = document.querySelector(`.var-price[data-key="${key}"]`);
      if (input) {
        input.style.borderColor = 'var(--accent-red)';
        input.style.boxShadow = '0 0 8px rgba(231, 76, 60, 0.3)';
        input.focus();
      }
    });
    return;
  }

  if (tipoId === 999) {
    if (!promoItems.length) {
      toast('LA PROMOCIÓN DEBE TENER AL MENOS UN ÍTEM', 'error');
      return;
    }
    for (const it of promoItems) {
      if (it.tipo_id === 999) {
        toast('NO SE PUEDE AGREGAR UNA PROMOCIÓN DENTRO DE OTRA PROMOCIÓN', 'error');
        return;
      }
    }
  }

  const body = {
    nombre, abrev: $('#prod-abrev').value.trim().toUpperCase().slice(0, 4), tipo_id: tipoId,
    precio_u: parseFloat($('#prod-precio').value) || 0,
    descuento_efectivo: $('#prod-desc-efectivo').checked,
    excluir_descuento_efectivo: $('#prod-excluir-desc-efectivo').checked,
    precios_variantes: pv, variantes_inactivas: vi,
    promo_items: tipoId === 999 ? promoItems : []
  };
  try {
    if (editingProductId) { await api(`/productos/${editingProductId}`, { method: 'PUT', body: JSON.stringify(body) }); toast('ACTUALIZADO', 'success'); }
    else { await api('/productos', { method: 'POST', body: JSON.stringify(body) }); toast('CREADO', 'success'); }
    closeProductoModal(); loadCatalogo();
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

// ── TIPOS ────────────────────────────────────────────────────────────────────

let tiposDetailData = [];
let selectedTipoId = null;
let editingTipoId = null;

async function loadTipos() {
  try {
    tiposDetailData = await api('/tipos');
    renderTiposList();
    if (selectedTipoId !== null) {
      selectTipo(selectedTipoId);
    }
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

function renderTiposList() {
  const list = $('#tipos-list');
  if (!tiposDetailData.length) { list.innerHTML = '<div class="empty-state" style="padding:20px;"><p>// Sin categorías</p></div>'; return; }
  list.innerHTML = '<ul class="nier-list">' + tiposDetailData.map(t => `
    <li class="nier-list-item ${selectedTipoId === t.id ? 'selected' : ''}" onclick="selectTipo(${t.id})">
      <span style="flex:1;">${t.nombre}</span>
      <span style="font-size:0.68rem; color:var(--text-dim); font-family:var(--font-mono);">[${t.id}]</span>
    </li>
  `).join('') + '</ul>';
}

function selectTipo(id) {
  selectedTipoId = id;
  renderTiposList();
  const tipo = tiposDetailData.find(t => t.id === id);
  if (!tipo) return;
  const detail = $('#tipos-detail');
  
  const isSystemType = tipo.id === 999;
  const buttonsHtml = isSystemType
    ? `<span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-dim);">// CATEGORÍA FIJA DEL SISTEMA (PROTEGIDA)</span>`
    : `
      <button class="btn btn-sm" onclick="editTipo(${tipo.id})">✎ EDITAR</button>
      <button class="btn btn-sm btn-danger" onclick="deleteTipo(${tipo.id})">✕ ELIMINAR</button>
    `;

  detail.innerHTML = `
    <h3 style="font-family:var(--font-head); font-size:0.9rem; margin-bottom:12px; letter-spacing:0.1em; color:var(--accent);">// ${tipo.nombre.toUpperCase()}</h3>
    <div style="display:flex; flex-direction:column; gap:5px; font-size:0.82rem; margin-bottom:14px; font-family:var(--font-mono);">
      <div>Opciones de Cocción: <span style="color:${tipo.admite_variantes_tipo ? 'var(--success)' : 'var(--accent-red)'};">${tipo.admite_variantes_tipo ? 'SÍ' : 'NO'}</span></div>
      <div>Opciones de Tamaño: <span style="color:${tipo.admite_variantes_cantidad ? 'var(--success)' : 'var(--accent-red)'};">${tipo.admite_variantes_cantidad ? 'SÍ' : 'NO'}</span></div>
      <div>Separar Stock por Cocción: <span style="color:${tipo.separar_stock_coccion ? 'var(--success)' : 'var(--accent-red)'};">${tipo.separar_stock_coccion ? 'SÍ' : 'NO'}</span></div>
      <div>Descuento Efectivo: <span style="color:${tipo.descuento_efectivo ? 'var(--success)' : 'var(--accent-red)'};">${tipo.descuento_efectivo ? 'SÍ' : 'NO'}</span></div>
    </div>
    ${tipo.admite_variantes_tipo && tipo.variantes_tipo && tipo.variantes_tipo.length ? `<div style="margin-bottom:10px;"><label>Opciones de Cocción</label><div class="variant-pills">${tipo.variantes_tipo.map(v => `<span class="variant-pill" style="cursor:default;">${v}</span>`).join('')}</div></div>` : ''}
    ${tipo.admite_variantes_cantidad && tipo.variantes_cantidad && tipo.variantes_cantidad.length ? `<div style="margin-bottom:10px;"><label>Opciones de Tamaño</label><div class="variant-pills">${tipo.variantes_cantidad.map(v => `<span class="variant-pill" style="cursor:default;">${v}</span>`).join('')}</div></div>` : ''}
    <div class="scan-sep"></div>
    <div style="display:flex; gap:6px; align-items:center;">
      ${buttonsHtml}
    </div>
  `;
}

function openTipoModal(tipo = null) {
  editingTipoId = tipo ? tipo.id : null;
  $('#tipo-modal-title').textContent = tipo ? '// EDITAR CATEGORÍA' : '// NUEVA CATEGORÍA';
  $('#tipo-nombre').value = tipo ? tipo.nombre : '';
  $('#tipo-var-tipo').checked = tipo ? tipo.admite_variantes_tipo : false;
  $('#tipo-var-cant').checked = tipo ? tipo.admite_variantes_cantidad : false;
  $('#tipo-separar-stock-coccion').checked = tipo ? !!tipo.separar_stock_coccion : false;
  $('#tipo-desc-efectivo').checked = tipo ? tipo.descuento_efectivo : true;
  $('#tipo-vt-list').value = tipo && tipo.variantes_tipo ? tipo.variantes_tipo.join('\n') : '';
  $('#tipo-vc-list').value = tipo && tipo.variantes_cantidad ? tipo.variantes_cantidad.join('\n') : '';
  updateTipoModalAreas();
  $('#modal-tipo').classList.add('open');
}

function closeTipoModal() { $('#modal-tipo').classList.remove('open'); }

function updateTipoModalAreas() {
  const admiteCoccion = $('#tipo-var-tipo').checked;
  $('#tipo-vt-area').style.display = admiteCoccion ? 'block' : 'none';
  $('#tipo-vc-area').style.display = $('#tipo-var-cant').checked ? 'block' : 'none';
  const sepGroup = $('#tipo-separar-stock-group');
  if (sepGroup) {
    sepGroup.style.display = admiteCoccion ? 'block' : 'none';
    if (!admiteCoccion) {
      $('#tipo-separar-stock-coccion').checked = false;
    }
  }
}
$('#tipo-var-tipo').addEventListener('change', updateTipoModalAreas);
$('#tipo-var-cant').addEventListener('change', updateTipoModalAreas);

function editTipo(id) {
  if (id === 999) {
    toast('NO SE PUEDE EDITAR LA CATEGORÍA DE SISTEMA', 'error');
    return;
  }
  const t = tiposDetailData.find(x => x.id === id);
  if (t) openTipoModal(t);
}

async function deleteTipo(id) {
  if (id === 999) {
    toast('NO SE PUEDE ELIMINAR LA CATEGORÍA DE SISTEMA', 'error');
    return;
  }
  showConfirm('Eliminar Categoría', '¿Eliminar esta categoría?', async () => {
    try { await api(`/tipos/${id}`, { method: 'DELETE' }); toast('ELIMINADO', 'success'); selectedTipoId = null;
      $('#tipos-detail').innerHTML = '<div class="empty-state"><div class="empty-icon">&lt;/&gt;</div><p>Seleccioná una categoría</p></div>';
      loadTipos();
    } catch (e) { toast('ERROR: ' + e.message, 'error'); }
  });
}

async function submitTipo() {
  const nombre = $('#tipo-nombre').value.trim();
  if (!nombre) { toast('NOMBRE REQUERIDO', 'error'); return; }
  const body = {
    nombre, admite_variantes_tipo: $('#tipo-var-tipo').checked,
    admite_variantes_cantidad: $('#tipo-var-cant').checked, descuento_efectivo: $('#tipo-desc-efectivo').checked,
    separar_stock_coccion: $('#tipo-separar-stock-coccion').checked,
    variantes_tipo: $('#tipo-vt-list').value.split('\n').map(s => s.trim()).filter(Boolean),
    variantes_cantidad: $('#tipo-vc-list').value.split('\n').map(s => s.trim()).filter(Boolean),
  };
  try {
    if (editingTipoId) { await api(`/tipos/${editingTipoId}`, { method: 'PUT', body: JSON.stringify(body) }); toast('ACTUALIZADO', 'success'); }
    else { await api('/tipos', { method: 'POST', body: JSON.stringify(body) }); toast('CREADO', 'success'); }
    closeTipoModal(); loadTipos();
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

let productosVendidosData = [];

async function loadResumen() {
  try {
    const [data, cp] = await Promise.all([
      api('/resumen/hoy'),
      api('/config/cierres-path').catch(() => ({ path: '' }))
    ]);
    renderResumenStats(data);
    renderResumenChart(data.ultimos_7_dias || []);
    productosVendidosData = data.productos_vendidos || [];
    renderResumenProductos();
    const input = $('#cfg-cierres-path');
    if (input) input.value = cp.path || '';
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

function renderResumenStats(data) {
  const now = new Date();
  const day = now.getDate();
  const month = MESES_ES[now.getMonth() + 1];
  const year = now.getFullYear();
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  const todayLabel = `${day} de ${monthLabel} de ${year}`;

  $('#resumen-stats').innerHTML = `
    <div class="gs-balance-card">
      <div class="gs-balance-label">Pedidos Hoy</div>
      <div class="gs-balance-value" style="color:var(--accent);">${data.pedidos || 0}</div>
      <div class="gs-balance-sub">Hoy</div>
    </div>
    <div class="gs-balance-card">
      <div class="gs-balance-label">Facturación</div>
      <div class="gs-balance-value" style="color:var(--success);">${fmtMoney(data.facturacion_neta || 0)}</div>
      <div class="gs-balance-sub">${todayLabel}</div>
    </div>
    <div class="gs-balance-card">
      <div class="gs-balance-label">T. Promedio</div>
      <div class="gs-balance-value" style="color:var(--text-dark);">${data.promedio_prep ? fmtElapsed(data.promedio_prep) : '—'}</div>
      <div class="gs-balance-sub">Tiempo de preparación</div>
    </div>
  `;
}

function renderResumenChart(dias) {
  const c = $('#chart-bars');
  if (!dias.length) { c.innerHTML = '<div style="color:var(--text-dim);text-align:center;width:100%;font-family:var(--font-mono);">// NO DATA</div>'; return; }
  const max = Math.max(...dias.map(d => d.facturacion), 1);
  c.innerHTML = dias.map(d => `
    <div class="bar-col">
      <div class="bar-value">${d.facturacion ? fmtMoney(d.facturacion) : ''}</div>
      <div class="bar-fill" style="height:${Math.max(d.facturacion / max * 100, 2)}%;" title="${d.fecha}: ${fmtMoney(d.facturacion)}"></div>
      <div class="bar-label">${d.label}</div>
    </div>
  `).join('');
}

function onDetalleFilterChange() {
  const selectedCat = $('#detalle-filter-categoria').value;
  if (!selectedCat) {
    renderResumenProductos(productosVendidosData);
  } else {
    const filtered = productosVendidosData.filter(p => p.tipo === selectedCat);
    renderResumenProductos(filtered, selectedCat);
  }
}

function renderResumenProductos(productos = productosVendidosData, selectedCat = '') {
  const c = $('#resumen-productos');
  if (!c) return;

  const filterSel = $('#detalle-filter-categoria');
  if (filterSel) {
    const prevVal = filterSel.value;
    const uniqueCats = [...new Set(productosVendidosData.map(p => p.tipo))].filter(Boolean).sort();
    filterSel.innerHTML = '<option value="" style="color:var(--text-dark);">Todas las categorías</option>' +
      uniqueCats.map(cat => `<option value="${cat}" style="color:var(--text-dark);">${cat}</option>`).join('');
    filterSel.value = prevVal;
  }

  if (!productos.length) {
    c.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.82rem;padding:12px;">// SIN VENTAS</p>';
    return;
  }

  let rowsHtml = '';

  if (!selectedCat) {
    // Group by category (tipo)
    const groups = {};
    productos.forEach(p => {
      const cat = p.tipo || 'Varios';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    Object.keys(groups).sort().forEach(cat => {
      rowsHtml += `
        <tr>
          <td colspan="2" style="background: var(--bg-off-white); font-weight: bold; font-family: var(--font-head); color: var(--accent); padding: 8px 14px; text-transform: uppercase; border-bottom: 1px solid var(--bg-cool-gray);">
            // ${cat}
          </td>
        </tr>
      `;
      groups[cat].forEach(p => {
        rowsHtml += `
          <tr>
            <td style="padding-left: 24px;"><strong>${p.nombre}</strong></td>
            <td style="text-align:right;font-weight:600;color:var(--accent);">${p.cantidad}</td>
          </tr>
        `;
      });
    });
  } else {
    // Flat list for selected category
    productos.forEach(p => {
      rowsHtml += `
        <tr>
          <td><strong>${p.nombre}</strong></td>
          <td style="text-align:right;font-weight:600;color:var(--accent);">${p.cantidad}</td>
        </tr>
      `;
    });
  }

  c.innerHTML = `
    <table class="data-table">
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

// ── SISTEMA ──────────────────────────────────────────────────────────────────

async function loadSistema() {
  try {
    const [config, stats, cp] = await Promise.all([
      api('/config'), api('/info/stats'), api('/config/cierres-path')
    ]);
    
    const cfgNombre = $('#cfg-nombre');
    if (cfgNombre) cfgNombre.value = config.nombre_negocio || '';
    
    const cfgDireccion = $('#cfg-direccion');
    if (cfgDireccion) cfgDireccion.value = config.direccion || '';
    
    const cfgTelefono = $('#cfg-telefono');
    if (cfgTelefono) cfgTelefono.value = config.telefono || '';
    
    const cfgInstagram = $('#cfg-instagram');
    if (cfgInstagram) cfgInstagram.value = config.instagram || '';
    
    const cfgCierresPath = $('#cfg-cierres-path');
    if (cfgCierresPath) cfgCierresPath.value = cp.path || '';
    
    const cfgWaUrl = $('#cfg-wa-url');
    if (cfgWaUrl) cfgWaUrl.value = config.whatsapp_url || '';
    
    const cfgWaToken = $('#cfg-wa-token');
    if (cfgWaToken) cfgWaToken.value = config.whatsapp_token || '';
    
    const cfgWaInstance = $('#cfg-wa-instance');
    if (cfgWaInstance) cfgWaInstance.value = config.whatsapp_instance || 'laextra';
    
    // reiniciar_stock_diariamente defaults to true if not set
    const chk = $('#cfg-reiniciar-stock');
    if (chk) chk.checked = config.reiniciar_stock_diariamente !== false;

    // Load auto-clear media checkbox state
    const autoClearChk = $('#cfg-auto-limpiar-media');
    if (autoClearChk) autoClearChk.checked = config.auto_limpiar_media === true;
    
    // Set vertical layout checkbox state
    const layoutChk = $('#cfg-layout-vertical');
    if (layoutChk) {
      layoutChk.checked = localStorage.getItem('layout-vertical') === 'true';
    }

    const sysInfo = $('#system-info');
    if (sysInfo) {
      sysInfo.innerHTML = `
        <div style="font-family:var(--font-mono); font-size:0.82rem; display:flex; flex-direction:column; gap:4px;">
          <div>Total Pedidos: <span style="color:var(--accent);">${stats.total_pedidos}</span></div>
          <div>Clientes Únicos: <span style="color:var(--accent);">${stats.clientes_unicos}</span></div>
          <div>Tamaño de Datos: <span style="color:var(--accent);">${stats.file_size}</span></div>
          <div>Versión: <span style="color:var(--accent);">${stats.version}</span></div>
        </div>
      `;
    }
    await loadUpdatesInfo();
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

async function loadUpdatesInfo() {
  try {
    const info = await api('/updates/info');
    const versionEl = $('#lbl-update-current-version');
    const ownerEl = $('#lbl-update-owner');
    const repoEl = $('#lbl-update-repo');
    if (versionEl) versionEl.textContent = 'v' + info.current_version;
    if (ownerEl) ownerEl.textContent = info.github_owner || 'No configurado';
    if (repoEl) repoEl.textContent = info.github_repo || 'No configurado';
  } catch (e) {
    console.error('Error al cargar info de updates:', e);
  }
}

async function checkForUpdates() {
  const statusEl = $('#update-status');
  const btnRun = $('#btn-run-update');
  if (statusEl) {
    statusEl.textContent = 'Buscando actualizaciones...';
    statusEl.style.color = 'var(--text-dark)';
  }
  if (btnRun) btnRun.disabled = true;
  
  try {
    const res = await api('/updates/check', { method: 'POST' });
    if (statusEl) {
      if (res.has_update) {
        statusEl.innerHTML = `¡Nueva versión disponible: <strong style="color:var(--success);">v${res.latest_version}</strong>!`;
        statusEl.style.color = 'var(--success)';
        if (btnRun) btnRun.disabled = false;
      } else {
        statusEl.textContent = `Sistema al día (v${res.current_version})`;
        statusEl.style.color = 'var(--text-muted)';
      }
    }
  } catch (e) {
    if (statusEl) {
      statusEl.textContent = 'Error: ' + e.message;
      statusEl.style.color = 'var(--accent-red)';
    }
    toast('ERROR AL BUSCAR ACTUALIZACIÓN: ' + e.message, 'error');
  }
}

async function runUpdate() {
  const statusEl = $('#update-status');
  const btnRun = $('#btn-run-update');
  if (statusEl) {
    statusEl.textContent = 'Abriendo navegador...';
    statusEl.style.color = 'var(--accent)';
  }
  if (btnRun) btnRun.disabled = true;
  
  try {
    toast('ABRIENDO PÁGINA DE RELEASES...', 'success');
    const res = await api('/updates/install', { method: 'POST' });
    if (res.success) {
      toast('NAVEGADOR ABIERTO CON LA DESCARGA', 'success');
      if (statusEl) {
        statusEl.textContent = 'Navegador abierto en la página de releases.';
        statusEl.style.color = 'var(--success)';
      }
    } else {
      toast('ERROR AL BUSCAR ACTUALIZACIÓN: ' + res.details, 'error');
      if (statusEl) {
        statusEl.textContent = 'Error: ' + res.details;
        statusEl.style.color = 'var(--accent-red)';
      }
      if (btnRun) btnRun.disabled = false;
    }
  } catch (e) {
    toast('ERROR: ' + e.message, 'error');
    if (statusEl) {
      statusEl.textContent = 'Error: ' + e.message;
      statusEl.style.color = 'var(--accent-red)';
    }
    if (btnRun) btnRun.disabled = false;
  }
}

function openUpdateConfigModal() {
  const ownerEl = $('#lbl-update-owner');
  const repoEl = $('#lbl-update-repo');
  const owner = ownerEl ? ownerEl.textContent : '';
  const repo = repoEl ? repoEl.textContent : '';
  $('#update-cfg-owner').value = owner === 'No configurado' ? '' : owner;
  $('#update-cfg-repo').value = repo === 'No configurado' ? '' : repo;
  $('#update-cfg-password').value = '';
  $('#modal-update-config').classList.add('open');
}

function closeUpdateConfigModal() {
  $('#modal-update-config').classList.remove('open');
}

async function submitUpdateConfig() {
  const owner = $('#update-cfg-owner').value.trim();
  const repo = $('#update-cfg-repo').value.trim();
  const password = $('#update-cfg-password').value;
  
  if (!owner || !repo) {
    toast('DUEÑO Y REPOSITORIO REQUERIDOS', 'error');
    return;
  }
  if (!password) {
    toast('CONTRASEÑA REQUERIDA', 'error');
    return;
  }
  
  try {
    await api('/updates/config', {
      method: 'POST',
      body: JSON.stringify({ github_owner: owner, github_repo: repo, password: password })
    });
    
    toast('CONFIGURACIÓN GUARDADA', 'success');
    closeUpdateConfigModal();
    await loadUpdatesInfo();
  } catch (e) {
    toast('ERROR: ' + e.message, 'error');
  }
}


async function saveConfig() {
  try {
    const chk = $('#cfg-reiniciar-stock');
    const autoClearChk = $('#cfg-auto-limpiar-media');
    const body = {
      nombre_negocio: $('#cfg-nombre') ? $('#cfg-nombre').value : '',
      direccion: $('#cfg-direccion') ? $('#cfg-direccion').value : '',
      telefono: $('#cfg-telefono') ? $('#cfg-telefono').value : '',
      instagram: $('#cfg-instagram') ? $('#cfg-instagram').value : '',
      reiniciar_stock_diariamente: chk ? chk.checked : true,
      auto_limpiar_media: autoClearChk ? autoClearChk.checked : false,
      whatsapp_url: $('#cfg-wa-url') ? $('#cfg-wa-url').value : '',
      whatsapp_token: $('#cfg-wa-token') ? $('#cfg-wa-token').value : '',
      whatsapp_instance: $('#cfg-wa-instance') ? $('#cfg-wa-instance').value : ''
    };
    await api('/config', { method: 'PUT', body: JSON.stringify(body) });
    toast('CONFIG GUARDADA', 'success');
  } catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

function toggleLayoutVertical() {
  const chk = $('#cfg-layout-vertical');
  if (chk) {
    const isVertical = chk.checked;
    localStorage.setItem('layout-vertical', isVertical ? 'true' : 'false');
    document.body.classList.toggle('layout-vertical', isVertical);
    if (isVertical) {
      updateSidebarTelemetry();
    }
  }
}

async function updateSidebarTelemetry() {
  try {
    const data = await api('/resumen/hoy');
    const telOrders = $('#nav-tel-orders');
    const telCash = $('#nav-tel-cash');
    if (telOrders) telOrders.textContent = data.pedidos || 0;
    if (telCash) telCash.textContent = fmtMoney(data.facturacion_neta || 0);
  } catch (e) {
    console.error('Error updating sidebar stats:', e);
  }
}




async function cierreDiario() {
  try { await api('/cierre/diario', { method: 'POST', body: JSON.stringify({}) }); toast('CIERRE GENERADO', 'success'); }
  catch (e) { toast(e.message.includes('NO_CIERRES_PATH') ? 'CONFIGURAR CARPETA PRIMERO' : 'ERROR: ' + e.message, 'error'); }
}

async function cierreMensual() {
  const m = $('#cierre-mes-mes').value;
  const y = $('#cierre-mes-anio').value;
  if (!m || !y) { toast('SELECCIONAR MES Y AÑO', 'error'); return; }
  try {
    await api('/cierre/mensual', { method: 'POST', body: JSON.stringify({ mes: `${m}/${y}` }) });
    toast('CIERRE MENSUAL GENERADO', 'success');
  } catch (e) {
    toast(e.message.includes('NO_CIERRES_PATH') ? 'CONFIGURAR CARPETA PRIMERO' : 'ERROR: ' + e.message, 'error');
  }
}




async function saveCierresPath() {
  const path = $('#cfg-cierres-path').value.trim();
  if (!path) { toast('RUTA VACÍA', 'error'); return; }
  try { await api('/config/cierres-path', { method: 'POST', body: JSON.stringify({ path }) }); toast('CARPETA CONFIGURADA', 'success'); }
  catch (e) { toast('ERROR: ' + e.message, 'error'); }
}

async function abrirCarpetaCierres() {
  try { await api('/cierre/abrir-carpeta', { method: 'POST', body: JSON.stringify({}) }); }
  catch (e) { toast(e.message.includes('NO_CIERRES_PATH') ? 'CONFIGURAR CARPETA' : 'ERROR: ' + e.message, 'error'); }
}

function showInfoPopup(titulo, mensaje) {
  SFX.play('success');
  const existing = $('#modal-info-cierre');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modal-info-cierre';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: var(--bg-white, #fff);
      border: 1.5px solid var(--accent, #6366f1);
      border-radius: 12px;
      padding: 32px 36px 28px;
      max-width: 420px; width: 90%;
      box-shadow: 0 8px 40px rgba(0,0,0,0.22);
      text-align: center;
      animation: slideUp 0.22s cubic-bezier(.4,1.4,.6,1) both;
    ">
      <div style="font-size: 2.2rem; margin-bottom: 10px;">✅</div>
      <div style="
        font-family: var(--font-mono, monospace);
        font-size: 0.72rem;
        color: var(--accent, #6366f1);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-bottom: 8px;
      ">${titulo}</div>
      <div style="
        font-family: var(--font-body, sans-serif);
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-dark, #111);
        line-height: 1.5;
        margin-bottom: 24px;
      ">${mensaje}</div>
      <button id="info-cierre-ok" style="
        background: var(--accent, #6366f1);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 10px 32px;
        font-family: var(--font-mono, monospace);
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        cursor: pointer;
        transition: opacity 0.15s;
      ">ENTENDIDO</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const closePopup = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 200); };
  overlay.querySelector('#info-cierre-ok').addEventListener('click', closePopup);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
}

async function checkLastDayClosure() {
  try {
    const res = await api('/cierre/verificar-ultimo-dia');
    if (res.need_cierre) {
      const fecha = res.fecha;
      if (res.cierres_path_configured) {
        // Generar automáticamente y avisar con popup informativo
        try {
          await api('/cierre/diario', { method: 'POST', body: JSON.stringify({ fecha }) });
          // Formatear fecha para el mensaje: "1 de junio de 2025"
          const [dd, mm, yyyy] = fecha.split('/');
          const meses = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
          const fechaLegible = `${parseInt(dd, 10)} de ${meses[parseInt(mm, 10)]} de ${yyyy}`;
          showInfoPopup(
            'Cierre Generado Automáticamente',
            `Se generó automáticamente el cierre de la sesión del <strong>${fechaLegible}</strong>`
          );
        } catch (err) {
          toast(err.message.includes('NO_CIERRES_PATH') ? 'CONFIGURAR CARPETA PRIMERO' : 'ERROR: ' + err.message, 'error');
        }
      } else {
        showConfirm('Cierre Pendiente', `La caja del último día con pedidos (${fecha}) no fue cerrada. Se requiere configurar la Carpeta de Cierres. ¿Ir a configuración?`, () => {
          navigateTo('resumen');
          switchResumenTab('ingresos');
          setTimeout(() => {
            const input = $('#cfg-cierres-path');
            if (input) {
              input.focus();
              input.select();
            }
          }, 300);
        });
      }
    }
  } catch (e) {
    console.error('Error al verificar cierre del último día:', e);
  }
}

function downloadBackup() { window.open(API + '/info/backup', '_blank'); }

function resetDia() {
  showConfirm('Reset Día', 'Se eliminarán TODOS los pedidos de hoy.', async () => {
    try { await api('/reset-dia', { method: 'POST', body: JSON.stringify({}) }); toast('DÍA RESETEADO', 'success'); loadPedidos(); }
    catch (e) { toast('ERROR: ' + e.message, 'error'); }
  });
}

// ── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Load and apply horizontal/vertical navigation layout alignment choice
  const isVertical = localStorage.getItem('layout-vertical') === 'true';
  const layoutChk = $('#cfg-layout-vertical');
  if (layoutChk) {
    layoutChk.checked = isVertical;
  }
  document.body.classList.toggle('layout-vertical', isVertical);
  if (isVertical) {
    updateSidebarTelemetry();
  }

  // Load and apply system sounds mute option
  const isMuted = localStorage.getItem('mute-system-sounds') === 'true';
  const muteChk = $('#cfg-mute-system-sounds');
  if (muteChk) {
    muteChk.checked = isMuted;
  }

  // Set today's date as default for pedidos
  const today = new Date();
  const yy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  $('#pedidos-fecha').value = `${yy}-${mm}-${dd}`;

  // Populate cierre mensual year dropdown and set defaults
  const anioSelect = $('#cierre-mes-anio');
  if (anioSelect) {
    for (let y = yy; y >= yy - 2; y--) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      anioSelect.appendChild(opt);
    }
    anioSelect.value = yy;
  }
  const mesSelect = $('#cierre-mes-mes');
  if (mesSelect) mesSelect.value = mm;
  
  loadPedidos();
  checkLastDayClosure();
  $('#status-info').textContent = 'SYS ONLINE // LA EXTRA TERMINAL';
  
  // Custom interactive keyboard-nav widgets initialization
  setupStrictTabCycle();
  setupPaymentWidgetEvents();
  setupVariantAreaKeyboard();
  setupNumericInputsAutoSelect();
  setupPedidoShiftEnter();

  // Stock Warning modal permanent button event listeners
  const ignoreBtn = $('#stock-warning-ignore-btn');
  if (ignoreBtn) {
    ignoreBtn.addEventListener('click', () => {
      $('#modal-stock-warning').classList.remove('open');
      if (_stockWarningIgnoreCallback) {
        const cb = _stockWarningIgnoreCallback;
        _stockWarningIgnoreCallback = null;
        cb();
      }
    });
  }
  const undoBtn = $('#stock-warning-undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      $('#modal-stock-warning').classList.remove('open');
      if (_stockWarningUndoCallback) {
        const cb = _stockWarningUndoCallback;
        _stockWarningUndoCallback = null;
        cb();
      }
    });
  }
  
  initHoldButton();

  // Initialize theme toggle button
  const themeToggle = $('#theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
    });
  }
});

setInterval(() => { if (currentSection === 'pedidos') loadPedidos(); }, 30000);

// ═══ GASTOS & STOCK ══════════════════════════════════════════════════════════

let currentGsTab    = 'stock';
let currentGastoTipo = 'fijo';
let stockData       = [];
let gastosData      = [];
let catalogoForStock = [];
let editingStockId  = null;
let editingGastoId  = null;
let ajusteStockId   = null;

const MESES_ES = ['','enero','febrero','marzo','abril','mayo','junio',
                  'julio','agosto','septiembre','octubre','noviembre','diciembre'];
const REC_LABELS = { diaria:'Diaria', semanal:'Semanal', mensual:'Mensual', anual:'Anual' };
const CAT_EMOJI  = { Bienes:'🛒', Equipamiento:'🔧', Servicios:'💡' };
const CAT_CLASS  = { Bienes:'badge-bienes', Equipamiento:'badge-equipamiento', Servicios:'badge-servicios' };

// ── Entry point ───────────────────────────────────────────────────────────────

async function loadGastosStock() {
  if (currentGsTab === 'stock') await loadStock();
  else await loadResumen();
}

function switchGsTab(tab) {
  currentGsTab = tab;
  $$('#gs-main-tabs .sub-tab').forEach(t => t.classList.toggle('active', t.dataset.gs === tab));
  $('#gs-stock-section').style.display   = tab === 'stock'  ? '' : 'none';
  $('#gs-detalle-section').style.display = tab === 'detalle' ? '' : 'none';
  if (tab === 'stock')  loadStock();
  if (tab === 'detalle') loadResumen();
}

function switchGastoTipo(tipo) {
  currentGastoTipo = tipo;
  $$('[data-gtipo]').forEach(t => t.classList.toggle('active', t.dataset.gtipo === tipo));
  renderGastos();
}

// ── Stock ─────────────────────────────────────────────────────────────────────

async function loadStock() {
  try {
    stockData = await api('/stock');
    catalogoForStock = await api('/productos');
    if (!stockTipos.length) {
      stockTipos = await api('/tipos');
    }
    // If no stock today and carryover mode is on, auto-populate from yesterday
    if (!stockData.length) {
      const cfg = await api('/config');
      if (cfg.reiniciar_stock_diariamente === false) {
        const res = await api('/stock/carryover', { method: 'POST', body: '{}' });
        if (res.added > 0) stockData = await api('/stock');
      }
    }
    renderStock();
    checkLowStock();
  } catch(e) { toast('ERROR STOCK: ' + e.message, 'error'); }
}

function onStockFilterChange() {
  renderStock();
}

function renderStock() {
  // Populate filter dropdown with product categories from stockTipos (excl. promos)
  const filterSel = $('#stock-filter-product');
  const selectedCatId = filterSel ? filterSel.value : '';

  if (filterSel) {
    const prevVal = filterSel.value;
    filterSel.innerHTML = '<option value="" style="color:var(--text-dark);">Todos los productos</option>' +
      stockTipos
        .filter(t => t.id !== 999)
        .map(t => `<option value="${t.id}" style="color:var(--text-dark);">${t.nombre}</option>`).join('');
    filterSel.value = prevVal;
  }

  const container = $('#stock-list');
  if (!container) return;

  if (!stockData.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px 0; color:var(--text-muted); font-family:var(--font-mono); font-size:0.82rem;">
        // Sin stock cargado para hoy<br>
        <span style="font-size:0.72rem; color:var(--text-light);">Usá el botón AGREGAR para cargar las cantidades del día.</span>
      </div>`;
    return;
  }

  let displayData = stockData;
  if (selectedCatId) {
    const catId = parseInt(selectedCatId, 10);
    displayData = stockData.filter(s => {
      const prod = catalogoForStock.find(p => p.id === s.producto_id);
      return prod && prod.tipo_id === catId;
    });
  }

  // Group items by product ID if category stock separation is enabled
  const grouped = {};
  displayData.forEach(s => {
    const prod = catalogoForStock.find(p => p.id === s.producto_id);
    const separate = prod && isProductStockSeparated(s.producto_id);
    if (separate) {
      if (!grouped[s.producto_id]) {
        grouped[s.producto_id] = {
          isGrouped: true,
          product: prod,
          items: []
        };
      }
      grouped[s.producto_id].items.push(s);
    } else {
      const uniqueKey = 'single_' + s.id;
      grouped[uniqueKey] = {
        isGrouped: false,
        product: prod,
        item: s
      };
    }
  });

  container.innerHTML = Object.values(grouped).map(g => {
    if (g.isGrouped) {
      const prod = g.product;
      const isInactive = prod && prod.sin_stock;
      
      const totalInicial = g.items.reduce((sum, item) => sum + parseFloat(item.cantidad_inicial || 0), 0);
      const totalActual = g.items.reduce((sum, item) => sum + parseFloat(item.cantidad_actual || 0), 0);
      
      const pct = totalInicial > 0 ? totalActual / totalInicial : 0;
      const pctDisplay = Math.max(0, Math.min(100, Math.round(pct * 100)));
      const barColor = isInactive ? 'var(--text-light)' : (pct > 0.66 ? 'var(--success)' : pct > 0.33 ? '#f39c12' : pct > 0 ? 'var(--accent-red)' : 'var(--text-light)');
      
      const estadoTag = isInactive
        ? `<span class="pc-estado" style="color:var(--text-light); border-color:var(--text-light); background:rgba(0,0,0,0.04);">INACTIVO</span>`
        : (totalActual === 0
            ? `<span class="pc-estado" style="color:var(--accent-red); border-color:var(--accent-red); background:rgba(231,76,60,0.06);">AGOTADO</span>`
            : `<span class="pc-estado" style="color:${barColor}; border-color:${barColor}; background:transparent; font-family:var(--font-mono);">${pctDisplay}%</span>`);
            
      const itemsHtml = g.items.map(item => {
        const itemPct = item.cantidad_inicial > 0 ? item.cantidad_actual / item.cantidad_inicial : 0;
        const itemPctDisplay = Math.max(0, Math.min(100, Math.round(itemPct * 100)));
        const itemBarColor = isInactive ? 'var(--text-light)' : (itemPct > 0.66 ? 'var(--success)' : itemPct > 0.33 ? '#f39c12' : itemPct > 0 ? 'var(--accent-red)' : 'var(--text-light)');
        
        return `
          <div style="margin-top: 10px; border-top: 1px dashed var(--bg-cool-gray); padding-top: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span class="variant-pill" style="display: inline-block; font-size: 0.72rem; padding: 2px 6px; cursor: default; background: rgba(0,0,0,0.02); color: var(--text-light); border-color: var(--bg-cool-gray); pointer-events: none; border-radius: 4px; font-family: var(--font-mono);">${item.var_tipo || 'General'}</span>
            </div>
            <div style="margin: 4px 0 6px;">
              <div style="height: 8px; background: var(--bg-off-white); border: 1px solid var(--bg-cool-gray); border-radius: 6px; overflow: hidden;">
                <div style="height: 100%; width: ${itemPctDisplay}%; background: ${itemBarColor}; border-radius: 6px; transition: width 0.5s cubic-bezier(0.4,0,0.2,1);"></div>
              </div>
            </div>
            <div class="pc-bottom" style="margin-top: 0; padding-top: 2px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-family: var(--font-head); font-weight: 700; font-size: 0.9rem; color: ${itemBarColor};">
                ${formatStockValue(item.cantidad_actual)} / ${formatStockValue(item.cantidad_inicial)} ${item.unidad}
              </span>
              <div class="pc-actions">
                <button class="btn btn-sm btn-ghost" onclick="openStockAjuste(${item.id})">✎ AJUSTAR</button>
                <button class="btn btn-sm btn-ghost btn-danger" onclick="deleteStockItem(${item.id})">✕</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="stock-card" style="${isInactive ? 'opacity:0.65;' : ''}">
          <div class="pc-top" style="margin-bottom: 4px;">
            <span class="pc-cliente" style="${isInactive ? 'color:var(--text-light);' : ''}">${prod ? prod.nombre : ''} <span style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-light); font-weight: normal; margin-left: 6px;">[${formatStockValue(totalActual)}/${formatStockValue(totalInicial)}]</span></span>
            ${estadoTag}
          </div>
          ${itemsHtml}
        </div>
      `;
    } else {
      const s = g.item;
      const prod = g.product;
      const isInactive = prod && prod.sin_stock;

      const pct = s.cantidad_inicial > 0 ? s.cantidad_actual / s.cantidad_inicial : 0;
      const pctDisplay = Math.max(0, Math.min(100, Math.round(pct * 100)));
      const barColor = isInactive ? 'var(--text-light)' : (pct > 0.66 ? 'var(--success)' : pct > 0.33 ? '#f39c12' : pct > 0 ? 'var(--accent-red)' : 'var(--text-light)');
      const estadoTag = isInactive
        ? `<span class="pc-estado" style="color:var(--text-light); border-color:var(--text-light); background:rgba(0,0,0,0.04);">INACTIVO</span>`
        : (s.cantidad_actual === 0
            ? `<span class="pc-estado" style="color:var(--accent-red); border-color:var(--accent-red); background:rgba(231,76,60,0.06);">AGOTADO</span>`
            : `<span class="pc-estado" style="color:${barColor}; border-color:${barColor}; background:transparent; font-family:var(--font-mono);">${pctDisplay}%</span>`);
      return `
        <div class="stock-card" style="${isInactive ? 'opacity:0.65;' : ''}">
          <div class="pc-top">
            <span class="pc-cliente" style="${isInactive ? 'color:var(--text-light);' : ''}">${s.nombre}</span>
            ${estadoTag}
          </div>
          <div style="margin:6px 0 8px;">
            <div style="height:8px; background:var(--bg-off-white); border:1px solid var(--bg-cool-gray); border-radius:6px; overflow:hidden;">
              <div style="height:100%; width:${pctDisplay}%; background:${barColor}; border-radius:6px; transition:width 0.5s cubic-bezier(0.4,0,0.2,1);"></div>
            </div>
          </div>
          <div class="pc-bottom">
            <span style="font-family:var(--font-head); font-weight:700; font-size:1rem; color:${barColor};">
              ${formatStockValue(s.cantidad_actual)} / ${formatStockValue(s.cantidad_inicial)} ${s.unidad}
            </span>
            <div class="pc-actions">
              <button class="btn btn-sm btn-ghost" onclick="openStockAjuste(${s.id})">✎ AJUSTAR</button>
              <button class="btn btn-sm btn-ghost btn-danger" onclick="deleteStockItem(${s.id})">✕</button>
            </div>
          </div>
        </div>`;
    }
  }).join('');
}

// Stock modal — producto es el campo principal (sin nombre libre)
let stockTipos = [];
async function openStockModal(sid = null) {
  editingStockId = sid;
  try {
    if (!catalogoForStock.length) {
      catalogoForStock = await api('/productos');
    }
    stockTipos = await api('/tipos');
  } catch (e) {}

  // Populate Categoría select
  const catSel = $('#stock-categoria-sel');
  if (catSel) {
    catSel.innerHTML = '<option value="" disabled selected>Seleccionar</option>' +
      stockTipos
        .filter(t => t.id !== 999)
        .map(t => `<option value="${t.id}">${t.nombre}</option>`)
        .join('');
  }

  const qtyGroup = $('#stock-cantidad-group');
  if (qtyGroup) qtyGroup.style.display = 'block';

  if (sid) {
    const item = stockData.find(s => s.id === sid);
    if (!item) return;
    $('#stock-modal-title').textContent = '// EDITAR STOCK';
    $('#stock-submit-btn').textContent  = 'GUARDAR CAMBIOS';

    // Find product to know its category
    const prod = catalogoForStock.find(p => p.id === item.producto_id);
    if (catSel) {
      catSel.value = prod ? (prod.tipo_id || '') : '';
    }

    // Populate products based on category
    filterStockProducts();

    $('#stock-producto-id').value = item.producto_id || '';
    $('#stock-cantidad').value = item.cantidad_inicial;
    $('#stock-unidad').value   = item.unidad || 'unidades';

    // Hide cooking checkboxes when editing single stock entry
    const coccionGroup = $('#stock-coccion-group');
    const coccionContainer = $('#stock-coccion-checkboxes');
    if (coccionGroup) coccionGroup.style.display = 'none';
    if (coccionContainer) coccionContainer.innerHTML = '';
  } else {
    $('#stock-modal-title').textContent = '// CARGAR STOCK';
    $('#stock-submit-btn').textContent  = 'AGREGAR';
    if (catSel) catSel.value = '';

    // Populate and disable product dropdown
    filterStockProducts();

    $('#stock-producto-id').value = '';
    $('#stock-cantidad').value = 1;
    $('#stock-unidad').value   = 'unidades';

    // Hide cooking checkboxes on open
    const coccionGroup = $('#stock-coccion-group');
    const coccionContainer = $('#stock-coccion-checkboxes');
    if (coccionGroup) coccionGroup.style.display = 'none';
    if (coccionContainer) coccionContainer.innerHTML = '';
  }
  $('#modal-stock').classList.add('open');
  if (catSel) {
    setTimeout(() => catSel.focus(), 80);
  } else {
    setTimeout(() => $('#stock-producto-id').focus(), 80);
  }
}

function isProductFullyAdded(p) {
  const existingEntries = stockData.filter(s => s.producto_id === p.id && (!editingStockId || s.id !== editingStockId));
  if (existingEntries.length === 0) return false;
  
  if (isProductStockSeparated(p.id)) {
    const list = (typeof stockTipos !== 'undefined' && stockTipos && stockTipos.length) ? stockTipos : ((typeof tiposData !== 'undefined') ? tiposData : []);
    const tipo = list.find(t => t.id === p.tipo_id);
    const options = tipo ? tipo.variantes_tipo || [] : [];
    if (options.length === 0) return true;
    
    return options.every(opt => existingEntries.some(s => s.var_tipo === opt));
  }
  return true;
}

function onStockProductoChange() {
  const prodId = parseInt($('#stock-producto-id').value, 10);
  const prod = catalogoForStock.find(p => p.id === prodId);
  const coccionGroup = $('#stock-coccion-group');
  const coccionContainer = $('#stock-coccion-checkboxes');
  const qtyGroup = $('#stock-cantidad-group');
  
  if (!prod || !isProductStockSeparated(prodId)) {
    if (coccionGroup) coccionGroup.style.display = 'none';
    if (coccionContainer) coccionContainer.innerHTML = '';
    if (qtyGroup) qtyGroup.style.display = 'block';
    return;
  }
  
  const list = (typeof stockTipos !== 'undefined' && stockTipos && stockTipos.length) ? stockTipos : ((typeof tiposData !== 'undefined') ? tiposData : []);
  const tipo = list.find(t => t.id === prod.tipo_id);
  const options = tipo ? tipo.variantes_tipo || [] : [];
  
  if (options.length === 0) {
    if (coccionGroup) coccionGroup.style.display = 'none';
    if (coccionContainer) coccionContainer.innerHTML = '';
    if (qtyGroup) qtyGroup.style.display = 'block';
    return;
  }
  
  if (qtyGroup) qtyGroup.style.display = 'none';
  
  const existingEntries = stockData.filter(s => s.producto_id === prodId && (!editingStockId || s.id !== editingStockId));
  const existingVarTipos = existingEntries.map(s => s.var_tipo);
  
  if (coccionContainer) {
    coccionContainer.innerHTML = options.map(opt => {
      const isAlreadyInStock = existingVarTipos.includes(opt);
      const checkedAttr = isAlreadyInStock ? '' : 'checked';
      const disabledAttr = isAlreadyInStock ? 'disabled' : '';
      const labelSuffix = isAlreadyInStock ? ' <span style="color:var(--text-light); font-size:0.75rem;">(Ya agregado)</span>' : '';
      
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:6px; ${isAlreadyInStock ? 'opacity:0.6;' : ''}">
          <label class="sf-check" style="margin-bottom:0; flex:1; ${isAlreadyInStock ? 'pointer-events:none;' : ''}">
            <input type="checkbox" name="stock-coccion-opt" value="${opt}" ${checkedAttr} ${disabledAttr} onchange="const qtyInput = this.closest('div').querySelector('.stock-coccion-qty'); if (qtyInput) qtyInput.disabled = !this.checked;">
            <span class="box"></span>
            <span style="font-size:0.85rem;">${opt}${labelSuffix}</span>
          </label>
          <input type="number" class="stock-coccion-qty" data-opt="${opt}" min="0" step="any" value="1" ${isAlreadyInStock ? 'disabled' : ''} style="width:85px; padding: 4px 8px; border: 1px solid var(--bg-cool-gray); border-radius: 4px; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-dark); background: var(--bg-off-white);">
        </div>
      `;
    }).join('');
  }
  if (coccionGroup) coccionGroup.style.display = 'block';
}

function onStockCategoriaChange() {
  filterStockProducts();
}

function filterStockProducts() {
  const catSel = $('#stock-categoria-sel');
  const prodSel = $('#stock-producto-id');
  if (!prodSel) return;

  const catVal = catSel ? catSel.value : '';
  if (!catVal) {
    prodSel.innerHTML = '<option value="" disabled selected>Seleccionar</option>';
    prodSel.disabled = true;
    return;
  }

  prodSel.disabled = false;
  const tid = parseInt(catVal, 10);
  const filteredProds = catalogoForStock.filter(p => p.tipo_id === tid && p.tipo_id !== 999);

  prodSel.innerHTML = '<option value="" disabled selected>Seleccionar</option>' +
    filteredProds
      .map(p => {
        const isFullyAdded = isProductFullyAdded(p);
        const disabledAttr = isFullyAdded ? 'disabled style="color:var(--text-light);"' : '';
        const suffix = isFullyAdded ? ' (Ya agregado)' : '';
        return `<option value="${p.id}" ${disabledAttr}>${p.nombre}${suffix}</option>`;
      })
      .join('');
}

function closeStockModal() { $('#modal-stock').classList.remove('open'); }

async function submitStock() {
  const producto_id = parseInt($('#stock-producto-id').value, 10) || null;
  if (!producto_id) { toast('Seleccioná un producto', 'error'); return; }

  const prod = catalogoForStock.find(p => p.id === producto_id);
  const isSeparated = isProductStockSeparated(producto_id);

  if (prod && isSeparated && !editingStockId) {
    const checkedOpts = Array.from(document.querySelectorAll('input[name="stock-coccion-opt"]:checked'));
    if (checkedOpts.length === 0) {
      toast('Seleccioná al menos una opción de cocción', 'error');
      return;
    }
    
    const payloads = [];
    const unidadRaw = $('#stock-unidad').value;
    const unidad = 'unidades';

    for (const cb of checkedOpts) {
      const opt = cb.value;
      const qtyInput = cb.closest('div').querySelector('.stock-coccion-qty');
      const qtyVal = parseFloat(qtyInput ? qtyInput.value : 0);
      if (isNaN(qtyVal) || qtyVal <= 0) {
        toast(`La cantidad para ${opt} debe ser mayor a 0`, 'error');
        if (qtyInput) qtyInput.focus();
        return;
      }
      let finalQty = qtyVal;
      if (unidadRaw === 'docenas') {
        finalQty = finalQty * 12;
      }
      payloads.push({ producto_id, cantidad_inicial: finalQty, unidad, var_tipo: opt });
    }

    try {
      for (const payload of payloads) {
        await api('/stock', { method: 'POST', body: JSON.stringify(payload) });
      }
      toast('STOCK AGREGADO', 'success');
      closeStockModal();
      await loadStock();
    } catch(e) { toast('ERROR: ' + e.message, 'error'); }
  } else {
    const cantidadRaw    = parseFloat($('#stock-cantidad').value);
    const unidadRaw      = $('#stock-unidad').value;
    if (isNaN(cantidadRaw) || cantidadRaw <= 0) { toast('La cantidad debe ser mayor a 0', 'error'); return; }

    let cantidad = cantidadRaw;
    let unidad = 'unidades';
    if (unidadRaw === 'docenas') {
      cantidad = cantidad * 12;
    }

    try {
      if (editingStockId) {
        await api(`/stock/${editingStockId}`, { method: 'PUT',
          body: JSON.stringify({ producto_id, cantidad_inicial: cantidad, unidad }) });
        toast('STOCK ACTUALIZADO', 'success');
      } else {
        await api('/stock', { method: 'POST',
          body: JSON.stringify({ producto_id, cantidad_inicial: cantidad, unidad, var_tipo: "" }) });
        toast('STOCK AGREGADO', 'success');
      }
      closeStockModal();
      await loadStock();
    } catch(e) { toast('ERROR: ' + e.message, 'error'); }
  }
}

// Ajuste manual de cantidad actual
function openStockAjuste(sid) {
  ajusteStockId = sid;
  const item = stockData.find(s => s.id === sid);
  if (!item) return;
  $('#ajuste-item-nombre').textContent =
    `${item.nombre} — quedan: ${formatStockValue(item.cantidad_actual)} de ${formatStockValue(item.cantidad_inicial)} ${item.unidad}`;
  $('#ajuste-operacion').value = 'agregar';
  $('#ajuste-cantidad').value = ''; // Blank by default for immediate typing
  $('#modal-stock-ajuste').classList.add('open');
  setTimeout(() => $('#ajuste-cantidad').focus(), 80);
}

function closeStockAjuste() { $('#modal-stock-ajuste').classList.remove('open'); }

async function submitAjuste() {
  const op = $('#ajuste-operacion').value;
  const qty = parseFloat($('#ajuste-cantidad').value);
  if (isNaN(qty) || qty < 0) { toast('Cantidad inválida', 'error'); return; }
  const item = stockData.find(s => s.id === ajusteStockId);
  if (!item) return;

  let body = {};
  if (op === 'agregar') {
    if (qty <= 0) { toast('Cantidad a agregar debe ser mayor a 0', 'error'); return; }
    body.cantidad_inicial = item.cantidad_inicial + qty;
  } else if (op === 'restar') {
    if (qty <= 0) { toast('Cantidad a restar debe ser mayor a 0', 'error'); return; }
    body.cantidad_actual = Math.max(0, item.cantidad_actual - qty);
  } else if (op === 'indicar') {
    if (qty > item.cantidad_inicial) {
      body.cantidad_inicial = qty;
      body.cantidad_actual = qty;
    } else {
      body.cantidad_actual = qty;
    }
  }

  try {
    await api(`/stock/${ajusteStockId}`, { method: 'PUT', body: JSON.stringify(body) });
    toast('STOCK ACTUALIZADO', 'success');
    closeStockAjuste();
    await loadStock();
  } catch(e) { toast('ERROR: ' + e.message, 'error'); }
}

async function deleteStockItem(sid) {
  showConfirm('Eliminar Stock', '¿Eliminar este ítem de stock?', async () => {
    try {
      await api(`/stock/${sid}`, { method: 'DELETE' });
      toast('ÍTEM ELIMINADO', 'success');
      await loadStock();
    } catch(e) { toast('ERROR: ' + e.message, 'error'); }
  });
}



// ── Gastos ────────────────────────────────────────────────────────────────────


async function loadGastos() {
  try {
    gastosData = await api('/gastos');
    renderGastos();
  } catch(e) { toast('ERROR GASTOS: ' + e.message, 'error'); }
}

function formatRecurrencia(rec) {
  if (!rec) return '';
  if (rec.includes('_')) {
    const [cant, unit] = rec.split('_');
    const unitLabel = unit === 'dias' ? 'días' : unit === 'semanas' ? 'semanas' : 'meses';
    return `Cada ${cant} ${unitLabel}`;
  }
  return REC_LABELS[rec] || rec;
}

function renderGastos() {
  const container = $('#gastos-list');
  if (!container) return;
  const filtered = gastosData.filter(g => g.tipo === currentGastoTipo);
  if (!filtered.length) {
    const tipoLabel = currentGastoTipo === 'fijo' ? 'gastos fijos' : 'gastos particulares';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${currentGastoTipo === 'fijo' ? '🔄' : '📋'}</div>
        <p>// No hay ${tipoLabel} registrados</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(g => {
    const catClass = CAT_CLASS[g.categoria] || '';
    const catEmoji = CAT_EMOJI[g.categoria] || '';
    const recTag = g.tipo === 'fijo'
      ? `<span class="gasto-rec-badge">${formatRecurrencia(g.recurrencia)}</span>`
      : `<span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted);">${g.fecha || ''}</span>`;
    const activoToggle = g.tipo === 'fijo' ? `
      <label class="sf-check sf-check-sm" title="${g.activo ? 'Activo (click para desactivar)' : 'Inactivo (click para activar)'}">
        <input type="checkbox" ${g.activo ? 'checked' : ''} onchange="toggleGastoActivo(${g.id}, this.checked)">
        <span class="box"></span>
        ${g.activo ? 'Activo' : 'Inactivo'}
      </label>` : '';
    return `
      <div class="gasto-card ${!g.activo ? 'gasto-inactivo' : ''}">
        <div class="gasto-card-left">
          <span class="gasto-badge ${catClass}">${catEmoji} ${g.categoria}</span>
          <span class="gasto-nombre">${g.nombre}</span>
          ${g.descripcion ? `<span class="gasto-desc">${g.descripcion}</span>` : ''}
        </div>
        <div class="gasto-card-right">
          <span class="gasto-monto">${fmtMoney(g.monto)}</span>
          ${recTag}
          ${activoToggle}
          <div class="gasto-actions">
            <button class="btn btn-sm btn-ghost" onclick="openGastoModal(${g.id})" title="Editar">✎</button>
            <button class="btn btn-sm btn-ghost btn-danger" onclick="deleteGasto(${g.id})" title="Eliminar">✕</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

// Balance cards (top of gastos section)
async function loadBalanceCards() {
  try {
    const now = new Date();
    const mes = String(now.getMonth()+1).padStart(2,'0') + '/' + now.getFullYear();
    const bal = await api(`/resumen/balance?mes=${mes}`);
    const neto = bal.resultado_neto;
    const netoColor = neto >= 0 ? 'var(--success)' : 'var(--accent-red)';
    const mesLabel = `${MESES_ES[parseInt(mes.split('/')[0],10)].charAt(0).toUpperCase() + MESES_ES[parseInt(mes.split('/')[0],10)].slice(1)} ${mes.split('/')[1]}`;
    const cards = $('#gastos-balance-cards');
    if (!cards) return;
    cards.innerHTML = `
      <div class="gs-balance-card">
        <div class="gs-balance-label">Ingresos del mes</div>
        <div class="gs-balance-value" style="color:var(--success);">${fmtMoney(bal.ingresos)}</div>
        <div class="gs-balance-sub">${mesLabel}</div>
      </div>
      <div class="gs-balance-card">
        <div class="gs-balance-label">Gastos del mes</div>
        <div class="gs-balance-value" style="color:var(--accent-red);">${fmtMoney(bal.total_gastos)}</div>
        <div class="gs-balance-sub">${bal.gastos_fijos.length} fijos · ${bal.gastos_particulares.length} particulares</div>
      </div>
      <div class="gs-balance-card gs-balance-card-neto">
        <div class="gs-balance-label">Resultado neto</div>
        <div class="gs-balance-value" style="color:${netoColor}; font-size:1.3rem;">${neto >= 0 ? '+' : ''}${fmtMoney(neto)}</div>
        <div class="gs-balance-sub">${neto >= 0 ? '▲ Superávit' : '▼ Déficit'}</div>
      </div>`;
  } catch(e) { console.error('Balance error:', e); }
}

// Gasto modal input formatting
document.addEventListener('DOMContentLoaded', () => {
  const montoInput = $('#gasto-monto');
  if (montoInput) {
    montoInput.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace') {
        const selStart = this.selectionStart;
        const selEnd = this.selectionEnd;
        if (selStart === selEnd && selStart > 0) {
          if (this.value[selStart - 1] === ' ') {
            e.preventDefault();
            const leftPart = this.value.substring(0, selStart - 2);
            const rightPart = this.value.substring(selStart);
            this.value = leftPart + rightPart;
            
            const formatted = formatNumberWithSpaces(this.value);
            this.value = formatted;
            const newPos = Math.max(0, selStart - 2);
            this.setSelectionRange(newPos, newPos);
            this.dispatchEvent(new Event('input'));
          }
        }
      }
    });

    montoInput.addEventListener('input', function(e) {
      const originalValue = this.value;
      const cleanValue = originalValue.replace(/\D/g, '');
      const formattedValue = formatNumberWithSpaces(cleanValue);
      
      if (originalValue === formattedValue) return;

      const selectionStart = this.selectionStart;
      
      let digitsBeforeCursor = 0;
      for (let i = 0; i < selectionStart; i++) {
        if (/\d/.test(originalValue[i])) {
          digitsBeforeCursor++;
        }
      }
      
      this.value = formattedValue;
      
      let targetCursorPos = 0;
      let currentDigits = 0;
      for (let i = 0; i < formattedValue.length; i++) {
        if (/\d/.test(formattedValue[i])) {
          currentDigits++;
        }
        targetCursorPos = i + 1;
        if (currentDigits === digitsBeforeCursor) {
          break;
        }
      }
      
      this.setSelectionRange(targetCursorPos, targetCursorPos);
    });
  }
});

// Gasto modal
function onGastoCategoriaChange() {
  const cat = $('#gasto-categoria').value;
  const nombreInput = $('#gasto-nombre');
  if (cat === 'Bienes') {
    nombreInput.placeholder = 'harina, aceite, carne...';
  } else if (cat === 'Equipamiento') {
    nombreInput.placeholder = 'plancha, horno, cuchillos...';
  } else if (cat === 'Servicios') {
    nombreInput.placeholder = 'luz, gas, agua...';
  } else {
    nombreInput.placeholder = 'Selecciona una categoría...';
  }
}

function openGastoModal(gid = null) {
  editingGastoId = gid;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const dd = String(today.getDate()).padStart(2,'0');

  if (gid) {
    const g = gastosData.find(x => x.id === gid);
    if (!g) return;
    $('#gasto-modal-title').textContent = '// EDITAR GASTO';
    $('#gasto-submit-btn').textContent = 'GUARDAR CAMBIOS';
    document.querySelector(`input[name="gasto-tipo"][value="${g.tipo}"]`).checked = true;
    $('#gasto-nombre').value = g.nombre;
    $('#gasto-categoria').value = g.categoria;
    $('#gasto-monto').value = formatNumberWithSpaces(g.monto);
    $('#gasto-descripcion').value = g.descripcion || '';

    if (g.tipo === 'particular') {
      if (g.fecha) {
        try {
          const [d2, m2, y2] = g.fecha.split('/');
          $('#gasto-fecha').value = `${y2}-${m2}-${d2}`;
        } catch(e) {}
      }
    } else {
      // fixed expense recurrence
      if (g.fecha) {
        try {
          const [d2, m2, y2] = g.fecha.split('/');
          $('#gasto-recurrencia-fecha').value = `${y2}-${m2}-${d2}`;
        } catch(e) {}
      }
      
      const rec = g.recurrencia || '1_meses';
      if (rec.includes('_')) {
        const [cant, unit] = rec.split('_');
        $('#gasto-recurrencia-cantidad').value = cant;
        $('#gasto-recurrencia-intervalo').value = unit;
      } else {
        // backward compatibility mapping
        let cant = 1;
        let unit = 'meses';
        if (rec === 'diaria') { cant = 1; unit = 'dias'; }
        else if (rec === 'semanal') { cant = 1; unit = 'semanas'; }
        else if (rec === 'anual') { cant = 12; unit = 'meses'; }
        $('#gasto-recurrencia-cantidad').value = cant;
        $('#gasto-recurrencia-intervalo').value = unit;
      }
    }
  } else {
    $('#gasto-modal-title').textContent = '// NUEVO GASTO';
    $('#gasto-submit-btn').textContent = 'GUARDAR GASTO';
    document.querySelector('input[name="gasto-tipo"][value="particular"]').checked = true;
    $('#gasto-nombre').value = '';
    $('#gasto-categoria').value = ''; // Defaults to "— Elegir categoría —"
    $('#gasto-monto').value = '';
    $('#gasto-descripcion').value = '';
    $('#gasto-fecha').value = `${yyyy}-${mm}-${dd}`;
    $('#gasto-recurrencia-fecha').value = `${yyyy}-${mm}-${dd}`;
    $('#gasto-recurrencia-cantidad').value = 1;
    $('#gasto-recurrencia-intervalo').value = 'meses';
  }

  onGastoCategoriaChange();
  onGastoTipoChange();
  $('#modal-gasto').classList.add('open');
  setTimeout(() => $('#gasto-nombre').focus(), 100);
}

function closeGastoModal() { $('#modal-gasto').classList.remove('open'); }

function onGastoTipoChange() {
  const tipo = document.querySelector('input[name="gasto-tipo"]:checked')?.value || 'particular';
  $('#gasto-recurrencia-group').style.display = tipo === 'fijo'      ? 'block' : 'none';
  $('#gasto-fecha-group').style.display       = tipo === 'particular'? 'block' : 'none';
}

async function submitGasto() {
  const tipo      = document.querySelector('input[name="gasto-tipo"]:checked')?.value || 'particular';
  const nombre    = $('#gasto-nombre').value.trim();
  const categoria = $('#gasto-categoria').value;
  const montoRaw  = parseFloat($('#gasto-monto').value.replace(/\s/g, ''));
  const descripcion = $('#gasto-descripcion').value.trim();

  if (!nombre) { toast('El nombre es obligatorio', 'error'); return; }
  if (!categoria) { toast('La categoría es obligatoria', 'error'); return; }
  if (isNaN(montoRaw) || montoRaw <= 0) { toast('El monto debe ser mayor a 0', 'error'); return; }

  let fecha = '';
  let recurrencia = '';

  if (tipo === 'particular') {
    const fechaInput = $('#gasto-fecha').value;
    if (!fechaInput) { toast('La fecha es obligatoria', 'error'); return; }
    const [y, m, d] = fechaInput.split('-');
    fecha = `${d}/${m}/${y}`;
    recurrencia = null;
  } else {
    const recFechaInput = $('#gasto-recurrencia-fecha').value;
    if (!recFechaInput) { toast('La fecha de repetición es obligatoria', 'error'); return; }
    const [y, m, d] = recFechaInput.split('-');
    fecha = `${d}/${m}/${y}`;

    const cant = parseInt($('#gasto-recurrencia-cantidad').value) || 1;
    const unit = $('#gasto-recurrencia-intervalo').value || 'meses';
    recurrencia = `${cant}_${unit}`;
  }

  const body = { nombre, categoria, tipo, monto: montoRaw, recurrencia, fecha, descripcion };
  try {
    if (editingGastoId) {
      await api(`/gastos/${editingGastoId}`, { method: 'PUT', body: JSON.stringify(body) });
      toast('GASTO ACTUALIZADO', 'success');
    } else {
      await api('/gastos', { method: 'POST', body: JSON.stringify(body) });
      toast('GASTO REGISTRADO', 'success');
    }
    closeGastoModal();
    await loadGastos();
    await loadBalanceCards();
  } catch(e) { toast('ERROR: ' + e.message, 'error'); }
}

async function toggleGastoActivo(gid, activo) {
  try {
    await api(`/gastos/${gid}`, { method: 'PUT', body: JSON.stringify({ activo }) });
    const g = gastosData.find(x => x.id === gid);
    if (g) g.activo = activo;
    await loadBalanceCards();
    toast(activo ? 'GASTO ACTIVADO' : 'GASTO DESACTIVADO', 'success');
  } catch(e) { toast('ERROR: ' + e.message, 'error'); }
}

async function deleteGasto(gid) {
  showConfirm('Eliminar Gasto', '¿Eliminar este gasto?', async () => {
    try {
      await api(`/gastos/${gid}`, { method: 'DELETE' });
      toast('GASTO ELIMINADO', 'success');
      await loadGastos();
      await loadBalanceCards();
    } catch(e) { toast('ERROR: ' + e.message, 'error'); }
  });
}


// ── WHATSAPP INTEGRATION REMOVED ──

// ── BORRAR DATOS MODAL & HOLD LOGIC ──────────────────────────────────────────
let holdTimer = null;
let holdStartTime = 0;
const holdDuration = 3000; // 3 seconds
let holdProgressInterval = null;

function openBorrarDatosModal() {
  const modal = $('#modal-borrar-datos');
  if (modal) {
    modal.style.display = 'flex';
    $('#del-catalogo').checked = false;
    $('#del-pedidos').checked = false;
    
    // Reset hold button state
    const text = $('#btn-confirm-text');
    const progress = $('#btn-confirm-progress');
    if (text) text.style.opacity = '1';
    if (progress) progress.style.width = '0%';
  }
}

function closeBorrarDatosModal() {
  const modal = $('#modal-borrar-datos');
  if (modal) modal.style.display = 'none';
}

function initHoldButton() {
  const btn = $('#btn-confirm-delete');
  const progress = $('#btn-confirm-progress');
  const text = $('#btn-confirm-text');
  
  if (!btn) return;
  
  const startHold = (e) => {
    e.preventDefault();
    const delCatalog = $('#del-catalogo').checked;
    const delPedidos = $('#del-pedidos').checked;
    
    if (!delCatalog && !delPedidos) {
      toast('SELECCIONÁ AL MENOS UNA OPCIÓN', 'error');
      return;
    }
    
    text.style.opacity = '0';
    btn.classList.add('holding');
    SFX.startChargeSound();
    holdStartTime = Date.now();
    
    if (holdProgressInterval) clearInterval(holdProgressInterval);
    holdProgressInterval = setInterval(() => {
      const elapsed = Date.now() - holdStartTime;
      const pct = Math.min(100, (elapsed / holdDuration) * 100);
      progress.style.width = pct + '%';
      
      if (elapsed >= holdDuration) {
        endHold();
        executeDataDeletion();
      }
    }, 30);
  };
  
  const endHold = () => {
    if (holdProgressInterval) {
      clearInterval(holdProgressInterval);
      holdProgressInterval = null;
    }
    btn.classList.remove('holding');
    SFX.stopChargeSound();
    text.style.opacity = '1';
    progress.style.width = '0%';
  };
  
  // Mouse events
  btn.addEventListener('mousedown', startHold);
  btn.addEventListener('mouseup', endHold);
  btn.addEventListener('mouseleave', endHold);
  
  // Touch events
  btn.addEventListener('touchstart', startHold);
  btn.addEventListener('touchend', endHold);
  btn.addEventListener('touchcancel', endHold);
}

async function executeDataDeletion() {
  const delCatalog = $('#del-catalogo').checked;
  const delPedidos = $('#del-pedidos').checked;
  
  closeBorrarDatosModal();
  toast('ELIMINANDO DATOS...', 'info');
  
  try {
    const res = await api('/borrar-datos', {
      method: 'POST',
      body: JSON.stringify({
        clear_catalog: delCatalog,
        clear_orders: delPedidos
      })
    });
    
    if (res.success) {
      toast('DATOS ELIMINADOS CON ÉXITO', 'success');
      
      if (delCatalog || delPedidos) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  } catch (e) {
    toast('ERROR AL BORRAR: ' + e.message, 'error');
  }
}

// ── GLOBAL SHORTCUTS & MODAL FOCUS TRAP ──────────────────────────────────────
document.addEventListener('keydown', function(e) {
  // 1. Shift+Enter to submit order when order modal is open
  if (e.key === 'Enter' && e.shiftKey) {
    const modal = document.getElementById('modal-pedido');
    if (modal && modal.classList.contains('open')) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof variantStep !== 'undefined' && variantStep) return;
      submitPedido();
    }
  }

  // 2. Strict Tab focus trapping inside open modals
  if (e.key === 'Tab') {
    const openOverlay = Array.from(document.querySelectorAll('.modal-overlay')).find(el => {
      return el.classList.contains('open') || window.getComputedStyle(el).display !== 'none';
    });
    if (openOverlay) {
      const focusables = openOverlay.querySelectorAll('input, select, textarea, button, [tabindex="0"]');
      const visibleFocusables = Array.from(focusables).filter(el => {
        if (el.disabled || el.tabIndex === -1) return false;
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
      });

      if (visibleFocusables.length > 0) {
        const first = visibleFocusables[0];
        const last = visibleFocusables[visibleFocusables.length - 1];
        const active = document.activeElement;

        if (!openOverlay.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      } else {
        e.preventDefault();
      }
    }
  }
});

