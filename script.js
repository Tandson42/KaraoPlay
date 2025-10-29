// ======== Estruturas de Dados ========
let clienteAtual = null;
let fila = [];
let tocandoAgora = null;
let musicasTocadas = 0;

const player = document.getElementById("player");
const resultadosDiv = document.getElementById("resultados");
const filaLista = document.getElementById("fila-lista");
const totalFila = document.getElementById("total-fila");
const totalFilaStat = document.getElementById("total-fila-stat");
const totalTocadas = document.getElementById("total-tocadas");
const totalCatalogo = document.getElementById("total-catalogo");

// ======== Mock de músicas expandido ========
const catalogo = [
  { titulo: "Evidências", artista: "Chitãozinho & Xororó", src: "evidencias.mp3", genero: "Sertanejo" },
  { titulo: "Tempo Perdido", artista: "Legião Urbana", src: "tempo_perdido.mp3", genero: "Rock" },
  { titulo: "Garota de Ipanema", artista: "Tom Jobim", src: "ipanema.mp3", genero: "Bossa Nova" },
  { titulo: "Sozinho", artista: "Caetano Veloso", src: "sozinho.mp3", genero: "MPB" },
  { titulo: "Asa Branca", artista: "Luiz Gonzaga", src: "asa_branca.mp3", genero: "Forró" },
  { titulo: "Aquarela", artista: "Toquinho", src: "aquarela.mp3", genero: "MPB" },
  { titulo: "Eu Sei Que Vou Te Amar", artista: "Tom Jobim", src: "eu_sei.mp3", genero: "Bossa Nova" },
  { titulo: "País Tropical", artista: "Jorge Ben Jor", src: "pais_tropical.mp3", genero: "Samba" },
];

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
  
  // Mostrar todas as músicas inicialmente
  buscarMusica("");
  
  // Atualizar total do catálogo
  totalCatalogo.textContent = catalogo.length;
  
  // Feedback visual
  showNotification(`Bem-vindo, ${clienteAtual}! 🎉`);
}

function buscarMusica(query) {
  const termo = query.toLowerCase().trim();
  const resultados = termo === "" 
    ? catalogo 
    : catalogo.filter(m => 
        m.titulo.toLowerCase().includes(termo) || 
        m.artista.toLowerCase().includes(termo) ||
        m.genero.toLowerCase().includes(termo)
      );

  if (resultados.length === 0) {
    resultadosDiv.innerHTML = `
      <div class="text-center py-12 empty-state">
        <div class="text-6xl mb-4">🔍</div>
        <p class="text-xl text-purple-200 mb-2">Nenhuma música encontrada</p>
        <p class="text-sm text-purple-300">Tente buscar por outro termo</p>
      </div>
    `;
    return;
  }

  resultadosDiv.innerHTML = resultados.map(m => `
    <div class="glass-effect musica-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div class="flex-1 min-w-0">
        <p class="font-bold text-base md:text-lg truncate">${m.titulo}</p>
        <p class="text-purple-200 text-sm truncate">${m.artista}</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="inline-block px-2 py-1 bg-purple-500/30 rounded-lg text-xs font-semibold">
            ${m.genero}
          </span>
        </div>
      </div>
      <button 
        onclick="addToFila('${escapeHtml(m.titulo)}', '${escapeHtml(m.artista)}', '${m.src}')"
        class="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-4 py-2 md:px-5 md:py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg whitespace-nowrap text-sm md:text-base"
      >
        ➕ <span class="hidden sm:inline">Adicionar</span>
      </button>
    </div>
  `).join("");
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

function addToFila(titulo, artista, src) {
  fila.push({ cliente: clienteAtual, titulo, artista, src });
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
    player.src = "";
    return;
  }

  tocandoAgora = fila.shift();
  updateFila();
  
  player.src = tocandoAgora.src;
  document.getElementById("atual-musica").textContent = `♪ ${tocandoAgora.titulo}`;
  document.getElementById("atual-cliente").textContent = `🎤 ${tocandoAgora.cliente} • ${tocandoAgora.artista}`;
  
  player.play().catch(err => {
    console.log("Erro ao reproduzir:", err);
    showNotification("⚠️ Arquivo de áudio não encontrado. Pulando...");
    setTimeout(playNext, 1000);
  });
  
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

player.onended = playNext;

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

// Inicializar
updateFila();
totalCatalogo.textContent = catalogo.length;