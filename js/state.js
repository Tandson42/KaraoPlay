// ======== Estado Compartilhado, Utilitários e Otimizações de Busca ========

// Estado da aplicação
let clienteAtual = null;
let fila = [];
let tocandoAgora = null;
let musicasTocadas = 0;
let adminLogado = false;

// YouTube API
const YOUTUBE_API_KEY = 'AIzaSyDx2m7o4INCaGujCJMjcLQYtM1pDYN64tY'; // INSIRA SUA CHAVE DA YOUTUBE DATA API V3 AQUI
let youtubePlayer = null;

// ======== Otimizações de Busca (Estado e Utils) ========
// Estado de busca e cota
let lastQueryTerm = '';
let lastResultsByTerm = new Map(); // termo -> { data, expiresAt }
let lastPageTokenByTerm = new Map(); // termo -> { nextPageToken, prevPageToken }
let currentRequestId = 0; // controle de corrida
let searchCooldownUntil = 0; // epoch ms

// IndexedDB para cache persistente
let dbPromise = null;

function initIndexedDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('KaraoPlayCache', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('searches')) {
        const store = db.createObjectStore('searches', { keyPath: 'term' });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        const store = db.createObjectStore('metadata', { keyPath: 'videoId' });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
  });
  return dbPromise;
}

async function saveToIndexedDB(storeName, data) {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB save failed:', error);
  }
}

async function readFromIndexedDB(storeName, key) {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return await new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB read failed:', error);
    return null;
  }
}

async function clearExpiredCache() {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(['searches'], 'readwrite');
    const store = transaction.objectStore('searches');
    const index = store.index('expiresAt');
    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.warn('Clear expired cache failed:', error);
  }
}

// Cache aprimorado com IndexedDB
function cacheKey(term) { return `yt_search_${term}`; }
async function saveCache(term, payload, ttlMs = 60 * 60 * 1000) { // 1 hora padrão
  const expiresAt = Date.now() + ttlMs;
  const cacheData = { term, data: payload, expiresAt };
  lastResultsByTerm.set(term, { data: payload, expiresAt });
  await saveToIndexedDB('searches', cacheData);
  // Fallback para sessionStorage
  try {
    sessionStorage.setItem(cacheKey(term), JSON.stringify({ data: payload, expiresAt }));
  } catch (_) {}
}
async function readCache(term) {
  // Primeiro verifica memória
  const mem = lastResultsByTerm.get(term);
  if (mem && mem.expiresAt > Date.now()) return mem.data;

  // Depois IndexedDB
  const dbData = await readFromIndexedDB('searches', term);
  if (dbData && dbData.expiresAt > Date.now()) {
    lastResultsByTerm.set(term, { data: dbData.data, expiresAt: dbData.expiresAt });
    return dbData.data;
  }

  // Fallback sessionStorage
  try {
    const raw = sessionStorage.getItem(cacheKey(term));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.expiresAt > Date.now()) {
        lastResultsByTerm.set(term, parsed);
        return parsed.data;
      }
    }
  } catch (_) {}
  return null;
}

// Salvar metadados de vídeo
async function saveVideoMetadata(videoId, metadata) {
  const data = { videoId, ...metadata, lastUpdated: Date.now() };
  await saveToIndexedDB('metadata', data);
}

// Ler metadados de vídeo
async function readVideoMetadata(videoId) {
  return await readFromIndexedDB('metadata', videoId);
}

// Debounce genérico
function debounce(fn, wait = 500) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Throttle genérico
function throttle(fn, wait = 1000) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
}

// Exponential backoff para retries
function exponentialBackoff(attempt, baseDelay = 1000, maxDelay = 30000) {
  return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
}

// Retry com backoff exponencial
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      const delay = exponentialBackoff(attempt, baseDelay);
      console.warn(`Retry ${attempt}/${maxRetries} after ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
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
