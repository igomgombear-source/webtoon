/* 렌더러 연동 — 실제 독자 화면(index.html + js/app.js + js/bubbles.js + js/screenui.js)을 iframe 으로 띄우고
 * '원본 사본 + 편집값'으로 만든 데이터를 넣어 다시 그린다. 편집기 전용 근사 렌더링은 없다. (통합 담당 전용 파일)
 *
 * 모듈 등록: S.registerModule({ id, label, level:'episode'|'cut'|'none', compile(ctx), compileCut(ctx), ... })
 *   level 'episode' : compile(ctx) 가 ctx.data(episode·screens·bubbles 사본)를 고친다 → 회차 전체를 다시 그린다(느림, 1~2초)
 *   level 'cut'     : 회차를 그린 뒤 compileCut(ctx) 가 그 컷의 말풍선 설정(ctx.bubbles.cuts[no])을 고친다 → 그 컷만 다시 배치(빠름)
 * 편집이 없으면 원본 사본 그대로 그리므로 독자 화면과 HTML 이 같다(숨김 컷도 그려서 편집할 수 있게 한다는 점만 다름). */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;

  /* ---------- 모듈 등록 ---------- */
  S.modules = {}; S.moduleList = [];
  S.registerModule = function (def) {
    if (!def || !def.id || S.modules[def.id]) throw new Error('모듈 ID 가 없거나 중복: ' + (def && def.id));
    def.level = def.level || 'none'; def.order = def.order == null ? 50 : def.order; def.status = def.status || 'planned';
    S.modules[def.id] = def; S.moduleList.push(def); S.moduleList.sort(function (a, b) { return a.order - b.order; });
    return def;
  };
  /* 컴파일 순서: order 값 순서 + after:[모듈ID] 의존(그 모듈 다음에 실행). 의존 대상이 없거나 순환이면 issues 에 남기고 order 순서로 둔다 */
  var orderIssues = [];
  function sorted(list) {
    var ids = list.map(function (m) { return m.id; }), out = [], state = {}; orderIssues = orderIssues.filter(function (x) { return ids.indexOf(x.module) < 0; });
    function visit(m, path) {
      if (state[m.id] === 2) return; if (state[m.id] === 1) { orderIssues.push({ module: m.id, issue: '순환 의존: ' + path.concat(m.id).join(' → ') }); return; }
      state[m.id] = 1;
      (m.after || []).forEach(function (d) { var dm = list.filter(function (x) { return x.id === d; })[0]; if (dm) visit(dm, path.concat(m.id)); else if (!S.modules[d]) orderIssues.push({ module: m.id, issue: '없는 모듈 다음으로 지정: ' + d }); else if (S.modules[d].level !== m.level) orderIssues.push({ module: m.id, issue: d + ' 는 다른 단계(' + S.modules[d].level + ') 모듈 — 회차 단계가 항상 먼저 실행됨' }); });
      state[m.id] = 2; out.push(m);
    }
    list.forEach(function (m) { visit(m, []); });
    return out;
  }
  function epModules() { return sorted(S.moduleList.filter(function (m) { return m.level === 'episode' && m.compile; })); }
  function cutModules() { return sorted(S.moduleList.filter(function (m) { return m.level === 'cut' && m.compileCut; })); }

  var meta = function (n, d) { var e = document.querySelector('meta[name="' + n + '"]'); return e ? e.getAttribute('content') : d; };
  var ROOT = meta('studio-root', '../../'), VIEWER = meta('studio-viewer', 'index.html');
  var STYLE = 'html.st-on, html.st-on body { overflow:hidden !important; }' +
    'html.st-on .topbar, html.st-on .ep-head, html.st-on .ep-silence, html.st-on .ep-end, html.st-on .chk-toggle { display:none !important; }' +
    'html.st-on .viewer { padding-top:0 !important; } html.st-on .reveal, html.st-on .reveal > * { opacity:1 !important; transition:none !important; }' +
    'html.st-one .viewer > *:not(.st-cur):not(.st-prev) { display:none !important; }';

  function Frame(name, opt) {
    this.name = name; this.opt = opt || {}; this.edits = this.opt.edits !== false; this.single = !!this.opt.single;
    this.width = this.opt.width || 390; this.epSig = null; this.cutSig = {}; this.compiled = null; this.hidden = {}; this.order = [];
    this.queue = Promise.resolve(); this.rendering = false; this.cur = null;
    var el = this.el = document.createElement('iframe');
    el.className = 'st-frame st-frame-' + name; el.title = this.opt.title || '독자 화면'; el.setAttribute('scrolling', 'no'); el.setAttribute('tabindex', '-1');
    el.style.width = this.width + 'px'; el.style.height = (this.opt.height || 900) + 'px';
    (this.opt.host || document.body).appendChild(el);
  }
  Frame.prototype.win = function () { return this.el.contentWindow; };
  Frame.prototype.doc = function () { return this.el.contentDocument; };
  Frame.prototype.engine = function () { return this.win().BubblesV4; };
  Frame.prototype.section = function (no) { return this.doc().getElementById('cut-' + U.pad2(no)); };
  Frame.prototype.info = function (no) { return this.engine().info(no) || []; };
  /* 컷 번호 ↔ 컷 ID. 원본 컷은 'c017', 새로 만든·복제 컷은 컴파일 결과의 cut.sid('c~xxxxx') */
  Frame.prototype.idOf = function (no) { var c = this.cut(no); return c && c.sid ? c.sid : I.cut(no); };
  Frame.prototype.noOf = function (cutId) { var c = this.compiled && this.compiled.episode.cuts; if (!c) return I.cutNo(cutId); for (var i = 0; i < c.length; i++) if ((c[i].sid || I.cut(c[i].no)) === cutId) return c[i].no; return null; };
  Frame.prototype.cut = function (no) { var c = this.compiled && this.compiled.episode.cuts; if (!c) return null; for (var i = 0; i < c.length; i++) if (c[i].no === no) return c[i]; return null; };
  function done(f) { return function () { var w = f.win(); return w && w.document && w.document.body && w.document.body.classList.contains('bv4-done'); }; }

  /* 처음 불러오기: 독자 화면이 그려지면 원본을 보관(첫 프레임에서 1회)하고, 편집을 넣어 다시 그린다 */
  Frame.prototype.load = function (ep) {
    var f = this; f.ep = ep; f.epSig = null; f.cutSig = {}; f.compiled = null;
    f.el.src = ROOT + VIEWER + '#' + ep;
    return U.wait(function () { var w = f.win(); return w && w.WEBTOON && w.WEBTOON.episodeData && w.WEBTOON.episodeData[ep] && w.BubblesV4 && done(f)(); }, 60000, 100).then(function () {
      var d = f.doc(); if (!d.getElementById('st-style')) { var st = d.createElement('style'); st.id = 'st-style'; st.textContent = STYLE; d.head.appendChild(st); }
      d.documentElement.classList.add('st-on');
      S.base.capture(f.win(), ep);
      return f.sync(true);
    });
  };

  function epSignature(f) { if (!f.edits) return ''; var o = {}; epModules().forEach(function (m) { var s = S.store.slice(m.id, f.ep); if (!U.isEmpty(s)) o[m.id] = s; }); return U.stable(o); }
  function cutSignature(f, no) { if (!f.edits) return ''; var cid = f.idOf(no), o = {}; cutModules().forEach(function (m) { var s = S.store.inCut(m.id, cid, f.ep); if (!U.isEmpty(s)) o[m.id] = s; }); return U.isEmpty(o) ? '' : U.stable(o); }
  function cutsWithCutEdits(f) { var o = {}; if (!f.edits) return o; cutModules().forEach(function (m) { Object.keys(S.store.slice(m.id, f.ep)).forEach(function (id) { var n = f.noOf(I.cutOf(id)); if (n != null) o[n] = 1; }); }); return o; }

  /* 회차 전체 다시 그리기 */
  Frame.prototype.full = function () {
    var f = this, ep = f.ep, base = S.base.data(ep), win = f.win(), W = win.WEBTOON;
    var sig = epSignature(f);   /* 컴파일이 읽는 편집값과 같은 시점의 서명 — 그리는 도중 들어온 편집은 서명이 달라 다시 그린다 */
    var data = { episode: U.clone(base.episode), screens: U.clone(base.screens), bubbles: U.clone(base.bubbles) };
    var ctx = { ep: ep, data: data, base: base, frame: f, ids: I, util: U };
    if (f.edits) epModules().forEach(function (m) { ctx.edits = S.store.slice(m.id, ep); try { m.compile(ctx); } catch (e) { console.error('[studio] compile ' + m.id, e); } });
    /* 새·복제 컷: cut.sid('c~xxxxx')와 원본과 겹치지 않는 cut.no 를 모듈이 넣는다. 대사 줄 ID 가 없으면 '컷ID.l순번' 을 붙인다 */
    var seen = {}, issues = [];
    data.episode.cuts.forEach(function (c) {
      if (seen[c.no]) issues.push('컷 번호 중복: ' + c.no + (c.sid ? ' (' + c.sid + ')' : '')); seen[c.no] = 1;
      if (c.sid) { var pp = I.parse(c.sid); if (!pp || !pp.fresh || pp.parts.length) issues.push('잘못된 새 컷 ID: ' + c.sid); (c.lines || []).forEach(function (l, k) { if (!l.sid) l.sid = c.sid + '.l' + k; }); }
    });
    f.compileIssues = issues; if (issues.length) console.warn('[studio] compile', issues);
    var hidden = {}; data.episode.cuts.forEach(function (c) { if (c.reader === false) hidden[c.no] = true; c.reader = true; });   /* Studio 는 숨김 컷도 그린다(표시는 Studio 가 한다) */
    f.hidden = hidden; f.order = data.episode.cuts.map(function (c) { return c.no; }); f.compiled = data;
    W.episodeData[ep] = U.clone(data.episode);
    if (data.screens) { W.screens = W.screens || {}; W.screens[ep] = U.clone(data.screens); }
    var bo = S.base.bubbleObj(win, ep); if (bo && data.bubbles) { Object.keys(bo).forEach(function (k) { delete bo[k]; }); Object.assign(bo, U.clone(data.bubbles)); }
    var d = f.doc(); d.documentElement.classList.remove('st-one');
    d.body.classList.remove('bv4-done');
    win.dispatchEvent(new win.HashChangeEvent('hashchange'));
    return U.wait(done(f), 60000, 60).then(function () { f.cutSig = {}; f.epSig = sig; });
  };

  /* 한 컷의 말풍선 설정을 (회차 컴파일 결과로 되돌린 뒤) 컷 단위 모듈 편집으로 다시 만들고 그 컷만 다시 배치 */
  Frame.prototype.applyCut = function (no, force) {
    var f = this, sig = cutSignature(f, no); if (!force && (f.cutSig[no] || '') === sig) return false;
    var win = f.win(), bo = S.base.bubbleObj(win, f.ep), cb = f.compiled && f.compiled.bubbles;
    if (bo) { bo.cuts = bo.cuts || {}; if (cb && cb.cuts && cb.cuts[no]) bo.cuts[no] = U.clone(cb.cuts[no]); else delete bo.cuts[no]; }
    if (f.edits) cutModules().forEach(function (m) {
      var cid = f.idOf(no), ed = S.store.inCut(m.id, cid, f.ep); if (U.isEmpty(ed)) return;
      try { m.compileCut({ ep: f.ep, no: no, cutId: cid, win: win, engine: f.engine(), bubbles: bo, frame: f, edits: ed, base: S.base.data(f.ep), ids: I, util: U }); } catch (e) { console.error('[studio] compileCut ' + m.id, e); }
    });
    var sec = f.section(no), tmp = f.single && sec && !sec.classList.contains('st-cur');
    if (tmp) sec.classList.add('st-cur');   /* 보이는 상태에서 배치해야 크기가 잡힌다 */
    try { f.engine().rerunCut(no); } finally { if (tmp) sec.classList.remove('st-cur'); }
    if (sig) f.cutSig[no] = sig; else delete f.cutSig[no];
    return true;
  };

  /* 편집 상태와 화면을 맞춘다. 회차 단위 편집이 바뀌었으면 전체, 아니면 바뀐 컷만(동기) */
  Frame.prototype.sync = function (forceFull) {
    var f = this;
    if (f.rendering) { f.pending = true; return f.queue; }
    if (forceFull || !f.compiled || epSignature(f) !== f.epSig) {
      f.rendering = true;
      f.queue = f.full().then(function () {
        Object.keys(cutsWithCutEdits(f)).forEach(function (n) { f.applyCut(+n, true); });
        if (f.single) f.restoreSingle();
        f.rendering = false; S.emit('rendered', { frame: f, full: true, cuts: null });
        if (f.pending) { f.pending = false; return f.sync(); }
      }, function (e) { f.rendering = false; throw e; });
      return f.queue;
    }
    var nos = {}, changed = [];
    Object.keys(f.cutSig).forEach(function (n) { nos[n] = 1; }); Object.keys(cutsWithCutEdits(f)).forEach(function (n) { nos[n] = 1; });
    Object.keys(nos).forEach(function (n) { if (f.applyCut(+n)) changed.push(+n); });
    if (changed.length) S.emit('rendered', { frame: f, full: false, cuts: changed });
    return Promise.resolve(changed);
  };

  /* 한 컷만 보이게(편집 화면) */
  Frame.prototype.showCut = function (no) {
    var f = this, d = f.doc(); f.cur = no;
    [].forEach.call(d.querySelectorAll('.st-cur,.st-prev'), function (e) { e.classList.remove('st-cur', 'st-prev'); });
    var sec = f.section(no); if (!sec) return null;
    sec.classList.add('st-cur'); var pv = sec.previousElementSibling; if (pv && pv.classList.contains('scene-card')) pv.classList.add('st-prev');
    d.documentElement.classList.add('st-one'); f.fit(); return sec;
  };
  Frame.prototype.restoreSingle = function () { if (this.cur != null) this.showCut(this.cur); };
  Frame.prototype.fit = function () { var sec = this.cur != null && this.section(this.cur); if (!sec) return; var r = sec.getBoundingClientRect(); this.el.style.height = Math.max(120, Math.ceil(r.bottom + (this.win().pageYOffset || 0)) + 2) + 'px'; };
  /* 미리보기 폭 바꾸기: 한 컷 모드에서도 모든 컷을 보이게 한 채 다시 배치한다 */
  Frame.prototype.setWidth = function (w) {
    var f = this; if (w === f.width && f.compiled) return Promise.resolve();
    f.width = w; var d = f.doc(); d.documentElement.classList.remove('st-one'); f.el.style.width = w + 'px';
    return new Promise(function (ok) { setTimeout(ok, 450); }).then(function () {
      f.engine().rerun(); return U.wait(done(f), 30000, 60);
    }).then(function () { if (f.single) f.restoreSingle(); S.emit('rendered', { frame: f, full: true, cuts: null, resize: true }); });
  };
  /* 편집 적용 여부(원래/편집 후) */
  Frame.prototype.setEdits = function (on) { this.edits = !!on; return this.sync(); };

  S.renderer = {
    Frame: Frame, root: ROOT, viewer: VIEWER,
    create: function (name, opt) { return new Frame(name, opt); },
    epModules: epModules, cutModules: cutModules,
    /* QA: 실제 컴파일 순서와 문제(의존·순환·컷 번호 중복·잘못된 새 컷 ID) */
    compileOrder: function (frame) { var e = epModules().map(function (m) { return m.id; }), c = cutModules().map(function (m) { return m.id; }); return { episode: e, cut: c, issues: orderIssues.map(function (x) { return x.module + ': ' + x.issue; }).concat((frame && frame.compileIssues) || []) }; }
  };
})();
