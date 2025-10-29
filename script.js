const playlist = [
      {
        title: "Exemplo 1",
        src: "musica1.mp3", // coloque o caminho do seu arquivo local
        lyrics: `
[00:00] Vamos cantar juntos
[00:05] Esta é a primeira linha
[00:10] E aqui vem a segunda
[00:15] Cantando sem parar
[00:20] Viva o Karaokê!
        `
      },
      {
        title: "Exemplo 2",
        src: "musica2.mp3",
        lyrics: `
[00:00] Outra música começa
[00:05] Continue cantando
[00:10] Sinta a batida
[00:15] É hora do show!
        `
      }
    ];

    const player = document.getElementById("player");
    const lyricsDiv = document.getElementById("lyrics");
    const playBtn = document.getElementById("play");
    const pauseBtn = document.getElementById("pause");
    const nextBtn = document.getElementById("next");
    const prevBtn = document.getElementById("prev");

    let currentSong = 0;
    let parsedLyrics = [];

    function parseLyrics(text) {
      return text.trim().split("\n").map(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\](.*)/);
        if (!match) return null;
        const time = parseInt(match[1]) * 60 + parseInt(match[2]);
        return { time, text: match[3].trim() };
      }).filter(Boolean);
    }

    function loadSong(index) {
      const song = playlist[index];
      player.src = song.src;
      parsedLyrics = parseLyrics(song.lyrics);
      lyricsDiv.innerHTML = parsedLyrics.map(l => `<div class="line">${l.text}</div>`).join("");
    }

    function highlightLyric(currentTime) {
      let activeIndex = parsedLyrics.findIndex((l, i) => 
        currentTime >= l.time && (i === parsedLyrics.length - 1 || currentTime < parsedLyrics[i + 1].time)
      );
      const lines = lyricsDiv.querySelectorAll(".line");
      lines.forEach((line, i) => line.classList.toggle("active", i === activeIndex));
    }

    playBtn.onclick = () => player.play();
    pauseBtn.onclick = () => player.pause();
    nextBtn.onclick = () => { currentSong = (currentSong + 1) % playlist.length; loadSong(currentSong); player.play(); };
    prevBtn.onclick = () => { currentSong = (currentSong - 1 + playlist.length) % playlist.length; loadSong(currentSong); player.play(); };

    player.ontimeupdate = () => highlightLyric(player.currentTime);

    loadSong(currentSong);