/* 하단 컷 썸네일 탐색 바 (통합 담당 전용 파일)
 * 썸네일 = 별도 '썸네일 렌더러'(실제 독자 화면, 폭 390, 화면 밖) 에서 편집값까지 반영해 그린 컷 섹션을 복제해
 * Shadow DOM 안에 독자 CSS 로 축소 표시한다(원화·말풍선·휴대폰 UI·인셋이 실제와 같다).
 * 성능: 타일 자리(빈 버튼)는 전체 컷 수만큼 두고, 보이는 범위(±600px)에 들어온 타일만 복제한다(가상화).
 *       멀리(±3000px) 벗어나면 복제본을 비운다. 컷별 버전으로 캐시하고 편집된 컷만 다시 만든다. 그림은 lazy 로딩.
 * 순서 바꾸기: 후속 '컷 구성' 모듈이 S.timeline.setReorder(fn) 을 등록하면 타일을 끌어 옮길 수 있다(fn(컷번호, 앞에 둘 컷번호|null)). */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  var TW = 390, sheet = null, fontCss = '', frame = null, tiles = {}, ver = {}, size = 84, reorder = null;
  var near = null, far = null;

  function absUrls(css, base) { return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, function (m, q, u) { if (/^(data:|https?:|blob:|#)/.test(u)) return m; try { return 'url("' + new URL(u, base).href + '")'; } catch (e) { return m; } }); }
  /* 썸네일 렌더러 문서의 스타일시트(독자 CSS)를 Shadow DOM 용으로 옮긴다 */
  function buildSheet(doc) {
    var out = [], fonts = [];
    [].forEach.call(doc.styleSheets, function (sh) {
      if (sh.ownerNode && sh.ownerNode.id === 'st-style') return;
      var base = sh.href || doc.baseURI, rules; try { rules = sh.cssRules; } catch (e) { return; }
      [].forEach.call(rules, function (r) { var t = absUrls(r.cssText, base); if (r.type === 5) fonts.push(t); else out.push(t.replace(/:root\b/g, ':host')); });
    });
    out.push(':host { display:block; --col:' + TW + 'px; --u:calc(' + TW + 'px / 360); }');
    out.push('.tb-root { position:absolute; left:0; top:0; width:' + TW + 'px; transform-origin:0 0; font-family:var(--font); color:var(--text); background:var(--bg); line-height:1.5; word-break:keep-all; overflow-wrap:anywhere; pointer-events:none; }');
    out.push('.reveal, .reveal > * { opacity:1 !important; transition:none !important; } .chk-label, .chk-sub { display:none !important; } .art .art-img { opacity:1 !important; transition:none !important; }');   /* 원화 로딩 표시(is-loaded)는 복제본에 없으므로 그림을 바로 보이게 */
    sheet = new CSSStyleSheet(); sheet.replaceSync(out.join('\n'));
    fontCss = fonts.join('\n'); U.addStyle('reader-fonts', fontCss);
  }
  function cloneSection(no) {
    var sec = frame.section(no); if (!sec) return null;
    var base = frame.doc().baseURI, c = sec.cloneNode(true);
    c.removeAttribute('id');
    [].forEach.call(c.querySelectorAll('img'), function (im) { var s = im.getAttribute('src'); if (s && !/^(data:|https?:|blob:)/.test(s)) im.setAttribute('src', new URL(s, base).href); im.setAttribute('loading', 'lazy'); im.removeAttribute('srcset'); });
    [].forEach.call(c.querySelectorAll('source[srcset]'), function (so) { so.setAttribute('srcset', so.getAttribute('srcset').split(',').map(function (p) { p = p.trim().split(/\s+/); p[0] = new URL(p[0], base).href; return p.join(' '); }).join(', ')); });
    [].forEach.call(c.querySelectorAll('[style*="url("]'), function (e) { e.setAttribute('style', absUrls(e.getAttribute('style'), base)); });
    [].forEach.call(c.querySelectorAll('[id]'), function (e) { e.removeAttribute('id'); });
    var wrap = frame.doc().createElement(sec.parentElement.tagName); wrap.className = sec.parentElement.className; wrap.appendChild(c);
    return { html: wrap.outerHTML, h: sec.offsetHeight || 1 };
  }
  function build(tile) {
    var no = +tile.dataset.no, k = ver[no] || 0; if (tile._built === k) return;
    var host = tile.querySelector('.tl-img'), root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    if (!root.adoptedStyleSheets.length) root.adoptedStyleSheets = [sheet];
    var cl = cloneSection(no); if (!cl) { root.innerHTML = ''; tile._built = k; return; }
    var tw = host.clientWidth || size, th = host.clientHeight || Math.round(size * 1.45), s = Math.min(tw / TW, th / cl.h);
    root.innerHTML = '<div class="tb-root" style="transform:translate(' + Math.max(0, (tw - TW * s) / 2) + 'px,' + Math.max(0, (th - cl.h * s) / 2) + 'px) scale(' + s + ')">' + cl.html + '</div>';
    tile._built = k; S.timeline.builtCount = (S.timeline.builtCount || 0) + 1;
  }
  function clear(tile) { var host = tile.querySelector('.tl-img'); if (host.shadowRoot) host.shadowRoot.innerHTML = ''; tile._built = null; }

  function marks() {
    var ed = S.store.editedCuts(S.state.ep), cf = {};
    S.store.conflicts(S.state.ep).forEach(function (c) { cf[I.cutOf(c.id)] = 1; });
    Object.keys(tiles).forEach(function (no) { var t = tiles[no], id = I.cut(+no);
      t.classList.toggle('is-edited', !!ed[id]); t.classList.toggle('is-conflict', !!cf[id]); t.classList.toggle('is-hidden', !!frame.hidden[no]);
      t.title = '#' + no + (frame.hidden[no] ? ' · 독자 화면 숨김' : '') + (ed[id] ? ' · 편집: ' + ed[id].join(', ') : '') + (cf[id] ? ' · 충돌 확인 필요' : '');
    });
  }
  function render() {
    var bar = U.$('tlBar'); if (!bar || !frame || !frame.compiled) return;
    if (near) near.disconnect(); if (far) far.disconnect(); tiles = {};
    bar.innerHTML = frame.order.map(function (no) { return '<button class="tl-tile" data-no="' + no + '" role="option" aria-label="컷 ' + no + '"><div class="tl-img"></div><span class="tl-no">#' + no + '</span><i class="tl-badge" aria-hidden="true"></i></button>'; }).join('');
    [].forEach.call(bar.children, function (t) { tiles[t.dataset.no] = t; });
    near = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) build(e.target); }); }, { root: bar, rootMargin: '0px 600px' });
    far = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) clear(e.target); }); }, { root: bar, rootMargin: '0px 3000px' });
    Object.keys(tiles).forEach(function (no) { near.observe(tiles[no]); far.observe(tiles[no]); });
    setSize(size, true); marks(); selected(S.state.cut, 'instant'); draggable();
  }
  function visible(t) { var bar = U.$('tlBar'), r = t.getBoundingClientRect(), b = bar.getBoundingClientRect(); return r.left >= b.left && r.right <= b.right; }
  function selected(no, scroll) {
    Object.keys(tiles).forEach(function (n) { tiles[n].classList.toggle('is-sel', +n === no); tiles[n].setAttribute('aria-selected', String(+n === no)); });
    var t = tiles[no]; if (t && scroll !== false && !visible(t)) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: scroll === 'instant' ? 'instant' : 'smooth' });
  }
  function rebuild(nos) {
    (nos || Object.keys(tiles)).forEach(function (no) { ver[no] = (ver[no] || 0) + 1; var t = tiles[no]; if (t && t._built != null) build(t); });
  }
  function setSize(px, quiet) {
    size = px; var bar = U.$('tlBar'); if (!bar) return; bar.style.setProperty('--tw', px + 'px'); bar.style.setProperty('--th', Math.round(px * 1.45) + 'px');
    if (!quiet) Object.keys(tiles).forEach(function (no) { var t = tiles[no]; if (t._built != null) { t._built = null; build(t); } });
  }
  function draggable() {
    Object.keys(tiles).forEach(function (no) { tiles[no].draggable = !!reorder; });
  }
  var syncLater = U.debounce(function () { if (frame && frame.compiled) frame.sync(); }, 250);

  S.timeline = {
    builtCount: 0,
    init: function () {
      frame = S.renderer.create('thumbs', { host: U.$('thumbHost'), single: false, edits: true, width: TW, height: 900, title: '썸네일 렌더러' });
      var bar = U.$('tlBar');
      bar.addEventListener('click', function (e) { var t = e.target.closest('.tl-tile'); if (t) S.select(+t.dataset.no, 'timeline'); });
      bar.addEventListener('keydown', function (e) { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); e.stopPropagation(); S.step(e.key === 'ArrowLeft' ? -1 : 1, 'timeline'); var t = tiles[S.state.cut]; if (t) t.focus(); });
      bar.addEventListener('dragstart', function (e) { var t = e.target.closest('.tl-tile'); if (!t || !reorder) return; e.dataTransfer.setData('text/plain', t.dataset.no); });
      bar.addEventListener('dragover', function (e) { if (reorder) e.preventDefault(); });
      bar.addEventListener('drop', function (e) { if (!reorder) return; e.preventDefault(); var from = +e.dataTransfer.getData('text/plain'), t = e.target.closest('.tl-tile'); reorder(from, t ? +t.dataset.no : null); });
      U.$('tlSize').addEventListener('input', function () { setSize(+this.value); });
      U.$('tlFind').addEventListener('keydown', function (e) { if (e.key !== 'Enter') return; var no = parseInt(this.value, 10); if (tiles[no]) { S.select(no, 'search'); this.select(); } else U.toast('#' + this.value + ' 컷이 없습니다'); });
      S.on('cut', function (ev) { selected(ev.no, ev.source === 'timeline' ? false : true); });
      S.on('change', function () { marks(); syncLater(); });
      S.on('rendered', function (ev) { if (ev.frame !== frame) return; if (ev.full) { if (!sheet) buildSheet(frame.doc()); if (!Object.keys(tiles).length || ev.reorder !== false) render(); rebuild(); } else rebuild(ev.cuts.map(String)); });
    },
    load: function (ep) { tiles = {}; ver = {}; sheet = null; S.timeline.builtCount = 0; return frame.load(ep); },
    frame: function () { return frame; },
    tiles: function () { return tiles; },
    setSize: setSize,
    /* 후속 컷 구성 모듈용: fn(옮길 컷번호, 앞에 둘 컷번호|null) 또는 null(끄기) */
    setReorder: function (fn) { reorder = fn || null; draggable(); },
    refreshMarks: marks
  };
})();
