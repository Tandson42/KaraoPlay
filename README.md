# 🎤 KaraoPlay — Sistema de Karaokê Web

## 🎬 Demo

![Demo do KaraoPlay](./screenshots/demo.gif)

---

**KaraoPlay** é uma aplicação web client-side para karaokê, desenvolvida com **HTML5, CSS3 e JavaScript moderno**, que permite busca de músicas no YouTube, gerenciamento de fila e controle de reprodução em tempo real, com foco em performance, UX e uso de APIs Web modernas.

---

## 📸 Screenshots

### Tela de Login
![Tela de Login](./screenshots/01-login.png)

### Busca de Músicas
![Busca de Músicas](./screenshots/02-busca.png)

### Player e Fila
![Player e Fila](./screenshots/03-player-fila.png)

### Painel Admin
![Painel Admin](./screenshots/04-admin.png)

### Responsividade Mobile
![Mobile](./screenshots/05-mobile.png)

---

## 🚀 Funcionalidades

- Sistema de login simples para identificação de usuários/mesas  
- Busca de músicas integrada ao **YouTube Data API v3**  
- Player de vídeo com **YouTube IFrame Player API**  
- Gerenciamento dinâmico de fila de músicas  
- Cache multinível (memória, sessionStorage e IndexedDB)  
- Retry automático com exponential backoff para falhas de API  
- Scroll preloading com **Intersection Observer**  
- Painel administrativo com autenticação persistente  
- Notificações visuais (toast) para feedback de ações  
- Layout totalmente responsivo (mobile-first)  

---

## 🛠️ Tecnologias Utilizadas

### Core
- **HTML5** — Semântica moderna  
- **CSS3** — Flexbox, Grid, animações e gradientes  
- **JavaScript (ES6+)** — async/await, arrow functions, módulos  

### Frameworks & Libraries
- **Tailwind CSS** (via CDN)  
- **Google Fonts** (Poppins)  

### APIs e Recursos Web
- **YouTube Data API v3**  
- **YouTube IFrame Player API**  
- **Fetch API**  
- **IndexedDB**  
- **localStorage / sessionStorage**  
- **Intersection Observer API**  

---

## 📦 Como Executar

### Pré-requisitos
- Navegador moderno  
- Chave da **YouTube Data API v3**

### Passos

#### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/Tandson42/KaraoPlay.git
cd KaraoPlay
