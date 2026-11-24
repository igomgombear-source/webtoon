# 렌더러 변경 요청 — 대사 정렬(align)

- 요청: Claude Code(대사 모듈) → 통합 담당 · 2026-11-24 · 상태: **미반영 — Studio 는 값을 저장·내보내기만 하고 화면에는 반영되지 않는다**
- 관련 모듈: `tools/studio/modules/dialogue.js`

## 1. 현재 상태
- 줄바꿈: 대사 글자 안의 `\n` 은 엔진이 그대로 그린다(`white-space: pre-line`, 검증함: `tools/studio/tests/dialogue.test.js`). **지원됨.**
- 정렬: 렌더러가 읽는 값이 없다. Studio 대사 패널의 '정렬' 선택은 `edits.dialogue[대사ID].align`(분할 조각은 `split[k].align`)에 저장되고 컴파일된 대사 줄에 `align` 으로 들어가지만(`ln.align`), 엔진·CSS 가 읽지 않아 **화면은 바뀌지 않는다.** 패널에 "화면 미반영 — 렌더러 요청 대기"로 표시했다.

## 2. 요청하는 동작
`data/*.js` 의 `cut.lines[i].align` (`'left' | 'center' | 'right'`, 생략 = 지금과 같음)을 말풍선 글자 정렬로 읽는다.
- `js/bubbles.js` `drawBubble`: `if (c.ln.align) t.style.textAlign = c.ln.align;`
- 글자 줄바꿈 측정(`measure`/`lineBoxes`)은 정렬과 무관하므로 배치는 그대로, 글자 위치만 바뀐다. 줄 폭이 다른 여러 줄에서만 차이가 보인다.
- 해당 말풍선이 타원일 때 가운데 외 정렬은 둥근 윤곽 때문에 읽기 어려울 수 있어 Studio 가 경고를 표시한다(렌더러는 그대로 적용).

## 3. 기대 결과
- `align` 이 없는 컷은 출력 HTML 이 변경 전과 같다(바이트 단위).
- `align` 이 있으면 `style="text-align:…"` 이 글자 요소에만 붙는다.

## 4. 회귀 검증 조건
`docs/studio/requests/20261124-bubbles-style.md` §4 와 같다(해시 비교·`run.js` 전체·`tools/qa/v3.html?auto`).
