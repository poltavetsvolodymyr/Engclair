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
│   ├── generate-icons.py          Renders the icons below from favicon.svg
│   └── generate-audio.py          Records the deck with a neural voice
├── public/
│   ├── favicon.svg                The mark; the only source of the icons
│   ├── audio/                     Term and definition per card  [generated]
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
│       ├── SpeakButton/           Icon button; one per spoken part
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
- **The card holds its shape**: the word, its phonetics and the speaker button
  are pinned inside the card and only the answer below them scrolls, so reading
  a long definition never costs sight of what is being defined. The lower edge
  of that scroll fades rather than cutting — the mask sits on a box with no
  background of its own, so an answer too short to scroll fades nothing.
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
- **Two things can be heard, and each has its own button**: the term, beside
  the word itself, and its definition, on the label above it. Hearing a word
  and hearing what it means are different exercises, and one button could only
  do one of them. The definition's button appears with the answer — offering to
  read the meaning aloud before the answer is revealed would give it away. Which
  part is playing is one value (`SpokenPart | null` from `useSpeech`) rather
  than a flag per button, because only one thing is ever heard at a time:
  starting the definition silences the term, and the state follows.
- **Pronunciation** is two sources behind those buttons. A card may carry
  recorded clips (`audio` and `definitionAudio` in `types/card.ts`, files in
  `public/audio/`); when it does, `lib/audio` plays them, and the synthesiser
  below is the fallback for everything else. A clip that will not play — missing, undecodable, blocked —
  falls back too, so a button always makes a sound. A failure arrives twice
  over, as the element's `error` event *and* a rejected `play()` promise, so a
  clip settles exactly once; counting both made the app speak the word twice.
  Clips are precached with the shell (`globPatterns` in `vite.config.ts`) or
  offline would quietly lose them.
- **Recording clips** (`scripts/generate-audio.py`): `pip install piper-tts
  imageio-ffmpeg`, then run it. Piper is a neural synthesiser that runs
  offline; the voice is `en-us-libritts-high`, speaker 0, downloaded once into
  the git-ignored `.cache/` from a piper GitHub release (the same models are on
  Hugging Face, which some networks block). LibriTTS is the only multi-speaker
  model in that release, and that is why it wins: the single-speaker American
  voices mispronounce words outright — `ryan-high` reads "candid" closer to
  "kentar" — which no setting can fix, whereas 904 speakers give somewhere to
  go. A term is synthesised with a full stop after it; given a bare word the
  model has no sentence to end and clips the last syllable. Only where one is
  missing, though: a definition brings its own, and doubling it leaves espeak
  holding a stray period, which it then reads out as the word "dot" at the
  start of whatever is phonemised next. ffmpeg arrives as a binary
  inside the pip package, so nothing has to be installed system-wide. The
  script records two clips per card — the term as `<card id>.mp3` and its
  definition as `<card id>-definition.mp3` — encodes them, and adds `audio:`
  and `definitionAudio:` to the card, each directly under what it reads. The
  files and the edit are both source, to be reviewed and committed.
  **MP3, not AAC**: open-source Chromium builds ship no AAC decoder, and a clip
  that will not decode falls back to the very voice the recording exists to
  replace. The whole deck costs about 500 KB — a quarter of it the twenty
  terms, the rest the twenty definitions, which are sentences.
  `src/content.test.ts` checks that every clip a card claims exists on disk,
  that its name matches the card id, and that no file in the folder is claimed
  by nobody — so the deck and the folder cannot drift apart in either direction.
  **When espeak reads a word wrong**, the card gets an entry in `OVERRIDES` in
  that script — it corrects the term only, since a definition is a sentence
  where a word out of place is carried by the ones around it. Piper never sees
  letters, espeak turns them into phonemes first, and it read "resilient" with an s where the word takes a z. The card
  keeps the real term; only the synthesiser is handed something else. Two kinds,
  and the first is preferred: a **respelling** (`rezilient`), which is spelling
  and not phonetic notation, so the fix cannot invent a sound of its own on the
  way in. Verify one by phonemising it rather than by ear — the script's comment
  carries the one-liner — because most respellings change nothing at all.
  The second kind is **phonemes written out**, for what no spelling reaches:
  espeak inserts a palatal glide between a high front vowel and the vowel after
  it, so "alleviate" came out `ɐlˈiːvɪʲˌeɪt`, and all thirty respellings that
  kept its four syllables kept the glide too. An override may also slow the
  delivery (`length_scale`), which is usually what a mushy ending needs.
  **Timing is reproducible; the grain of the voice is deliberately not.** The
  model improvises both. Left free, the same word twice ran anywhere from 0.85
  to 1.04 seconds, and no comparison between two settings meant anything — you
  could not tell the change from the take — so `NOISE_W_SCALE` pins the lengths
  and a clip takes the same time to say every run. Pinning the grain as well
  would make the file identical byte for byte, and it was tried: on a single
  word the flat delivery costs almost nothing, which is what one word was
  allowed to decide. A definition is a sentence, and a sentence carries its
  intonation in exactly that variation — with it pinned the readings came out
  robotic. So it is left free, and reproducibility here means timing, not bytes.
  The deck is also read slower than the model's own pace (`LENGTH_SCALE`):
  these are recordings to learn a word from, not to be talked at.
  The model is driven directly rather than through the `piper` command, because
  the command takes only letters and some cards are recorded from phonemes.
  To redo one card, delete its file from `public/audio/` and run the script.
- **Speech synthesis** (`lib/speech/`): the fallback for a card with no
  recording — every card has one today, so it rarely speaks — through the
  browser's own `speechSynthesis`. No audio ships with the
  deck and nothing is fetched, so the feature costs zero bytes and keeps
  working offline. Two details matter and are easy to get wrong: the utterance
  language is pinned to the chosen voice's own tag, because a phone set to
  another language will otherwise read English with that language's phonetics;
  and a locally installed voice is preferred over a remote one, since a remote
  voice needs the network. `speechSynthesis.cancel()` is called only when
  something is actually being spoken — cancelling an idle queue leaves iOS
  silent for every later utterance. Apple's novelty voices — Bells, Boing,
  Zarvox and the rest, nineteen of the twenty-five an iPhone reports — can
  never be picked; they share a `com.apple.speech.synthesis.voice.` prefix, and
  a device holding nothing else still speaks rather than falling silent. There
  is no voice picker: with the deck recorded, the choice governed a case that
  no longer happens. A device without the API simply gets no button:
  `useSpeech` reports it and `App` then passes no `onSpeak`.
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
- **The icons are generated** from `public/favicon.svg` — an eclair under
  chocolate with Big Ben rising behind it — by `scripts/generate-icons.py`
  (`pip install cairosvg`). The SVG is the single source: edit it, re-run the
  script, and commit the PNGs. They are source assets, not build output, and
  `dist/` stays the only thing that is never committed.
  The script pulls the drawing apart at two ids, so keep them: `#plate` is the
  rounded background, dropped for the full-bleed variants, and `#mark` is the
  drawing, shrunk into the safe circle for maskable launchers, which crop an
  icon to whatever shape they please. It strips XML comments before looking for
  those ids — the file's own header names them, and a search that sees the
  prose matches the comment instead of the drawing.

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
