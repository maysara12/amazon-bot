import { HousingPage } from '../features/housing/HousingPage'

export function App() {
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
        <div className="environment-pill"><i /> STAGING · ISOLATED</div>
      </header>

      <section className="migration-banner">
        <strong>V1 Production محمية</strong>
        <span>النسخة الحالية مستمرة Live. الشاشة دي متصلة فقط بقاعدة V2 Staging الصناعية.</span>
      </section>

      <HousingPage />
    </main>
  )
}
