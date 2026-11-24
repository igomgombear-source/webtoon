# 말풍선 모듈 (`tools/studio/modules/bubbles.js`) — Claude Code · 2단계 A

공통 규격: `docs/STUDIO_ARCHITECTURE.md` · 대사 연동: `docs/studio/dialogue.md`

## 1. 편집값 `edits.bubbles[대사 ID]` = `manual`
말풍선 편집기 v2 와 같은 값이다(JSON v1·v2 불러오기·자동 저장 호환은 공통 저장소가 처리).
`{ x, y (중심, 조각 대비 %), w (%), h (% | 'auto'), pad, radius (px, 60=타원), fs (px), lh, tail: { on:false } | { tip:{x,y}(%), start:°|'auto', thick:px, curve:-0.5~0.5 } }` — 손댄 키만 저장. 엔진 `js/bubbles.js` 가 배치 후 적용한다(변경 없음).
키는 **대사 ID**: 원본 `c024.l0`, 새 대사 `c024.l~k3f9a`, 분할 조각 `c024.l0.b1`. 대사를 재배열·추가·삭제·분할해도 설정이 같은 대사에 남는다.

## 2. 이번 단계에서 한 것
| 기능 | 상태 |
|---|---|
| 위치·크기·꼬리 편집(드래그·핸들·슬라이더·키보드), 모서리·여백·글자 크기·줄간격 | 유지(v2 그대로, 기존 `bubbles` 검사 통과) |
| 컷 내부·경계 위·경계 아래·컷 사이 배치 버튼 | 검증(중심 y 18~82 / 0 / 100 / 108%, 화면에서 확인) |
| 말풍선 추가·삭제 | 구현(새 대사 `addLine`/`deleteLine`, 대사 모듈 API) |
| 말풍선 분할·합치기 | 구현(`split`/`mergeNext`, 패널 버튼은 문장·공백 기준 가운데, 정확한 위치는 대사 메뉴) |
| 분할 말풍선 각각의 독립 정밀 편집 | 구현(조각이 별도 줄·별도 ID, 엔진 자동 분할 12개는 '자동 분할 확정' 후) |
| `transformTips(panelId, T, opt)` | 구현(§3) |
| 모양 종류·글꼴·글자 색·배경색·테두리 색 | 구현(2단계 통합: 렌더러 지원 `manual.style` + UI, 대비 경고) |
| 보호 영역 원화 변형 연동 `transformZones(panelId, T)` | 구현(컷 키 `c###` 의 `zones`) |

## 3. `Studio.modules.bubbles.transformTips(panelId, T, opt)`
원화 모듈(Codex)이 원화를 이동·확대·회전·반전할 때 그 패널의 꼬리 끝점을 같이 옮긴다.
- `panelId`: `c033.p1`. `T = { scale=1, x=0, y=0 (이동, 패널 %), rotate=0 (시계 방향 °), flipX, flipY, origin:{x:50,y:50} }` — `docs/STUDIO_ARCHITECTURE.md` §6 의 `art.transform` 과 같은 의미. 순서: 뒤집기 → 확대 → 회전 → 이동. 회전은 패널의 실제 가로·세로 비로 계산한다.
- 대상: 지금 **그려진 꼬리 끝점**(원화 속 인물에 붙은 점). 보이는 컷이면 편집 화면, 아니면 썸네일 렌더러(편집 직후 1초쯤 늦을 수 있음). 렌더 결과를 못 쓰면 말풍선 설정의 꼬리 목표점. `opt.source:'config'` 또는 `opt.size:{w,h}` 로 설정 기준 강제.
- 반환: `{ panelId, source:'rendered'|'config', moved:[{id,from,to,outside}], skipped:[{id,reason}] }`. `outside` 는 변환 뒤 끝점이 패널 밖(0~100% 바깥)이라는 표시(경고용).
- `opt.apply:true` → 각 말풍선 `tail.tip` 편집값으로 쓰고 실행 취소 한 단계(`opt.label` 로 이름). 말풍선 위치·크기(패널 % 레이어)는 건드리지 않는다.
- 호출 규칙: 원화 편집을 저장한 뒤 `apply:false` 로 미리 보고(경고 표시), 사용자가 고르면 `apply:true`. 원화 편집과 꼬리 이동을 한 단계로 묶으려면 원화 모듈이 `store.set(..., {live:true})` 후 `transformTips(..., {apply:true})` 를 부르고 마지막에 한 번 `checkpoint`(이 함수는 자기 `checkpoint` 도 만든다 — 묶고 싶으면 `opt.label` 로 구분하고 원화 쪽 `checkpoint` 를 이 호출 앞에 둘 것).

## 4. 화면(말풍선 메뉴)
말풍선 선택 목록(⧉ = 엔진 자동 분할, ✎ = 편집됨) + 추가·삭제·분할·합치기·자동 분할 확정 · 위치·배치 · 크기·모양 · 꼬리 · 렌더러 대기 안내 · 초기화(말풍선만) · 전·후 수치 · 적용용 패치.

## 5. 패치 텍스트
`data/<회차>-bubbles.js` 의 `cuts` 항목 형식으로 컷별 완전한 `lines` 를 낸다(대사 구조를 바꾼 컷은 새 줄 순서·개수). **대사 패치(대사 메뉴)와 함께 적용**해야 한다. 본편 적용은 사용자 승인 후.

## 6. 검증
`node tools/studio/tests/run.js bubbles bubbles-v3 dialogue` — v2 조작·JSON(기존 `bubbles`), 배치 버튼, 패널 UI 추가·분할·합치기·삭제, 자동 분할 확정 12개 화면 동일, 조각 독립 편집·JSON 복원, `transformTips`(항등·이동·확대·반전·회전·적용·실행 취소·다른 컷에서 읽기·여러 조각), 구조 편집이 다른 컷 HTML 을 바꾸지 않음(97개 컷 동일), 초기화, 예외(모두 삭제·빈 입력·충돌), 320~1440px 가로 넘침.

## 7. 한계
- 글꼴 파일은 본편 대사 글자만 담은 부분 글꼴이라 새로 입력한 글자는 대체 글꼴로 보일 수 있다.
- 새·복제 컷의 말풍선 패치(본편 적용용)는 컷 구성 모듈 통합 후 함께 낸다(지금은 원본 컷만).
- 분할 조각 사이를 잇는 막대(`join`)는 엔진 규칙을 따른다(원래 대사의 `join` 설정을 이어받음).
- 합쳐진(absorb) 대사의 말풍선 설정은 앞 대사 것.
