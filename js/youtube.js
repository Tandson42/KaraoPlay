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

// Alias para compatibilidade
function buscarMusica(query) {
  buscarVideosYouTube(query);
}
