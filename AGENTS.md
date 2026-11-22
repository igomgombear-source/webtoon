# AGENTS.md — 《마지막 접속》 웹툰 (Codex 및 호환 코딩 에이전트 진입점)

모든 규칙의 단일 정본은 **`docs/EP01_PRODUCTION_RULES.md`**다. 작업 전에 먼저 읽는다. 충돌하면 사용자의 최신 지시 → 정본 → 기존 문서 순서. 브랜치·병합·배포 금지는 정본 §4-1.
- 정적 뷰어(HTML·CSS·JS, 빌드 없음). 실행: 저장소 루트에서 `python3 -m http.server 8765` → `http://localhost:8765/#ep01v3`.
- 코드 경로: 104컷 `data/ep01v3.js` · 말풍선 `data/ep01v3-bubbles.js`+`js/bubbles.js` · 휴대폰 화면 `data/ep01v3-screens.js`+`js/screenui.js`.
- 자동 QA: `tools/qa/v3.html?auto`(104컷 FAIL 0). 시각 검수는 정본 §4-2.
- 끝나지 않은 일은 완성이라고 보고하지 않는다. 바꾼 컷·남은 한계·브랜치·커밋 해시를 보고한다.
