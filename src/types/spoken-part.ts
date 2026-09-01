/**
 * Which half of a card the speaker buttons read out.
 *
 * The answer is both the definition and the example, read as one: the button
 * sits on the answer, not on either sentence.
 *
 * Shared ground: the card names the parts, the hook reports which one is
 * playing, and the component lights the matching button.
 */

export type SpokenPart = 'term' | 'answer'
