// ======== Estado Compartilhado e Utilitários ========
// Estado da aplicação
let clienteAtual = null;
let fila = [];
let tocandoAgora = null;
let musicasTocadas = 0;
let adminLogado = false;

// YouTube API
const YOUTUBE_API_KEY = 'FALTANDO'; // INSIRA SUA CHAVE DA YOUTUBE DATA API V3 AQUI
let youtubePlayer = null;

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
