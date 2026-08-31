import type { Content } from '@/types'

/**
 * The single source of truth for everything the user sees: interface strings
 * and flashcards. Edit only this file to change copy or the deck.
 *
 * Rules:
 *  - English only. No second language anywhere, including definitions.
 *  - Keep card `id`s stable; they key the saved SM-2 progress.
 *  - Keep the deck balanced: equal numbers of `vocabulary` and `phrasal-verb`.
 *
 * Each `ui` section maps to one component under `src/components/`.
 */
export const content: Content = {
  ui: {
    header: {
      appTitle: 'Engclair',
      tagline: 'English vocabulary and phrasal verbs, one card at a time.',
    },
    stats: {
      reviewed: 'Reviewed',
      remaining: 'Left',
    },
    card: {
      frontHint: 'Recall the meaning, then reveal the answer.',
      showAnswer: 'Show answer',
      definitionLabel: 'Definition',
      exampleLabel: 'Example',
      speak: 'Hear pronunciation',
      categoryLabels: {
        'vocabulary': 'Vocabulary',
        'phrasal-verb': 'Phrasal verb',
      },
    },
    // The four hints form one ladder — how much effort the recall took —
    // so that no two of them describe the same experience.
    grades: {
      again: { label: 'Again', hint: 'New or forgotten' },
      hard: { label: 'Hard', hint: 'Only just got it' },
      good: { label: 'Good', hint: 'Took a moment' },
      easy: { label: 'Easy', hint: 'Knew it instantly' },
    },
    empty: {
      title: 'All caught up',
      body: 'No cards are due for review right now. Come back later to keep the streak going.',
    },
    done: {
      title: 'Session complete',
      body: 'You have reviewed every card that was due. Well done.',
    },
    reset: {
      button: 'Reset progress',
      confirm: 'Reset all learning progress? This cannot be undone.',
    },
    // Shown only when the device has more than one English voice to choose
    // between. The voice names themselves come from the operating system.
    voice: {
      label: 'Voice',
    },
    // Temporary, while an accent colour is being chosen. Delete this section
    // together with the ThemePicker component once one is settled on.
    themes: {
      label: 'Accent colour',
      names: {
        amber: 'Amber',
        terracotta: 'Terracotta',
        crimson: 'Crimson',
        forest: 'Forest',
        indigo: 'Indigo',
      },
    },
    footer: 'Progress is saved on this device only.',
  },

  cards: [
    // ── Vocabulary (10) ─────────────────────────────────────────────
    {
      id: 'vocab-ubiquitous',
      category: 'vocabulary',
      term: 'ubiquitous',
      audio: 'vocab-ubiquitous.mp3',
      phonetic: '/juːˈbɪkwɪtəs/',
      partOfSpeech: 'adjective',
      definition: 'Seeming to be present everywhere at the same time.',
      example: 'Smartphones have become ubiquitous in everyday life.',
    },
    {
      id: 'vocab-meticulous',
      category: 'vocabulary',
      term: 'meticulous',
      audio: 'vocab-meticulous.mp3',
      phonetic: '/məˈtɪkjələs/',
      partOfSpeech: 'adjective',
      definition: 'Showing great attention to detail; very careful and precise.',
      example: 'She kept meticulous records of every expense.',
    },
    {
      id: 'vocab-resilient',
      category: 'vocabulary',
      term: 'resilient',
      audio: 'vocab-resilient.mp3',
      phonetic: '/rɪˈzɪliənt/',
      partOfSpeech: 'adjective',
      definition: 'Able to recover quickly from difficulties or setbacks.',
      example: 'The town proved resilient and rebuilt within a year of the flood.',
    },
    {
      id: 'vocab-candid',
      category: 'vocabulary',
      term: 'candid',
      audio: 'vocab-candid.mp3',
      phonetic: '/ˈkændɪd/',
      partOfSpeech: 'adjective',
      definition: 'Honest and direct, even when the truth is awkward.',
      example: 'In a candid interview, the director admitted her first film was weak.',
    },
    {
      id: 'vocab-pragmatic',
      category: 'vocabulary',
      term: 'pragmatic',
      audio: 'vocab-pragmatic.mp3',
      phonetic: '/præɡˈmætɪk/',
      partOfSpeech: 'adjective',
      definition: 'Dealing with problems in a practical way rather than following fixed theories.',
      example: 'We need a pragmatic plan that fits the budget we actually have.',
    },
    {
      id: 'vocab-alleviate',
      category: 'vocabulary',
      term: 'alleviate',
      audio: 'vocab-alleviate.mp3',
      phonetic: '/əˈliːvieɪt/',
      partOfSpeech: 'verb',
      definition: 'To make pain or a problem less severe.',
      example: 'The new bypass was built to alleviate traffic in the town centre.',
    },
    {
      id: 'vocab-scrutiny',
      category: 'vocabulary',
      term: 'scrutiny',
      audio: 'vocab-scrutiny.mp3',
      phonetic: '/ˈskruːtəni/',
      partOfSpeech: 'noun',
      definition: 'Close and careful examination or inspection.',
      example: 'The contract came under intense scrutiny from the lawyers.',
    },
    {
      id: 'vocab-tentative',
      category: 'vocabulary',
      term: 'tentative',
      audio: 'vocab-tentative.mp3',
      phonetic: '/ˈtentətɪv/',
      partOfSpeech: 'adjective',
      definition: 'Not certain or fixed; done with hesitation.',
      example: 'We have a tentative agreement, but nothing has been signed.',
    },
    {
      id: 'vocab-inevitable',
      category: 'vocabulary',
      term: 'inevitable',
      audio: 'vocab-inevitable.mp3',
      phonetic: '/ɪnˈevɪtəbəl/',
      partOfSpeech: 'adjective',
      definition: 'Certain to happen and impossible to avoid.',
      example: 'After months without rain, water shortages were inevitable.',
    },
    {
      id: 'vocab-profound',
      category: 'vocabulary',
      term: 'profound',
      audio: 'vocab-profound.mp3',
      phonetic: '/prəˈfaʊnd/',
      partOfSpeech: 'adjective',
      definition: 'Very great or intense; showing deep insight or understanding.',
      example: 'Her speech had a profound effect on everyone in the room.',
    },

    // ── Phrasal verbs (10) ──────────────────────────────────────────
    {
      id: 'phrasal-put-off',
      category: 'phrasal-verb',
      term: 'put off',
      audio: 'phrasal-put-off.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To postpone something to a later time.',
      example: 'They put off the meeting until next week.',
    },
    {
      id: 'phrasal-run-into',
      category: 'phrasal-verb',
      term: 'run into',
      audio: 'phrasal-run-into.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To meet someone unexpectedly.',
      example: 'I ran into an old colleague at the airport.',
    },
    {
      id: 'phrasal-figure-out',
      category: 'phrasal-verb',
      term: 'figure out',
      audio: 'phrasal-figure-out.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To understand or solve something after thinking about it.',
      example: 'It took me a while to figure out how the software worked.',
    },
    {
      id: 'phrasal-give-up',
      category: 'phrasal-verb',
      term: 'give up',
      audio: 'phrasal-give-up.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To stop trying to do something.',
      example: 'She refused to give up after three failed attempts.',
    },
    {
      id: 'phrasal-bring-up',
      category: 'phrasal-verb',
      term: 'bring up',
      audio: 'phrasal-bring-up.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To mention or introduce a topic in conversation.',
      example: 'He brought up the budget problem during lunch.',
    },
    {
      id: 'phrasal-carry-on',
      category: 'phrasal-verb',
      term: 'carry on',
      audio: 'phrasal-carry-on.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To continue doing something.',
      example: 'Please carry on with your work; I will wait.',
    },
    {
      id: 'phrasal-turn-down',
      category: 'phrasal-verb',
      term: 'turn down',
      audio: 'phrasal-turn-down.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To reject or refuse an offer or request.',
      example: 'They turned down the job because the salary was too low.',
    },
    {
      id: 'phrasal-come-across',
      category: 'phrasal-verb',
      term: 'come across',
      audio: 'phrasal-come-across.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To find something by chance.',
      example: 'I came across an old photo while cleaning the attic.',
    },
    {
      id: 'phrasal-sort-out',
      category: 'phrasal-verb',
      term: 'sort out',
      audio: 'phrasal-sort-out.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To organise something or resolve a problem.',
      example: 'We need to sort out the schedule before Friday.',
    },
    {
      id: 'phrasal-look-forward-to',
      category: 'phrasal-verb',
      term: 'look forward to',
      audio: 'phrasal-look-forward-to.mp3',
      partOfSpeech: 'phrasal verb',
      definition: 'To feel pleased and excited about something that is going to happen.',
      example: 'I am looking forward to the weekend.',
    },
  ],
}
