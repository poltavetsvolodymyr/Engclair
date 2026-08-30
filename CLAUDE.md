# Engclair

A mobile-first flashcard app for learning English **vocabulary** and **phrasal
verbs** with the **SM-2** spaced-repetition algorithm. Built with Vite + React +
TypeScript. Deployed to GitHub Pages at `https://<user>.github.io/Engclair/`.

## Ground rules

- **All user-facing text and cards are English only.** No second language
  anywhere, including definitions. Definitions explain the term in English.
- **Edit only `src/content.ts`** to change interface copy or the deck. It is
  fully typed against `src/types.ts`, so mistakes fail the build.
- The deck stays **balanced**: equal numbers of `vocabulary` and `phrasal-verb`
  cards (currently 10 + 10).
- **Never commit build output.** `dist/` is git-ignored; GitHub Actions builds
  and deploys it.
- Card `id`s are **permanent** — they key the saved SM-2 progress in
  localStorage. Renaming an id resets that card's history for every user.

## Project structure

```
.
├── index.html                  App entry HTML (title, meta, theme-color)
├── vite.config.ts              Vite config; base is '/Engclair/' for Pages
├── tsconfig*.json              Project-references TS setup (app + node)
├── public/
│   └── favicon.svg             App icon
├── src/
│   ├── main.tsx                React bootstrap; mounts <App>
│   ├── App.tsx                 All UI: queue, reveal, grading, reset
│   ├── App.css                 Component styles (mobile-first)
│   ├── index.css               Global reset, CSS variables, dark theme
│   ├── content.ts              >>> THE ONLY FILE YOU NORMALLY EDIT <<<
│   │                           UI strings + the 20 starter cards
│   ├── types.ts                Types for content.ts (Card, UiText, Content)
│   ├── sm2.ts                  SM-2 algorithm: schedule(), isDue(), previews
│   ├── storage.ts              localStorage load/save/clear of progress
│   └── vite-env.d.ts           Vite client type reference
└── .github/workflows/deploy.yml   Build on push to main, deploy via Pages
```

## How it works

- **Queue** (`App.tsx` → `buildQueue`): on load, collect every card that is due
  (`sm2.isDue`) — new cards are always due — sorted by due time. One card is
  shown at a time.
- **Reveal → grade**: the user reveals the answer, then picks
  `Again / Hard / Good / Easy`. These map to SM-2 recall qualities `2 / 3 / 4 / 5`
  (`GRADE_QUALITY` in `App.tsx`). Each grade button also previews the resulting
  interval via `sm2.previewInterval`.
- **Scheduling** (`sm2.ts` → `schedule`): classic SM-2. Quality `< 3` resets
  `repetitions` and sets the interval to 1 day; otherwise interval grows
  `1 → 6 → round(interval × easeFactor)`. Ease factor is always updated and
  clamped at 1.3. A grade of `Again` also re-queues the card at the end of the
  current session.
- **Persistence** (`storage.ts`): the full `card id → Sm2State` map is written to
  `localStorage['engclair:progress:v1']` after every grade. All access is
  try/caught, so private mode or a full quota just behaves like a fresh start.
  Bump the key suffix if the state shape ever changes.

## Commands

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm install`     | Install dependencies                          |
| `npm run dev`     | Local dev server (Vite)                       |
| `npm run build`   | Type-check (`tsc -b`) then production build   |
| `npm run preview` | Serve the built `dist/` locally               |

Note: `npm run preview` and the deployed site serve under the `/Engclair/` base
path; `npm run dev` serves under `/Engclair/` too (Vite applies `base` in dev).

## Deployment

Push to `main` → `.github/workflows/deploy.yml` runs `npm ci && npm run build`
and publishes `dist/` with `actions/deploy-pages`. Requires repo setting
**Settings → Pages → Build and deployment → Source = GitHub Actions**.
