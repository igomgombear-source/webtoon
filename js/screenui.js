/* 휴대폰 화면 UI 합성 레이어 (원화는 수정하지 않는다)
 *
 * 원화 속 휴대폰의 회색 '빈 화면' 위에, HTML/CSS UI 를 원근 변환(matrix3d)으로 얹는다.
 *   - 화면 네 모서리(quad)와 화면 영역 윤곽(clip)은 data/ep01v3-screens.js 에 비율(0~1, %)로 들어 있다.
 *   - clip 은 원화에서 '화면 회색 영역'만 따낸 윤곽이라 손가락·손이 화면을 가린 부분은 UI 가 덮지 않는다.
 *   - UI 는 가로 300 의 가상 화면(세로는 화면 비율 aspect)에 그린 뒤 quad 로 투영한다. 글자 크기는 가상 화면 기준.
 *   - 내용은 제작기준 v2 의 컷 설명·8-5 휴대폰 UI 표만 쓴다. 없는 대화·번호·이름은 만들지 않는다.
 */
(function () {
  'use strict';
  var W = window.WEBTOON = window.WEBTOON || { episodeData: {} };
  var BW = 300;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function status(t) {
    return '<div class="su-status"><span class="su-clock">' + esc(t || '') + '</span><span class="su-ic" aria-hidden="true"><i></i><i></i><i class="bat"></i></span></div>';
  }
  function dim(t) { return '<span class="su-dim">' + esc(t) + '</span>'; }
  function bubble(m, spec) {
    var cls = 'su-b ' + (m.from === 'me' ? 'me' : 'them') + (m.blur ? ' is-blur' : '');
    var body = m.parts
      ? m.parts.map(function (p) { return p.focus ? '<mark>' + esc(p.t) + '</mark>' : (p.dim ? dim(p.t) : esc(p.t)); }).join('')
      : esc(m.text);
    return '<div class="su-brow ' + (m.from === 'me' ? 'me' : 'them') + '"><div class="' + cls + '"><p>' + body + '</p></div>' +
      (m.time ? '<span class="su-time">' + esc(m.time) + '</span>' : '') + '</div>';
  }
  function head(name) {
    return '<div class="su-head"><span class="su-back" aria-hidden="true">‹</span><span class="su-av" aria-hidden="true"></span><span class="su-name">' + esc(name) + '</span></div>';
  }
  function notifCard(n) {
    return '<div class="su-notif"><div class="su-b-top"><span class="su-app msg" aria-hidden="true"></span><span class="su-b-app">' + esc(n.app) + '</span><span class="su-b-time">' + esc(n.time) + '</span></div>' +
      '<p class="su-b-l1">' + esc(n.from) + '</p><p class="su-b-l2 wrap">' + esc(n.body) + '</p></div>';
  }

  var VIEWS = {
    /* U01 — 메일 알림 배너 2줄 (두 번째 줄 말줄임) */
    banner: function (s) {
      return status(s.clock) + '<div class="su-banner"><div class="su-b-top"><span class="su-app mail" aria-hidden="true"></span><span class="su-b-app">' + esc(s.app) + ' · ' + esc(s.from) + '</span><span class="su-b-time">' + esc(s.time) + '</span></div>' +
        '<p class="su-b-l1">' + esc(s.line1) + '</p><p class="su-b-l2">' + esc(s.line2) + '</p></div>';
    },
    /* U02 — 재생목록(곡 순서만, 곡명·시간 없음) */
    playlist: function (s) {
      var rows = '';
      for (var i = 1; i <= s.rows; i++) rows += '<li><span class="no">' + i + '</span><span class="bar" style="width:' + (46 + (i * 17) % 34) + '%"></span><span class="pl" aria-hidden="true"></span></li>';
      return status(s.clock) + '<p class="su-title">' + esc(s.title) + '</p><ol class="su-list">' + rows + '</ol>';
    },
    /* U03 — 해인 폰: 재생 중 화면(곡명·시간 없이 모양만) 위로 메시지 배너가 내려옴 */
    playing: function (s) {
      return status(s.clock) + '<div class="su-np" aria-hidden="true"><span class="su-cover"></span><span class="su-npbar w1"></span><span class="su-npbar w2"></span>' +
        '<span class="su-prog"><i></i></span><span class="su-ctl"><i class="pv"></i><i class="pp"></i><i class="nx"></i></span></div>' +
        '<div class="su-drop">' + notifCard(s.item) + '</div>';
    },
    /* U05 — 연락처 '권해인 쌤' (통화 버튼 누르기 전)
     * callAt:[x,y] (가상 화면 폭·높이에 대한 %) 가 있으면 통화·문자 버튼을 하단 동작 줄에 절대 배치한다(59컷: 엄지가 통화 버튼 위에서 멈춤). 없으면 기존 배치(60컷). */
    contacts: function (s) {
      if (s.callAt) {
        var cx = +s.callAt[0], cy = +s.callAt[1], mx = cx + (+s.msgDx || 31);
        return status(s.clock) + '<div class="su-contact is-pos"><span class="su-bigav" aria-hidden="true"></span><p class="su-cname">' + esc(s.name) + '</p></div>' +
          '<div class="su-acts is-abs"><span class="act a-call" style="left:' + cx + '%;top:' + cy + '%"><i></i>통화</span><span class="act a-msg" style="left:' + mx + '%;top:' + cy + '%"><i></i>문자</span></div>';
      }
      return status(s.clock) + '<div class="su-contact"><span class="su-bigav" aria-hidden="true"></span><p class="su-cname">' + esc(s.name) + '</p>' +
        '<div class="su-acts"><span class="act a-call"><i></i>통화</span><span class="act a-msg"><i></i>문자</span></div></div>';
    },
    /* U07 — 잠금화면 + 알림 목록 */
    lock: function (s) {
      return status('') + '<div class="su-lock"><p class="su-date">' + esc(s.date) + '</p><p class="su-lt">' + esc(s.clock) + '</p></div>' +
        '<div class="su-notifs">' + (s.items || []).map(notifCard).join('') + '</div>';
    },
    /* U08·U10·U14 — 문자 스레드 */
    sms: function (s) {
      return status(s.clock) + head(s.contact) + '<div class="su-thread">' + s.messages.map(function (m) { return bubble(m, s); }).join('') + '</div>';
    },
    /* U11·U12 — 입력창 */
    compose: function (s) {
      var thread = (s.messages || []).map(function (m) { return bubble(m, s); }).join('');
      var txt = s.erasing
        ? '<span class="t">' + esc(s.keep) + '</span><span class="t fade1">' + esc(s.fade1) + '</span><span class="t fade2">' + esc(s.fade2) + '</span><i class="caret"></i>'
        : '<span class="t">' + esc(s.input) + '</span>';
      return status(s.clock) + head(s.contact) + '<div class="su-thread">' + thread + '</div>' +
        '<div class="su-input"><div class="su-field' + (s.erasing ? ' is-erasing' : '') + '">' + txt + '</div><span class="su-send' + (s.erasing ? ' off' : '') + '" aria-hidden="true"></span></div>';
    },
    /* 23-a — 모니터 바탕화면(spec.photo: 승인 원화 16컷 속 모니터 화면을 같은 파일에서 잘라 비춤 — 별도 사진 파일 없음) + 종료 직전 메뉴.
     * menu:{x,y,w,h} 는 가상 화면에 대한 %. 화면은 켜져 있고 메뉴만 열린 상태(꺼진 화면 아님) */
    desktop: function (s) {
      var m = s.menu; if (!m) return '';
      return '<div class="su-pwr" style="left:' + m.x + '%;top:' + m.y + '%;width:' + m.w + '%;height:' + m.h + '%;">' +
        '<span class="pi"><i class="ic sl"></i>절전</span><span class="pi on"><i class="ic off"></i>시스템 종료</span><span class="pi"><i class="ic rs"></i>다시 시작</span></div>';
    },
    /* 52 — 화면 꺼짐(옆 버튼을 누른 뒤): 검은 유리 */
    off: function () { return '<div class="su-offglass"></div>'; },
    /* U13 — 수신: 미저장 번호 + 발신자 정보 */
    incoming: function (s) {
      var head = status(s.clock) + '<div class="su-call"><p class="su-cl">' + esc(s.label) + '</p><p class="su-num">' + esc(s.number).replace(/○/g, '<i class="m"></i>') + '</p><p class="su-info">' + esc(s.info) + '</p></div>';
      /* slide:{cx,cy} — 손잡이 중심(가상 화면 가로 300 기준 px). 94컷: 받기 전(a)·밀어서 받는 중(b)의 엄지 끝 위치에 손잡이를 맞춘다 */
      if (s.slide) {
        var cx = +s.slide.cx, cy = +s.slide.cy;
        var sp = Math.max(0, cx - (s.slide.start == null ? cx : +s.slide.start));   /* 시작 위치에서 밀린 거리(px) → 지나온 길을 옅은 초록으로 채움 */
        return head + '<div class="su-slide is-abs" style="--sx:' + cx + 'px;--sy:' + cy + 'px;--st:' + (s.slide.start == null ? cx : +s.slide.start) + 'px;--sp:' + sp + 'px;">' +
          '<span class="su-decl" aria-hidden="true"></span><div class="su-track"><span class="su-fill"></span><span class="su-acc">' + esc(s.accept) + '</span></div><span class="su-knob" aria-hidden="true"></span></div>';
      }
      return head +
        '<div class="su-slide"><span class="su-decl" aria-hidden="true"></span><div class="su-track"><span class="su-knob" style="left:' + (s.knob || 0) + '%"></span><span class="su-acc">' + esc(s.accept) + '</span></div></div>';
    }
  };

  function label(s) {
    var out = [];
    (s.messages || []).forEach(function (m) { out.push(m.text || (m.parts || []).map(function (p) { return p.t; }).join('')); });
    return (s.aria || '휴대폰 화면') + (out.length ? ': ' + out.join(' / ') : '');
  }

  /* spec 은 하나 또는 배열(한 원화에 폰이 둘인 60컷: 승민 폰 + 꺼진 해인 폰) */
  function build(spec) {
    if (Array.isArray(spec)) return spec.map(build).join('');
    var fn = VIEWS[spec.view]; if (!fn) return '';
    var q = spec.quad.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var poly = spec.clip.map(function (p) { return p[0] + '% ' + p[1] + '%'; }).join(',');
    var wall = spec.wall ? 'background-image:url(' + esc(spec.wall) + ');' : '';
    if (spec.photo) {   /* 원화 속 영역(sx 폭)을 가상 화면 가로 300 에 맞춰 균일 확대(비율 유지) */
      var ph = spec.photo, k = BW / ph.sw;
      wall = 'background-image:url(' + esc(ph.src) + ');background-repeat:no-repeat;background-size:' + (ph.w * k).toFixed(2) + 'px ' + (ph.h * k).toFixed(2) + 'px;background-position:' + (-ph.x * k).toFixed(2) + 'px ' + (-ph.y * k).toFixed(2) + 'px;';
    }
    return '<div class="scr" role="img" aria-label="' + esc(label(spec)) + '" data-quad="' + q + '" data-aspect="' + spec.aspect + '" style="clip-path:polygon(' + poly + ');">' +
      '<div class="scr-ui su-' + (spec.theme === 'light' ? 'light' : 'dark') + ' su-v-' + spec.view + (spec.tint ? ' is-tint' : '') + '" style="font-size:' + (spec.fs || 18) + 'px;' + wall + '" aria-hidden="true">' + fn(spec) + '</div></div>' +
      buildFg(spec, poly) + buildClock(spec);
  }

  /* 벽시계 바늘(SVG, 원화 위 별도 층) — spec.clock = { w, h (원화 px), cx, cy, hh, mm, hl, ml, ry }. 원화의 시계 테두리·면은 건드리지 않는다 */
  function buildClock(spec) {
    var c = spec.clock; if (!c) return '';
    var ha = ((c.hh % 12) + c.mm / 60) * 30, ma = c.mm * 6;
    function hand(a, len, wd) {
      var r = a * Math.PI / 180;
      return '<line x1="0" y1="0" x2="' + (Math.sin(r) * len).toFixed(1) + '" y2="' + (-Math.cos(r) * len).toFixed(1) + '" stroke="#2a2a31" stroke-width="' + wd + '" stroke-linecap="round"/>';
    }
    return '<svg class="scr-clock" viewBox="0 0 ' + c.w + ' ' + c.h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<g transform="translate(' + c.cx + ' ' + c.cy + ') scale(1 ' + (c.ry || 1) + ')">' + hand(ha, c.hl, 7) + hand(ma, c.ml, 4.5) + '<circle r="6" fill="#2a2a31"/></g></svg>';
  }

  /* 손가락 전경(fg) — UI 앞에 놓이는 손가락 픽셀(원화와 같은 캔버스에서 잘라낸 투명 WebP). 원화는 수정하지 않는다.
   *   spec.fg = { src, x, y, w (원화 캔버스에 대한 %), shadow: 'hover'(떠 있는 이격 그림자) | 'touch'(닿은 짧은 그림자) }
   *   그림자는 같은 전경을 어둡게·흐리게 만든 별도 층이며 화면 윤곽(clip) 안에서만 UI 위에 드리운다(UI 에 가려진 원화 그림자의 대용).
   *   --sdx·--sdy 는 전경 크기에 대한 %, --sb 는 blur(--u 단위), --so 는 투명도. */
  var SHADOW = {
    hover: { dx: 5, dy: 9, b: 3.2, o: .5 },
    touch: { dx: 1.5, dy: 3.2, b: 1.4, o: .6 }
  };
  function buildFg(spec, poly) {
    var f = spec.fg; if (!f || !f.src) return '';
    var pos = 'left:' + (+f.x) + '%;top:' + (+f.y) + '%;width:' + (+f.w) + '%;';
    var sh = f.shadow && SHADOW[f.shadow];
    return (sh
      ? '<div class="scr-sh" aria-hidden="true" style="clip-path:polygon(' + poly + ');"><img class="scr-sh-img" src="' + esc(f.src) + '" alt="" style="' + pos +
          '--sdx:' + sh.dx + '%;--sdy:' + sh.dy + '%;--sb:' + sh.b + ';--so:' + sh.o + ';" decoding="async"></div>'
      : '') +
      '<img class="scr-fg" src="' + esc(f.src) + '" alt="" aria-hidden="true" style="' + pos + '" decoding="async">';
  }

  /* 확대 인셋(zoom) — 원화 속 작은 휴대폰 화면의 글자를 읽을 수 있게, 같은 UI 를 평면(원근 없이)으로 크게 다시 그려
   * 컷 위(마스크 밖 층, .panel 직속)에 얹는다. 원화는 수정하지 않고, 실제 폰 화면 테두리와 가는 선으로 이어 '확대'임을 보인다.
   *   spec.zoom = { x, y, w (패널 폭·높이에 대한 %, x 가 음수면 왼쪽 여백으로 나옴), fs (인셋 기준 글자 크기, 폭 360 기준 px),
   *                 parts: 'notif'(알림 카드) | 'thread'(문자 스레드, count 개 말풍선) }
   *   글자 크기·테두리는 --u(폭/360) 단위라 폭이 달라져도 비율이 같다. 읽기 프로그램에는 .scr 의 aria-label 이 있으므로 인셋은 aria-hidden. */
  var ZOOM = {
    notif: function (s) { return '<div class="su-notifs">' + (s.items || (s.item ? [s.item] : [])).map(notifCard).join('') + '</div>'; },
    /* 연락처 카드 (60컷): 이름 + 통화·문자 */
    contact: function (s) {
      return '<div class="su-zc"><p class="su-cname">' + esc(s.name) + '</p><div class="su-acts"><span class="act a-call"><i></i>통화</span><span class="act a-msg"><i></i>문자</span></div></div>';
    },
    /* 입력창 (81컷): 대화 상대 + 입력 중인 문장 + 전송 */
    compose: function (s) {
      return head(s.contact) + '<div class="su-input"><div class="su-field"><span class="t">' + esc(s.input) + '</span></div><span class="su-send" aria-hidden="true"></span></div>';
    },
    /* 메일 배너 (20컷, U01): 앱·보낸이·시간 + 제목 + 본문 첫 줄 */
    banner: function (s) {
      return '<div class="su-notifs"><div class="su-notif"><div class="su-b-top"><span class="su-app mail" aria-hidden="true"></span><span class="su-b-app">' + esc(s.app) + ' · ' + esc(s.from) + '</span><span class="su-b-time">' + esc(s.time) + '</span></div>' +
        '<p class="su-b-l1">' + esc(s.line1) + '</p><p class="su-b-l2">' + esc(s.line2) + '</p></div></div>';
    },
    /* 연락처 (59컷, U05): 이름 + 통화·문자 (60컷과 같은 카드) */
    contacts: function (s) {
      return '<div class="su-zc"><p class="su-cname">' + esc(s.name) + '</p><div class="su-acts"><span class="act a-call"><i></i>통화</span><span class="act a-msg"><i></i>문자</span></div></div>';
    },
    thread: function (s) {
      var st = (s.zoom && s.zoom.start) || 0;
      var m = (s.messages || []).slice(st, st + ((s.zoom && s.zoom.count) || 1));
      /* focusOnly: 강조 문구(85컷 '휴대폰 잘 받았어요.')만 확대 — 나머지 문장은 폰 속 원래 UI 에 그대로 있다 */
      if (s.zoom && s.zoom.focusOnly) m = m.map(function (x) { return x.parts ? { from: x.from, time: x.time, parts: x.parts.filter(function (p) { return p.focus; }) } : x; });
      return head(s.contact) + '<div class="su-thread">' + m.map(function (x) { return bubble(x, s); }).join('') + '</div>';
    }
  };
  function buildZoom(spec) {
    if (Array.isArray(spec)) { spec = spec.filter(function (x) { return x && x.zoom; })[0]; }   /* 폰이 둘인 컷: zoom 이 있는 쪽만 */
    var z = spec && spec.zoom; if (!z || !ZOOM[z.parts]) return '';
    var q = spec.quad.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var wall = z.parts === 'notif' && spec.wall ? 'background-image:url(' + esc(spec.wall) + ');' : '';
    return '<div class="scr-zoom" aria-hidden="true" data-quad="' + q + '" style="--zx:' + (+z.x) + ';--zy:' + (+z.y) + ';--zw:' + (+z.w) + ';--zfs:' + (+z.fs || 14) + ';">' +
      '<svg class="scr-zoom-ln" aria-hidden="true"></svg>' +
      '<div class="zoom-box su-' + (spec.theme === 'light' ? 'light' : 'dark') + ' su-v-' + spec.view + ' zp-' + z.parts + (z.focusOnly ? ' zf' : '') + '" style="' + wall + '">' + ZOOM[z.parts](spec) + '</div></div>';
  }

  /* 4점 대응 호모그래피 (src → dst), 8x8 가우스 소거 */
  function homography(src, dst) {
    var A = [], b = [], i, j, k;
    for (i = 0; i < 4; i++) {
      var x = src[i][0], y = src[i][1], u = dst[i][0], v = dst[i][1];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    for (i = 0; i < 8; i++) {
      var p = i;
      for (j = i + 1; j < 8; j++) if (Math.abs(A[j][i]) > Math.abs(A[p][i])) p = j;
      var t = A[i]; A[i] = A[p]; A[p] = t; t = b[i]; b[i] = b[p]; b[p] = t;
      for (j = i + 1; j < 8; j++) {
        var f = A[j][i] / A[i][i];
        for (k = i; k < 8; k++) A[j][k] -= f * A[i][k];
        b[j] -= f * b[i];
      }
    }
    var h = new Array(8);
    for (i = 7; i >= 0; i--) {
      var s = b[i];
      for (j = i + 1; j < 8; j++) s -= A[i][j] * h[j];
      h[i] = s / A[i][i];
    }
    return h;
  }

  function fit(scr) {
    var art = scr.parentNode, w = art.clientWidth, h = art.clientHeight;
    if (!w || !h) return;
    var ui = scr.firstChild, asp = parseFloat(scr.getAttribute('data-aspect')) || 2;
    var H0 = Math.round(BW * asp);
    var q = scr.getAttribute('data-quad').split(' ').map(function (s) { var a = s.split(','); return [parseFloat(a[0]) * w, parseFloat(a[1]) * h]; });
    var m = homography([[0, 0], [BW, 0], [BW, H0], [0, H0]], q);
    ui.style.width = BW + 'px'; ui.style.height = H0 + 'px';
    ui.style.transform = 'matrix3d(' + [m[0], m[3], 0, m[6], m[1], m[4], 0, m[7], 0, 0, 1, 0, m[2], m[5], 0, 1].join(',') + ')';
    scr.classList.add('is-fit');
  }

  /* 확대 인셋의 연결선: 실제 폰 화면 테두리(quad)를 두르고, 인셋 상자에서 가장 가까운 모서리로 가는 선을 긋는다 */
  function fitZoom(zw) {
    var panel = zw.parentNode, w = panel.clientWidth, h = panel.clientHeight;
    if (!w || !h) return;
    var box = zw.querySelector('.zoom-box'), svg = zw.querySelector('svg');
    var q = zw.getAttribute('data-quad').split(' ').map(function (s) { var a = s.split(','); return [parseFloat(a[0]) * w, parseFloat(a[1]) * h]; });
    var bx = box.offsetLeft, by = box.offsetTop, bw = box.offsetWidth, bh = box.offsetHeight, best = null;
    q.forEach(function (v) {
      var px = Math.max(bx, Math.min(bx + bw, v[0])), py = Math.max(by, Math.min(by + bh, v[1])), d = Math.hypot(v[0] - px, v[1] - py);
      if (!best || d < best.d) best = { d: d, v: v, p: [px, py] };
    });
    var u = Math.max(1, w / 360), pts = q.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = '<polygon points="' + pts + '" fill="none" stroke="rgba(246,248,252,.88)" stroke-width="' + (1.4 * u).toFixed(2) + '" stroke-linejoin="round"/>' +
      '<line x1="' + best.p[0].toFixed(1) + '" y1="' + best.p[1].toFixed(1) + '" x2="' + best.v[0].toFixed(1) + '" y2="' + best.v[1].toFixed(1) + '" stroke="rgba(246,248,252,.8)" stroke-width="' + (1.1 * u).toFixed(2) + '" stroke-linecap="round"/>' +
      '<circle cx="' + best.v[0].toFixed(1) + '" cy="' + best.v[1].toFixed(1) + '" r="' + (2.2 * u).toFixed(2) + '" fill="rgba(246,248,252,.95)"/>';
    zw.classList.add('is-fit');
  }

  var ro = null;
  function fitAll(root) {
    var r = root || document, list = r.querySelectorAll('.scr'), zl = r.querySelectorAll('.scr-zoom');
    if (!list.length && !zl.length) return;
    if (window.ResizeObserver && !ro) ro = new ResizeObserver(function (es) { es.forEach(function (e) {
      Array.prototype.forEach.call(e.target.querySelectorAll(':scope > .scr'), fit);
      var z = e.target.querySelector('.scr-zoom'); if (z) fitZoom(z);
    }); });
    Array.prototype.forEach.call(list, function (scr) { fit(scr); if (ro) ro.observe(scr.parentNode); });
    Array.prototype.forEach.call(zl, function (z) { fitZoom(z); if (ro) ro.observe(z.parentNode); });
  }
  if (!window.ResizeObserver) window.addEventListener('resize', function () { fitAll(document); });

  W.screenUi = { build: build, buildZoom: buildZoom, fitAll: fitAll, _homography: homography };
})();
