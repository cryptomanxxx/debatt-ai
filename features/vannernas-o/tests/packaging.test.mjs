import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
const html=fs.readFileSync('../../public/vannernas-o/v1/index.html','utf8'),source=fs.readFileSync('web/index.html','utf8');
test('public page contains no development menu, key input, private auth or unexpanded build markers',()=>{
 for(const forbidden of ['Animation och modellprov','Animation and model tests','id="zoo-model"','id="world-debug"','id="api-key"','PRIVAT TESTLABB','oai-authenticated-user','mr.marcus.sweden','ISLAND_RENDERER','ISLAND_LANGUAGE'])assert.ok(!html.includes(forbidden),forbidden);
 assert.ok(html.includes('/api/vannernas-o/session'));assert.ok(!html.includes("fetch('/api/session'"));assert.ok(html.includes('/vannernas-o/v1/models/'));assert.ok(html.includes('/vannernas-o/v1/audio/'));
 for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 const ids=new Set([...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const file of ['web/index.html','web/rufus/entry.js'])for(const match of fs.readFileSync(file,'utf8').matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(match[1]),'missing DOM dependency '+match[1]);
});
test('all eight GLBs match the imported revision and HeadAudio license accompanies runtime assets',()=>{
 const manifest=JSON.parse(fs.readFileSync('model-sha256.json','utf8'));assert.equal(Object.keys(manifest).length,8);
 for(const [name,hash] of Object.entries(manifest)){const bytes=fs.readFileSync('../../public/vannernas-o/v1/models/'+name+'.glb');assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(createHash('sha256').update(bytes).digest('hex'),hash)}
 for(const name of ['headaudio.mjs','headworklet.mjs'])assert.ok(fs.readFileSync('../../public/vannernas-o/v1/audio/'+name,'utf8').includes('MIT License'));
});
test('homepage announcement follows the university banner and links to a same-site entry',()=>{
 const page=fs.readFileSync('../../app/client.js','utf8');const university=page.indexOf('<section aria-labelledby="ai-universitet-3d-nyhet"'),island=page.indexOf('<section aria-labelledby="vannernas-o-nyhet"');assert.ok(university>0&&island>university);assert.ok(island<page.indexOf('<CivilisationDriftWidget data='));assert.ok(page.slice(island).includes('href="/vannernas-o"'));
});
