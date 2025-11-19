// ======== Integração YouTube: Player e Busca ========

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

async function buscarVideosYouTube(query, { append = false } = {}) {
  const raw = query || '';
  const term = raw.trim().toLowerCase();

  // Estado inicial (vazio) sem chamar API
  if (!term) {
    resultadosDiv.innerHTML = `
      <div class="text-center py-12 empty-state">
        <div class="text-6xl mb-4">🔍</div>
        <p class="text-xl text-purple-200 mb-2">Digite algo para buscar</p>
        <p class="text-sm text-purple-300">Busque por músicas, artistas ou gêneros</p>
      </div>
    `;
    lastQueryTerm = '';
    return;
  }

  // Mínimo de 3 caracteres
  if (term.length < 3) {
    return; // não chama API
  }

  // Cooldown ativo (quota/backoff)
  if (Date.now() < searchCooldownUntil) {
    const segundos = Math.ceil((searchCooldownUntil - Date.now()) / 1000);
    resultadosDiv.innerHTML = `
      <div class="text-center py-12 empty-state">
        <div class="text-6xl mb-4">⏳</div>
        <p class="text-xl text-purple-200 mb-2">Aguardando para nova busca</p>
        <p class="text-sm text-purple-300">Tente novamente em ${segundos}s</p>
      </div>
    `;
    return;
  }

  // Cache disponível
  if (!append) {
    const cached = readCache(term);
    if (cached && cached.items?.length) {
      renderResults(cached.items, !!cached.nextPageToken, term, false);
      lastQueryTerm = term;
      lastPageTokenByTerm.set(term, { nextPageToken: cached.nextPageToken || null });
      return;
    }
  }

  // Controle de corrida
  const myId = ++currentRequestId;

  // Paginação: usar token salvo quando append = true
  const pageToken = append ? (lastPageTokenByTerm.get(term)?.nextPageToken || '') : '';

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', `${term} karaoke OR lyrics`);
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '10');
    url.searchParams.set('key', YOUTUBE_API_KEY);
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('videoSyndicated', 'true');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString());

    if (myId !== currentRequestId) return; // resposta antiga, ignorar

    if (!response.ok) {
      // Detectar cota/limite
      if (response.status === 429 || response.status === 403) {
        searchCooldownUntil = Date.now() + 60 * 1000; // 60s de backoff
        showNotification('Limite de requisições atingido. Aguardando 60s.');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    const items = data.items || [];
    const nextPageToken = data.nextPageToken || null;

    if (!append) {
      // salvar no cache apenas para página inicial
      saveCache(term, { items, nextPageToken });
      lastQueryTerm = term;
    }

    lastPageTokenByTerm.set(term, { nextPageToken });

    if (!items.length && !append) {
      resultadosDiv.innerHTML = `
        <div class="text-center py-12 empty-state">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-xl text-purple-200 mb-2">Nenhum vídeo encontrado</p>
          <p class="text-sm text-purple-300">Tente buscar por outro termo</p>
        </div>
      `;
      return;
    }

    renderResults(items, !!nextPageToken, term, append);
  } catch (error) {
    console.error('Erro na busca:', error);
    if (!append) {
      resultadosDiv.innerHTML = `
        <div class="text-center py-12 empty-state">
          <div class="text-6xl mb-4">⚠️</div>
          <p class="text-xl text-purple-200 mb-2">Erro na busca</p>
          <p class="text-sm text-purple-300">Verifique sua conexão ou chave da API</p>
        </div>
      `;
    }
  }
}

function renderResults(items, hasMore, term, append) {
  const htmlItems = items.map(item => `
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

  if (!append) {
    resultadosDiv.innerHTML = htmlItems;
  } else {
    resultadosDiv.insertAdjacentHTML('beforeend', htmlItems);
  }

  const existingMoreBtn = document.getElementById('yt-load-more');
  if (existingMoreBtn) existingMoreBtn.remove();

  if (hasMore) {
    const moreBtn = document.createElement('button');
    moreBtn.id = 'yt-load-more';
    moreBtn.className = 'w-full mt-3 bg-purple-500/30 hover:bg-purple-500/50 text-white font-semibold px-4 py-2 rounded-xl transition-all';
    moreBtn.textContent = 'Carregar mais';
    moreBtn.onclick = () => buscarVideosYouTube(term, { append: true });
    resultadosDiv.appendChild(moreBtn);
  }
}

// Alias para compatibilidade
function buscarMusica(query) {
  buscarVideosYouTube(query);
}
