import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(pathToFileURL(resolve('index.html')).href);
 await page.locator('#nav-0').focus();
 await page.keyboard.press('ArrowRight');
 await page.keyboard.press('Enter');
 assert.equal(await page.locator('#player').evaluate(x=>x.classList.contains('open')),true,'Hero must open player');
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'playPause','Player must focus Play');
 for(const id of ['exitPlayer','playPause','skipBack','skipForward','playerSettings','fullScreen']){
  assert.equal(await page.locator('#'+id).isVisible(),true,id+' not visible');
  const bounds=await page.locator('#'+id).boundingBox();
  assert.ok(bounds.width>=35&&bounds.height>=35,id+' too small');
 }
 await page.locator('#playerSettings').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#settings').evaluate(x=>x.classList.contains('open')),true,'Settings should open');
 await page.locator('#playbackSpeed').selectOption('1.5');
 assert.equal(await page.locator('#demoVideo').evaluate(x=>x.playbackRate),1.5,'Playback speed not applied');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#settings').evaluate(x=>x.classList.contains('open')),false,'Escape should close settings');
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'playerSettings','Settings close should restore focus');
 await page.locator('#skipForward').focus();await page.keyboard.press('Enter');
 await page.locator('#skipBack').focus();await page.keyboard.press('Enter');
 await page.locator('#fullScreen').focus();
 assert.equal(await page.locator('#fullScreen').isVisible(),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#player').evaluate(x=>x.classList.contains('open')),false,'Back should close player');
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.kind),'play','Focus should restore to hero');
 await page.locator('.tile').first().focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#player').evaluate(x=>x.classList.contains('open')),true,'Tile must open player');
 await page.locator('#exitPlayer').click();
 assert.equal(await page.locator('#player').evaluate(x=>x.classList.contains('open')),false,'Exit button must close player');
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.kind),'tile','Tile focus must be restored');
 assert.deepEqual(errors,[],'JS runtime errors');
 console.log('PASS player opening, all six buttons, focus, settings, speed, seek, close, and tile restore');
}catch(e){console.error('FAIL',e,'runtime errors',errors);await page.screenshot({path:'player-qa-failure.png'});process.exitCode=1}finally{await browser.close()}
