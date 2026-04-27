# Contributing

Vielen Dank für dein Interesse an diesem Projekt!

## Development-Setup

```bash
npm install
npm run dev
```

## Vor jedem Commit

```bash
npm run lint        # Prettier + ESLint
npm run check       # svelte-check
npm run test:run    # Vitest
npm run build       # Build muss durchlaufen
```

Die GitHub-Actions-CI führt dieselben Schritte aus.

## Pull Requests

- Branch direkt von `main` ausgehen lassen.
- Aussagekräftige Commit-Messages auf Deutsch oder Englisch.
- Bei Änderungen an der Logik (`src/lib/utils`) bitte passende Unit-Tests in `src/tests/` hinzufügen oder erweitern.
- Komponenten-Änderungen idealerweise mit Playwright-Smoketests absichern, falls UI-relevant.

## Code-Stil

- Tabs für Einrückung (Svelte/TS) — wird über Prettier durchgesetzt.
- Kommentare und User-facing Strings auf Deutsch (Domain-Sprache).
- Bezeichner und Code auf Englisch, wo es üblich ist (`width`, `length`, ...).

## Bug-Reports / Feature-Requests

Bitte Issues mit klarer Reproduktionsbeschreibung anlegen. Bei UI-Bugs gerne Screenshot/Recording beifügen.
