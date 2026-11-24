# 렌더러 변경 요청 — 말풍선 모양 종류·글꼴·글자 색·배경색

- 요청: Claude Code(말풍선·대사 모듈) → 통합 담당 · 2026-11-24 · 상태: **미반영(Studio 편집 기능은 이 요청이 처리되기 전까지 만들지 않음)**
- 관련 모듈: `tools/studio/modules/bubbles.js` · 규격: `docs/STUDIO_ARCHITECTURE.md` §4

## 1. 왜 필요한가
Studio 2단계 A 범위 중 "말풍선 모양·글꼴·글자 색상·배경색 변경"은 독자 렌더러(`js/bubbles.js`, `css/style.css`)가 읽는 값이 없다.
- 모양 종류(`kind`)는 유형(`type`)에서 엔진이 정한다(ellipse / jag / round / jagrect). 설정으로 고를 수 없다.
- 글꼴·글자 색·배경색은 CSS 클래스(`.bv4-t-speech` 등)에 고정돼 있다.
Studio 에서 근사 렌더링(편집기 안에서만 색을 입히는 방식)은 하지 않는다(정본 원칙: 실제 독자 화면과 같은 렌더러). 그래서 렌더러가 읽을 데이터 규격을 요청한다.

## 2. 요청하는 데이터 규격 (줄 단위 `manual.style`)
`data/*-bubbles.js` 의 `cuts[no].lines[i].manual` 안에 추가한다(기존 `manual` 키와 같은 위치, 없으면 지금과 완전히 같아야 함).

```js
manual: {
  // …기존 x y w h pad radius fs lh tail…
  style: {
    kind:  'ellipse' | 'round' | 'jag' | 'jagrect',   // 모양 종류 (생략 = 지금처럼 type 에서 결정)
    font:  'sans' | 'serif' | 'mono',                  // 글꼴 계열 (생략 = type 기본). 실제 글꼴은 css/style.css 의 --font 계열 변수에 매핑
    color: '#rrggbb',                                  // 글자 색 (생략 = 기본)
    bg:    '#rrggbb',                                  // 배경색 (생략 = 기본)
    stroke:'#rrggbb'                                   // (선택) 테두리 색
  }
}
```
- `color`·`bg` 는 CSS 변수(`--bv4-color`, `--bv4-bg`)를 말풍선 요소 인라인 스타일로 넣고 CSS 가 그 변수를 쓰게 하는 방식을 권장한다(꼬리·말풍선 SVG 도 같은 변수를 `fill` 로 쓴다).
- 대비 검사: 글자와 배경 대비가 4.5:1 미만이면 `BubblesV4.info()` 항목에 `lowContrast:true` 를 넣어 주면 Studio 가 경고를 표시한다.
- `kind` 를 바꾸면 크기·꼬리 계산(`shapeOptions`/`fitEllipse`)이 달라지므로 `applyManual` 의 `resize` 판정에 `style.kind` 를 포함해 달라.
- 분할 말풍선도 줄 단위로 같다(Studio 는 분할을 줄로 풀어 쓰므로 조각마다 따로 값이 들어간다).

## 3. 기대 결과
- `manual.style` 이 없는 컷은 출력 HTML 이 변경 전과 **바이트 단위로 같다**.
- `style` 이 있으면 지정한 모양·글꼴·색으로 그려지고, 위치·꼬리·크기 편집과 함께 동작한다.
- `BubblesV4.info()` 에 `style`(적용된 값) 이 포함된다.

## 4. 회귀 검증 조건 (통합 담당이 반영할 때)
1. 변경 전 `js/bubbles.js` 를 보관해 320·360·390·430·768px 에서 99컷 `.bv4-layer` HTML 해시 비교(`style` 키 없을 때 동일, 기존 `reg.js` 방식).
2. `node tools/studio/tests/run.js` 전체 통과(특히 `regression`, `bubbles`, `dialogue`).
3. `tools/qa/v3.html?auto` FAIL/WARN 증가 없음(현재 FAIL 2 = 89컷 승인 기록, WARN 0).
4. 반영 후 Studio 쪽에서 할 일: `bubbles.js` 패널에 모양·글꼴·색 컨트롤 추가 + 테스트 `bubbles-style.test.js`(Claude Code).
