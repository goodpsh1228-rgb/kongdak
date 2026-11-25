import { useEffect, useState, type ReactNode } from 'react'
import { SOURCE_CITATION, DEFAULT_RANGES, type RangeKey } from '../lib/ranges'
import { goBack } from '../lib/router'
import { useSettings } from '../lib/settings'
import { useScreenColor } from '../lib/useScreenColor'

/**
 * 설정 화면 — iPhone 설정 앱 스타일 (inset grouped list)
 * 큰 왼쪽 제목 · 회색 바탕 위 흰 둥근 묶음 · 섹션 머리말/꼬리말 · 들여쓴 구분선 · iOS 스위치
 */
const DOG_KEYS: RangeKey[] = ['dogStandard', 'puppy', 'dogGiant'] // 성견 · 어린 강아지 · 대형견
const CAT_KEYS: RangeKey[] = ['cat', 'kitten']

export function SettingsScreen() {
  const { t, settings, update } = useSettings()
  const [editingJuvenile, setEditingJuvenile] = useState(false)
  // 페이지 바탕 · 브라우저 상단도 iOS 설정 바탕색으로
  useScreenColor(matchMedia('(prefers-color-scheme: dark)').matches ? '#000000' : '#f2f2f7')

  /** 입력 완료(blur) 시 반영. 잘못된 값이면 false를 돌려 원래 값으로 되돌림 */
  function setRange(k: RangeKey, field: 'min' | 'max', v: string): boolean {
    const n = parseInt(v, 10)
    if (!Number.isFinite(n) || n <= 0 || n > 400) return false
    const next = { ...settings.ranges[k], [field]: n }
    if (next.min >= next.max) return false
    update({ ranges: { ...settings.ranges, [k]: next } })
    return true
  }

  const anyChanged = [...DOG_KEYS, ...CAT_KEYS].some(
    (k) => settings.ranges[k].min !== DEFAULT_RANGES[k].min || settings.ranges[k].max !== DEFAULT_RANGES[k].max,
  )

  const rangeCell = (k: RangeKey) => {
    const r = settings.ranges[k]
    const d = DEFAULT_RANGES[k]
    const name = t[`range_${k}`]
    return (
      <Cell
        key={k}
        label={name}
      >
        <span className="ios-range">
          <NumInput value={r.min} changed={r.min !== d.min} label={`${name} ${t.min}`} commit={(v) => setRange(k, 'min', v)} />
          <span className="ios-dash">–</span>
          <NumInput value={r.max} changed={r.max !== d.max} label={`${name} ${t.max}`} commit={(v) => setRange(k, 'max', v)} />
        </span>
      </Cell>
    )
  }

  return (
    <div className="screen ios-settings">
      {/* iOS 설정처럼: 왼쪽 원형 뒤로 버튼 + 가운데 작은 제목 */}
      <header className="ios-nav">
        <button className="ios-back" onClick={() => goBack('/')} aria-label={t.back}>
          <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true">
            <path d="M9.75 2 2.25 10l7.5 8" transform="translate(0.75 0)" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="ios-nav-title">{t.settings}</h1>
        <span className="ios-nav-side" />
      </header>

      <Group>
        <Cell label={t.sound}>
          <button
            role="switch"
            aria-checked={settings.sound}
            aria-label={t.sound}
            className={`ios-switch ${settings.sound ? 'on' : ''}`}
            onClick={() => update({ sound: !settings.sound })}
          >
            <span />
          </button>
        </Cell>
      </Group>

      <Group header={`${t.dog} 정상 범위 (BPM)`}>
        {DOG_KEYS.map(rangeCell)}
      </Group>

      <Group header={`${t.cat} 정상 범위 (BPM)`}>
        {CAT_KEYS.map(rangeCell)}
      </Group>

      <Group header={t.juvenileRuleTitle}>
        {editingJuvenile ? (
          <Cell label="기준 나이">
            <span className="ios-juvenile-edit">
              생후
              <NumInput
                value={settings.juvenileMonths}
                label={t.juvenileMonths}
                commit={(v) => {
                  const n = parseInt(v, 10)
                  if (!(n > 0 && n <= 24)) return false
                  update({ juvenileMonths: n })
                  return true
                }}
              />
              {t.juvenileUnder}
              <button className="ios-link" onClick={() => setEditingJuvenile(false)}>
                {t.doneEditing}
              </button>
            </span>
          </Cell>
        ) : (
          <Cell label="기준 나이" onClick={() => setEditingJuvenile(true)} chevron>
            <span className="ios-value">
              생후 {settings.juvenileMonths}
              {t.juvenileUnder}
            </span>
          </Cell>
        )}
      </Group>

      <Group footer={`${t.rangeSource}: ${SOURCE_CITATION}`}>
        {anyChanged ? (
          <button className="ios-cell ios-action" onClick={() => update({ ranges: DEFAULT_RANGES })}>
            {t.resetTilley}
          </button>
        ) : (
          <div className="ios-cell ios-action disabled">{t.resetTilley}</div>
        )}
      </Group>

      <p className="ios-plain-note">{t.disclaimer}</p>
    </div>
  )
}

function Group({ header, footer, children }: { header?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="ios-section">
      {header && <h2 className="ios-header">{header}</h2>}
      <div className="ios-group">{children}</div>
      {footer && <p className="ios-footer">{footer}</p>}
    </section>
  )
}

function Cell({
  label,
  chevron = false,
  onClick,
  children,
}: {
  label: ReactNode
  chevron?: boolean
  onClick?: () => void
  children?: ReactNode
}) {
  const inner = (
    <>
      <span className="ios-cell-body">
        <span className="ios-label">{label}</span>
        <span className="ios-trailing">
          {children}
          {chevron && (
            <svg className="ios-chevron" width="8" height="13" viewBox="0 0 8 13" aria-hidden="true">
              <path d="m1.5 1.5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </span>
    </>
  )
  return onClick ? (
    <button className="ios-cell" onClick={onClick}>
      {inner}
    </button>
  ) : (
    <div className="ios-cell">{inner}</div>
  )
}

/** 편집 중에는 자유롭게 입력, blur/Enter 시 반영 (잘못된 값은 되돌림) */
function NumInput({
  value,
  commit,
  changed = false,
  label,
}: {
  value: number
  commit: (v: string) => boolean
  changed?: boolean
  label?: string
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])
  const done = () => {
    if (!commit(text)) setText(String(value))
  }
  return (
    <input
      className={`ios-num ${changed ? 'changed' : ''}`}
      type="number"
      inputMode="numeric"
      aria-label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={done}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  )
}
