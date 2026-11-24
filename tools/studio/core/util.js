/* 마지막 접속 Studio — 공통 도구 (통합 담당 전용 파일, 모듈은 수정하지 않는다) */
(function () {
  'use strict';
  var S = window.Studio = window.Studio || {};
  S.version = '1.1.0-phase2';
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
  /* 공통 좌표 변환(docs/STUDIO_ARCHITECTURE.md §6) — 원화 변형 T 를 '패널 %' 점에 적용. 말풍선 꼬리·보호 영역·휴대폰 화면·합성 레이어·인셋 원본 영역이 같은 함수를 쓴다.
   * T = { scale=1, x=0, y=0 (이동, 패널 %), rotate=0 (시계 방향 °), flipX, flipY, origin:{x:50,y:50} } · 순서: 뒤집기 → 확대 → 회전 → 이동
   * size = 패널의 실제 가로·세로(px 또는 비) — 회전이 찌그러지지 않게 */
  var G = S.geom = {
    identity: function (T) { T = T || {}; return !T.flipX && !T.flipY && (T.scale == null || T.scale === 1) && !T.rotate && !T.x && !T.y; },
    point: function (p, T, size) {
      T = T || {}; size = size || { w: 1, h: 1 }; var o = T.origin || { x: 50, y: 50 }, x = (p.x - o.x) / 100 * size.w, y = (p.y - o.y) / 100 * size.h;
      if (T.flipX) x = -x; if (T.flipY) y = -y; var s = T.scale == null ? 1 : T.scale; x *= s; y *= s;
      var a = (T.rotate || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), rx = x * c - y * sn, ry = x * sn + y * c;
      return { x: U.rnd(o.x + rx / size.w * 100 + (T.x || 0), 3), y: U.rnd(o.y + ry / size.h * 100 + (T.y || 0), 3) };
    },
    /* 역변환(원화 좌표로 되돌리기) */
    invert: function (p, T, size) {
      T = T || {}; size = size || { w: 1, h: 1 }; var o = T.origin || { x: 50, y: 50 }, x = (p.x - (T.x || 0) - o.x) / 100 * size.w, y = (p.y - (T.y || 0) - o.y) / 100 * size.h;
      var a = -(T.rotate || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), rx = x * c - y * sn, ry = x * sn + y * c, s = T.scale == null ? 1 : T.scale; rx /= s; ry /= s;
      if (T.flipX) rx = -rx; if (T.flipY) ry = -ry; return { x: U.rnd(o.x + rx / size.w * 100, 3), y: U.rnd(o.y + ry / size.h * 100, 3) };
    },
    /* 사각형(x,y,w,h %) → 네 꼭짓점 변환 후 감싸는 사각형 */
    rect: function (r, T, size) { var ps = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]].map(function (q) { return G.point({ x: q[0], y: q[1] }, T, size); });
      var xs = ps.map(function (q) { return q.x; }), ys = ps.map(function (q) { return q.y; }), x0 = Math.min.apply(0, xs), y0 = Math.min.apply(0, ys);
      return { x: U.rnd(x0, 3), y: U.rnd(y0, 3), w: U.rnd(Math.max.apply(0, xs) - x0, 3), h: U.rnd(Math.max.apply(0, ys) - y0, 3) }; },
    /* 사각형 네 모서리(0~1 비율, 휴대폰 화면 quad 형식) */
    quad: function (q, T, size) { return q.map(function (pt) { var r = G.point({ x: pt[0] * 100, y: pt[1] * 100 }, T, size); return [U.rnd(r.x / 100, 5), U.rnd(r.y / 100, 5)]; }); },
    /* 폴리곤(% 점 배열, 휴대폰 clip 형식) */
    poly: function (pts, T, size) { return pts.map(function (pt) { var r = G.point({ x: pt[0], y: pt[1] }, T, size); return [r.x, r.y]; }); }
  };
})();
