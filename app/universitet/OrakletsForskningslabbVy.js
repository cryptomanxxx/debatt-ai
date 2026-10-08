const C = { text: '#b8d8ff', muted: '#8aaac8', border: '#17395a', accent: '#67e8c2' };
const WORKFLOW = 'https://github.com/cryptomanxxx/debatt-ai-orchestrator/actions/workflows/oraklet-lab.yml';
const formula = coefficients => `(${coefficients[0]}·x + ${coefficients[1]}) / (${coefficients[2]}·x + ${coefficients[3]})`;

// Reports share schemaVersion, but each tool has its own case payload.
const isDisplayValue = value => value == null || ['string', 'number', 'boolean'].includes(typeof value);
const isCoefficients = values => Array.isArray(values) && values.length === 4 && values.every(isDisplayValue);
const isProposal = proposal => proposal && isCoefficients(proposal.coefficients) && isDisplayValue(proposal.reason);
const isDataRows = rows => Array.isArray(rows) && rows.every(row =>
  Array.isArray(row) && row.length === 2 && row.every(isDisplayValue));
const isRatfitCase = c => c && isProposal(c.proposal) && isCoefficients(c.truth)
  && c.ratfit && isDisplayValue(c.ratfit.checked)
  && [c.case, c.provider, c.model, c.commitment].every(isDisplayValue)
  && isDataRows(c.data?.banked) && isDataRows(c.data?.holdout)
  && (c.attempts == null || (Array.isArray(c.attempts) && c.attempts.every(a =>
    a && isProposal(a.proposal) && [a.provider, a.model].every(isDisplayValue)
    && Array.isArray(a.visibleChecks) && a.visibleChecks.every(p =>
      p && typeof p === 'object' && !Array.isArray(p)
      && [p.x, p.expected, p.actual].every(isDisplayValue)))));
const printable = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? 'Ej angivet';

function StructuredCase({ c, index }) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    return <p>Fall {index + 1}: rapportuppgifterna kan inte visas.</p>;
  }
  const h = c.hypothesisTest;
  return (
    <details style={{ borderTop: `1px solid ${C.border}`, padding: '12px 0' }}>
      <summary style={{ cursor: 'pointer' }}>Fall {printable(c.case ?? index + 1)}: {c.passed === true ? 'godkänt modellförslag' : c.passed === false ? 'underkänt modellförslag' : 'inget modellresultat'}</summary>
      <p style={{ color: C.muted }}>AI-modell: {printable(c.provider)} / {printable(c.model)}. Modellförslaget är separat från verktygets uppmätta resultat.</p>
      {h && <p><strong>Uppmätt beslut:</strong> {printable(h.decision)}. Oberoende verifierat: {h.independentlyVerified === true ? 'ja' : 'ej angivet'}.</p>}
      {[
        ['Oraklets förslag (AI-genererat)', c.proposal],
        ['Uppmätt resultat', h?.measured ?? c.evidence?.result],
        ['Hypotes och beslutskriterium', h?.protocol],
        ['Syntetiskt facit', c.truth],
        ['Data', c.data],
        ['Kontrollresultat', c.controlEvidence?.result],
      ].filter(([, value]) => value != null).map(([label, value]) => (
        <details key={label}>
          <summary style={{ cursor: 'pointer' }}>{label}</summary>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '13px' }}>{printable(value)}</pre>
        </details>
      ))}
      {c.commitment && <p style={{ color: C.muted, fontSize: '12px' }}>Datans fingeravtryck före förslaget: {printable(c.commitment)}</p>}
    </details>
  );
}

