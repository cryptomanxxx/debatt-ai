import { createHash } from 'node:crypto';

export const UPSTREAM = '66b680ce742e654cfe86da4f072a69061fe182b1';
export const LIMITATIONS = 'Syntetiskt metodtest med känd formelklass, inte en ny vetenskaplig upptäckt. Kontroll på ändligt många punkter är inget bevis för alla x. Ratfit returnerar en kontrollrapport, inte formelns koefficienter; modellens förslag kontrolleras separat.';

function gcd(a, b) { a = a < 0n ? -a : a; while (b) [a, b] = [b, a % b]; return a; }
export function fraction(n, d) {
  if (d === 0n) throw new Error('Nollnämnare');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d);
  return d / g === 1n ? String(n / g) : `${n / g}/${d / g}`;
}
function pair(value) { const [n, d = '1'] = value.split('/'); return [BigInt(n), BigInt(d)]; }
export function verifyFormula(coefficients, rows) {
  const [a, b, c, d] = coefficients.map(BigInt);
  return rows.every(([x, y]) => {
    const [xn, xd] = pair(x), [yn, yd] = pair(y);
    const denominator = c * xn + d * xd;
    return denominator !== 0n && (a * xn + b * xd) * yd === yn * denominator;
  });
}

export function makeCases(seed) {
  if (!/^[0-9]{1,9}$/.test(String(seed))) throw new Error('Seed ska vara 1–9 siffror');
  return [0, 1, 2].map(index => {
    const bytes = createHash('sha256').update(`oraklet-ratfit-v1:${seed}:${index}`).digest();
    const a = BigInt(1 + bytes[0] % 7), b = BigInt(1 + bytes[1] % 7);
    const c = BigInt(1 + bytes[2] % 5);
    let d = BigInt(8 + bytes[3] % 7);
    if (a * d === b * c) d += 1n;
    const rows = xs => xs.map(x => [String(x), fraction(a * BigInt(x) + b, c * BigInt(x) + d)]);
    const input = { banked: rows([0, 1, 2, 3, 4, 5]), holdout: rows([8, 11, 15]) };
    const truth = [a, b, c, d].map(String);
    const commitment = createHash('sha256').update(JSON.stringify({ truth, input })).digest('hex');
    return { id: index + 1, input, truth, commitment };
  });
}

export function modelPrompt(banked) {
  return [
    { role: 'system', content: 'Du är Professor Oraklet i Debatt-AI:s forskningslabb. Genomför ett syntetiskt metodtest. Sök en formel (a*x+b)/(c*x+d) från de givna exakta datapunkterna. Använd metoden bootloops_ratfit som efterföljande kontroll. Du har inte fått facit eller kontrollpunkterna. Svara ENDAST med JSON: {"method":"bootloops_ratfit","coefficients":["a","b","c","d"],"reason":"kort metodmotivering på svenska"}. Koefficienter ska vara heltal mellan -999 och 999, skrivna som strängar. Ange inga påståenden om testresultat eftersom testet ännu inte har körts.' },
    { role: 'user', content: JSON.stringify({ banked }) },
  ];
}

export function parseProposal(text) {
  try {
    const p = JSON.parse(text);
    if (Object.keys(p).sort().join(',') !== 'coefficients,method,reason'
      || p.method !== 'bootloops_ratfit' || !Array.isArray(p.coefficients)
      || p.coefficients.length !== 4 || !p.coefficients.every(x => typeof x === 'string' && /^-?\d{1,3}$/.test(x))
      || typeof p.reason !== 'string' || !p.reason.trim() || p.reason.length > 800
      || (BigInt(p.coefficients[2]) === 0n && BigInt(p.coefficients[3]) === 0n)) return null;
    return { ...p, reason: p.reason.trim() };
  } catch { return null; }
}

export function validateTool(status, report, accepted, count) {
  const t = report?.toolResult, v = report?.verification;
  if (status !== (accepted ? 200 : 422) || report?.provider !== 'bootloops' || report?.mock !== false
    || t?.tool !== 'bootloops_ratfit' || t?.upstreamCommit !== UPSTREAM || t?.accepted !== accepted
    || t?.checked !== count || t?.failed !== (accepted ? 0 : 1)
    || !Number.isInteger(t?.depth) || t.depth < 1 || t.depth > 6
    || v?.status !== (accepted ? 'passed' : 'failed') || v?.scope !== 'exact_rational_holdout'
    || v?.factualityChecked !== false) throw new Error('Oväntad Ratfit-kontrollrapport');
  return { accepted: t.accepted, depth: t.depth, checked: t.checked, failed: t.failed, upstreamCommit: t.upstreamCommit };
}

export async function runExperiment(seed, propose, callTool, onCommit = () => {}) {
  const cases = makeCases(seed);
  // Commit all fixtures before any model sees its banked data. This is an
  // audit fingerprint, not protection against an agent with repository access.
  await onCommit(cases.map(c => ({ case: c.id, sha256: c.commitment })));
  const results = [];
  for (const fixture of cases) {
    const ai = await propose(modelPrompt(fixture.input.banked));
    const proposal = parseProposal(ai.text);
    if (!proposal || typeof ai.provider !== 'string' || typeof ai.model !== 'string') throw new Error('Ogiltigt modellförslag');
    const corrupted = structuredClone(fixture.input);
    const [n, d] = pair(corrupted.holdout[0][1]);
    corrupted.holdout[0][1] = fraction(n + d, d);
    if (!verifyFormula(fixture.truth, fixture.input.holdout) || verifyFormula(fixture.truth, corrupted.holdout))
      throw new Error('Den oberoende kontrollen klarade inte sina egna kontrollfall');
    const good = await callTool(fixture.input), bad = await callTool(corrupted);
    const ratfit = validateTool(good.status, good.data, true, 3);
    const negativeControl = validateTool(bad.status, bad.data, false, 3);
    const bankedMatch = verifyFormula(proposal.coefficients, fixture.input.banked);
    const holdoutMatch = verifyFormula(proposal.coefficients, fixture.input.holdout);
    results.push({ case: fixture.id, commitment: fixture.commitment, data: fixture.input, truth: fixture.truth,
      proposal, provider: ai.provider, model: ai.model, bankedMatch, holdoutMatch, ratfit, negativeControl,
      passed: bankedMatch && holdoutMatch });
  }
  return { schemaVersion: 1, researcher: 'Professor Oraklet', title: 'Kan Oraklet återfinna ett dolt rationellt samband?',
    question: 'Kan en AI-modell föreslå rätt formel inom klassen (a*x+b)/(c*x+d) från sex exakta datapunkter, och klara tre undanhållna kontrollpunkter?',
    method: 'Tre syntetiska fall. Förslagen låses före kontrollen. Ratfit körs på riktiga och avsiktligt felaktiga kontrollvärden. Modellens koefficienter testas separat med BigInt och exakt korsmultiplikation, utan Thiele-algoritmen.',
    seed: String(seed), status: results.every(r => r.passed) ? 'passed' : 'failed', limitations: LIMITATIONS, cases: results };
}
