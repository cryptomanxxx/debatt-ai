const C = { text: '#b8d8ff', muted: '#8aaac8', border: '#17395a', accent: '#67e8c2' };
const WORKFLOW = 'https://github.com/cryptomanxxx/debatt-ai/actions/workflows/oraklet-lab.yml';
const formula = coefficients => `(${coefficients[0]}·x + ${coefficients[1]}) / (${coefficients[2]}·x + ${coefficients[3]})`;

export default function OrakletsForskningslabbVy({ experiment = [], labAvailable = false }) {
  return (
    <section style={{ color: C.text, lineHeight: 1.7 }}>
      <h2 style={{ fontFamily: 'Georgia, serif', marginTop: 0 }}>Oraklets forskningslabb</h2>
      <p>Professor Oraklet föreslår matematiska samband. Beräkningsverktyg och en separat exakt kontroll prövar hans förslag. Här visas metod, data och resultat från genomförda experiment.</p>
      <div style={{ padding: '20px', border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '24px' }}>
        <strong style={{ color: C.accent }}>Första experimentet: återfinna ett dolt rationellt samband</strong>
        <p>Oraklet får sex exakta datapunkter och söker en formel av typen (a·x+b)/(c·x+d). Tre andra punkter hålls undan tills förslaget är låst. BootLoops Ratfit kontrollerar sambandet och ska avvisa avsiktligt felaktiga data. Modellens formel kontrolleras dessutom separat med exakt heltalsräkning.</p>
        <p>I nya körningar får ett felaktigt första förslag exakt återkoppling från de sex synliga punkterna och ett korrigeringsförsök. Första och slutliga resultat visas separat. De tre undanhållna punkterna avslöjas först efter det slutliga förslaget.</p>
        <p style={{ color: C.muted }}>Detta är ett syntetiskt metodtest med känt facit. Ett godkänt test är inte en ny vetenskaplig upptäckt.</p>
        <a href={WORKFLOW} style={{ color: C.accent }}>Öppna experimentets manuella körning i GitHub →</a>
      </div>
      {!labAvailable && <p style={{ color: C.muted }}>Experimentrapporter kan inte hämtas just nu. Labbet är förberett, men inga resultat kan visas här ännu.</p>}
      {labAvailable && experiment.length === 0 && <p style={{ color: C.muted }}>Inga experimentrapporter har sparats ännu.</p>}
      {experiment.map(row => {
        const r = row.rapport;
        if (![1, 2].includes(r?.schemaVersion) || !Array.isArray(r.cases)) return null;
        return (
          <article key={row.id} style={{ border: `1px solid ${C.border}`, borderRadius: '10px', padding: '20px', marginBottom: '20px', overflowWrap: 'anywhere' }}>
            <p style={{ color: r.status === 'passed' ? C.accent : '#fbbf24', fontFamily: 'monospace' }}>
              {r.status === 'passed' ? 'METODTEST GODKÄNT' : 'MODELLFÖRSLAG UNDERKÄNT'} · {new Date(row.skapad).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })}
            </p>
            <h3>{row.titel}</h3>
            <p><strong>Forskningsfråga:</strong> {r.question}</p>
            <p><strong>Metod:</strong> {r.method}</p>
            {r.cases.map(c => (
              <details key={c.case} style={{ borderTop: `1px solid ${C.border}`, padding: '12px 0' }}>
                <summary style={{ cursor: 'pointer' }}>Fall {c.case}: {c.passed ? 'godkänt modellförslag' : 'underkänt modellförslag'}</summary>
                {r.schemaVersion === 2 && (
                  <div>
                    <p>Första förslag: {c.initialPassed ? 'godkänt' : 'underkänt'}. Slutligt förslag: {c.passed ? 'godkänt' : 'underkänt'}. Korrigeringsförsök: {c.correctionAttempted ? 'ja' : 'behövdes inte'}.</p>
                    {!c.sameModel && <p style={{ color: '#fbbf24' }}>AI-modellen byttes mellan försöken; resultatet kan påverkas av både återkoppling och modellbyte.</p>}
                    {c.attempts.map((a, index) => (
                      <details key={index}>
                        <summary>{index === 0 ? 'Första förslag' : 'Korrigerat förslag'}: {formula(a.proposal.coefficients)}</summary>
                        <p>{a.proposal.reason}</p>
                        <p>AI-modell: {a.provider} / {a.model}.</p>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', textAlign: 'left' }}>
                            <thead><tr><th>x</th><th>Givet värde</th><th>Förslagets värde</th><th>Matchar</th></tr></thead>
                            <tbody>{a.visibleChecks.map(p => <tr key={p.x}><td>{p.x}</td><td>{p.expected}</td><td>{p.actual ?? 'Division med noll'}</td><td>{p.matched ? 'ja' : 'nej'}</td></tr>)}</tbody>
                          </table>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                <p><strong>Oraklets förslag:</strong> {formula(c.proposal.coefficients)}</p>
                <p>{c.proposal.reason}</p>
                <p style={{ color: C.muted }}>AI-modell: {c.provider} / {c.model}. Metodmotiveringen är AI-genererad; resultaten nedan kommer från körda kontroller.</p>
                <ul>
                  <li>Förslaget matchar givna punkter: {c.bankedMatch ? 'ja' : 'nej'}.</li>
                  <li>Förslaget matchar undanhållna punkter: {c.holdoutMatch ? 'ja' : 'nej'}.</li>
                  <li>Ratfit: {c.ratfit.checked} kontrollpunkter godkända.</li>
                  <li>Felaktigt kontrollvärde: avvisat av Ratfit.</li>
                </ul>
                <p><strong>Facit, avslöjat efter förslaget:</strong> {formula(c.truth)}</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'left' }}>
                    <thead><tr><th>Data</th><th>x</th><th>y</th></tr></thead>
                    <tbody>{['banked', 'holdout'].flatMap(kind => c.data[kind].map(([x, y]) => (
                      <tr key={`${kind}-${x}`}><td>{kind === 'banked' ? 'Givet' : 'Undanhållet'}</td><td>{x}</td><td>{y}</td></tr>
                    )))}</tbody>
                  </table>
                </div>
                <p style={{ color: C.muted, fontSize: '12px' }}>Datans fingeravtryck före förslaget: {c.commitment}</p>
              </details>
            ))}
            <p style={{ color: C.muted }}><strong>Begränsningar:</strong> {r.limitations}</p>
            <p style={{ color: C.muted }}>Seed: {r.seed}. Kodversion: {r.codeCommit || 'lokal körning'}.</p>
            {r.runUrl?.startsWith('https://github.com/cryptomanxxx/debatt-ai/actions/runs/') && <a href={r.runUrl} style={{ color: C.accent }}>Körning och nedladdningsbar rapport →</a>}
          </article>
        );
      })}
    </section>
  );
}
