import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { HEART_PATH, MOOD_BG, PET, petGeometry, type Mood, type PetSpecies, type Stroke } from '../lib/petArt'

export type { Mood }

export interface PetHandle {
  beat: () => void
}

interface Props {
  species: PetSpecies
  mood: Mood
  /** 가로 크기(px) */
  size?: number
  /** bust: 가슴까지 · neck: 방울 바로 아래에서 자름(측정 화면) · head: 머리만(아이콘) · avatar: 귀 끝 ~ 목걸이를 담은 원형 프로필 */
  crop?: 'bust' | 'neck' | 'head' | 'avatar'
  /** true면 작게 그려도 털 결 · 음영 빗금 · 목걸이 무늬를 생략하지 않음 (고해상도 화면의 작은 프로필용) */
  detail?: boolean
  /** false면 배경 모서리를 둥글리지 않음 (앱 아이콘 등) */
  rounded?: boolean
  /** true면 배경 타일 없이 그림만 (화면 전체가 상태색일 때). 아래쪽에 붙여 그림 */
  bare?: boolean
  /** 배경 타일 색 (기본: 기분별 상태색) */
  bg?: string
  label?: string
}

let clipSeq = 0

const VIEW = {
  bust: { x: 0, y: 0, w: 200, h: 222, r: 26 },
  neck: { x: 0, y: 22, w: 200, h: 192, r: 26 }, // 머리 위 빈 여백은 자르고(곤두선 털 · 링은 밖으로 그림) 방울 아래쪽(≈212)까지만
  head: { x: 14, y: 4, w: 172, h: 172, r: 44 },
  avatar: { x: 6, y: 12, w: 188, h: 188, r: 94 }, // 원: 고양이 귀 끝 · 강아지 늘어진 귀 · 목걸이까지
}

