# 마지막 접속 Studio — 구조·통합 JSON·공통 API (2단계 통합 반영, `Studio.version` 1.1.0-phase2)

> 2단계 통합(`studio-integration-phase2-20261124`): 공통 코어 안정화(경쟁 상태·일괄 편집·새·복제 컷 ID·컴파일 순서·공통 좌표 변환), 말풍선 모양·글꼴·색·대사 정렬 렌더러 지원.
> **컷·패널·원화(Codex `studio-cuts-art-20261124`)는 원격에 없어 아직 통합하지 않았다** — 해당 규격은 '예약'이다(§4·§6·§10).

EP01~EP06 공용 웹툰 통합 편집 프로그램. 말풍선 편집기 v2(`tools/bubble-editor.html`, `885b149`)를 확장했다. v2 파일은 그대로 둔다(동결, 비교·대조용).
병렬 개발 규칙(파일 권한·절차)은 `docs/STUDIO_PARALLEL_DEV.md`.

- 주소: `/tools/studio/index.html#ep01v3` (컷 지정 `#ep01v3/62`). 로컬: 저장소 루트에서 `python3 -m http.server 8765`.
- 검증: `NODE_PATH=$(npm root -g) node tools/studio/tests/run.js` (core · bubbles · timeline · layout · regression).
- 이번 단계는 공식 배포 없음. 편집값은 본편 데이터에 적용하지 않는다(적용은 사용자 승인 후 별도 작업).

## 1. 파일 구조

| 경로 | 내용 | 담당 |
|---|---|---|
| `tools/studio/index.html` | 화면 골격, 스크립트 순서, 렌더러 경로(meta `studio-root`·`studio-viewer`) | 통합 |
| `tools/studio/studio.css` | 골격 스타일(모듈 CSS 는 모듈 파일 안에서 `Studio.util.addStyle`) | 통합 |
| `tools/studio/core/util.js` | 공통 도구·이벤트 버스 | 통합 |
| `tools/studio/core/ids.js` | 안정 식별자 | 통합 |
| `tools/studio/core/store.js` | 통합 저장소(편집값·실행 취소·자동 저장·마이그레이션·충돌·JSON) | 통합 |
| `tools/studio/core/base.js` | 원본 데이터 보관·지문·기준 정보·연결 관계 | 통합 |
| `tools/studio/core/renderer.js` | 실제 독자 화면 iframe 연동·컴파일 파이프라인·모듈 등록 | 통합 |
| `tools/studio/core/stage.js` | 중앙 편집 화면(한 컷 표시·오버레이 좌표·원래/나란히) | 통합 |
| `tools/studio/core/timeline.js` | 하단 컷 썸네일 바 | 통합 |
| `tools/studio/core/shell.js` | 상단·왼쪽·오른쪽 UI, 이력·QA 패널, 키보드, 내보내기/불러오기 | 통합 |
| `tools/studio/modules/bubbles.js` | 말풍선(구현: v2 기능 이식) | Claude Code |
| `tools/studio/modules/dialogue.js` | 대사(자리) | Claude Code |
| `tools/studio/modules/cuts.js` | 컷 구성·패널·여백(숨김·복원만 구현) | Codex |
| `tools/studio/modules/art.js` | 원화(자리) | Codex |
| `tools/studio/modules/phone.js` | 휴대폰 UI(자리, 2차) | Claude Code |
| `tools/studio/modules/fx.js` | 자막·효과·합성·인셋(자리, 2차) | Codex |
| `tools/studio/tests/run.js` | Playwright 검증(같은 폴더 `*.test.js` 자동 등록) | 통합(모듈 검사는 `tests/<모듈>.test.js`) |

## 2. 렌더링 — 실제 독자 화면 + 비파괴 편집

편집기 전용 근사 렌더링은 없다. 독자 화면(`index.html` → `js/app.js`·`js/bubbles.js`·`js/screenui.js`·`css/style.css`)을 iframe 으로 띄운다.

