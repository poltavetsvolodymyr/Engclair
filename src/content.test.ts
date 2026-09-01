/// <reference types="node" />
// Referenced here rather than in tsconfig.app.json's `types`: this one suite
// reads the filesystem, and the app itself must stay unable to.
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { content } from './content'
import type { Card } from './types'

/**
 * These guard the rules the deck is authored under, not the wording itself.
 * Adding or editing a card should never make this file need an update — if it
 * does, the card broke an invariant.
 */

const { cards, ui } = content

/** Every string anywhere in the content tree, with a path for error messages. */
function collectStrings(
  value: unknown,
  path = 'content',
): { path: string; value: string }[] {
  if (typeof value === 'string') return [{ path, value }]
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => collectStrings(item, `${path}[${i}]`))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      collectStrings(item, `${path}.${key}`),
    )
  }
  return []
}

const ALL_STRINGS = collectStrings(content)

const REQUIRED_CARD_FIELDS = [
  'id',
  'term',
  'partOfSpeech',
  'definition',
  'example',
] as const satisfies readonly (keyof Card)[]

describe('deck', () => {
  it('has a stable, unique id for every card', () => {
    const ids = cards.map((card) => card.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is balanced between vocabulary and phrasal verbs', () => {
    const vocabulary = cards.filter((c) => c.category === 'vocabulary')
    const phrasal = cards.filter((c) => c.category === 'phrasal-verb')

    expect(vocabulary.length).toBe(phrasal.length)
    expect(vocabulary.length + phrasal.length).toBe(cards.length)
  })

  it('is not empty', () => {
    expect(cards.length).toBeGreaterThan(0)
  })

  it('fills in every required field', () => {
    for (const card of cards) {
      for (const field of REQUIRED_CARD_FIELDS) {
        expect(card[field]?.trim(), `${card.id}.${field}`).toBeTruthy()
      }
    }
  })

  it('writes phonetics in slash-delimited IPA when present', () => {
    for (const card of cards) {
      if (card.phonetic === undefined) continue
      expect(card.phonetic, card.id).toMatch(/^\/.+\/$/)
    }
  })

  it('ends every example with sentence punctuation', () => {
    for (const card of cards) {
      expect(card.example, card.id).toMatch(/[.!?]$/)
    }
  })
})

describe('interface text', () => {
  it('leaves no string blank', () => {
    for (const { path, value } of ALL_STRINGS) {
      expect(value.trim(), path).toBeTruthy()
    }
  })

  it('labels every card category', () => {
    for (const card of cards) {
      expect(ui.card.categoryLabels[card.category], card.category).toBeTruthy()
    }
  })

  it('names every grade the UI can award', () => {
    for (const grade of ['again', 'hard', 'good', 'easy'] as const) {
      expect(ui.grades[grade].label).toBeTruthy()
      expect(ui.grades[grade].hint).toBeTruthy()
    }
  })
})

describe('English-only rule', () => {
  it('contains no Cyrillic anywhere in the content', () => {
    const offenders = ALL_STRINGS.filter(({ value }) =>
      /[Ѐ-ӿ]/.test(value),
    )

    expect(offenders).toEqual([])
  })

  it('contains no CJK characters anywhere in the content', () => {
    const offenders = ALL_STRINGS.filter(({ value }) =>
      /[぀-ヿ一-鿿가-힯]/.test(value),
    )

    expect(offenders).toEqual([])
  })
})

describe('recorded pronunciation', () => {
  /** Every clip a card claims, with the name it is expected to carry. */
  const claimed = content.cards.flatMap((card) =>
    (
      [
        [card.audio, `${card.id}.mp3`],
        [card.definitionAudio, `${card.id}-definition.mp3`],
      ] as const
    )
      .filter(([file]) => file)
      .map(([file, expected]) => ({ id: card.id, file: file as string, expected })),
  )

  it('every card that claims a recording has one on disk', () => {
    const missing = claimed
      .filter((clip) => !existsSync(join('public', 'audio', clip.file)))
      .map((clip) => clip.file)

    expect(missing).toEqual([])
  })

  it('names each recording after the card, so the two cannot drift apart', () => {
    const mismatched = claimed
      .filter((clip) => clip.file !== clip.expected)
      .map((clip) => clip.file)

    expect(mismatched).toEqual([])
  })

  it('leaves no clip in the folder that no card claims', () => {
    const orphans = readdirSync(join('public', 'audio'))
      .filter((file) => file.endsWith('.mp3'))
      .filter((file) => !claimed.some((clip) => clip.file === file))

    expect(orphans).toEqual([])
  })
})
