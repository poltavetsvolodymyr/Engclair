import type { Sm2State } from '@/lib/sm2'

/** Saved scheduling state for every card the user has reviewed, keyed by card id. */
export type ProgressMap = Record<string, Sm2State>
