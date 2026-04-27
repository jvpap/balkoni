# Balkon-Dielen-Planer

Web-Planer für Balkon-Holzdielen: Polygon-Umriss zeichnen, automatische Dielenverlegung, Zuschnitt-Optimierung mit minimalem Verschnitt.

## Features

- **Polygon-Umriss zeichnen** — beliebig geformte Balkonflächen direkt im Editor anlegen, Eckpunkte per Klick setzen oder numerisch eingeben.
- **Automatische Dielenverlegung** — vertikale Dielen werden automatisch über den Umriss generiert, Plankenbreite wählbar, Start links oder rechts.
- **Zuschnitt-Optimierung** — Multi-Strategie-Algorithmus (5 deterministische Heuristiken + Random-Restarts) löst das 1D-Cutting-Stock-Problem unter Berücksichtigung der Sägeschnittbreite (Kerf).
- **Fugenband-Berechnung** — Gesamtlänge und Position des benötigten Dichtbands zwischen den Dielen.
- **Bestellübersicht** — Anzahl Rohdielen pro Standardlänge, gruppierte Zuschnittliste, Gesamtverschnitt.
- **Resizable Canvas** — Editor-Größe per Resize-Handle, persistiert in `localStorage`.
- **Import/Export** — Polygonpunkte als JSON exportieren und wieder einlesen.
- **Modus „nicht zuschneidbar“** — alternativ verwendet jede Diele ihre eigene kürzeste passende Rohdiele.

## Tech-Stack

- [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- [TypeScript](https://www.typescriptlang.org/)
- [Konva.js](https://konvajs.org/) für Canvas-Rendering
- [Tailwind CSS v4](https://tailwindcss.com/) für Styling
- [Vite](https://vitejs.dev/) als Build-Tool

## Quickstart

```bash
npm install
npm run dev
```

Die App läuft anschließend unter <http://localhost:5174>.

### Live Demo

Das Projekt ist bereits über GitHub Pages unter [https://jvpap.github.io/balkoni/](https://jvpap.github.io/balkoni/) verfügbar.

### Production-Build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test           # Vitest (Unit-Tests, watch-Modus)
npm run test:run   # Vitest einmalig
npm run test:e2e   # Playwright Smoketest
```

## Code-Qualität

```bash
npm run lint       # Prettier + ESLint Check
npm run format     # Code automatisch formatieren
npm run check      # svelte-check (Typen + Svelte-Diagnostik)
```

## Projektstruktur

```
src/
├── lib/
│   ├── components/   # Svelte-Komponenten (Canvas, PointList, CuttingOptimizer, ...)
│   ├── stores/       # Svelte-Stores (planStore, ...)
│   ├── types/        # TypeScript-Typen
│   └── utils/        # Reine Logik: Geometry, Plankenberechnung, Cutting-Optimizer
├── routes/           # SvelteKit-Routen
└── tests/            # Unit-Tests (Vitest)
e2e/                  # End-to-End-Tests (Playwright)
```

## Algorithmen

- **Polygon-Geometrie** — Shoelace-Formel für Flächeninhalt, Ray-Casting für Punkt-in-Polygon, Linien-Polygon-Schnittpunkte.
- **Cutting-Stock-Optimierung** — Subset-Sum-Dynamic-Programming je Rohdiele, eingebettet in Greedy-Multi-Strategie-Heuristik mit Random-Restarts. Sägeschnitte werden korrekt mit N − 1 pro Rohdiele bewertet; konservative Aufrundung verhindert physikalisch unmögliche Kombinationen.

## Lizenz

[MIT](LICENSE) © Johann Vieselthaler
