# BookBeacon client

This folder contains the JavaScript React/Vite frontend. The app is designed to run immediately using the mock services; no Flask service or database is shipped.

## Setup

From the repository root:

```bash
pnpm install
pnpm dev
```

Open the local address printed by Vite (default `http://localhost:3000`). To build static production assets, run `pnpm build` from the root; output is written to the root `dist/`. `pnpm preview` serves the built output locally.

The workspace pins pnpm 11.25.0. Use a Node version supported by Vite 8 (Node 20.19+ or 22.12+). To override configuration, copy `.env.example` to `.env.local`, edit values and restart Vite:

```dotenv
VITE_DATA_MODE=mock
VITE_API_BASE_URL=http://localhost:5000/api
```

`mock` is the default and uses versioned demo records plus browser localStorage. `api` sends requests through `src/services/apiClient.js`; it will surface errors if no compatible Flask backend is reachable and never falls back to mock data. Do not place server secrets in browser-exposed `VITE_` variables.

## Source areas

- `src/App.js` preserves the requested app module entry; it re-exports the `.jsx` React router shell. `src/index.js` is the HTML entry and mounts React.
- `src/pages/` contains public, student, and librarian routes.
- `src/components/` contains shared layouts and reusable table, card, map, dashboard and QR UI.
- `src/services/` owns API/mock access; UI modules must not mutate seed records.
- `src/context/` and `src/hooks/` contain shared session/app state and service hooks.
- `src/data/` contains example titles, copies, users, loans, map locations, alerts, scans and notifications.
- `src/styles/` contains tokens, global styles, layout, components and responsive rules.

## Demo authentication

- Student: `student@bookbeacon.demo`
- Librarian: `librarian@bookbeacon.demo`
- Shared demo-only password: `Beacon2026!`

This frontend uses client-side role guards for navigation only. Flask must authenticate each request and authorize every protected operation in a production deployment.

## QR behavior

The QR page always supports manual Book ID/QR identifier lookup and offers camera scanning where the browser supports it and permission is granted. Lookup proves only that an identifier exists in the selected data source. The prototype cannot confirm that a physical item is on its registered shelf; mismatch and inventory records are labeled as simulated.
