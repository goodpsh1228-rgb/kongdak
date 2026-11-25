import type { ReactNode } from 'react'
import { useSettings } from '../lib/settings'

export function TopBar({ title, back, right }: { title: ReactNode; back?: () => void; right?: ReactNode }) {
  const { t } = useSettings()
  return (
    <header className="topbar">
      <div className="topbar-side">
        {back && (
          <button className="icon-btn" onClick={back} aria-label={t.back}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>
      <h1>{title}</h1>
      <div className="topbar-side right">{right}</div>
    </header>
  )
}

export function DisclaimerFooter() {
  const { t } = useSettings()
  return <p className="disclaimer-footer">⚕︎ {t.disclaimer}</p>
}

export function DisclaimerModal() {
  const { t, settings, update } = useSettings()
  if (settings.disclaimerAccepted) return null
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-emoji">🩺</div>
        <h2>{t.disclaimerTitle}</h2>
        <p className="strong">{t.disclaimer}</p>
        <p>{t.disclaimerLong}</p>
        <button className="btn primary block" onClick={() => update({ disclaimerAccepted: true })}>
          {t.agree}
        </button>
      </div>
    </div>
  )
}

export function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
