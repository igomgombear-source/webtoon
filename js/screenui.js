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
    /* U05 — 연락처 '권해인 쌤' (통화 버튼 누르기 전) */
    contacts: function (s) {
      return status(s.clock) + '<div class="su-contact"><span class="su-bigav" aria-hidden="true"></span><p class="su-cname">' + esc(s.name) + '</p>' +
        '<div class="su-acts"><span class="act call"><i></i>통화</span><span class="act msg"><i></i>문자</span></div></div>';
    },
    /* U07 — 잠금화면 + 알림 목록 */
    lock: function (s) {
      return status('') + '<div class="su-lock"><p class="su-date">' + esc(s.date) + '</p><p class="su-lt">' + esc(s.clock) + '</p></div>' +
        '<div class="su-notifs">' + (s.items || []).map(function (n) {
          return '<div class="su-notif"><div class="su-b-top"><span class="su-app msg" aria-hidden="true"></span><span class="su-b-app">' + esc(n.app) + '</span><span class="su-b-time">' + esc(n.time) + '</span></div>' +
            '<p class="su-b-l1">' + esc(n.from) + '</p><p class="su-b-l2 wrap">' + esc(n.body) + '</p></div>';
        }).join('') + '</div>';
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

  function build(spec) {
    var fn = VIEWS[spec.view]; if (!fn) return '';
    var q = spec.quad.map(function (p) { return p[0] + ',' + p[1]; }).join(' ');
    var poly = spec.clip.map(function (p) { return p[0] + '% ' + p[1] + '%'; }).join(',');
    var wall = spec.wall ? 'background-image:url(' + esc(spec.wall) + ');' : '';
    return '<div class="scr" role="img" aria-label="' + esc(label(spec)) + '" data-quad="' + q + '" data-aspect="' + spec.aspect + '" style="clip-path:polygon(' + poly + ');">' +
      '<div class="scr-ui su-' + (spec.theme === 'light' ? 'light' : 'dark') + ' su-v-' + spec.view + (spec.tint ? ' is-tint' : '') + '" style="font-size:' + (spec.fs || 18) + 'px;' + wall + '" aria-hidden="true">' + fn(spec) + '</div></div>';
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

  var ro = null;
  function fitAll(root) {
    var list = (root || document).querySelectorAll('.scr');
    if (!list.length) return;
    if (window.ResizeObserver && !ro) ro = new ResizeObserver(function (es) { es.forEach(function (e) { var s = e.target.querySelector('.scr'); if (s) fit(s); }); });
    Array.prototype.forEach.call(list, function (scr) { fit(scr); if (ro) ro.observe(scr.parentNode); });
  }
  if (!window.ResizeObserver) window.addEventListener('resize', function () { fitAll(document); });

  W.screenUi = { build: build, fitAll: fitAll, _homography: homography };
})();
