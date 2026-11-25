import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { MeasureMode, TimerSeconds } from './helpers'
import { strings, type Dict } from './i18n'
import { RANGE_KEYS, DEFAULT_RANGES, LEGACY_DEFAULT_RANGES, type DogSize, type RangeTable, type Species } from './ranges'

export interface Settings {
  sound: boolean
  ranges: RangeTable
  juvenileMonths: number
  disclaimerAccepted: boolean
  quick: { species: Species; dogSize: DogSize; juvenile: boolean }
  measure: { mode: MeasureMode; seconds: TimerSeconds }
}

const KEY = 'kongdak.settings.v1'

const defaults: Settings = {
  sound: true,
  ranges: DEFAULT_RANGES,
  juvenileMonths: 6,
  disclaimerAccepted: false,
  quick: { species: 'dog', dogSize: 'standard', juvenile: false },
  measure: { mode: 'tap', seconds: 15 },
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults
    const s = JSON.parse(raw) as Partial<Settings> & { lang?: unknown }
    delete s.lang // 예전 언어 설정은 무시 (한국어로 통일)
    const ranges = { ...DEFAULT_RANGES }
    for (const k of RANGE_KEYS) {
      const r = s.ranges?.[k]
      if (!r) continue
      // 잠시 썼던 Merck 기본값을 그대로 쓰고 있던 항목은 Tilley 기본값으로, 직접 바꾼 값은 유지
      const legacy = LEGACY_DEFAULT_RANGES[k]
      if (r.min === legacy.min && r.max === legacy.max) continue
      ranges[k] = r
    }
    return { ...defaults, ...s, ranges }
  } catch {
    return defaults
  }
}

interface Ctx {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  t: Dict
}

const SettingsContext = createContext<Ctx | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      /* 사생활 보호 모드 등에서는 저장 생략 */
    }
  }, [settings])

  const value = useMemo<Ctx>(
    () => ({
      settings,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      t: strings,
    }),
    [settings],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('SettingsProvider missing')
  return ctx
}

/** 안내 콘텐츠({ ko, en })에서 한국어 문구 선택 */
export function useL() {
  return (l: { ko: string; en: string }) => l.ko
}