1. **원본 보관**: 첫 iframe 이 그려진 직후 `WEBTOON.episodeData[id]`·`WEBTOON.screens[id]`·말풍선 설정(`EP01V3_BUBBLES` 또는 `EP_BUBBLES[id]`)을 깊은 복사로 얼린다(`S.base`). 원본 파일·원본 객체는 바꾸지 않는다.
2. **회차 컴파일**(level `episode`): 원본 사본 → 각 모듈 `compile(ctx)` 가 `ctx.data.{episode,screens,bubbles}` 를 고침 → iframe 전역에 넣고 `hashchange` 로 독자 화면 라우터가 다시 그린다(1~2초).
3. **컷 컴파일**(level `cut`): 그 컷의 말풍선 설정을 회차 컴파일 결과로 되돌린 뒤 `compileCut(ctx)` → `BubblesV4.rerunCut(no)` 로 그 컷만 다시 배치(수 ms, 드래그 중 실시간).
4. **동기화**: 편집이 바뀌면 `Frame.sync()` 가 회차 단위 편집 서명이 바뀌었을 때만 2를, 아니면 바뀐 컷만 3을 한다.
5. **숨김 컷**: Studio 는 `reader:false` 컷도 그린다(편집·검토용). 숨김 여부는 Studio 가 표시한다(`frame.hidden`).

컴파일 순서: 회차 단계 모듈은 `order` 값 순서에 `after:[모듈ID]` 의존을 반영해 위상 정렬한다(대사는 `after:['cuts']` — 컷 구성(복제)이 먼저). 순환·없는 의존·컷 번호 중복·잘못된 새 컷 ID 는 `Studio.renderer.compileOrder(frame).issues` 와 QA 패널에 보인다.
경쟁 상태(2단계 수정): 편집 서명은 컴파일 **시작 시점**에 계산해 기록한다. 그리는 도중 들어온 편집은 서명이 달라 다음 동기화에서 다시 그린다(대사 모듈의 임시 보정은 지웠다).

검증된 보장(회귀 검사 `regression`): 편집값이 없으면 Studio 렌더의 99개 독자 컷 HTML 이 독자 화면과 **바이트 단위로 같다**(320·390·768px). 숨김 5컷을 함께 그려도 다른 컷은 달라지지 않는다.

렌더러 iframe 은 셋: `main`(편집, 한 컷만 표시), `compare`(나란히 비교, 편집 없음, 필요할 때 생성), `thumbs`(썸네일용, 폭 390, 화면 밖, 모든 컷 표시).

## 3. 안정 식별자 (`core/ids.js`)

원본 데이터 안의 위치로 만든다. 컷 순서가 바뀌거나 패널을 빼도 ID 는 그대로다. 새 순서·새 요소는 편집값으로 따로 저장한다.

| ID | 뜻 |
|---|---|
| `c017` | 컷(원본 컷 번호 `cut.no`, 3자리) |
| `c017.p0` | 패널(조각) — `rows` 를 펼친 원본 순서, 단독 컷은 `p0` |
| `c017.l0` | 대사 — `cut.lines` 원본 순서 |
| `c017.l0.b1` | 분할 말풍선의 두 번째 조각 |
| `c017.s0`, `c060.s0_1` | 휴대폰 화면 — 화면 데이터 키(`'17'`, `'94:1'`)의 조각 번호, 한 원화에 화면이 둘이면 `_1` |
| `c017.z0` | 확대 인셋 |
| `c017.f0` | 자막·효과음·합성 글씨(원본에 있는 것) |
| `c017.l~k3f9a`, `c~x8q2m` | 새로 만든 요소(종류 글자 + `~` + 무작위 5자) |

`S.ids.parse(id)` → `{ cutId, cut, parts:[{kind,index,sub,fresh}], kind, index, fresh }`.

## 4. 통합 JSON 규격 (version 3)

내보내기 한 번 = 파일 하나에 모든 회차·모든 모듈 편집.

```json
{
  "format": "lastaccess-studio",
  "version": 3,
  "app": "마지막 접속 Studio 1.0.0-phase1",
  "exported": "2026-11-23T10:00:00.000Z",
  "base": {
    "commit": "885b149…", "branch": "studio-core-20261123", "commitSource": "git",
    "episodes": { "ep01v3": { "cuts": 104, "readerCuts": 99, "data": "h…", "bubbles": "h…", "screens": "h…",
                              "art": { "c017": "ep01v3-017-messenger-approved-DRAFT.webp", "c033.p0": "…" } } }
  },
  "episodes": {
    "ep01v3": {
      "edits": {
        "bubbles": { "c024.l0": { "x": 40, "y": 30, "w": 60, "tail": { "tip": { "x": 30, "y": 80 }, "curve": -0.3 } } },
        "cuts":    { "c016": { "hidden": false } }
      },
      "anchors": { "c024.l0": "h…", "c016": "h…" }
    }
  },
  "log": [ { "t": "…", "label": "말풍선 이동 #24", "module": "bubbles", "ids": ["c024.l0"], "ep": "ep01v3" } ]
}
```