/** 플랫 포스터 스타일 개 · 고양이. 배경색이 상태를 나타냄 */
export const Pet = forwardRef<PetHandle, Props>(function Pet(
  { species, mood, size = 200, crop = 'bust', rounded = true, bare = false, bg: bgProp, label, detail = false },
  ref,
) {
  const bodyRef = useRef<SVGGElement>(null)
  const tagRef = useRef<SVGGElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const clipId = useMemo(() => `petclip${++clipSeq}`, [])

  const small = !detail && size < 90
  const g = petGeometry(species, mood === 'stressed', small)
  const bg = bgProp ?? MOOD_BG[mood]
  const v = VIEW[crop]

  useImperativeHandle(ref, () => ({
    beat() {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
      bodyRef.current?.animate(
        [{ transform: 'scale(1, 1)' }, { transform: 'scale(1.06, 1.08)', offset: 0.35 }, { transform: 'scale(0.985, 0.97)', offset: 0.7 }, { transform: 'scale(1, 1)' }],
        { duration: 320, easing: 'cubic-bezier(.2,.9,.3,1.25)' },
      )
      tagRef.current?.animate(
        [{ transform: 'rotate(0)' }, { transform: 'rotate(14deg)', offset: 0.2 }, { transform: 'rotate(-9deg)', offset: 0.45 }, { transform: 'rotate(4deg)', offset: 0.7 }, { transform: 'rotate(0)' }],
        { duration: 600, easing: 'ease-out' },
      )
      ringRef.current?.animate(
        [
          { transform: 'scale(.7)', opacity: 0.55 },
          { transform: 'scale(1.35)', opacity: 0 },
        ],
        { duration: 550, easing: 'ease-out' },
      )
    },
  }))

  // 몸짓: 불규칙은 갸웃, 서맥은 고개가 처짐
  const headT = mood === 'worried' ? 'rotate(-8 100 140)' : mood === 'sleepy' ? 'translate(0 4) rotate(3 100 140)' : undefined
  const earT = species === 'dog' && mood === 'sleepy' ? 'translate(0 5)' : undefined
  const height = Math.round((size * v.h) / v.w)

  return (
    <svg
      className="pet"
      viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`}
      width={size}
      height={height}
      preserveAspectRatio={bare ? 'xMidYMax meet' : undefined}
      role="img"
      aria-label={label ?? (species === 'cat' ? 'cat' : 'dog')}
    >
      <defs>
        <clipPath id={clipId}>
          {bare ? (
            // 배경 없는 그림: 아래쪽(받침 경계)만 자르고 위 · 옆(곤두선 털 · 박동 링)은 밖으로 그려도 됨
            <rect x={v.x - 100} y={v.y - 100} width={v.w + 200} height={v.h + 100} />
          ) : (
            <rect x={v.x} y={v.y} width={v.w} height={v.h} rx={rounded ? v.r : 0} />
          )}
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {!bare && <rect x={v.x} y={v.y} width={v.w} height={v.h} fill={bg} className="pet-bg" />}
        <circle ref={ringRef} className="pet-ring" cx="100" cy="110" r="88" fill="none" stroke={PET.cream} strokeWidth="6" opacity="0" />
        <g ref={bodyRef} className="pet-body">
          {/* 목 · 가슴 */}
          <path d={g.neck} fill={PET.cream} />
          <Strokes list={g.neckFur} color={PET.cream} />
          {g.neckHatch && <path d={g.neckHatch} stroke={PET.furLine} strokeWidth="1.1" strokeLinecap="round" fill="none" />}

          {/* 목줄 + 하트 이름표 */}
          <path d="M56 168Q100 181 144 168L147 187Q100 201 53 187Z" fill={PET.collar} />
          {!small && <path d="M64 177Q88 186 110 183M90 192Q116 191 138 180" stroke={PET.collar2} strokeWidth="1.6" strokeLinecap="round" fill="none" />}
          <Bell ref={tagRef} small={small} />

          <g transform={headT}>
            {/* 귀 (머리 뒤) */}
            <g transform={earT}>
              {g.ears.map((e, i) => (
                <g key={i}>
                  <path d={e.d} fill={g.earFill} />
                  <Strokes list={e.fur} color={g.earFill} />
                </g>
              ))}
              {g.earInner.map((d, i) => (
                <path key={i} d={d} fill={PET.rose} opacity="0.75" />
              ))}
            </g>

            {/* 머리 */}
            <path d={g.head} fill={PET.cream} />
            <Strokes list={g.headFur} color={PET.cream} />
            {g.headHatch && <path d={g.headHatch} stroke={PET.furLine} strokeWidth="1.1" strokeLinecap="round" fill="none" />}
            {species === 'cat' && (
              <path d="M91 58L94 72M100 56V72M109 58L106 72" stroke={PET.brown} strokeWidth="4" strokeLinecap="round" opacity="0.85" />
            )}

            <Face species={species} mood={mood} />
            <Marks mood={mood} />
          </g>
        </g>
      </g>
    </svg>
  )
})

/**
 * 입: 코 밑 세로선(인중)과 입꼬리 곡선이 한 점에서 만나는 한 줄.
 * [인중, 입] — 입은 왼쪽 입꼬리 → 인중 끝 → 오른쪽 입꼬리로 끊김 없이 이어짐 (빈맥은 벌린 입을 채움)
 */
const DOG_MOUTH: Record<Mood, [string, string]> = {
  idle: ['M100 130V138', 'M87.5 140.6C91.6 143.6 97.4 143 100 138C102.6 143 108.4 143.6 112.5 140.6'],
  happy: ['M100 130V137.5', 'M84.5 138.6C89.6 146.4 97 146.2 100 137.5C103 146.2 110.4 146.4 115.5 138.6'],
  sleepy: ['M100 130V139', 'M92 141.2C94.8 143.2 98.4 142.8 100 139C101.6 142.8 105.2 143.2 108 141.2'],
  stressed: ['M100 130V136.2', 'M100 136C95 135.6 89.2 137.6 89.6 141.6C90.4 147.8 95.8 151 100 151C104.2 151 109.6 147.8 110.4 141.6C110.8 137.6 105 135.6 100 136Z'],
  worried: ['M100 130V138.4', 'M87 144.2C90.8 140.6 97 140.8 100 138.4C103 141.4 108.2 141.8 113 139.8'],
}
const CAT_MOUTH: Record<Mood, [string, string]> = {
  idle: ['M100 122.5V128', 'M90.6 130.6C93.6 134.2 98.6 133.6 100 128C101.4 133.6 106.4 134.2 109.4 130.6'],
  happy: ['M100 122.5V128', 'M88 129.4C91.8 136.8 98.6 136 100 128C101.4 136 108.2 136.8 112 129.4'],
  sleepy: ['M100 122.5V129.4', 'M94 131.2C96 133.2 99 132.8 100 129.4C101 132.8 104 133.2 106 131.2'],
  stressed: ['M100 122.5V128.2', 'M100 128C97 128 95.4 130.6 95.8 133.2C96.2 136.6 98.2 138.6 100 138.6C101.8 138.6 103.8 136.6 104.2 133.2C104.6 130.6 103 128 100 128Z'],
  worried: ['M100 122.5V128.6', 'M90 133C93.6 130.4 98 131 100 128.6C102 131.6 106 131.6 110 129.8'],
}

function Mouth({ d: [philtrum, mouth], fill, width }: { d: [string, string]; fill: boolean; width: number }) {
  const line = { stroke: PET.ink, strokeWidth: width, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <g>
      <path d={philtrum} {...line} fill="none" />
      <path d={mouth} {...line} fill={fill ? PET.ink : 'none'} />
    </g>
  )
}

/**
 * 하트 모양 방울 (단색): 목걸이 아래 가장자리에 걸린 고리 → 하트 윗부분 홈의 연결쇠 → 하트 방울.
 * 고리를 먼저 그려 아랫부분이 하트 뒤로 들어가 보이게 함
 */
const Bell = forwardRef<SVGGElement, { small: boolean }>(function Bell({ small }, ref) {
  const heart = 'translate(86.5 188.75) scale(.135)' // 폭 ≈ 22, 윗부분 홈(100, 195.5)이 고리 아래쪽
  return (
    <g ref={ref} className="pet-tag">
      <circle cx="100" cy="191.6" r="3.4" fill="none" stroke={PET.brassDark} strokeWidth="1.9" />
      <path d={HEART_PATH} transform={heart} fill={PET.brass} />
      {!small && (
        <g transform={heart} fill={PET.brassDark}>
          {/* 방울 틈 + 구슬 */}
          <path d="M68 116Q100 134 132 116" stroke={PET.brassDark} strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="100" cy="142" r="7" />
        </g>
      )}
      <rect x="98.1" y="193.6" width="3.8" height="3.2" rx="1.2" fill={PET.brassDark} />
    </g>
  )
})

function Strokes({ list, color }: { list: Stroke[]; color: string }) {
  if (!list.length) return null
  return (
    <g stroke={color} strokeLinecap="round" fill="none">
      {list.map((s, i) => (
        <path key={i} d={s.d} strokeWidth={s.w} />
      ))}
    </g>
  )
}

const BROWS: Record<Mood, [number, number, number, number][]> = {
  idle: [[-5, -11, 4, -12], [-4, -12, 5, -11]],
  happy: [[-5, -13, 4, -14], [-4, -14, 5, -13]],
  sleepy: [[-5, -9, 4, -7], [-4, -7, 5, -9]],
  stressed: [[-6, -11, 3, -15], [-3, -15, 6, -11]],
  worried: [[-5, -15, 4, -18], [-4, -11, 5, -11]],
}

function Face({ species, mood }: { species: PetSpecies; mood: Mood }) {
  const dog = species === 'dog'
  const ex = dog ? [77, 123] : [78, 122]
  const ey = dog ? 94 : 100
  const line = { stroke: PET.ink, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }

  let eyes
  if (mood === 'happy') eyes = ex.map((x) => <path key={x} d={`M${x - 6} ${ey + 2}Q${x} ${ey - 5} ${x + 6} ${ey + 2}`} {...line} strokeWidth="3" />)
  else if (mood === 'sleepy') eyes = ex.map((x) => <path key={x} d={`M${x - 6} ${ey}Q${x} ${ey + 4} ${x + 6} ${ey}`} {...line} strokeWidth="3" />)
  else {
    const r = mood === 'stressed' ? 5.6 : 4.7
    eyes = ex.map((x) => (
      <g key={x}>
        <circle cx={x} cy={ey} r={r} fill={PET.ink} />
        {mood === 'stressed' && <circle cx={x + 1.6} cy={ey - 1.8} r="1.6" fill={PET.cream} />}
      </g>
    ))
  }

  return (
    <g>
      <g stroke={PET.brown} strokeWidth="2.6" strokeLinecap="round">
        {BROWS[mood].map((b, i) => (
          <path key={i} d={`M${ex[i] + b[0]} ${ey + b[1]}L${ex[i] + b[2]} ${ey + b[3]}`} />
        ))}
      </g>
      {eyes}
      {dog ? (
        <>
          <path d="M83 112Q84 105 100 104Q116 105 117 112Q116 122 106 128Q100 132 94 128Q84 122 83 112Z" fill={PET.ink} />
          <ellipse cx="93.5" cy="115" rx="3" ry="2" fill="#3b3434" />
          <ellipse cx="106.5" cy="115" rx="3" ry="2" fill="#3b3434" />
          <Mouth d={DOG_MOUTH[mood]} fill={mood === 'stressed'} width={2.6} />
        </>
      ) : (
        <>
          <path d="M92 114Q100 110 108 114Q104 122 100 123Q96 122 92 114Z" fill={PET.rose} />
          <Mouth d={CAT_MOUTH[mood]} fill={mood === 'stressed'} width={2.2} />
          <g stroke={PET.ink} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.8">
            <path d="M78 122Q60 117 40 116M78 128Q60 129 41 134" />
            <path d="M122 122Q140 117 160 116M122 128Q140 129 159 134" />
          </g>
        </>
      )}
    </g>
  )
}

/** 상태 보조 기호 (최소한): 서맥 z · 빈맥 땀 · 불규칙 ? */
function Marks({ mood }: { mood: Mood }) {
  const line = { stroke: PET.cream, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  if (mood === 'sleepy') return <path d="M164 30h10l-10 11h10M180 14h7l-7 8h7" {...line} strokeWidth="3.4" />
  if (mood === 'stressed')
    return (
      // 땀방울: 곧게 선 방울(끝이 위로 일직선) + 흰 반사선, 관자놀이에
      <g transform="translate(152 74)">
        <path d="M0 -12.5C1 -7 7.2 -2.8 7.2 2.8C7.2 6.9 4 10.2 0 10.2C-4 10.2 -7.2 6.9 -7.2 2.8C-7.2 -2.8 -1 -7 0 -12.5Z" fill={PET.sweat} />
        <path d="M-3.8 3.4C-3.9 1 -3 -1.2 -1.4 -2.8" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.9" />
      </g>
    )
  if (mood === 'worried') return <path d="M168 22q2-9 10-8 8 2 6 9-2 5-7 7v4M177 45v.5" {...line} strokeWidth="3.6" />
  return null
}
