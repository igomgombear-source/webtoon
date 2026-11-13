/* 말풍선 v4 — 104컷 제작판(ep01v3)의 기본 말풍선 렌더러. app.js 가 그린 대사 말풍선을 지우고 다시 배치한다.
 * 1화 70컷판(ep01)에는 관여하지 않는다. index.html?bubbles=off 로 예전 렌더러(app.js)를 볼 수 있다.
 * 컷별 예외 설정은 data/ep01v3-bubbles.js (window.EP01V3_BUBBLES), 설정이 없는 컷은 대사 데이터에서 임시 설정을 만든다.
 *
 * 1) 유형별 모양 (제작기준 v2 1-3)
 *    speech    흰 타원 + 화자 쪽 꼬리, 이름표 없음 (스크린리더용 이름만)
 *    offscreen 흰 타원 + 컷 테두리 밖으로 나가는 꼬리
 *    mono      테두리 없는 반투명 사각, 세리프
 *    phone     톱니 테두리 + 휴대폰 쪽 꼬리
 *    caption   각진 자막
 * 2) 크기: 글자를 먼저 줄바꿈(한글 단어 단위, 줄 길이 균형)해서 실제 줄 폭을 잰 뒤,
 *    그 줄들을 모두 품는 가장 작은 타원(또는 사각)을 계산한다. 글자 크기는 줄이지 않는다.
 * 3) 자리: 보호 영역(얼굴·눈·손·핵심 소품)과 겹치지 않는 자리를 선호 위치 가까운 곳부터 찾는다.
 *    컷 안에 자리가 없으면 컷 위/아래 여백 띠로 옮긴다(읽는 순서는 유지).
 */
