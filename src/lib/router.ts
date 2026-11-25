// 해시 라우터 — GitHub Pages에서 새로고침해도 404가 나지 않음
// 앱 안에서 이동한 깊이를 history.state에 기록해서, 앱 안 '뒤로'가 앱 밖으로 나가지 않게 한다.
import { useEffect, useState } from 'react'

export type Route = { name: 'measure' } | { name: 'result' } | { name: 'settings' }

export function parse(hash: string): Route {
  const [a] = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (a === 'settings') return { name: 'settings' }
  if (a === 'result') return { name: 'result' }
  return { name: 'measure' }
}

const NAV_EVENT = 'kongdak:navigate'
const depth = () => (history.state as { depth?: number } | null)?.depth ?? 0

export function navigate(path: string, replace = false) {
  const url = `#${path}`
  if (replace) history.replaceState({ depth: depth() }, '', url)
  else history.pushState({ depth: depth() + 1 }, '', url)
  window.dispatchEvent(new Event(NAV_EVENT))
}

/** 앱 안에서 들어온 화면이면 뒤로, 아니면(새로고침 · 직접 접속) fallback으로 */
export function goBack(fallback = '/') {
  if (depth() > 0) history.back()
  else navigate(fallback, true)
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parse(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', on)
    window.addEventListener('hashchange', on)
    window.addEventListener(NAV_EVENT, on)
    return () => {
      window.removeEventListener('popstate', on)
      window.removeEventListener('hashchange', on)
      window.removeEventListener(NAV_EVENT, on)
    }
  }, [])
  return route
}
