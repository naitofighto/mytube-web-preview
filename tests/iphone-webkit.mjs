import assert from 'node:assert/strict';
import {webkit, devices} from 'playwright';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'], viewport:{width:390,height:844}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base='https://naitofighto.github.io/mytube-web-preview/?qa=iphone-webkit';
const snap=async n=>page.screenshot({path:`iphone-${n}.png`,fullPage:true});
const check=async label=>{const v=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,stage:document.querySelector('#stage').getBoundingClientRect().width,frame:document.querySelector('.frame').getBoundingClientRect().width,scale:getComputedStyle(document.querySelector('#stage')).transform}));console.log(label,JSON.stringify(v));assert.ok(v.width<=v.viewport+2,`horizontal overflow in ${label}: ${JSON.stringify(v)}`);assert.ok(v.stage<=v.viewport+2,'stage too wide');};
try{
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(1000);await check('Home');await snap('home');
 for(const name of ['Musica','Gaming','Raccolta','Guarda più tardi','Cronologia','Impostazioni']){
  const b=page.locator('[data-kind="nav"]').filter({hasText:name}).first();await b.scrollIntoViewIfNeeded();await b.click();await check(name);assert.ok((await page.locator('#content').innerText()).length>5,name+' empty');
  if(name==='Impostazioni'){assert.ok(await page.locator('#prefAutoplay').isVisible());await page.locator('#prefAutoplay').check();await snap('settings');}
 }
 await page.locator('[data-kind="nav"]').filter({hasText:'Home'}).first().click();await page.locator('[data-kind="play"]').first().click();assert.ok(await page.locator('#player').isVisible());await check('Player');await snap('player');
 for(const id of ['exitPlayer','playPause','skipBack','skipForward','playerSettings','watchLaterButton','saveButton'])assert.ok(await page.locator('#'+id).isVisible(),id+' not visible');
 await page.locator('#playerSettings').click();assert.ok(await page.locator('#settings').isVisible());await snap('player-settings');
 await page.locator('#exitPlayer').click({force:true});
 assert.deepEqual(errors,[],'JS errors');console.log('PASS iPhone WebKit navigation, viewport, player, settings');
}catch(e){console.error('FAIL',e);await snap('failure');process.exitCode=1}finally{await browser.close()}
