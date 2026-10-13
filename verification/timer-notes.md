# 관리자·휴식 타이머 연결

관리자 4번 카드의 5/10/15분 선택과 시작·일시정지·초기화가 15번 휴식 슬라이드에 반영.
강사 슬라이드에서도 타이머 선택으로 시작·정지, R로 초기화. 학생 화면은 시간 표시만 가능.

Firebase 상태: `decks/notebooklm-0930/state/timer`.
값: `minutes`(설정 분), `remaining`(정지 시 남은 초), `running`(진행 여부), `endAt`(서버 기준 종료 시각, 정지 시 0).
서버 시각 차이는 `.info/serverTimeOffset`으로 보정. 초마다 서버에 쓰지 않고 각 기기가 종료 시각에서 남은 시간 계산.

Firebase 구성 후 `firebase/database.rules.json`을 콘솔 규칙에 반영해야 타이머 쓰기 가능.
관리자 탭은 강사용 슬라이드에서 같은 브라우저로 로그인한 Firebase 강사 권한 사용. 목업 비밀번호와 Firebase 권한은 별도.
Firebase 미설정 시 같은 브라우저·같은 사이트의 localStorage로 탭 사이 동기화. 다른 기기는 실제 Firebase 연결 필요.

검증 결과: `timer-results.json`. 실제 Firebase 구성값이 없어 모의 전송으로 연결 검사.
