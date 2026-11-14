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
    /* U05 — 연락처 '권해인 쌤' (통화 버튼 누르기 전) */
    contacts: function (s) {
      return status(s.clock) + '<div class="su-contact"><span class="su-bigav" aria-hidden="true"></span><p class="su-cname">' + esc(s.name) + '</p>' +
        '<div class="su-acts"><span class="act call"><i></i>통화</span><span class="act msg"><i></i>문자</span></div></div>';
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
    /* 52 — 화면 꺼짐(옆 버튼을 누른 뒤): 검은 유리 */
    off: function () { return '<div class="su-offglass"></div>'; },
    /* U13 — 수신: 미저장 번호 + 발신자 정보 */
    incoming: function (s) {
      return status(s.clock) + '<div class="su-call"><p class="su-cl">' + esc(s.label) + '</p><p class="su-num">' + esc(s.number).replace(/○/g, '<i class="m"></i>') + '</p><p class="su-info">' + esc(s.info) + '</p></div>' +
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
    return '<div class="scr" role="img" aria-label="' + esc(label(spec)) + '" data-quad="' + q + '" data-aspect="' + spec.aspect + '" style="clip-path:polygon(' + poly + ');">' +
      '<div class="scr-ui su-' + (spec.theme === 'light' ? 'light' : 'dark') + ' su-v-' + spec.view + (spec.tint ? ' is-tint' : '') + '" style="font-size:' + (spec.fs || 18) + 'px;' + wall + '" aria-hidden="true">' + fn(spec) + '</div></div>';
  }

  /* 확대 인셋(zoom) — 원화 속 작은 휴대폰 화면의 글자를 읽을 수 있게, 같은 UI 를 평면(원근 없이)으로 크게 다시 그려
   * 컷 위(마스크 밖 층, .panel 직속)에 얹는다. 원화는 수정하지 않고, 실제 폰 화면 테두리와 가는 선으로 이어 '확대'임을 보인다.
   *   spec.zoom = { x, y, w (패널 폭·높이에 대한 %, x 가 음수면 왼쪽 여백으로 나옴), fs (인셋 기준 글자 크기, 폭 360 기준 px),
   *                 parts: 'notif'(알림 카드) | 'thread'(문자 스레드, count 개 말풍선) }
   *   글자 크기·테두리는 --u(폭/360) 단위라 폭이 달라져도 비율이 같다. 읽기 프로그램에는 .scr 의 aria-label 이 있으므로 인셋은 aria-hidden. */
  var ZOOM = {
    notif: function (s) { return '<div class="su-notifs">' + (s.items || []).map(notifCard).join('') + '</div>'; },
    thread: function (s) {
      var m = (s.messages || []).slice(0, (s.zoom && s.zoom.count) || 1);
      return head(s.contact) + '<div class="su-thread">' + m.map(function (x) { return bubble(x, s); }).join('') + '</div>';
    }
  };
  function buildZoom(spec) {
    var z = spec && spec.zoom; if (!z || !ZOOM[z.parts]) return '';
    var q = spec.quad.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var wall = z.parts === 'notif' && spec.wall ? 'background-image:url(' + esc(spec.wall) + ');' : '';
    return '<div class="scr-zoom" aria-hidden="true" data-quad="' + q + '" style="--zx:' + (+z.x) + ';--zy:' + (+z.y) + ';--zw:' + (+z.w) + ';--zfs:' + (+z.fs || 14) + ';">' +
      '<svg class="scr-zoom-ln" aria-hidden="true"></svg>' +
      '<div class="zoom-box su-' + (spec.theme === 'light' ? 'light' : 'dark') + ' su-v-' + spec.view + ' zp-' + z.parts + '" style="' + wall + '">' + ZOOM[z.parts](spec) + '</div></div>';
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
