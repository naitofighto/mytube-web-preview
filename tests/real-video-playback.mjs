import assert from 'node:assert/strict';
import {chromium,webkit,devices} from 'playwright';
const base='http://127.0.0.1:8765/';
for(const [label,engine,mobile] of [['Chromium TV',chromium,false],['WebKit iPhone',webkit,true]]){
 const browser=await engine.launch({headless:true});const ctx=await browser.newContext(mobile?{...devices['iPhone 13'],viewport:{width:390,height:844}}:{viewport:{width:1600,height:900}});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const src=await page.locator('#demoVideo').getAttribute('src');assert.equal(src,'media/mytube-demo.mp4');
  const resp=await page.request.get(base+src);assert.equal(resp.status(),200);assert.match(resp.headers()['content-type']||'',/video\/mp4/);
  await page.locator('[data-kind="play"]').first().evaluate(el=>el.click());
  await page.locator('#playPause').evaluate(el=>el.click());
  await page.waitForFunction(()=>{const v=document.querySelector('#demoVideo');return v.readyState>=2&&v.currentTime>0.5},{timeout:15000});
  const t1=await page.locator('#demoVideo').evaluate(v=>v.currentTime);
  await page.waitForTimeout(1100);
  const t2=await page.locator('#demoVideo').evaluate(v=>v.currentTime);
  assert.ok(t2>t1+0.25,`Video did not progress ${t1} -> ${t2}`);
  await page.locator('#playPause').evaluate(el=>el.click());
  const paused=await page.locator('#demoVideo').evaluate(v=>v.paused);assert.equal(paused,true);
  await page.locator('#playbackSpeed').selectOption('1.5');assert.equal(await page.locator('#demoVideo').evaluate(v=>v.playbackRate),1.5);
  await page.locator('#skipForward').evaluate(el=>el.click());assert.ok((await page.locator('#demoVideo').evaluate(v=>v.currentTime))>=t2);
  assert.deepEqual(errors,[]);
  console.log('PASS',label,'self-hosted video playback',t1,t2,'pause, seek, speed');
 }catch(e){console.error('FAIL',label,e,errors);await page.screenshot({path:`video-${mobile?'iphone':'tv'}-failure.png`,fullPage:true});process.exitCode=1}finally{await browser.close()}
}
