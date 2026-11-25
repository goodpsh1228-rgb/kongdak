// 콩닥 캐릭터 도형 생성 — 플랫 포스터 스타일
// SVG 필터를 쓰지 않고 거친 가장자리 · 털 가닥 · 붓결을 좌표로 직접 계산한다.
// (iOS Safari와 Chrome에서 똑같이 보이고, 탭 애니메이션 때 필터 재계산 비용이 없음)
// 시드가 고정된 난수를 써서 매번 같은 모양이 나온다.

export type PetSpecies = 'dog' | 'cat'
export type Mood = 'idle' | 'happy' | 'sleepy' | 'stressed' | 'worried'

export const PET = {
  cream: '#f6eee3',
  creamShade: '#e2d1bc',
  furLine: '#ddcdb6', // 털 안쪽 붓결 (배경색과 무관하게 고정)
  ink: '#1e1a1a',
  brown: '#8a7a6c',
  rose: '#c98f86',
  collar: '#8fdcc4', // 민트 목걸이
  collar2: '#5fb89f',
  brass: '#f2c14e',
  brassDark: '#c9952a',
  sweat: '#8fd0f2',
} as const

/** 상태별 배경색 (앱 전체 상태 색과 동일) */
export const MOOD_BG: Record<Mood, string> = {
  idle: '#a3968c',
  happy: '#3fa68c',
  sleepy: '#4c6fd6',
  stressed: '#e8492f',
  worried: '#e9a23b',
}

type Pt = [number, number]
type Seg = [Pt, Pt, Pt, Pt]

export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (v: number) => Math.round(v * 10) / 10
const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [200 - x, y] as Pt).reverse()

/** 닫힌 Catmull-Rom 스플라인 → 베지어 구간 */
export function spline(pts: Pt[]): Seg[] {
  const n = pts.length
  const segs: Seg[] = []
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    segs.push([
      p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    ])
  }
  return segs
}

export function pathOf(segs: Seg[]): string {
  let d = `M${f(segs[0][0][0])} ${f(segs[0][0][1])}`
  for (const [, a, b, p] of segs) d += `C${f(a[0])} ${f(a[1])} ${f(b[0])} ${f(b[1])} ${f(p[0])} ${f(p[1])}`
  return d + 'Z'
}

function bez([a, b, c, d]: Seg, t: number): Pt {
  const u = 1 - t
  return [0, 1].map((i) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]) as Pt
}

function bezD([a, b, c, d]: Seg, t: number): Pt {
  const u = 1 - t
  return [0, 1].map((i) => 3 * u * u * (b[i] - a[i]) + 6 * u * t * (c[i] - b[i]) + 3 * t * t * (d[i] - c[i])) as Pt
}

interface Sample {
  p: Pt
  n: Pt // 바깥 방향 법선
}

export function samples(segs: Seg[], per: number): Sample[] {
  const cx = segs.reduce((s, g) => s + g[0][0], 0) / segs.length
  const cy = segs.reduce((s, g) => s + g[0][1], 0) / segs.length
  const out: Sample[] = []
  for (const s of segs)
    for (let k = 0; k < per; k++) {
      const t = k / per
      const p = bez(s, t)
      const d = bezD(s, t)
      const L = Math.hypot(d[0], d[1]) || 1
      let n: Pt = [d[1] / L, -d[0] / L]
      if (n[0] * (p[0] - cx) + n[1] * (p[1] - cy) < 0) n = [-n[0], -n[1]]
      out.push({ p, n })
    }
  return out
}

function inside(poly: Pt[], [x, y]: Pt) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

/** 드라이브러시처럼 거친 가장자리: 윤곽을 촘촘히 샘플링해 법선 방향으로 흔듦 */
export function roughPath(segs: Seg[], seed: number, amp = 2.4, per = 10): string {
  const r = rng(seed)
  const pts = samples(segs, per).map(({ p, n }) => {
    const j = (r() - 0.5) * amp
    return [p[0] + n[0] * j, p[1] + n[1] * j] as Pt
  })
  return `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`
}

