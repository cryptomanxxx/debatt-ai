import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const { transform, loadBindings } = require('next/dist/build/swc');
await loadBindings();
const source = readFileSync(new URL('../app/universitet/OrakletsForskningslabbVy.js', import.meta.url), 'utf8');
const compiled = await transform(source, {
  filename: 'OrakletsForskningslabbVy.js',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
});
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled.code)(require, module, module.exports);
const Lab = module.exports.default;
const render = cases => renderToStaticMarkup(React.createElement(Lab, {
  labAvailable: true,
  experiment: [{ id: 'report', titel: 'Test', skapad: '2026-10-08', rapport: {
    schemaVersion: 2, status: 'passed', cases,
  } }],
}));
for (const [tool, proposal, measured] of [
  ['sympy', { roots: ['-2', '1'], reason: 'Rötter' }, { roots: ['-2', '1'], discriminant: '9' }],
  ['scikit-learn', { degree: 2 }, { selectedDegree: 2, selectedTestMse: 0.1 }],
  ['dowhy', { effect: 2, adjustment: ['z'] }, { effect: 2, adjustmentVariables: ['z'] }],
  ['statsmodels', { decision: 'reject_h0' }, { pvalue: 0.01 }],
]) {
  test(`${tool} reports render without Ratfit fields`, () => {
    const html = render([{ case: 1, passed: true, proposal, hypothesisTest: {
      decision: 'completed', measured, independentlyVerified: true,
    } }]);
    assert.match(html, /Uppmätt resultat/);
    assert.match(html, /godkänt modellförslag/);
    assert.doesNotMatch(html, /Ratfit: /);
  });
}
test('legacy Ratfit report remains readable', () => {
  const html = render([{ case: 1, passed: true, proposal: { coefficients: [1, 2, 3, 4] },
    truth: [1, 2, 3, 4], ratfit: { checked: 9 }, data: { banked: [[1, '3/7']], holdout: [] } }]);
  assert.match(html, /Ratfit: 9 kontrollpunkter/);
});
test('partial and malformed cases do not crash the lab', () => {
  assert.match(render([null, {}, { proposal: {}, truth: {} }]), /rapportuppgifterna kan inte visas/);
  assert.doesNotThrow(() => render([]));
});
