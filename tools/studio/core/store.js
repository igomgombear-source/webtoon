/* 통합 편집 저장소 — 모든 모듈이 하나의 저장소를 쓴다 (통합 담당 전용 파일)
 *
 * 상태: episodes[회차ID] = { edits: { 모듈ID: { 요소ID: 값 } }, anchors: { 요소ID: 지문 } }
 *   - 값은 모듈이 정한 JSON(모듈 문서 참고). null/undefined 를 넣으면 그 편집을 지운다.
 *   - anchors: 편집을 처음 만들 때의 원본 요소 지문(S.base.fingerprint). 다른 버전 데이터에서 불러오면 충돌을 찾는 데 쓴다.
 * 실행 취소: 편집 상태 전체의 스냅숏(최대 200). 드래그처럼 연속 변경은 {live:true} 로 넣고 끝에서 checkpoint(라벨).
 * 자동 저장: localStorage 'lastaccess-studio-v1'(디바운스). 예전 말풍선 편집기 저장값(ep-bubble-editor-v1/v2)은 읽기만 하고 지우지 않는다.
 * 이벤트: 'change' {ep, module, ids, source} · 'status' {state:'saved'|'pending'|'error', at} · 'history' */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  var KEY = 'lastaccess-studio-v1', LEGACY_V2 = 'ep-bubble-editor-v2', LEGACY_V1 = 'ep-bubble-editor-v1';
  var FORMAT = 'lastaccess-studio', VERSION = 3, MAXH = 200, MAXLOG = 400;
  var state = { episodes: {}, log: [] }, hist = [], hi = -1, saveErr = null;

  function epId(ep) { return ep || (S.state && S.state.ep) || 'ep01v3'; }
  function epState(ep, create) { ep = epId(ep); var e = state.episodes[ep]; if (!e && create) e = state.episodes[ep] = { edits: {}, anchors: {} }; return e || null; }
  function snap() { return JSON.stringify(state.episodes); }
  function log(entry) { entry.t = new Date().toISOString(); state.log.push(entry); if (state.log.length > MAXLOG) state.log.splice(0, state.log.length - MAXLOG); }

  var persistNow = function () {
    try { localStorage.setItem(KEY, JSON.stringify({ format: FORMAT, version: VERSION, episodes: state.episodes, log: state.log })); saveErr = null; S.emit('status', { state: 'saved', at: new Date() }); }
    catch (e) { saveErr = e; S.emit('status', { state: 'error', error: e }); }
  };
  var persistLater = U.debounce(function () { dirty = false; persistNow(); }, 400), dirty = false;
  function persist() { dirty = true; S.emit('status', { state: 'pending' }); persistLater(); }
  /* 창을 닫거나 새로고침할 때 남은 저장을 바로 쓴다(디바운스 중 편집 유실 방지) */
  function flushIfDirty() { if (dirty) { dirty = false; persistNow(); } }
  window.addEventListener('pagehide', flushIfDirty); window.addEventListener('beforeunload', flushIfDirty);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushIfDirty(); });

  /* ---------- 예전 말풍선 편집기 형식 변환 ---------- */
  /* v1 geometry('컷:순번') → v2 manual */
  function fromV1(v1) {
    var out = {};
    Object.keys(v1 || {}).forEach(function (ep) { out[ep] = {}; Object.keys(v1[ep] || {}).forEach(function (k) {
      var p = k.split(':'), g = v1[ep][k]; if (!g || g.x == null) return;
      var m = { x: g.x, y: g.y, w: g.w, h: g.h == null ? 'auto' : g.h, pad: g.pad, radius: g.radius, fs: g.fs, lh: g.lh };
      m.tail = g.tail && g.tail.on ? { tip: { x: g.tail.tx, y: g.tail.ty }, start: g.tail.sa == null ? 'auto' : g.tail.sa, thick: g.tail.th, curve: g.tail.curve } : { on: false };
      Object.keys(m).forEach(function (q) { if (m[q] === undefined) delete m[q]; });
      (out[ep][p[0]] = out[ep][p[0]] || {})[p[1]] = m;
    }); });
    return out;
  }
  /* v2 { ep: { 컷번호: { 대사순번: manual } } } → v3 episodes */
  function fromV2(v2) {
    var eps = {};
    Object.keys(v2 || {}).forEach(function (ep) { var b = {};
      Object.keys(v2[ep] || {}).forEach(function (cn) { Object.keys(v2[ep][cn] || {}).forEach(function (i) { if (v2[ep][cn][i]) b[I.line(+cn, +i)] = U.clone(v2[ep][cn][i]); }); });
      if (!U.isEmpty(b)) eps[ep] = { edits: { bubbles: b }, anchors: {} };
    });
    return eps;
  }
  /* 어떤 JSON 이든 v3 episodes 로. 반환 { episodes, from, base, log } */
  function migrate(d) {
    if (!d || typeof d !== 'object') throw new Error('JSON 형식이 아닙니다');
    if (d.format === FORMAT) {
      if (d.version > VERSION) throw new Error('더 새 Studio(' + d.version + ')에서 만든 파일입니다');
      return { episodes: U.clone(d.episodes || {}), from: 'studio-v' + d.version, base: d.base || null, log: d.log || [] };
    }
    if (d.tool === 'bubble-editor' && d.version === 2) return { episodes: fromV2(d.edits), from: 'bubble-editor-v2', base: null, log: [] };
    if (d.tool === 'bubble-editor' && d.edits) return { episodes: fromV2(fromV1(d.edits)), from: 'bubble-editor-v1', base: null, log: [] };
    throw new Error('알 수 없는 편집 파일입니다');
  }

  var store = S.store = {
    FORMAT: FORMAT, VERSION: VERSION, KEY: KEY,
    migrate: migrate, fromV1: fromV1, fromV2: fromV2,

    /* 시작 시 1회: Studio 저장값 → 없으면 예전 편집기 저장값을 복사해 온다(원본 키는 그대로 둔다) */
    load: function () {
      var info = { source: 'empty' }, raw = null;
      try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { raw = null; }
      if (raw && raw.format === FORMAT) { state.episodes = raw.episodes || {}; state.log = raw.log || []; info.source = 'studio'; }
      else {
        var v2 = null, v1 = null;
        try { v2 = JSON.parse(localStorage.getItem(LEGACY_V2) || 'null'); } catch (e) {}
        try { v1 = JSON.parse(localStorage.getItem(LEGACY_V1) || 'null'); } catch (e) {}
        if (v2 && !U.isEmpty(v2)) { state.episodes = fromV2(v2); info.source = LEGACY_V2; }
        else if (v1 && !U.isEmpty(v1)) { state.episodes = fromV2(fromV1(v1)); info.source = LEGACY_V1; }
        if (info.source !== 'empty') { log({ label: '예전 말풍선 편집기 자동 저장값을 가져옴(' + info.source + ', 원본 저장값은 그대로 둠)', source: 'migrate' }); persistNow(); }
      }
      hist = [{ s: snap(), label: '시작', t: Date.now() }]; hi = 0;
      return info;
    },

    get: function (module, id, ep) { var e = epState(ep); return e && e.edits[module] ? (e.edits[module][id] == null ? null : e.edits[module][id]) : null; },
    /* 모듈 slice 전체(읽기 전용으로 쓴다. 고치려면 set) */
    slice: function (module, ep) { var e = epState(ep); return (e && e.edits[module]) || {}; },
    /* 컷 하나에 속한 모듈 편집 { 요소ID: 값 } */
    inCut: function (module, cutId, ep) { var s = store.slice(module, ep), o = {}; Object.keys(s).forEach(function (id) { if (I.cutOf(id) === cutId) o[id] = s[id]; }); return o; },

    /* opt: { ep, live(이력 없이), label, source } */
    set: function (module, id, value, opt) {
      opt = opt || {}; if (!I.valid(id)) throw new Error('잘못된 요소 ID: ' + id);
      var ep = epId(opt.ep), e = epState(ep, true), m = e.edits[module] || (e.edits[module] = {});
      if (value == null || (typeof value === 'object' && !Array.isArray(value) && U.isEmpty(value))) { delete m[id]; if (U.isEmpty(m)) delete e.edits[module]; }
      else {
        if (!(id in e.anchors) && S.base && S.base.ready(ep)) e.anchors[id] = S.base.fingerprint(ep, id);
        m[id] = U.clone(value);
      }
      store.prune(ep);
      persist();
      S.emit('change', { ep: ep, module: module, ids: [id], source: opt.source || 'edit' });
      if (!opt.live) store.checkpoint(opt.label || (module + ' 편집'), { module: module, ids: [id] });
    },
    patch: function (module, id, fn, opt) { var v = U.clone(store.get(module, id, opt && opt.ep)) || {}; var r = fn(v); store.set(module, id, r === undefined ? v : r, opt); },
    remove: function (module, id, opt) { store.set(module, id, null, opt); },

    /* 편집이 하나도 없는 요소의 지문은 지운다 */
    prune: function (ep) { var e = epState(ep); if (!e) return; var used = {}; Object.keys(e.edits).forEach(function (m) { Object.keys(e.edits[m]).forEach(function (id) { used[id] = 1; }); }); Object.keys(e.anchors).forEach(function (id) { if (!used[id]) delete e.anchors[id]; }); },
    /* 원본 데이터가 준비된 뒤 지문이 없는 편집(예전 편집기에서 옮겨 온 것)에 현재 지문을 단다 */
    ensureAnchors: function (ep) { var e = epState(ep); if (!e || !S.base.ready(epId(ep))) return; Object.keys(e.edits).forEach(function (m) { Object.keys(e.edits[m]).forEach(function (id) { if (!(id in e.anchors)) e.anchors[id] = S.base.fingerprint(epId(ep), id); }); }); persist(); },

    /* 실행 취소 지점 */
    checkpoint: function (label, meta) {
      var s = snap(); if (hist[hi] && hist[hi].s === s) return false;
      hist = hist.slice(0, hi + 1); hist.push({ s: s, label: label || '편집', t: Date.now() }); if (hist.length > MAXH) hist.shift(); hi = hist.length - 1;
      log({ label: label || '편집', module: meta && meta.module, ids: meta && meta.ids && meta.ids.slice(0, 20), ep: epId() });
      persist(); S.emit('history', {}); return true;
    },
    canUndo: function () { return hi > 0; }, canRedo: function () { return hi < hist.length - 1; },
    goto: function (i) { if (i < 0 || i >= hist.length || i === hi) return; hi = i; state.episodes = JSON.parse(hist[i].s); persist(); S.emit('change', { ep: epId(), module: null, ids: null, source: 'history' }); S.emit('history', {}); },
    undo: function () { store.goto(hi - 1); }, redo: function () { store.goto(hi + 1); },
    history: function () { return hist.map(function (h, i) { return { i: i, label: h.label, t: h.t, current: i === hi }; }); },
    log: function () { return state.log.slice(); },

    /* 초기화 범위: { ep, module?, cut?(컷ID), id? } — 지정한 것만 지운다 */
    reset: function (scope, label) {
      scope = scope || {}; var ep = epId(scope.ep), e = epState(ep); if (!e) return 0; var n = 0;
      Object.keys(e.edits).forEach(function (m) { if (scope.module && scope.module !== m) return;
        Object.keys(e.edits[m]).forEach(function (id) { if (scope.id && !(id === scope.id || id.indexOf(scope.id + '.') === 0)) return; if (scope.cut && I.cutOf(id) !== scope.cut) return; delete e.edits[m][id]; n++; });
        if (U.isEmpty(e.edits[m])) delete e.edits[m]; });
      store.prune(ep); persist(); S.emit('change', { ep: ep, module: scope.module || null, ids: null, source: 'reset' });
      store.checkpoint(label || '초기화'); return n;
    },
    /* 편집이 있는 컷 { 컷ID: [모듈...] } */
    editedCuts: function (ep) { var e = epState(ep), o = {}; if (!e) return o; Object.keys(e.edits).forEach(function (m) { Object.keys(e.edits[m]).forEach(function (id) { var c = I.cutOf(id); (o[c] = o[c] || []).indexOf(m) < 0 && o[c].push(m); }); }); return o; },
    count: function (ep) { var e = epState(ep), o = {}; if (!e) return o; Object.keys(e.edits).forEach(function (m) { o[m] = Object.keys(e.edits[m]).length; }); return o; },
    episodes: function () { return U.clone(state.episodes); },
    anchors: function (ep) { var e = epState(ep); return (e && e.anchors) || {}; },

    /* 충돌 검사: 편집의 지문과 현재 원본 지문이 다르면 changed, 원본에 요소가 없으면 missing */
    conflicts: function (ep) {
      ep = epId(ep); var e = epState(ep), out = []; if (!e || !S.base.ready(ep)) return out;
      Object.keys(e.edits).forEach(function (m) { Object.keys(e.edits[m]).forEach(function (id) {
        var p = I.parse(id); if (!p) { out.push({ id: id, module: m, reason: 'invalid' }); return; }
        if (p.fresh) return;
        var now = S.base.fingerprint(ep, id), was = e.anchors[id];
        if (now == null) out.push({ id: id, module: m, reason: 'missing' });
        else if (was && was !== now) out.push({ id: id, module: m, reason: 'changed' });
      }); });
      return out;
    },

    /* 통합 JSON (파일 하나) */
    exportData: function () {
      return { format: FORMAT, version: VERSION, app: '마지막 접속 Studio ' + S.version, exported: new Date().toISOString(),
        base: S.base.info(), episodes: U.clone(state.episodes), log: state.log.slice(-200) };
    },
    /* 불러오기: 현재 편집을 바꾼다(실행 취소 가능). 반환 { from, episodes, conflicts:{ep:[...]}, baseDiff:{ep:[...]} } */
    importData: function (d) {
      var r = migrate(d), res = { from: r.from, episodes: Object.keys(r.episodes), conflicts: {}, baseDiff: {} };
      Object.keys(r.episodes).forEach(function (ep) { var x = r.episodes[ep]; x.edits = x.edits || {}; x.anchors = x.anchors || {}; });
      state.episodes = r.episodes;
      Object.keys(state.episodes).forEach(function (ep) {
        if (S.base.ready(ep)) {
          /* 예전 형식(지문 없음)은 이 원본에서 만든 것으로 본다 — 원본 데이터 지문이 파일에 있으면 비교해서 경고 */
          var fileBase = r.base && r.base.episodes && r.base.episodes[ep], cur = S.base.info().episodes[ep];
          if (fileBase && cur) res.baseDiff[ep] = ['data', 'bubbles', 'screens'].filter(function (k) { return fileBase[k] && cur[k] && fileBase[k] !== cur[k]; });
          res.conflicts[ep] = store.conflicts(ep);
          store.ensureAnchors(ep);
        }
      });
      log({ label: 'JSON 불러오기(' + r.from + ')', source: 'import' });
      persist(); S.emit('change', { ep: epId(), module: null, ids: null, source: 'import' });
      store.checkpoint('JSON 불러오기');
      return res;
    },
    saveError: function () { return saveErr; },
    flush: function () { dirty = false; persistNow(); }
  };
})();
