import { HousingPage } from '../features/housing/HousingPage'
import { useOutboxStatus } from '../offline/useOutbox'

export function App() {
  const outbox = useOutboxStatus()

  return (
    <main className="app-shell">
      <header className="v2-topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">007</div>
          <div>
            <p className="eyebrow">ZERO ZERO SEVEN · OPERATIONS</p>
            <h1>Operations <span>V2</span></h1>
          </div>
        </div>
        <div className="runtime-state">
          <span className={`network-pill ${outbox.online ? 'online' : 'offline'}`}>
            <i /> {outbox.online ? 'ONLINE' : 'OFFLINE'}
          </span>
          {outbox.pending > 0 && (
            <button className="queue-pill" type="button" onClick={() => void outbox.flush()} disabled={outbox.flushing}>
              {outbox.flushing ? 'SYNCING…' : `${outbox.pending} PENDING`}
            </button>
          )}
          <div className="environment-pill"><i /> STAGING · ISOLATED</div>
        </div>
      </header>

      <section className="migration-banner">
        <strong>V1 Production محمية</strong>
        <span>النسخة الحالية مستمرة Live. الشاشة دي متصلة فقط بقاعدة V2 Staging الصناعية.</span>
      </section>

      <HousingPage />
    </main>
  )
}
