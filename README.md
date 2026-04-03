# ProutGPT Chat — Frontend 💨

React + Vite single-page application for [ProutGPT](https://proutgpt.com) — the world's most sophisticated fart-joke chatbot.

---

## Tech stack

| Layer | Library / Tool |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Markdown rendering | react-markdown + remark-gfm |
| Analytics | Google Analytics 4 |

---

## Prerequisites

| Tool | Min version | Install |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org or `nvm install --lts` |
| npm | 9 | bundled with Node |

---

## Getting started

```bash
# 1. Clone and enter the repo
git clone <repo-url>
cd proutgpt-chat

# 2. Install dependencies
npm install

# 3. (Optional) configure the API base URL
cp .env.example .env.local
# edit VITE_API_BASE_URL if your backend is not at https://api.proutgpt.com

# 4. Start the dev server  →  http://localhost:3000
npm run dev
```

---

## Environment variables

Create a `.env.local` file at the project root (never commit it):

```bash
# URL of the proutgpt-backend API.
# Defaults to https://api.proutgpt.com when omitted.
VITE_API_BASE_URL=https://api.proutgpt.com
```

> Vite only exposes variables prefixed with `VITE_` to the browser bundle.

---

## NPM scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |

---

## Features

- **Real-time streaming** — token-by-token SSE streaming when using OpenRouter backend (toggle in header)
- **Markdown rendering** — assistant replies render bold, italic, code blocks, lists, tables, etc.
- **Multi-line input** — textarea that auto-grows; `Enter` sends, `Shift+Enter` adds a new line
- **Copy to clipboard** — hover any message bubble to reveal a copy button
- **Clear conversation** — trash button in header wipes the chat (also aborts any in-flight request)
- **Stop generation** — red stop button appears while streaming; click to cancel mid-response
- **Persistent history** — conversation and settings are saved to `localStorage` and survive page refresh
- **Model selector** — switch between OpenRouter cloud models or a local Ollama instance at runtime
- **Responsive header** — controls wrap gracefully on small screens

---

## Project structure

```
proutgpt-chat/
├── index.html            # Entry HTML (GA4 tag lives here)
├── vite.config.js        # Vite config (port 3000)
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx          # React root mount
    ├── index.css         # Tailwind directives + base styles
    └── App.jsx           # Entire application (single-component)
```

---

## Deployment

The app builds to a static `dist/` folder — deploy anywhere that serves static files:

```bash
npm run build
# Upload dist/ to: Netlify, Vercel, GitHub Pages, nginx, S3+CloudFront, etc.
```

For nginx, point the root at `dist/` and add a fallback for SPA routing:

```nginx
location / {
    root /var/www/proutgpt-chat/dist;
    try_files $uri $uri/ /index.html;
}
```

---

## Backend

This frontend talks to **proutgpt-backend** — see `../proutgpt-backend/README.md` for setup.

Default API base: `https://api.proutgpt.com`
Override with `VITE_API_BASE_URL` in `.env.local`.

---

## Authors

Vibe coded by **Benoît Coulombe**, **Gaëlle Coulombe** and **Simon Coulombe** 💨
