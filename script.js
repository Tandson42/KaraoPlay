// ======== Estruturas de Dados ========
let clienteAtual = null;
let fila = [];
let tocandoAgora = null;

const player = document.getElementById("player");
const resultadosDiv = document.getElementById("resultados");
const filaLista = document.getElementById("fila-lista");
const totalFila = document.getElementById("total-fila");

// ======== Mock de músicas expandido ========
const catalogo = [
  { titulo: "Evidências", artista: "Chitãozinho & Xororó", src: "evidencias.mp3", genero: "Sertanejo" },
  { titulo: "Tempo Perdido", artista: "Legião Urbana", src: "tempo_perdido.mp3", genero: "Rock" },
  { titulo: "Garota de Ipanema", artista: "Tom Jobim", src: "ipanema.mp3", genero: "Bossa Nova" },
  { titulo: "Sozinho", artista: "Caetano Veloso", src: "sozinho.mp3", genero: "MPB" },
  { titulo: "Asa Branca", artista: "Luiz Gonzaga", src: "asa_branca.mp3", genero: "Forró" },
  { titulo: "Aquarela", artista: "Toquinho", src: "aquarela.mp3", genero: "MPB" },
];

// ======== Funções principais ========
function addCliente(nome) {
  clienteAtual = nome.trim();
  document.getElementById("cliente-section").style.display = "none";
  document.getElementById("busca-section").style.display = "block";
  document.getElementById("user-info").style.display = "block";
  document.getElementById("user-name").textContent = clienteAtual;
  
  // Mostrar todas as músicas inicialmente
  buscarMusica("");
}

function buscarMusica(query) {
  const termo = query.toLowerCase();
  const resultados = query === "" 
    ? catalogo 
    : catalogo.filter(m => 
        m.titulo.toLowerCase().includes(termo) || 
        m.artista.toLowerCase().includes(termo) ||
        m.genero.toLowerCase().includes(termo)
      );

  resultadosDiv.innerHTML = resultados.length
    ? resultados.map(m => `
        <div class="glass-effect rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/20 transition-all">
          <div class="flex-1">
            <p class="font-semibold text-lg">${m.titulo}</p>
            <p class="text-purple-200 text-sm">${m.artista}</p>
            <span class="inline-block mt-1 px-2 py-1 bg-purple-500/30 rounded text-xs">${m.genero}</span>
          </div>
          <button 
            onclick="addToFila('${m.titulo}', '${m.artista}', '${m.src}')"
            class="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-all transform hover:scale-105 shadow-lg whitespace-nowrap"
          >
            ➕ Adicionar
          </button>
        </div>
      `).join("")
    : "<p class='text-center text-purple-200 py-8'>🔍 Nenhuma música encontrada. Tente outro termo!</p>";
}

function addToFila(titulo, artista, src) {
  fila.push({ cliente: clienteAtual, titulo, artista, src });
  updateFila();
  
  // Feedback visual
  showNotification(`"${titulo}" adicionada à fila! 🎵`);
  
  if (!tocandoAgora) playNext();
}

function updateFila() {
  if (fila.length === 0) {
    filaLista.innerHTML = "<li class='text-center text-purple-200 py-4'>📭 Fila vazia</li>";
    totalFila.textContent = "0 músicas na fila";
    return;
  }

  filaLista.innerHTML = fila.map((item, i) => `
    <li class="bg-white/10 rounded-lg p-3 flex items-center gap-3 hover:bg-white/20 transition-all">
      <span class="bg-purple-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm flex-shrink-0">
        ${i + 1}
      </span>
      <div class="flex-1 min-w-0">
        <p class="font-semibold truncate">${item.titulo}</p>
        <p class="text-xs text-purple-200 truncate">👤 ${item.cliente}</p>
      </div>
    </li>
  `).join("");
  
  totalFila.textContent = `${fila.length} ${fila.length === 1 ? 'música' : 'músicas'} na fila`;
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
  document.getElementById("atual-cliente").textContent = `👤 Solicitado por: ${tocandoAgora.cliente}`;
  player.play().catch(err => {
    console.log("Erro ao reproduzir:", err);
    showNotification("⚠️ Arquivo de áudio não encontrado. Pulando...");
    setTimeout(playNext, 1000);
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-lg shadow-2xl z-50 slide-in';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
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

player.onended = playNext;

// Inicializar
updateFila();