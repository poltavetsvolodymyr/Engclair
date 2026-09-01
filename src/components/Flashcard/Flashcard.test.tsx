/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Card, FlashcardText } from '@/types'

import { Flashcard } from './Flashcard'

const card: Card = {
  id: 'vocab-example',
  category: 'vocabulary',
  term: 'ubiquitous',
  audio: 'vocab-example.mp3',
  definitionAudio: 'vocab-example-definition.mp3',
  phonetic: '/juːˈbɪkwɪtəs/',
  partOfSpeech: 'adjective',
  definition: 'Seeming to be present everywhere at the same time.',
  example: 'Smartphones have become ubiquitous in everyday life.',
}

const text: FlashcardText = {
  frontHint: 'Recall the meaning.',
  showAnswer: 'Show answer',
  definitionLabel: 'Definition',
  exampleLabel: 'Example',
  speakTerm: 'Hear pronunciation',
  speakDefinition: 'Hear the definition read aloud',
  categoryLabels: { 'vocabulary': 'Vocabulary', 'phrasal-verb': 'Phrasal verb' },
}

/** The fixture, revealed, with speech available unless told otherwise. */
function show(props: Partial<Parameters<typeof Flashcard>[0]> = {}) {
  const onSpeak = vi.fn()
  render(
    <Flashcard card={card} text={text} revealed onSpeak={onSpeak} {...props} />,
  )
  return onSpeak
}

describe('Flashcard speaker buttons', () => {
  it('offers the term and the definition separately', () => {
    show()

    expect(screen.getByRole('button', { name: text.speakTerm })).toBeTruthy()
    expect(screen.getByRole('button', { name: text.speakDefinition })).toBeTruthy()
  })

  it('asks for the part whose button was pressed', () => {
    const onSpeak = show()

    fireEvent.click(screen.getByRole('button', { name: text.speakDefinition }))

    expect(onSpeak).toHaveBeenCalledTimes(1)
    expect(onSpeak).toHaveBeenCalledWith('definition')
  })

  it('keeps the term readable before the answer is revealed', () => {
    const onSpeak = show({ revealed: false })

    // The word is the prompt, so it can always be heard; its meaning is the
    // answer, and offering to read that out would give it away.
    expect(screen.getByRole('button', { name: text.speakTerm })).toBeTruthy()
    expect(screen.queryByRole('button', { name: text.speakDefinition })).toBeNull()
    expect(onSpeak).not.toHaveBeenCalled()
  })

  it('marks only the part being read', () => {
    show({ speaking: 'definition' })

    expect(
      screen.getByRole('button', { name: text.speakTerm }).dataset.speaking,
    ).toBeUndefined()
    expect(
      screen.getByRole('button', { name: text.speakDefinition }).dataset.speaking,
    ).toBe('true')
  })

  it('shows no buttons at all on a device that cannot speak', () => {
    render(<Flashcard card={card} text={text} revealed />)

    expect(screen.queryByRole('button')).toBeNull()
  })
})
