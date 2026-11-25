// 정상 심박수 참고범위 — Tilley ECG 정상 참고치
//   성견 70–160 · 대형견(giant breeds) 60–140 · 어린 강아지 최대 220 · 고양이 120–240
// Tilley LP. Essentials of Canine and Feline Electrocardiography;
// Tilley LP, Smith FWK et al. Manual of Canine and Feline Cardiology.
// 원문의 토이견(최대 180) 구분은 임상에서 잘 쓰지 않아 기본 분류에서 뺌 (예전 설정 호환을 위해 값만 남김)

export type Species = 'dog' | 'cat'
export type DogSize = 'toy' | 'standard' | 'giant'

export type RangeKey = 'dogStandard' | 'dogGiant' | 'dogToy' | 'puppy' | 'cat' | 'kitten'

export interface HrRange {
  min: number
  max: number
}

export type RangeTable = Record<RangeKey, HrRange>

export const RANGE_KEYS: RangeKey[] = ['dogStandard', 'dogGiant', 'dogToy', 'puppy', 'cat', 'kitten']

export const DEFAULT_RANGES: RangeTable = {
  // 성견 (adult dogs)
  dogStandard: { min: 70, max: 160 },
  // 대형견 (giant breeds: 그레이트 데인, 마스티프 등)
  dogGiant: { min: 60, max: 140 },
  // 사용 안 함 (예전 '소형견' 설정 호환용)
  dogToy: { min: 70, max: 180 },
  // 어린 강아지: 원문은 상한("up to 220")만 제시 → 하한은 성견 기준
  puppy: { min: 70, max: 220 },
  cat: { min: 120, max: 240 },
  // 어린 고양이: 원문에 별도 값 없음 → 고양이 기준
  kitten: { min: 120, max: 240 },
}

/** 잠시 썼던 Merck 기준 기본값 — 사용자가 직접 바꾸지 않았다면 Tilley로 되돌릴 때 씀 */
export const LEGACY_DEFAULT_RANGES: RangeTable = {
  dogStandard: { min: 70, max: 180 },
  dogGiant: { min: 60, max: 180 },
  dogToy: { min: 70, max: 180 },
  puppy: { min: 70, max: 220 },
  cat: { min: 150, max: 220 },
  kitten: { min: 150, max: 220 },
}

/** 원문 값이 아니라 보완 적용한 항목 (UI에 표시) */
export const RANGE_NOTES: Partial<Record<RangeKey, 'lowerFromAdult' | 'catApplied'>> = {
  puppy: 'lowerFromAdult',
  kitten: 'catApplied',
}

export const SOURCE_CITATION =
  'Tilley LP. Essentials of Canine and Feline Electrocardiography; Tilley LP, Smith FWK. Manual of Canine and Feline Cardiology.'

export type HrStatus = 'brady' | 'normal' | 'tachy'

export function classify(bpm: number, range: HrRange): HrStatus {
  if (bpm < range.min) return 'brady'
  if (bpm > range.max) return 'tachy'
  return 'normal'
}

/** 환자 정보 없이 종 · 체격 · 연령군만으로 범위 선택 (빠른 측정) */
export function quickRangeKey(species: Species, dogSize: DogSize, juvenile: boolean): RangeKey {
  if (species === 'cat') return juvenile ? 'kitten' : 'cat'
  if (juvenile) return 'puppy'
  if (dogSize === 'giant') return 'dogGiant'
  return 'dogStandard'
}