(function () {
  'use strict';
  var Q = location.search;
  if (/[?&]bubbles=(off|legacy)\b/.test(Q)) return;
  var REVIEW = /[?&]review=1\b/.test(Q);
  var SHOW_ZONES = REVIEW && /[?&]zones=1\b/.test(Q);
  /* 글꼴·배치가 끝나기 전에는 예전 말풍선이 잠깐 보이지 않게 가린다 (4초 뒤에는 어떤 경우든 푼다) */
  var root = document.documentElement;
  if (/ep01v3/.test(location.hash)) { root.classList.add('bv4-pending'); setTimeout(function () { root.classList.remove('bv4-pending'); }, 4000); }

  var AT = { 'in-tl': [22, 14], 'in-tr': [78, 14], 'in-bl': [22, 86], 'in-br': [78, 86], 'in-br2': [78, 70],
    'edge-top-l': [25, 0], 'edge-top-r': [75, 0], 'edge-bottom-l': [25, 100], 'edge-bottom-r': [75, 100], gap: [50, 112] };

  var TYPE = {
    speech:    { shape: 'ellipse', font: 16, fontWide: 17, cls: 'speech', widths: [10.5, 12.5, 9, 7.5, 6.2, 14.5], mx: 6, my: 5 },
    offscreen: { shape: 'ellipse', font: 16, fontWide: 17, cls: 'speech', widths: [10.5, 12.5, 9, 7.5, 6.2, 14.5], mx: 6, my: 5 },
    phone:     { shape: 'jag',     font: 16, fontWide: 17, cls: 'phone',  widths: [10.5, 12.5, 9, 7.5, 6], mx: 8, my: 7 },
    mono:      { shape: 'rect',    font: 15, fontWide: 16, cls: 'mono',   widths: [11.5, 13.5, 9.5, 8, 6.5], px: 12, py: 8 },
    caption:   { shape: 'rect',    font: 13.5, fontWide: 14, cls: 'caption', widths: [14, 10], px: 9, py: 5 }
  };
  var GAP = 6;          /* 말풍선끼리 최소 간격 */
  var ZONE_PAD = 5;     /* 보호 영역과 최소 간격 */
  var EDGE = 6;         /* 조각 안쪽 여백 */
  var SIDE = 10;        /* 화면 좌우 안전 여백 */

  var measureBox = null;
  function measurer() {
    if (!measureBox) {
      measureBox = document.createElement('div');
      measureBox.className = 'bv4-measure';
      measureBox.setAttribute('aria-hidden', 'true');
      document.body.appendChild(measureBox);
    }
    return measureBox;
  }

  /* 글자를 폭 W(px)로 줄바꿈했을 때의 줄 정보 */
  function lineBoxes(el) {
    var tn = el.firstChild, r = document.createRange();
    r.selectNodeContents(tn);
    var base = el.getBoundingClientRect(), rows = [];
    Array.prototype.forEach.call(r.getClientRects(), function (q) {
      if (q.width < 1) return;
      var t = q.top - base.top, b = q.bottom - base.top, hit = null;
      rows.forEach(function (row) { if (Math.abs(row.t - t) < 4) hit = row; });
      if (!hit) rows.push({ t: t, b: b, l: q.left - base.left, r: q.right - base.left });
      else { hit.l = Math.min(hit.l, q.left - base.left); hit.r = Math.max(hit.r, q.right - base.left); hit.b = Math.max(hit.b, b); }
    });
    rows.sort(function (a, b) { return a.t - b.t; });
    return rows;
  }

  /* 한 말풍선 안에 문장이 둘 이상이면 문장 끝에서 줄을 바꾸는 후보도 만든다 */
  function sentenceBreak(text) {
    var parts = text.split(/(?<=[.?!…])\s+/);
    return parts.length > 1 ? parts.join('\n') : null;
  }
  function glue(text) {
    return text.split('\n').map(function (seg) {
      return seg.replace(/([^\s.?!…])\s+(?=[가-힣]['’”]?(?:[\s.,?!…]|$))/g, '$1\u00a0');
    }).join('\n');
  }
  var MCACHE = {};
  function measure(text, type, fs, W) {
    var ck = type + '|' + fs + '|' + W + '|' + text;
    if (MCACHE[ck]) return MCACHE[ck];
    var m = measurer();
    m.innerHTML = '';
    var t = document.createElement('div');
    t.className = 'bv4-text bv4-' + TYPE[type].cls;
    t.style.fontSize = fs + 'px';
    t.style.width = W + 'px';
    t.textContent = text;
    if (text.indexOf('\n') >= 0) t.style.whiteSpace = 'pre-line';
    m.appendChild(t);
    var rows = lineBoxes(t), H = t.getBoundingClientRect().height;
    return (MCACHE[ck] = { rows: rows, H: H, W: W, maxW: rows.reduce(function (a, r) { return Math.max(a, r.r - r.l); }, 0) });
  }

  /* 줄들을 모두 품는 최소 면적 초타원 |x/a|^N + |y/b|^N = 1 (가운데 정렬 기준).
   * N=2 는 타원, 클수록 사각에 가까움. 2.6 은 만화 말풍선처럼 둥글면서 글자를 덜 낭비한다 */
  var N = 3;
  function fitEllipse(ms, mx, my) {
    var cy = ms.H / 2, need = ms.rows.map(function (r) {
      return { x: (r.r - r.l) / 2 + mx, y: Math.max(Math.abs(r.t - cy), Math.abs(r.b - cy)) + my };
    });
    var ymax = need.reduce(function (a, n) { return Math.max(a, n.y); }, 0), best = null;
    for (var b = ymax * 1.02; b < ymax * 2.2; b += 0.5) {
      var a = 0;
      for (var i = 0; i < need.length; i++) a = Math.max(a, need[i].x / Math.pow(1 - Math.pow(need[i].y / b, N), 1 / N));
      a = Math.max(a, b * 1.1);
      if (!best || a * b < best.a * best.b) best = { a: a, b: b };
    }
    return { w: Math.ceil(best.a * 2) + 3, h: Math.ceil(best.b * 2) + 3, a: best.a, b: best.b };
  }
  function sePt(cx, cy, a, b, t, k) {
    var c = Math.cos(t), s = Math.sin(t);
    return { x: cx + a * k * Math.sign(c) * Math.pow(Math.abs(c), 2 / N), y: cy + b * k * Math.sign(s) * Math.pow(Math.abs(s), 2 / N) };
  }

  /* 한 대사의 모양 후보들 (폭을 바꿔 가며) */
  function shapeOptions(line, type, fs, maxLines, maxBoxW) {
    var T = TYPE[type], out = [], seen = {}, sb = sentenceBreak(line.text);
    var variants = [];
    T.widths.forEach(function (em, wi) { if (sb) variants.push([em, wi, sb, -18]); variants.push([em, wi, line.text, sb ? 24 : 0]); });
    variants.forEach(function (v) {
      var em = v[0], wi = v[1], txt = v[2];
      var W = Math.round(em * fs);
      txt = glue(txt);
      var ms = Object.assign({}, measure(txt, type, fs, W)); ms.text = txt;
      var n = ms.rows.length;
      if (!n || n > maxLines) return;
      var key = n + ':' + Math.round(ms.maxW) + ':' + (v[3] < 0 ? 1 : 0);
      if (seen[key]) return; seen[key] = 1;
      var pen = wi * 4 + Math.max(0, n - 2) * 14 + Math.max(0, ms.maxW / fs - 15) * 14 + v[3];
      if (T.shape === 'rect') {
        out.push({ kind: 'rect', w: Math.ceil(ms.maxW + T.px * 2), h: Math.ceil(ms.H + T.py * 2), ms: ms, n: n, pen: pen });
      } else {
        var e = fitEllipse(ms, T.mx, T.my);
        if (T.shape === 'jag') { e = { w: Math.ceil(e.w * 1.04), h: Math.ceil(e.h * 1.07), a: e.a * 1.04, b: e.b * 1.07 }; }
        if (e.w <= maxBoxW) out.push({ kind: T.shape, w: e.w, h: e.h, a: e.a, b: e.b, ms: ms, n: n, pen: pen });
      }
    });
    return out;
  }

  function rel(el, base) {
    var a = el.getBoundingClientRect();
    return { x: a.left - base.left, y: a.top - base.top, w: a.width, h: a.height };
  }
  function boxHit(a, b, pad) {
    return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
  }
  /* 모양(타원/사각)과 보호 영역 사각형의 정확한 겹침 */
  function shapeHitsZone(c, z, pad) {
    if (c.kind === 'ellipse' || c.kind === 'jag') {
      if (!boxHit(c, z, pad)) return false;
      var cx = c.x + c.w / 2, cy = c.y + c.h / 2, A = c.w / 2 + pad, B = c.h / 2 + pad;
      var px = Math.max(z.x, Math.min(cx, z.x + z.w)), py = Math.max(z.y, Math.min(cy, z.y + z.h));
      /* 영역 안에서 중심에 가장 가까운 점이 초타원 안이면 겹침 (모서리 쪽은 표본 검사) */
      if (Math.pow(Math.abs(px - cx) / A, N) + Math.pow(Math.abs(py - cy) / B, N) < 1) return true;
      var xs = [z.x, z.x + z.w, px], ys = [z.y, z.y + z.h, py];
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
        var qx = Math.max(z.x, Math.min(xs[i], z.x + z.w)), qy = Math.max(z.y, Math.min(ys[j], z.y + z.h));
        if (Math.pow(Math.abs(qx - cx) / A, N) + Math.pow(Math.abs(qy - cy) / B, N) < 1) return true;
      }
      return false;
    }
    return boxHit(c, z, pad);
  }
  function inside(c, r) { return c.x >= r.x && c.y >= r.y && c.x + c.w <= r.x + r.w && c.y + c.h <= r.y + r.h; }
  function rectDist(c, p) {
    var dx = Math.max(c.x - p.x, 0, p.x - (c.x + c.w)), dy = Math.max(c.y - p.y, 0, p.y - (c.y + c.h));
    return Math.sqrt(dx * dx + dy * dy);
  }

  var STYLE_TYPE = { thought: 'mono', phone: 'phone', caption: 'caption', silence: 'mono' };
  function typeOf(ln, cfg) { return (cfg && cfg.type) || STYLE_TYPE[ln.style] || 'speech'; }

  /* ---------- 컷 하나 배치 ---------- */
  function layoutCut(sec, cut, P, ep) {
    /* 이전 결과·기존 말풍선 정리 */
    Array.prototype.forEach.call(sec.querySelectorAll('.bv4-layer, .bv4-band, .gap-lines, .above-lines, .panel-bubbles > *'), function (n) { n.remove(); });
    var wrap = sec.querySelector('.cut-wrap');
    if (!wrap) return null;
    wrap.classList.remove('has-edge-top', 'has-edge-bottom');   /* 경계 걸침 여백은 아래에서 필요한 만큼만 직접 만든다 */
    var vw = document.documentElement.clientWidth, fsBoost = vw >= 400;
    var secR = sec.getBoundingClientRect(), wrapR = rel(wrap, secR);
    var panels = Array.prototype.map.call(wrap.querySelectorAll('.panel'), function (p) {
      var r = rel(p, secR), diag = p.classList.contains('diag-first') ? 'first' : p.classList.contains('diag-last') ? 'last' : '';
      var E2 = Math.max(8, r.w * 0.03), safe = { x: r.x + E2, y: r.y + E2, w: r.w - E2 * 2, h: r.h - E2 * 2 };
      if (diag === 'first') safe.w -= r.w * 0.07;
      if (diag === 'last') { safe.x += r.w * 0.07; safe.w -= r.w * 0.07; }
      return { el: p, r: r, safe: safe, row: p.parentNode };
    });
    function pPt(spec) { var p = panels[spec.panel || 0].r; return { x: p.x + p.w * spec.x / 100, y: p.y + p.h * spec.y / 100 }; }
    var zones = (P.zones || []).map(function (z) {
      var p = panels[z.panel || 0].r;
      return { x: p.x + p.w * z.x / 100, y: p.y + p.h * z.y / 100, w: p.w * z.w / 100, h: p.h * z.h / 100, label: z.label, approved: !!z.approved, panel: z.panel || 0 };
    });

    var layer = document.createElement('div');
    layer.className = 'bv4-layer';
    sec.appendChild(layer);

    /* 휴대폰 메시지 화면 (83) */
    var screenRep = null;
    if (P.screen) screenRep = renderScreen(layer, P.screen, panels);

    var lines = cut.lines || [], maxLines = P.maxLines || 3;
    var colX0 = SIDE, colX1 = secR.width - SIDE;
    /* 줄(row) 단위 좌표계: 각 줄 아래에 여백 띠를 열 수 있고, 띠가 열리면 다음 줄이 그만큼 내려간다 */
    var rowEls = Array.prototype.slice.call(wrap.querySelectorAll('.panel-row'));
    panels.forEach(function (p) { p.ri = rowEls.indexOf(p.row); });
    var rowBottom = rowEls.map(function (r) { var q = rel(r, secR); return q.y + q.h; });
    zones.forEach(function (z) { z.ri = panels[z.panel].ri; });
    var bandH = rowEls.map(function () { return 0; }), aboveH = 0;
    var placed = [], curPhase = 0;   /* phase: 0 위 띠, 2r+1 줄 r 안, 2r+2 줄 r 아래 띠 */

    function segHitsBox(p0, p1, c, pad) {
      var x0 = c.x - pad, y0 = c.y - pad, x1 = c.x + c.w + pad, y1 = c.y + c.h + pad, t0 = 0, t1 = 1, dx = p1.x - p0.x, dy = p1.y - p0.y;
      var ps = [-dx, dx, -dy, dy], qs = [p0.x - x0, x1 - p0.x, p0.y - y0, y1 - p0.y];
      for (var k = 0; k < 4; k++) {
        if (ps[k] === 0) { if (qs[k] < 0) return false; continue; }
        var r = qs[k] / ps[k];
        if (ps[k] < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
      }
      return true;
    }
    function inZone(pt, ri) { return zones.some(function (z) { return z.ri === ri && pt.x > z.x - 2 && pt.x < z.x + z.w + 2 && pt.y > z.y - 2 && pt.y < z.y + z.h + 2; }); }
    /* 꼬리 끝 계산: 화자 쪽으로, 보호 영역 안으로는 들어가지 않게 */
    function tailFor(c, T, mode, ri) {
      if (!T) return null;
      var cx = c.x + c.w / 2, cy = c.y + c.h / 2, dx = T.x - cx, dy = T.y - cy;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;
      var a = c.w / 2, b = c.h / 2, sc;
      if (c.kind === 'ellipse' || c.kind === 'jag') sc = 1 / Math.pow(Math.pow(Math.abs(dx) / a, N) + Math.pow(Math.abs(dy) / b, N), 1 / N);
      else sc = Math.min(a / Math.max(Math.abs(dx), .01), b / Math.max(Math.abs(dy), .01));
      var mid = { x: cx + dx * sc, y: cy + dy * sc }, ux = T.x - mid.x, uy = T.y - mid.y, d = Math.hypot(ux, uy) || 1;
      if (sc >= 1) return null;   /* 화자가 말풍선 안쪽에 있음 */
      var L = mode === 'out' ? Math.min(64, d) : Math.min(mode === 'band' ? 44 : 22, Math.max(10, d - 6));
      /* 여백 띠의 꼬리는 자기 조각 테두리 안쪽 14px까지 들어가 '어느 조각의 대사인지' 보이게 */
      if (mode === 'band' && c.pr) {
        var edgeY = uy < 0 ? c.pr.y + c.pr.h - 14 : c.pr.y + 14;
        var need = Math.abs(uy) > 0.3 * d ? Math.abs((edgeY - mid.y) / (uy / d)) : 1e9;
        L = need <= 56 ? Math.max(L, need) : Math.min(26, Math.max(10, d - 6));   /* 조각까지 닿지 못하면 짧게 방향만 */
      }
      var tip = { x: mid.x + ux / d * L, y: mid.y + uy / d * L };
      var XL = 6, XR = secR.width - 6;   /* 꼬리 끝이 화면 밖으로 나가지 않게 */
      tip.x = Math.max(XL, Math.min(XR, tip.x));
      while (L > 8 && inZone(tip, ri)) { L -= 2; tip = { x: Math.max(XL, Math.min(XR, mid.x + ux / d * L)), y: mid.y + uy / d * L }; }
      return { mid: mid, tip: tip, bad: inZone(tip, ri) };
    }

    /* 한 말풍선이 무거워지는 긴 다문장 대사는 문장 끝에서 나눠 이어 붙인다 (대사 문자는 그대로) */
    var units = [];
    lines.forEach(function (ln, i) {
      var cfg = (P.lines || [])[i] || {}, typ = typeOf(ln, cfg);
      var parts = ln.text.split(/(?<=[.?!])\s+/);
      if ((typ === 'speech' || typ === 'offscreen') && parts.length > 1 && ln.text.replace(/\s/g, '').length > 18 && !cfg.noSplit) {
        parts.forEach(function (t, k) { units.push({ ln: Object.assign({}, ln, { text: t }), cfg: cfg, src: i, part: k }); });
      } else units.push({ ln: ln, cfg: cfg, src: i, part: 0 });
    });
    units.forEach(function (u, i) {
      var ln = u.ln, cfg = u.cfg;
      var type = typeOf(ln, cfg);
      var T0 = TYPE[type], fs = fsBoost ? T0.fontWide : T0.font;
      var pref = cfg.pref || { panel: ln.panel || 0, at: ln.at || 'gap' };
      var pan = panels[pref.panel || 0], ri = pan.ri, nRows = rowEls.length;
      var region = pan.safe;
      if (cfg.region === 'row') {
        var rowPs = panels.filter(function (p) { return p.ri === ri; });
        var x0 = Math.min.apply(null, rowPs.map(function (p) { return p.safe.x; })), x1 = Math.max.apply(null, rowPs.map(function (p) { return p.safe.x + p.safe.w; }));
        region = { x: x0, y: pan.safe.y, w: x1 - x0, h: pan.safe.h };
      }
      var pp = pref.at ? AT[pref.at] || AT.gap : [pref.x, pref.y];
      var prefPt = pPt({ panel: pref.panel || 0, x: pp[0], y: pp[1] });
      var bpPt = cfg.bandPref ? pPt(cfg.bandPref) : null;
      var talks = type !== 'mono' && type !== 'caption';
      var T = null, outTail = type === 'offscreen';
      var lastP = placed[placed.length - 1];
      /* 같은 화자의 연속 대사: 꼬리 대신 앞 말풍선과 이어 붙인다 */
      var joinTo = (talks && cfg.join !== false && lastP && !lastP.fail && ((lastP.ln.who && lastP.ln.who === ln.who) || lastP.src === u.src) && lastP.type === type) ? lastP : null;
      var Tcfg = null;
      if (talks && cfg.tail) {
        T = pPt(cfg.tail);
        var tp = panels[cfg.tail.panel || 0].r;
        if (outTail) T = { x: Math.max(tp.x - 12, Math.min(tp.x + tp.w + 12, T.x)), y: Math.max(tp.y - 12, Math.min(tp.y + tp.h + 12, T.y)) };
        Tcfg = T; if (joinTo) T = null;
      }
      var TT = T;
      /* 띠 안에서 이 말풍선이 놓일 수 있는 가로 범위: 자기 조각 밑(좌우로 조금 넘침 허용) */
      var bx0 = colX0, bx1 = colX1;   /* 띠는 화면 폭 전체, 자기 조각에서 멀수록 점수 감점 */
      var opts = shapeOptions(ln, type, fs, maxLines, Math.max(region.w, bx1 - bx0));
      var best = null, prev = placed[placed.length - 1];
      var same = placed.filter(function (q) { return !q.fail && q.ri === ri; });

      function orderOk(c) {
        if (!prev || prev.fail) return true;
        if (c.phase !== prev.phase) return c.phase > prev.phase;
        if (c.phase === 0) return true;
        if (c.x >= prev.x + prev.w - 6 && c.y >= prev.y - 14) return true;   /* 오른쪽 옆(높이가 거의 같을 때만) */
        if (c.x + c.w <= prev.x + prev.w * 0.5) return c.y >= prev.y + prev.h - 12;   /* 왼쪽: 앞 말풍선보다 거의 아래일 때만 */
        return c.y >= prev.y + 2;
      }
      function consider(c, base) {
        if (c.phase < curPhase || !orderOk(c)) return;
        /* 같은 화자의 앞 말풍선(컷 안)과 바로 아래 여백 띠의 말풍선은 목으로 이어 붙인다 — 이때는 꼬리를 따로 내지 않는다 */
        var adj = false;
        if (joinTo && c.phase !== joinTo.phase && c.ri === joinTo.ri && c.phase === joinTo.phase + 1 && joinTo.phase % 2 === 1) {
          var gy0 = c.y - (joinTo.y + joinTo.h), ov0 = Math.min(c.x + c.w, joinTo.x + joinTo.w) - Math.max(c.x, joinTo.x);
          adj = gy0 <= 30 && gy0 > -6 && ov0 >= 24;
        }
        c.adj = adj;
        var T = (joinTo && c.phase !== joinTo.phase && !adj) ? Tcfg : TT;
        for (var k = 0; k < same.length; k++) {
          if (boxHit(c, same[k], GAP)) return;
          if (same[k].tl && segHitsBox(same[k].tl.mid, same[k].tl.tip, c, 3)) return;
        }
        var mode = outTail ? 'out' : (c.phase % 2 === 0 ? 'band' : 'in'), tPen = 0;
        var crosses = function (q) { if (!q) return false; for (var k2 = 0; k2 < same.length; k2++) if (segHitsBox(q.mid, q.tip, same[k2], 3)) return true; return false; };
        var tl = T ? tailFor(c, T, mode, ri) : null;
        if (crosses(tl)) {
          /* 다른 말풍선을 가로지르면 화자 쪽 옆으로 짧게 꺾는다 */
          var cy0 = c.y + c.h / 2, side = T.x < c.x + c.w / 2 ? c.x - 40 : c.x + c.w + 40; side = Math.max(14, Math.min(secR.width - 14, side));
          tl = tailFor(c, { x: side, y: cy0 + (T.y < cy0 ? -14 : 14) }, 'in', ri); tPen = 35;
          if (crosses(tl)) return;
        }
        var cx = c.x + c.w / 2, cy = c.y + c.h / 2, jp = 0;
        if (joinTo) {
          var gx = Math.max(0, joinTo.x - (c.x + c.w), c.x - (joinTo.x + joinTo.w)), gy = Math.max(0, c.y - (joinTo.y + joinTo.h), joinTo.y - (c.y + c.h));
          var ov = Math.min(c.x + c.w, joinTo.x + joinTo.w) - Math.max(c.x, joinTo.x);
          jp = (c.phase === joinTo.phase || adj ? 0 : 140) + gy * 2 + gx * 2 + (ov < 24 ? 60 : 0);
        }
        var tidy = 0;
        if (c.phase % 2 === 1 && c.where === 'in') {
          if (Math.abs(c.x + c.w - (region.x + region.w)) < 2 || Math.abs(c.x - region.x) < 2) tidy -= 14;
          if (Math.abs(c.y - region.y) < 2 || Math.abs(c.y + c.h - (region.y + region.h)) < 2) tidy -= 8;
          for (var q2 = 0; q2 < same.length; q2++) if (same[q2].phase === c.phase && (Math.abs(same[q2].x + same[q2].w - c.x - c.w) < 2 || Math.abs(same[q2].x - c.x) < 2)) tidy -= 10;
        }
        /* 콘티가 경계-상·하(edge-*)로 정한 대사는 컷 안쪽 자리보다 경계 걸침을 먼저 쓴다 */
        if (c.where === 'in' && /^edge-/.test(pref.at || '')) base += 60;
        var s = base + jp + tidy + c.pen + Math.hypot(cx - prefPt.x, (cy - prefPt.y) * (c.phase % 2 === 1 ? 1 : 0.2)) * 0.7;
        if (T) s += Math.max(0, rectDist(c, T) - 70) * 0.8 + (tl && tl.bad ? 120 : 0) + tPen + (!tl ? 60 : 0);
        if (!best || s < best.s) { best = c; best.s = s; best.tl = tl; }
      }
      function zoneFree(c) { for (var z = 0; z < zones.length; z++) if (shapeHitsZone(c, zones[z], ZONE_PAD)) return false; return true; }

      opts.forEach(function (o) {
        var mk = function (x, y, phase, where) { return { x: x, y: y, w: o.w, h: o.h, kind: o.kind, o: o, pen: o.pen, phase: phase, where: where, ri: ri, pr: pan.r }; };
        var inPh = 2 * ri + 1, bandPh = 2 * ri + 2;
        /* (가) 조각 안 */
        if (curPhase <= inPh && !cfg.place) {
          for (var y = region.y; y + o.h <= region.y + region.h; y += 4)
            for (var x = region.x; x + o.w <= region.x + region.w; x += 4) {
              var c = mk(x, y, inPh, 'in'); if (zoneFree(c)) consider(c, 0);
            }
          /* (나) 컷 맨 위·맨 아래 경계에 걸침 (다른 조각으로 넘어가지 않는 바깥 경계만) */
          if (cfg.edge || /^edge/.test(pref.at || '')) {
            var edges = [];
            if (ri === 0) edges.push([pan.r.y, 'edge-top']);
            if (ri === nRows - 1) edges.push([pan.r.y + pan.r.h, 'edge-bottom']);
            edges.forEach(function (e) {
              for (var x2 = pan.safe.x; x2 + o.w <= pan.safe.x + pan.safe.w; x2 += 4) {
                var c2 = mk(x2, e[0] - o.h / 2, inPh, e[1]); if (zoneFree(c2)) consider(c2, 45);
              }
            });
          }
        }
        /* (다) 이 줄 바로 아래 여백 띠 — 자기 조각 밑에, 띠 높이는 필요한 만큼 늘어난다 */
        if (curPhase <= bandPh && cfg.place !== 'above') {
          var top = rowBottom[ri] + 8, lim = top + bandH[ri] + 60;
          for (var y3 = top; y3 <= lim; y3 += 4)
            for (var x3 = bx0; x3 + o.w <= bx1; x3 += 4) {
              var grow = Math.max(0, y3 + o.h + 8 - (rowBottom[ri] + bandH[ri]));
              var over = Math.max(0, pan.r.x - x3) + Math.max(0, x3 + o.w - (pan.r.x + pan.r.w));
              var cb = mk(x3, y3, bandPh, 'band');
              if (bpPt) { var bcx = x3 + o.w / 2; cb.pen += Math.abs(bcx - bpPt.x) * 0.7 - Math.abs(bcx - prefPt.x) * 0.7; }
              consider(cb, 230 + (P.bandBase || 0) + grow * 0.9 + over * (bpPt ? 0 : (rowEls.length > 1 || panels.length > 1 ? 1.6 : 0.3)));
            }
        }
        /* (라) 컷 위 여백 띠: 첫 줄에서, 앞 말풍선이 모두 위 띠일 때만 */
        if (ri === 0 && curPhase === 0 && cfg.place !== 'below')
          for (var x4 = colX0; x4 + o.w <= colX1; x4 += 4)
            consider(mk(x4, wrapR.y - 8 - aboveH - o.h, 0, 'above'), 260);
      });

      if (!best) { placed.push({ fail: true, i: i, text: ln.text, ri: ri }); return; }
      best.i = i; best.type = type; best.fs = fs; best.ln = ln; best.src = u.src; best.Tc = Tcfg; best.outT = outTail;
      if (joinTo && (best.phase === joinTo.phase || best.adj)) {
        var ox0 = Math.max(best.x, joinTo.x), ox1 = Math.min(best.x + best.w, joinTo.x + joinTo.w);
        var top = joinTo.y + joinTo.h <= best.y ? joinTo : best, bot = top === joinTo ? best : joinTo;
        if (ox1 - ox0 >= 24 && bot.y - (top.y + top.h) <= 30) {
          best.join = { x: (ox0 + ox1) / 2, top: top, bot: bot };
          /* 앞 말풍선 꼬리가 이 말풍선에 닿으면, 꼬리를 이 말풍선에서 화자 쪽으로 낸다 */
          if (joinTo.tl && segHitsBox(joinTo.tl.mid, joinTo.tl.tip, best, 4) && joinTo.Tc) {
            var nt = tailFor(best, joinTo.Tc, joinTo.outT ? 'out' : (best.phase % 2 === 0 || best.phase === 0 ? 'band' : 'in'), ri);
            if (nt) { joinTo.tl = null; best.tl = nt; }
          }
        }
      }
      curPhase = best.phase;
      if (best.phase === 0) aboveH += best.h + GAP;
      else if (best.phase % 2 === 0) bandH[ri] = Math.max(bandH[ri], best.y + best.h + 8 - rowBottom[ri]);
      placed.push(best);
    });

    /* 경계에 걸친 말풍선이 앞뒤 컷을 가리지 않도록, 걸친 만큼 여백을 흐름에 넣는다 */
    var topPad = 0, botPad = 0;
    placed.forEach(function (c) {
      if (c.fail) return;
      if (c.where === 'edge-top') topPad = Math.max(topPad, c.pr.y - c.y + 8);
      if (c.where === 'edge-bottom') botPad = Math.max(botPad, c.y + c.h - (c.pr.y + c.pr.h) + 8);
    });
    /* 위 띠는 아래에서 위로 쌓았으니 위에서부터 다시 정렬 */
    var aboveShift = (aboveH ? aboveH + 8 : 0) + Math.ceil(topPad), yy = wrapR.y + GAP;
    placed.forEach(function (c) {
      if (c.fail || c.phase !== 0) return;
      var dy = yy - c.y; c.y = yy; yy += c.h + GAP;
      if (c.tl) { c.tl.mid.y += dy; c.tl.tip.y += dy; }
    });
    /* 띠를 실제 흐름에 넣고, 줄마다 내려간 만큼 좌표를 옮긴다 */
    var shift = rowEls.map(function (r, k) { var s = aboveShift; for (var j = 0; j < k; j++) s += bandH[j] ? bandH[j] + 4 : 0; return s; });
    if (aboveShift) { var ba = document.createElement('div'); ba.className = 'bv4-band bv4-above'; ba.style.height = aboveShift + 'px'; wrap.parentNode.insertBefore(ba, wrap); }
    if (botPad) {
      var lastK = rowEls.length - 1, have = bandH[lastK] ? bandH[lastK] + 4 : 0;
      if (botPad > have) { var bb = document.createElement('div'); bb.className = 'bv4-band bv4-below-pad'; bb.style.height = Math.ceil(botPad - have) + 'px'; rowEls[lastK].parentNode.insertBefore(bb, rowEls[lastK].nextSibling && rowEls[lastK].nextSibling.classList && rowEls[lastK].nextSibling.classList.contains('bv4-rowband') ? rowEls[lastK].nextSibling.nextSibling : rowEls[lastK].nextSibling); }
    }
    rowEls.forEach(function (r, k) {
      if (!bandH[k]) return;
      var bd = document.createElement('div'); bd.className = 'bv4-band bv4-rowband'; bd.style.height = (bandH[k] + 4) + 'px';
      r.parentNode.insertBefore(bd, r.nextSibling);
    });
    placed.forEach(function (c) {
      if (c.fail) return;
      var dy = c.phase === 0 ? 0 : shift[c.ri];
      c.y += dy; if (c.tl) { c.tl.mid.y += dy; c.tl.tip.y += dy; }
    });
    zones.forEach(function (z) { z.y += shift[z.ri]; });
    /* 위 띠에 쌓인 같은 화자 묶음: 꼬리는 컷에 가장 가까운(맨 아래) 말풍선에서 낸다 */
    var ab = placed.filter(function (c) { return !c.fail && c.phase === 0; });
    if (ab.length > 1) {
      var low = ab[ab.length - 1], src = null;
      ab.forEach(function (c) {
        if (c === low || !c.tl) return;
        if (ab.some(function (o) { return o !== c && segHitsBox(c.tl.mid, c.tl.tip, o, 3); })) { src = src || c; c.tl = null; }
      });
      if (src && !low.tl && src.Tc && (low.ln.who === src.ln.who || low.src === src.src)) {
        var T2 = { x: src.Tc.x, y: src.Tc.y + shift[0] };
        low.tl = tailFor(low, T2, 'band', 0);
      }
    }
    if (screenRep) screenRep.shift(shift[panels[P.screen.panel || 0].ri]);

    placed.forEach(function (c) { if (!c.fail) drawBubble(layer, c, ep); });
    placed.forEach(function (c) { if (c.join) drawJoin(layer, c.join); });
    if (SHOW_ZONES) zones.forEach(function (z) {
      var d = document.createElement('div');
      d.className = 'bv4-zone' + (z.approved ? ' is-approved' : '');
      d.style.cssText = 'left:' + z.x + 'px;top:' + z.y + 'px;width:' + z.w + 'px;height:' + z.h + 'px;';
      d.innerHTML = '<span>' + z.label + (z.approved ? '' : ' (가정)') + '</span>';
      layer.appendChild(d);
    });
    return { placed: placed, zones: zones, screen: screenRep, cut: cut };
  }

  /* ---------- 그리기 ---------- */
  function svgEl(w, h) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', w); s.setAttribute('height', h); s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    s.setAttribute('class', 'bv4-svg'); s.setAttribute('aria-hidden', 'true');
    return s;
  }
  function f1(n) { return Math.round(n * 10) / 10; }

  /* tail = 꼬리 끝점(말풍선 기준 좌표). 꼬리 끝은 레이아웃 단계에서 이미 계산돼 있다 */
  function ellipsePath(w, h, tail, kind) {
    var cx = w / 2, cy = h / 2, a = w / 2 - 1.5, b = h / 2 - 1.5, M = 96, pts = [], i;
    var jag = kind === 'jag', t0 = null, del = 0;
    var S = 720, ring = [];
    for (i = 0; i < S; i++) ring.push(sePt(cx, cy, a, b, i / S * Math.PI * 2, 1));
    var mi = -1, i1 = -1, i2 = -1;
    if (tail) {
      var bd = 1e9, ta = Math.atan2(tail.y - cy, tail.x - cx);
      for (i = 0; i < S; i++) { var aa = Math.atan2(ring[i].y - cy, ring[i].x - cx), df = Math.abs(Math.atan2(Math.sin(aa - ta), Math.cos(aa - ta))); if (df < bd) { bd = df; mi = i; } }
      var half = Math.max(7, Math.min(10, Math.hypot(tail.x - ring[mi].x, tail.y - ring[mi].y) * 0.3)), acc = 0;
      for (i2 = mi; acc < half; ) { var nx2 = (i2 + 1) % S; acc += Math.hypot(ring[nx2].x - ring[i2].x, ring[nx2].y - ring[i2].y); i2 = nx2; }
      acc = 0;
      for (i1 = mi; acc < half; ) { var nx1 = (i1 - 1 + S) % S; acc += Math.hypot(ring[nx1].x - ring[i1].x, ring[nx1].y - ring[i1].y); i1 = nx1; }
    }
    var n = jag ? Math.max(40, Math.round(Math.PI * (a + b) / 6.5 / 2) * 2) : 120, step = Math.max(1, Math.round(S / n));
    /* 꼬리가 있으면 꼬리 밑변 오른쪽(i2)에서 출발해 한 바퀴 돌아 왼쪽(i1)에서 끝난 뒤 꼬리 끝으로 */
    var start = tail ? i2 : 0, span = tail ? (i1 - i2 + S) % S : S, k = 0;
    for (var o = 0; o <= span; o += step) {
      var ix = (start + Math.min(o, span)) % S, q = ring[ix];
      if (jag && (k++ % 2) && o > 0 && o < span) q = { x: cx + (q.x - cx) * 0.92, y: cy + (q.y - cy) * 0.92 };
      pts.push(q);
      if (o < span && o + step > span) { pts.push(ring[(start + span) % S]); break; }
    }
    if (tail) pts.push({ x: tail.x, y: tail.y });
    return 'M' + pts.map(function (q) { return f1(q.x) + ',' + f1(q.y); }).join(' L') + ' Z';
  }

  /* 둥근 사각 + 꼬리 */
  function roundPath(w, h, tail) {
    var r = Math.min(h / 2, 18), x0 = 1.5, y0 = 1.5, x1 = w - 1.5, y1 = h - 1.5;
    var body = 'M' + (x0 + r) + ',' + y0 + ' H' + (x1 - r) + ' A' + r + ',' + r + ' 0 0 1 ' + x1 + ',' + (y0 + r) + ' V' + (y1 - r) +
      ' A' + r + ',' + r + ' 0 0 1 ' + (x1 - r) + ',' + y1 + ' H' + (x0 + r) + ' A' + r + ',' + r + ' 0 0 1 ' + x0 + ',' + (y1 - r) +
      ' V' + (y0 + r) + ' A' + r + ',' + r + ' 0 0 1 ' + (x0 + r) + ',' + y0 + ' Z';
    if (!tail) return { body: body };
    var cx = w / 2, cy = h / 2, ux = tail.x - cx, uy = tail.y - cy, bx, by, nx, ny;
    if (Math.abs(uy) * w > Math.abs(ux) * h) { by = uy > 0 ? y1 : y0; bx = Math.max(x0 + r + 8, Math.min(x1 - r - 8, cx + ux * (h / 2) / Math.abs(uy))); nx = 1; ny = 0; }
    else { bx = ux > 0 ? x1 : x0; by = Math.max(y0 + r * 0.6 + 6, Math.min(y1 - r * 0.6 - 6, cy + uy * (w / 2) / Math.abs(ux))); nx = 0; ny = 1; }
    return { body: body, tail: 'M' + f1(bx - nx * 7) + ',' + f1(by - ny * 7) + ' L' + f1(tail.x) + ',' + f1(tail.y) + ' L' + f1(bx + nx * 7) + ',' + f1(by + ny * 7) + ' Z',
      cover: 'M' + f1(bx - nx * 5.5) + ',' + f1(by - ny * 5.5) + ' L' + f1(bx + nx * 5.5) + ',' + f1(by + ny * 5.5) };
  }

  function drawBubble(layer, c, ep) {
    var el = document.createElement('div');
    el.className = 'bv4-b bv4-k-' + c.kind + ' bv4-t-' + c.type + ' bv4-w-' + c.where;
    el.style.cssText = 'left:' + f1(c.x) + 'px;top:' + f1(c.y) + 'px;width:' + c.w + 'px;height:' + c.h + 'px;';
    el.dataset.i = c.i;
    var tail = c.tl ? { x: c.tl.tip.x - c.x, y: c.tl.tip.y - c.y } : null;
    if (c.kind === 'ellipse' || c.kind === 'jag') {
      var s = svgEl(c.w, c.h), p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', ellipsePath(c.w, c.h, tail, c.kind));
      s.appendChild(p); el.appendChild(s);
    } else if (c.kind === 'round' || c.kind === 'jagrect') {
      var s2 = svgEl(c.w, c.h), rp = roundPath(c.w, c.h, tail);
      if (rp.tail) { var pt = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pt.setAttribute('d', rp.tail); s2.appendChild(pt); }
      var pb = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pb.setAttribute('d', rp.body); s2.appendChild(pb);
      if (rp.cover) { var pc = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pc.setAttribute('d', rp.cover); pc.setAttribute('class', 'bv4-cover'); s2.appendChild(pc); }
      if (c.kind === 'jagrect') el.classList.add('is-jag');
      el.appendChild(s2);
    }
    var who = c.ln.who ? '<span class="bv4-sr">' + c.ln.who + ': </span>' : '';
    var t = document.createElement('div');
    t.className = 'bv4-text bv4-' + TYPE[c.type].cls;
    t.style.fontSize = c.fs + 'px';
    t.style.width = c.o.ms.W + 'px';
    t.textContent = c.o.ms.text || c.ln.text;
    if (t.textContent.indexOf('\n') >= 0) t.style.whiteSpace = 'pre-line';
    el.appendChild(t);
    if (who) el.insertAdjacentHTML('afterbegin', who);
    layer.appendChild(el);
  }

  /* 같은 화자 말풍선 잇기: 두 말풍선 사이를 흰 목으로 연결 */
  function drawJoin(layer, j) {
    var A = j.top.y <= j.bot.y ? j.top : j.bot, B = A === j.top ? j.bot : j.top;
    var x0 = Math.max(A.x, B.x), x1 = Math.min(A.x + A.w, B.x + B.w); if (x1 - x0 < 24) return;
    j = { x: (x0 + x1) / 2, top: A, bot: B };
    var y1 = j.top.y + j.top.h - 7, y2 = j.bot.y + 7, w = 14;
    if (y2 <= y1) return;
    var s = svgEl(w + 4, y2 - y1), d = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    s.style.left = (j.x - w / 2 - 2) + 'px'; s.style.top = y1 + 'px'; s.setAttribute('class', 'bv4-svg bv4-join');
    d.setAttribute('d', 'M2,0 V' + (y2 - y1) + ' H' + (w + 2) + ' V0 Z');
    var l1 = document.createElementNS('http://www.w3.org/2000/svg', 'path'); l1.setAttribute('d', 'M2,5 V' + (y2 - y1 - 5) + ' M' + (w + 2) + ',5 V' + (y2 - y1 - 5)); l1.setAttribute('class', 'bv4-join-line');
    s.appendChild(d); s.appendChild(l1); layer.appendChild(s);
  }

  /* 휴대폰 메시지 화면 */
  function renderScreen(layer, S, panels) {
    var p = panels[S.panel || 0].r;
    var box = { x: p.x + p.w * S.x / 100, y: p.y + p.h * S.y / 100, w: p.w * S.w / 100, h: p.h * S.h / 100 };
    var el = document.createElement('div');
    el.className = 'bv4-screen';
    el.innerHTML = '<div class="bv4-th-head"><span class="bv4-th-back" aria-hidden="true">‹</span>' + S.title + '</div>' +
      '<div class="bv4-th-body">' + S.messages.map(function (m) {
        var txt = m.keepFirst ? m.text.replace(/^([^.?!]+[.?!])/, function (f) { return f.replace(/ /g, '\u00a0'); }) : m.text;
        return '<div class="bv4-msg ' + (m.me ? 'is-me' : 'is-them') + '"><p>' + txt + '</p><span class="bv4-msg-t">' + m.time + '</span></div>';
      }).join('') + '</div>' + (S.approved || !REVIEW ? '' : '<span class="bv4-screen-note">원화 합성 전 화면 UI</span>');
    function place(dy) { el.style.cssText = 'left:' + box.x + 'px;top:' + (box.y + dy) + 'px;width:' + box.w + 'px;height:' + box.h + 'px;'; }
    place(0);
    layer.appendChild(el);
    return { el: el, shift: function (dy) { place(dy); } };
  }

  /* ---------- 자체 검증 ---------- */
  function verify(sec, res) {
    var out = { no: +sec.dataset.no, bubbles: [], screen: null };
    if (!res) return out;
    var bySrc = {};
    res.placed.forEach(function (c) { if (!c.fail) (bySrc[c.src] = bySrc[c.src] || []).push(c.ln.text); });
    out.textIntact = (res.cut.lines || []).every(function (l, i) { return (bySrc[i] || []).join(' ') === l.text; });
    var secR = sec.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    res.placed.forEach(function (c) {
      if (c.fail) { out.bubbles.push({ i: c.i, fail: '자리 없음', text: c.text }); return; }
      var el = sec.querySelector('.bv4-b[data-i="' + c.i + '"]'), t = el.querySelector('.bv4-text');
      var R = rel(el, secR), rows = lineBoxes(t), tr = rel(t, secR), outside = 0;
      rows.forEach(function (r) {
        var pts = [[tr.x + r.l, tr.y + r.t], [tr.x + r.r, tr.y + r.t], [tr.x + r.l, tr.y + r.b], [tr.x + r.r, tr.y + r.b]];
        pts.forEach(function (q) {
          if (c.kind === 'ellipse' || c.kind === 'jag') {
            var a = R.w / 2 - 2, b = R.h / 2 - 2, k = c.kind === 'jag' ? 0.92 : 1;
            var nx = Math.abs(q[0] - (R.x + R.w / 2)) / (a * k), ny = Math.abs(q[1] - (R.y + R.h / 2)) / (b * k);
            if (Math.pow(nx, N) + Math.pow(ny, N) > 1.0001) outside++;
          } else if (q[0] < R.x + 1 || q[0] > R.x + R.w - 1 || q[1] < R.y + 1 || q[1] > R.y + R.h - 1) outside++;
        });
      });
      var zoneHits = res.zones.filter(function (z) { return shapeHitsZone({ x: R.x, y: R.y, w: R.w, h: R.h, kind: c.kind }, z, 0); }).map(function (z) { return z.label; });
      var pageR = el.getBoundingClientRect();
      out.bubbles.push({ i: c.i, type: c.type, kind: c.kind, where: c.where, lines: rows.length, font: parseFloat(getComputedStyle(t).fontSize),
        textOutside: outside, zoneHits: zoneHits, offscreen: pageR.left < 0 || pageR.right > vw, tailOff: !!(c.tl && (c.tl.tip.x < 0 || c.tl.tip.x > secR.width)), w: Math.round(R.w), h: Math.round(R.h), text: c.ln.text });
    });
    if (res.screen) {
      var body = res.screen.el.querySelector('.bv4-th-body');
      var msgs = Array.prototype.map.call(res.screen.el.querySelectorAll('.bv4-msg p'), function (p) {
        var rows = lineBoxes(p), r0 = document.createRange(); r0.selectNodeContents(p.firstChild);
        /* 첫 줄의 글자 */
        var first = '', tn = p.firstChild, base = rows.length ? rows[0] : null;
        if (base) { var pr = p.getBoundingClientRect(); for (var k = 0; k < tn.length; k++) { r0.setStart(tn, k); r0.setEnd(tn, k + 1); var q = r0.getBoundingClientRect(); if (q.height && Math.abs(q.top - pr.top - base.t) < 4) first += tn.data[k]; } }
        return { lines: rows.length, font: parseFloat(getComputedStyle(p).fontSize), clipped: p.scrollHeight > p.clientHeight + 1, firstLine: first.replace(/\u00a0/g, ' ') };
      });
      var br = body.getBoundingClientRect(), first = res.screen.el.querySelector('.bv4-msg').getBoundingClientRect();
      out.screen = { overflow: body.scrollHeight > body.clientHeight + 1, topCut: first.top < br.top - 0.5, msgs: msgs };
    }
    return out;
  }

  /* ---------- 설정이 없는 컷의 임시 설정 ----------
   * 대사 데이터(at·panel·style·who)에서 유형·선호 위치를 만들고, 원화가 없는 컷의 보호 영역은 컷 모양(비율)으로 가정한다.
   * 이 값은 모두 임시(approved:false)이며 원화가 들어오면 data/ep01v3-bubbles.js 에서 실측값으로 덮어쓴다. */
  var GENERIC_WHO = { '학생': 1, '학생들': 1, '교사': 1 };
  var ZONE_KIND = {
    face:  [{ x: 28, y: 14, w: 44, h: 44, label: '얼굴' }],
    face2: [{ x: 6,  y: 14, w: 34, h: 44, label: '왼쪽 인물 얼굴' }, { x: 60, y: 14, w: 34, h: 44, label: '오른쪽 인물 얼굴' }],
    wide:  [{ x: 36, y: 8,  w: 28, h: 84, label: '인물' }],
    phone: [{ x: 26, y: 20, w: 48, h: 60, label: '휴대폰·손' }],
    hands: [{ x: 22, y: 28, w: 56, h: 50, label: '손·소품' }],
    none:  []
  };
  function ratioOf(r) { var q = String(r || '4:3').split(':'); return (parseFloat(q[0]) || 4) / (parseFloat(q[1]) || 3); }

  function autoConfig(cut, ep, over) {
    var B = window.EP01V3_BUBBLES || {}, kinds = B.zoneKind || {}, off = B.offscreen || {};
    var rows = cut.rows || [[{ ratio: cut.ratio }]], panelsMeta = [];
    rows.forEach(function (row) { row.forEach(function (p) { panelsMeta.push({ ratio: ratioOf(p.ratio || cut.ratio), rowLen: row.length }); }); });
    var lines = cut.lines || [];
    /* 컷 아래 여백(gap) 대사는 패널이 정해지지 않았으면 맨 아래 조각에 붙는다 (띠·여러 줄 컷에서 컷 전체 아래) */
    function panelOf(l) { return l.panel != null ? l.panel : ((l.at || 'gap') === 'gap' ? panelsMeta.length - 1 : 0); }
    /* 패널마다 말하는 사람(일반 호칭 제외) 수 */
    var people = panelsMeta.map(function () { return []; });
    lines.forEach(function (l) { var pi = panelOf(l); if (l.who && !GENERIC_WHO[l.who] && people[pi] && people[pi].indexOf(l.who) < 0) people[pi].push(l.who); });
    var zones = [], tailAt = [];
    panelsMeta.forEach(function (pm, pi) {
      var kind = kinds[cut.no] || (pm.ratio >= 1.6 ? 'wide' : 'face');
      if (kind === 'face' && people[pi].length >= 2) kind = 'face2';
      var zs = ZONE_KIND[kind] || [];
      tailAt[pi] = zs.length ? zs.map(function (z) { return { x: z.x + z.w / 2, y: z.y + z.h * 0.8 }; }) : [{ x: 50, y: 60 }];
      zs.forEach(function (z) { zones.push({ panel: pi, x: z.x, y: z.y, w: z.w, h: z.h, label: z.label, approved: false }); });
    });
    var out = { zones: zones, lines: [], status: 'provisional', auto: true };
    var prev = null;
    lines.forEach(function (l, i) {
      var pi = panelOf(l), typ = typeOf(l, null);
      if (off[cut.no] && l.style !== 'thought') typ = 'offscreen';
      var cfg = { type: typ, pref: { panel: pi, at: l.at === 'above' ? 'gap' : (l.at || 'gap') }, region: (panelsMeta[pi] && panelsMeta[pi].rowLen > 1 && cut.no !== 33) ? 'row' : 'panel', edge: true };
      if (l.at === 'above') cfg.place = 'above';
      if (typ !== 'mono' && typ !== 'caption') {
        var ts = tailAt[pi] || [{ x: 50, y: 60 }], slot = Math.max(0, people[pi] ? people[pi].indexOf(l.who) : 0);
        var t = ts[Math.min(slot, ts.length - 1)];
        cfg.tail = { panel: pi, x: t.x, y: t.y };
      }
      /* 같은 화자의 연속 말풍선은 (바로 붙어 놓일 때) 이어 붙인다. 서로 다른 사람일 수 있는 일반 호칭(학생)이나 다른 조각의 대사는 이어 붙이지 않는다 */
      if (!(prev && l.who && prev.who === l.who && !GENERIC_WHO[l.who] && panelOf(prev) === pi)) cfg.join = false;
      out.lines[i] = cfg; prev = l;
    });
    if (over) Object.keys(over).forEach(function (k) { out[k] = over[k]; });
    if (over && over.lines) out.auto = false;
    return out;
  }

  /* ---------- 진입 ---------- */
  var current = null, lastW = 0, last = [], fontsOk = false;
  function fontState() {
    var f = document.fonts;
    return { pretendard500: !!(f && f.check('500 16px Pretendard', '가')), pretendard600: !!(f && f.check('600 16px Pretendard', '가')), notoSerif: !!(f && f.check('500 15px "Noto Serif KR"', '가')) };
  }
  function run() {
    if (!current) return;
    var ep = current.ep, B = window.EP01V3_BUBBLES || {}, ov = B.cuts || {}, report = [];
    last = [];
    if (!ep || current.id !== 'ep01v3') return;
    document.body.classList.add('bv4-on');
    var t0 = performance.now();
    ep.cuts.forEach(function (cut) {
      var no = cut.no, o = ov[no];
      if (!(cut.lines && cut.lines.length) && !(o && o.screen)) return;
      var sec = document.getElementById('cut-' + (no < 10 ? '0' : '') + no);
      if (!sec) return;
      sec.classList.add('bv4-cut');
      var P = autoConfig(cut, ep, o);
      var res = layoutCut(sec, cut, P, ep);
      last.push([sec, res, P]);
      var v = verify(sec, res); v.status = P.status; v.auto = !!P.auto; v.hasArt = !!(cut.image || (cut.rows && cut.rows[0] && cut.rows[0][0] && cut.rows[0][0].image));
      report.push(v);
    });
    fontsOk = fontState();
    window.__bv4 = { width: document.documentElement.clientWidth, cuts: report, fonts: fontsOk, ms: Math.round(performance.now() - t0) };
    lastW = document.documentElement.clientWidth;
    root.classList.remove('bv4-pending');
    document.body.classList.add('bv4-done');
  }
  window.BubblesV4 = {
    /* 검수용: 다시 배치하지 않고 지금 화면 그대로 검증만 */
    verifyNow: function () { return last.map(function (x) { return verify(x[0], x[1]); }); },
    rerun: function () { run(); return window.__bv4; },
    apply: function (rootEl, ep, meta) {
      current = { ep: ep, id: meta && meta.id };
      if (!meta || meta.id !== 'ep01v3') { root.classList.remove('bv4-pending'); document.body.classList.remove('bv4-on', 'bv4-done'); return; }
      document.body.classList.remove('bv4-done');
      var go = function () { requestAnimationFrame(run); };
      /* 글꼴을 실제로 불러온 뒤에 줄바꿈을 잰다 (3.5초 안에 못 불러오면 대체 글꼴로 진행하고, 불러온 뒤 한 번 더 배치한다) */
      var F = document.fonts;
      if (F && F.load) {
        var wait = Promise.all([F.load('500 16px Pretendard', '가나다'), F.load('600 16px Pretendard', '가나다'), F.load('500 15px "Noto Serif KR"', '가나다')]);
        Promise.race([wait, new Promise(function (r) { setTimeout(r, 3500); })]).then(function () { return F.ready; }).then(go, go);
        wait.then(function () { if (document.body.classList.contains('bv4-done') && !fontsOk.pretendard500) go(); });
      } else go();
    }
  };
  var tmr = null;
  window.addEventListener('resize', function () {
    if (document.documentElement.clientWidth === lastW) return;
    clearTimeout(tmr); tmr = setTimeout(run, 120);
  });
  window.addEventListener('hashchange', function () { if (!/ep01v3/.test(location.hash)) root.classList.remove('bv4-pending'); else root.classList.add('bv4-pending'); });
})();
