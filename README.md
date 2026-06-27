# Project Zenith: The Celestial Eye

> **AstralWeb Innovate Round 2** — A real-time space-awareness platform that fuses live orbital telemetry, astronomical simulation, and immersive 3D visualisation into a single web experience.

**Live Demo:** [mrunmayee-kokitkar-project-zenith.vercel.app](https://mrunmayee-kokitkar-project-zenith.vercel.app)

---

## Description

Project Zenith is a full-stack, real-time space-awareness dashboard built with **Next.js App Router**. It streams live data from multiple space APIs, renders an interactive 3D Earth (CesiumJS), and lets you travel through time to see how the sky looked at any point in history or the future.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| 3D Globe | CesiumJS |
| State | Zustand |
| Animation | Framer Motion |
| Orbital Math | satellite.js (SGP4/SDP4) |
| Deployment | Vercel |

---

## APIs Used

| API | Data | Route |
|---|---|---|
| **NASA Horizons** | Planetary ephemeris | `/api/horizons` |
| **CelesTrak** | Satellite TLE sets | `/api/satellites` |
| **OpenNotify / SGP4** | Live ISS position | `/api/iss` |
| **NASA APOD** | Astronomy Picture of the Day | `/api/apod` |
| **Open-Meteo** | Observation conditions | via `real-api.ts` |
| **Nominatim** | Geocoding / reverse geocoding | `/api/geocode` |

All external API calls run through **server-side proxy routes** in `app/api/` — no API keys are exposed to the browser.

---

## Features

- **Live ISS Tracking** — Position, altitude, and velocity updated every 5 seconds via SGP4 propagation
- **3D Earth Observatory** — CesiumJS globe with multi-satellite orbit paths, constellation overlays, night mode, and mission mode
- **Sky Time Machine** — Scrub ±100 years; reconstruct the sky for any location with UTC + local time display
- **Dashboard Telemetry** — ISS position, speed, pass schedule, visible planets, cosmic twin score, observation conditions
- **Challenge Mode** — Enter any coordinate for a full cosmic intelligence report with ISS distance, Bortle scale, and sky preview
- **Coordinate Input** — All location searches accept `lat,lon` decimal and DMS formats
- **Share Links** — Deep links for Dashboard and Sky pages encode location, city, and time state

---

## Architecture

```
app/
├── api/                    # Server-side proxy routes
│   ├── iss/                # Live ISS (OpenNotify + SGP4 fallback)
│   ├── iss-passes/         # ISS pass predictions
│   ├── satellites/         # CelesTrak TLE bulk fetch
│   ├── horizons/           # NASA Horizons proxy
│   ├── apod/               # NASA APOD
│   └── geocode/            # Forward + reverse geocoding
├── components/             # Shared UI (NavBar, LocationSearch, etc.)
├── dashboard/              # Telemetry dashboard + Challenge Mode
├── globe/                  # CesiumJS 3D Earth
├── sky/                    # Sky Time Machine
└── lib/                    # Zustand store, coordinates, timezone utils
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### Installation

```bash
git clone https://github.com/sanikachowdhary/mrunmayee.kokitkar-project-zenith.git
cd mrunmayee.kokitkar-project-zenith
npm install
cp .env.example .env.local
# Fill in your keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Yes (for globe) | Cesium Ion access token from [ion.cesium.com](https://ion.cesium.com/) |
| `NASA_API_KEY` | Optional | NASA API key for APOD on the home page |
| `GOOGLE_GEOCODING_API_KEY` | Optional | Fallback geocoding when Nominatim is unavailable |
| `OPEN_METEO_URL` | Optional | Default: `https://api.open-meteo.com/v1/forecast` |

---

## Screenshots

| Page | Path |
|---|---|
| Home | `/public/screenshots/homepage_view.jpg` |
| Dashboard | `/public/screenshots/dashboard_view.jpg` |
| Globe | `/public/screenshots/globe_view.jpg` |
| Sky Time Machine | `/public/screenshots/sky_view.jpg` |

---

## App Routes

| Route | Description |
|---|---|
| `/` | Hero landing page with live ISS stats and location search |
| `/dashboard` | Real-time telemetry dashboard |
| `/globe` | Interactive 3D Earth with orbit paths and stargazing presets |
| `/sky` | Sky Time Machine — temporal sky simulation |
| `/dashboard/challenge` | Coordinate Challenge Mode for judges |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**Mrunmayee Kokitkar**
**Sanika Chowdhary**

*"Look up. The sky is not the limit — it's the beginning."*
