// Beräknar prestationsmått (avkastning, drawdown, volatilitet, Sharpe) från en
// tidsserie av NAV-snapshots. rows måste vara kronologiskt stigande.
// periodsPerYear anger hur många snapshots per år serien har (365 = dagligen,
// 1095 = 3 ggr/dag som ARBI) — krävs för korrekt annualisering.
export function computeMetrics(rows, startCapital, periodsPerYear = 365) {
  if (!rows || rows.length === 0) return null;

  const values = rows.map((r) => r.value).filter((v) => Number.isFinite(v));
  if (values.length === 0) return null;

  const last = values[values.length - 1];
  const totalReturnPct = (last / startCapital - 1) * 100;

  let peak = startCapital;
  let maxDrawdownPct = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = (v / peak - 1) * 100;
    if (dd < maxDrawdownPct) maxDrawdownPct = dd;
  }

  const dailyReturns = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) dailyReturns.push(values[i] / values[i - 1] - 1);
  }
  const n = dailyReturns.length;
  const meanRet = n ? dailyReturns.reduce((a, b) => a + b, 0) / n : 0;
  const variance = n
    ? dailyReturns.reduce((a, b) => a + (b - meanRet) ** 2, 0) / n
    : 0;
  const stdDailyRet = Math.sqrt(variance);
  const volatilityPct = stdDailyRet * Math.sqrt(periodsPerYear) * 100;
  const sharpe = stdDailyRet > 0 ? (meanRet / stdDailyRet) * Math.sqrt(periodsPerYear) : null;

  const firstDate = new Date(rows[0].skapad);
  const lastDate = new Date(rows[rows.length - 1].skapad);
  const daysActive = Math.max(1, Math.round((lastDate - firstDate) / 86400000));

  return { totalReturnPct, maxDrawdownPct, volatilityPct, sharpe, daysActive };
}
