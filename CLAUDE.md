# Engclair

A mobile-first flashcard app for learning English **vocabulary** and **phrasal
verbs** with the **SM-2** spaced-repetition algorithm. Built with Vite + React +
TypeScript. Deployed to GitHub Pages at `https://<user>.github.io/Engclair/`.

## Ground rules

- **All user-facing text and cards are English only.** No second language
  anywhere, including definitions. Definitions explain the term in English.
- **Edit only `src/content.ts`** to change interface copy or the deck. It is
  fully typed against `src/types/`, so mistakes fail the build.
- The deck stays **balanced**: equal numbers of `vocabulary` and `phrasal-verb`
  cards (currently 10 + 10).
- **Never commit build output.** `dist/` is git-ignored; GitHub Actions builds
  and deploys it.
- Card `id`s are **permanent** — they key the saved SM-2 progress in
  localStorage. Renaming an id resets that card's history for every user.

## Working agreement

- **No commit lands unexplained.** Every commit is preceded by a walk through
  the change file by file — what moved and, in one line, why. The report is for
  visibility, not for permission: write it, then commit and push in the same
  breath. Do not sit waiting for approval.
- A report is a report, not a raw `git diff` dumped whole. Show the exact diff
  for a file when the owner asks for it.
- Stop and ask first only when the change is hard to walk back — history
  rewrites, a deleted branch, anything touching saved progress or card `id`s.
- Everything before the push is free: read, edit, install, run the tests. The
  work happens in a throwaway cloud container, so only the push is irreversible.

## Architecture conventions

These exist so the app stays easy to extend. Follow them when adding anything.

**Where a type lives is decided by who uses it.**

- Used by more than one module (content, hooks, several components) →
  `src/types/`, one file per domain concept, re-exported from `src/types/index.ts`.
- Belongs to exactly one component — in practice its props → that component's own
  `types/` folder, e.g. `components/Flashcard/types/flashcard-props.ts`.
- Belongs to one `lib` module → that module's `types/` folder, re-exported from
  the module barrel, e.g. `lib/sm2/types/sm2-state.ts`.

**Styles are scoped, never global.**

- Every component owns a sibling `Component.module.css`. CSS Modules scope the
  class names, so two components can both use `.title` without colliding.
- The only global CSS is `src/styles/`: `tokens.css` (design tokens as CSS
  custom properties) and `global.css` (reset + base elements). Components style
  themselves from tokens — never hard-code a colour or spacing value, including
  inside `box-shadow`.
- **The accent picker is temporary.** Everything marked `[TEMPORARY]` exists
  only so an accent colour can be chosen from the live app. To remove it, delete
  `components/ThemePicker/`, `hooks/useTheme/`, `lib/theme/`, the `ui.themes`
  block in `content.ts`, `ThemePickerText` in `types/ui.ts`, `types/theme.ts`,
  and the two lines in `App.tsx` — then fold the winning accent's four
  properties from `themes.css` back into `tokens.css` and delete `themes.css`.
- The theme is a light warm one: cream page, white cards, deep forest accent.
  Depth comes from the `--shadow-*` tokens, not from outlines — cards are lifted
  off the page rather than boxed in, and pressable things drop their shadow and
  shift 1px down. Keep new surfaces consistent with that.

**Each component is a folder** with the component, its styles, its `types/`, any
component-only helper, and an `index.ts` barrel. Import via the barrel
(`@/components/Flashcard`), never a deep path.

**Components stay presentational.** State, persistence and scheduling live in
`hooks/` and `lib/`. A component receives data and callbacks and renders them.

**`@/` is an alias for `src/`** — declared in both `vite.config.ts`
(`resolve.alias`) and `tsconfig.app.json` (`paths`). Change one, change the other.

**Tests sit next to what they test** (`sm2.ts` → `sm2.test.ts`) and are written
with Vitest. Suites run in Node by default; the ones needing `localStorage` or
React opt in with a `@vitest-environment jsdom` docblock at the top of the file.

Tests use their own fixtures and must not import `src/content.ts` — otherwise
adding a card breaks unrelated suites. The one exception is `content.test.ts`,
which exists precisely to check the deck's invariants (unique ids, balanced
categories, English-only) and should keep passing as the deck grows.

`src/test-setup.ts` unmounts rendered trees after each test. Testing Library
only auto-cleans when Vitest runs with `globals: true`, which we do not — do not
remove that file, or component tests will start matching leftover DOM from
earlier tests in the same file.

## Project structure

