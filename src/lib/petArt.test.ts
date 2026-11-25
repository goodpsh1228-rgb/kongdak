import { describe, expect, it } from 'vitest'
import css from '../styles.css?raw'
import { MOOD_BG, petGeometry } from './petArt'

describe('petArt', () => {
  it('is deterministic (same shape every render)', () => {
    const a = petGeometry('dog', false, false)
    // 캐시를 우회해 다시 계산해도 같은 결과인지: 다른 키로 만든 뒤 비교
    const b = petGeometry('dog', false, true)
    expect(a.head).toBe(petGeometry('dog', false, false).head)
    expect(a.head).not.toBe(b.head) // 작은 크기는 거칠기가 다름
  })
  it('produces finite coordinates', () => {
    for (const sp of ['dog', 'cat'] as const)
      for (const bristle of [false, true]) {
        const g = petGeometry(sp, bristle, false)
        const all = [g.head, g.neck, g.headHatch, g.neckHatch, ...g.headFur.map((s) => s.d), ...g.ears.map((e) => e.d)].join(' ')
        expect(all).not.toMatch(/NaN|Infinity/)
        expect(g.headFur.length).toBeGreaterThan(50)
      }
  })
  it('bristled fur is longer (tachycardia)', () => {
    const len = (d: string) => d.length
    const calm = petGeometry('cat', false, false).headFur
    const bristled = petGeometry('cat', true, false).headFur
    expect(bristled.length).toBe(calm.length)
    expect(bristled.map((s) => len(s.d))).not.toEqual(calm.map((s) => len(s.d)))
  })
  it('status colors match the CSS tokens', () => {
    expect(css).toContain(`--ok: ${MOOD_BG.happy}`)
    expect(css).toContain(`--brady: ${MOOD_BG.sleepy}`)
    expect(css).toContain(`--tachy: ${MOOD_BG.stressed}`)
    expect(css).toContain(`--warn: ${MOOD_BG.worried}`)
    expect(css).toContain(`--idle: ${MOOD_BG.idle}`)
  })
})
