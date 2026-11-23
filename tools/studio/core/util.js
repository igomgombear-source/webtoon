/* 마지막 접속 Studio — 공통 도구 (통합 담당 전용 파일, 모듈은 수정하지 않는다) */
(function () {
  'use strict';
  var S = window.Studio = window.Studio || {};
  S.version = '1.0.0-phase1';
  var U = S.util = {};
  U.$ = function (id) { return document.getElementById(id); };
  U.clone = function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); };
  U.rnd = function (n, d) { var k = Math.pow(10, d == null ? 1 : d); return Math.round(n * k) / k; };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  U.pad3 = function (n) { n = String(n); while (n.length < 3) n = '0' + n; return n; };
  U.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  U.esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  U.isEmpty = function (o) { if (!o) return true; for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) return false; return true; };
  /* 키 순서를 고정한 JSON (서명·지문용) */
  U.stable = function stable(v) {
    if (v === undefined) return 'null';
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; }).map(function (k) { return JSON.stringify(k) + ':' + stable(v[k]); }).join(',') + '}';
  };
  /* cyrb53 — 짧은 지문(암호용 아님) */
  U.hash = function (str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'h' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  };
  U.fp = function (o) { return o == null ? null : U.hash(U.stable(o)); };
  U.emitter = function () {
    var map = {};
    return {
      on: function (ev, fn) { (map[ev] = map[ev] || []).push(fn); return fn; },
      off: function (ev, fn) { map[ev] = (map[ev] || []).filter(function (f) { return f !== fn; }); },
      emit: function (ev, data) { (map[ev] || []).slice().forEach(function (f) { try { f(data); } catch (e) { console.error('[studio] ' + ev, e); } }); }
    };
  };
  var bus = U.emitter();
  S.on = bus.on; S.off = bus.off; S.emit = bus.emit;
  U.debounce = function (fn, ms) { var t; return function () { var a = arguments, me = this; clearTimeout(t); t = setTimeout(function () { fn.apply(me, a); }, ms); }; };
  U.wait = function (cond, timeout, step) {
    return new Promise(function (ok, no) { var t0 = Date.now(); (function poll() { var v; try { v = cond(); } catch (e) {} if (v) return ok(v); if (Date.now() - t0 > (timeout || 30000)) return no(new Error('timeout')); setTimeout(poll, step || 60); })(); });
  };
  U.toast = function (msg) { var e = U.$('toast'); if (!e) return; e.textContent = msg; e.style.display = 'block'; clearTimeout(U.toast.t); U.toast.t = setTimeout(function () { e.style.display = 'none'; }, 2200); };
  /* 모듈 CSS 는 각자 파일 안에서 이 함수로 넣는다(index.html·studio.css 를 고치지 않기 위해) */
  U.addStyle = function (id, css) { var el = document.getElementById('style-' + id); if (!el) { el = document.createElement('style'); el.id = 'style-' + id; document.head.appendChild(el); } el.textContent = css; };
  U.download = function (name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0); };
  U.today = function () { return new Date().toISOString().slice(0, 10); };
})();
