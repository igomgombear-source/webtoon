# CLAUDE.md — 《마지막 접속》 웹툰 (Claude Code 진입점)

모든 규칙의 단일 정본은 **`docs/EP01_PRODUCTION_RULES.md`**다. 작업 전에 먼저 읽는다. 충돌하면 사용자의 최신 지시 → 정본 → 기존 문서 순서.
- 기준 브랜치 `ep01-redesign-v3`, 작업은 독립 브랜치. 104컷판(`#ep01v3`)이 유일한 정식 EP01(70컷 구판은 2026-11-22 제거). `main`·`gh-pages` 변경·배포·타 브랜치 병합 금지 (정본 §4-1).
- 규칙 반영(병합) 이력은 `docs/EP01_RULES_REGISTRATION.md` "적용 기록". 끝난 병합은 반복하지 않는다.
- 검수: `python3 -m http.server 8765` → `tools/qa/v3.html?auto`(104컷 FAIL 0). 시각 검수는 Playwright Chromium 320·360·390·430·768px (정본 §4-2).
- 끝나지 않은 일은 완성이라고 보고하지 않는다. 바꾼 컷·남은 한계·브랜치·커밋 해시를 보고한다.
