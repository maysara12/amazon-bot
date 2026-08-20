const foundations = [
  ['V1 Production', 'Protected', 'No deployment or database change'],
  ['V2 Runtime', 'Isolated', 'No production credentials connected'],
  ['Architecture', 'Modular', 'Feature modules instead of HTML patches'],
  ['Server State', 'TanStack Query', 'Scoped cache and targeted invalidation'],
] as const

export function App() {
  return (
    <main className="app-shell">
      <section className="hero-card" aria-labelledby="v2-title">
        <div className="brand-mark" aria-hidden="true">007</div>
        <div>
          <p className="eyebrow">ZERO ZERO SEVEN · OPERATIONS</p>
          <h1 id="v2-title">007 Operations <span>V2</span></h1>
          <p className="hero-copy">
            الأساس الجديد لمنظومة العمليات — سريع، قابل للتوسع، ومبني للانتقال التدريجي بدون التأثير على النسخة الحالية.
          </p>
        </div>
      </section>

      <section className="status-grid" aria-label="V2 foundation status">
        {foundations.map(([title, status, detail]) => (
          <article className="status-card" key={title}>
            <p>{title}</p>
            <strong>{status}</strong>
            <span>{detail}</span>
          </article>
        ))}
      </section>

      <section className="foundation-panel">
        <div>
          <p className="eyebrow">FOUNDATION / PHASE 1</p>
          <h2>Modular by default.</h2>
          <p>
            كل إضافة جديدة ستدخل كـFeature مستقلة لها بياناتها، Queries، Mutations، صلاحياتها واختباراتها؛
            بدون تعديل عشوائي في واجهة مشتركة أو إعادة تحميل النظام بالكامل.
          </p>
        </div>
        <div className="live-pill"><i /> V2 workspace ready</div>
      </section>
    </main>
  )
}
