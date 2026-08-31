#!/usr/bin/env node
/**
 * Record the deck's terms with a macOS voice.
 *
 * macOS hands `say` the Enhanced and Premium voices you download in System
 * Settings; iOS hands Safari none of them. So the good American voice that a
 * phone will not give the web can be baked into the deck from a Mac instead.
 *
 *   node scripts/generate-audio.mjs --voice Ava
 *   node scripts/generate-audio.mjs --voice Ava --force   # re-record existing
 *   node scripts/generate-audio.mjs --dry-run             # show the plan only
 *
 * `say -v '?'` lists the voices installed on this machine.
 *
 * Writes public/audio/<card id>.m4a and adds `audio:` to the matching card in
 * src/content.ts. Both are source assets — review the diff, then commit them.
 *
 * macOS only: `say` and `afconvert` ship with the system and exist nowhere
 * else. Nothing here was run on a Mac by its author, so read before trusting.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = join(ROOT, 'src', 'content.ts')
const AUDIO_DIR = join(ROOT, 'public', 'audio')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')
const voice = args[args.indexOf('--voice') + 1]

if (!args.includes('--voice') || !voice || voice.startsWith('--')) {
  console.error('Usage: node scripts/generate-audio.mjs --voice <name> [--force] [--dry-run]')
  console.error("Run `say -v '?'` to see what this machine has.")
  process.exit(1)
}

const source = readFileSync(CONTENT, 'utf8')

/**
 * Cards, read straight out of the authored deck.
 *
 * A regex rather than a parser: content.ts is written by hand in one shape,
 * and the count check below fails loudly if that ever stops being true.
 */
const cards = [...source.matchAll(/\bid: '([^']+)',[\s\S]{0,400}?\bterm: '([^']+)',/g)].map(
  ([, id, term]) => ({ id, term }),
)

const declared = (source.match(/^\s{6}id: '/gm) ?? []).length
if (cards.length !== declared) {
  console.error(
    `Parsed ${cards.length} cards but the deck declares ${declared}. ` +
      'The file shape changed — fix this script before trusting it.',
  )
  process.exit(1)
}

console.log(`${cards.length} cards, voice "${voice}"${dryRun ? ' (dry run)' : ''}`)
if (!dryRun) mkdirSync(AUDIO_DIR, { recursive: true })

let recorded = 0
let updated = source

for (const { id, term } of cards) {
  const file = `${id}.m4a`
  const target = join(AUDIO_DIR, file)

  if (existsSync(target) && !force) {
    console.log(`  skip  ${term} — already recorded`)
  } else if (dryRun) {
    console.log(`  would record  ${term} -> ${file}`)
    recorded += 1
  } else {
    const raw = join(AUDIO_DIR, `${id}.aiff`)
    execFileSync('say', ['-v', voice, '-o', raw, term])
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', raw, target])
    unlinkSync(raw)
    console.log(`  record  ${term} -> ${file}`)
    recorded += 1
  }

  // Point the card at its recording, unless it already is.
  const card = new RegExp(`(id: '${id}',[\\s\\S]{0,400}?term: '[^']+',\\n)(?!\\s*audio:)`)
  updated = updated.replace(card, `$1      audio: '${file}',\n`)
}

if (!dryRun && updated !== source) writeFileSync(CONTENT, updated)

console.log(
  `\n${recorded} recorded. ` +
    (dryRun ? 'Nothing written.' : 'Check `git diff` and the files in public/audio/, then commit.'),
)
