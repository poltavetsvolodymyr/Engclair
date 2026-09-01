/**
 * Which half of a card the speaker buttons read out.
 *
 * Shared ground: the card names the parts, the hook reports which one is
 * playing, and the component lights the matching button.
 */

export type SpokenPart = 'term' | 'definition'
