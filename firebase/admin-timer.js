// 관리자 타이머 연결: 같은 브라우저는 기존 localStorage, 다른 기기는 Firebase 상태 사용.
const cfg=window.FIREBASE_CONFIG;
const configured=cfg && cfg.apiKey && !cfg.apiKey.includes('[') && cfg.databaseURL && !cfg.databaseURL.includes('[');
if (configured) {
  window.NOTEBOOKLM_TIMER_REMOTE=true;
  const controls=[...document.querySelectorAll('.preset,#tStart,#tPause,#tReset')];
  const hint=document.createElement('p');hint.className='note';hint.textContent='타이머 연결 · 강사 로그인 필요';
  document.getElementById('practiceCard').append(hint);
  controls.forEach(b=>b.disabled=true);
  try {
    const {createSync}=await import('./firebase-sync.js');
    const sync=createSync(cfg,window.DECK_ID || 'notebooklm-0930');
    let admin=false,lastSaved='';
    const now=()=>sync.now();
    // 기존 관리자 타이머의 계산을 Firebase 서버 시각에 맞춤.
    window.NOTEBOOKLM_ADMIN_NOW=now;
    sync.onState(state=>{if(state && state.timer){lastSaved=JSON.stringify(state.timer);window.NOTEBOOKLM_ADMIN_TIMER.apply(state.timer)}});
    sync.onAdmin(allowed=>{admin=allowed;controls.forEach(b=>b.disabled=!allowed);hint.textContent=allowed?'타이머 연결 · 강사·학생 동기화':'타이머 연결 · 강사 로그인 필요'});
    window.addEventListener('notebooklm-admin-timer',event=>{
      const t=event.detail,value={minutes:t.minutes,remaining:t.remaining,running:t.running,endAt:t.endAt || 0};
      const key=JSON.stringify(value);if(!admin || key===lastSaved)return;
      sync.setTimer(value).then(()=>{lastSaved=key}).catch(()=>{hint.textContent='타이머 저장 실패 · Firebase 규칙과 권한 확인'});
    });
  } catch (_) { hint.textContent='타이머 연결 실패 · Firebase 설정 확인'; }
}