- `edits[모듈ID][요소ID]` = 그 모듈이 정한 값. 값이 없으면 원본 그대로.
- `anchors[요소ID]` = 편집을 처음 만들 때 원본 요소의 지문(`S.base.fingerprint`). 대사 지문은 화자·대사·위치, 패널은 원화·비율, 컷은 종류·원화·비율, 화면은 화면 설정 전체.
- `base` = 기준 커밋(로컬은 `.git`, 배포본은 `studio-base.json`, 없으면 null)·데이터 지문·원화 파일 이름.

### 모듈별 편집값

| 모듈 | 키 | 값 | 상태 |
|---|---|---|---|
| `bubbles` | `c###.l#` | `manual` = `{ x, y, w, h:'auto'|%, pad, radius, fs, lh, tail:{on:false} | {tip:{x,y}, start:°|'auto', thick, curve} }` (위치·크기 %, 글자·여백 px). 엔진 `js/bubbles.js` 가 읽는다 | 구현 |
| `bubbles` | `c###.l#.b#`, `c###.l~…` | 분할 조각·새 대사의 manual(키 = 대사 ID) | 구현 |
| `bubbles` | `manual.style` | `{ kind:'ellipse'|'jag'|'round'|'jagrect'|'rect', font:'sans'|'bold'|'serif', color, bg, stroke('#rrggbb') }` — `js/bubbles.js` 가 그린다(없으면 유형 기본, 출력 동일) | 구현 |
| `bubbles` | `c###` (컷 키) | `{ zones:[{panel,x,y,w,h,label,approved}] }` — 보호 영역(원화 변형 연동 `transformZones`) | 구현 |
| `cuts` | `c###` | `{ hidden: true|false }` | 구현 |
| `cuts` | `c###` | `{ spacing:{before,after}, width, ratio, panels:{ order:[패널ID], removed:[패널ID] } }` | 예약 |
| `cuts` | `c000`(회차 단위) 또는 별도 키 | `{ order:[컷ID…], added:[{id, from:컷ID}] }` — Codex 브랜치 통합 때 확정 | 예약(Codex) |
| 새·복제 컷(코어 규약) | 컴파일된 컷 | `cut.sid = 'c~xxxxx'`, `cut.no` = 원본과 겹치지 않는 번호(예: 1000+), `cut.from = 원본 컷 ID`(복제), 새 컷은 `cut.baseLines`(선택). 코어가 대사 줄에 `sid = 컷ID.l순번` 을 붙인다. 편집값은 `c~xxxxx…` ID, 승계는 `Studio.store.copyCut(원본, 새)` | 코어 구현 |
| `dialogue` | `c###.l#` · `c###.l~…` · `c###` | `docs/studio/dialogue.md` §2 (글자·줄바꿈 `\n`·화자·정렬 `align`·삭제·합치기 `absorb`·분할 `split[]`·새 대사 `added`·컷 `order`). 정렬은 `cut.lines[i].align` 로 엔진이 읽는다 | 구현 |
| `art` | `c###.p#` | `{ src, transform:{scale, x, y, rotate, flipX}, crop:{x,y,w,h}, filter:{brightness, contrast, saturate, blur} }` | 예약 |
| `phone` | `c###.s#` | `{ quad:[[x,y]×4], content:{…}, on:true|false }` | 예약 |
| `fx` | `c###.f#` / `c###.f~…` / `c###.z#` | 자막·효과음 `{ text, x, y, fs, color }`, 효과 `{ mood, transition, gradient }`, 인셋 `{ x, y, w, src:{x,y,w,h} }` | 예약 |

'예약' 행은 형식 제안이다. 담당 모듈이 확정하면 이 표를 고치는 변경을 통합 담당에게 요청한다.

### 마이그레이션·호환

