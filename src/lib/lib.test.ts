import { describe, expect, it } from 'vitest'
import { currentSubject, needsAgeGroup } from './helpers'
import { classify, quickRangeKey, DEFAULT_RANGES } from './ranges'
import { assessRhythm, bpmFromCount, bpmFromTaps } from './rhythm'

const regularTaps = (bpm: number, n: number) => Array.from({ length: n }, (_, i) => (i * 60000) / bpm)

describe('rhythm', () => {
  it('computes bpm from regular taps', () => {
    expect(bpmFromTaps(regularTaps(120, 10))).toBe(120)
  })
  it('ignores a missed tap (double interval)', () => {
    const taps = regularTaps(100, 10)
    taps.splice(5, 1) // 한 박동 누락
    expect(bpmFromTaps(taps)).toBe(100)
  })
  it('timer mode', () => {
    expect(bpmFromCount(30, 15)).toBe(120)
  })
  it('regular rhythm is not irregular', () => {
    expect(assessRhythm(regularTaps(120, 12)).irregular).toBe(false)
  })
  it('flags irregular rhythm', () => {
    const iv = [300, 700, 350, 650, 300, 800, 400, 600, 320, 750]
    const taps = [0]
    for (const x of iv) taps.push(taps[taps.length - 1] + x)
    expect(assessRhythm(taps).irregular).toBe(true)
  })
  it('needs enough taps', () => {
    expect(assessRhythm(regularTaps(120, 5)).assessable).toBe(false)
  })
})

describe('ranges', () => {
  it('picks range from species · size · age group', () => {
    expect(quickRangeKey('dog', 'standard', false)).toBe('dogStandard')
    expect(quickRangeKey('dog', 'giant', false)).toBe('dogGiant')
    expect(quickRangeKey('dog', 'toy', false)).toBe('dogStandard') // 예전 '소형견' 설정 → 성견
    expect(quickRangeKey('dog', 'giant', true)).toBe('puppy') // 어린 개체는 체격 무관
    expect(quickRangeKey('cat', 'toy', false)).toBe('cat') // 고양이는 체격 무관
    expect(quickRangeKey('cat', 'standard', true)).toBe('kitten')
  })
  it('classifies', () => {
    expect(classify(50, DEFAULT_RANGES.dogStandard)).toBe('brady')
    expect(classify(160, DEFAULT_RANGES.dogStandard)).toBe('normal') // Tilley 성견 70–160
    expect(classify(161, DEFAULT_RANGES.dogStandard)).toBe('tachy')
    expect(classify(110, DEFAULT_RANGES.cat)).toBe('brady') // Tilley 고양이 120–240
    expect(classify(250, DEFAULT_RANGES.cat)).toBe('tachy')
  })
})

describe('age group', () => {
  const base = { lang: 'ko', sound: true, juvenileMonths: 6, disclaimerAccepted: true, measure: { mode: 'tap', seconds: 15 } } as const
  it('cats skip age group when kitten range equals cat range (Tilley default)', () => {
    expect(needsAgeGroup('cat', DEFAULT_RANGES)).toBe(false)
    expect(needsAgeGroup('dog', DEFAULT_RANGES)).toBe(true)
    const s = { ...base, ranges: DEFAULT_RANGES, quick: { species: 'cat', dogSize: 'standard', juvenile: true } } as const
    expect(currentSubject(s).rangeKey).toBe('cat') // 어린 개체로 골라 뒀어도 구분 안 함
  })
  it('cats use age group again if the clinic sets a different kitten range', () => {
    const ranges = { ...DEFAULT_RANGES, kitten: { min: 140, max: 260 } }
    expect(needsAgeGroup('cat', ranges)).toBe(true)
    const s = { ...base, ranges, quick: { species: 'cat', dogSize: 'standard', juvenile: true } } as const
    expect(currentSubject(s).rangeKey).toBe('kitten')
  })
})

describe('rhythm robustness', () => {
  it('a single missed tap does not flag irregular, but is counted as a pause', () => {
    const taps = regularTaps(120, 14)
    taps.splice(6, 1)
    const r = assessRhythm(taps)
    expect(r.irregular).toBe(false)
    expect(r.pauses).toBe(1)
  })
})

describe('long pauses (dropped beats)', () => {
  // 100 BPM, 4박마다 1박 탈락 (2도 방실차단 패턴)
  const taps = [0]
  for (let i = 1; i <= 16; i++) taps.push(taps[i - 1] + (i % 4 === 0 ? 1200 : 600))
  it('counts every pause', () => {
    expect(assessRhythm(taps).pauses).toBe(4)
  })
  it('gives both readings: pauses excluded vs pauses as real gaps', () => {
    expect(bpmFromTaps(taps)).toBe(100) // 멈춤 = 탭 누락으로 보면
    expect(assessRhythm(taps).bpmWithPauses).toBe(80) // 멈춤 = 박동 탈락으로 보면
  })
  it('no pauses → no extra reading', () => {
    const r = assessRhythm(regularTaps(120, 12))
    expect(r.pauses).toBe(0)
    expect(r.bpmWithPauses).toBeUndefined()
  })
  it('too few taps → no pause judgement', () => {
    expect(assessRhythm([0, 500, 1500, 2000]).pauses).toBe(0)
  })
})
