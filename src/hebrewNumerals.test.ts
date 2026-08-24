import { describe, expect, it } from 'vitest'
import { toHebrewNumeral } from './hebrewNumerals'

describe('toHebrewNumeral', () => {
  it.each([
    [1, 'א'],
    [6, 'ו'],
    [15, 'טו'],
    [16, 'טז'],
    [24, 'כד'],
    [119, 'קיט'],
    [150, 'קנ'],
  ])('formats chapter %i as %s', (value, expected) => {
    expect(toHebrewNumeral(value)).toBe(expected)
  })
})
