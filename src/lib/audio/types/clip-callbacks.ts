/** Lifecycle of one recorded clip. */
export interface ClipCallbacks {
  onStart?: () => void
  onEnd?: () => void
  /**
   * The clip could not be played — missing, undecodable, or blocked. The
   * caller is expected to fall back to speech synthesis rather than go silent.
   */
  onError?: () => void
}
