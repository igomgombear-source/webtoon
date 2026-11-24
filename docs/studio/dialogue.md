# 대사 모듈 (`tools/studio/modules/dialogue.js`) — Claude Code · 2단계 A

공통 규격: `docs/STUDIO_ARCHITECTURE.md` · 파일 권한: `docs/STUDIO_PARALLEL_DEV.md` · 말풍선 연동: `docs/studio/bubbles.md`

## 1. 하는 일
대사·독백 글자, 줄바꿈, 화자, 순서, 추가·삭제, 분할·합치기를 **편집값으로만** 바꾼다. 원본 대사 데이터(`data/ep01v3.js`)는 바뀌지 않는다. 렌더러 변경 없이 컴파일된 대사 줄(`cut.lines`)과 말풍선 설정(`lines`)을 만들어 독자 렌더러가 그리게 한다(`level:'episode'`, 바꾸면 회차 전체를 다시 그림).

## 2. 편집값 `edits.dialogue`
모든 동작은 편집값 **한 곳을 한 번** 바꾼다(실행 취소 한 단계, 렌더러 경쟁 상태 방지).

| 키 | 값 |
|---|---|
| `c024.l0` (원본 대사) | `{ text?, who?, align?, deleted?:true, absorb?:[대사ID…], split?:[ {id,text,who?,align?,deleted?} … ] }` |
| `c024.l~k3f9a` (새 대사) | `{ added:true, after:앞 대사ID, text, who?, style, panel?, align?, deleted?, split? }` |
| `c024` (컷) | `{ order:[최상위 대사ID…] }` — 없으면 원본 순서, 새 대사는 `after` 바로 뒤 |

- `text`: 줄바꿈은 `\n`. 원본과 같아지면 키를 지운다.
- `split[k]`: 분할 조각. 조각 ID = 부모ID + `.` + `id` (`c024.l0.b0`, 이후 나눔은 `b~xxxxx`). 조각의 글자·화자·정렬·삭제는 모두 이 항목 안에 있다.
- `absorb`: 이 대사가 바로 다음 대사들(ID 목록)의 글자를 이어 받고, 그 대사들은 목록에서 빠진다(합치기). 풀면 둘 다 돌아온다.
- 원본 요소가 사라졌거나 지문이 다르면 `Studio.store.conflicts()` 가 `missing`/`changed` 로 표시한다.

## 3. 안정 ID — 말풍선 연결
- 말풍선 편집값(`edits.bubbles`)의 키는 **대사 ID** 다. 순서·추가·삭제·분할을 해도 대사 ID 는 바뀌지 않으므로 말풍선 설정은 항상 같은 대사에 붙는다(순서 번호가 아님).
- 컴파일된 줄에는 `sid` (= 대사 ID) 를 넣는다. 말풍선 모듈이 그 줄 번호 ↔ ID 대응을 `sid` 로 읽는다. 대사 편집이 없는 컷에는 `sid` 가 없고 원본 순서 ID 를 쓴다(편집 없으면 독자 화면과 HTML 동일).
- 삭제한 대사의 말풍선 편집값은 지우지 않는다(보존). 복원하면 되살아난다. 말풍선 패널에 "연결된 대사가 없는 편집 N개"로 알린다.
- 분할은 대사 한 줄을 **별도 줄**로 푼다: 조각마다 원래 대사의 말풍선 설정(`pref`·`tail`·`type`…)을 이어받고 `noSplit` 으로 엔진 자동 분할을 막는다. 그래서 조각마다 독립 정밀 편집이 된다.
- 엔진이 자동으로 나눠 그리던 대사(EP01 12개)는 **자동 분할 확정**(`confirmSplit`)으로 조각 대사로 바꾼다. 검증: 12개 모두 확정 전과 화면(위치·크기·꼬리·HTML)이 같다.

## 4. 말풍선 설정 계산 (`finalConfig`)
편집이 있는 컷마다 엔진(`BubblesV4.effective`)으로 (a) 원본 대사의 설정(자동 포함)과 (b) 새 대사 배열의 자동 설정을 구하고(해당 iframe 의 컷 데이터를 잠시 바꿔 끼움), 줄마다 원본 설정을 이어받거나 자동 설정을 쓴다. 결과는 컷의 완전한 `lines` 배열로 `ctx.data.bubbles.cuts[no].lines` 에 들어간다. 대사 구조가 원본과 같으면 컷을 건드리지 않는다.

## 5. 공개 API (`Studio.modules.dialogue.*`)
`plan(no)` → `{ entries:[{id,kind:'orig'|'added'|'part',parent,srcIndex,line,…}], deleted, identity, order }` · `ids(no)` · `setLine(id,{text,who,align})` · `setText/setWho/setAlign` · `addLine({no,after,who,text,style,panel})` → 새 ID · `deleteLine(id)` · `restoreLine(id)` · `moveLine(id,±n)` · `setOrder(no,ids)` · `split(id,pos|null)` → 새 조각 ID · `confirmSplit(id)` · `mergeNext(id)` · `unmerge(id)` · `resetLine(id)` · `selected()` · `patchText()` · `finalConfig(frame,no)` · `ensureFresh()`.

## 6. 화면(대사 메뉴)
대사 목록(끌어서 순서 변경, ▲▼) · 선택한 대사(화자·내용·정렬, 적용·커서 위치에서 분할·다음과 합치기·자동 분할 확정·삭제·초기화) · 대사 추가 · 삭제한 대사(복원) · 본편 반영용 패치. 내용은 Ctrl+Enter, 화자는 Enter 로 적용.

## 7. 본편 반영(사용자 승인 후)
`패치 텍스트`(대사 메뉴 → `data/<회차>.js` 해당 컷 `lines`)와 말풍선 패치(말풍선 메뉴 → `data/<회차>-bubbles.js` 해당 컷 `lines`)를 **함께** 적용해야 줄 순서·개수가 맞는다. 실제 독자 화면에 두 패치를 넣었을 때 Studio 와 같은 화면인지 검사한다(테스트 `dialogue`).

## 8. 한계·요청
- 정렬(align)·줄바꿈 모두 렌더러가 그린다(2단계 통합). 렌더러 경쟁 상태는 코어에서 고쳤고 임시 보정은 지웠다.
- 새·복제 컷(`cut.sid`/`cut.from`)의 대사 편집은 컷 ID 로 된다(코어 규약, 시험 모듈로 검증). 본편 패치 텍스트는 원본 컷만 낸다.
- 합치기는 같은 컷의 인접한 대사끼리만, 분할 조각은 같은 대사의 조각끼리만 가능하다. 합친 대사의 말풍선 설정은 앞 대사 것을 쓴다.
- 대사 `who` 를 바꾸면 엔진의 이어 붙이기·꼬리 자리가 달라질 수 있다(원본 대사 설정은 그대로 이어받음).
- 다른 컷으로 대사를 옮기는 기능은 없다.

## 9. 검증
`node tools/studio/tests/run.js dialogue` — 글자·줄바꿈·화자·실행 취소, 재배열 후 말풍선 설정이 같은 대사에 붙어 있는지(위치·키), 삭제·복원·추가·합치기, 분할 조각 독립 편집·JSON·자동 저장 복원, 연달은 편집(경쟁 상태), 구조 편집+정밀값을 패치로 실제 독자 화면에 넣어 320~768px 5개 폭에서 위치·크기·꼬리·HTML 일치, 썸네일 반영, 컷 초기화.
