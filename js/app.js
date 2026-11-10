/* 마지막 접속 — 모바일 웹툰 뷰어
 * 라우팅: index.html (작품 메인) / index.html#ep01 (회차 감상)
 * 회차 데이터는 data/epNN.js 를 필요할 때 불러온다.
 */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var W = window.WEBTOON;
  var cleanup = [];

  /* ---------- 유틸 ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function highlight(text, mark) {
    var t = esc(text);
    if (!mark) return t;
    var m = esc(mark);
    var i = t.indexOf(m);
    if (i < 0) return t;
    return t.slice(0, i) + '<mark>' + m + '</mark>' + t.slice(i + m.length);
  }
  function ratioStyle(r) {
    var p = String(r || '4:5').split(':');
    var w = parseFloat(p[0]) || 4, h = parseFloat(p[1]) || 5;
    return 'aspect-ratio:' + w + ' / ' + h + ';';
  }
  /* 그림 컷의 자리: imageSize {w,h} 가 있으면 그 비율, 없으면 ratio */
  function artBoxStyle(cut) {
    var z = cut.imageSize;
    if (cut.image && z && +z.w > 0 && +z.h > 0) return 'aspect-ratio:' + (+z.w) + ' / ' + (+z.h) + ';';
    return ratioStyle(cut.ratio);
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function runCleanup() { while (cleanup.length) { try { cleanup.pop()(); } catch (e) {} } }

  /* ---------- 회차 스크립트 불러오기 ---------- */
  function loadEpisode(meta, cb) {
    if (W.episodeData[meta.id]) return cb(null, W.episodeData[meta.id]);
    var s = document.createElement('script');
    s.src = meta.file;
    s.onload = function () {
      if (W.episodeData[meta.id]) cb(null, W.episodeData[meta.id]);
      else cb(new Error('회차 데이터가 등록되지 않았습니다: ' + meta.id));
    };
    s.onerror = function () { cb(new Error('회차 파일을 불러오지 못했습니다: ' + meta.file)); };
    document.head.appendChild(s);
  }

  /* ---------- 작품 메인 ---------- */
  function renderHome() {
    var s = W.series;
    document.title = s.title;
    var list = s.episodes.map(function (ep) {
      var label = ep.no + '화' + (ep.title ? ' 〈' + esc(ep.title) + '〉' : '');
      if (!ep.ready) {
        return '<li class="ep-item is-locked"><span class="ep-no">' + pad2(ep.no) +
          '</span><span class="ep-title">' + label + '</span><span class="ep-state">준비 중</span></li>';
      }
      return '<li class="ep-item"><a href="#' + ep.id + '"><span class="ep-no">' + pad2(ep.no) +
        '</span><span class="ep-title">' + label + '</span><span class="ep-state">보기</span></a></li>';
    }).join('');
    var first = s.episodes.filter(function (e) { return e.ready; })[0];
    app.innerHTML =
      '<main class="home">' +
        '<header class="home-cover">' +
          /* 해인의 잠긴 휴대폰 */
          '<div class="cover-phone" aria-hidden="true">' +
            '<div class="cover-screen">' +
              '<div class="cover-status"><span></span><span class="ph-icons"><i></i><i></i><i></i></span></div>' +
              '<p class="cover-date" id="cover-date"></p>' +
              '<p class="cover-clock" id="cover-clock"></p>' +
              '<div class="cover-notif">' +
                '<span class="cover-avatar"></span>' +
                '<div><p class="cover-name">권해인</p><p class="cover-last">마지막 접속 11월 1일</p></div>' +
              '</div>' +
              (first ?
              '<div class="slide" id="slide">' +
                '<span class="slide-label">밀어서 열기</span>' +
                '<span class="slide-knob" id="slide-knob"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
              '</div>' : '') +
            '</div>' +
          '</div>' +
          '<div class="cover-text">' +
            '<h1 class="home-title" id="page-heading" tabindex="-1">마지막 <span class="dim">접속</span></h1>' +
            '<p class="home-phrase">세 사람이 말하면 없던 호랑이도 생긴다</p>' +
            '<p class="home-genre">' + esc(s.genre) + ' · ' + esc(s.status) + '</p>' +
            (first ? '<a class="sr-only" href="#' + first.id + '">1화 〈' + esc(first.title) + '〉 보기</a>' : '') +
          '</div>' +
          '<p class="cover-scroll" aria-hidden="true">회차 목록</p>' +
        '</header>' +
        '<section class="home-list"><h2>회차</h2><ul>' + list + '</ul></section>' +
      '</main>';
    window.scrollTo(0, 0);
    bindCover(first);
  }

  /* 잠금 화면 시계(지금 시각)와 밀어서 열기 */
  function bindCover(first) {
    var dEl = document.getElementById('cover-date');
    var cEl = document.getElementById('cover-clock');
    var days = ['일', '월', '화', '수', '목', '금', '토'];
    function tick() {
      var n = new Date();
      dEl.textContent = (n.getMonth() + 1) + '월 ' + n.getDate() + '일 ' + days[n.getDay()] + '요일';
      cEl.textContent = n.getHours() + ':' + pad2(n.getMinutes());
    }
    tick();
    var timer = setInterval(tick, 10000);
    cleanup.push(function () { clearInterval(timer); });

    var slide = document.getElementById('slide');
    var knob = document.getElementById('slide-knob');
    if (!slide || !first) return;
    var startX = 0, dx = 0, max = 0, dragging = false;

    function setX(x) {
      knob.style.transform = 'translateX(' + x + 'px)';
      slide.style.setProperty('--p', max ? x / max : 0);
    }
    function down(e) {
      dragging = true;
      startX = e.clientX;
      max = slide.clientWidth - knob.offsetWidth - 8;
      slide.classList.add('is-drag');
      try { knob.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      dx = Math.max(0, Math.min(max, e.clientX - startX));
      setX(dx);
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      slide.classList.remove('is-drag');
      if (dx >= max * 0.85) {
        setX(max);
        slide.classList.add('is-open');
        setTimeout(function () { location.hash = '#' + first.id; }, 320);
      } else {
        dx = 0;
        setX(0);
        if (Math.abs(e_last) < 4) { slide.classList.remove('is-hint'); void slide.offsetWidth; slide.classList.add('is-hint'); }
      }
    }
    var e_last = 0;
    knob.addEventListener('pointerdown', function (e) { e_last = 0; down(e); });
    knob.addEventListener('pointermove', function (e) { if (dragging) e_last = e.clientX - startX; move(e); });
    knob.addEventListener('pointerup', up);
    knob.addEventListener('pointercancel', up);
  }

  /* ---------- 대사 ---------- */
  function renderLine(ep, line, overlay) {
    var style = line.style || 'speech';
    var sp = (ep.speakers && ep.speakers[line.who]) || {};
    var side = line.side || sp.side || 'left';
    var name = (ep.showSpeakerNames && line.who && style !== 'caption')
      ? '<span class="who">' + esc(line.who) + (style === 'phone' ? ' · 전화' : '') + '</span>' : '';
    var pos = '';
    if (overlay && line.pos) {
      pos = ' style="left:' + Number(line.pos.x) + '%;top:' + Number(line.pos.y) + '%;"';
    }
    return '<div class="line line-' + style + ' side-' + side + (overlay && line.pos ? ' is-overlay' : '') + '"' + pos + '>' +
      name + '<p class="bubble">' + esc(line.text) + '</p></div>';
  }

  function renderLines(ep, cut) {
    var lines = cut.lines || [];
    var over = lines.filter(function (l) { return l.pos; });
    var below = lines.filter(function (l) { return !l.pos; });
    return {
      overlay: over.map(function (l) { return renderLine(ep, l, true); }).join(''),
      below: below.length ? '<div class="lines">' + below.map(function (l) { return renderLine(ep, l, false); }).join('') + '</div>' : ''
    };
  }

  /* ---------- 그림 영역 ---------- */
  function placeholderLabel(cut) {
    if (cut.desc) return cut.desc;
    var who = (cut.lines || []).map(function (l) { return l.who; }).filter(Boolean);
    return who.length ? who[0] + ' 대사 컷' : '';
  }

  function renderArt(ep, cut, overlayHtml) {
    var time = cut.datetime && cut.datetime.time
      ? '<span class="time-chip">' + esc(cut.datetime.time) + '</span>' : '';
    var ph =
      '<div class="placeholder tone-' + esc(cut.tone || 'default') + '">' +
        '<span class="ph-no" aria-hidden="true">#' + pad2(cut.no) + '</span>' +
        '<span class="ph-desc">' + esc(placeholderLabel(cut)) + '</span>' +
        '<span class="ph-note" aria-hidden="true">그림 준비 중</span>' +
      '</div>';
    if (cut.image) {
      var src = /^(\.|\/|https?:)/.test(cut.image) ? cut.image : (ep.imageBase || '') + cut.image;
      var z = cut.imageSize || {};
      var sized = +z.w > 0 && +z.h > 0;
      return '<div class="art has-image' + (sized ? ' is-sized' : '') + '" style="' + artBoxStyle(cut) + '">' +
        ph +
        '<img class="art-img" src="' + esc(src) + '" alt="' + esc(cut.alt || cut.desc || '') + '"' +
          (sized ? ' width="' + (+z.w) + '" height="' + (+z.h) + '"' : '') +
          ' loading="lazy" decoding="async">' +
        time + overlayHtml + '</div>';
    }
    return '<div class="art" style="' + ratioStyle(cut.ratio) + '">' + ph + time + overlayHtml + '</div>';
  }

  /* ---------- 휴대폰 화면 ---------- */
  function statusBar(time) {
    return '<div class="ph-status"><span>' + esc(time || '') + '</span><span class="ph-icons" aria-hidden="true"><i></i><i></i><i></i></span></div>';
  }

  function notifCard(n) {
    return '<div class="notif">' +
      '<div class="notif-head" aria-hidden="true"><span class="app-icon app-' + (n.app === '메일' ? 'mail' : n.app === '전화' ? 'call' : 'msg') + '" aria-hidden="true"></span>' +
        '<span class="notif-app">' + esc(n.app) + '</span><span class="notif-time">' + esc(n.time) + '</span></div>' +
      '<p class="notif-from"><span class="sr-only">' + esc(n.app) + ' 알림, </span>' + esc(n.from) + '</p>' +
      (n.title ? '<p class="notif-title">' + esc(n.title) + '</p>' : '') +
      '<p class="notif-time-sr sr-only">' + esc(n.time) + '</p>' +
      '<p class="notif-body">' + (n.body ? esc(n.body) : '<span class="muted">새 메시지</span>') + '</p>' +
    '</div>';
  }

  function renderPhone(cut) {
    var p = cut.phone || {};
    var owner = p.owner === 'haein' ? 'haein' : 'seungmin';
    var t = (cut.datetime && cut.datetime.time) || p.clock || '';
    var inner = '';

    switch (p.view) {
      case 'notification':
        inner = statusBar(t) +
          (p.overPlayer ? '<div class="player" aria-hidden="true"><div class="player-art"></div><div class="player-bar"><span></span></div><div class="player-ctl" aria-hidden="true"><i></i><i class="play"></i><i></i></div></div>' : '') +
          '<div class="notif-stack">' + (p.items || []).map(notifCard).join('') + '</div>';
        break;

      case 'lock':
        inner = statusBar('') +
          '<div class="lock-clock"><p class="lock-date">' + esc(p.date) + '</p><p class="lock-time">' + esc(p.clock) + '</p></div>' +
          '<div class="notif-stack">' + (p.items || []).map(notifCard).join('') + '</div>';
        break;

      case 'email':
        inner = statusBar(t) +
          '<div class="mail">' +
            '<p class="mail-subject">' + esc(p.subject) + '</p>' +
            '<div class="mail-meta"><span class="mail-avatar" aria-hidden="true"></span><div>' +
              '<p class="mail-from">' + esc(p.from) + '</p>' +
              '<p class="mail-to">받는 사람: ' + esc(p.to) + '</p></div>' +
              '<span class="mail-time">' + esc(p.time) + '</span></div>' +
            '<p class="mail-body">' + highlight(p.body, p.highlight) + '</p>' +
            (p.attachment ? '<div class="mail-attach"><span class="folder" aria-hidden="true"></span>' + esc(p.attachment) + '</div>' : '') +
          '</div>';
        break;

      case 'sms':
        inner = statusBar(t) +
          '<div class="sms-head"><span class="sms-back" aria-hidden="true">‹</span><span class="sms-avatar" aria-hidden="true"></span><span class="sms-name"><span class="sr-only">문자 대화: </span>' + esc(p.contact) + '</span></div>' +
          '<div class="sms-thread">' + (p.messages || []).map(function (m) {
            var who = m.from === 'me' ? '보낸 문자' : esc(p.contact) + '의 문자';
            return '<div class="sms ' + (m.from === 'me' ? 'me' : 'them') + '"><p><span class="sr-only">' + who + ': </span>' + esc(m.text) + '</p>' +
              (m.time ? '<span class="sms-time">' + esc(m.time) + '</span>' : '') + '</div>';
          }).join('') + '</div>';
        break;

      case 'call':
        inner = statusBar(t) +
          '<div class="call call-' + esc(p.state || 'incoming') + '">' +
            '<p class="call-status">' + esc(p.status) + '</p>' +
            '<p class="call-name">' + esc(p.name) + '</p>' +
            '<div class="call-btns" aria-hidden="true">' +
              (p.state === 'incoming' ? '<span class="btn-decline"></span><span class="btn-accept"></span>' :
               p.state === 'ended' ? '<span class="btn-ended"></span>' : '<span class="btn-decline"></span>') +
            '</div>' +
          '</div>';
        break;

      case 'calllog':
        inner = statusBar(t) +
          '<p class="log-title">최근 기록</p>' +
          '<ul class="log">' + (p.entries || []).map(function (e) {
            return '<li><div><p class="log-name">' + esc(e.name) + '</p><p class="log-kind">' + esc(e.kind) + ' · ' + esc(e.duration) + '</p></div><span class="log-time">' + esc(e.time) + '</span></li>';
          }).join('') + '</ul>';
        break;

      case 'zoom':
        inner = '<div class="zoom">' + (p.time ? '<p class="zoom-time">' + esc(p.time) + '</p>' : '') +
          '<p class="zoom-text">' + highlight(p.text, p.highlight) + '</p></div>';
        break;

      default:
        inner = statusBar(t) + '<p class="muted">' + esc(cut.desc || '') + '</p>';
    }

    var label = owner === 'haein' ? '해인의 휴대폰' : '승민의 휴대폰';
    /* 화면 속 문자·메일 글자를 화면 읽기 프로그램이 읽을 수 있도록 role="img" 를 쓰지 않는다 */
    return '<figure class="phone-wrap"><div class="phone phone-' + owner + ' view-' + esc(p.view || 'none') + (p.focus ? ' is-focus' : '') + '">' +
      '<div class="phone-screen">' + inner + '</div></div>' +
      '<figcaption class="phone-owner">' + label + '</figcaption></figure>';
  }

  /* ---------- 장면 전환 카드 ---------- */
  function renderScene(sc) {
    var parts = [sc.date, sc.time].filter(Boolean).map(esc).join(' · ');
    return '<div class="scene-card reveal" data-transition="slow">' +
      '<p class="scene-when">' + parts + '</p>' +
      (sc.place ? '<p class="scene-place">' + esc(sc.place) + '</p>' : '') +
    '</div>';
  }

  /* ---------- 컷 ---------- */
  function renderCut(ep, cut) {
    var sp = cut.spacing || {};
    var before = sp.before != null ? sp.before : 0;
    var after = sp.after != null ? sp.after : 48;
    var html = '';
    if (cut.scene) html += renderScene(cut.scene);

    var body = '';
    if (cut.type === 'black') {
      body = '<div class="black-cut"><p>' + esc(cut.text) + '</p></div>';
    } else if (cut.type === 'phone') {
      body = renderPhone(cut) + renderLines(ep, cut).below;
    } else {
      var L = renderLines(ep, cut);
      body = renderArt(ep, cut, L.overlay) + L.below;
    }

    html += '<section class="cut cut-' + esc(cut.type) + ' reveal" id="cut-' + pad2(cut.no) + '" data-no="' + cut.no +
      '" data-transition="' + esc(cut.transition || 'fade') + '"' +
      ' style="--before:' + Number(before) + ';--after:' + Number(after) + ';">' + body + '</section>';
    return html;
  }

  /* ---------- 회차 화면 ---------- */
  function renderEpisode(meta, ep) {
    var s = W.series;
    document.title = ep.no + '화 ' + ep.title + ' · ' + s.title;
    var idx = s.episodes.indexOf(meta);
    var next = s.episodes[idx + 1];
    var nextHtml = next
      ? (next.ready
        ? '<a class="end-next" href="#' + next.id + '">' + next.no + '화 보기</a>'
        : '<p class="end-next is-locked">' + next.no + '화 준비 중</p>')
      : '';

    app.innerHTML =
      '<header class="topbar" id="topbar">' +
        '<a class="tb-back" href="#" aria-label="작품 메인으로">‹</a>' +
        '<p class="tb-title">' + ep.no + '화 〈' + esc(ep.title) + '〉</p>' +
        '<span class="tb-count" id="tb-count" aria-hidden="true">1 / ' + ep.cuts.length + '</span>' +
        '<div class="tb-progress" aria-hidden="true"><span id="tb-bar"></span></div>' +
      '</header>' +
      '<main class="viewer" id="viewer">' +
        '<div class="ep-head"><p class="ep-head-no">' + ep.no + '화</p><h1 id="page-heading" tabindex="-1">' + esc(ep.title) + '</h1></div>' +
        ep.cuts.map(function (c) { return renderCut(ep, c); }).join('') +
        '<div class="ep-silence" style="--after:' + Number(ep.endSpacing || 600) + ';" aria-hidden="true"></div>' +
        '<footer class="ep-end"><p class="end-mark">' + ep.no + '화 끝</p>' + nextHtml +
          '<a class="end-home" href="#">작품 메인으로</a></footer>' +
      '</main>';
    window.scrollTo(0, 0);

    bindImages();
    bindReveal();
    bindProgress(ep);
  }

  /* 그림 파일이 없거나 깨지면 임시 컷을 그대로 둔다 */
  function bindImages() {
    var imgs = app.querySelectorAll('.art-img');
    Array.prototype.forEach.call(imgs, function (img) {
      function ok() {
        var box = img.parentNode;
        /* imageSize 가 없던 컷은 로딩 후 원본 비율로 맞춘다 (잘라내지 않음) */
        if (!box.classList.contains('is-sized') && img.naturalWidth && img.naturalHeight) {
          box.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
        }
        box.classList.add('is-loaded');
      }
      function fail() { img.parentNode.classList.add('is-missing'); img.remove(); }
      if (img.complete && img.naturalWidth) ok();
      img.addEventListener('load', ok);
      img.addEventListener('error', fail);
    });
  }

  /* 컷 등장 효과 */
  function bindReveal() {
    var els = app.querySelectorAll('.reveal');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
    cleanup.push(function () { io.disconnect(); });
  }

  /* 상단 바: 진행률, 현재 컷, 스크롤 방향에 따라 숨김 */
  function bindProgress(ep) {
    var bar = document.getElementById('tb-bar');
    var count = document.getElementById('tb-count');
    var top = document.getElementById('topbar');
    var cuts = app.querySelectorAll('.cut');
    var lastY = window.scrollY, ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      bar.style.width = Math.min(100, (y / max) * 100) + '%';
      var mid = window.innerHeight * 0.5, cur = 1;
      for (var i = 0; i < cuts.length; i++) {
        if (cuts[i].getBoundingClientRect().top < mid) cur = +cuts[i].getAttribute('data-no'); else break;
      }
      count.textContent = cur + ' / ' + ep.cuts.length;
      if (y > lastY + 6 && y > 80) top.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 80) top.classList.remove('is-hidden');
      lastY = y;
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    function onTap(e) {
      if (e.target.closest('a,button')) return;
      top.classList.toggle('is-hidden');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    document.getElementById('viewer').addEventListener('click', onTap);
    cleanup.push(function () { window.removeEventListener('scroll', onScroll); });
    update();
  }

  function renderError(msg) {
    app.innerHTML = '<main class="home"><section class="home-list"><h2 id="page-heading" tabindex="-1">불러오지 못했습니다</h2><p class="err">' + esc(msg) +
      '</p><p><a class="home-start" href="#">작품 메인으로</a></p></section></main>';
  }

  /* ---------- 라우터 ---------- */
  /* 화면이 바뀌면 제목으로 초점을 옮겨, 화면 읽기 프로그램이 페이지 처음부터 읽게 한다 */
  var firstRoute = true;
  function focusHeading() {
    if (firstRoute) { firstRoute = false; return; }
    var h = document.getElementById('page-heading');
    if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
  }

  function route() {
    runCleanup();
    var id = (location.hash || '').replace('#', '');
    var meta = W.series.episodes.filter(function (e) { return e.id === id; })[0];
    if (!meta) { renderHome(); return focusHeading(); }
    if (!meta.ready) { renderError(meta.no + '화는 아직 준비 중입니다.'); return focusHeading(); }
    app.innerHTML = '<p class="loading" role="status">불러오는 중…</p>';
    loadEpisode(meta, function (err, ep) {
      if (err) { renderError(err.message); return focusHeading(); }
      if ((location.hash || '').replace('#', '') !== meta.id) return;
      renderEpisode(meta, ep);
      focusHeading();
    });
  }

  window.addEventListener('hashchange', route);
  route();
})();
