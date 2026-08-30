import { afterEach } from 'vitest'

/**
 * Unmount anything a test rendered.
 *
 * @testing-library/react only registers its own auto-cleanup when Vitest runs
 * with `globals: true`. We import test helpers explicitly instead, so without
 * this hook rendered trees pile up in the document and queries start matching
 * elements left behind by earlier tests.
 *
 * The import is dynamic because this file also loads for Node-environment
 * suites, where there is no DOM for the library to attach to.
 */
afterEach(async () => {
  if (typeof document === 'undefined') return
  const { cleanup } = await import('@testing-library/react')
  cleanup()
})
