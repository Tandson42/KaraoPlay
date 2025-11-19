// ======== Estado Compartilhado, Utilitários e Otimizações de Busca ========

// Estado da aplicação
let clienteAtual = null;
let fila = [];
let tocandoAgora = null;
let musicasTocadas = 0;
let adminLogado = false;

// YouTube API
const YOUTUBE_API_KEY = 'AIzaSyCBKOt1b3Yx9GYaVS68tmdDzwny1i7tDfE'; // INSIRA SUA CHAVE DA YOUTUBE DATA API V3 AQUI
let youtubePlayer = null;

// ======== Otimizações de Busca (Estado e Utils) ========
// Estado de busca e cota
let lastQueryTerm = '';
let lastResultsByTerm = new Map(); // termo -> { data, expiresAt }
let lastPageTokenByTerm = new Map(); // termo -> { nextPageToken, prevPageToken }
let currentRequestId = 0; // controle de corrida
let searchCooldownUntil = 0; // epoch ms

function cacheKey(term) { return `yt_search_${term}`; }
function saveCache(term, payload, ttlMs = 20 * 60 * 1000) { // 20 minutos
  const expiresAt = Date.now() + ttlMs;
  lastResultsByTerm.set(term, { data: payload, expiresAt });
  try {
    sessionStorage.setItem(cacheKey(term), JSON.stringify({ data: payload, expiresAt }));
  } catch (_) {}
}
function readCache(term) {
  const mem = lastResultsByTerm.get(term);
  if (mem && mem.expiresAt > Date.now()) return mem.data;
  try {
    const raw = sessionStorage.getItem(cacheKey(term));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt > Date.now()) {
      lastResultsByTerm.set(term, parsed);
      return parsed.data;
    }
  } catch (_) {}
  return null;
}

// Debounce genérico
function debounce(fn, wait = 500) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Referências de DOM
const playerContainer = document.getElementById("player-container");
const resultadosDiv = document.getElementById("resultados");
const filaLista = document.getElementById("fila-lista");
const totalFila = document.getElementById("total-fila");
const totalFilaStat = document.getElementById("total-fila-stat");
const totalTocadas = document.getElementById("total-tocadas");
const totalCatalogo = document.getElementById("total-catalogo");

// Utilitário: escapar HTML para evitar XSS em títulos
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Notificações toast simples
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-20 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-3 md:px-6 md:py-3 rounded-xl shadow-2xl z-50 notification-enter max-w-xs md:max-w-sm';
  notification.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-lg">✓</span>
      <p class="text-sm md:text-base font-semibold">${message}</p>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    notification.style.transition = 'all 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
