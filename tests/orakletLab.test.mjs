import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCases, runExperiment, modelPrompt, parseProposal, verifyFormula, validateTool, UPSTREAM } from '../agents/oraklet-lab-core.mjs';

function response(accepted) {
  return { status: accepted ? 200 : 422, data: { provider: 'bootloops', mock: false,
    toolResult: { tool: 'bootloops_ratfit', upstreamCommit: UPSTREAM, accepted, depth: 3, checked: 3, failed: accepted ? 0 : 1 },
    verification: { status: accepted ? 'passed' : 'failed', scope: 'exact_rational_holdout', factualityChecked: false } } };
}
function proposal(coefficients) { return JSON.stringify({ method: 'bootloops_ratfit', coefficients, reason: 'Exakt rationell rekonstruktion med separata kontrollpunkter.' }); }

test('reproducerbara data, blindad modellprompt och alla kontroller före rapport', async () => {
  const fixtures = makeCases('20261006');
  assert.deepEqual(fixtures, makeCases('20261006'));
  assert.notDeepEqual(fixtures, makeCases('123'));
  let committed = false, calls = 0, models = 0;
  const report = await runExperiment('20261006', async messages => {
    assert.equal(committed, true);
    assert.deepEqual(messages, modelPrompt(fixtures[models].input.banked));
    assert.deepEqual(Object.keys(JSON.parse(messages[1].content)), ['banked']);
    return { text: proposal(fixtures[models++].truth), provider: 'test', model: 'test-model' };
  }, async input => {
    const index = Math.floor(calls / 2), positive = calls++ % 2 === 0;
    assert.deepEqual(input.banked, fixtures[index].input.banked);
    const matches = verifyFormula(fixtures[index].truth, input.holdout);
    assert.equal(matches, positive);
    return response(matches);
  }, commitments => { assert.equal(commitments.length, 3); committed = true; });
  assert.equal(calls, 6);
  assert.equal(models, 3);
  assert.equal(report.status, 'passed');
  assert.ok(report.cases.every(c => c.passed && c.negativeControl.failed === 1));
  assert.match(report.limitations, /inte en ny vetenskaplig upptäckt/);
});

test('felaktiga modellformler blir underkända trots godkänd Ratfit-körning', async () => {
  let calls = 0;
  const report = await runExperiment('99', async () => ({ text: proposal(['0','0','0','1']), provider: 'test', model: 'test' }),
    async () => response(calls++ % 2 === 0));
  assert.equal(report.status, 'failed');
  assert.ok(report.cases.every(c => !c.passed && !c.holdoutMatch && c.ratfit.accepted));
});

test('exakt kontroll: stora heltal, ekvivalenta koefficienter och poler', () => {
  assert.equal(verifyFormula(['1','1','1','2'], [['999999999999999999999999','1000000000000000000000000/1000000000000000000000001']]), true);
  assert.equal(verifyFormula(['2','2','2','4'], [['4','5/6']]), true);
  assert.equal(verifyFormula(['1','1','1','2'], [['4','0']]), false);
  assert.equal(verifyFormula(['1','1','1','2'], [['-2','0']]), false);
});

test('modellens svar får inte innehålla kod, extra fält eller ogiltiga koefficienter', () => {
  assert.equal(parseProposal('```json\n{}\n```'), null);
  const valid = JSON.parse(proposal(['1','1','1','2']));
  assert.equal(parseProposal(JSON.stringify({ ...valid, code: 'fetch(secret)' })), null);
  assert.equal(parseProposal(proposal(['1','1','0','0'])), null);
  assert.equal(parseProposal(proposal(['1.5','1','1','2'])), null);
  assert.equal(parseProposal(proposal(['1000','1','1','2'])), null);
  assert.throws(() => makeCases('$(oops)'));
});

test('mock, fel upstream, scope, räknare och missad negativ kontroll avvisas', async () => {
  const good = response(true);
  for (const change of [
    d => { d.mock = true; }, d => { d.toolResult.upstreamCommit = 'other'; },
    d => { d.verification.scope = 'response_shape'; }, d => { d.toolResult.checked = 2; },
    d => { d.toolResult.failed = 1; }, d => { d.verification.factualityChecked = true; },
  ]) {
    const modified = structuredClone(good); change(modified.data);
    assert.throws(() => validateTool(modified.status, modified.data, true, 3));
  }
  await assert.rejects(runExperiment('99', async () => ({ text: proposal(['1','1','1','2']), provider: 'test', model: 'test' }),
    async () => response(true)), /Oväntad Ratfit/);
});
