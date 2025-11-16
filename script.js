// ======== Estruturas de Dados ========
let clienteAtual = null;
let fila = [];
let tocandoAgora = null;
let musicasTocadas = 0;
let adminLogado = false;

// YouTube API Configuration
const YOUTUBE_API_KEY = 'FALTANDO'; // INSIRA SUA CHAVE DA YOUTUBE DATA API V3 AQUI
let youtubePlayer = null;

const playerContainer = document.getElementById("player-container");
const resultadosDiv = document.getElementById("resultados");
const filaLista = document.getElementById("fila-lista");
const totalFila = document.getElementById("total-fila");
const totalFilaStat = document.getElementById("total-fila-stat");
const totalTocadas = document.getElementById("total-tocadas");
const totalCatalogo = document.getElementById("total-catalogo");

// ======== Funções YouTube API ========
function onYouTubeIframeAPIReady() {
  youtubePlayer = new YT.Player('youtube-player', {
    height: '200',
    width: '100%',
    playerVars: {
      'playsinline': 1,
      'controls': 1,
      'modestbranding': 1,
      'rel': 0,
      'showinfo': 0,
      'iv_load_policy': 3,
      'fs': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}

function onPlayerReady(event) {
  console.log('YouTube Player ready');
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    playNext();
  }
}

function onPlayerError(event) {
  console.error('YouTube Player Error:', event.data);
  showNotification('⚠️ Vídeo indisponível. Pulando para próxima música...');
  setTimeout(playNext, 1000);
}

async function buscarVideosYouTube(query) {
  if (!query.trim()) {
    resultadosDiv.innerHTML = `
      <div class="text-center py-12 empty-state">
        <div class="text-6xl mb-4">🔍</div>
        <p class="text-xl text-purple-200 mb-2">Digite algo para buscar</p>
        <p class="text-sm text-purple-300">Busque por músicas, artistas ou gêneros</p>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' karaoke OR lyrics')}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}&videoEmbeddable=true&videoSyndicated=true`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      resultadosDiv.innerHTML = `
        <div class="text-center py-12 empty-state">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-xl text-purple-200 mb-2">Nenhum vídeo encontrado</p>
          <p class="text-sm text-purple-300">Tente buscar por outro termo</p>
        </div>
      `;
      return;
    }

    resultadosDiv.innerHTML = data.items.map(item => `
      <div class="glass-effect musica-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <img src="${item.snippet.thumbnails.medium.url}" alt="${item.snippet.title}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOUI5QkE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD4KPHN2Zz4='">
        <div class="flex-1 min-w-0">
          <p class="font-bold text-sm md:text-base truncate">${item.snippet.title}</p>
          <p class="text-purple-200 text-xs md:text-sm truncate">${item.snippet.channelTitle}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="inline-block px-2 py-1 bg-red-500/30 rounded-lg text-xs font-semibold">
              YouTube
            </span>
          </div>
        </div>
        <button
          onclick="addToFila('${item.id.videoId}', '${escapeHtml(item.snippet.title)}', '${escapeHtml(item.snippet.channelTitle)}', '${item.snippet.thumbnails.medium.url}')"
          class="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-4 py-2 md:px-5 md:py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg whitespace-nowrap text-sm md:text-base"
        >
          ➕ <span class="hidden sm:inline">Adicionar</span>
        </button>
      </div>
    `).join("");

  } catch (error) {
    console.error('Erro na busca:', error);
    resultadosDiv.innerHTML = `
      <div class="text-center py-12 empty-state">
        <div class="text-6xl mb-4">⚠️</div>
        <p class="text-xl text-purple-200 mb-2">Erro na busca</p>
        <p class="text-sm text-purple-300">Verifique sua conexão ou chave da API</p>
      </div>
    `;
  }
}

// ======== Funções principais ========
function addCliente(nome) {
  clienteAtual = nome.trim();
  
  // Ocultar seção de login
  document.getElementById("cliente-section").style.display = "none";
  
  // Mostrar conteúdo principal
  document.getElementById("main-content").style.display = "block";
  
  // Atualizar header com nome do usuário
  document.getElementById("user-info-header").style.display = "block";
  document.getElementById("user-name-header").textContent = clienteAtual;
  
  // Mostrar busca vazia inicialmente
  buscarVideosYouTube("");

  // Atualizar total do catálogo (agora dinâmico)
  totalCatalogo.textContent = "∞";
  
  // Feedback visual
  showNotification(`Bem-vindo, ${clienteAtual}! 🎉`);
}

// Função buscarMusica mantida para compatibilidade, mas redireciona para YouTube
function buscarMusica(query) {
  buscarVideosYouTube(query);
}

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

function addToFila(videoId, titulo, canal, thumbnail) {
  fila.push({ cliente: clienteAtual, videoId, titulo, canal, thumbnail });
  updateFila();

  // Feedback visual
  showNotification(`"${titulo}" adicionada à fila! 🎵`);

  if (!tocandoAgora) playNext();
}

function updateFila() {
  const limparBtn = document.getElementById("limpar-fila");
  
  if (fila.length === 0) {
    filaLista.innerHTML = `
      <li class="text-center py-8 empty-state">
        <div class="text-5xl mb-3">📭</div>
        <p class="text-purple-200">Fila vazia</p>
        <p class="text-sm text-purple-300 mt-1">Adicione músicas para começar</p>
      </li>
    `;
    totalFila.textContent = "0 músicas na fila";
    totalFilaStat.textContent = "0";
    limparBtn.classList.add("hidden");
    return;
  }

  filaLista.innerHTML = fila.map((item, i) => `
    <li class="bg-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/20 transition-all group">
      <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-sm md:text-base flex-shrink-0 shadow-lg">
        ${i + 1}
      </span>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm md:text-base truncate">${item.titulo}</p>
        <p class="text-xs md:text-sm text-purple-200 truncate">
          <span class="hidden sm:inline">🎤 </span>${item.cliente}
        </p>
      </div>
      <button 
        onclick="removerDaFila(${i})"
        class="opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/40 text-red-200 px-2 py-1 md:px-3 md:py-2 rounded-lg text-xs transition-all"
        title="Remover"
      >
        ✕
      </button>
    </li>
  `).join("");
  
  const plural = fila.length === 1 ? 'música' : 'músicas';
  totalFila.textContent = `${fila.length} ${plural} na fila`;
  totalFilaStat.textContent = fila.length;
  limparBtn.classList.remove("hidden");
}

function removerDaFila(index) {
  const musica = fila[index];
  fila.splice(index, 1);
  updateFila();
  showNotification(`"${musica.titulo}" removida da fila`);
}

function limparFila() {
  if (fila.length === 0) return;
  
  if (confirm(`Deseja realmente limpar todas as ${fila.length} músicas da fila?`)) {
    fila = [];
    updateFila();
    showNotification("Fila limpa! 🗑️");
  }
}

function playNext() {
  if (fila.length === 0) {
    tocandoAgora = null;
    document.getElementById("atual-musica").textContent = "Aguardando próxima música...";
    document.getElementById("atual-cliente").textContent = "";
    if (youtubePlayer && youtubePlayer.stopVideo) {
      youtubePlayer.stopVideo();
    }
    return;
  }

  tocandoAgora = fila.shift();
  updateFila();

  if (youtubePlayer && youtubePlayer.loadVideoById) {
    youtubePlayer.loadVideoById(tocandoAgora.videoId);
  }

  document.getElementById("atual-musica").textContent = `♪ ${tocandoAgora.titulo}`;
  document.getElementById("atual-cliente").textContent = `🎤 ${tocandoAgora.cliente} • ${tocandoAgora.canal}`;

  // Atualizar contador de músicas tocadas
  musicasTocadas++;
  totalTocadas.textContent = musicasTocadas;
}

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

// ======== Eventos ========
document.getElementById("entrar").onclick = () => {
  const nome = document.getElementById("cliente-nome").value;
  if (!nome.trim()) {
    showNotification("⚠️ Por favor, informe seu nome ou mesa!");
    return;
  }
  addCliente(nome);
};

document.getElementById("cliente-nome").onkeypress = (e) => {
  if (e.key === 'Enter') {
    document.getElementById("entrar").click();
  }
};

document.getElementById("buscar").onclick = () => {
  const termo = document.getElementById("busca").value;
  buscarMusica(termo);
};

document.getElementById("busca").onkeypress = (e) => {
  if (e.key === 'Enter') {
    document.getElementById("buscar").click();
  }
};

document.getElementById("busca").oninput = (e) => {
  // Busca em tempo real
  const termo = e.target.value;
  if (termo.length >= 2 || termo.length === 0) {
    buscarMusica(termo);
  }
};

document.getElementById("limpar-fila").onclick = limparFila;

// Removido: player.onended = playNext; (agora controlado pelo YouTube Player)

// Scroll header effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  
  lastScroll = currentScroll;
});