export interface Stroke {
  d: string
  w: number
}

interface FurOpts {
  seed: number
  per?: number
  len?: [number, number]
  w?: [number, number]
  weight?: (p: Pt, n: Pt) => number
  jitter?: number
  inset?: number
}

/** 실루엣 가장자리를 따라 바깥으로 뻗는 털 가닥 */
export function fur(segs: Seg[], o: FurOpts): Stroke[] {
  const { seed, per = 5, len = [3, 9], w = [1.3, 2.4], weight = () => 1, jitter = 0.5, inset = 2 } = o
  const r = rng(seed)
  const out: Stroke[] = []
  for (const { p, n } of samples(segs, per)) {
    const m = weight(p, n)
    const a = (r() - 0.5) * 2 * jitter
    const L = (len[0] + r() * (len[1] - len[0])) * m
    const bend = (r() - 0.5) * L * 0.6
    const sw = w[0] + r() * (w[1] - w[0])
    if (m <= 0) continue
    const dir: Pt = [n[0] * Math.cos(a) - n[1] * Math.sin(a), n[0] * Math.sin(a) + n[1] * Math.cos(a)]
    const b: Pt = [p[0] - n[0] * inset, p[1] - n[1] * inset]
    const e: Pt = [b[0] + dir[0] * L, b[1] + dir[1] * L]
    const c: Pt = [b[0] + dir[0] * L * 0.5 - dir[1] * bend, b[1] + dir[1] * L * 0.5 + dir[0] * bend]
    out.push({ d: `M${f(b[0])} ${f(b[1])}Q${f(c[0])} ${f(c[1])} ${f(e[0])} ${f(e[1])}`, w: f(sw) })
  }
  return out
}

interface HatchOpts {
  seed: number
  count?: number
  len?: [number, number]
  angle?: number
  spread?: number
  region?: (p: Pt) => boolean
}

/** 몸 안쪽의 가는 붓결 (배경색으로 칠해 배경이 비쳐 보이게) */
export function hatch(segs: Seg[], o: HatchOpts): string {
  const { seed, count = 26, len = [4, 10], angle = Math.PI / 2, spread = 0.35, region = () => true } = o
  const poly = samples(segs, 6).map((s) => s.p)
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const r = rng(seed)
  let d = ''
  let n = 0
  let tries = 0
  while (n < count && tries++ < count * 20) {
    const p: Pt = [x0 + r() * (x1 - x0), y0 + r() * (y1 - y0)]
    if (!inside(poly, p) || !region(p)) continue
    const a = angle + (r() - 0.5) * 2 * spread
    const L = len[0] + r() * (len[1] - len[0])
    const bend = (r() - 0.5) * 2.5
    const ex = Math.cos(a) * L
    const ey = Math.sin(a) * L
    d += `M${f(p[0])} ${f(p[1])}q${f(ex / 2 - Math.sin(a) * bend)} ${f(ey / 2 + Math.cos(a) * bend)} ${f(ex)} ${f(ey)}`
    n++
  }
  return d
}

/* ───────── 형태 (viewBox 0 0 200 222) ───────── */

