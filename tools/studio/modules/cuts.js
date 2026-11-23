/* 모듈: 컷 구성 — 컷 순서·추가·복제·숨김·복원, 패널 제거·복원·순서·배치, 컷·패널 여백, 크기·비율 (담당: Codex)
 * 1단계(통합 담당)가 넣은 것: 숨김·복원(edits.cuts['c016'] = { hidden: true|false }) 과 컴파일 연결.
 * 나머지는 후속 개발. 패널 '추가'는 범위 밖이다.
 * 렌더러 연동: level 'episode' — compile(ctx) 가 ctx.data.episode.cuts 를 고친다(회차 전체 다시 그림). */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  function setHidden(no, hidden) {
    var base = S.base.cut(S.state.ep, no); if (!base) return;
    var orig = base.reader === false;
    S.store.set('cuts', I.cut(no), hidden === orig ? null : { hidden: !!hidden }, { label: (hidden ? '컷 숨김 #' : '컷 복원 #') + no });
  }
  function panel(el) {
    var no = S.state.cut, base = S.base.cut(S.state.ep, no), hid = S.stage.hidden(no), orig = base && base.reader === false;
    el.innerHTML = '<section class="card"><h2>독자 화면 표시 <small>#' + no + '</small></h2>' +
      '<p>원본: <b>' + (orig ? '숨김(reader:false)' : '표시') + '</b> · 지금: <b>' + (hid ? '숨김' : '표시') + '</b></p>' +
      '<div class="chips"><button id="ct-hide"' + (hid ? ' disabled' : '') + '>이 컷 숨기기</button><button id="ct-show"' + (hid ? '' : ' disabled') + '>이 컷 복원(표시)</button></div>' +
      '<p class="note">편집값으로만 저장됩니다(원본 데이터·컷 순서 불변). 바꾸면 회차 전체를 다시 그립니다(1~2초).</p></section>' +
      S.api.plannedCard(S.modules.cuts);
    el.querySelector('#ct-hide').onclick = function () { setHidden(no, true); };
    el.querySelector('#ct-show').onclick = function () { setHidden(no, false); };
  }
  S.registerModule({
    id: 'cuts', label: '컷 구성', order: 30, owner: 'Codex', status: 'partial', level: 'episode',
    planned: ['컷 순서 드래그 변경(썸네일 바 S.timeline.setReorder 사용, 편집값 cuts.order = 컷ID 배열)', '컷 추가·복제(새 ID c~xxxxx)', '컷 숨김·복원(1단계 완료)', '패널 제거·복원·순서·배치 변경(패널 추가는 제외)', '컷·패널 사이 여백 조절', '컷·패널 크기·비율 조절', '패널 제거 시 연결된 대사·말풍선·합성 요소 경고 및 복원'],
    compile: function (ctx) {
      var e = ctx.edits || {};
      ctx.data.episode.cuts.forEach(function (c) { var v = e[I.cut(c.no)]; if (!v || v.hidden == null) return; if (v.hidden) c.reader = false; else delete c.reader; });
    },
    mount: function (el) { this._el = el; panel(el); },
    unmount: function () { this._el = null; },
    onCut: function () { if (this._el) panel(this._el); },
    drawOverlay: function (ov) { ov.innerHTML = ''; if (this._el) panel(this._el); },
    selection: function () { return S.state.cut == null ? null : I.cut(S.state.cut); },
    setHidden: setHidden
  });
})();
