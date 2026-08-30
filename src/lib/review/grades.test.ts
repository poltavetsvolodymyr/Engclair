import { describe, expect, it } from 'vitest'

import type { GradeKey } from '@/types'

import { GRADE_QUALITY, isFailedGrade } from './grades'

const ALL_GRADES: GradeKey[] = ['again', 'hard', 'good', 'easy']

describe('GRADE_QUALITY', () => {
  it('maps every grade button to an SM-2 recall quality', () => {
    expect(GRADE_QUALITY).toEqual({ again: 2, hard: 3, good: 4, easy: 5 })
  })

  it('keeps every quality inside the range SM-2 accepts', () => {
    for (const grade of ALL_GRADES) {
      expect(GRADE_QUALITY[grade]).toBeGreaterThanOrEqual(0)
      expect(GRADE_QUALITY[grade]).toBeLessThanOrEqual(5)
    }
  })

  it('increases with confidence', () => {
    const qualities = ALL_GRADES.map((grade) => GRADE_QUALITY[grade])

    expect(qualities).toEqual([...qualities].sort((a, b) => a - b))
  })
})

describe('isFailedGrade', () => {
  it('counts only "again" as a failure', () => {
    expect(isFailedGrade('again')).toBe(true)
    expect(isFailedGrade('hard')).toBe(false)
    expect(isFailedGrade('good')).toBe(false)
    expect(isFailedGrade('easy')).toBe(false)
  })

  it('agrees with the SM-2 threshold of 3', () => {
    for (const grade of ALL_GRADES) {
      expect(isFailedGrade(grade)).toBe(GRADE_QUALITY[grade] < 3)
    }
  })
})
