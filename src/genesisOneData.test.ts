import { describe, expect, it } from 'vitest'
import { genesisOnePassages, genesisOneRipples } from './genesisOneData'

describe('Genesis 1 editorial import', () => {
  it('contains only valid approved ripples with resolvable passages', () => {
    const passageIds = new Set(genesisOnePassages.map((passage) => passage.id))

    expect(genesisOneRipples).toHaveLength(18)
    expect(new Set(genesisOneRipples.map((ripple) => ripple.id)).size).toBe(genesisOneRipples.length)
    for (const ripple of genesisOneRipples) {
      expect(ripple.status).toBe('approved')
      expect(ripple.members.length).toBeGreaterThanOrEqual(2)
      expect(ripple.anchorPassageId).toBe(ripple.members[0].passageId)
      expect(ripple.members.every((member) => passageIds.has(member.passageId))).toBe(true)
    }
  })

  it('keeps the editorial meaning of the pre-creation source', () => {
    const ripple = genesisOneRipples.find((item) => item.id === 'gen-1-1-before-creation')!
    expect(ripple.type).toBe('השלמה כרונולוגית')
    expect(ripple.members[1]).toMatchObject({ role: 'רקע מקדים' })
  })

  it('excludes the sea-monster references identified as not included', () => {
    const ripple = genesisOneRipples.find((item) => item.id === 'gen-1-21-sea-creatures')!
    const memberIds = ripple.members.map((member) => member.passageId)

    expect(memberIds).not.toContain('ps-74-13-14')
    expect(memberIds).not.toContain('isa-51-9')
    expect(memberIds).toContain('job-40-15-19-25')
  })
})