- 말풍선 편집기 v1 JSON(`{tool:'bubble-editor', version:1, edits:{ep:{'컷:순번': geometry}}}`) → v2 → v3 `bubbles`.
- v2 JSON(`version:2, edits:{ep:{컷:{순번: manual}}}`) → `bubbles['c###.l#']`.
- 자동 저장: Studio `localStorage['lastaccess-studio-v1']`. 처음 실행할 때 비어 있으면 `ep-bubble-editor-v2`(없으면 `-v1`)를 **복사**해 온다. 예전 키는 지우지 않는다.
- 더 새 version 파일은 거부한다. 형식이 다르면 거부한다.

### 충돌 검출

불러오기·시작할 때 `S.store.conflicts(ep)`:
- `missing`: 원본에 그 요소가 없다(대사 수가 줄었거나 컷이 없어짐).
- `changed`: 지문이 다르다(대사 문구·원화·화면 설정이 바뀐 버전에서 만든 편집).
- 파일의 `base.episodes[ep].data|bubbles|screens` 지문이 현재와 다르면 `baseDiff` 로 알린다.
충돌한 편집도 지우지 않고 불러온다. QA 패널과 썸네일(빨간 점)에 표시한다. 판단은 사용자.

## 5. 저장·이력

- 모든 모듈이 `S.store` 하나를 쓴다. 직접 localStorage 에 쓰지 않는다.
- 연속 변경(드래그·슬라이더): `set(..., {live:true})` 를 여러 번 → 끝에서 `checkpoint(라벨)` 한 번 = 실행 취소 한 단계.
- 실행 취소 이력(세션, 최대 200)과 작업 기록(자동 저장에 포함, 최대 400)을 '편집 이력' 패널에서 본다. 이력 항목을 누르면 그 시점으로 간다.
- 초기화: 요소(`{id}`, 하위 ID 포함)·컷(`{cut}`)·회차(`{}`), 모듈 한정(`{module}`). 오른쪽 아래 공통 버튼은 모든 모듈, 각 모듈 패널 안 버튼은 그 모듈만.
- 저장 상태(상단): 저장 중 / 저장됨 시각 / 저장 실패. 창을 닫거나 새로고침할 때 남은 저장을 바로 쓴다.

## 6. 좌표계와 레이어 연동 규칙

| 좌표계 | 기준 | 쓰는 것 |
|---|---|---|
| **패널 %** | 화면에 보이는 패널 틀(조각) 왼위 0 ~ 오른아래 100 | 말풍선 `manual`·`pref`·`tail`, 보호 영역 `zones`, 자막·효과음, 인셋 배치 |
| **원화 비율** | 원화 이미지 원본 픽셀 대비 0~1 (또는 %) | 휴대폰 화면 `quad`·`clip`, 원화 속 글씨(칠판 등), 인셋이 확대할 원화 영역 |
| **섹션 px** | 컷 섹션 왼위(px, 확대 전) | Studio 오버레이·`BubblesV4.info()` |

원화 변형 T(교체·확대·이동·자르기·회전·반전)를 넣을 때:
1. **원화 비율 레이어는 T 를 따라간다**(휴대폰 화면 네 모서리, 원화 속 글씨, 인셋의 원본 영역). 반전 시 점 좌표는 뒤집되 글자 자체는 뒤집지 않는다.
2. **패널 % 레이어는 기본적으로 고정**(말풍선·자막·인셋 배치). 단, 원화 내용에 붙은 값 — 보호 영역 `zones`, 말풍선 꼬리 끝점(말하는 사람) — 은 T 에 따라 어긋날 수 있으므로 원화 모듈이 **경고**하고, 사용자가 고르면 T 를 적용한다(꼬리 끝점은 말풍선 모듈 API 로, zones 는 컴파일 단계에서 `ctx.data.bubbles` 사본에).
3. 원화 교체(`src`)는 원화 비율 레이어 좌표를 바꾸지 않는다. 새 원화의 화면 위치가 다르면 휴대폰 모듈로 다시 맞춘다(지문이 달라져 충돌로 표시된다).
4. 자르기 후 패널 비율은 컷 구성 모듈의 `ratio` 가 정한다(원화 모듈은 비율을 바꾸지 않는다).

