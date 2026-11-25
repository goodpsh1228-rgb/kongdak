import { useEffect, useRef, useState } from 'react'
import { Pet, type PetHandle } from '../components/Pet'
import { GearIcon } from '../components/ui'
import { currentSubject, moodFor, needsAgeGroup, setDraft, TIMER_OPTIONS, type MeasureMode, type TimerSeconds } from '../lib/helpers'
import { MOOD_BG } from '../lib/petArt'
import { classify, type DogSize } from '../lib/ranges'
import { assessRhythm, bpmFromCount, bpmFromTaps, liveBpm, MIN_INTERVALS_FOR_RHYTHM } from '../lib/rhythm'
import { navigate } from '../lib/router'
import { useSettings } from '../lib/settings'
import { playBeat, playDone } from '../lib/sound'
import { useScreenColor } from '../lib/useScreenColor'

const MIN_TAPS_TAP_MODE = 5

type Group = DogSize | 'juvenile' | 'adult'

/** 화면 전체 배경이 캐릭터 배경(상태색)이 되는 측정 화면 — 앱의 첫 화면 */
export function Measure() {
  const { t, settings, update } = useSettings()
  const subject = currentSubject(settings)
  const { mode, seconds } = settings.measure
  const [taps, setTaps] = useState<number[]>([])
  const [timerEnd, setTimerEnd] = useState<number>()
  const [now, setNow] = useState(() => performance.now())
  const pet = useRef<PetHandle>(null)
  const tapsRef = useRef<number[]>([])
  const finishedRef = useRef(false)

  const isTimer = mode === 'timer'
  const running = isTimer && timerEnd !== undefined
  const remaining = timerEnd ? Math.max(0, Math.ceil((timerEnd - now) / 1000)) : seconds

  const { rangeKey, range } = subject
  const bpmNow = isTimer ? undefined : liveBpm(taps)
  const liveStatus = bpmNow && taps.length >= MIN_TAPS_TAP_MODE ? classify(bpmNow, range) : undefined
  const mood = moodFor(liveStatus)
  // 체격 · 연령군: 개는 소형 · 중형 · 대형 · 어린 개체, 고양이는 범위가 다르게 설정된 경우에만 성체 · 어린 개체
  const groupValue: Group = subject.juvenile ? 'juvenile' : subject.species === 'dog' ? (subject.dogSize === 'toy' ? 'standard' : subject.dogSize) : 'adult'
  const groupOptions: { value: Group; label: string; range: { min: number; max: number } }[] =
    subject.species === 'dog'
      ? [
          // 순서: 성견 · 어린 강아지 · 대형견
          { value: 'standard', label: t.standard, range: settings.ranges.dogStandard },
          { value: 'juvenile', label: t.range_puppy, range: settings.ranges.puppy },
          { value: 'giant', label: t.giant, range: settings.ranges.dogGiant },
        ]
      : needsAgeGroup('cat', settings.ranges)
        ? [
            { value: 'adult', label: t.adult, range: settings.ranges.cat },
            { value: 'juvenile', label: t.range_kitten, range: settings.ranges.kitten },
          ]
        : []
  const groupLabel = groupOptions.find((g) => g.value === groupValue)?.label ?? ''
  const bg = MOOD_BG[mood]
  useScreenColor(bg)

  // 타이머 진행
  useEffect(() => {
    if (!running) return
    let raf = 0
    const loop = () => {
      const n = performance.now()
      setNow(n)
      if (timerEnd && n >= timerEnd) finish()
      else raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, timerEnd])

  function reset() {
    tapsRef.current = []
    finishedRef.current = false
    setTaps([])
    setTimerEnd(undefined)
  }

  function setMode(m: MeasureMode) {
    reset()
    update({ measure: { ...settings.measure, mode: m } })
  }

  function switchSpecies(sp: 'dog' | 'cat') {
    if (sp === subject.species) return
    reset()
    update({ quick: { ...settings.quick, species: sp } })
  }

  function setGroup(g: Group) {
    reset()
    const q = settings.quick
    if (g === 'juvenile') update({ quick: { ...q, juvenile: true } })
    else if (g === 'adult') update({ quick: { ...q, juvenile: false } })
    else update({ quick: { ...q, dogSize: g, juvenile: false } })
  }

  function stepSeconds(dir: -1 | 1) {
    const i = TIMER_OPTIONS.indexOf(seconds) + dir
    if (i < 0 || i >= TIMER_OPTIONS.length) return
    reset()
    update({ measure: { ...settings.measure, seconds: TIMER_OPTIONS[i] as TimerSeconds } })
  }

  function onTap() {
    if (isTimer && !running) return
    tapsRef.current = [...tapsRef.current, performance.now()]
    setTaps(tapsRef.current)
    pet.current?.beat()
    if (settings.sound) playBeat()
  }

  function start() {
    reset()
    const n = performance.now()
    setNow(n)
    setTimerEnd(n + seconds * 1000)
    if (settings.sound) playBeat() // iOS 오디오 잠금 해제
  }

  function finish() {
    if (finishedRef.current) return
    const raw = tapsRef.current
    const bpm = isTimer ? bpmFromCount(raw.length, seconds) : bpmFromTaps(raw)
    if (!bpm) return
    finishedRef.current = true
    const rel = raw.map((x) => Math.round(x - raw[0]))
    const rhythm = assessRhythm(rel)
    setDraft({
      at: Date.now(),
      bpm,
      mode,
      seconds: isTimer ? seconds : undefined,
      taps: rel,
      species: subject.species,
      rangeKey,
      range,
      status: classify(bpm, range),
      cv: rhythm.cv,
      irregular: rhythm.irregular,
      pauses: rhythm.pauses,
      // 타이머 모드는 센 박동 수로 계산하므로 멈춤이 이미 반영됨
      bpmWithPauses: isTimer ? undefined : rhythm.bpmWithPauses,
    })
    if (settings.sound) playDone()
    navigate('/result', true)
  }

  const canFinish = !isTimer && taps.length >= MIN_TAPS_TAP_MODE
  let hint2 = ''
  if (!isTimer && taps.length > 0 && taps.length < MIN_TAPS_TAP_MODE) hint2 = t.needMoreTaps
  else if (!isTimer && taps.length > 0 && taps.length <= MIN_INTERVALS_FOR_RHYTHM) hint2 = t.tapsForRhythm

  return (
    <div className="screen on-color measure" style={{ background: bg }}>
      <header className="topbar">
        {/* 측정 방식 전환: 왼쪽 위 버튼 하나. 탭 화면에선 '타이머', 타이머 화면에선 '탭'으로 넘어감 */}
        <div className="topbar-side">
          <h1 className="sr-only">{t.appName}</h1>
          <button
            className="mode-switch"
            onClick={() => setMode(isTimer ? 'tap' : 'timer')}
            disabled={running}
            aria-label={`${t.method}: ${isTimer ? t.modeTap : t.modeTimer}`}
          >
            {isTimer ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v3.5a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.7-2.3L4.3 15a1.5 1.5 0 0 1 2.3-1.9L9 15.5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="13.5" r="7.5" />
                <path d="M12 9.5v4l2.5 2M10 2.5h4M18.5 6.5l1.3-1.3" />
              </svg>
            )}
            <span>{isTimer ? t.modeTap : t.modeTimer}</span>
          </button>
        </div>
        <span />
        <div className="topbar-side right">
          <button className="icon-btn" onClick={() => navigate('/settings')} aria-label={t.settings} disabled={running}>
            <GearIcon />
          </button>
        </div>
      </header>

      {/* 맨 위: 강아지 | 고양이 프로필(좌우로 밀거나 옆 사진을 눌러 전환) → 그 아래 체격 · 정상 범위 */}
      <div className="profile-top">
        <SpeciesCarousel value={subject.species} onChange={switchSpecies} disabled={running} label={t.species} names={{ dog: t.dog, cat: t.cat }} />
        {/* 정상 범위 한 줄 — 강아지는 이 줄을 누르면 체격 선택 (iPhone은 아래에서 올라오는 휠) */}
        <div className="group-slot">
          <label className={`range-line ${groupOptions.length ? 'pickable' : ''}`}>
            {/* 체격(강아지 · 어린 개체 구분이 있을 때) 또는 동물 이름 */}
            <strong>
              {groupOptions.length > 0 ? groupLabel : t[subject.species]}
              {groupOptions.length > 0 && (
                <span className="caret" aria-hidden="true">
                  ⌄
                </span>
              )}
            </strong>
            <span>
              {t.normalRangeShort} {range.min}–{range.max} {t.bpm}
            </span>
            {groupOptions.length > 0 && (
              <select value={groupValue} onChange={(e) => setGroup(e.target.value as Group)} disabled={running} aria-label={t.sizeGroup}>
                {groupOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label} · {g.range.min}–{g.range.max} {t.bpm}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>
      </div>


      {/* 숫자(측정값 묶음): 상단 메뉴와 안내 문구 사이 가운데 */}
      <div className="info">
      <div className="readout-wrap">
      <div className={`readout ${isTimer ? "timer" : "tap"}`}>
        {isTimer ? (
          <>
            {running ? (
              <div className="big-num">{remaining}</div>
            ) : (
              // 시작 전: 큰 숫자 양옆 ‹ › 로 타이머 시간 변경
              <div className="timer-set">
                <button className="step" onClick={() => stepSeconds(-1)} disabled={seconds === TIMER_OPTIONS[0]} aria-label={t.timerShorter}>
                  ‹
                </button>
                <div className="big-num">{seconds}</div>
                <button
                  className="step"
                  onClick={() => stepSeconds(1)}
                  disabled={seconds === TIMER_OPTIONS[TIMER_OPTIONS.length - 1]}
                  aria-label={t.timerLonger}
                >
                  ›
                </button>
              </div>
            )}
            <div className="muted">{running ? `${t.secondsLeft} · ${taps.length} ${t.beats}` : t.sec.trim()}</div>
            <div className={`timer-bar ${running ? 'running' : ''}`} aria-hidden="true">
              <span style={{ width: `${running ? Math.max(0, (timerEnd! - now) / (seconds * 10)) : 100}%` }} />
            </div>
          </>
        ) : (
          <>
            <div className="big-num">{taps.length >= 2 && bpmNow ? bpmNow : '--'}</div>
            <div className="muted">
              {t.bpm} · {taps.length} {t.beats}
            </div>
          </>
        )}
      </div>
      </div>

      {/* 안내(행동 묶음): 탭할 대상인 동물 바로 위 (근접성) */}
      <div className="hint">
        <div>{isTimer && !running ? t.timerInstruction : t.tapInstruction}</div>
        <div className="muted tiny hint-sub">{hint2}</div>
      </div>
      </div>

      <div className="stage-wrap">
        <button
          className={`tap-stage ${isTimer && !running ? 'waiting' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault()
            onTap()
          }}
          aria-label={t.tapInstruction}
        >
          <Pet ref={pet} bare crop="neck" species={subject.species} mood={mood} size={320} label={t.tapInstruction} />
        </button>
      </div>

      {/* 화면 맨 아래 받침: 다시 · 완료 */}
      <div className="dock">
        {/* 받침 한 줄: 왼쪽 끝 '다시' · 오른쪽 끝 '완료(시작)' */}
        <div className="dock-row">
          <button className="text-act left" onClick={reset} disabled={taps.length === 0 && !running}>
            {t.reset}
          </button>
          <span />
          {isTimer && !running ? (
            <button className="text-act right primary" onClick={start}>
              {t.start}
            </button>
          ) : (
            <button className="text-act right primary" onClick={finish} disabled={!canFinish}>
              {t.done}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const SPECIES_ORDER = ['dog', 'cat'] as const
const PROFILE_BG = { dog: '#eeaa6e', cat: '#8fbbdf' } // 크림색 털 · 베이지 귀와 대비되는 살구 · 하늘색
const STEP = 74 // 프로필 사이 간격(px)

/** 강아지 | 고양이 프로필 캐러셀: 고른 쪽이 가운데 크게, 다른 쪽은 옆에 작게. 좌우로 밀어서 전환 */
function SpeciesCarousel({
  value,
  onChange,
  disabled,
  label,
  names,
}: {
  value: 'dog' | 'cat'
  onChange: (sp: 'dog' | 'cat') => void
  disabled: boolean
  label: string
  names: Record<'dog' | 'cat', string>
}) {
  const idx = SPECIES_ORDER.indexOf(value)
  const [drag, setDrag] = useState(0)
  const startX = useRef<number | null>(null)
  const swiped = useRef(false)

  const end = (x?: number) => {
    if (startX.current === null) return
    const dx = x === undefined ? 0 : x - startX.current
    startX.current = null
    setDrag(0)
    if (Math.abs(dx) > 8) swiped.current = true
    if (dx < -30 && idx < SPECIES_ORDER.length - 1) onChange(SPECIES_ORDER[idx + 1])
    else if (dx > 30 && idx > 0) onChange(SPECIES_ORDER[idx - 1])
  }

  return (
    <div
      className={`sp-carousel ${startX.current !== null && drag !== 0 ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      role="radiogroup"
      aria-label={label}
      onPointerDown={(e) => {
        if (disabled) return
        startX.current = e.clientX
        swiped.current = false
      }}
      onPointerMove={(e) => {
        if (startX.current === null) return
        // 끝에서는 덜 따라오게 (고무줄)
        let dx = e.clientX - startX.current
        if ((dx > 0 && idx === 0) || (dx < 0 && idx === SPECIES_ORDER.length - 1)) dx *= 0.3
        setDrag(Math.max(-STEP, Math.min(STEP, dx)))
      }}
      onPointerUp={(e) => end(e.clientX)}
      onPointerLeave={(e) => end(e.clientX)}
      onPointerCancel={() => end()}
    >
      {SPECIES_ORDER.map((sp, i) => {
        const on = i === idx
        const x = (i - idx) * STEP + drag
        return (
          <button
            key={sp}
            role="radio"
            aria-checked={on}
            aria-label={names[sp]}
            className={`sp-item ${on ? 'on' : ''}`}
            style={{ transform: `translateX(calc(-50% + ${x}px)) scale(${on ? 1 : 0.7})` }}
            disabled={disabled}
            onClick={() => {
              if (swiped.current) return
              onChange(sp)
            }}
          >
            <span className="sp-avatar">
              <Pet species={sp} mood="happy" crop="avatar" detail size={64} bg={PROFILE_BG[sp]} label={names[sp]} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
