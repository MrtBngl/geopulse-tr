# 🌋 GeoPulse-TR

<h3 align="center">Next-Generation Real-Time Earthquake Intelligence & AI Risk Assessment for Turkey</h3>

<p align="center">
  GeoPulse-TR is a modern, high-performance web application providing live seismic monitoring across Turkey and neighboring regions. Powered by <b>AFAD</b> data streams, <b>MapLibre GL</b> vector mapping, and <b>Google Gemini 2.0 AI</b> for instant safety reports and risk analytics.
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#license">License</a>
</p>

---

## 📸 Screenshots

| Main Dashboard & Map View |
| :---: |
| ![Dashboard Preview](./public/main.png) |

---

## ✨ Key Features

- **🛰️ Live AFAD Stream Integration**: Continuously fetches and normalizes seismic event data directly from AFAD REST services with built-in mock fallback for maximum availability.
- **🗺️ Dynamic Vector Map Visualization**: Interactive map powered by MapLibre GL featuring epicenter pulse animations, magnitude/depth-based color coding, custom heatmaps, and automatic fly-to location controls.
- **🤖 Gemini 2.0 Flash AI Safety Intelligence**: Generates concise 3-step action guidelines, situational summaries, and automated 0–100 numerical risk scoring for any detected tremor using Google Gemini GenAI SDK.
- **⚡ Next.js 15 & React 19 Engine**: Built on the latest Next.js App Router with server-side API routing, optimized caching via `node-cache`, and strict rate-limiting middleware.
- **📰 Regional Seismic News Feed**: Aggregates real-time news updates and emergency announcements related to recent earthquakes.
- **🎨 Glassmorphic & Responsive Design**: Premium dark-mode UI with smooth micro-interactions powered by Framer Motion, Lucide Icons, and Tailwind CSS.

---

## 🛠️ Tech Stack

| Category | Technologies |
| --- | --- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) |
| **Map Rendering** | [MapLibre GL](https://maplibre.org/), [React Map GL](https://visgl.github.io/react-map-gl/) |
| **Artificial Intelligence** | [Google Gemini 2.0 Flash](https://ai.google.dev/) (`@google/genai`) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/) |
| **Data Fetching & Cache** | [Axios](https://axios-http.com/), [Cheerio](https://cheerio.js.org/), [Node Cache](https://github.com/node-cache/node-cache) |

---

## 📁 Project Structure

```text
geopulse-tr/
├── public/                  # Static assets & screenshot images (e.g. logo, preview screenshots)
├── src/
│   ├── app/                 # Next.js App Router (Pages & API routes)
│   │   ├── api/             # API Endpoints (/earthquakes, /ai, /news, /health)
│   │   ├── globals.css      # Custom styling & glassmorphism utilities
│   │   ├── layout.tsx       # Root layout provider
│   │   └── page.tsx         # Main entry point
│   ├── components/          # UI Components
│   │   ├── dashboard.tsx    # Dashboard layout & live alert overlays
│   │   ├── layout/          # Header, Sidebar, and Navigation components
│   │   ├── map/             # MapLibre GL map container, markers, layer controls
│   │   ├── panel/           # Earthquake detail drawer & AI insights sheet
│   │   └── providers/       # React Context providers (Earthquake State Manager)
│   ├── db/                  # Drizzle ORM schema & Database connection setup
│   ├── lib/                 # Quake calculations, rate-limiting & caching helpers
│   ├── services/            # AFAD scraper, Gemini AI service & News feed service
│   └── types/               # TypeScript interfaces & DTO definitions
├── drizzle.config.json      # Drizzle ORM configuration
├── next.config.ts           # Next.js configuration
└── package.json             # Dependencies & scripts
```

---

## 🚀 Getting Started

Follow these instructions to set up and run GeoPulse-TR locally on your machine.

### Prerequisites

- **Node.js**: `v18.x` or higher
- **npm** / **pnpm** / **yarn**
- *(Optional)* **PostgreSQL** database (for historical quake data logging)
- *(Optional)* **Google Gemini API Key** (for live AI risk assessment generation)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MrtBngl/geopulse-tr.git
   cd geopulse-tr
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Google Gemini API Key (Required for live AI safety reports)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Database Connection (Optional if using PostgreSQL database)
   DATABASE_URL=postgres://username:password@localhost:5432/geopulse_db

   # App Configuration
   NODE_ENV=development
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to view the app in your browser.

---

## 📡 API Reference

GeoPulse-TR provides internal serverless API endpoints:

| Endpoint | Method | Description |
| --- | --- | --- |
| `GET /api/earthquakes` | `GET` | Fetches normalized live seismic data from AFAD (cached with node-cache). |
| `POST /api/ai` | `POST` | Sends earthquake magnitude & depth parameters to Gemini 2.0 Flash to return structured AI risk summaries. |
| `GET /api/news` | `GET` | Returns aggregated news articles regarding seismic activity in Turkey. |
| `GET /api/health` | `GET` | Health check route returning service and API connectivity status. |

---


## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [Issues page](https://github.com/MrtBngl/geopulse-tr/issues).

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Developed with ❤️ for seismic safety & awareness in Turkey.
</p>
