/* 모듈: 말풍선 — 위치·크기·여백·모서리·글자·꼬리 (담당: Claude Code · 1단계에서 말풍선 편집기 v2 기능을 그대로 옮김)
 * 편집값: edits.bubbles['c024.l0'] = manual  (js/bubbles.js 가 읽는 줄 단위 정밀값, 문서 docs/STUDIO_ARCHITECTURE.md §4)
 *   manual = { x, y (말풍선 중심, 조각 대비 %), w (%), h (% | 'auto'), pad, radius (px, 60=타원), fs (px), lh,
 *              tail: { on:false } | { tip:{x,y}(%), start: 각도|'auto', thick: px, curve: -0.5~0.5 } }
 * 렌더러 연동: level 'cut' — compileCut 이 그 컷의 말풍선 설정 lines 에 manual 을 넣는다(엔진이 배치 후 적용).
 * 한계(후속): 여러 말풍선으로 나뉜 대사('c024.l0.b1' 조각 단위)는 아직 편집하지 않는다. */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  var DEF = { speech: { pad: 6, radius: 60, lh: 1.42 }, offscreen: { pad: 6, radius: 60, lh: 1.42 }, phone: { pad: 8, radius: 60, lh: 1.42 }, mono: { pad: 12, radius: 2, lh: 1.55 }, caption: { pad: 9, radius: 0, lh: 1.35 } };
  var M = { sel: null, info: [], el: null, drag: null };
  var rnd = U.rnd, clamp = U.clamp, clone = U.clone;

  function no() { return S.state.cut; }
  function lid(src) { return I.line(no(), src); }
  function manualOf(src) { return S.store.get('bubbles', lid(src)); }
  function itemOf(src) { return M.info.filter(function (i) { return i.src === src; }); }
  function selSrc() { var v = M.info.map(function (i) { return i.src; }); if (M.sel == null || v.indexOf(M.sel) < 0) M.sel = v.length ? v[0] : null; return M.sel; }
  function refreshInfo() { var f = S.stage.frame; M.info = f.section(no()) ? f.info(no()) : []; }

  /* 편집값 → 말풍선 설정 lines (화면 배치와 패치 내보내기가 같이 쓴다) */
  function merge(eff, edits) {
    var lines = clone(eff) || [];
    Object.keys(edits).forEach(function (id) {
      var p = I.parse(id); if (!p || p.parts.length !== 1 || p.parts[0].kind !== 'l' || p.parts[0].fresh) return;
      var l = lines[p.parts[0].index], m = edits[id]; if (!l || !m) return; var pr = (l.pref && l.pref.panel) || 0;
      l.manual = clone(m);
      if (m.x != null && m.y != null) l.pref = { panel: pr, x: rnd(m.x), y: rnd(m.y) };
      if (m.tail && m.tail.tip) l.tail = { panel: pr, x: rnd(m.tail.tip.x), y: rnd(m.tail.tip.y) };
    });
    return lines;
  }
  /* 원본(회차 컴파일 결과) 기준 유효 대사 설정 — 지금 화면 상태를 건드리지 않고 읽는다 */
  function baseEffective(f, n) {
    var bo = S.base.bubbleObj(f.win(), f.ep), cb = f.compiled && f.compiled.bubbles, save = bo.cuts[n];
    if (cb && cb.cuts && cb.cuts[n]) bo.cuts[n] = clone(cb.cuts[n]); else delete bo.cuts[n];
    try { return f.engine().effective(n) || []; } finally { if (save === undefined) delete bo.cuts[n]; else bo.cuts[n] = save; }
  }

  /* ---------- 값 읽기 ---------- */
  function perim(it, ang) {
    var cx = it.x + it.w / 2, cy = it.y + it.h / 2, a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), hw = it.w / 2, hh = it.h / 2, t;
    if (it.kind === 'ellipse' || it.kind === 'jag') t = 1 / Math.pow(Math.pow(Math.abs(dx) / hw, 3) + Math.pow(Math.abs(dy) / hh, 3), 1 / 3); else t = Math.min(dx ? hw / Math.abs(dx) : 1e9, dy ? hh / Math.abs(dy) : 1e9);
    return { x: cx + dx * t, y: cy + dy * t };
  }
  function tailInfo(it) {
    if (!it.tip) return { tip: null }; var m = manualOf(it.src), t = m && m.tail, cx = it.x + it.w / 2, cy = it.y + it.h / 2;
    var ang = t && typeof t.start === 'number' ? t.start : Math.atan2(it.tip.y - cy, it.tip.x - cx) * 180 / Math.PI;
    return { tip: it.tip, start: perim(it, ang), ang: (ang + 360) % 360 };
  }
  function vals(it) {
    var m = manualOf(it.src) || {}, pr = it.panel, t = m.tail || {}, d = DEF[it.type] || DEF.speech, ti = tailInfo(it);
    var hasTail = !(t.on === false) && !!it.tip, dir = 0, len = 0;
    if (ti.tip) { dir = (Math.atan2(ti.tip.y - ti.start.y, ti.tip.x - ti.start.x) * 180 / Math.PI + 360) % 360; len = Math.hypot(ti.tip.x - ti.start.x, ti.tip.y - ti.start.y); }
    return { x: (it.x + it.w / 2 - pr.x) / pr.w * 100, y: (it.y + it.h / 2 - pr.y) / pr.h * 100, w: it.w / pr.w * 100, h: it.h / pr.h * 100, auto: !(m.h != null && m.h !== 'auto'),
      pad: m.pad != null ? m.pad : d.pad, radius: m.radius != null ? m.radius : d.radius, fs: m.fs != null ? m.fs : it.fs, lh: m.lh != null ? m.lh : (it.lh || d.lh),
      tail: hasTail, tstart: typeof t.start === 'number' ? t.start : null, tang: ti.ang || 0, dir: dir, len: len, thick: t.thick != null ? t.thick : 16, curve: t.curve != null ? t.curve : 0 };
  }
  function tipPct(it, p) { var pr = it.panel; return { x: rnd((p.x - pr.x) / pr.w * 100), y: rnd((p.y - pr.y) / pr.h * 100) }; }
  function pctPx(it, p) { var pr = it.panel; return { x: pr.x + pr.w * p.x / 100, y: pr.y + pr.h * p.y / 100 }; }
  function ensureTip(m, it) { m.tail = m.tail || {}; if (!m.tail.tip) { var ti = it.tip || { x: it.x + it.w / 2, y: it.y + it.h + 30 }; m.tail.tip = tipPct(it, ti); } delete m.tail.on; return m.tail; }

  /* ---------- 편집 (손댄 키만 저장) ---------- */
  function touch(fn, push, label) {
    var sel = selSrc(), its = sel == null ? [] : itemOf(sel); if (its.length !== 1) return; var it = its[0];
    var m = clone(manualOf(sel)) || {}; fn(m, it, vals(it));
    S.store.set('bubbles', lid(sel), m, { live: !push, label: label || ('말풍선 #' + no() + ' 대사 ' + (sel + 1)) });
  }
  function commit(label) { S.store.checkpoint(label || ('말풍선 #' + no() + ' 대사 ' + ((M.sel || 0) + 1)), { module: 'bubbles', ids: M.sel == null ? [] : [lid(M.sel)] }); }
  function polar(m, it, dirDeg, len) { var t = ensureTip(m, it), ti = tailInfo(Object.assign({}, it, { tip: pctPx(it, t.tip) })), a = dirDeg * Math.PI / 180; t.tip = tipPct(it, { x: ti.start.x + Math.cos(a) * len, y: ti.start.y + Math.sin(a) * len }); }
  function moveBy(m, it, c, dx, dy) { m.x = rnd(c.x + dx); m.y = rnd(c.y + dy); if (it.tip || (m.tail && m.tail.tip)) { var t = ensureTip(m, it); t.tip = { x: rnd(t.tip.x + dx), y: rnd(t.tip.y + dy) }; } }
  var SL = {
    gx: function (m, v, it, c) { moveBy(m, it, c, v - c.x, 0); }, gy: function (m, v, it, c) { moveBy(m, it, c, 0, v - c.y); },
    gw: function (m, v) { m.w = v; }, gh: function (m, v) { m.h = v; }, gp: function (m, v) { m.pad = v; }, gr: function (m, v) { m.radius = v; }, gf: function (m, v) { m.fs = v; }, gl: function (m, v) { m.lh = v; },
    tt: function (m, v, it) { ensureTip(m, it).thick = v; }, tc: function (m, v, it) { ensureTip(m, it).curve = v; }, ts: function (m, v, it) { ensureTip(m, it).start = v; },
    td: function (m, v, it, c) { polar(m, it, v, c.len); }, tl: function (m, v, it, c) { polar(m, it, c.dir, v); }
  };

  /* ---------- 오른쪽 속성 ---------- */
  function rng(id, label, min, max, step) { return '<label>' + label + '<input type="range" id="bb-' + id + '" min="' + min + '" max="' + max + '" step="' + step + '"><span class="v" id="bb-' + id + 'v"></span></label>'; }
  var HTML = '<section class="card"><h2>말풍선 선택</h2><div class="blist" id="bb-list"></div><div id="bb-who" class="info"></div></section>' +
    '<section class="card"><h2>위치·배치</h2><div class="chips" style="margin-bottom:6px"><button data-pre="in">컷 안</button><button data-pre="edgeTop">경계 위</button><button data-pre="edgeBottom">경계 아래</button><button data-pre="gap">컷 사이</button></div>' +
    rng('gx', '가로 위치', -10, 110, 0.1) + rng('gy', '세로 위치', -30, 130, 0.1) + '</section>' +
    '<section class="card"><h2>크기·모양</h2>' + rng('gw', '가로 폭 %', 10, 96, 0.5) +
    '<div class="row"><span class="lbl">높이</span><button id="bb-autoH">자동</button><button id="bb-manH">수동</button></div>' +
    rng('gh', '세로 높이 %', 6, 70, 0.5) + rng('gp', '내부 여백', 0, 30, 1) + rng('gr', '모서리', 0, 60, 1) + rng('gf', '글자 크기 px', 10, 30, 0.5) + rng('gl', '줄간격', 1, 2.2, 0.05) +
    '<p class="note">모서리 60 = 타원형(원래 모양). 글자·여백·모서리는 실제 화면 px, 가로·세로는 조각 대비 %. 가독성 기준(말 16px 등)은 편집기가 막지 않으니 확인하세요.</p></section>' +
    '<section class="card"><h2>꼬리</h2><div class="row"><span class="lbl">꼬리</span><button id="bb-tOn">있음</button><button id="bb-tOff">없음</button></div>' +
    rng('ts', '시작점 각도', 0, 359, 1) + '<div class="row"><span class="lbl">시작점</span><button id="bb-tsAuto">자동(끝점 쪽)</button></div>' +
    rng('td', '방향 °', 0, 359, 1) + rng('tl', '길이', 6, 260, 1) + rng('tt', '굵기', 4, 48, 1) + rng('tc', '곡선', -0.5, 0.5, 0.05) +
    '<p class="note">방향 0°=오른쪽, 90°=아래. 방향·길이는 시작점→끝점. 곡선 0 = 직선.</p></section>' +
    '<section class="card"><h2>말풍선만 초기화</h2><div class="chips"><button id="bb-rb">이 말풍선</button><button id="bb-rc">이 컷</button><button id="bb-ra">이 회차 전체</button></div></section>' +
    '<section class="card"><h2>전·후 수치</h2><div id="bb-diff" class="note">편집한 말풍선이 없습니다.</div></section>' +
    '<section class="card"><h2>적용용 패치</h2><div class="chips"><button id="bb-patch">패치 텍스트 만들기</button><button id="bb-copy">복사</button></div>' +
    '<textarea class="out" id="bb-out" spellcheck="false" placeholder="data/*-bubbles.js 의 cuts 항목 형식(본편 적용은 사용자 승인 후 별도 작업)"></textarea></section>';

  function q(id) { return document.getElementById('bb-' + id); }
  function bindPanel(el) {
    Object.keys(SL).forEach(function (id) { var e = q(id); e.addEventListener('input', function () { var v = +e.value; touch(function (m, it, c) { SL[id](m, v, it, c); }, false); }); e.addEventListener('change', function () { commit(); }); });
    q('autoH').onclick = function () { touch(function (m) { m.h = 'auto'; }, true); };
    q('manH').onclick = function () { touch(function (m, it, c) { m.h = rnd(c.h); }, true); };
    q('tOn').onclick = function () { touch(function (m, it) { ensureTip(m, it); }, true); };
    q('tOff').onclick = function () { touch(function (m) { m.tail = { on: false }; }, true); };
    q('tsAuto').onclick = function () { touch(function (m, it) { ensureTip(m, it).start = 'auto'; }, true); };
    el.querySelectorAll('[data-pre]').forEach(function (b) { b.onclick = function () { var p = b.dataset.pre;
      touch(function (m, it, c) { var ny = p === 'in' ? clamp(c.y, 18, 82) : p === 'edgeTop' ? 0 : p === 'edgeBottom' ? 100 : 108; moveBy(m, it, c, 0, ny - c.y); }, true); }; });
    q('list').onclick = function (e) { var b = e.target.closest('button'); if (b && !b.disabled) { M.sel = +b.dataset.sel; draw(); } };
    q('rb').onclick = function () { if (M.sel != null) S.store.reset({ module: 'bubbles', id: lid(M.sel) }, '말풍선 초기화'); };
    q('rc').onclick = function () { S.store.reset({ module: 'bubbles', cut: I.cut(no()) }, '말풍선 컷 초기화 #' + no()); };
    q('ra').onclick = function () { if (confirm('이 회차에서 편집한 말풍선을 모두 되돌릴까요?')) S.store.reset({ module: 'bubbles' }, '말풍선 회차 초기화'); };
    q('patch').onclick = function () { q('out').value = patchText(); };
    q('copy').onclick = function () { var t = q('out').value || patchText(); q('out').value = t; if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { U.toast('복사됨'); }, function () { q('out').select(); }); else q('out').select(); };
  }
  function fill() {
    var cut = S.api.cutData(), sel = selSrc(), its = sel == null ? [] : itemOf(sel), off = its.length !== 1 || S.stage.mode === 'before';
    M.el.querySelectorAll('input[type=range], [data-pre], #bb-autoH, #bb-manH, #bb-tOn, #bb-tOff, #bb-tsAuto, #bb-rb').forEach(function (e) { e.disabled = off; });
    var lines = (cut && cut.lines) || [];
    q('list').innerHTML = lines.map(function (l, i) { var n = itemOf(i).length; return '<button data-sel="' + i + '"' + (i === sel ? ' class="on"' : '') + (n ? '' : ' disabled') + '>' + (i + 1) + '. ' + U.esc((l.text || '').slice(0, 14)) + (manualOf(i) ? ' ✎' : '') + (n > 1 ? ' ⧉' : '') + '</button>'; }).join('') || '<span class="note">이 컷에는 대사가 없습니다</span>';
    if (sel == null || !its.length) { q('who').textContent = ''; return; }
    var l = lines[sel] || {};
    if (its.length > 1) { q('who').innerHTML = '대사 ' + (sel + 1) + ' · <b>' + U.esc(l.who || '(독백)') + '</b> · 여러 말풍선으로 나뉜 대사(⧉)는 아직 정밀 편집을 지원하지 않습니다'; return; }
    var it = its[0], v = vals(it);
    q('who').innerHTML = '대사 ' + (sel + 1) + '/' + lines.length + ' · <b>' + U.esc(l.who || '(독백)') + '</b> · ' + it.type + ' · <code>' + lid(sel) + '</code>' + (manualOf(sel) ? ' · 정밀값 적용' : ' · 자동 배치');
    var set = function (id, val, txt) { q(id).value = val; q(id + 'v').textContent = txt == null ? val : txt; };
    set('gx', clamp(v.x, -10, 110), rnd(v.x)); set('gy', clamp(v.y, -30, 130), rnd(v.y)); set('gw', clamp(v.w, 10, 96), rnd(v.w)); set('gh', clamp(v.h, 6, 70), rnd(v.h) + (v.auto ? ' 자동' : ''));
    q('autoH').classList.toggle('on', v.auto); q('manH').classList.toggle('on', !v.auto); if (!off) q('gh').disabled = v.auto;
    set('gp', v.pad); set('gr', v.radius, v.radius >= 60 ? '타원' : v.radius); set('gf', v.fs); set('gl', rnd(v.lh, 2));
    q('tOn').classList.toggle('on', v.tail); q('tOff').classList.toggle('on', !v.tail);
    set('ts', Math.round(v.tang), v.tstart == null ? '자동' : Math.round(v.tstart)); set('td', Math.round(v.dir)); set('tl', clamp(Math.round(v.len), 6, 260), Math.round(v.len)); set('tt', v.thick); set('tc', v.curve);
    if (!off) ['ts', 'td', 'tl', 'tt', 'tc', 'tsAuto'].forEach(function (id) { q(id).disabled = !v.tail; });
  }
  function draw() { refreshInfo(); if (M.el) { fill(); diffLater(); } S.emit('stage', {}); }

  /* 전·후 수치: 편집 전 배치를 잠깐 다시 계산해 비교(같은 엔진) */
  var diffLater = U.debounce(function () {
    if (!M.el || !q('diff')) return; var ed = S.store.inCut('bubbles', I.cut(no())), keys = Object.keys(ed);
    if (!keys.length || S.stage.mode === 'before') { q('diff').textContent = keys.length ? '' : '편집한 말풍선이 없습니다.'; return; }
    var f = S.stage.frame, bo = S.base.bubbleObj(f.win(), f.ep), n = no(), save = bo.cuts[n], after = f.info(n), cb = f.compiled.bubbles;
    if (cb && cb.cuts && cb.cuts[n]) bo.cuts[n] = clone(cb.cuts[n]); else delete bo.cuts[n];
    f.engine().rerunCut(n); var before = f.info(n); if (save === undefined) delete bo.cuts[n]; else bo.cuts[n] = save; f.engine().rerunCut(n);
    var pct = function (it) { var pr = it.panel; return [rnd((it.x + it.w / 2 - pr.x) / pr.w * 100), rnd((it.y + it.h / 2 - pr.y) / pr.h * 100), rnd(it.w / pr.w * 100), rnd(it.h / pr.h * 100)].join(' / '); };
    q('diff').innerHTML = '중심 x / y / 폭 / 높이 (조각 대비 %)<table class="tbl"><tr><th></th><th>전</th><th>후</th></tr>' + keys.map(function (id) { var i = I.parse(id).index, a = after.filter(function (x) { return x.src === i; })[0], b = before.filter(function (x) { return x.src === i; })[0]; return a && b ? '<tr><td>대사 ' + (i + 1) + '</td><td>' + pct(b) + '</td><td>' + pct(a) + '</td></tr>' : ''; }).join('') + '</table>';
  }, 450);

  /* ---------- 오버레이·드래그 ---------- */
  function drawOverlay(ov) {
    refreshInfo(); if (!M.info.length && !S.api.cutData()) { ov.innerHTML = ''; return; }
    var z = S.stage.zoom, sel = selSrc(), html = '';
    M.info.forEach(function (it) {
      var split = itemOf(it.src).length > 1, isSel = it.src === sel, p = S.stage.toOv(it.x, it.y);
      html += '<div class="hit' + (isSel ? ' sel' : '') + (manualOf(it.src) ? ' fixed' : '') + (split ? ' split' : '') + '" data-src="' + it.src + '" style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + it.w * z + 'px;height:' + it.h * z + 'px">' + (isSel ? '<span class="no">대사 ' + (it.src + 1) + '</span>' : '') + '</div>';
    });
    var cur = S.stage.mode !== 'before' && sel != null ? itemOf(sel) : [];
    if (cur.length === 1) {
      var it = cur[0], g = tailInfo(it), sz = S.stage.toOv(it.x + it.w, it.y + it.h);
      html += '<div class="h size" data-h="size" style="left:' + sz.x + 'px;top:' + sz.y + 'px"></div>';
      if (g.tip) { var a = S.stage.toOv(g.start.x, g.start.y), b = S.stage.toOv(g.tip.x, g.tip.y); html += '<div class="h start" data-h="start" style="left:' + a.x + 'px;top:' + a.y + 'px"></div><div class="h" data-h="tip" style="left:' + b.x + 'px;top:' + b.y + 'px"></div>'; }
    }
    ov.innerHTML = html;
  }
  function down(e) {
    if (S.state.panel !== 'bubbles') return;
    var h = e.target.closest('.h'), b = e.target.closest('.hit'); if (!h && !b) return; if (!document.getElementById('stage').contains(e.target)) return;
    if (b && !h) { var src = +b.dataset.src; if (itemOf(src).length > 1) { M.sel = src; draw(); U.toast('나뉜 대사는 아직 정밀 편집을 지원하지 않습니다'); return; } if (src !== M.sel) { M.sel = src; draw(); } }
    var its = itemOf(selSrc()); if (its.length !== 1) return; var it = its[0], p = S.stage.point(e);
    M.drag = { kind: h ? h.dataset.h : 'move', src: M.sel, ox: p.x - (it.x + it.w / 2), oy: p.y - (it.y + it.h / 2), moved: false };
    try { e.target.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault();
  }
  function move(e) {
    var d = M.drag; if (!d) return; var p = S.stage.point(e), it = itemOf(d.src)[0]; if (!it) return; var pr = it.panel, cx = it.x + it.w / 2, cy = it.y + it.h / 2;
    touch(function (m, it0, c) {
      if (d.kind === 'move') { var nx = p.x - d.ox, ny = p.y - d.oy; moveBy(m, it0, c, (nx - cx) / pr.w * 100, (ny - cy) / pr.h * 100); m.x = rnd((nx - pr.x) / pr.w * 100); m.y = rnd((ny - pr.y) / pr.h * 100); }
      else if (d.kind === 'tip') ensureTip(m, it0).tip = tipPct(it0, p);
      else if (d.kind === 'start') ensureTip(m, it0).start = Math.round((Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 360) % 360);
      else if (d.kind === 'size') { m.w = rnd(clamp((p.x - cx) * 2 / pr.w * 100, 10, 96)); var hh = clamp((p.y - cy) * 2 / pr.h * 100, 6, 70); if ((m.h != null && m.h !== 'auto') || Math.abs(hh - c.h) > 6) m.h = rnd(hh); }
      d.moved = true; }, false);
  }
  function up() { var d = M.drag; M.drag = null; if (d && d.moved) commit({ move: '말풍선 이동', tip: '꼬리 끝점', start: '꼬리 시작점', size: '말풍선 크기' }[d.kind] + ' #' + no()); }
  document.addEventListener('pointerdown', down); document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  var keyT = null;
  function onKey(e) {
    var mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!mv || e.ctrlKey || e.metaKey || e.altKey) return false;
    if (selSrc() == null || itemOf(M.sel).length !== 1) return false;
    e.preventDefault(); var step = e.shiftKey ? 1 : 0.2;
    touch(function (m, it, c) { moveBy(m, it, c, mv[0] * step, mv[1] * step); }, false);
    clearTimeout(keyT); keyT = setTimeout(function () { commit('말풍선 키보드 이동 #' + no()); }, 400); return true;
  }

  /* ---------- 패치 텍스트 ---------- */
  function jsLit(v) { if (v === null) return 'null'; if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; if (typeof v !== 'object') return String(v);
    if (Array.isArray(v)) return '[' + v.map(jsLit).join(', ') + ']'; return '{ ' + Object.keys(v).map(function (k) { return k + ': ' + jsLit(v[k]); }).join(', ') + ' }'; }
  function patchText() {
    var f = S.stage.frame, all = S.store.slice('bubbles'), byCut = {};
    Object.keys(all).forEach(function (id) { var n = I.cutNo(id); if (n != null) (byCut[n] = byCut[n] || {})[id] = all[id]; });
    var nos = Object.keys(byCut).map(Number).sort(function (a, b) { return a - b; }); if (!nos.length) return '// 편집한 말풍선이 없습니다.';
    var out = ['// ' + S.state.ep + ' 말풍선 편집 패치 — ' + U.today() + ' (마지막 접속 Studio)', '// data/' + S.state.ep + '-bubbles.js 의 cuts 안에서 해당 컷 번호 항목의 lines 를 아래로 바꾼다(zones·note 등 다른 키는 그대로 둔다).', '// manual 은 js/bubbles.js 가 읽는 정밀값. 편집하지 않은 대사는 현재 유효한 설정 그대로다. 본편 적용은 사용자 승인 후.', ''];
    nos.forEach(function (n) { if (!f.cut(n)) return; var lines = merge(baseEffective(f, n), byCut[n]); out.push('  ' + n + ': {', '    lines: ['); lines.forEach(function (l, i) { out.push('      ' + jsLit(l) + (i < lines.length - 1 ? ',' : '')); }); out.push('    ]', '  },'); });
    return out.join('\n');
  }

  U.addStyle('bubbles', '.ov .hit{position:absolute;border:1px dashed rgba(255,255,255,.35);cursor:grab}.ov .hit.sel{border:2px solid var(--sel);background:rgba(74,163,255,.08);z-index:3}' +
    '.ov .hit .no{position:absolute;left:-2px;top:-2px;transform:translateY(-100%);font:700 11px/1.2 sans-serif;background:var(--sel);color:#fff;padding:1px 5px;border-radius:6px;white-space:nowrap}' +
    '.ov .hit.fixed{border-color:#ffb020}.ov .hit.split{border-color:#ff6b6b;cursor:not-allowed}' +
    '.ov .h{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2px solid #fff;background:var(--sel);z-index:9;cursor:crosshair;touch-action:none}' +
    '.ov .h.start{border-radius:3px;background:#ffb020}.ov .h.size{border-radius:3px;background:#4cc38a;cursor:nwse-resize}' +
    '.blist{display:flex;flex-wrap:wrap;gap:6px}.blist button{text-align:left;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}');

  S.registerModule({
    id: 'bubbles', label: '말풍선', order: 10, owner: 'Claude Code', status: 'partial', level: 'cut',
    planned: ['위치·크기·꼬리 조절(완료, v2 이식)', '모양·글꼴·색상 변경', '말풍선 추가·삭제', '말풍선 분할·합치기', '분할 말풍선 각각의 독립 편집(ID c###.l#.b#)'],
    compileCut: function (ctx) {
      var cfg = clone(ctx.bubbles.cuts[ctx.no] || {}); cfg.lines = merge(ctx.engine.effective(ctx.no) || [], ctx.edits); ctx.bubbles.cuts[ctx.no] = cfg;
    },
    mount: function (el) { M.el = el; el.innerHTML = HTML; bindPanel(el); draw(); },
    unmount: function () { M.el = null; },
    onCut: function () { M.sel = null; draw(); },
    drawOverlay: function (ov) { drawOverlay(ov); if (M.el) fill(); if (M.el) diffLater(); },
    onKey: onKey,
    selection: function () { return M.sel == null ? null : lid(M.sel); },
    /* 테스트·통합용 */
    _: { merge: merge, patchText: patchText, vals: vals, state: M }
  });
})();
