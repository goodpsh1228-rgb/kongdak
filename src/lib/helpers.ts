import type { Mood } from './petArt'
import { quickRangeKey, type DogSize, type HrRange, type HrStatus, type RangeKey, type RangeTable, type Species } from './ranges'
import type { Settings } from './settings'

export type MeasureMode = 'tap' | 'timer'
export const TIMER_OPTIONS = [15, 30, 60] as const
export type TimerSeconds = (typeof TIMER_OPTIONS)[number]

/** 한 번의 측정 결과 (저장하지 않고 결과 화면에만 보여줌) */
export interface Measurement {
  at: number
  bpm: number
  mode: MeasureMode
  seconds?: TimerSeconds
  taps: number[] // 첫 탭 기준 상대 ms
  species: Species
  rangeKey: RangeKey
  range: HrRange
  status: HrStatus
  cv?: number
  irregular: boolean
  /** 긴 멈춤 횟수 */
  pauses: number
  /** 멈춤을 박동 탈락으로 볼 때의 BPM (탭 모드 · 멈춤이 있을 때만) */
  bpmWithPauses?: number
}

/** 지금 고른 측정 대상 (종 · 체격 · 연령군 → 적용 범위) */
export interface Subject {
  species: Species
  dogSize: DogSize
  juvenile: boolean
  rangeKey: RangeKey
  range: HrRange
}

/** 연령 구분이 의미 있는지: 고양이는 성체 · 어린 개체 범위가 같으면(Tilley 기본값) 구분하지 않음 */
export function needsAgeGroup(species: Species, ranges: RangeTable): boolean {
  if (species === 'dog') return true
  return ranges.kitten.min !== ranges.cat.min || ranges.kitten.max !== ranges.cat.max
}

export function currentSubject(s: Settings): Subject {
  const q = s.quick
  const juvenile = q.juvenile && needsAgeGroup(q.species, s.ranges)
  const rangeKey = quickRangeKey(q.species, q.dogSize, juvenile)
  return { species: q.species, dogSize: q.dogSize, juvenile, rangeKey, range: s.ranges[rangeKey] }
}

export function moodFor(status: HrStatus | undefined, irregular = false): Mood {
  if (!status) return 'idle'
  if (status === 'brady') return 'sleepy'
  if (status === 'tachy') return 'stressed'
  return irregular ? 'worried' : 'happy'
}

export function formatDateTime(at: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(at)
}

/** 방금 측정한 결과 (새로고침하면 사라짐) */
let draft: Measurement | undefined
export const setDraft = (m: Measurement | undefined) => (draft = m)
export const getDraft = () => draft
