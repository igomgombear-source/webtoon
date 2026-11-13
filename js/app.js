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
          /* 책상 위에 놓인 해인의 휴대폰과, 그 위에 붙은 해인의 메모 */
          '<div class="still" aria-hidden="true">' +
            '<div class="desk-phone"><span class="dp-btn"></span></div>' +
            '<div class="postit"><p>승민쌤께.</p><p><span>10:30쯤 제가 직접</span><span>휴대폰을 찾으러</span><span>올게요.</span></p></div>' +
          '</div>' +
          '<div class="cover-text">' +
            '<h1 class="home-title" id="page-heading" tabindex="-1">' + esc(s.title) + '</h1>' +
            (first ? '<a class="home-go" href="#' + first.id + '">1화 〈' + esc(first.title) + '〉</a>' : '') +
          '</div>' +
        '</header>' +
        '<section class="home-list"><h2>회차 · ' + esc(s.status) + '</h2><ul>' + list + '</ul></section>' +
      '</main>';
    window.scrollTo(0, 0);
  }

  /* ---------- 대사 ---------- */
  function renderLine(ep, line, overlay) {
    var style = line.style || 'speech';
    var sp = (ep.speakers && ep.speakers[line.who]) || {};
    var side = line.side || sp.side || 'left';
    var name = (ep.showSpeakerNames && line.who && style !== 'caption' && style !== 'silence' && !line.hideName)
      ? '<span class="who">' + esc(line.who) + (style === 'phone' ? ' · 전화' : '') + '</span>' : '';
    var pos = '';
    if (overlay && line.pos) {
      pos = ' style="left:' + Number(line.pos.x) + '%;top:' + Number(line.pos.y) + '%;"';
    }
    return '<div class="line line-' + style + ' side-' + side + (line.small ? ' is-small' : '') + (overlay && line.pos ? ' is-overlay' : '') + '"' + pos + '>' +
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

  /* 완성 컷을 단일 이미지로 쓸지: ep.useExportedCuts = true | false | 'mobile' */
  function useExported(ep) {
    var u = ep.useExportedCuts;
    if (u === 'mobile') return !!(window.matchMedia && window.matchMedia('(max-width: 720px)').matches);
    return u === true;
  }

  var KIND_NOTE = { key: '핵심 컷', compose: '조립 컷' };

  /* 그림 영역 우선순위
   *   1) image            완성 컷 한 장
   *   2) compose.export   (useExportedCuts 일 때) 미리 합성해 둔 완성 컷. 못 불러오면 3)으로
   *   3) compose          배경 + 투명 레이어를 화면에서 합성
   *   4) 임시 컷 */
  function renderArt(ep, cut, overlayHtml) {
    var time = cut.datetime && cut.datetime.time
      ? '<span class="time-chip">' + esc(cut.datetime.time) + '</span>' : '';
    var note = (KIND_NOTE[cut.kind] ? KIND_NOTE[cut.kind] + ' · ' : '') + '그림 준비 중';
    var ph =
      '<div class="placeholder tone-' + esc(cut.tone || 'default') + '">' +
        '<span class="ph-no" aria-hidden="true">#' + pad2(cut.no) + '</span>' +
        '<span class="ph-desc">' + esc(placeholderLabel(cut)) + '</span>' +
        '<span class="ph-note" aria-hidden="true">' + note + '</span>' +
      '</div>';
    var alt = esc(cut.alt || cut.desc || '');

    if (cut.image) {
      var src = /^(\.|\/|https?:)/.test(cut.image) ? cut.image : (ep.imageBase || '') + cut.image;
      var z = cut.imageSize || {};
      var sized = +z.w > 0 && +z.h > 0;
      return '<div class="art has-image' + (sized ? ' is-sized' : '') + '" style="' + artBoxStyle(cut) + '">' +
        ph +
        '<img class="art-img" src="' + esc(src) + '" alt="' + alt + '"' +
          (sized ? ' width="' + (+z.w) + '" height="' + (+z.h) + '"' : '') +
          ' loading="lazy" decoding="async">' +
        (cut.imageStatus === 'draft' ? '<span class="draft-badge" aria-hidden="true">DRAFT</span>' : '') +
        time + overlayHtml + '</div>';
    }

    var c = cut.compose;
    if (c && (c.bg || (c.layers && c.layers.length) || c.export)) {
      var C = W.compose, size = C.canvasSize(cut);
      var box = 'aspect-ratio:' + size.w + ' / ' + size.h + ';';
      var live =
        (c.bg ? '<img class="cmp-bg" src="' + esc(C.resolve(c.bg, ep.imageBase)) + '" alt="" loading="lazy" decoding="async">' : '') +
        (c.layers || []).map(function (l) {
          return '<img class="cmp-layer" src="' + esc(C.resolve(l.src, ep.imageBase)) + '" alt="" style="' + C.layerStyle(l, size) + '" loading="lazy" decoding="async">';
        }).join('');
      var exp = c.export && useExported(ep);
      /* 그림 부분(cmp-visual)만 하나의 이미지로 읽히게 하고, 시각·대사는 그 밖에 두어 따로 읽힌다 */
      var visualA11y = alt ? ' role="img" aria-label="' + alt + '"' : ' aria-hidden="true"';
      return '<div class="art is-compose' + (exp ? ' use-export' : '') + '" style="' + box + '">' +
        ph +
        '<div class="cmp-visual"' + visualA11y + '>' +
          (exp ? '<img class="cmp-export" src="' + esc(C.resolve(c.export, ep.imageBase)) + '" alt="" width="' + size.w + '" height="' + size.h + '" loading="lazy" decoding="async">' : '') +
          '<div class="cmp-live">' + live + '</div>' +
        '</div>' +
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
      '<div class="phone-screen' + (p.wall ? ' has-wall' : '') + '"' +
        (p.wall ? ' style="background-image:url(' + esc(p.wall) + ')"' : '') + '>' + inner + '</div></div>' +
      '<figcaption class="phone-owner">' + label + '</figcaption></figure>';
  }

  /* ---------- 장면 전환 카드 ---------- */
  /* 장면 분위기(mood, 선택): 컷 앞뒤 여백까지 그 색으로 칠한다. 색은 css/style.css 의 [data-mood] */
  function moodAttr(m) { return m ? ' data-mood="' + esc(m) + '"' : ''; }

  function renderScene(sc, mood) {
    var parts = [sc.date, sc.time].filter(Boolean).map(esc).join(' · ');
    return '<div class="scene-card reveal" data-transition="slow"' + moodAttr(mood) + '>' +
      '<p class="scene-when">' + parts + '</p>' +
      (sc.place ? '<p class="scene-place">' + esc(sc.place) + '</p>' : '') +
    '</div>';
  }

  /* ---------- 104컷 제작판 레이아웃 (ep.layout === 'v3') ----------
   * 컷 필드
   *   width/align  컷 가로폭 %, 'left'|'right'|(가운데)
   *   shape        'box' | 'slant-r' | 'slant-l' | 'bleed' (단일 컷의 그림 마스크)
   *   rows         [[panel, panel], [panel]] 한 줄에 2~3컷(split2), 얇은 띠 여러 개(strip), 위1+아래2(stack)
   *                panel { ratio:'3:4', image?, imageSize?, imageStatus?, time?, tone?, desc? }
   *   rowGap       줄 사이 간격(px, 360 기준)
   *   diagonal     true 면 줄 안의 컷 경계를 완만한 사선으로
   *   inset        { to:'prev' } 앞 컷 모서리에 걸쳐 겹침(spacing.before 를 음수로)
   *                { to:'self', corner:'tr', width:30, image?, text?, kind?:'recall'|'crack' } 이 컷 안의 작은 인셋
   *   link         'prev' 앞 컷과 면이 이어짐(위 간격 0)
   *   overflow     { edge:'top'|'bottom', size:px, note } 그림이 틀 밖으로 나감(틀 밖 예약 여백)
   * 대사 필드
   *   at     'in-tl' 'in-tr' 'in-bl' 'in-br' 컷 안쪽 | 'edge-top-l' 'edge-top-r' 'edge-bottom-l' 'edge-bottom-r' 경계에 걸침 | 'gap' 컷 아래 여백(기본)
   *   panel  몇 번째 컷에 둘지(줄 순서대로 0부터)   small  작게
   * 말풍선은 그림 마스크 밖 레이어(.panel-bubbles)에 그려 clip-path·overflow 에 잘리지 않는다. */
  function ratioVal(r) { var p = String(r || '4:3').split(':'); return (parseFloat(p[0]) || 4) / (parseFloat(p[1]) || 3); }
  var SHAPE_OK = { 'slant-r': 1, 'slant-l': 1, bleed: 1 };

  function bubbleGroups(ep, lines, panelIdx) {
    var groups = {}, order = [];
    lines.forEach(function (l) {
      if ((l.panel || 0) !== panelIdx) return;
      var at = l.at || 'gap';
      if (at === 'gap' || at === 'above') return;
      if (!groups[at]) { groups[at] = []; order.push(at); }
      var prev = groups[at].length ? groups[at][groups[at].length - 1].who : null;
      groups[at].push({ who: l.who, html: renderLine(ep, prev !== null && prev === l.who ? Object.assign({}, l, { hideName: true }) : l, false) });
    });
    return order.map(function (at) {
      return '<div class="bgrp at-' + at + '">' + groups[at].map(function (g) { return g.html; }).join('') + '</div>';
    }).join('');
  }

  function renderInsetSelf(ep, cut) {
    var i = cut.inset;
    if (!i || i.to !== 'self') return '';
    var inner = i.image
      ? '<img src="' + esc(/^(\.|\/|https?:|assets\/)/.test(i.image) ? i.image : (ep.imageBase || '') + i.image) + '" alt="" loading="lazy" decoding="async">'
      : '<p class="inset-text">' + esc(i.text || '') + '</p>';
    return '<div class="inset inset-' + esc(i.corner || 'tr') + ' inset-' + esc(i.kind || 'plain') + '" style="width:' + Number(i.width || 30) + '%;">' + inner + '</div>';
  }

  function renderPanelsV3(ep, cut, lines) {
    var rows = cut.rows || [[{ ratio: cut.ratio, image: cut.image, imageSize: cut.imageSize, imageStatus: cut.imageStatus }]];
    var w = Math.max(40, Math.min(100, Number(cut.width) || 100));
    var al = cut.align === 'left' || cut.align === 'right' ? cut.align : 'center';
    var shape = SHAPE_OK[cut.shape] ? ' shape-' + cut.shape : '';
    var ov = cut.overflow || null;
    var idx = 0, first = true;
    var hasEdgeTop = lines.some(function (l) { return /^edge-top/.test(l.at || ''); });
    var hasEdgeBottom = lines.some(function (l) { return /^edge-bottom/.test(l.at || ''); });
    var html = rows.map(function (row, ri) {
      var sum = row.reduce(function (a, p) { return a + ratioVal(p.ratio || cut.ratio); }, 0);
      var panels = row.map(function (p, pi) {
        var dt = p.time ? { time: p.time } : (first && cut.datetime ? cut.datetime : null);
        first = false;
        var pc = { no: cut.no, type: 'panel', kind: cut.kind, image: p.image || null, imageSize: p.imageSize, imageStatus: p.imageStatus,
          ratio: p.ratio || cut.ratio, desc: p.desc || cut.desc, tone: p.tone || cut.tone, alt: p.alt || cut.alt, datetime: dt };
        var diag = cut.diagonal && row.length > 1 ? ' diag-' + (pi === 0 ? 'first' : 'last') : '';
        var me = idx++;
        return '<div class="panel' + diag + '" data-panel="' + me + '" style="flex:' + Math.round(ratioVal(p.ratio || cut.ratio) * 1000) + ' 1 0%;">' +
          '<div class="panel-mask' + (rows.length === 1 && row.length === 1 ? shape : '') + (ov ? ' is-overflow' : '') + '">' + renderArt(ep, pc, '') +
            (ov && me === 0 ? '<span class="ovf-chip ovf-' + esc(ov.edge) + '" aria-hidden="true">' + esc(ov.note || '틀 밖') + '</span>' : '') +
          '</div>' +
          (me === 0 ? renderInsetSelf(ep, cut) : '') +
          '<div class="panel-bubbles">' + bubbleGroups(ep, lines, me) + '</div>' +
        '</div>';
      }).join('');
      return '<div class="panel-row' + (cut.diagonal && row.length > 1 ? ' is-diagonal' : '') + '" style="aspect-ratio:' + sum + ' / 1;' +
        (ri > 0 && cut.rowGap ? 'margin-top:calc(' + Number(cut.rowGap) + ' * var(--u));' : '') + '">' + panels + '</div>';
    }).join('');
    var cls = 'cut-wrap w-' + al + (w < 100 ? ' is-narrow' : '') + (hasEdgeTop ? ' has-edge-top' : '') + (hasEdgeBottom ? ' has-edge-bottom' : '') + (cut.shape === 'strip' ? ' is-strip' : '') +
      (ov ? ' has-ovf-' + esc(ov.edge) : '');
    return '<div class="' + cls + '" style="--cw:' + w + '%;' + (ov ? '--ovf:' + Number(ov.size || 32) + 'px;' : '') + '">' + html + '</div>';
  }

  /* 컷 위 여백 띠: 그림 위가 아니라 그림 앞(흐름 안)에 놓는다 — 얼굴을 가리지 않는 말풍선 자리 */
  function renderAboveLines(ep, lines) {
    var g = lines.filter(function (l) { return l.at === 'above'; });
    return g.length ? '<div class="lines above-lines">' + g.map(function (l) { return renderLine(ep, l, false); }).join('') + '</div>' : '';
  }

  function renderGapLines(ep, lines) {
    var g = lines.filter(function (l) { return (l.at || 'gap') === 'gap'; });
    return g.length ? '<div class="lines gap-lines">' + g.map(function (l) { return renderLine(ep, l, false); }).join('') + '</div>' : '';
  }


  /* ---------- 컷 ---------- */
  function renderCut(ep, cut) {
    var sp = cut.spacing || {};
    var before = sp.before != null ? sp.before : 0;
    var after = sp.after != null ? sp.after : 48;
    var html = '';
    if (cut.scene) html += renderScene(cut.scene, cut.mood);

    var body = '';
    if (cut.type === 'black') {
      body = '<div class="black-cut"><p>' + esc(cut.text) + '</p></div>';
    } else if (cut.type === 'phone') {
      body = renderPhone(cut) + renderLines(ep, cut).below;
    } else if (ep.layout === 'v3') {
      var ls = cut.lines || [];
      if (cut.phonePreview && cut.phone) {
        body = '<div class="phone-preview"><p class="pp-note">#' + pad2(cut.no) + ' · 원화 합성 전 · 휴대폰 UI 미리보기</p>' + renderPhone(cut) + '</div>' + renderGapLines(ep, ls);
      } else {
        body = renderAboveLines(ep, ls) + renderPanelsV3(ep, cut, ls) + renderGapLines(ep, ls);
      }
    } else {
      var L = renderLines(ep, cut);
      body = renderArt(ep, cut, L.overlay) + L.below;
    }

    html += '<section class="cut cut-' + esc(cut.type) + ' reveal" id="cut-' + pad2(cut.no) + '" data-no="' + cut.no +
      '" data-transition="' + esc(cut.transition || 'fade') + '"' + moodAttr(cut.mood) +
      (cut.link ? ' data-link="' + esc(cut.link) + '"' : '') + (cut.inset && cut.inset.to === 'prev' ? ' data-inset="prev"' : '') +
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
    /* 말풍선 v4 시범(?bubbles=v4 일 때만 동작) */
    if (window.BubblesV4) window.BubblesV4.apply(app, ep, meta);
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

    /* 조립 컷 로딩 상태
     *  - export 모드: export 가 들어오면 표시. 실패하면 실시간 조립으로 바꾸고 상태를 다시 계산
     *  - 실시간 조립: 배경이 들어오면 표시. 배경이 없는 컷(bg 미지정)은 레이어가 하나라도 들어오면 표시
     *  - 없는 배경·레이어 파일은 조용히 뺀다 (배경 파일이 없으면 임시 컷을 남겨 빈 재료를 알 수 있게 함) */
    Array.prototype.forEach.call(app.querySelectorAll('.art.is-compose'), function (box) {
      var ex = box.querySelector('.cmp-export');
      var bg = box.querySelector('.cmp-bg');
      var st = { ex: ex ? 'wait' : 'none', bg: bg ? 'wait' : 'none', layers: 0 };

      function update() {
        var ok;
        if (box.classList.contains('use-export')) ok = st.ex === 'ok';
        else if (st.bg === 'ok') ok = true;
        else if (st.bg === 'none') ok = st.layers > 0;
        else ok = false;
        box.classList.toggle('is-loaded', ok);
      }
      function watch(img, onOk, onBad) {
        var done = false;
        function ok() { if (done) return; done = true; onOk(); update(); }
        function bad() { if (done) return; done = true; onBad(); update(); }
        img.addEventListener('load', ok);
        img.addEventListener('error', bad);
        if (img.complete) { if (img.naturalWidth) ok(); else if (img.currentSrc) bad(); }
      }

      if (ex) watch(ex, function () { st.ex = 'ok'; }, function () {
        st.ex = 'failed'; ex.remove(); box.classList.remove('use-export');   /* 실시간 조립으로 전환 */
      });
      if (bg) watch(bg, function () { st.bg = 'ok'; }, function () { st.bg = 'failed'; bg.remove(); });
      Array.prototype.forEach.call(box.querySelectorAll('.cmp-layer'), function (l) {
        watch(l, function () { st.layers++; }, function () { l.remove(); });
      });
      update();
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
