import { useEffect } from 'react'

/** 이 화면에 있는 동안 페이지 배경 · 브라우저 상단(theme-color)을 화면 색으로 맞춤 */
export function useScreenColor(color: string) {
  useEffect(() => {
    document.body.style.background = color
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const prev = meta?.content
    if (meta) meta.content = color
    return () => {
      document.body.style.background = ''
      if (meta && prev) meta.content = prev
    }
  }, [color])
}
