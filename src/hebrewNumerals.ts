const values: Array<[number, string]> = [
  [400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'],
  [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'],
  [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א'],
]

export function toHebrewNumeral(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 999) return String(value)

  let remaining = value
  let letters = ''
  for (const [number, letter] of values.filter(([number]) => number >= 100)) {
    while (remaining >= number) {
      letters += letter
      remaining -= number
    }
  }

  if (remaining === 15) {
    letters += 'טו'
  } else if (remaining === 16) {
    letters += 'טז'
  } else {
    for (const [number, letter] of values) {
      if (number >= 100) continue
      while (remaining >= number) {
        letters += letter
        remaining -= number
      }
    }
  }

  return letters
}
