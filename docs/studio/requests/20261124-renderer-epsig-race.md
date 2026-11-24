# 코어 변경 요청 — 회차 다시 그리기 중 들어온 편집이 누락되는 경쟁 상태

- 요청: Claude Code(대사 모듈) → 통합 담당 · 2026-11-24 · 상태: **미반영(대사 모듈에 임시 방어 코드 있음)**
- 대상: `tools/studio/core/renderer.js` (`Frame.full` / `Frame.sync`) — 모든 `level:'episode'` 모듈(대사·컷·원화·…)에 해당

## 1. 증상
회차 단위(`level:'episode'`) 편집을 연달아 넣으면(예: 첫 편집이 1~2초 걸려 그려지는 동안 두 번째 편집) 두 번째 편집이 화면에 반영되지 않고 이전 상태로 남는다. 저장소(store)와 JSON 에는 두 번째 편집이 있지만 중앙 화면·썸네일은 첫 번째 편집까지만 보인다.

## 2. 원인
`Frame.full()` 이 끝난 뒤에 `f.epSig = epSignature(f)` 를 계산한다. 이 시점의 서명은 **그리는 도중에 들어온 두 번째 편집까지 포함**한 최신 저장소 값이다. `sync()` 가 `f.pending` 으로 다시 호출되면 `epSignature(f) !== f.epSig` 가 거짓이라 다시 그리지 않는다. (컴파일은 첫 편집 시점의 저장소를 읽었는데 서명은 나중 상태로 기록된 것.)

## 3. 요청
`full()` 시작 시점(컴파일이 저장소를 읽기 직전)에 서명을 계산해 두고, 그리기가 끝나면 그 값을 `f.epSig` 에 기록한다.
```js
Frame.prototype.full = function () {
  var sig = epSignature(f);            // ← 컴파일 입력과 같은 시점
  …compile…render…
  .then(function () { f.cutSig = {}; f.epSig = sig; });   // ← 끝난 뒤가 아니라 시작 때 값
};
```
`sync()` 의 `pending` 재호출이 서명 차이를 보고 다시 그리게 된다. 컷 단위(`cutSig`)도 같은 방식으로 `applyCut` 시작 시점의 서명을 쓰고 있어 문제가 없다.

## 4. 기대 결과·회귀 검증
- 그리는 도중 연달아 넣은 편집이 모두 반영된다(`tools/studio/tests/dialogue.test.js` "그리는 도중 연달은 편집 3개…" 항목이 대사 모듈 보정 없이도 통과 — 반영 후 `compiledMatches` 보정을 지워도 된다).
- 편집이 없으면 렌더 결과·기존 `run.js` 88항목 그대로.

## 5. 임시 방어(대사 모듈, 코어 변경 전까지)
`dialogue.js` `ensureFresh()` 가 대사 편집 700ms 뒤 화면 데이터가 편집값 계산 결과와 같은지 확인하고 다르면 `frame.sync(true)` 로 다시 그린다. 코어가 고쳐지면 이 보정은 필요 없다. 컷 구성(Codex) 모듈 등 다른 회차 단위 모듈은 같은 문제를 겪을 수 있다.
