// ======== Fila, Reprodução e Atualizações de UI relacionadas ========

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