```
.
├── index.html                     App entry HTML (title, meta, install tags)
├── vite.config.ts                 base '/Engclair/' + '@' alias + PWA manifest
├── tsconfig*.json                 Project-references TS setup (app + node)
├── scripts/
│   ├── generate-icons.py          Redraws the icons below; no dependencies
│   └── generate-audio.py          Records the deck with a neural voice
├── public/
│   ├── favicon.svg                The mark, and the source of its geometry
│   ├── voices.html                Lists the device's voices  [TEMPORARY]
│   ├── audio/                     One recording per card  [generated]
│   ├── icon-192.png               Manifest icons  [generated]
│   ├── icon-512.png                               [generated]
│   ├── icon-maskable-512.png      Safe-zone variant for launchers [generated]
│   └── apple-touch-icon.png       iOS home screen [generated]
├── src/
│   ├── main.tsx                   React bootstrap; imports global CSS
│   ├── content.ts                 >>> THE ONLY FILE YOU NORMALLY EDIT <<<
│   │                              UI strings + the 20 starter cards
│   ├── types/                     Types shared across modules
│   │   ├── card.ts                Card, CardCategory
│   │   ├── grade.ts               GradeKey ('again' | 'hard' | 'good' | 'easy')
│   │   ├── ui.ts                  One text type per screen region + UiText
│   │   ├── content.ts             Content = { ui, cards }
│   │   └── index.ts               Barrel
│   ├── test-setup.ts              Per-test DOM cleanup (see Testing above)
│   ├── styles/
│   │   ├── tokens.css             Design tokens (the only global values)
│   │   ├── themes.css             Accent themes; must load after tokens.css
│   │   └── global.css             Reset + base element styles
│   ├── lib/                       Framework-free logic
│   │   ├── sm2/                   The algorithm; pure, no React, no storage
│   │   ├── storage/               localStorage load/save/clear of progress
│   │   ├── audio/                 Plays a card's recorded clip, if it has one
│   │   ├── speech/                Pronunciation + which voice, via the browser
│   │   ├── theme/                 Theme list + persistence  [TEMPORARY]
│   │   └── review/                Grade -> SM-2 quality bridge
│   ├── hooks/
│   │   ├── useReviewSession/      Queue, reveal, grading, persistence
│   │   │   ├── useReviewSession.ts
│   │   │   ├── build-queue.ts     Hook-only helper
│   │   │   └── types/review-session.ts
│   │   ├── useSpeech/             Is speech available, is it talking now
│   │   └── useTheme/              Accent theme state  [TEMPORARY]
│   └── components/                One folder per component
│       ├── App/                   Composition root; layout only
│       ├── Header/
│       ├── StatsBar/
│       ├── Flashcard/
│       ├── SpeakButton/           Icon button beside the term
│       ├── VoicePicker/           Chooses the voice; hidden unless there are 2+
│       ├── RevealButton/
│       ├── GradeButtons/
│       ├── SessionMessage/
│       ├── ThemePicker/           Accent swatches  [TEMPORARY]
│       └── Footer/                Owns the reset confirmation
└── .github/workflows/deploy.yml   Build on push to main, deploy via Pages
```

Each `components/X/` folder contains `X.tsx`, `X.module.css`,
`types/x-props.ts` and `index.ts`.

## How it works

- **Queue** (`hooks/useReviewSession/build-queue.ts`): collect every card that is
  due (`lib/sm2.isDue`) — new cards are always due — sorted most-overdue first.
  One card is shown at a time.
- **Reveal → grade**: the user reveals the answer, then picks
  `Again / Hard / Good / Easy`. These map to SM-2 recall qualities `2 / 3 / 4 / 5`
  (`lib/review/grades.ts`). The buttons deliberately show no interval preview:
  under SM-2 the interval is derived from the ease factor *before* the grade
  updates it, so Hard, Good and Easy always predict the same number — a grade
  only changes the interval of the *following* review. Showing it looked broken
  and leaked the algorithm at the user.
- **Scheduling** (`lib/sm2/sm2.ts`): classic SM-2. Quality `< 3` resets
  `repetitions` and sets the interval to 1 day; otherwise the interval grows
  `1 → 6 → round(interval × easeFactor)`. The ease factor is always updated and
  clamped at 1.3. A grade of `Again` also re-queues the card at the end of the
  current session.
- **Persistence** (`lib/storage/`): the full `card id → Sm2State` map is written
  to `localStorage['engclair:progress:v1']` after every grade. All access is
  try/caught, so private mode or a full quota just behaves like a fresh start.
  Bump the key suffix if the state shape ever changes.
- **Pronunciation** is two sources with one button. A card may carry a recorded
  clip (`audio` in `types/card.ts`, a file in `public/audio/`); when it does,
  `lib/audio` plays it, and the synthesiser below is the fallback for
  everything else. A clip that will not play — missing, undecodable, blocked —
  falls back too, so the button always makes a sound. A failure arrives twice
  over, as the element's `error` event *and* a rejected `play()` promise, so a
  clip settles exactly once; counting both made the app speak the word twice.
  Clips are precached with the shell (`globPatterns` in `vite.config.ts`) or
  offline would quietly lose them.
- **Recording clips** (`scripts/generate-audio.py`): `pip install piper-tts
  imageio-ffmpeg`, then run it. Piper is a neural synthesiser that runs
  offline; the American voice it uses is `en-us-ryan-high`, downloaded once
  into the git-ignored `.cache/` from a piper GitHub release (the same models
  are on Hugging Face, which some networks block). ffmpeg arrives as a binary
  inside the pip package, so nothing has to be installed system-wide. The
  script records every term, encodes, and adds `audio:` to each card — the
  files and the edit are both source, to be reviewed and committed.
  **MP3, not AAC**: open-source Chromium builds ship no AAC decoder, and a clip
  that will not decode falls back to the very voice the recording exists to
  replace. The whole deck costs about 120 KB.
  `src/content.test.ts` checks that every card claiming a recording has one on
  disk and that its name matches the card id, so the deck and the folder cannot
  drift apart.