공통 변환 API(2단계): `Studio.geom.point/rect/quad/poly/invert` — T 와 패널 크기(size, px 또는 비)를 받아 같은 규칙으로 변환한다. 휴대폰(quad 0~1·clip %)·합성 글씨·인셋 원본 영역은 원화 비율 좌표이므로 그대로 쓰면 된다.
연동 함수: 말풍선 꼬리 `Studio.modules.bubbles.transformTips(panelId, T, {apply})`, 보호 영역 `transformZones(panelId, T, {apply})` — 사용자가 연동을 고르면 원화 모듈이 `Studio.store.batch` 안에서 원화 편집과 함께 호출(실행 취소 한 단계).
**미통합**: 원화 변형 자체(렌더러가 `art.transform` 을 읽어 그리기)와 휴대폰 화면·합성 레이어·인셋의 자동 연동은 Codex 원화 모듈이 필요하다(원격에 없음).

패널 제거(컷 구성 모듈):
- `S.base.links(ep, 'c033.p1')` 이 그 패널에 붙은 대사·말풍선 설정·휴대폰 화면을 준다. 제거 전에 이 목록을 경고로 보여 준다.
- 제거는 `cuts[c###].panels.removed` 편집값이다. 연결된 편집값은 지우지 않고 '고아'로 보존해 QA 에 표시한다. 복원하면 같은 ID 로 다시 연결된다(ID 가 원본 위치 기준이므로).
- 패널 추가는 범위 밖이다.

## 7. 공통 API

```js
Studio.registerModule({
  id, label, order, owner, status: 'ready'|'partial'|'planned', level: 'episode'|'cut'|'none',
  planned: [...],                     // 메뉴의 '예정' 카드
  compile(ctx),                       // level episode: ctx = { ep, data:{episode,screens,bubbles}(사본), base(원본), edits(이 모듈 slice), frame, ids, util }
  compileCut(ctx),                    // level cut: ctx = { ep, no, cutId, win, engine(BubblesV4), bubbles(실시간 설정 객체), edits(이 컷의 이 모듈 편집), frame, base }
  after: ['모듈ID'],                   // (선택) 같은 단계에서 이 모듈들 다음에 컴파일
  mount(el, api), unmount(), onCut(no, api),   // onCut: 'cut' 이벤트 — 같은 컷을 다시 고르면 ev.changed=false
  drawOverlay(ov, api),               // 중앙 오버레이(#ov) — 활성 모듈만
  onKey(e, api) → true(처리함),
  selection() → 요소ID|null           // 공통 '선택 요소 초기화'
});
Studio.plannedModule(def)             // 아직 구현 전 모듈(원본 보기 view() + 예정 카드)

Studio.store: get(module,id,ep?) · slice(module,ep?) · inCut(module,cutId,ep?) · set(module,id,value,{live,label,ep}) · patch · remove
              batch(label, fn(store), {live}) — 여러 편집을 변경 알림 1번·실행 취소 1단계로(안쪽 batch·checkpoint 는 합쳐짐)
              copyCut(원본컷ID, 새컷ID, {modules}) — 복제 컷 편집 승계 · cutEdits(컷ID) · batching()
              checkpoint(label) · undo() · redo() · goto(i) · history() · log() · reset({ep,module,cut,id},label)
              editedCuts(ep) · count(ep) · conflicts(ep) · anchors(ep) · exportData() · importData(obj) · migrate(obj) · flush()
Studio.base:  data(ep) · cut(ep,no) · cuts(ep) · panelsOf(cut) · screenKey(cut,piece) · bubbleObj(win,ep) · fingerprint(ep,id) · links(ep,panelId) · info()
Studio.ids:   cut · panel · line · part · screen · zoom · fx · fresh · parse · cutOf · cutNo · valid
Studio.cutId(no) / Studio.cutNo(cutId) — 화면의 컷 번호 ↔ 컷 ID('c017' / 새·복제 'c~xxxxx'). 편집값·초기화·QA·썸네일은 컷 ID 로 묶는다
Studio.geom:  point(p,T,size) · invert(p,T,size) · rect(r,T,size) · quad(q0~1,T,size) · poly(pts%,T,size) · identity(T) — §6 원화 변형 T 공통 변환
Studio.renderer: compileOrder(frame) → { episode:[…], cut:[…], issues:[…] } · Frame.idOf(no) · Frame.noOf(cutId)
Studio.modules.bubbles: transformTips(panelId,T,{apply,source,size}) · transformZones(panelId,T,{apply,size}) · zones(no) · selectLine(id) · selectedId()
Studio.modules.dialogue: plan · setLine · addLine · deleteLine · restoreLine · moveLine · setOrder · split · confirmSplit · mergeNext · unmerge · resetLine · finalConfig · ensureFresh(대기만)
Studio.stage: frame · compare · width · zoom · mode · cut · select(no) · point(e)→섹션 px · toOv(x,y) · origin() · hidden(no) · setWidth · setZoom · setMode
Studio.timeline: setReorder(fn(옮길 컷번호, 앞 컷번호|null)) · setSize(px) · frame() · tiles()
Studio.select(no) · Studio.step(±1) · Studio.activate(panelId) · Studio.state {ep, cut, panel}
이벤트 Studio.on(name, fn): change{ep,module,ids,source:'edit'|'batch'|'reset'|'history'|'import'} · rendered{frame,full,cuts} · stage · cut{no,source,changed} · mode · status · history · ready · thumbs-ready
```

