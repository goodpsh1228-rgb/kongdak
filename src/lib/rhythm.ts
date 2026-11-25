// 탭 타임스탬프(ms)로부터 심박수와 리듬 규칙성을 계산

/** 리듬 평가에 필요한 최소 간격 수 */
export const MIN_INTERVALS_FOR_RHYTHM = 8
/**
 * 탭 간격 변동계수(CV) 경고 기준.
 * 사람 손가락 탭 자체의 오차(대략 수십 ms)가 있어 보수적으로 잡음.
 */
export const IRREGULAR_CV_THRESHOLD = 0.2
/** 중앙값의 이 배수를 넘는 간격 = 긴 멈춤 (탭 누락 또는 박동 탈락 · 맥박 결손) */
export const PAUSE_RATIO = 1.8
/** 중앙값의 이 배수 미만 간격 = 두 번 탭(중복)으로 보고 제외 */
export const DOUBLE_TAP_RATIO = 0.5
/** 긴 멈춤을 판단하려면 기준(중앙값)이 안정적이어야 해서 최소 간격 수를 둠 */
export const MIN_INTERVALS_FOR_PAUSE = 4

export function intervals(taps: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < taps.length; i++) out.push(taps[i] - taps[i - 1])
  return out
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * 탭 간격 기반 BPM. 평균 간격을 사용(불규칙 리듬에서도 실제 박동 수를 반영).
 * 단, 탭 누락/중복으로 보이는 극단값(중앙값의 0.5배 미만 = 중복 탭 / 1.8배 초과 = 누락 탭)은 제외.
 */
export function bpmFromTaps(taps: number[]): number | undefined {
  const iv = cleanIntervals(intervals(taps))
  if (iv.length < 2) return undefined
  const mean = iv.reduce((a, b) => a + b, 0) / iv.length
  return Math.round(60000 / mean)
}

export function cleanIntervals(iv: number[]): number[] {
  if (iv.length < 3) return iv
  const m = median(iv)
  return iv.filter((x) => x >= m * DOUBLE_TAP_RATIO && x <= m * PAUSE_RATIO)
}

/** 최근 n개 간격으로 계산한 실시간 BPM */
export function liveBpm(taps: number[], n = 6): number | undefined {
  return bpmFromTaps(taps.slice(-(n + 1)))
}

/** 정해진 시간 동안 센 박동 수로 BPM 계산 (타이머 모드) */
export function bpmFromCount(count: number, seconds: number): number {
  return Math.round((count * 60) / seconds)
}

export function coefficientOfVariation(xs: number[]): number | undefined {
  if (xs.length < 2) return undefined
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1)
  return Math.sqrt(variance) / mean
}

/** 긴 멈춤으로 보이는 간격의 위치(간격 인덱스) */
export function pauseIndices(iv: number[]): number[] {
  if (iv.length < MIN_INTERVALS_FOR_PAUSE) return []
  const m = median(iv)
  return iv.flatMap((x, i) => (x > m * PAUSE_RATIO ? [i] : []))
}

export interface RhythmResult {
  assessable: boolean
  cv?: number
  irregular: boolean
  /** 긴 멈춤 횟수 (탭 누락인지 박동 탈락인지는 앱이 구분할 수 없음) */
  pauses: number
  /** 멈춤을 실제 박동 탈락으로 볼 때의 BPM (멈춤이 있을 때만) */
  bpmWithPauses?: number
}

export function assessRhythm(taps: number[]): RhythmResult {
  const raw = intervals(taps)
  // 긴 멈춤은 버리지 않고 따로 셈
  const pauses = pauseIndices(raw).length
  let bpmWithPauses: number | undefined
  if (pauses > 0) {
    const m = median(raw)
    const kept = raw.filter((x) => x >= m * DOUBLE_TAP_RATIO) // 중복 탭만 제외, 멈춤은 포함
    bpmWithPauses = Math.round(60000 / (kept.reduce((a, b) => a + b, 0) / kept.length))
  }
  // 변동성(CV)은 누락 · 중복 탭으로 보이는 간격을 뺀 나머지로 평가 (오경보 방지)
  const iv = cleanIntervals(raw)
  if (iv.length < MIN_INTERVALS_FOR_RHYTHM) return { assessable: false, irregular: false, pauses, bpmWithPauses }
  const cv = coefficientOfVariation(iv)!
  return { assessable: true, cv, irregular: cv > IRREGULAR_CV_THRESHOLD, pauses, bpmWithPauses }
}
