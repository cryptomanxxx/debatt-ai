import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),output=resolve(root,'../../public/vannernas-o/v1');
let html=readFileSync(resolve(root,'web/index.html'),'utf8');
for(const [marker,entry] of [['ISLAND_LANGUAGE','language-entry.js'],['ISLAND_RENDERER','entry.js']]){
 const result=await build({entryPoints:[resolve(root,'web/rufus',entry)],bundle:true,write:false,minify:true,format:'iife',target:'es2020',legalComments:'inline'});
 html=html.replace('<!-- '+marker+' -->',()=>'<script>'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>');
}
// Normalize generated shader indentation without changing GLSL tokens.
html=html.replace(/^[ \t]+$/gm,'').replace(/[ \t]+$/gm,'').replace(/^ +(?=\t)/gm,'');
mkdirSync(output,{recursive:true});writeFileSync(resolve(output,'index.html'),html);
console.log('Built Vännernas ö: public page, eight external GLBs, namespaced Next.js API.');
