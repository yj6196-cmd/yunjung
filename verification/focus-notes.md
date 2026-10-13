# 집중 안내 기능 기록

강사 주소: `slides.html?admin` · 집중 버튼 선택 → 핑키와 안내 문구 표시 · 다시 선택 또는 Esc → 해제.
음성은 강사 화면에서 1회 재생. 학생 화면은 시각 안내만 표시하여 여러 기기의 동시 음성 재생 방지.
Firebase 설정 전: 강사 화면에서만 로컬 동작. 학생 화면은 자유 열람.
Firebase 설정 후: 기존 강사 로그인과 admins 권한 확인 뒤 집중 상태 저장.

## Firebase 반영

1. Firebase 콘솔 → Realtime Database → 규칙에 `firebase/database.rules.json` 전체 반영.
2. 상태 경로: `decks/notebooklm-0930/state/focus` (boolean).
3. `true`: 집중 안내 표시 · `false`: 해제. 기존 데이터에 값이 없으면 false.
4. 웹 앱의 실제 구성값을 `firebase/firebase-config.js`에 입력.
5. 강사 계정을 Authentication에 등록하고 `admins/{UID}: true` 설정.
6. 강사·학생 주소를 각각 열어 실제 데이터베이스 동기화 확인.

## 이미지

원본: `assets/pinky-original.png` · 결과: `assets/pinky-shh.png` · 첫 결과 보관: `assets/pinky-shh-draft.png`.
내장 imagegen으로 편집. 사용 프롬프트: 동일한 핑키 얼굴·큰 갈색 눈·분홍 공룡 의상·크림 귀마개·봉제 질감 유지, 검지를 입 앞에 세운 쉿 자세, 전체 꼬리와 양발과 윗가시 표시, 복사 아이콘과 선 제거, 투명 배경 및 사방 여백.
음성: 첨부 M4A 원본 바이트와 일치하는 `assets/focus-message.m4a`.

## 검증

`focus-results.json`: 로컬 강사·학생, 모바일 320/390/430, 슬라이드 넘침, 모의 동기화, 학생 해제 차단, 잠금과 PDF 정책 검사.
실제 Firebase: 구성값 미입력으로 미검증.
기존 파일 사본: 상위 `focus-backup-20261013` 폴더.
