import { useEffect, useRef, useState } from 'react'
import { Pet, type PetHandle } from '../components/Pet'
import { DisclaimerFooter, TopBar } from '../components/ui'
import { guidanceFor, irregularGuidance, pauseGuidance, type GuidanceBlock } from '../lib/guidance'
import { getDraft, moodFor } from '../lib/helpers'
import { SOURCE_CITATION } from '../lib/ranges'
import { MIN_INTERVALS_FOR_RHYTHM } from '../lib/rhythm'
import { navigate } from '../lib/router'
import { useL, useSettings } from '../lib/settings'
import { useScreenColor } from '../lib/useScreenColor'

/** 방금 측정한 결과 (저장하지 않음) */
export function Result() {
  const { t } = useSettings()
  const m = getDraft()
  const pet = useRef<PetHandle>(null)
  // 참고 레이아웃의 연회색 바탕 (다크 모드에서도 동일)
  useScreenColor('#f9f9fb')

  useEffect(() => {
    if (!m) return navigate('/', true) // 새로고침 등으로 결과가 사라진 경우
    const id = setTimeout(() => pet.current?.beat(), 250)
    return () => clearTimeout(id)
  }, [m])

  if (!m) return null

  const g = guidanceFor(m.status, m.species)
  const rg = m.irregular ? irregularGuidance(m.species) : undefined
  const pg = m.pauses > 0 ? pauseGuidance() : undefined
  const rhythmAssessable = m.taps.length - 1 >= MIN_INTERVALS_FOR_RHYTHM
  const statusText = m.status === 'brady' ? t.bradyFull : m.status === 'tachy' ? t.tachyFull : t.normal

  const rhythmText = m.irregular ? '불규칙 의심' : rhythmAssessable ? '규칙적' : '평가 불가'
  const rhythmSub = m.cv !== undefined ? `${t.cv} ${(m.cv * 100).toFixed(0)}%` : '탭 9회 이상 필요'

  return (
    <div className="screen result">
      <TopBar title={t.result} back={() => navigate('/', true)} />
      <main className="content">
        {/* ① 판정 묶음 (근접성): 그림 → 상태 → 큰 BPM → 범위 막대 → 정상 범위. 내부 간격은 좁게, 아래 묶음과는 넓게 */}
        <div className="result-group hero-group">
        <section className="result-head">
          <Pet ref={pet} species={m.species} mood={moodFor(m.status, m.irregular || m.pauses > 0)} size={130} />
          <div className={`result-status ${m.status}`}>{statusText}</div>
          <div className="result-bpm">
            {m.bpm}
            <span>{t.bpm}</span>
          </div>
        </section>

        {/* 정상 범위 막대 + 측정값 배지 */}
        <RangeBar bpm={m.bpm} min={m.range.min} max={m.range.max} status={m.status} />
        {/* 막대 아래: 체격 · 정상 범위 */}
        <div className="result-meta">
          <span>{t[`range_${m.rangeKey}`]}</span>
          <span>
            {t.normalRangeShort} {m.range.min}–{m.range.max} {t.bpm}
          </span>
        </div>
        </div>

        {/* ② 리듬 지표 묶음: 리듬 | 긴 멈춤 */}
        <section className="card split-card">
          <div className="split-item">
            <RhythmIcon warn={m.irregular} />
            <span className="split-label">리듬</span>
            <span className={`split-value ${m.irregular ? 'warn' : ''}`}>{rhythmText}</span>
            <span className="split-sub">{rhythmSub}</span>
          </div>
          <div className="split-item">
            <PauseIcon warn={m.pauses > 0} />
            <span className="split-label">{t.pauseChip}</span>
            <span className={`split-value ${m.pauses > 0 ? 'warn' : ''}`}>
              {m.pauses}
              {t.times}
            </span>
            <span className="split-sub">
              {m.pauses === 0
                ? '없음'
                : m.bpmWithPauses !== undefined
                  ? `${t.pauseBpmIfDropped} ${m.bpmWithPauses} ${t.bpm}`
                  : '아래 검토 안내 참고'}
            </span>
          </div>
        </section>

        {m.status === 'normal' && !m.irregular && m.pauses === 0 && (
          <p className="card ok-msg">
            <i className="acc-dot normal" aria-hidden="true" />
            {t.normalMsg}
          </p>
        )}

        {/* ③ 검토 안내 묶음: 머리말 아래 항목별 카드 (펼쳐도 다음 항목과 섞이지 않게), 위 지표와 같은 색 점으로 연결 (유사성) */}
        {(g || rg || pg) && (
          <section className="result-group">
            <h2 className="group-label">검토 안내</h2>
            <div className="guide-list">
              {g && <GuidanceCard title={statusText} block={g} tone={m.status} />}
              {rg && <GuidanceCard title={t.rhythmReview} block={rg} tone="warn" />}
              {pg && <GuidanceCard title={t.pauseReview} block={pg} tone="warn" />}
            </div>
          </section>
        )}

        {/* ④ 행동: 카드 없이 버튼 + 바로 아래 안내 */}
        <div className="result-actions">
          <button className="btn primary block" onClick={() => navigate('/', true)}>
            {t.remeasure}
          </button>
          <p className="muted tiny center">{t.notSaved}</p>
        </div>

        {/* ⑤ 꼬리말: 출처 + 면책 한 묶음 */}
        <footer className="result-foot">
          <p className="cite">
            {t.rangeSource}: {SOURCE_CITATION}
          </p>
          <DisclaimerFooter />
        </footer>
      </main>
    </div>
  )
}

