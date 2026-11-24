/* 모듈: 말풍선 — 위치·크기·여백·모서리·글자·꼬리 + 추가·삭제·분할·합치기 (담당: Claude Code · 2단계 A)
 * 규격 문서: docs/studio/bubbles.md (대사 연동은 docs/studio/dialogue.md)
 * 편집값: edits.bubbles[대사 ID] = manual  — 대사 ID('c024.l0', 새 대사 'c024.l~k3f9a', 분할 조각 'c024.l0.b1')로 연결되므로
 *   대사를 추가·삭제·재배열·분할해도 말풍선 설정이 다른 대사로 옮겨 붙지 않는다.
 *   manual = { x, y (말풍선 중심, 조각 대비 %), w (%), h (% | 'auto'), pad, radius (px, 60=타원), fs (px), lh,
 *              tail: { on:false } | { tip:{x,y}(%), start: 각도|'auto', thick: px, curve: -0.5~0.5 } }
 * 렌더러 연동: level 'cut' — compileCut 이 그 컷의 말풍선 설정 lines 에 manual 을 넣는다(엔진이 배치 후 적용).
 * 대사 구조(추가·삭제·분할·순서)는 dialogue 모듈이 데이터로 만든다. 이 모듈은 ID→줄 번호 대응을 컴파일된 줄의 sid 로 읽는다.
 * 렌더러가 읽지 않는 것(모양 종류·글꼴·글자 색·배경색)은 편집하지 않는다 — docs/studio/requests/20261124-bubbles-style.md */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  var DEF = { speech: { pad: 6, radius: 60, lh: 1.42 }, offscreen: { pad: 6, radius: 60, lh: 1.42 }, phone: { pad: 8, radius: 60, lh: 1.42 }, mono: { pad: 12, radius: 2, lh: 1.55 }, caption: { pad: 9, radius: 0, lh: 1.35 } };
  var M = { sel: null, info: [], ids: [], el: null, drag: null };
  var rnd = U.rnd, clamp = U.clamp, clone = U.clone;

  function no() { return S.state.cut; }
  function D() { return S.modules.dialogue; }
  /* 컴파일된(지금 화면의) 컷 줄 → 대사 ID. 대사 편집이 없는 컷은 원본 순서 ID */
  function liveIds(frame, n, ep) {
    var cd = frame.win().WEBTOON.episodeData[ep || frame.ep], cut = cd && cd.cuts.filter(function (c) { return c.no === n; })[0];
    return cut ? (cut.lines || []).map(function (l, k) { return l.sid || I.line(n, k); }) : [];
  }
  function liveLines(frame, n) { var cd = frame.win().WEBTOON.episodeData[frame.ep], cut = cd && cd.cuts.filter(function (c) { return c.no === n; })[0]; return cut ? (cut.lines || []) : []; }
  function manualOf(id) { return S.store.get('bubbles', id); }
  function itemOf(id) { return M.info.filter(function (i) { return i.id === id; }); }
  function selId() { var v = M.info.map(function (i) { return i.id; }); if (M.sel == null || v.indexOf(M.sel) < 0) M.sel = v.length ? v[0] : null; return M.sel; }
  function refreshInfo() {
    var f = S.stage.frame, n = no(); M.ids = f.compiled ? liveIds(f, n) : [];
    M.info = f.section(n) ? f.info(n).map(function (it) { return Object.assign({}, it, { id: M.ids[it.src] || I.line(n, it.src) }); }) : [];
  }

  /* 편집값 → 말풍선 설정 lines (화면 배치와 패치 내보내기가 같이 쓴다). ids[k] = k번째 줄의 대사 ID */
  function merge(eff, edits, ids) {
    var lines = clone(eff) || [];
    Object.keys(edits).forEach(function (id) {
      var k = ids.indexOf(id), l = k < 0 ? null : lines[k], m = edits[id]; if (!l || !m) return; var pr = (l.pref && l.pref.panel) || 0;
      l.manual = clone(m);
      if (m.x != null && m.y != null) l.pref = { panel: pr, x: rnd(m.x), y: rnd(m.y) };
      if (m.tail && m.tail.tip) l.tail = { panel: pr, x: rnd(m.tail.tip.x), y: rnd(m.tail.tip.y) };
    });
    return lines;
  }
  /* 한 컷의 (대사 구조 편집까지 반영한) 말풍선 기본 설정과 줄 ID — 말풍선 편집 전 */
  function baseConfig(f, n) {
    var d = D(), fc = d && d.finalConfig(f, n, S.state.ep);
    if (fc) return { lines: fc.lines, ids: fc.ids };
    var bd = S.base.data(S.state.ep), cut = S.base.cut(S.state.ep, n), cfg = bd.bubbles && bd.bubbles.cuts && bd.bubbles.cuts[n];
    return { lines: d.effectiveWith(f, n, clone(cut.lines || []), cfg ? clone(cfg) : null) || [], ids: (cut.lines || []).map(function (l, k) { return I.line(n, k); }) };
  }

  /* ---------- 값 읽기 ---------- */
  function perim(it, ang) {
    var cx = it.x + it.w / 2, cy = it.y + it.h / 2, a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), hw = it.w / 2, hh = it.h / 2, t;
    if (it.kind === 'ellipse' || it.kind === 'jag') t = 1 / Math.pow(Math.pow(Math.abs(dx) / hw, 3) + Math.pow(Math.abs(dy) / hh, 3), 1 / 3); else t = Math.min(dx ? hw / Math.abs(dx) : 1e9, dy ? hh / Math.abs(dy) : 1e9);
    return { x: cx + dx * t, y: cy + dy * t };
  }
  function tailInfo(it) {
    if (!it.tip) return { tip: null }; var m = manualOf(it.id), t = m && m.tail, cx = it.x + it.w / 2, cy = it.y + it.h / 2;
    var ang = t && typeof t.start === 'number' ? t.start : Math.atan2(it.tip.y - cy, it.tip.x - cx) * 180 / Math.PI;
    return { tip: it.tip, start: perim(it, ang), ang: (ang + 360) % 360 };
  }
  function vals(it) {
    var m = manualOf(it.id) || {}, pr = it.panel, t = m.tail || {}, d = DEF[it.type] || DEF.speech, ti = tailInfo(it);
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
    var sel = selId(), its = sel == null ? [] : itemOf(sel); if (its.length !== 1) return; var it = its[0];
    var m = clone(manualOf(sel)) || {}; fn(m, it, vals(it));
    S.store.set('bubbles', sel, m, { live: !push, label: label || ('말풍선 #' + no() + ' ' + sel) });
  }
  function commit(label) { S.store.checkpoint(label || ('말풍선 #' + no() + ' ' + (M.sel || '')), { module: 'bubbles', ids: M.sel == null ? [] : [M.sel] }); }
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
  var HTML = '<section class="card"><h2>말풍선 선택</h2><div class="blist" id="bb-list"></div><div id="bb-who" class="info"></div>' +
    '<div class="chips" style="margin-top:8px"><button id="bb-add" title="새 대사와 말풍선을 추가">말풍선 추가</button><button id="bb-delete">삭제</button><button id="bb-split" title="글자를 문장·공백 기준 가운데에서 나눔(정확한 위치는 대사 메뉴)">분할</button><button id="bb-merge" title="다음 말풍선과 합침">합치기</button><button id="bb-confirm" title="엔진이 자동으로 나눠 그리는 대사를 조각 말풍선으로 확정">자동 분할 확정</button></div>' +
    '<div id="bb-addform" class="dl-form" hidden style="margin-top:8px"><label>화자<input type="text" id="bb-nwho" placeholder="(독백은 비워 둠)"></label><label>내용<textarea id="bb-ntext" spellcheck="false" style="width:100%;min-height:60px"></textarea></label><div class="chips"><button id="bb-addok">추가</button><button id="bb-addcancel">취소</button></div></div>' +
    '<p class="note">추가·삭제·분할·합치기는 대사 구조를 바꾸는 편집이라 대사 메뉴에서도 같은 기능을 쓸 수 있습니다. 모두 편집값으로만 저장됩니다(원본 대사 불변).</p></section>' +
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
    '<section class="card"><h2>모양 종류·글꼴·색 <small class="warn">렌더러 대기</small></h2><p class="note">말풍선 모양 종류, 글꼴, 글자 색, 배경색은 독자 렌더러(js/bubbles.js)가 아직 읽지 못해 편집할 수 없습니다. 필요한 데이터 규격은 <code>docs/studio/requests/20261124-bubbles-style.md</code> 에 요청했습니다(모서리·글자 크기·줄간격은 위에서 편집 가능).</p></section>' +
    '<section class="card"><h2>말풍선만 초기화</h2><div class="chips"><button id="bb-rb">이 말풍선</button><button id="bb-rc">이 컷</button><button id="bb-ra">이 회차 전체</button></div><div id="bb-orph" class="note"></div></section>' +
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
    q('list').onclick = function (e) { var b = e.target.closest('button'); if (b && !b.disabled) { M.sel = b.dataset.sel; var d = D(); if (d && d.selectLine) d.selectLine(M.sel); draw(); } };
    q('rb').onclick = function () { if (M.sel != null) S.store.reset({ module: 'bubbles', id: M.sel }, '말풍선 초기화'); };
    q('rc').onclick = function () { S.store.reset({ module: 'bubbles', cut: I.cut(no()) }, '말풍선 컷 초기화 #' + no()); };
    q('ra').onclick = function () { if (confirm('이 회차에서 편집한 말풍선을 모두 되돌릴까요?')) S.store.reset({ module: 'bubbles' }, '말풍선 회차 초기화'); };
    q('patch').onclick = function () { q('out').value = patchText(); };
    q('copy').onclick = function () { var t = q('out').value || patchText(); q('out').value = t; if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { U.toast('복사됨'); }, function () { q('out').select(); }); else q('out').select(); };
    /* 대사 구조 편집(dialogue 모듈 API) */
    q('add').onclick = function () { q('addform').hidden = !q('addform').hidden; if (!q('addform').hidden) q('ntext').focus(); };
    q('addcancel').onclick = function () { q('addform').hidden = true; };
    q('addok').onclick = function () { var id = D().addLine({ no: no(), after: M.sel, who: q('nwho').value, text: q('ntext').value, style: 'speech' }); if (id) { M.sel = id; q('addform').hidden = true; q('ntext').value = ''; } };
    q('ntext').addEventListener('keydown', function (e) { e.stopPropagation(); }); q('nwho').addEventListener('keydown', function (e) { e.stopPropagation(); });
    q('delete').onclick = function () { if (M.sel != null) { var ids = M.ids, k = ids.indexOf(M.sel); D().deleteLine(M.sel); M.sel = ids[k + 1] || ids[k - 1] || null; } };
    q('split').onclick = function () { if (M.sel != null) { var cur = M.sel, nid = D().split(cur, null); if (nid && !/\.b(?:\d+|~[a-z0-9]+)$/.test(cur)) M.sel = cur + '.b0'; } };   /* 나눈 뒤 왼쪽 조각을 선택(바로 다시 합칠 수 있게) */
    q('merge').onclick = function () { if (M.sel != null) D().mergeNext(M.sel); };
    q('confirm').onclick = function () { if (M.sel != null) D().confirmSplit(M.sel); };
  }
  function fill() {
    var sel = selId(), its = sel == null ? [] : itemOf(sel), off = its.length !== 1 || S.stage.mode === 'before';
    M.el.querySelectorAll('input[type=range], [data-pre], #bb-autoH, #bb-manH, #bb-tOn, #bb-tOff, #bb-tsAuto, #bb-rb').forEach(function (e) { e.disabled = off; });
    var f = S.stage.frame, lines = f.compiled ? liveLines(f, no()) : [], ids = M.ids;
    q('list').innerHTML = ids.map(function (id, i) { var n = itemOf(id).length, l = lines[i] || {}; return '<button data-sel="' + id + '"' + (id === sel ? ' class="on"' : '') + (n ? '' : ' disabled') + '>' + (i + 1) + '. ' + U.esc((l.text || '').replace(/\n/g, ' ').slice(0, 14)) + (manualOf(id) ? ' ✎' : '') + (n > 1 ? ' ⧉' : '') + '</button>'; }).join('') || '<span class="note">이 컷에는 대사가 없습니다</span>';
    var idx = ids.indexOf(sel), l0 = lines[idx] || {};
    var d = D(), isAuto = its.length > 1; q('confirm').hidden = !isAuto; q('delete').disabled = sel == null; q('split').disabled = sel == null; q('merge').disabled = sel == null || idx < 0 || idx >= ids.length - 1;
    var orph = Object.keys(S.store.inCut('bubbles', I.cut(no()))).filter(function (id) { return ids.indexOf(id) < 0; });
    q('orph').textContent = orph.length ? '연결된 대사가 없는 말풍선 편집 ' + orph.length + '개(' + orph.join(', ') + ') — 보존됨. 그 대사를 복원하면 다시 적용됩니다.' : '';
    if (sel == null || !its.length) { q('who').textContent = ''; return; }
    if (its.length > 1) { q('who').innerHTML = '대사 ' + (idx + 1) + ' · <b>' + U.esc(l0.who || '(독백)') + '</b> · 엔진이 여러 말풍선으로 자동 분할해 그리는 대사(⧉) — <b>자동 분할 확정</b>을 누르면 조각마다 정밀 편집할 수 있습니다'; return; }
    var it = its[0], v = vals(it);
    q('who').innerHTML = '대사 ' + (idx + 1) + '/' + lines.length + ' · <b>' + U.esc(l0.who || '(독백)') + '</b> · ' + it.type + ' · <code>' + sel + '</code>' + (manualOf(sel) ? ' · 정밀값 적용' : ' · 자동 배치');
    var set = function (id, val, txt) { q(id).value = val; q(id + 'v').textContent = txt == null ? val : txt; };
    set('gx', clamp(v.x, -10, 110), rnd(v.x)); set('gy', clamp(v.y, -30, 130), rnd(v.y)); set('gw', clamp(v.w, 10, 96), rnd(v.w)); set('gh', clamp(v.h, 6, 70), rnd(v.h) + (v.auto ? ' 자동' : ''));
    q('autoH').classList.toggle('on', v.auto); q('manH').classList.toggle('on', !v.auto); if (!off) q('gh').disabled = v.auto;
    set('gp', v.pad); set('gr', v.radius, v.radius >= 60 ? '타원' : v.radius); set('gf', v.fs); set('gl', rnd(v.lh, 2));
    q('tOn').classList.toggle('on', v.tail); q('tOff').classList.toggle('on', !v.tail);
    set('ts', Math.round(v.tang), v.tstart == null ? '자동' : Math.round(v.tstart)); set('td', Math.round(v.dir)); set('tl', clamp(Math.round(v.len), 6, 260), Math.round(v.len)); set('tt', v.thick); set('tc', v.curve);
    if (!off) ['ts', 'td', 'tl', 'tt', 'tc', 'tsAuto'].forEach(function (id) { q(id).disabled = !v.tail; });
  }
  function draw() { refreshInfo(); if (M.el) { fill(); diffLater(); } S.emit('stage', {}); }

  /* 전·후 수치: 말풍선 편집 전 배치를 잠깐 다시 계산해 비교(같은 엔진) */
  var diffLater = U.debounce(function () {
    if (!M.el || !q('diff')) return; var ed = S.store.inCut('bubbles', I.cut(no())), keys = Object.keys(ed);
    if (!keys.length || S.stage.mode === 'before') { q('diff').textContent = keys.length ? '' : '편집한 말풍선이 없습니다.'; return; }
    var f = S.stage.frame, bo = S.base.bubbleObj(f.win(), f.ep), n = no(), save = bo.cuts[n], after = f.info(n), ids = liveIds(f, n), cb = f.compiled.bubbles;
    if (cb && cb.cuts && cb.cuts[n]) bo.cuts[n] = clone(cb.cuts[n]); else delete bo.cuts[n];
    f.engine().rerunCut(n); var before = f.info(n); if (save === undefined) delete bo.cuts[n]; else bo.cuts[n] = save; f.engine().rerunCut(n);
    var pct = function (it) { var pr = it.panel; return [rnd((it.x + it.w / 2 - pr.x) / pr.w * 100), rnd((it.y + it.h / 2 - pr.y) / pr.h * 100), rnd(it.w / pr.w * 100), rnd(it.h / pr.h * 100)].join(' / '); };
    q('diff').innerHTML = '중심 x / y / 폭 / 높이 (조각 대비 %)<table class="tbl"><tr><th></th><th>전</th><th>후</th></tr>' + keys.map(function (id) { var i = ids.indexOf(id), a = after.filter(function (x) { return x.src === i; })[0], b = before.filter(function (x) { return x.src === i; })[0]; return a && b ? '<tr><td>' + (i + 1) + '번 ' + id.replace(/^c\d+\./, '') + '</td><td>' + pct(b) + '</td><td>' + pct(a) + '</td></tr>' : ''; }).join('') + '</table>';
  }, 450);

  /* ---------- 오버레이·드래그 ---------- */
  function drawOverlay(ov) {
    refreshInfo(); if (!M.info.length && !S.api.cutData()) { ov.innerHTML = ''; return; }
    var z = S.stage.zoom, sel = selId(), html = '';
    M.info.forEach(function (it) {
      var split = itemOf(it.id).length > 1, isSel = it.id === sel, p = S.stage.toOv(it.x, it.y), k = M.ids.indexOf(it.id);
      html += '<div class="hit' + (isSel ? ' sel' : '') + (manualOf(it.id) ? ' fixed' : '') + (split ? ' split' : '') + '" data-id="' + it.id + '" data-src="' + it.src + '" style="left:' + p.x + 'px;top:' + p.y + 'px;width:' + it.w * z + 'px;height:' + it.h * z + 'px">' + (isSel ? '<span class="no">대사 ' + (k + 1) + '</span>' : '') + '</div>';
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
    if (b && !h) { var id = b.dataset.id; if (itemOf(id).length > 1) { M.sel = id; draw(); U.toast('자동 분할 대사 — "자동 분할 확정"을 누르면 조각마다 편집할 수 있습니다'); return; } if (id !== M.sel) { M.sel = id; draw(); } }
    var its = itemOf(selId()); if (its.length !== 1) return; var it = its[0], p = S.stage.point(e);
    M.drag = { kind: h ? h.dataset.h : 'move', id: M.sel, ox: p.x - (it.x + it.w / 2), oy: p.y - (it.y + it.h / 2), moved: false };
    try { e.target.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault();
  }
  function move(e) {
    var d = M.drag; if (!d) return; var p = S.stage.point(e), it = itemOf(d.id)[0]; if (!it) return; var pr = it.panel, cx = it.x + it.w / 2, cy = it.y + it.h / 2;
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
    if (selId() == null || itemOf(M.sel).length !== 1) return false;
    e.preventDefault(); var step = e.shiftKey ? 1 : 0.2;
    touch(function (m, it, c) { moveBy(m, it, c, mv[0] * step, mv[1] * step); }, false);
    clearTimeout(keyT); keyT = setTimeout(function () { commit('말풍선 키보드 이동 #' + no()); }, 400); return true;
  }

  /* ---------- 패치 텍스트 ---------- */
  function jsLit(v) { if (v === null) return 'null'; if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'"; if (typeof v !== 'object') return String(v);
    if (Array.isArray(v)) return '[' + v.map(jsLit).join(', ') + ']'; return '{ ' + Object.keys(v).map(function (k) { return k + ': ' + jsLit(v[k]); }).join(', ') + ' }'; }
  function cutsToPatch() {
    var nos = {}; ['bubbles', 'dialogue'].forEach(function (m) { Object.keys(S.store.slice(m)).forEach(function (id) { var n = I.cutNo(id); if (n != null) nos[n] = 1; }); });
    return Object.keys(nos).map(Number).sort(function (a, b) { return a - b; }).filter(function (n) { return !!S.stage.frame.cut(n); });
  }
  function finalLines(n) {   /* 편집 전 기본 설정 + 말풍선 manual */
    var f = S.stage.frame, base = baseConfig(f, n), ed = S.store.inCut('bubbles', I.cut(n));
    return { lines: merge(base.lines, ed, base.ids), ids: base.ids, edited: Object.keys(ed).length > 0 };
  }
  function patchText() {
    var dl = D(), nos = cutsToPatch().filter(function (n) { var fl = finalLines(n); var p = dl.plan(n); return fl.edited || (p && !p.identity); });
    if (!nos.length) return '// 편집한 말풍선이 없습니다.';
    var out = ['// ' + S.state.ep + ' 말풍선 편집 패치 — ' + U.today() + ' (마지막 접속 Studio)', '// data/' + S.state.ep + '-bubbles.js 의 cuts 안에서 해당 컷 번호 항목의 lines 를 아래로 바꾼다(zones·note 등 다른 키는 그대로 둔다).', '// manual 은 js/bubbles.js 가 읽는 정밀값. 편집하지 않은 대사는 현재 유효한 설정 그대로다. 본편 적용은 사용자 승인 후.', '// 대사를 추가·삭제·분할·재배열한 컷은 data/' + S.state.ep + '.js 의 lines 도 대사 패치(대사 메뉴)로 같이 바꿔야 줄 순서가 맞는다.', ''];
    nos.forEach(function (n) { var fl = finalLines(n), p = dl.plan(n); out.push('  ' + n + ': {' + (p && !p.identity ? '   // 대사 구조 변경 — 줄 순서: ' + fl.ids.map(function (x) { return x.replace(/^c\d+\./, ''); }).join(' ') : ''), '    lines: ['); fl.lines.forEach(function (l, i) { out.push('      ' + jsLit(l) + (i < fl.lines.length - 1 ? ',' : '')); }); out.push('    ]', '  },'); });
    return out.join('\n');
  }

  /* ---------- 원화 변형 연동: 꼬리 끝점 변환 ----------
   * transformTips(panelId, T, opt)  panelId 'c033.p1' · T = { scale=1, x=0, y=0 (이동, 패널 %), rotate=0 (시계 방향 °), flipX, flipY, origin:{x:50,y:50} }
   * 변환 순서: 뒤집기 → 확대 → 회전 → 이동(원점 기준). 패널의 실제 가로·세로(px)로 회전해 찌그러지지 않는다.
   * 변환 대상은 '지금 화면에 그려진 꼬리 끝점'(엔진이 그린 결과)이다 — 원화 속 인물에 붙은 점이므로 원화가 움직이면 같이 움직인다.
   *   보이는 컷이면 편집 화면, 아니면 썸네일 렌더러를 쓴다. 렌더 결과가 없거나 opt.source:'config'·opt.size 를 주면 말풍선 설정의 꼬리 목표점(config)을 쓴다.
   * 반환 { panelId, source:'rendered'|'config', moved:[{id,from,to,outside}], skipped:[{id,reason}] }
   *   opt.apply 가 true 면 편집값(말풍선 tail.tip)에 쓰고 실행 취소 한 단계로 저장. 패널 % 레이어(말풍선 위치 등)는 건드리지 않는다. */
  function ratioOf(s) { var m = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/.exec(String(s || '')); return m ? { w: +m[1], h: +m[2] } : { w: 1, h: 1 }; }
  function applyT(p, T, size) {
    var o = T.origin || { x: 50, y: 50 }, x = (p.x - o.x) / 100 * size.w, y = (p.y - o.y) / 100 * size.h;
    if (T.flipX) x = -x; if (T.flipY) y = -y;
    var s = T.scale == null ? 1 : T.scale; x *= s; y *= s;
    var a = (T.rotate || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), rx = x * c - y * sn, ry = x * sn + y * c;
    return { x: rnd(o.x + rx / size.w * 100 + (T.x || 0), 2), y: rnd(o.y + ry / size.h * 100 + (T.y || 0), 2) };
  }
  /* 꼬리 끝점을 읽을 렌더 결과: 지금 편집 화면에 보이는 컷이면 그 화면, 아니면 썸네일 렌더러(모든 컷이 보이고 항상 편집 반영, 편집 직후 1초쯤 늦을 수 있다).
   * 숨겨진 컷은 패널 크기를 잴 수 없어서 쓰지 않는다. */
  function visibleIn(f, n) { var sec = f && f.compiled && f.section(n); if (!sec) return false; var r = sec.getBoundingClientRect(); return r.width > 0 && r.height > 0 && f.info(n).length > 0 && f.info(n)[0].panel.w > 0; }
  function renderedFrame(n) {
    var m = S.stage.frame, t = S.timeline && S.timeline.frame && S.timeline.frame();
    if (m.edits && m.cur === n && visibleIn(m, n)) return m; if (t && t.edits !== false && visibleIn(t, n)) return t; return null;
  }
  function transformTips(panelId, T, opt) {
    opt = opt || {}; T = T || {}; var p = I.parse(panelId); if (!p || !p.parts.length || p.parts[0].kind !== 'p' || p.parts[0].fresh) throw new Error('패널 ID 가 아닙니다: ' + panelId);
    var n = p.cut, pi = p.parts[0].index, cut = S.base.cut(S.state.ep, n); if (!cut) throw new Error('컷이 없습니다: ' + panelId);
    var fl = finalLines(n), out = { panelId: panelId, source: 'config', moved: [], skipped: [] }, f = (opt.size || opt.source === 'config') ? null : renderedFrame(n);
    function push(id, from, size) { var to = applyT(from, T, size); out.moved.push({ id: id, from: { x: rnd(from.x, 2), y: rnd(from.y, 2) }, to: to, outside: to.x < 0 || to.x > 100 || to.y < 0 || to.y > 100 }); }
    if (f) {
      out.source = 'rendered'; var ids = liveIds(f, n);
      f.info(n).forEach(function (it) {
        var k = it.src, l = fl.lines[k] || {}, m = l.manual || {}, pr = (l.pref && l.pref.panel) || 0, tp = l.tail && l.tail.panel != null ? l.tail.panel : pr, id = ids[k] || I.line(n, k);
        if (tp !== pi) return; if (m.tail && m.tail.on === false) { out.skipped.push({ id: id, reason: '꼬리 없음' }); return; }
        if (!it.tip) { out.skipped.push({ id: id, reason: '꼬리가 그려지지 않음(독백·자막·이어 붙은 말풍선)' }); return; }
        push(id, { x: (it.tip.x - it.panel.x) / it.panel.w * 100, y: (it.tip.y - it.panel.y) / it.panel.h * 100 }, { w: it.panel.w, h: it.panel.h });
      });
    } else {
      var pn = S.base.panelsOf(cut)[pi], size = opt.size || ratioOf((pn && pn.ratio) || cut.ratio);
      fl.lines.forEach(function (l, k) {
        var id = fl.ids[k], m = l.manual || {}, pr = (l.pref && l.pref.panel) || 0, tail = (m.tail && m.tail.tip) ? { panel: pr, x: m.tail.tip.x, y: m.tail.tip.y } : l.tail, tp = tail && tail.panel != null ? tail.panel : pr; if (tp !== pi) return;
        if (m.tail && m.tail.on === false) { out.skipped.push({ id: id, reason: '꼬리 없음' }); return; }
        if (!tail || tail.x == null) { out.skipped.push({ id: id, reason: '설정에 꼬리 끝점이 없음' }); return; }
        push(id, { x: tail.x, y: tail.y }, size);
      });
    }
    if (opt.apply && out.moved.length) {
      out.moved.forEach(function (mv) { S.store.patch('bubbles', mv.id, function (m) { m.tail = m.tail || {}; delete m.tail.on; m.tail.tip = { x: mv.to.x, y: mv.to.y }; }, { live: true }); });
      S.store.checkpoint(opt.label || ('꼬리 끝점 연동 ' + panelId), { module: 'bubbles', ids: out.moved.map(function (x) { return x.id; }) });
    }
    return out;
  }

  U.addStyle('bubbles', '.ov .hit{position:absolute;border:1px dashed rgba(255,255,255,.35);cursor:grab}.ov .hit.sel{border:2px solid var(--sel);background:rgba(74,163,255,.08);z-index:3}' +
    '.ov .hit .no{position:absolute;left:-2px;top:-2px;transform:translateY(-100%);font:700 11px/1.2 sans-serif;background:var(--sel);color:#fff;padding:1px 5px;border-radius:6px;white-space:nowrap}' +
    '.ov .hit.fixed{border-color:#ffb020}.ov .hit.split{border-color:#ff6b6b;cursor:not-allowed}' +
    '.ov .h{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;border:2px solid #fff;background:var(--sel);z-index:9;cursor:crosshair;touch-action:none}' +
    '.ov .h.start{border-radius:3px;background:#ffb020}.ov .h.size{border-radius:3px;background:#4cc38a;cursor:nwse-resize}' +
    '.blist{display:flex;flex-wrap:wrap;gap:6px}.blist button{text-align:left;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}');

  S.registerModule({
    id: 'bubbles', label: '말풍선', order: 10, owner: 'Claude Code', status: 'partial', level: 'cut',
    planned: [],
    compileCut: function (ctx) {
      var cd = ctx.win.WEBTOON.episodeData[ctx.ep], cut = cd.cuts.filter(function (c) { return c.no === ctx.no; })[0], ids = (cut.lines || []).map(function (l, k) { return l.sid || I.line(ctx.no, k); });
      var cfg = clone(ctx.bubbles.cuts[ctx.no] || {}); cfg.lines = merge(ctx.engine.effective(ctx.no) || [], ctx.edits, ids); ctx.bubbles.cuts[ctx.no] = cfg;
    },
    mount: function (el) { M.el = el; el.innerHTML = HTML; bindPanel(el); draw(); },
    unmount: function () { M.el = null; },
    onCut: function (n) { if (n !== M.cut) { M.sel = null; M.cut = n; } draw(); },   /* 같은 컷을 다시 고르면(폭·모드 전환) 선택을 유지한다 */
    drawOverlay: function (ov) { drawOverlay(ov); if (M.el) fill(); if (M.el) diffLater(); },
    onKey: onKey,
    selection: function () { return M.sel == null ? null : M.sel; },
    selectLine: function (id) { M.sel = id; },
    selectedId: function () { return M.sel; },
    transformTips: transformTips,
    /* 테스트·통합용 */
    _: { merge: merge, patchText: patchText, vals: vals, state: M, liveIds: function () { return liveIds(S.stage.frame, no()); } }
  });
})();
