const {chromium}=require('C:/Users/yj619/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert');
(async()=>{
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const local=await b.newContext();
const errors=[];local.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
async function open(c,file){const p=await c.newPage();await p.goto('http://127.0.0.1:8783/'+file);return p}
async function login(p){await p.locator('#pw').fill('1234');await p.locator('#gateForm .btn').click()}
async function text(p){return p.locator('#stage .break-big .time').textContent()}
async function wait(p,s){await p.waitForFunction(s=>document.querySelector('#stage .break-big .time').textContent===s,s)}
const admin=await open(local,'admin.html');await login(admin);
const teacher=await open(local,'slides.html?admin'),student=await open(local,'slides.html');
await admin.locator('[data-min="10"]').click();await wait(teacher,'10:00');await wait(student,'10:00');
await admin.locator('#tStart').click();await teacher.waitForFunction(()=>document.querySelector('#stage .break-big').classList.contains('running'));
await admin.locator('#tPause').click();await teacher.waitForFunction(()=>!document.querySelector('#stage .break-big').classList.contains('running'));
await admin.locator('#tReset').click();await wait(student,'10:00');await student.reload();await wait(student,'10:00');
const c=await b.newContext();c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
let state={slide:14,locked:true,pdf:true,focus:false};const pages=[];
await c.exposeBinding('timerMockSet',async(_,values)=>{Object.assign(state,values);for(const p of pages)await p.evaluate(s=>window.mockTimerState(s),state)});
await c.route('**/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.FIREBASE_CONFIG={apiKey:'test',databaseURL:'https://test.invalid'};window.DECK_ID='test'"}));
await c.route('**/firebase-sync.js',r=>r.fulfill({contentType:'text/javascript',body:`export function createSync(){return{now(){return Date.now()},onState(cb){window.mockTimerState=cb;cb(${JSON.stringify(state)})},onAdmin(cb){cb(location.pathname.endsWith('admin.html')||location.search.includes('admin'))},onConnection(cb){cb(true)},onViewers(cb){cb(1)},joinViewers(){},setTimer(timer){return window.timerMockSet({timer})},setSlide(slide){return window.timerMockSet({slide})},setFocus(focus){return window.timerMockSet({focus})},setLock(locked){return window.timerMockSet({locked})},setPdf(pdf){return window.timerMockSet({pdf})}}}`}));
const a=await open(c,'admin.html');await login(a);const t=await open(c,'slides.html?admin'),s=await open(c,'slides.html');pages.push(a,t,s);
await a.locator('[data-min="10"]').click();await wait(t,'10:00');await wait(s,'10:00');
await a.locator('#tStart').click();assert(state.timer.running&&state.timer.endAt>Date.now());
await a.locator('#tPause').click();assert(!state.timer.running);assert.equal(await text(t),await text(s));
await a.locator('#tReset').click();await wait(s,'10:00');
await s.locator('#stage .break-big').click();assert(!state.timer.running);
await t.locator('#stage .break-big').click();assert(state.timer.running);
await a.locator('#tPause').click();await a.locator('#tReset').click();
await t.setViewportSize({width:1280,height:720});
const overflow=await t.evaluate(()=>{const all=[...document.querySelectorAll('#stage > section.slide')];const cur=all.findIndex(x=>x.classList.contains('active'));const bad=all.map((x,i)=>{all.forEach(s=>s.classList.toggle('active',s===x));const v=x.querySelector('.slide-content');return{n:i+1,oh:v.scrollHeight-v.clientHeight,ow:v.scrollWidth-v.clientWidth}}).filter(x=>x.oh>4||x.ow>4);all.forEach((x,i)=>x.classList.toggle('active',i===cur));return bad});assert.equal(overflow.length,0);
const pdf=await t.pdf({preferCSSPageSize:true});assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,22);
assert.equal(errors.length,0);
const result={localTabs:true,tenMinuteSelection:true,startPauseReset:true,reload:true,mockedFirebase:true,studentCannotControl:true,teacherControl:true,overflow,pdfPages:22,errors,liveFirebase:'Configuration placeholders; not tested'};fs.writeFileSync('verification/timer-results.json',JSON.stringify(result,null,2));console.log(result);await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
