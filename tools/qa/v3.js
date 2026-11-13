/* 104컷 제작판(#ep01v3) 자동 검수 — 브라우저 안에서 돌린다 (tools/qa/v3.html).
 * 읽기만 한다. 결과는 { fail:[], warn:[], info:[] } — 항목은 { id, w, no, msg } */
(function () {
  'use strict';
  var WIDTHS = [320, 360, 390, 430, 768];
  var AT_OK = { 'in-tl': 1, 'in-tr': 1, 'in-bl': 1, 'in-br': 1, 'in-br2': 1, 'edge-top-l': 1, 'edge-top-r': 1, 'edge-bottom-l': 1, 'edge-bottom-r': 1, gap: 1, above: 1 };
  /* 알려진 한계: 정본 문구를 바꾸지 않고는 지킬 수 없는 항목. 숨기지 않고 info 로 따로 보고한다 */
  var KNOWN = window.V3_KNOWN || {};

  function add(res, level, id, w, no, msg) { res[level].push({ id: id, w: w, no: no, msg: msg }); }

  function loadFrame(w, query) {
    return new Promise(function (ok) {
      var f = document.createElement('iframe');
      f.style.cssText = 'width:' + w + 'px;height:800px;border:0;position:absolute;left:0;top:0;visibility:hidden';
      f.src = '../../index.html' + (query || '') + '#ep01v3';
      f.onload = function () { ok(f); };
      document.body.appendChild(f);
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function settle(f) {
    var d = f.contentDocument, win = f.contentWindow;
    for (var i = 0; i < 60 && !d.querySelector('.cut'); i++) await wait(100);
    /* 말풍선 엔진이 글꼴을 불러온 뒤 배치를 끝낼 때까지 기다린다 (bubbles=off 는 제외) */
    if (!/bubbles=off/.test(f.src)) for (var j = 0; j < 100 && !d.body.classList.contains('bv4-done'); j++) await wait(100);
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
    if (ep.showSpeakerNames !== false) add(res, 'fail', 'data.names', 0, 0, 'showSpeakerNames 는 false 여야 함(제작기준 9-6)');
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
        /* 독자 화면에는 '틀 밖' 표시(칩)가 없고, 틀 밖으로 나갈 예약 여백만 있다. 칩은 검수 모드에서 확인(reviewCheck) */
        var wrapEl = cut.querySelector('.cut-wrap'), mk = cut.querySelector('.panel-mask');
        if (!wrapEl || !wrapEl.classList.contains('has-ovf-' + data.overflow.edge) || !mk.classList.contains('is-overflow')) add(res, 'fail', 'overflow.reserve', w, no, '틀 밖 예약 여백이 없음');
      }
    });
    engineChecks(res, w, d, win, cuts);
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


  /* ---------- 말풍선 엔진(v4) 검수 — 독자 화면 그대로(?review 없음) ---------- */
  var MINFONT = { speech: 16, offscreen: 16, phone: 16, mono: 15, caption: 13 };
  function engineChecks(res, w, d, win, cuts) {
    var R = win.__bv4, vw = win.innerWidth, ep = win.WEBTOON.episodeData.ep01v3;
    if (!R || !d.body.classList.contains('bv4-done')) { add(res, 'fail', 'engine.notrun', w, 0, '말풍선 엔진이 끝나지 않음'); return; }
    /* 글꼴: 실제로 불러왔는지 */
    var faces = {}; d.fonts.forEach(function (ff) { faces[ff.family.replace(/"/g, '') + ' ' + ff.weight] = ff.status; });
    ['Pretendard 500', 'Pretendard 600', 'Noto Serif KR 500'].forEach(function (k) { if (faces[k] !== 'loaded') add(res, 'fail', 'font.loaded', w, 0, k + ' 상태: ' + faces[k]); });
    var withLines = ep.cuts.filter(function (c) { return c.lines && c.lines.length; }).map(function (c) { return c.no; });
    var got = R.cuts.map(function (c) { return c.no; });
    withLines.forEach(function (n) { if (got.indexOf(n) < 0) add(res, 'fail', 'engine.missing', w, n, '대사가 있는데 배치되지 않음'); });
    var nProv = 0;
    R.cuts.forEach(function (c) {
      var no = c.no, maxLines = no === 33 ? 2 : 3;
      if (c.textIntact === false) add(res, 'fail', 'bubble.text', w, no, '나눈 말풍선을 이으면 원래 대사와 다름');
      if (c.status !== 'monologue-approved') nProv++;
      c.bubbles.forEach(function (b) {
        var tag = '[' + b.i + '] ' + (b.text || '').slice(0, 12);
        if (b.fail) return add(res, 'fail', 'bubble.nospot', w, no, tag + ' 자리 없음');
        if (b.textOutside) add(res, 'fail', 'bubble.text-outside', w, no, tag + ' 글자가 말풍선 밖 ' + b.textOutside + '점');
        if (b.zoneHits && b.zoneHits.length) add(res, 'fail', 'bubble.zone', w, no, tag + ' 보호영역 침범: ' + b.zoneHits.join(','));
        if (b.offscreen || b.tailOff) add(res, 'fail', 'bubble.offscreen', w, no, tag + ' 화면 밖');
        if (b.font < MINFONT[b.type]) add(res, 'fail', 'bubble.font', w, no, tag + ' ' + b.type + ' 글자 ' + b.font + 'px < ' + MINFONT[b.type]);
        if (b.lines > maxLines) add(res, 'fail', 'bubble.lines', w, no, tag + ' ' + b.lines + '줄 > ' + maxLines);
      });
      if (c.screen) {
        if (c.screen.overflow || c.screen.topCut) add(res, 'fail', 'screen.overflow', w, no, '문자 화면에서 글자가 잘림');
        c.screen.msgs.forEach(function (m) { if (m.clipped) add(res, 'fail', 'screen.clipped', w, no, '문자 말풍선 글자 잘림'); if (m.font < 13) add(res, 'fail', 'screen.font', w, no, '문자 글자 ' + m.font + 'px < 13'); });
        var last = c.screen.msgs[c.screen.msgs.length - 1];
        if (no === 83 && last && last.firstLine.indexOf('승민쌤, 저 해인이에요.') !== 0) add(res, 'fail', 'screen.firstline', w, no, '83컷 첫 문장이 첫 줄에 온전히 있지 않음: ' + last.firstLine);
      }
    });
    if (w === 360) add(res, 'info', 'bubble.provisional', 0, 0, '말풍선 배치 미승인(임시) 컷 ' + nProv + '개 — 50컷만 독백 배치 승인, 나머지는 원화·사용자 검수 전');
    /* 페이지 전체: 말풍선끼리 겹침, 다른 컷 그림 침범, 읽는 순서 */
    var sy = win.scrollY, B = [].map.call(d.querySelectorAll('.bv4-b'), function (e) { var r = rect(e); return { no: +e.closest('.cut').dataset.no, i: +e.dataset.i, x: r.left, y: r.top + sy, w: r.width, h: r.height }; });
    var P = [].map.call(d.querySelectorAll('.panel-mask'), function (e) { var r = rect(e); return { no: +e.closest('.cut').dataset.no, x: r.left, y: r.top + sy, w: r.width, h: r.height }; });
    function H(a, b, p) { return a.x < b.x + b.w - p && a.x + a.w > b.x + p && a.y < b.y + b.h - p && a.y + a.h > b.y + p; }
    for (var a = 0; a < B.length; a++) for (var b = a + 1; b < B.length; b++) if (H(B[a], B[b], 1)) add(res, 'fail', 'bubble.overlap', w, B[a].no, '말풍선 겹침 #' + B[a].no + '.' + B[a].i + ' ↔ #' + B[b].no + '.' + B[b].i);
    B.forEach(function (bb) { P.forEach(function (p) { if (p.no !== bb.no && H(bb, p, 2)) add(res, 'fail', 'bubble.cross', w, bb.no, '말풍선이 #' + p.no + ' 컷 그림을 덮음'); }); });
    var by = {}; B.forEach(function (bb) { (by[bb.no] = by[bb.no] || []).push(bb); });
    Object.keys(by).forEach(function (k) { var arr = by[k].sort(function (p, q) { return p.i - q.i; }); for (var m = 1; m < arr.length; m++) if (arr[m].y + arr[m].h < arr[m - 1].y + 4) add(res, 'fail', 'bubble.order', w, +k, '읽는 순서 어긋남 ' + arr[m - 1].i + '→' + arr[m].i); });
    /* 독자 화면에는 제작용 표시가 없어야 한다 */
    var leak = ['.draft-badge', '.ph-no', '.ph-desc', '.ph-note', '.ovf-chip', '.pp-note', '.bv4-zone', '.bv4-screen-note', '.who', '.bubble-note'];
    leak.forEach(function (q) { var n = d.querySelectorAll(q).length; if (n) add(res, 'fail', 'reader.leak', w, 0, '독자 화면에 제작용 요소 ' + q + ' ' + n + '개'); });
    var vis = d.body.innerText || '';
    ['DRAFT', '그림 준비 중', '원화 합성 전', '임시 컷', '(가정)'].forEach(function (t) { if (vis.indexOf(t) >= 0) add(res, 'fail', 'reader.text', w, 0, '독자 화면 글자에 "' + t + '"'); });
    if (ep.showSpeakerNames !== false) add(res, 'fail', 'reader.names', w, 0, '화자 이름표가 켜져 있음(제작기준 9-6: false)');
    /* 연결된 원화: 필터·오버레이·투명도로 어둡게 보이지 않아야 하고, 로드 전에는 축소 미리보기가 바탕에 있어야 한다 */
    ep.cuts.filter(function (c) { return c.image; }).forEach(function (c) {
      var art = d.querySelector('#cut-' + (c.no < 10 ? '0' : '') + c.no + ' .art-img');
      if (!art) return add(res, 'fail', 'art.missing', w, c.no, '원화 이미지 요소 없음');
      var x = art, bad = [];
      while (x && x !== d.body) { var cs = win.getComputedStyle(x); if (cs.filter !== 'none') bad.push('filter ' + x.className); if (cs.mixBlendMode !== 'normal') bad.push('blend ' + x.className); x = x.parentElement; }
      if (art.complete && win.getComputedStyle(art).opacity !== '1') bad.push('img opacity ' + win.getComputedStyle(art).opacity);
      if (bad.length) add(res, 'fail', 'art.dim', w, c.no, '원화가 어둡게 보일 수 있음: ' + bad.join(', '));
      var box = art.closest('.art'); if (!box.classList.contains('has-lqip') || !/data:image\/webp/.test(box.style.backgroundImage)) add(res, 'fail', 'art.lqip', w, c.no, '로드 전 바탕(축소 미리보기)이 없음 — 검은 바탕에서 서서히 나타남');
    });
    /* 74컷: 침묵 — 화자·이름 없음 */
    var s74 = d.getElementById('cut-74');
    if (s74 && (s74.querySelector('.bv4-sr') || s74.querySelectorAll('.bv4-b').length !== 1)) add(res, 'fail', 'silence.form', w, 74, '74컷은 화자 없는 침묵 한 줄이어야 함');
    /* 단독 휴대폰 화면은 49컷만 */
    var phones = [].filter.call(d.querySelectorAll('.cut-phone'), function (c) { return true; }).map(function (c) { return +c.dataset.no; });
    if (JSON.stringify(phones) !== '[49]') add(res, 'fail', 'phone.standalone', w, 0, '단독 휴대폰 컷 ' + JSON.stringify(phones) + ' (제작기준: 49컷만)');
    if (w === 360) {
      var prev = [].map.call(d.querySelectorAll('.phone-preview'), function (e) { return +e.closest('.cut').dataset.no; });
      add(res, 'info', 'phone.preview', 0, 0, '원화 합성 전 휴대폰 UI 미리보기 컷 ' + JSON.stringify(prev) + ' + 83컷 문자 화면(말풍선 엔진) — 최종은 원화에 합성(83컷은 두 손에 쥔 휴대폰)');
      /* 33컷: 조각 안쪽 비율 */
      var c33 = d.getElementById('cut-33'), ins = 0, tot = 0;
      if (c33) { var pr33 = [].map.call(c33.querySelectorAll('.panel'), rect); [].forEach.call(c33.querySelectorAll('.bv4-b'), function (e) { var r = rect(e); tot++; if (pr33.some(function (q) { return r.left >= q.left - 1 && r.right <= q.right + 1 && r.top >= q.top - 1 && r.bottom <= q.bottom + 1; })) ins++; }); add(res, 'info', 'cut33.inpiece', 0, 33, '33컷 말풍선 ' + tot + '개 중 조각 안쪽 ' + ins + '개(나머지는 자리가 없어 조각 바로 아래 여백)'); }
    }
  }

  /* 검수 모드(?review=1)에서는 제작용 표시가 켜지는지 */
  async function reviewCheck(res, w) {
    var f = await loadFrame(w, '?review=1&zones=1'), d = await settle(f);
    var n = d.querySelectorAll('.draft-badge').length, z = d.querySelectorAll('.bv4-zone').length, ph = d.querySelectorAll('.ph-desc').length;
    var oc = d.querySelectorAll('.ovf-chip').length;
    if (!oc) add(res, 'fail', 'review.chip', w, 0, '검수 모드에서 틀 밖 표시가 보이지 않음');
    if (!n || !z || !ph) add(res, 'fail', 'review.off', w, 0, '검수 모드에서 제작용 표시가 보이지 않음 (DRAFT ' + n + ', 보호영역 ' + z + ', 안내 ' + ph + ')');
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
    for (var i = 0; i < WIDTHS.length; i++) { if (log) log('width ' + WIDTHS[i]); await widthChecks(res, WIDTHS[i]); if (WIDTHS[i] === 360) await reviewCheck(res, 360); await legacyCheck(res, WIDTHS[i]); }
    return res;
  };
  window.V3_KNOWN = window.V3_KNOWN || {};
})();
