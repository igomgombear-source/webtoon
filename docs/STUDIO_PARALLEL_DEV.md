# 마지막 접속 Studio — 병렬 개발 규칙 (Claude Code · Codex)

구조·JSON·API 는 `docs/STUDIO_ARCHITECTURE.md`. 작품 규칙의 정본은 `docs/EP01_PRODUCTION_RULES.md` 이고 그대로 적용된다(원화·대사·스토리·컷 순서 임의 변경 금지, `main`·`gh-pages` 금지, Codespaces 금지, 끝나지 않은 일을 완료로 보고하지 않기).

## 0. 현재 상태 (2026-11-24, 2단계 통합)

| 단계 | 내용 | 브랜치·커밋 | 상태 |
|---|---|---|---|
| 1단계 | 공통 코어 | `studio-core-20261123` `c192273` | 완료 |
| 2단계 A | 말풍선·대사 (Claude Code) | `studio-bubbles-20261124` `7b6f791` | 통합됨 |
| 2단계 B | 컷·패널·원화 (Codex) | `studio-cuts-art-20261124` `6eab439` | **원격에 없음 — 미통합** |
| 2단계 통합 | 코어 안정화 + 말풍선 모양·글꼴·색·대사 정렬 렌더러 | `studio-integration-phase2-20261124` | 이 문서 기준 |

**3단계 기준 브랜치는 `studio-integration-phase2-20261124` 다.** Codex 2단계 B 가 원격에 올라오면 통합 담당이 먼저 이 브랜치에 통합하고(코어 규약: 새·복제 컷 `cut.sid`/`cut.from`, `store.copyCut`, `S.geom`, `after:` 순서), 그 커밋을 3단계 기준으로 다시 알린다.

## 1. 일정과 담당

| 차수 | Claude Code | Codex |
|---|---|---|
| 1차(2단계) | 말풍선(`modules/bubbles.js`) + 대사(`modules/dialogue.js`) — 통합 완료 | 컷·패널·여백(`modules/cuts.js`) + 원화(`modules/art.js`) — 통합 대기 |
| 2차(3단계) | 휴대폰 UI(`modules/phone.js`) | 자막·효과·합성 레이어·인셋(`modules/fx.js`) |
| 통합 | 공통 파일(`core/*`, `index.html`, `studio.css`, `tests/run.js`, 독자 렌더러)과 병합 — 통합 담당(사용자가 지정한 세션) | |

**별도 지시 전에는 3단계 모듈 개발을 시작하지 않는다.**

### 3단계 담당별 의존성(확정)
- **휴대폰 UI(Claude Code, `phone.js`)**: 편집값 `edits.phone['c###.s#']`(분할 화면 `c060.s0_1`) = `{ quad:[[x,y]×4](0~1), clip:[[x,y]…](%), content:{…}, on:true|false }`. 렌더러는 `WEBTOON.screens[ep]` 데이터를 읽으므로 `compile(ctx)` 에서 `ctx.data.screens` 사본을 고친다(렌더러 변경 불필요한 범위부터). 원화 변형을 따라갈 때 `Studio.geom.quad/poly` 와 원화 모듈이 공개할 `Studio.modules.art.transformOf(panelId)` 를 쓴다(원화 모듈 통합 전에는 T = 항등). 17컷 메신저 문구는 컷 데이터 `cut.messenger`(대사 모듈 아님). `after: ['cuts', 'art']`.
- **자막·효과·합성·인셋(Codex, `fx.js`)**: 편집값 `edits.fx['c###.f#'|'c###.f~…'|'c###.z#']`. 인셋 원본 영역·칠판 글씨는 원화 비율 좌표 → `Studio.geom` 으로 원화 변형 연동. 자막·효과음 새 레이어는 렌더러가 없으므로 요청서 먼저(`docs/studio/requests/`). 인셋 화면 내용은 휴대폰 화면 설정을 같이 쓰므로 `phone` 편집값을 읽기만 한다(쓰기는 `phone` 공개 함수). `after: ['cuts', 'art', 'phone']`.
- 두 모듈 공통: 여러 요소를 한 동작에서 바꾸면 `Studio.store.batch(label, fn)`. 새·복제 컷은 컷 ID(`Studio.cutId(no)`)로 편집값 키를 만든다. 원화 비율 좌표를 쓰는 레이어는 원화 교체 시 지문이 바뀌어 충돌로 표시된다.

