const { chromium } = require('C:/Users/yj619/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const assert = require('assert');
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context = await browser.newContext();
  const errors = [];
  context.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  const admin = await context.newPage();
  const student = await context.newPage();
  await admin.goto('http://127.0.0.1:8782/slides.html?admin');
  await student.goto('http://127.0.0.1:8782/slides.html');
  await assertVisible(admin, '#focusBtn');
  assert(await student.locator('#focusBtn').isHidden());
  await admin.locator('#navNext').click();
  const before = await admin.locator('#counter').textContent();
  await admin.locator('#focusBtn').click();
  await assertVisible(admin, '#focusOverlay');
  assert(await student.locator('#focusOverlay').isHidden());
  await admin.keyboard.press('ArrowRight');
  assert.equal(await admin.locator('#counter').textContent(),before);
  await admin.keyboard.press('Escape');
  assert(await admin.locator('#focusOverlay').isHidden());
  assert.equal(await admin.locator('#counter').textContent(),before);
  const mobile = [];
  for (const width of [320,390,430]) {
    await admin.setViewportSize({width,height:700});
    await admin.locator('#focusBtn').click();
    const fit = await admin.evaluate(() => {
      const e=document.querySelector('#focusOverlay'),r=e.getBoundingClientRect();
      return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
        content:[...e.querySelectorAll('img,p')].every(x=>{const b=x.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom;})};
    });
    assert(!fit.overflow && fit.content);mobile.push(fit);
    await admin.locator('#focusBtn').click();
  }
  await admin.setViewportSize({width:1280,height:720});
  const overflow=await admin.evaluate(()=>{const all=[...document.querySelectorAll('#stage > section.slide')];const cur=all.findIndex(s=>s.classList.contains('active'));const bad=all.map((s,i)=>{all.forEach(x=>x.classList.toggle('active',x===s));const c=s.querySelector('.slide-content')||s;return{n:i+1,oh:c.scrollHeight-c.clientHeight,ow:c.scrollWidth-c.clientWidth}}).filter(r=>r.oh>4||r.ow>4);all.forEach((x,i)=>x.classList.toggle('active',i===cur));return bad});
  assert.equal(overflow.length,0);
  const pdf = await admin.pdf({printBackground:true,preferCSSPageSize:true});
  fs.writeFileSync('verification/focus-slides.pdf',pdf);
  // In-memory transport exercises real page handlers, without modifying production config or Firebase data.
  const state={slide:0,locked:true,pdf:true,focus:false};const sinks=[];
  const mockContext=await browser.newContext();
  await mockContext.exposeBinding('focusMockSet',async(_,values)=>{Object.assign(state,values);for(const page of sinks)await page.evaluate(s=>window.focusMockState(s),state)});
  await mockContext.route('**/firebase-config.js',route=>route.fulfill({contentType:'text/javascript',body:"window.FIREBASE_CONFIG={apiKey:'test',databaseURL:'https://test.invalid'};window.DECK_ID='test';"}));
  await mockContext.route('**/firebase-sync.js',route=>route.fulfill({contentType:'text/javascript',body:`export function createSync(){return{onState(cb){window.focusMockState=cb;cb(${JSON.stringify(state)})},onConnection(cb){cb(true)},onAdmin(cb){cb(new URLSearchParams(location.search).has('admin'),null)},onViewers(cb){cb(1)},joinViewers(){},setFocus(focus){return window.focusMockSet({focus})},setSlide(slide){return window.focusMockSet({slide})},setLock(locked){return window.focusMockSet({locked})},setPdf(pdf){return window.focusMockSet({pdf})}}}`}));
  const teacher=await mockContext.newPage(),audience=await mockContext.newPage();
  sinks.push(teacher,audience);
  await teacher.goto('http://127.0.0.1:8782/slides.html?admin');await audience.goto('http://127.0.0.1:8782/slides.html');
  await teacher.locator('#focusBtn').click();await assertVisible(audience,'#focusOverlay');
  await audience.keyboard.press('Escape');assert(await audience.locator('#focusOverlay').isVisible());
  await teacher.keyboard.press('Escape');await audience.locator('#focusOverlay').waitFor({state:'hidden'});
  await teacher.locator('#navNext').click();assert.equal(await audience.locator('#counter').textContent(),await teacher.locator('#counter').textContent());
  await teacher.locator('#pdfBtn').click();assert(await teacher.locator('html').evaluate(x=>x.classList.contains('no-pdf')));assert(await audience.locator('html').evaluate(x=>x.classList.contains('no-pdf')));
  await teacher.locator('#lockBtn').click();assert.equal(state.locked,false);
  assert.equal(errors.length,0);
  const result={localAdminToggle:true,studentButtonHidden:true,escapeAndSlidePreservation:true,mobile,overflow,mockedSynchronization:true,studentCannotDismiss:true,lockAndPdfPreserved:true,pageErrors:errors,realFirebase:'Not configured; live service not tested'};
  fs.writeFileSync('verification/focus-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
async function assertVisible(p,s){await p.locator(s).waitFor({state:'visible'});}