/** 정상 범위 막대: 위에 기준 숫자, 측정값 위치에 상태색 배지 */
function RangeBar({ bpm, min, max, status }: { bpm: number; min: number; max: number; status: string }) {
  const span = max - min
  const lo = Math.max(0, Math.round(min - span * 0.5))
  const hi = Math.round(max + span * 0.5)
  const clamp = (v: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))
  const pct = (v: number) => `${clamp(v)}%`
  return (
    <section className="rb2" aria-label={`${min}–${max} 중 ${bpm}`}>
      <div className="rb2-badge-row">
        <span className={`rb2-badge ${status}`} style={{ left: pct(bpm) }}>
          {bpm}
        </span>
      </div>
      <div className="rb2-ticks">
        {[min, max].map((v) => (
          <span key={v} style={{ left: pct(v) }} className="strong">
            {v}
          </span>
        ))}
      </div>
      <div className="rb2-track">
        <div className="rb2-ok" style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }} />
        <div className={`rb2-dot ${status}`} style={{ left: pct(bpm) }} />
      </div>
    </section>
  )
}

function RhythmIcon({ warn }: { warn: boolean }) {
  return (
    <svg className={`split-icon ${warn ? 'warn' : ''}`} width="44" height="36" viewBox="0 0 44 36" aria-hidden="true">
      <path d="M4 18h8l3-8 5 16 4-12 3 4h13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PauseIcon({ warn }: { warn: boolean }) {
  return (
    <svg className={`split-icon ${warn ? 'warn' : ''}`} width="44" height="36" viewBox="0 0 44 36" aria-hidden="true">
      <circle cx="22" cy="18" r="12" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M18.5 13v10M25.5 13v10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

/**
 * 검토 안내 (접힘): 제목을 누르면 감별 진단 목록이 펼쳐지고,
 * 그 안에서 '체크리스트'와 '추가 검사'를 각각 다시 펼쳐 봄
 */
function GuidanceCard({ title, block, tone }: { title: string; block: GuidanceBlock; tone: string }) {
  const { t } = useSettings()
  const L = useL()
  const [open, setOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [testsOpen, setTestsOpen] = useState(false)
  const [checked, setChecked] = useState<Set<number>>(new Set())

  return (
    <div className={`card guide-row ${tone} ${open ? 'open' : ''}`}>
      <button className="acc-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>
          <i className={`acc-dot ${tone}`} aria-hidden="true" />
          <strong>{title}</strong>
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="acc-body">
          {block.notes.map((n, i) => (
            <p key={i} className="note caution">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 2 20.5h20L12 3Z" fill="currentColor" strokeLinejoin="round" />
                <path d="M12 10v4.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="12" cy="17.4" r="1.3" fill="#fff" />
              </svg>
              <span>{L(n)}</span>
            </p>
          ))}
          {block.differentials.map((d, i) => (
            <div key={i} className="ddx">
              <div className="ddx-group">{L(d.group)}</div>
              <ul>
                {d.items.map((it, j) => (
                  <li key={j}>{L(it)}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="sub-acc">
            <button className="sub-head" onClick={() => setChecklistOpen((o) => !o)} aria-expanded={checklistOpen}>
              <span>
                {t.checklist}
                <small>
                  {checked.size}/{block.checklist.length}
                </small>
              </span>
              <Chevron open={checklistOpen} />
            </button>
            {checklistOpen && (
              <ul className="checklist">
                {block.checklist.map((c, i) => (
                  <li key={i}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked.has(i)}
                        onChange={() =>
                          setChecked((s) => {
                            const n = new Set(s)
                            if (n.has(i)) n.delete(i)
                            else n.add(i)
                            return n
                          })
                        }
                      />
                      <span>{L(c)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sub-acc">
            <button className="sub-head" onClick={() => setTestsOpen((o) => !o)} aria-expanded={testsOpen}>
              <span>
                {t.tests}
                <small>{block.tests.length}</small>
              </span>
              <Chevron open={testsOpen} />
            </button>
            {testsOpen && (
              <ul className="tests">
                {block.tests.map((x, i) => (
                  <li key={i}>{L(x)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`acc-chevron ${open ? 'open' : ''}`} width="14" height="9" viewBox="0 0 14 9" aria-hidden="true">
      <path d="m1.5 1.5 5.5 5.5 5.5-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
