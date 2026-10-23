import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const menus=['Home','Cerca','Esplora','Iscrizioni','Musica','Gaming','Raccolta','Guarda più tardi','Cronologia','Impostazioni'];
let passed=0;
const key=async k=>page.keyboard.press(k);
try{
 await page.goto(pathToFileURL(resolve('index.html')).href);
 for(let i=0;i<menus.length;i++){
  const name=menus[i];
  const item=page.locator('#nav-'+i);
  await item.focus();
  await key('Enter');
  assert.equal(await page.locator('#sectionName').innerText(),name==='Home'?'Per te':name,'Section heading mismatch: '+name);
  assert.equal(await item.getAttribute('aria-current'),'page','Active menu selection mismatch: '+name);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'nav-'+i,'Menu focus lost after OK: '+name);
  await key('ArrowRight');
  const focus=await page.evaluate(()=>({inMain:!!document.activeElement?.closest('.tvmain'),kind:document.activeElement?.dataset.kind,id:document.activeElement?.id}));
  if(!['Iscrizioni','Gaming','Raccolta','Guarda più tardi','Cronologia'].includes(name))assert.ok(focus.inMain,'RIGHT failed to enter content for '+name+': '+JSON.stringify(focus));
  if(name==='Cerca'){
   assert.equal(focus.id,'query','Cerca must focus search input');
   await page.locator('#query').fill('Tokyo');
   assert.equal(await page.locator('#searchResults .tile').count(),1,'Search should filter results');
   await page.locator('#query').fill('NonEsisteMyTubeXYZ');
   assert.equal(await page.locator('#searchResults .tile').count(),0,'Search empty state missing');
  }else if(name==='Home'){
   assert.equal(focus.kind,'play','Home should enter hero');
   await key('ArrowDown');
   assert.equal(await page.locator('.tile:focus').count(),1,'Home hero DOWN should enter videos');
  }else if(name==='Impostazioni'){
   assert.equal(focus.id,'prefAutoplay','Settings must focus first toggle');
   await key('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement?.id),'prefCompact');
  }else if(['Iscrizioni','Gaming','Raccolta','Guarda più tardi','Cronologia'].includes(name)){
   assert.equal(await page.locator('.results .tile').count(),0,'Empty state must not show fake videos: '+name);
   assert.ok((await page.locator('#content').innerText()).length>20,'Empty state must explain missing content: '+name);
  }else{
   assert.equal(focus.kind,'tile','Section '+name+' must contain navigable cards');
   await key('ArrowRight');
   assert.equal(await page.locator('.tile:focus').count(),1,'Grid horizontal navigation failed: '+name);
   await key('ArrowDown');
   assert.equal(await page.locator('.tile:focus').count(),1,'Grid vertical navigation failed: '+name);
  }
  await key('Escape');
  assert.equal(await page.locator('#sectionName').innerText(),'Per te','Back should return Home from '+name);
  passed++;console.log('PASS menu',i,name);
 }
 assert.deepEqual(errors,[],'Browser JS runtime errors');
 console.log('PASS '+passed+'/'+menus.length+' menu destinations, OK, Right, grids, search, Back');
}catch(e){console.error('FAIL',e,'pageerrors',errors);await page.screenshot({path:'menu-navigation-failure.png'});process.exitCode=1}finally{await browser.close()}
