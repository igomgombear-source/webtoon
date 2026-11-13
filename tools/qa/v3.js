/* 104컷 제작판(#ep01v3) 자동 검수 — 브라우저 안에서 돌린다 (tools/qa/v3.html).
 * 읽기만 한다. 결과는 { fail:[], warn:[], info:[] } — 항목은 { id, w, no, msg } */
(function () {
  'use strict';
  var WIDTHS = [320, 360, 390, 430, 768];
  var AT_OK = { 'in-tl': 1, 'in-tr': 1, 'in-bl': 1, 'in-br': 1, 'in-br2': 1, 'edge-top-l': 1, 'edge-top-r': 1, 'edge-bottom-l': 1, 'edge-bottom-r': 1, gap: 1, above: 1 };
  /* 알려진 한계: 정본 문구를 바꾸지 않고는 지킬 수 없는 항목. 숨기지 않고 info 로 따로 보고한다 */
  var KNOWN = window.V3_KNOWN || {};

  function add(res, level, id, w, no, msg) { res[level].push({ id: id, w: w, no: no, msg: msg }); }

  function loadFrame(w) {
    return new Promise(function (ok) {
      var f = document.createElement('iframe');
      f.style.cssText = 'width:' + w + 'px;height:800px;border:0;position:absolute;left:0;top:0;visibility:hidden';
      f.src = '../../index.html#ep01v3';
      f.onload = function () { ok(f); };
      document.body.appendChild(f);
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function settle(f) {
    var d = f.contentDocument, win = f.contentWindow;
    for (var i = 0; i < 60 && !d.querySelector('.cut'); i++) await wait(100);
    var H = d.documentElement.scrollHeight;
    for (var y = 0; y < H; y += 500) { win.scrollTo(0, y); await wait(18); }
    win.scrollTo(0, 0);
    for (var k = 0; k < 40; k++) {
      var pending = [].filter.call(d.images, function (im) { return !im.complete; }).length;
      if (!pending) break; await wait(100);
    }
    await wait(300);
    return d;
  }
  function rect(e) { return e.getBoundingClientRect(); }
  function hit(a, b) { return a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1; }

  async function dataChecks(res, spec) {
    var f = await loadFrame(360); var d = await settle(f); var W = f.contentWindow.WEBTOON;
    var ep = W.episodeData.ep01v3; var cuts = ep.cuts;
    if (cuts.length !== 104) add(res, 'fail', 'data.count', 0, 0, '컷 수 ' + cuts.length);
    cuts.forEach(function (c, i) {
      var s = spec.cuts[i];
      if (c.no !== i + 1) add(res, 'fail', 'data.order', 0, i + 1, '번호 순서 ' + c.no);
      if (!s) return;
      function eq(id, a, b) { if (JSON.stringify(a) !== JSON.stringify(b)) add(res, 'fail', id, 0, c.no, '기준 ' + JSON.stringify(b) + ' ≠ 데이터 ' + JSON.stringify(a)); }
      eq('spec.width', c.width || 100, s.width); eq('spec.ratio', c.ratio, s.ratio); eq('spec.shape', c.shape, s.shape);
      eq('spec.after', c.spacing.after, s.after); eq('spec.before', c.spacing.before || 0, s.before);
      eq('spec.time', (c.datetime && c.datetime.time) || null, s.time);
      eq('spec.lines', (c.lines || []).map(function (l) { return [l.who || '', l.style, l.text]; }), s.lines);
      eq('spec.at', (c.lines || []).map(function (l) { return l.at || 'gap'; }), s.at);
      eq('spec.rows', c.rows ? c.rows.map(function (r) { return r.length; }) : null, s.rows);
      eq('spec.inset', c.inset ? c.inset.to : null, s.inset); eq('spec.link', c.link || null, s.link);
      eq('spec.overflow', c.overflow ? c.overflow.edge : null, s.overflow);
      var panels = c.rows ? c.rows.reduce(function (a, r) { return a + r.length; }, 0) : 1;
      (c.lines || []).forEach(function (l, j) {
        if (!AT_OK[l.at || 'gap']) add(res, 'fail', 'data.at', 0, c.no, '알 수 없는 위치 ' + l.at);
        if ((l.panel || 0) >= panels) add(res, 'fail', 'data.panel', 0, c.no, '컷 칸 번호 초과 ' + l.panel);
        if (!l.text) add(res, 'fail', 'data.empty', 0, c.no, '빈 대사 ' + j);
        if (l.style !== 'thought' && l.style !== 'phone' && l.style !== 'caption' && !l.who && !/^…+$|^……$/.test(l.text)) add(res, 'warn', 'data.speaker', 0, c.no, '화자 없는 말풍선: ' + l.text.slice(0, 16));
      });
      if (c.image && !/^ep01v3-(035-webtoon-style|050-webtoon-style|066-webtoon-style|001-opening-portrait|016-staffroom-desk-REV2|076-phone-handoff)-DRAFT\.webp$/.test(c.image)) add(res, 'fail', 'data.image', 0, c.no, '승인 목록에 없는 이미지 ' + c.image);
      if (c.image && c.imageStatus !== 'draft') add(res, 'fail', 'data.draft', 0, c.no, 'DRAFT 표시 없는 임시 원화');
    });
    var withImg = cuts.filter(function (c) { return c.image; }).map(function (c) { return c.no; });
    if (JSON.stringify(withImg) !== '[1,16,35,50,66,76]') add(res, 'warn', 'data.images', 0, 0, '그림이 연결된 컷 ' + JSON.stringify(withImg) + ' (현재 승인: 1·16·35·50·66·76)');
    var c16 = cuts.filter(function (c) { return c.no === 16; })[0];
    if (!c16 || !/REV2/.test(c16.image || '')) add(res, 'fail', 'data.rev2', 0, 16, '16컷은 REV2 원화여야 함');
    var c74 = cuts.filter(function (c) { return c.no === 74; })[0];
    if (!c74 || (c74.lines || []).length !== 1 || c74.lines[0].who || c74.lines[0].style !== 'silence') add(res, 'fail', 'data.silence', 0, 74, '74컷은 화자 없는 침묵(silence) 1줄이어야 함');
    f.remove();
  }

  async function widthChecks(res, w) {
    var f = await loadFrame(w), d = await settle(f), win = f.contentWindow, vw = win.innerWidth, col = d.querySelector('.viewer').getBoundingClientRect().width;
    var cuts = [].slice.call(d.querySelectorAll('.cut'));
    if (cuts.length !== 104) add(res, 'fail', 'view.count', w, 0, '그려진 컷 ' + cuts.length);
    if (d.documentElement.scrollWidth > vw + 1) add(res, 'fail', 'view.hscroll', w, 0, '가로 스크롤 ' + d.documentElement.scrollWidth + '>' + vw);
    [].forEach.call(d.images, function (im) { if (im.complete && !im.naturalWidth) add(res, 'fail', 'view.broken', w, 0, '깨진 이미지 ' + im.getAttribute('src')); });
    var spec = {}; /* 폭 기준값 */
    cuts.forEach(function (cut) {
      var no = +cut.dataset.no;
      var bubbles = [].slice.call(cut.querySelectorAll('.line'));
      bubbles.forEach(function (ln) {
        var b = ln.querySelector('.bubble'), r = rect(b), cs = win.getComputedStyle(b), fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs * 1.55;
        if (no === 33) { var pn = ln.closest('.panel'); if (pn) { var pr = rect(pn); if (r.left < pr.left - 1 || r.right > pr.right + 1 || r.top < pr.top - 1 || r.bottom > pr.bottom + 1) add(res, 'fail', 'bubble.inpanel', w, no, '33컷 말풍선이 조각 밖: ' + b.textContent.slice(0, 12)); } }
        if (no === 74 && (ln.querySelector('.who') || /none|rgba\(0, 0, 0, 0\)/.test(cs.backgroundColor) === false)) add(res, 'fail', 'silence.form', w, no, '74컷에 화자/말풍선 배경이 있음');
        if (r.left < -1 || r.right > vw + 1) add(res, 'fail', 'bubble.offscreen', w, no, '말풍선이 화면 밖 ' + Math.round(r.left) + '~' + Math.round(r.right));
        if (b.scrollHeight > b.clientHeight + 2 || b.scrollWidth > b.clientWidth + 2) add(res, 'fail', 'bubble.clipped', w, no, '글자 잘림');
        var style = /line-thought/.test(ln.className) ? 'thought' : /line-caption/.test(ln.className) ? 'caption' : 'speech';
        var min = style === 'thought' ? 15 : style === 'caption' ? 13 : 16;
        if (fs < min) add(res, 'fail', 'bubble.font', w, no, style + ' 글자 ' + fs + 'px < ' + min);
        var lines = Math.round((r.height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / lh);
        var maxLines = no === 33 ? 2 : 3;
        if (lines > maxLines) add(res, KNOWN['lines' + no] ? 'info' : 'fail', 'bubble.lines', w, no, '말풍선 ' + lines + '줄 > ' + maxLines + '줄 (' + b.textContent.slice(0, 14) + '…)');
      });
      /* 같은 컷 안 말풍선끼리 겹침 */
      var rs = bubbles.map(function (l) { return rect(l.querySelector('.bubble')); });
      for (var i = 0; i < rs.length; i++) for (var j = i + 1; j < rs.length; j++) if (hit(rs[i], rs[j])) add(res, 'fail', 'bubble.overlap', w, no, '말풍선 겹침 ' + i + '·' + j);
      /* 컷 폭·정렬 */
      var wrap = cut.querySelector('.cut-wrap');
      if (wrap) {
        var want = (+(wrap.style.getPropertyValue('--cw') || '100%').replace('%', '')) / 100, got = rect(wrap).width / col;
        if (Math.abs(want - got) > 0.015) add(res, 'fail', 'layout.width', w, no, '컷 폭 ' + got.toFixed(3) + ' ≠ ' + want);
        var v = cut.querySelector('.viewer,.cut'), cr = rect(cut), wr = rect(wrap);
        if (wrap.classList.contains('w-left') && Math.abs(wr.left - cr.left) > 2) add(res, 'fail', 'layout.align', w, no, '왼쪽 정렬 어긋남');
        if (wrap.classList.contains('w-right') && Math.abs(wr.right - cr.right) > 2) add(res, 'fail', 'layout.align', w, no, '오른쪽 정렬 어긋남');
        /* 분할 줄: 칸 높이가 같다 */
        [].forEach.call(wrap.querySelectorAll('.panel-row'), function (row) {
          var hs = [].map.call(row.querySelectorAll('.panel'), function (p) { return rect(p).height; });
          if (Math.max.apply(0, hs) - Math.min.apply(0, hs) > 2) add(res, 'fail', 'layout.rowheight', w, no, '분할 칸 높이 차이 ' + hs.map(Math.round));
          var ws = [].reduce.call(row.querySelectorAll('.panel'), function (a, p) { return a + rect(p).width; }, 0);
          if (ws < rect(row).width - 2) add(res, 'fail', 'layout.rowfill', w, no, '분할 칸이 줄을 다 채우지 못함');
        });
      }
      var data = win.WEBTOON.episodeData.ep01v3.cuts[no - 1];
      /* 인셋(앞 컷에 걸침) */
      if (data.inset && data.inset.to === 'prev') {
        var prev = d.getElementById('cut-' + String(no - 1).padStart(2, '0'));
        if (!(rect(cut.querySelector('.panel-mask')).top < rect(prev).bottom - 8)) add(res, 'fail', 'inset.prev', w, no, '앞 컷과 겹치지 않음');
      }
      if (data.inset && data.inset.to === 'self') {
        var ins = cut.querySelector('.inset'), pm = cut.querySelector('.panel-mask');
        if (!ins) add(res, 'fail', 'inset.self', w, no, '인셋이 그려지지 않음');
        else { var ir = rect(ins), pr = rect(pm); if (ir.left < pr.left - 1 || ir.right > pr.right + 1 || ir.top < pr.top - 1 || ir.bottom > pr.bottom + 1) add(res, 'fail', 'inset.bounds', w, no, '인셋이 컷 밖으로 나감'); }
        if (ins && data.inset.text) { var tfs = parseFloat(win.getComputedStyle(ins.querySelector('.inset-text')).fontSize); if (tfs < 13) add(res, 'fail', 'inset.font', w, no, '인셋 글자 ' + tfs + 'px < 13'); }
      }
      /* 이어짐 */
      if (data.link === 'prev') {
        var pv = d.getElementById('cut-' + String(no - 1).padStart(2, '0'));
        var gap = rect(cut).top - rect(pv).bottom;
        if (Math.abs(gap) > 1.5) add(res, 'fail', 'link.gap', w, no, '앞 컷과 간격 ' + gap.toFixed(1) + 'px');
      }
      /* 틀 밖 */
      if (data.overflow) {
        var chip = cut.querySelector('.ovf-chip'), mk = cut.querySelector('.panel-mask');
        if (!chip) add(res, 'fail', 'overflow.chip', w, no, '틀 밖 요소가 없음');
        else { var c2 = rect(chip), m2 = rect(mk); var out = data.overflow.edge === 'top' ? c2.top < m2.top - 2 : c2.bottom > m2.bottom + 2; if (!out) add(res, 'fail', 'overflow.out', w, no, '틀 밖으로 나가지 않음'); }
      }
      /* 경계 말풍선은 경계 위에 걸친다 */
      [].forEach.call(cut.querySelectorAll('.bgrp'), function (g) {
        var cls = g.className, p = g.closest('.panel'), pr = rect(p), gr = rect(g);
        if (/at-edge-top/.test(cls) && !(gr.top < pr.top - 2 && gr.bottom > pr.top + 2)) add(res, 'fail', 'edge.top', w, no, '위 경계에 걸치지 않음');
        if (/at-edge-bottom/.test(cls) && !(gr.top < pr.bottom - 2 && gr.bottom > pr.bottom + 2)) add(res, 'fail', 'edge.bottom', w, no, '아래 경계에 걸치지 않음');
        if (/at-in-/.test(cls) && (gr.left < pr.left - 1 || gr.right > pr.right + 1 || gr.top < pr.top - 1 || gr.bottom > pr.bottom + 1)) add(res, 'warn', 'bubble.inside', w, no, '컷 안쪽 말풍선이 칸을 넘음(칸 ' + Math.round(pr.width) + 'x' + Math.round(pr.height) + ')');
      });
      /* 칸 안쪽 말풍선이 마스크(사선·분할) 경계를 넘는지: 분할 경계 침범 */
      if (data.rows && data.rows.length && data.diagonal) {
        [].forEach.call(cut.querySelectorAll('.panel'), function (p) {
          [].forEach.call(p.querySelectorAll('.bgrp'), function (g) { if (/at-in-/.test(g.className)) { var gr = rect(g), pr = rect(p); if (gr.right > pr.right + 1 || gr.left < pr.left - 1) add(res, 'fail', 'bubble.diagonal', w, no, '사선 경계 침범'); } });
        });
      }
    });
    /* 휴대폰 */
    function phoneText(no) { var c = d.getElementById('cut-' + String(no).padStart(2, '0')); return c ? (c.querySelector('.lock-time') || {}).textContent : null; }
    if (phoneText(49) !== '09:17') add(res, 'fail', 'phone.49', w, 49, '시계 ' + phoneText(49));
    if (phoneText(63) !== '10:36') add(res, 'fail', 'phone.63', w, 63, '시계 ' + phoneText(63));
    [49, 63].forEach(function (n) {
      var c = d.getElementById('cut-' + n), s = c.querySelector('.phone-screen'), t = c.querySelector('.lock-time');
      if (!s.classList.contains('has-wall')) add(res, 'fail', 'phone.wall', w, n, '배경 없음');
      var sr = rect(s), tr = rect(t); if (tr.left < sr.left || tr.right > sr.right) add(res, 'fail', 'phone.clock', w, n, '시계가 화면 밖');
      var nr = c.querySelector('.notif'); if (nr) { var nrr = rect(nr); if (nrr.top < tr.bottom) add(res, 'fail', 'phone.overlap', w, n, '알림이 시계를 가림'); if (nrr.bottom > sr.bottom) add(res, 'fail', 'phone.notif', w, n, '알림이 화면 밖'); }
    });
    f.remove();
  }

  async function legacyCheck(res, w) {
    var f = document.createElement('iframe'); f.style.cssText = 'width:' + w + 'px;height:800px;border:0;position:absolute;left:0;top:0;visibility:hidden'; f.src = '../../index.html#ep01';
    await new Promise(function (ok) { f.onload = ok; document.body.appendChild(f); });
    var d = await settle(f), vw = f.contentWindow.innerWidth;
    var n = d.querySelectorAll('.cut').length;
    if (n !== 70) add(res, 'fail', 'legacy.count', w, 0, '기존 70컷이 ' + n + '컷으로 그려짐');
    if (d.documentElement.scrollWidth > vw + 1) add(res, 'fail', 'legacy.hscroll', w, 0, '가로 스크롤');
    [].forEach.call(d.images, function (im) { if (im.complete && !im.naturalWidth) add(res, 'fail', 'legacy.broken', w, 0, im.getAttribute('src')); });
    f.remove();
  }

  window.runV3QA = async function (log) {
    var res = { fail: [], warn: [], info: [], widths: WIDTHS, passed: {} };
    var spec = await (await fetch('ep01v3.spec.json')).json();
    await dataChecks(res, spec);
    for (var i = 0; i < WIDTHS.length; i++) { if (log) log('width ' + WIDTHS[i]); await widthChecks(res, WIDTHS[i]); await legacyCheck(res, WIDTHS[i]); }
    return res;
  };
  window.V3_KNOWN = window.V3_KNOWN || {};
})();