// ======== Funções Admin ========
function verificarAdminLogado() {
  const adminData = localStorage.getItem('adminCredentials');
  if (adminData) {
    const { username, password } = JSON.parse(adminData);
    if (username === 'admin' && password === 'admin') {
      adminLogado = true;
      atualizarUIAdmin();
      return true;
    }
  }
  adminLogado = false;
  atualizarUIAdmin();
  return false;
}

function loginAdmin(username, password) {
  if (username === 'admin' && password === 'admin') {
    // Armazenar no localStorage
    localStorage.setItem('adminCredentials', JSON.stringify({ username, password }));
    adminLogado = true;
    atualizarUIAdmin();
    fecharModalAdmin();
    showNotification('Login de admin realizado com sucesso! 👑');
    return true;
  } else {
    showNotification('⚠️ Credenciais inválidas!');
    return false;
  }
}

function logoutAdmin() {
  localStorage.removeItem('adminCredentials');
  adminLogado = false;
  atualizarUIAdmin();
  showNotification('Logout realizado! 🔐');
}

function atualizarUIAdmin() {
  const loginBtn = document.getElementById('admin-login-btn');
  const loggedInDiv = document.getElementById('admin-logged-in');

  if (adminLogado) {
    loginBtn.style.display = 'none';
    loggedInDiv.style.display = 'block';
  } else {
    loginBtn.style.display = 'block';
    loggedInDiv.style.display = 'none';
  }
}