## 2. 브랜치

- 3단계 기준: `studio-integration-phase2-20261124`. 그 아래: `studio-bubbles-20261124`(`7b6f791`) → `studio-core-20261123`(`c192273`) → `ep01-bubble-editor-v2-20261123`(`885b149`) → `ep01-redesign-v3`(`e8be72a`).
- 모듈 브랜치: `studio-<모듈>-<날짜>` (예: `studio-phone-20261125`, `studio-fx-20261125`). 기준 브랜치에서 만들고 **반드시 원격에 푸시한 뒤 커밋 해시를 보고**한다(2단계 B 처럼 원격에 없으면 통합할 수 없다).
- 모듈 브랜치끼리 병합하지 않는다. 병합은 통합 담당만 기준 브랜치로 한다. `main`·`gh-pages`·`official-pages`·`ep01-redesign-v3` 에 직접 커밋·병합하지 않는다.

## 3. 파일 권한

| 파일 | Claude Code 3단계(휴대폰) | Codex 3단계(자막·효과) | Codex 2단계 B(통합 대기) | 통합 담당 |
|---|---|---|---|---|
| `tools/studio/modules/phone.js` | ✅ | ❌ | ❌ | 병합만 |
| `tools/studio/modules/fx.js` | ❌ | ✅ | ❌ | 병합만 |
| `tools/studio/modules/cuts.js`, `art.js` | ❌ | ❌ | ✅ | 병합만(숨김·복원 기본 구현은 1단계 통합 담당 작성) |
| `tools/studio/modules/bubbles.js`, `dialogue.js` | ❌(2단계 완료, 변경은 요청) | ❌ | ❌ | ✅ |
| `tools/studio/tests/<자기 모듈>.test.js` (새 파일, 자동 등록) | ✅ `phone*.test.js` | ✅ `fx*.test.js` | ✅ `cuts*`·`art*` | — |
| `docs/studio/<자기 모듈>.md` (새 파일) | ✅ `phone.md` | ✅ `fx.md` | ✅ | — |
| `docs/studio/requests/*.md` (공통 변경 요청, 새 파일) | ✅ | ✅ | ✅ | 처리 |
| `tools/studio/core/*`, `index.html`, `studio.css`, `tests/run.js` | ❌ | ❌ | ❌ | ✅ |
| `docs/STUDIO_ARCHITECTURE.md`, 이 문서 | ❌(요청) | ❌(요청) | ❌(요청) | ✅ |
| 독자 렌더러 `index.html`·`js/*.js`·`css/*.css` | ❌(요청) | ❌(요청) | ❌(요청) | ✅(엔진 HTML 해시 회귀 필수) |
| 본편 데이터 `data/*.js`, 원화 `assets/**` | ❌ | ❌ | ❌ | 사용자 승인 후만 |
| `tools/bubble-editor.html`(v2, 동결), `tools/qa/**`, `tools/package-review.js`, `.github/**` | ❌ | ❌ | ❌ | ✅ |

모듈은 자기 CSS 를 자기 파일 안에서 `Studio.util.addStyle('<모듈>', css)` 로 넣고, 클래스·ID 는 `<모듈 약어>-` 로 시작한다(말풍선 `bb-`, 컷 `ct-`, 대사 `dl-`, 원화 `ar-`, 휴대폰 `ph-`, 효과 `fx-`). 공통 CSS 클래스(`.card` `.chips` `.note` `.plan` `.row` `.lbl`)는 써도 된다.

## 4. 모듈 계약

