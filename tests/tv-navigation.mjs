import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const browser = await chromium.launch({headless: true});
const page = await browser.newPage({viewport: {width: 1600, height: 1050}});
page.on('pageerror',e=>console.error('PAGE_ERROR',String(e)));
page.on('console',m=>{if(m.type()==='error')console.error('BROWSER_CONSOLE',m.text())});
const snapshot = async () => page.evaluate(() => {
  const a = document.activeElement;
  const rail = a?.closest('.rail');
  return {
    id: a?.id || '', kind: a?.dataset?.kind || '',
    title: a?.closest('.section')?.querySelector('h2')?.textContent || '',
    column: rail ? [...rail.querySelectorAll('.tile')].indexOf(a) : -1,
    navCompact: document.querySelector('#nav').classList.contains('compact')
  };
});
const press = async key => { await page.keyboard.press(key); return snapshot(); };
try {
  await page.goto(pathToFileURL(resolve('index.html')).href);
  await page.locator('.tile').first().waitFor();
  let s = await snapshot();
  assert.equal(s.id, 'nav-0', 'Initial focus must be Home in navigation');
  await page.evaluate(()=>{window.__keyEvents=[];document.addEventListener('keydown',e=>window.__keyEvents.push({key:e.key,defaultPrevented:e.defaultPrevented}),{capture:true})});
  console.log('BEFORE',JSON.stringify(await page.evaluate(()=>({play:!!document.querySelector('[data-kind="play"]'),nav:document.activeElement?.id,focusables:document.querySelectorAll('#stage [data-focusable]').length,navOffset:document.activeElement?.offsetParent?.className||null}))));
  s = await press('ArrowRight');
  console.log('AFTER',JSON.stringify(await page.evaluate(()=>({nav:document.activeElement?.id,keys:window.__keyEvents,playExists:!!document.querySelector('[data-kind="play"]')}))));
  assert.equal(s.kind, 'play' , 'Right from nav must enter hero');
  s = await press('ArrowDown');
  assert.equal(s.title, 'Continua a guardare', 'Down from hero must enter first video row');
  s = await press('ArrowRight');
  assert.equal(s.column, 1, 'Right moves to next video in the same row');
  s = await press('ArrowDown');
  assert.equal(s.title, 'Video per te', 'Down moves to next section, preserving column');
  assert.equal(s.column, 1);
  s = await press('ArrowDown');
  assert.equal(s.title, 'Da non perdere', 'Down moves to the final video row');
  assert.equal(s.column, 1);
  for (let i=0;i<5;i++) {
    const next = await press('ArrowDown');
    assert.equal(next.title, 'Da non perdere', 'Down at bottom must not leave last row');
    assert.equal(next.column, 1, 'Down at bottom must keep column');
  }
  await page.screenshot({path: 'nav-last-row.png'});
  s = await press('ArrowLeft');
  assert.equal(s.column, 0);
  s = await press('ArrowLeft');
  assert.equal(s.kind, 'nav', 'Only an explicit Left from first tile may open nav');
  await page.waitForTimeout(380);
  assert.equal((await snapshot()).navCompact, false, 'Nav must expand on focus');
  await page.screenshot({path:'nav-expanded.png'});
  s = await press('ArrowRight');
  assert.equal(s.kind,'tile','Right from nav must restore last selected video');
  assert.equal(s.title,'Da non perdere');
  await page.waitForTimeout(380);
  assert.equal((await snapshot()).navCompact,true,'Nav must collapse in content');
  s = await press('ArrowUp');
  assert.equal(s.title,'Video per te','Up traverses back to the preceding row');
  s = await press('ArrowUp');
  assert.equal(s.title,'Continua a guardare');
  s = await press('ArrowUp');
  assert.equal(s.kind,'play','Up from first row returns to hero');
  const margin = await page.locator('.section').first().evaluate(x=>parseFloat(getComputedStyle(x).marginTop));
  assert.ok(margin<=14,'Excessive vertical margin between sections');
  console.log('PASS: 17 TV D-pad, menu and spacing assertions; screenshots saved.');
} catch(e) {
  await page.screenshot({path:'nav-failure.png'});
  console.error('FAIL at state:',JSON.stringify(await snapshot()),e);
  process.exitCode=1;
} finally { await browser.close(); }