const SHAPES = {
  dog: {
    head: spline([[100, 42], [122, 43], [140, 50], [151, 66], [155, 88], [153, 110], [149, 128], [141, 145], [128, 158], [113, 166], [100, 168], [87, 166], [72, 158], [59, 145], [51, 128], [47, 110], [45, 88], [49, 66], [60, 50], [78, 43]]),
    neck: spline([[66, 138], [134, 138], [141, 172], [150, 224], [50, 224], [59, 172]]),
    // 머리 뒤로 길게 늘어진 귀
    ear: [[66, 50], [50, 45], [35, 52], [26, 72], [23, 98], [27, 120], [37, 131], [48, 127], [54, 108], [56, 84], [60, 64]] as Pt[],
    earInner: null as Pt[] | null,
  },
  cat: {
    head: spline([[100, 50], [124, 52], [144, 60], [157, 76], [163, 97], [161, 118], [153, 137], [139, 151], [120, 159], [100, 161], [80, 159], [61, 151], [47, 137], [39, 118], [37, 97], [43, 76], [56, 60], [76, 52]]),
    neck: spline([[70, 140], [130, 140], [137, 172], [148, 224], [52, 224], [63, 172]]),
    ear: [[50, 74], [44, 40], [45, 25], [55, 22], [70, 34], [88, 52]] as Pt[],
    earInner: [[55, 64], [52, 38], [57, 33], [76, 52]] as Pt[] | null,
  },
} satisfies Record<PetSpecies, unknown>

export interface PetGeometry {
  head: string
  headFur: Stroke[]
  headHatch: string
  neck: string
  neckFur: Stroke[]
  neckHatch: string
  ears: { d: string; fur: Stroke[] }[]
  earFill: string
  earInner: string[]
}

const cache = new Map<string, PetGeometry>()

/** 종 · 털 곤두섬(빈맥) · 작은 크기 여부에 따라 도형을 만들고 캐시 */
export function petGeometry(species: PetSpecies, bristle: boolean, small: boolean): PetGeometry {
  const key = `${species}|${bristle}|${small}`
  const hit = cache.get(key)
  if (hit) return hit

  const S = SHAPES[species]
  const seed = species === 'dog' ? 7 : 19
  const b = bristle ? 1.75 : 1
  const headW =
    species === 'dog'
      ? (p: Pt, n: Pt) => (p[1] < 72 ? 1.7 * b : p[1] > 140 ? 1.5 : 1) * (n[1] < -0.3 ? b : 1)
      : (p: Pt, n: Pt) => (Math.abs(n[0]) > 0.55 && p[1] > 104 && p[1] < 150 ? 2 : p[1] < 70 ? 1.1 * b : 0.8) * (n[1] < -0.3 ? b : 1)
  const neckW = (p: Pt, n: Pt) => (Math.abs(n[0]) > 0.6 && p[1] < 214 ? 1 : 0)
  const earFill = species === 'dog' ? PET.creamShade : PET.cream
  const earSegs = [spline(S.ear), spline(mirror(S.ear))]

  const g: PetGeometry = {
    head: roughPath(S.head, seed + 20, small ? 1.4 : 2.4),
    headFur: fur(S.head, { seed, per: small ? 3 : 6, len: small ? [2, 5] : [3, 9], weight: headW }),
    headHatch: small ? '' : hatch(S.head, { seed: seed + 1, count: 30, region: (p) => Math.abs(p[0] - 100) > 30 || p[1] < 78 }),
    neck: roughPath(S.neck, seed + 21, small ? 1.4 : 2.4),
    neckFur: small ? [] : fur(S.neck, { seed: seed + 9, per: 6, len: [3, 9], weight: neckW }),
    neckHatch: small ? '' : hatch(S.neck, { seed: seed + 10, count: 14, region: (p) => p[1] > 150 }),
    ears: earSegs.map((e, i) => ({
      d: roughPath(e, seed + 30 + i, small ? 1.2 : 2),
      fur: small ? [] : fur(e, { seed: seed + 3 + i, per: 4, len: [2, 7], weight: (_p, n) => (n[1] < 0.2 ? 1 : 0.6) }),
    })),
    earFill,
    earInner: S.earInner ? [S.earInner, mirror(S.earInner)].map((p) => pathOf(spline(p))) : [],
  }
  cache.set(key, g)
  return g
}

export const HEART_PATH =
  'M100 175C40 135 20 100 20 72 20 45 42 28 66 28c16 0 28 9 34 22 6-13 18-22 34-22 24 0 46 17 46 44 0 28-20 63-80 103z'