## 8. 썸네일 탐색 바

- 썸네일 = `thumbs` 렌더러(실제 독자 화면, 폭 390, 편집 반영)의 컷 섹션을 복제해 Shadow DOM 안에서 독자 CSS(`adoptedStyleSheets`)로 축소. 원화·말풍선·휴대폰 UI·인셋이 실제와 같다.
- 원본 컷 번호 표시, 선택=파란 테두리, 자동 스크롤, 클릭·컷 목록·검색(번호+Enter)·←/→ 동기, 크기 48~160px.
- 숨김 컷은 흐리게+'숨김', 선택 가능, '컷 구성' 패널에서 복원(편집값). 편집한 컷은 주황 점, 충돌은 빨간 점.
- 성능: 타일 자리는 전체, 복제는 보이는 범위 ±600px 만(가상화), ±3000px 밖은 비움, 컷별 버전 캐시, 그림 lazy. 편집 후 썸네일 렌더러는 250ms 뒤 동기화하고 바뀐 컷만 다시 만든다.
- 순서 바꾸기: 컷 구성 모듈이 `Studio.timeline.setReorder(fn)` 을 등록하면 타일 드래그가 켜진다(1단계는 꺼짐).

## 9. 본편 적용(사용자 승인 후)

Studio 는 본편 데이터 파일을 고치지 않는다. 적용 경로:
- 말풍선: 말풍선 패널의 '적용용 패치'(`data/ep01v3-bubbles.js` cuts 형식, `manual` 포함) → 승인 후 통합 담당이 반영하고 QA·회귀 검사.
- 다른 모듈: 각 모듈이 같은 방식의 '적용용 패치'를 만든다(후속). 공통 '적용 도구'는 후속 통합 작업.

## 10. 한계 (2단계 통합 시점)

- 구현된 편집: 말풍선(위치·크기·꼬리·모양·글꼴·색·추가·삭제·분할·합치기·조각 독립 편집·꼬리/보호 영역 연동), 대사(글자·줄바꿈·정렬·화자·순서·추가·삭제·분할·합치기), 컷 숨김·복원.
- **미통합(Codex 2단계 원격 없음)**: 컷 순서·복제·패널·여백·원화 변형 렌더러, 휴대폰·합성·인셋 좌표 자동 연동. 코어 쪽 새·복제 컷 ID·승계 경로는 시험 모듈로 검증만 했다.
- 휴대폰 UI·자막·효과 모듈은 3단계(자리만).
- EP02~EP06 은 데이터가 없어 회차 선택에서 '준비 전'으로 비활성. 회차 데이터가 `data/episodes.js` 에 `ready:true` 로 등록되면 코드 수정 없이 열린다(말풍선 설정은 `window.EP_BUBBLES[id]`).
- 회차 단위 편집(숨김·복원 등)은 회차 전체를 다시 그리므로 1~2초 걸린다.
- 배포용 패키징(`tools/package-review.js`)에는 아직 Studio 가 없다(이번 단계 배포 금지). 배포할 때 meta `studio-root`·`studio-viewer` 만 바꾸고 `studio-base.json` 에 커밋을 넣는다.