- 등록: 파일 하나 = `Studio.registerModule({...})` 한 번(`docs/STUDIO_ARCHITECTURE.md` §7). `id` 는 메뉴·편집값 키와 같다(`bubbles` `dialogue` `cuts` `art` `phone` `fx`). 자리 파일의 `Studio.plannedModule` 을 `registerModule` 로 바꾸면 된다.
- 편집값은 **자기 모듈 키에만** 쓴다(`store.set('<자기 id>', …)`). 다른 모듈 편집이 필요하면 그 모듈이 공개한 함수(`Studio.modules.<id>.<함수>`)를 부른다. 공개 함수가 없으면 요청서를 쓴다.
- 요소 ID 는 `Studio.ids` 로만 만든다. 원본 요소는 원본 위치 ID, 새 요소는 `ids.fresh()`.
- 편집 연속 동작은 `live:true` + 끝에서 `checkpoint(라벨)`. 한 동작에서 여러 요소를 바꾸면 `Studio.store.batch(라벨, fn)`(변경 알림 1번·실행 취소 1단계). 라벨은 사람이 읽는 한국어(이력 패널에 보임).
- 오버레이는 `drawOverlay(ov)` 에서 `#ov` 안만 그린다. 좌표는 `Studio.stage.toOv()`/`point()` 로 바꾼다.
- 키보드는 `onKey(e)` 에서 처리하면 `true` 반환. Ctrl+Z/Y, `[`/`]`(컷 이동)는 공통이 쓴다.
- 원본 데이터(`Studio.base.data`)는 얼어 있다. 고치려면 `compile(ctx)` 의 `ctx.data` 사본만 고친다.

## 5. 렌더러 연동

- 1순위: **데이터만으로** 표현한다. 독자 렌더러가 이미 읽는 필드(예: `cut.spacing`, `cut.width`, `cut.ratio`, `cut.reader`, `cut.lines[i].text/who`, `screens` 의 `quad`·`clip`, 말풍선 `manual`)를 `compile`/`compileCut` 에서 사본에 넣는다.
- 렌더러가 읽지 않는 기능(예: 원화 변형·필터·자르기, 패널 숨김, 자막 레이어, 말풍선 색·글꼴, 대사 정렬)은 **렌더러 변경 요청**을 쓴다: `docs/studio/requests/<날짜>-<모듈>-<제목>.md` 에 ① 필요한 데이터 키·값 ② 없을 때 지금과 같아야 한다는 조건 ③ 기대 결과 화면. 모듈 쪽에서는 그 키를 컴파일에 넣어 두되(렌더러가 무시하면 화면 변화 없음) 완료로 보고하지 않는다.
- 통합 담당이 렌더러를 바꿀 때 조건: 키가 없으면 출력 HTML 이 바뀌기 전과 같아야 한다(회귀 검사 `regression` 과 말풍선 엔진 해시 비교, `tools/qa/v3.html?auto` FAIL/WARN 증가 없음).
- 회차 단위(`level:'episode'`) 편집은 회차 전체를 다시 그리므로 드래그 중에는 `live:true` 로 넣지 말고 놓을 때 한 번 넣는다(또는 미리보기를 오버레이로만 그리고 놓을 때 저장).

## 6. 모듈 간 의존성(주의)

