# PF-008 — 공용 렌더링 자산 재사용 현황
2026-11-29 / GPT 직접 / 원격 소스 정적 대조 및 설정 데이터 실행 확인
기준: pf-review-revisions-20261129 / 9227ed88c0c3f67ed19dc3ddd0dc05a870cb05d3
새 UI 제작, 디자인 결정, Studio 개발, 배포 없음. 실제 브라우저/시각 QA 미실시.

## 기존 구현 (재개발 금지)
| 기능 | 기존 구현 | 재사용 조건 |
|---|---|---|
| 말풍선 | js/bubbles.js, css/bubbles.css, data/ep01v3-bubbles.js | 말풍선 유형별 모양/측정/줄바꿈/보호 영역/꼬리 및 읽는 순서 유지 |
| 휴대폰/모니터 | js/screenui.js, css/screenui.css, css/phone-system.css, data/ep01v3-screens.js | 화면 네 모서리·clip·aspect 설정, 승인된 내용만 사용 |
| 확대 인셋 | screenUi.buildZoom, fitZoom 및 app.js renderInsetSelf | 새 원화의 좌표·크기·비율 재측정 필요 |
| 손가락 전경 | screenUi.buildFg, clip 및 fg 설정 | 원화별 가림 관계 재검수 |
| 시계 | screenUi.buildClock | 시곗바늘과 원화 시계 위치 맞춤 |
| 단독 휴대폰 화면 | app.js renderPhone | notification/lock/email/sms/call/calllog/zoom 기존 지원 |
| 문자/명판 | app.js renderArtLettering 및 nameplate 이미지 | 원화에 문자 직접 합성하지 않는 방식 유지 |
| 컷 합성 | app.js renderPanelsV3, renderCut, css/style.css | 다중 패널·인셋·overflow·여백·말풍선 레이어 분리 |
| QA | tools/qa/v3.js, ep01v3.spec.json, device-probe.js | 기존 검사 활용, 새 원화·회차 시 실제 기기 검수 |

## 현재 데이터 확인
- data/ep01v3-screens.js를 실행하여 읽은 EP01 화면 설정: 키 22개 / 인스턴스 23개 / 확대 설정 10개 / fg 3개.
- view 유형: messenger 2, banner 1, playlist 2, playing 1, contacts 2, off 2, lock 1, sms 4, compose 3, incoming 3, desktop 1, view 미지정 1.
- 컷 데이터: panel 102, black 1, phone 1. artLettering 8·10컷, inset 설정 4개, overflow 3개.
- 기능 존재와 모든 디자인·새 회차 적용 가능성은 별개. 현재 실행형 검수는 미실시.

## 후속 배정 경계
- GPT 직접: 기존 자산/설정/명세 재사용 여부 확인, 변경 범위와 작업 의존성 기록, 단순 데이터 및 정적 검증.
- Work: 실제 원화·디자인 승인 시안, 좌표 실측·외형·화면 배치 및 실제 브라우저 시각 QA.
- Claude Code/Codex: 복잡한 개발·Studio 통합·실제 회귀 검수. 사용자 보류 유지.
- Claude: 서사·콘티 심층 검수. 동결 콘티 반복 검수 금지.
- 새 회차에 필요한 미확인 UI 및 문자 자산은 승인 콘티의 실제 요구 확인 후만 생성. Kakao 등 별도 화면 지원은 해당 구현과 명세 확인 전 완성으로 간주하지 않음. Studio 편집 기능은 기존 뷰어 렌더링 기능과 구분.
- PF-009: 보류 작업·재개 조건과 담당 도구별 작업 묶음 정리. 실행 가능한 독립 작업 소진 시 추가 작업을 억지로 만들지 말고 대기 사유 기록.

근거: js/app.js, js/bubbles.js, js/screenui.js, data/ep01v3.js, data/ep01v3-screens.js, docs/EP01_PHONE_UI_SYSTEM.md 및 원격 트리.