function abrirModalAdmin() {
  document.getElementById('admin-login-modal').style.display = 'flex';
  document.getElementById('admin-username').focus();
}

function fecharModalAdmin() {
  document.getElementById('admin-login-modal').style.display = 'none';
  document.getElementById('admin-username').value = '';
  document.getElementById('admin-password').value = '';
}

// ======== Eventos Admin ========
document.getElementById('admin-login-btn').onclick = abrirModalAdmin;

document.getElementById('admin-logout-btn').onclick = logoutAdmin;

document.getElementById('admin-login-submit').onclick = () => {
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value.trim();

  if (!username || !password) {
    showNotification('⚠️ Preencha usuário e senha!');
    return;
  }

  loginAdmin(username, password);
};

document.getElementById('admin-login-cancel').onclick = fecharModalAdmin;

document.getElementById('admin-username').onkeypress = (e) => {
  if (e.key === 'Enter') {
    document.getElementById('admin-password').focus();
  }
};

document.getElementById('admin-password').onkeypress = (e) => {
  if (e.key === 'Enter') {
    document.getElementById('admin-login-submit').click();
  }
};

// Fechar modal ao clicar fora
document.getElementById('admin-login-modal').onclick = (e) => {
  if (e.target.id === 'admin-login-modal') {
    fecharModalAdmin();
  }
};

// Inicializar
updateFila();
totalCatalogo.textContent = "∞"; // Catálogo ilimitado do YouTube

// Verificar se admin já está logado
verificarAdminLogado();
