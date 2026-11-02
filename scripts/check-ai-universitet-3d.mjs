/**
 * Validate the versioned, dependency-free 3D lecture assets on every PR.
 * Usage: node scripts/check-ai-universitet-3d.mjs [path/to/v13]
 */
import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {spawnSync} from 'node:child_process';

const directory = resolve(process.argv[2] || 'public/ai-universitet-3d/v13');
const html = readFileSync(join(directory, 'index.html'), 'utf8');

function checkSyntax(source, name) {
  const check = spawnSync(process.execPath, ['--check', '--input-type=module'], {
    input: source, encoding: 'utf8', timeout: 15000,
  });
  assert.equal(check.status, 0, `Invalid JavaScript in ${name}: ${check.stderr}`);
}

const moduleTag = html.match(/<script\s+type="module"\s*>([\s\S]*?)<\/script\s*>/);
assert.ok(moduleTag, '3D page must have an inline ES module');
checkSyntax(moduleTag[1], 'index.html inline module');

for (const moduleName of ['oraklet-3d.js', 'audience-3d.js', 'cosmic-city.js', 'observatory-3d.js']) {
  checkSyntax(readFileSync(join(directory, moduleName), 'utf8'), moduleName);
}

assert.match(html, /id="english-toggle"[^>]*>[^<]*Listen to Professor Oraklet in English/,
  'The English-language action must be visible');
assert.match(html, /languageButton\.addEventListener\('click'/,
  'The English-language button needs a click handler');
assert.match(html, /currentLanguage==='sv'\?'en':'sv'/,
  'Language selection must be reversible');
assert.match(html, /films\[currentLanguage\]\[name\]/,
  'Presentation videos must change with the selected language');
assert.match(html, /clips\[currentLanguage\]\[name\]/,
  'Narrated speech must change with the selected language');
assert.match(html, /document\.documentElement\.lang=currentLanguage/,
  'The page language must follow the selected language');

for (const language of ['sv', 'en']) {
  for (const topic of ['universe', 'atom', 'ai']) {
    const prefix = language === 'en' ? 'en/' : '';
    for (const [base, ext, minimumBytes] of [['audio', 'mp3', 8_000], ['videos', 'mp4', 100_000]]) {
      const relative = `assets/${base}/${prefix}${topic}.${ext}`;
      assert.ok(html.includes(`'${relative}'`), `Missing ${relative} URL in page`);
      const bytes = readFileSync(join(directory, relative));
      assert.ok(bytes.length > minimumBytes, `${relative} is missing or unexpectedly small`);
      if (ext === 'mp4') {
        assert.equal(bytes.subarray(4, 8).toString('ascii'), 'ftyp', `${relative} is not an MP4`);
        assert.ok(bytes.includes(Buffer.from('moov')), `${relative} has no MP4 movie metadata`);
      } else {
        assert.ok(bytes.subarray(0, 3).toString('ascii') === 'ID3' ||
          (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0), `${relative} is not an MP3`);
      }
    }
    if (language === 'en') {
      const transcript = readFileSync(join(directory, `assets/audio/en/${topic}.txt`), 'utf8');
      assert.ok(transcript.trim().split(/\s+/).length >= 25, `${topic} English transcript is incomplete`);
    }
  }
}

for (const name of ['oraklet.png', 'oraklet-m0-half.png', 'oraklet-m0-closed.png']) {
  assert.ok(statSync(join(directory, `assets/oraklet/${name}`)).size > 1000,
    `Missing fallback avatar frame ${name}`);
}

assert.match(html, /id="previous-version"[^>]*hidden/,
  'The preview-only version link must be hidden by default on the public site');
console.log('3D v13 validated: JavaScript, Swedish/English audio and video, transcripts, UI, avatar assets.');