| 관계 | 규칙 |
|---|---|
| 대사 ↔ 말풍선 | 말풍선 설정 `lines` 는 `cut.lines` 와 1:1. 대사 추가·삭제·순서 변경 시 말풍선 편집 키(`c###.l#`)는 **원본 위치 ID** 라 그대로 두고, 대사 모듈 `compile` 이 `ctx.data.episode` 와 `ctx.data.bubbles.cuts[no].lines` 를 같은 순서로 바꾼다. 새 대사는 `c###.l~xxxxx`. 두 모듈 담당이 같은 Claude Code 이므로 한 브랜치에서 같이 맞춘다. |
| 컷 구성 ↔ 원화 | 패널 ID(`c###.p#`)는 원본 위치. 패널 순서·제거는 컷 모듈, 원화 내용은 원화 모듈. 패널 제거 시 원화 편집은 보존(고아 표시). |
| 원화 ↔ 휴대폰·합성·인셋 | §6 좌표 규칙: 원화 비율 레이어는 원화 변형을 따른다. 변형 함수는 원화 모듈이 `Studio.modules.art.transformOf(panelId)` 로 공개하고 휴대폰·효과 모듈이 읽는다. |
| 원화 ↔ 말풍선 | 꼬리 끝점·보호 영역이 어긋날 수 있음 → 원화 모듈이 경고, 말풍선 모듈이 `Studio.modules.bubbles.transformTips(panelId, T)`·`transformZones(panelId, T)` 를 공개(2단계 완료). 원화 모듈은 `Studio.store.batch` 안에서 원화 편집과 함께 호출. |
| 컷 구성 ↔ 썸네일 | 순서 변경은 `Studio.timeline.setReorder(fn)` 으로만. 새 순서는 `cuts` 편집값, 렌더 순서는 컴파일 결과(`frame.order`)를 썸네일·컷 목록이 따른다. |
| 컷 복제·추가 | 독자 렌더러는 `cut.no` 로 DOM ID(`cut-NN`)·말풍선 설정을 찾는다. 새 컷은 원본과 겹치지 않는 번호(예: 1000 이상)를 컴파일에서 배정하고, 편집 ID 는 `c~xxxxx` 로 유지한다(렌더러 요청 필요 여부를 먼저 확인). |
| 휴대폰 ↔ 효과(인셋) | 인셋 내용은 휴대폰 화면 설정을 같이 쓴다(17컷 등). 인셋 배치는 `fx`, 화면 내용·모서리는 `phone`. |

## 7. 검증(각 모듈 완료 조건)

1. `node tools/studio/tests/run.js` 전체 통과(공통 회귀 포함). 모듈 검사는 `tools/studio/tests/<모듈>.test.js` 를 만들면 자동으로 실행된다(`run.js` 는 고치지 않는다). 형식: `module.exports = async function (browser, h) { … }`, `h` = `{ openStudio, ok, go, snap, edits, settle, BASE, STUDIO, OUT, sha }`. 하나만 돌리기: `node tools/studio/tests/run.js <모듈>`.
2. 편집 → 적용용 패치(또는 데이터 사본)를 실제 독자 화면에 넣은 결과와 Studio 화면이 같은지(말풍선 `bubbles` 검사의 방식).
3. 편집값이 없을 때 독자 화면 그대로(`regression`).
4. 320·360·390·430·768px + 데스크톱, 이미지 깨짐·404·콘솔 오류 0.
5. JSON 내보내기 → 저장소 비우기 → 불러오기 후 같은 화면, 실행 취소·다시 실행.
6. `tools/qa/v3.html?auto` FAIL/WARN 증가 없음(현재 FAIL 2 = 89컷 승인 대기 기록, WARN 0).
7. 보고: 브랜치·커밋 해시·바꾼 파일·검증 결과·남은 한계. 검증하지 않은 기능은 완료로 쓰지 않는다.

## 8. 통합 담당의 공통 파일 변경 절차

1. 요청서(`docs/studio/requests/*.md`) 또는 통합 필요를 확인한다.
2. 기준 브랜치에서 `studio-core-<날짜>` 작업 브랜치를 만든다.
3. 변경은 **추가형**으로: 새 API·새 이벤트·새 선택 키. 기존 API 이름·인자 의미를 바꾸지 않는다. 바꿔야 하면 `Studio.version` 을 올리고 이 문서와 구조 문서에 '변경' 항목을 쓴다.
4. 독자 렌더러를 바꾸면: 변경 전 `js/*.js` 를 보관해 말풍선 엔진 출력 해시 비교(320·360·390·430·768, 키 없을 때 동일), `regression`, `tools/qa/v3.html?auto`.
5. `tests/run.js` 전체 통과 → 기준 브랜치에 병합 → 모듈 담당에게 기준 커밋을 알린다(모듈 브랜치는 그 커밋으로 rebase).
6. 통합 JSON `version` 은 기존 파일을 읽을 수 없게 되는 변경에서만 올리고, 그때 `store.migrate` 에 변환을 더한다.