export default function OrakletsForskningslabbVy({ experiment = [], labAvailable = false }) {
  return (
    <section style={{ color: C.text, lineHeight: 1.7 }}>
      <h2 style={{ fontFamily: 'Georgia, serif', marginTop: 0 }}>Oraklets forskningslabb</h2>
      <p>Forskningslabbet bygger på <a href="https://github.com/cryptomanxxx/debatt-ai-orchestrator" style={{ color: C.accent }}>debatt-ai-orchestrator på GitHub</a>, som kombinerar AI-modellorkestrering med Professor Oraklets automatiserade forskningsflöde. Orkestreringen väljer modell eller verktyg enligt konfiguration och regler. Oraklet föreslår och väljer experiment inom en fördefinierad katalog, varefter beräkningsverktyg och oberoende kontroller prövar modellens förslag. Här visas metod, data och resultat från genomförda experiment.</p>
      <p>Målet är autonom vetenskaplig AI-forskning där systemet väljer en lämplig AI-modell, planerar och genomför experiment samt dokumenterar resultaten, medan människan bara behöver granska och godkänna experimenten. Dagens labb kör avgränsade metodtester; dagliga körningar inom katalogen sker automatiskt utan separat godkännande inför varje experiment.</p>
      <div style={{ padding: '20px', border: `1px solid ${C.border}`, borderRadius: '10px', marginBottom: '24px' }}>
        <strong style={{ color: C.accent }}>Ratfit-experiment: återfinna ett dolt rationellt samband</strong>
        <p>Oraklet får sex exakta datapunkter och söker en formel av typen (a·x+b)/(c·x+d). Tre andra punkter hålls undan tills förslaget är låst. BootLoops Ratfit kontrollerar sambandet och ska avvisa avsiktligt felaktiga data. Modellens formel kontrolleras dessutom separat med exakt heltalsräkning.</p>
        <p>Labbet har två upplägg: ett första förslag utan återkoppling, eller högst ett korrigeringsförsök med exakt återkoppling från de sex synliga punkterna. Första och slutliga resultat visas separat. De tre undanhållna punkterna avslöjas först efter det slutliga förslaget. Oraklet väljer nästa experiment i den dagliga körningen.</p>
        <p style={{ color: C.muted }}>Detta är ett syntetiskt metodtest med känt facit. Ett godkänt test är inte en ny vetenskaplig upptäckt.</p>
        <a href={WORKFLOW} style={{ color: C.accent }}>Öppna forskningslabbet och välj experiment i GitHub →</a>
      </div>
      {!labAvailable && <p style={{ color: C.muted }}>Experimentrapporter kan inte hämtas just nu. Labbet är förberett, men inga resultat kan visas här ännu.</p>}
      {labAvailable && experiment.length === 0 && <p style={{ color: C.muted }}>Inga experimentrapporter har sparats ännu.</p>}
      {experiment.filter(row => row && typeof row === 'object').map(row => {
        const r = row.rapport;
        if (![1, 2].includes(r?.schemaVersion) || !Array.isArray(r.cases)) return null;
        return (
          <article key={row.id} style={{ border: `1px solid ${C.border}`, borderRadius: '10px', padding: '20px', marginBottom: '20px', overflowWrap: 'anywhere' }}>
            <p style={{ color: r.status === 'passed' ? C.accent : '#fbbf24', fontFamily: 'monospace' }}>
              {r.executionStatus === 'error' ? 'KÖRNING AVBRUTEN – DRIFTFEL' : r.status === 'passed' ? 'METODTEST GODKÄNT' : 'MODELLFÖRSLAG UNDERKÄNT'} · {new Date(row.skapad).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })}
            </p>
            <h3>{row.titel}</h3>
            <p><strong>Forskningsfråga:</strong> {r.question}</p>
            <p><strong>Metod:</strong> {r.method}</p>
            {r.plan?.reason && <p><strong>Oraklets experimentval (AI-genererat):</strong> {r.plan.reason}</p>}
            {r.executionStatus === 'error' && <p style={{ color: '#fbbf24' }}>Experimentet slutfördes inte. Rapporten ger inget resultat om modellens förmåga.</p>}
            {r.cases.map((c, index) => !isRatfitCase(c) ? <StructuredCase key={index} c={c} index={index} /> : (
              <details key={c.case} style={{ borderTop: `1px solid ${C.border}`, padding: '12px 0' }}>
                <summary style={{ cursor: 'pointer' }}>Fall {c.case}: {c.passed ? 'godkänt modellförslag' : 'underkänt modellförslag'}</summary>
                {r.schemaVersion === 2 && (
                  <div>
                    <p>Första förslag: {c.initialPassed ? 'godkänt' : 'underkänt'}. Slutligt förslag: {c.passed ? 'godkänt' : 'underkänt'}. Korrigeringsförsök: {c.correctionAttempted ? 'ja' : 'nej'}.</p>
                    {!c.sameModel && <p style={{ color: '#fbbf24' }}>AI-modellen byttes mellan försöken; resultatet kan påverkas av både återkoppling och modellbyte.</p>}
                    {(c.attempts || []).map((a, index) => (
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
            {/^https:\/\/github\.com\/cryptomanxxx\/(?:debatt-ai|debatt-ai-orchestrator)\/actions\/runs\/\d+\/?$/.test(r.runUrl || '') && <a href={r.runUrl} style={{ color: C.accent }}>Körning och nedladdningsbar rapport →</a>}
          </article>
        );
      })}
    </section>
  );
}
