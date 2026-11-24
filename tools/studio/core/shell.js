/* Studio 화면 골격: 상단 막대·왼쪽 메뉴·오른쪽 속성·편집 이력·QA·내보내기/불러오기·키보드 (통합 담당 전용 파일)
 * 모듈은 S.registerModule 로 등록만 하고, 메뉴·속성 영역·오버레이 연결은 여기서 한다. */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids, $ = U.$;
  S.state = { ep: null, cut: null, panel: 'bubbles' };
  /* 컷 번호 → 컷 ID(원본 'c017', 새·복제 컷 'c~xxxxx'). 편집값·초기화·QA·썸네일은 모두 컷 ID 로 묶는다 */
  S.cutId = function (no) { return S.stage.frame ? S.stage.frame.idOf(no == null ? S.state.cut : no) : I.cut(no == null ? S.state.cut : no); };
  S.cutNo = function (cutId) { return S.stage.frame ? S.stage.frame.noOf(cutId) : I.cutNo(cutId); };
  function modLabel(m) { return (S.modules[m] && S.modules[m].label) || m; }
  var WIDTHS = [320, 360, 390, 430, 768];

  /* ---------- 선택·이동 ---------- */
  S.select = function (no, source) { if (S.stage.select(no, { source: source })) { $('cutSel').value = String(no); try { history.replaceState(null, '', '#' + S.state.ep + '/' + no); } catch (e) {} } };
  function cutList() { var f = S.stage.frame; return f.order.map(function (no) { return f.cut(no); }); }
  S.step = function (d, source) {
    var only = $('onlyLines').checked, cs = cutList().filter(function (c) { return !only || (c.lines && c.lines.length) || c.no === S.state.cut; });
    var k = cs.map(function (c) { return c.no; }).indexOf(S.state.cut), n = cs[k + d]; if (n) S.select(n.no, source || 'step');
  };
  function buildCutSel() {
    var only = $('onlyLines').checked, f = S.stage.frame;
    $('cutSel').innerHTML = cutList().filter(function (c) { return !only || (c.lines && c.lines.length) || c.no === S.state.cut; }).map(function (c) {
      return '<option value="' + c.no + '">#' + c.no + ' ' + U.esc((c.desc || '').slice(0, 26)) + (f.hidden[c.no] ? ' (숨김)' : '') + '</option>'; }).join('');
    if (S.state.cut != null) $('cutSel').value = String(S.state.cut);
  }
  function buildEpSel() {
    var base = S.base.data(S.state.ep), eps = (base && base.series && base.series.episodes) || [], seen = {};
    $('epSel').innerHTML = eps.filter(function (e) { var k = e.no + '|' + e.id; if (seen[k]) return false; seen[k] = 1; return true; }).map(function (e) {
      var ok = !!e.ready; return '<option value="' + U.esc(e.id) + '"' + (ok ? '' : ' disabled') + '>' + e.no + '화' + (e.title ? ' ' + U.esc(String(e.title).slice(0, 14)) : '') + (ok ? '' : ' (준비 전)') + '</option>'; }).join('');
    $('epSel').value = S.state.ep;
  }
  function cutHead() {
    var no = S.state.cut, c = S.stage.frame.cut(no); if (!c) return;
    var ps = S.base.panelsOf(c).length, hid = S.stage.hidden(no), cid = S.cutId(no), ed = S.store.editedCuts()[cid];
    $('cutInfo').innerHTML = '<b>#' + no + '</b> <span class="dim">' + cid + '</span> · ' + U.esc(c.desc || '') + (ps > 1 ? ' · 조각 ' + ps : '') +
      (hid ? ' <span class="chip warn">독자 화면 숨김 컷</span>' : '') + (ed ? ' <span class="chip edit">편집: ' + U.esc(ed.map(modLabel).join(', ')) + '</span>' : '');
  }

  /* ---------- 왼쪽 메뉴·오른쪽 속성 ---------- */
  var SYSTEM = [{ id: 'history', label: '편집 이력', order: 90 }, { id: 'qa', label: 'QA', order: 95 }];
  function navItems() { return S.moduleList.map(function (m) { return { id: m.id, label: m.label, status: m.status }; }).concat(SYSTEM); }
  function buildNav() {
    $('nav').innerHTML = navItems().map(function (n) { return '<button data-panel="' + n.id + '"' + (n.id === S.state.panel ? ' aria-current="true" class="on"' : '') + '>' + U.esc(n.label) + (n.status === 'planned' ? ' <small>예정</small>' : n.status === 'partial' ? ' <small>일부</small>' : '') + '</button>'; }).join('');
  }
  var mounted = null;
  S.activate = function (id) {
    if (mounted && mounted.unmount) try { mounted.unmount(); } catch (e) { console.error(e); }
    mounted = null; S.state.panel = id; buildNav(); var el = $('props'); el.innerHTML = ''; $('ov').innerHTML = '';
    if (id === 'history') return renderHistory(el);
    if (id === 'qa') return renderQA(el);
    var m = S.modules[id]; if (!m) return;
    if (m.mount) { mounted = m; m.mount(el, api); }
    else el.innerHTML = plannedCard(m);
    drawOverlay();
  };
  function plannedCard(m) {
    return '<section class="card"><h2>' + U.esc(m.label) + ' <small>후속 개발 예정</small></h2><p class="note">담당: ' + U.esc(m.owner || '-') + ' · 편집값 위치: <code>edits.' + U.esc(m.id) + '</code></p>' +
      '<ul class="plan">' + (m.planned || []).map(function (p) { return '<li>' + U.esc(p) + '</li>'; }).join('') + '</ul></section>';
  }
  function drawOverlay() { var m = S.modules[S.state.panel]; var ov = $('ov'); if (m && m === mounted && m.drawOverlay && S.state.cut != null) m.drawOverlay(ov, api); else ov.innerHTML = ''; }

  /* 모듈에 넘기는 API (문서: docs/STUDIO_ARCHITECTURE.md) */
  var api = S.api = {
    store: S.store, stage: S.stage, ids: I, util: U, base: S.base,
    get ep() { return S.state.ep; }, get cut() { return S.state.cut; },
    cutData: function (no) { return S.stage.frame.cut(no == null ? S.state.cut : no); },
    plannedCard: plannedCard, toast: U.toast, select: S.select
  };

  /* 아직 구현하지 않은 모듈: 메뉴 + 원본 데이터 보기(view) + 예정 기능 카드 */
  S.plannedModule = function (o) {
    function show(el) { var body = o.view ? o.view() : ''; el.innerHTML = (body ? '<section class="card"><h2>현재 컷 원본 <small>읽기 전용</small></h2>' + body + '</section>' : '') + plannedCard(o); }
    o.mount = function (el) { o._el = el; show(el); }; o.unmount = function () { o._el = null; }; o.onCut = function () { if (o._el) show(o._el); };
    return S.registerModule(o);
  };

  /* ---------- 편집 이력 ---------- */
  function fmt(t) { var d = new Date(t); return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes()) + ':' + U.pad2(d.getSeconds()); }
  function renderHistory(el) {
    var h = S.store.history().slice().reverse(), lg = S.store.log().slice(-60).reverse();
    el.innerHTML = '<section class="card"><h2>실행 취소 이력 <small>이번 세션 · 눌러서 그 시점으로</small></h2><ol class="hist">' +
      h.map(function (x) { return '<li><button data-h="' + x.i + '"' + (x.current ? ' class="on"' : '') + '>' + fmt(x.t) + ' · ' + U.esc(x.label) + '</button></li>'; }).join('') + '</ol></section>' +
      '<section class="card"><h2>작업 기록 <small>자동 저장에 함께 보관(최근 60)</small></h2><ol class="hist log">' +
      lg.map(function (x) { return '<li>' + U.esc((x.t || '').replace('T', ' ').slice(0, 19)) + ' · ' + U.esc(x.label) + (x.ids ? ' <span class="dim">' + U.esc(x.ids.slice(0, 3).join(' ')) + '</span>' : '') + '</li>'; }).join('') + '</ol></section>';
    el.onclick = function (e) { var b = e.target.closest('[data-h]'); if (b) S.store.goto(+b.dataset.h); };
  }
  /* ---------- QA ---------- */
  function renderQA(el) {
    var ep = S.state.ep, info = S.base.info(), bi = info.episodes[ep] || {}, cf = S.store.conflicts(ep), ed = S.store.editedCuts(ep), cnt = S.store.count(ep);
    var f = S.stage.frame, hiddenN = Object.keys(f.hidden).length;
    el.innerHTML = '<section class="card"><h2>기준</h2><dl class="kv">' +
      '<dt>커밋</dt><dd>' + (info.commit ? '<code>' + info.commit.slice(0, 10) + '</code> ' + U.esc(info.branch || '') : '<span class="warn">알 수 없음(로컬 .git 또는 studio-base.json 없음)</span>') + '</dd>' +
      '<dt>원본 컷</dt><dd>' + bi.cuts + '컷 (독자 노출 ' + bi.readerCuts + ' · 숨김 ' + (bi.cuts - bi.readerCuts) + ')</dd>' +
      '<dt>지금 숨김</dt><dd>' + hiddenN + '컷 ' + U.esc(Object.keys(f.hidden).join(', ')) + '</dd>' +
      '<dt>데이터 지문</dt><dd><code>' + bi.data + '</code></dd><dt>말풍선 지문</dt><dd><code>' + bi.bubbles + '</code></dd><dt>휴대폰 지문</dt><dd><code>' + bi.screens + '</code></dd></dl></section>' +
      '<section class="card"><h2>편집 현황</h2><p>' + (Object.keys(cnt).length ? Object.keys(cnt).map(function (m) { return U.esc(modLabel(m)) + ' ' + cnt[m] + '개'; }).join(' · ') : '편집 없음') + '</p>' +
      '<div class="chips">' + Object.keys(ed).sort().map(function (c) { var n = S.cutNo(c); return n == null ? '<span class="chip warn" title="화면에 없는 컷(연결 해제)">' + U.esc(c) + '</span>' : '<button data-go="' + n + '" title="' + U.esc(c) + '">#' + n + (c.indexOf('~') > 0 ? ' ' + U.esc(c) : '') + '</button>'; }).join('') + '</div></section>' +
      (function () { var co = S.renderer.compileOrder(f); return '<section class="card"><h2>컴파일 순서</h2><p class="note">회차 단계: ' + U.esc(co.episode.map(modLabel).join(' → ') || '-') + ' · 컷 단계: ' + U.esc(co.cut.map(modLabel).join(' → ') || '-') + '</p>' + (co.issues.length ? '<ul class="plan warn">' + co.issues.map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="note">문제 없음</p>') + '</section>'; })() +
      '<section class="card"><h2>충돌 <small>원본이 바뀌었거나 사라진 요소</small></h2>' + (cf.length ? '<ul class="plan">' + cf.map(function (c) { return '<li><button data-go="' + S.cutNo(I.cutOf(c.id)) + '">' + U.esc(c.id) + '</button> ' + U.esc(c.module) + ' · ' + (c.reason === 'missing' ? '원본에 없음' : c.reason === 'changed' ? '원본 내용 변경' : '잘못된 ID') + '</li>'; }).join('') + '</ul>' : '<p>없음</p>') + '</section>' +
      '<section class="card"><h2>검사 도구</h2><div class="chips"><a class="btn" href="' + S.renderer.root + 'tools/qa/v3.html?auto" target="_blank" rel="noopener">본편 QA(v3) 열기</a><button data-mode="side">원본과 나란히 보기</button><button id="qaReset">회차 편집 전체 초기화</button></div>' +
      '<p class="note">편집값은 본편 데이터에 적용되지 않습니다. 적용은 사용자 승인 후 별도 작업입니다.</p></section>';
    el.onclick = function (e) { var g = e.target.closest('[data-go]'); if (g) S.select(+g.dataset.go, 'qa'); var md = e.target.closest('[data-mode]'); if (md) setMode(md.dataset.mode); if (e.target.id === 'qaReset' && confirm('이 회차의 모든 편집(모든 모듈)을 되돌릴까요? 실행 취소로 되살릴 수 있습니다.')) S.store.reset({ ep: ep }, '회차 전체 초기화'); };
  }

  /* ---------- 상단 막대 ---------- */
  function setMode(m) { document.querySelectorAll('#modes button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === m)); }); busy(true); S.stage.setMode(m).then(function () { busy(false); }); }
  function busy(on) { document.body.classList.toggle('is-busy', !!on); }
  function widths() { $('widths').innerHTML = WIDTHS.map(function (w) { return '<button data-w="' + w + '" aria-pressed="' + (w === S.stage.width) + '">' + w + '</button>'; }).join(''); }
  function undoBtns() { $('undo').disabled = !S.store.canUndo(); $('redo').disabled = !S.store.canRedo(); }
  function status(ev) {
    var e = $('saveState'); if (!e) return;
    if (ev.state === 'pending') { e.textContent = '저장 중…'; e.className = 'save pending'; }
    else if (ev.state === 'error') { e.textContent = '저장 실패(브라우저 저장소)'; e.className = 'save error'; }
    else { e.textContent = '저장됨 ' + fmt(ev.at); e.className = 'save ok'; }
  }
  function exportJson() { U.download('lastaccess-studio-' + U.today() + '.json', JSON.stringify(S.store.exportData(), null, 1)); U.toast('통합 JSON 저장'); }
  function importJson(file) {
    var r = new FileReader(); r.onload = function () {
      try { var res = S.store.importData(JSON.parse(r.result)); var nC = 0, nB = 0; Object.keys(res.conflicts).forEach(function (k) { nC += res.conflicts[k].length; }); Object.keys(res.baseDiff).forEach(function (k) { nB += res.baseDiff[k].length; });
        U.toast('불러옴(' + res.from + ')' + (nC ? ' · 충돌 ' + nC + '개' : '') + (nB ? ' · 원본 데이터가 다른 버전' : ''));
        if (nC || nB) S.activate('qa'); }
      catch (e) { U.toast('불러오지 못함: ' + e.message); }
    }; r.readAsText(file);
  }
  function resetScope(scope) {
    var m = S.modules[S.state.panel], sel = m && m.selection ? m.selection() : null;
    if (scope === 'el') { if (!sel) return U.toast('선택한 요소가 없습니다'); S.store.reset({ id: sel }, '요소 초기화 ' + sel); }
    else if (scope === 'cut') S.store.reset({ cut: S.cutId() }, '컷 초기화 #' + S.state.cut);
    else if (confirm('이 회차의 모든 편집을 되돌릴까요? 실행 취소로 되살릴 수 있습니다.')) S.store.reset({}, '회차 전체 초기화');
  }

  function bind() {
    $('nav').onclick = function (e) { var b = e.target.closest('[data-panel]'); if (b) S.activate(b.dataset.panel); };
    $('widths').onclick = function (e) { var b = e.target.closest('[data-w]'); if (!b) return; busy(true); S.stage.setWidth(+b.dataset.w).then(function () { widths(); busy(false); }); };
    $('zoom').oninput = function () { S.stage.setZoom(+this.value); $('zoomV').textContent = Math.round(this.value * 100) + '%'; };
    $('modes').onclick = function (e) { var b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); };
    $('undo').onclick = S.store.undo; $('redo').onclick = S.store.redo;
    $('jsonOut').onclick = exportJson; $('jsonIn').onclick = function () { $('file').click(); };
    $('file').onchange = function () { if (this.files[0]) importJson(this.files[0]); this.value = ''; };
    $('cutSel').onchange = function () { S.select(+this.value, 'select'); };
    $('onlyLines').onchange = buildCutSel;
    $('prev').onclick = function () { S.step(-1); }; $('next').onclick = function () { S.step(1); };
    $('epSel').onchange = function () { location.hash = '#' + this.value; location.reload(); };
    $('rsEl').onclick = function () { resetScope('el'); }; $('rsCut').onclick = function () { resetScope('cut'); }; $('rsEp').onclick = function () { resetScope('ep'); };
    document.addEventListener('keydown', function (e) {
      var t = e.target.tagName, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t) && e.target.type !== 'range';
      if ((e.ctrlKey || e.metaKey) && /^[zZ]$/.test(e.key)) { e.preventDefault(); if (e.shiftKey) S.store.redo(); else S.store.undo(); return; }
      if ((e.ctrlKey || e.metaKey) && /^[yY]$/.test(e.key)) { e.preventDefault(); S.store.redo(); return; }
      if (typing || e.target.closest && e.target.closest('#tlBar')) return;
      var m = S.modules[S.state.panel]; if (m && m === mounted && m.onKey && m.onKey(e, api)) return;
      if (e.key === 'PageDown' || e.key === ']') { e.preventDefault(); S.step(1); } else if (e.key === 'PageUp' || e.key === '[') { e.preventDefault(); S.step(-1); }
    });
    S.on('status', status);
    S.on('history', undoBtns);
    S.on('change', function () { undoBtns(); cutHead(); if (S.state.panel === 'history') renderHistory($('props')); if (S.state.panel === 'qa') renderQA($('props')); S.stage.frame.sync(); if (S.stage.compare && S.stage.mode === 'side') S.stage.compare.sync(); });
    S.on('stage', function () { drawOverlay(); });
    S.on('cut', function () { cutHead(); var m = S.modules[S.state.panel]; if (m && m === mounted && m.onCut) m.onCut(S.state.cut, api); });
    S.on('rendered', function (ev) { if (ev.frame === S.stage.frame && ev.full) { buildCutSel(); cutHead(); } });
  }

  /* ---------- 시작 ---------- */
  S.boot = function () {
    var h = (location.hash || '').replace('#', '').split('/'), ep = h[0] || 'ep01v3', want = h[1] ? +h[1] : null;
    S.state.ep = ep; S.store.load(); widths(); buildNav(); bind(); undoBtns();
    S.stage.init(); S.timeline.init(); busy(true);
    S.base.loadCommit(S.renderer.root);
    return S.stage.load(ep).then(function () {
      S.store.ensureAnchors(ep); buildEpSel(); buildCutSel();
      var f = S.stage.frame, first = f.order.filter(function (n) { var c = f.cut(n); return c.lines && c.lines.length && !f.hidden[n]; })[0];
      S.select(want != null && f.cut(want) ? want : (first || f.order[0]), 'boot');
      S.activate(S.state.panel); busy(false);
      S.emit('ready', {});
      return S.timeline.load(ep);
    }).then(function () { S.ready = true; S.emit('thumbs-ready', {}); }, function (e) { busy(false); U.toast('불러오지 못했습니다: ' + e.message); console.error(e); });
  };
})();
