import assert from 'node:assert/strict';
import {webkit,devices} from 'playwright';
const browser=await webkit.launch({headless:true});const page=await browser.newPage({...devices['iPhone 13'],viewport:{width:390,height:844}});
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-kind="play"]').first().evaluate(el=>el.click());
 await page.locator('#playPause').waitFor({state:'visible'});
 const ids=['exitPlayer','playPause','skipBack','skipForward','playerSettings','fullScreen','watchLaterButton','saveButton'];
 for(const id of ids){const el=page.locator('#'+id);const box=await el.boundingBox();assert.ok(box&&box.width>=110&&box.height>=48,`${id} too small: ${JSON.stringify(box)}`);const css=await el.evaluate(e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));assert.notEqual(css.color,css.bg,`${id} text same as background`);console.log(id,JSON.stringify({box,css}))}
 const b=await page.locator('#playPause').boundingBox();const back=await page.locator('#exitPlayer').boundingBox();assert.ok(Math.abs(b.y-back.y)<10,'Primary buttons should share row');
 await page.locator('#playPause').focus();const focus=await page.locator('#playPause').evaluate(e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));assert.notEqual(focus.color,focus.bg,'Focused Play button must remain legible');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=2,'Horizontal overflow '+overflow);
 await page.screenshot({path:'iphone-player-buttons.png',fullPage:true});
 console.log('PASS iPhone player button layout, contrast, focus and touch targets');
}catch(e){console.error('FAIL',e);await page.screenshot({path:'iphone-player-buttons-failure.png',fullPage:true});process.exitCode=1}finally{await browser.close()}
