// 짧은 "콩" 효과음 (iOS Safari는 웹 진동을 지원하지 않아 소리로 피드백)
let ctx: AudioContext | undefined

export function playBeat() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, t)
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.09)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.13)
  } catch {
    /* 오디오 미지원 환경 무시 */
  }
}

export function playDone() {
  try {
    ctx ??= new AudioContext()
    const t = ctx.currentTime
    ;[660, 880].forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.0001, t + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.3, t + i * 0.12 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.15)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(t + i * 0.12)
      osc.stop(t + i * 0.12 + 0.16)
    })
  } catch {
    /* ignore */
  }
}