- **Speech synthesis** (`lib/speech/`): the speaker button beside the term reads
  the word aloud through the browser's own `speechSynthesis`. No audio ships with the
  deck and nothing is fetched, so the feature costs zero bytes and keeps
  working offline. Two details matter and are easy to get wrong: the utterance
  language is pinned to the chosen voice's own tag, because a phone set to
  another language will otherwise read English with that language's phonetics;
  and a locally installed voice is preferred over a remote one, since a remote
  voice needs the network. `speechSynthesis.cancel()` is called only when
  something is actually being spoken — cancelling an idle queue leaves iOS
  silent for every later utterance. A device without the API simply gets no
  button: `useSpeech` reports it and `App` then passes no `onSpeak`.
- **Choosing the voice** (`lib/speech/voice-storage.ts`): which voice reads the
  terms is the user's call, saved under `localStorage['engclair:voice:v1']` —
  its own key, so resetting review progress cannot change how the app sounds.
  The picker only appears when the device has two or more English voices: one
  is not a choice. Apple's novelty and legacy voices are filtered out by their
  `com.apple.speech.synthesis.voice.` prefix — an iPhone reports nineteen of
  them (Bells, Boing, Zarvox, Trinoids…) against six real ones, and unfiltered
  they bury the list. What survives is one voice per accent: Samantha en-US,
  Daniel en-GB, Karen en-AU, Moira en-IE, Rishi en-IN, Tessa en-ZA. Enhanced
  and Premium voices downloaded in iOS Settings never reach the web at all, so
  that list is the whole of what an iPhone can offer. A voice is identified by more than its `voiceURI` — nothing
  in the spec makes that unique, and a device can hand two entries the same
  one. Keying on it alone dropped a voice from the list and, worse, made
  picking one of them play the other. `listEnglishVoices` sorts on one key, installed before
  remote, and stably, so the device's own order survives inside each group and
  the first entry is exactly what plays when nothing has been chosen — list and
  default can never disagree. A saved voice that has since been deleted from
  the device falls back to that same first entry rather than going silent. The
  list arrives asynchronously, so the hook also listens for `voiceschanged`;
  reading it on first render alone returns an empty array.
- **Offline** (`vite-plugin-pwa`, configured in `vite.config.ts`): the app is
  installable and runs with no network at all. Nothing is fetched at runtime —
  the deck is bundled and progress is local — so precaching the shell is enough
  to make the whole thing work on a plane or a train. `navigateFallback` serves
  `index.html` for any in-scope URL, so a deep link still opens the app offline.
  The service worker is generated only by `npm run build`; `npm run dev` runs
  without one.
- **Updates**: `registerType: 'autoUpdate'` — a new service worker takes over on
  the next visit, with no prompt to build or word it. That is safe here because
  a grade is persisted the moment it is given, so a reload never loses work. Add
  an update prompt only if that stops being true.
- **`public/voices.html` is temporary.** It lists every voice
  `speechSynthesis.getVoices()` reports on the device, English or not, with the
  flags the picker reasons about. It exists to settle "why is my voice not in
  the list" from the phone itself rather than by guesswork. Delete it once the
  voice list is trusted.
- **The icons are generated** by `scripts/generate-icons.py` from the same
  geometry as `public/favicon.svg` — a rounded square and an `E` of four bars.
  It is plain Python with no packages to install, so no image library enters the
  build. Change the mark in `favicon.svg`, mirror the numbers at the top of the
  script, re-run it, and commit the PNGs: they are source assets, not build
  output, and `dist/` stays the only thing that is never committed.

## Commands

| Command           | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm install`      | Install dependencies                        |
| `npm run dev`      | Local dev server (Vite)                     |
| `npm test`         | Run the test suite once (Vitest)            |
| `npm run test:watch` | Re-run tests on change                    |
| `npm run build`    | Type-check (`tsc -b`) then production build |
| `npm run preview`  | Serve the built `dist/` locally             |
| `python3 scripts/generate-icons.py` | Redraw the app icons in `public/` |

Note: `npm run preview` and the deployed site serve under the `/Engclair/` base
path; `npm run dev` serves under `/Engclair/` too (Vite applies `base` in dev).

To try the offline behaviour, use `npm run preview` rather than `npm run dev` —
the service worker only exists in a production build.

## Deployment

Push to `main` → `.github/workflows/deploy.yml` runs `npm ci`, `npm test`, then
`npm run build`, and publishes `dist/` with `actions/deploy-pages`. A failing
test stops the job before the build, so it never deploys. Requires repo setting
**Settings → Pages → Build and deployment → Source = GitHub Actions**.
