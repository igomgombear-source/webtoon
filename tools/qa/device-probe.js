/* 모바일 측정 스크립트 — tools/qa/device.ps1 이 뷰어(index.html) 안에서 실행한다. 페이지를 바꾸지 않고 재기만 한다.
 * 결과는 JSON 문자열로 돌려준다.
 *   load    첫 화면: 문서 로딩 시각, 가장 큰 그림이 그려진 시각(LCP), 첫 화면에서 받은 그림 수·바이트
 *   scroll  사람이 읽는 속도로 끝까지 스크롤: 프레임 간격, 긴 작업(50ms+), 레이아웃 밀림(CLS),
 *           "화면에 들어왔는데 그림이 아직 없음" 시간(빈 그림 대기)
 *   memory  JS 힙, 그림 디코딩 메모리 추정(가로×세로×4 바이트 합), DOM 노드 수
 *   checks  말풍선이 그림 밖으로 나감, 글자가 상자에 잘림, 가로 넘침, 깨진 그림, 지연 로딩
 */
(function (opts) {
  'use strict';
  opts = opts || {};
  var SPEED = opts.speed || 1200;          /* 스크롤 속도 px/s (화면 CSS 픽셀) */
  var SETTLE = opts.settle || 2500;        /* 첫 화면에서 기다리는 시간 ms */
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function raf() { return new Promise(function (r) { requestAnimationFrame(r); }); }
  function cutOf(el) { var s = el.closest && el.closest('section[id^=cut-]'); return s ? +s.id.slice(4) : null; }
  function pct(arr, p) { if (!arr.length) return 0; var a = arr.slice().sort(function (x, y) { return x - y; }); return a[Math.min(a.length - 1, Math.floor(a.length * p))]; }
  function r1(v) { return Math.round(v * 10) / 10; }

  var out = { url: location.href, viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio }, ua: navigator.userAgent };
  var lcp = 0, cls = 0, shifts = [], longTasks = [];
  try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { lcp = e.renderTime || e.loadTime || e.startTime; }); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { if (!e.hadRecentInput) { cls += e.value; if (e.value > 0.001) shifts.push({ v: r1(e.value * 1000) / 1000, t: Math.round(e.startTime), cuts: (e.sources || []).map(function (s) { return s.node ? cutOf(s.node.nodeType === 1 ? s.node : s.node.parentElement) : null; }) }); } }); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { longTasks.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); }); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}

  function imgResources() {
    return performance.getEntriesByType('resource').filter(function (e) { return /\.(webp|png|jpe?g|svg|gif)(\?|$)/i.test(e.name); });
  }
  function bytes(list) { return list.reduce(function (a, e) { return a + (e.transferSize || e.encodedBodySize || 0); }, 0); }

  return (async function () {
    for (var i = 0; i < 100 && !document.querySelector('section[id^=cut-]'); i++) await sleep(100);
    var t0 = performance.now();
    await sleep(SETTLE);
    var nav = performance.getEntriesByType('navigation')[0] || {};
    var first = imgResources();
    var H = innerHeight;
    var imgs = Array.prototype.slice.call(document.images);
    var farAtTop = imgs.filter(function (im) { return im.getBoundingClientRect().top > H * 3 && first.some(function (e) { return e.name === im.src; }); }).length;
    var firstArt = document.querySelector('.art');
    out.load = {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0), loadEvent: Math.round(nav.loadEventEnd || 0),
      lcp: Math.round(lcp), firstArtLoaded: firstArt ? firstArt.classList.contains('is-loaded') : null,
      imagesRequested: first.length, imageBytes: bytes(first), farImagesRequested: farAtTop,
      firstArtTop: firstArt ? Math.round(firstArt.getBoundingClientRect().top + scrollY) : null
    };

    /* 스크롤: rAF 마다 SPEED 로 내려가며 측정 */
    var arts = Array.prototype.slice.call(document.querySelectorAll('.art'));
    var wait = {}, frames = [], slow = [], last = performance.now(), y = scrollY, end, blankFrames = 0;
    var t1 = performance.now();
    while (true) {
      await raf();
      var now = performance.now(), dt = now - last; last = now;
      frames.push(dt);
      if (dt > 50 && frames.length > 2) { var mid = document.elementFromPoint(innerWidth / 2, innerHeight / 2); slow.push({ ms: Math.round(dt), y: Math.round(scrollY), cut: mid ? cutOf(mid) : null }); }
      end = document.documentElement.scrollHeight - innerHeight;
      if (y >= end) break;
      y = Math.min(end, y + SPEED * Math.min(dt, 100) / 1000);
      scrollTo(0, y);
      var blank = false;
      for (var k = 0; k < arts.length; k++) {
        var a = arts[k], b = a.getBoundingClientRect();
        if (b.bottom < 0 || b.top > innerHeight) continue;
        var no = cutOf(a);
        if (!a.classList.contains('is-loaded')) { blank = true; if (!wait[no]) wait[no] = { start: now, end: 0 }; }
        else if (wait[no] && !wait[no].end) wait[no].end = now;
      }
      if (blank) blankFrames++;
    }
    var scrollMs = performance.now() - t1;
    await sleep(1500);
    var waits = Object.keys(wait).map(function (n) { var w = wait[n]; return { cut: +n, ms: Math.round((w.end || performance.now()) - w.start), loaded: !!w.end }; });
    var fr = frames.slice(1);
    out.scroll = {
      speed: SPEED, height: document.documentElement.scrollHeight, ms: Math.round(scrollMs), frames: fr.length,
      frameP50: r1(pct(fr, 0.5)), frameP95: r1(pct(fr, 0.95)), frameMax: r1(Math.max.apply(null, fr.concat([0]))),
      slowFrames: slow.slice(0, 12),
      over50: fr.filter(function (f) { return f > 50; }).length, over100: fr.filter(function (f) { return f > 100; }).length,
      longTasks: longTasks.filter(function (l) { return l.t >= t1; }).length,
      longTaskMs: longTasks.filter(function (l) { return l.t >= t1; }).reduce(function (a, l) { return a + l.d; }, 0),
      cls: r1(cls * 1000) / 1000, shifts: shifts.slice(0, 10),
      blankFrames: blankFrames, blankCuts: waits.length,
      blankWaitP50: pct(waits.map(function (w) { return w.ms; }), 0.5), blankWaitMax: Math.max.apply(null, waits.map(function (w) { return w.ms; }).concat([0])),
      worstWaits: waits.sort(function (a, b) { return b.ms - a.ms; }).slice(0, 5)
    };

    /* 메모리 */
    imgs = Array.prototype.slice.call(document.images);
    /* 디코딩 메모리 추정: 같은 파일은 한 번만 (원본 가로×세로×4 바이트).
     * peakWindow: 화면 위 1장·아래 2장 범위에 걸친 그림만 동시에 디코딩돼 있다고 볼 때의 최댓값 (Safari 처럼 화면 밖 그림을 버리는 브라우저 기준) */
    var uniq = {}, decoded = 0, boxes = [];
    imgs.forEach(function (im) {
      if (!im.complete || !im.naturalWidth) return;
      var sz = im.naturalWidth * im.naturalHeight * 4, b = im.getBoundingClientRect();
      if (!uniq[im.src]) { uniq[im.src] = 1; decoded += sz; }
      boxes.push({ top: b.top + scrollY, bottom: b.bottom + scrollY, src: im.src, sz: sz });
    });
    var Hh = innerHeight, docH = document.documentElement.scrollHeight, peak = 0, peakY = 0;
    for (var yy = 0; yy < docH; yy += Hh / 2) {
      var seen = {}, sum = 0;
      boxes.forEach(function (b) { if (b.bottom > yy - Hh && b.top < yy + Hh * 3 && !seen[b.src]) { seen[b.src] = 1; sum += b.sz; } });
      if (sum > peak) { peak = sum; peakY = yy; }
    }
    scrollTo(0, peakY); var pm = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    var shown = imgs.reduce(function (s, im) { var b = im.getBoundingClientRect(); return s + b.width * b.height * devicePixelRatio * devicePixelRatio * 4; }, 0);
    var all = imgResources();
    out.memory = {
      jsHeapUsed: performance.memory ? performance.memory.usedJSHeapSize : null,
      decodedImagesMB: r1(decoded / 1048576), uniqueImages: Object.keys(uniq).length, displayedPixelsMB: r1(shown / 1048576),
      peakWindowMB: r1(peak / 1048576), peakWindowCut: pm ? cutOf(pm) : null,
      largestImage: imgs.reduce(function (m, im) { var p = im.naturalWidth * im.naturalHeight; return p > m.px ? { px: p, src: im.getAttribute('src'), w: im.naturalWidth, h: im.naturalHeight } : m; }, { px: 0 }),
      domNodes: document.getElementsByTagName('*').length, images: imgs.length,
      totalImageRequests: all.length, totalImageBytes: bytes(all)
    };

    /* 검사 */
    var vw = document.documentElement.clientWidth, c = { clipped: [], bubbleOutside: [], overflow: [], broken: [], notLazy: 0 };
    Array.prototype.forEach.call(document.querySelectorAll('#app *'), function (el) {
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var b = el.getBoundingClientRect();
      if (!b.width) return;
      if (!el.closest('.art') && cs.position !== 'fixed' && (b.right > vw + 0.5 || b.left < -0.5))
        c.overflow.push({ cut: cutOf(el), el: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], left: Math.round(b.left), right: Math.round(b.right) });
      /* 글자가 상자에 잘림: overflow 가 숨김인데 내용이 더 큼 (그림 영역 .art 는 일부러 자르므로 제외) */
      if (el.classList.contains('art') || el.closest('.art .cmp-visual')) return;
      if (el.clientWidth <= 1 && el.clientHeight <= 1) return;   /* 화면 낭독기 전용 글자(1×1) */
      var hid = /hidden|clip/.test(cs.overflowX + cs.overflowY) || cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
      if (hid && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && (el.textContent || '').trim())
        c.clipped.push({ cut: cutOf(el), el: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], text: el.textContent.trim().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.line.is-overlay'), function (l) {
      var art = l.closest('.art') || l.parentElement, a = art.getBoundingClientRect(), b = l.getBoundingClientRect();
      if (b.left < a.left - 0.5 || b.right > a.right + 0.5 || b.top < a.top - 0.5 || b.bottom > a.bottom + 0.5)
        c.bubbleOutside.push({ cut: cutOf(l), text: l.textContent.trim().slice(0, 30), over: [Math.round(a.left - b.left), Math.round(b.right - a.right), Math.round(a.top - b.top), Math.round(b.bottom - a.bottom)] });
    });
    /* 작은 글자: 화면에 보이는 글자 중 12px 미만 (휴대폰에서 읽기 어려움). 화면 낭독기 전용·숨김은 제외 */
    var small = {};
    Array.prototype.forEach.call(document.querySelectorAll('#app *'), function (el) {
      var own = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.nodeValue.trim(); });
      if (!own || el.clientWidth <= 1) return;
      var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
      if (cs.display === 'none' || cs.visibility === 'hidden' || fs >= 12) return;
      var k = cutOf(el) + '|' + fs;
      (small[k] = small[k] || { cut: cutOf(el), px: fs, texts: [] }).texts.length < 3 && small[k].texts.push(el.textContent.trim().slice(0, 20));
    });
    c.smallText = Object.keys(small).map(function (k) { return small[k]; });
    c.overlayLines = document.querySelectorAll('.line.is-overlay').length;
    c.lines = document.querySelectorAll('.line').length;
    imgs.forEach(function (im) { if (im.complete && !im.naturalWidth) c.broken.push(im.getAttribute('src')); if (im.loading !== 'lazy') c.notLazy++; });
    c.docScrollWidth = document.documentElement.scrollWidth; c.clientWidth = vw;
    out.checks = c;
    return JSON.stringify(out);
  })();
})
