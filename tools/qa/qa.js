/* 1화 자동 검수 — tools/qa/qa.html 에서 실행한다. 그림·컷 데이터는 읽기만 하고 고치지 않는다.
 *
 * 검사 묶음
 *   data    컷 수·번호 순서, 대사·날짜·시간·장면 같은 이야기 필드를 기준 파일(ep01.baseline.json)과 비교,
 *           main 브랜치 데이터(run.ps1 이 out/ 에 꺼내 둔 경우)와도 비교
 *   refs    컷이 부르는 모든 그림(완성 컷, 배경, 인물 레이어 '@이름', 소품, SVG)의 존재·대소문자·형식·크기,
 *           인물 목록(data/characters.js) 이름 오류, 목록 크기와 실제 크기 불일치, 쓰지 않는 항목
 *   alpha   투명 배경 그림(인물·소품 레이어)의 알파 문제: 투명 배경 없음, 몸이 비치는 반투명,
 *           색 테두리(청록·빨강), 밝은 테두리(흰 배경 잔여), 떨어진 점, 그림 가장자리에 잘린 몸
 *   viewer  실제 뷰어(index.html)를 여러 휴대폰 폭으로 띄워 가로 넘침, 깨진 그림, 빠진 레이어,
 *           "그림 준비 중" 컷, 지연 로딩(첫 화면에서 먼 그림을 미리 받지 않는지)
 *
 * 등급  fail = 고쳐야 함 · warn = 사람이 확인 · info = 참고
 */
(function () {
  'use strict';
  var W = window.WEBTOON, ROOT = '../../';
  var Q = new URLSearchParams(location.search);
  var EP = Q.get('ep') || 'ep01';
  var WIDTHS = (Q.get('widths') || '320,360,375,390,412,430,768').split(',').map(Number).filter(Boolean);
  var SKIP = (Q.get('skip') || '').split(',');
  var AUTO = Q.get('auto') === '1', BASELINE = Q.get('baseline') === '1';

  /* 이야기 필드: 바뀌면 fail. 연출 필드: 바뀌면 warn. 그림 필드(image, imageSize, compose)는 비교하지 않는다 */
  var STORY = ['no', 'type', 'scene', 'datetime', 'lines', 'phone', 'text', 'desc'];
  var DIRECTION = ['kind', 'ratio', 'mood', 'transition', 'spacing', 'tone'];
  var EP_STORY = ['id', 'no', 'title', 'speakers', 'showSpeakerNames'];
  var EP_DIRECTION = ['endSpacing', 'imageBase', 'useExportedCuts'];

  var report = { ep: EP, startedAt: new Date().toISOString(), sections: [] };
  var cur = null;
  function section(name) { cur = { name: name, items: [] }; report.sections.push(cur); }
  function add(level, where, msg) { cur.items.push({ level: level, where: where, msg: msg }); }
  function status(t) { document.getElementById('status').textContent = t; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function loadScript(src) {
    return new Promise(function (ok) {
      var s = document.createElement('script'); s.src = src;
      s.onload = function () { ok(true); }; s.onerror = function () { ok(false); };
      document.head.appendChild(s);
    });
  }
  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function loadImg(src) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { ok(im); }; im.onerror = function () { ok(null); };
      im.src = src;
    });
  }

  /* ---------- 공통: 데이터 비교 ---------- */
  function pick(obj, keys) {
    var o = {}; keys.forEach(function (k) { if (obj[k] !== undefined) o[k] = obj[k]; }); return o;
  }
  function storyOf(ep) {
    return {
      episode: pick(ep, EP_STORY), episodeDirection: pick(ep, EP_DIRECTION),
      cuts: ep.cuts.map(function (c) { return { story: pick(c, STORY), direction: pick(c, DIRECTION) }; })
    };
  }
  /* 두 값을 끝까지 펼쳐 다른 경로를 돌려준다. fields 는 비교한 잎 개수 */
  function diff(a, b, path, out, cnt) {
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      var keys = {}; Object.keys(a).forEach(function (k) { keys[k] = 1; }); Object.keys(b).forEach(function (k) { keys[k] = 1; });
      Object.keys(keys).forEach(function (k) { diff(a[k], b[k], path + (Array.isArray(a) ? '[' + k + ']' : '.' + k), out, cnt); });
      return;
    }
    cnt.n++;
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path: path, was: a, now: b });
  }
  function short(v) { var s = JSON.stringify(v); return s === undefined ? '(없음)' : s.length > 80 ? s.slice(0, 77) + '…' : s; }
  function compareStory(base, now, label, summarizeDirection) {
    var cnt = { n: 0 }, d1 = [], d2 = [];
    diff(base.episode, now.episode, 'episode', d1, cnt);
    diff(base.episodeDirection, now.episodeDirection, 'episode', d2, cnt);
    var n = Math.max(base.cuts.length, now.cuts.length);
    for (var i = 0; i < n; i++) {
      var b = base.cuts[i] || { story: {}, direction: {} }, c = now.cuts[i] || { story: {}, direction: {} };
      var no = (c.story.no || b.story.no || (i + 1));
      diff(b.story, c.story, '컷' + pad(no), d1, cnt);
      diff(b.direction, c.direction, '컷' + pad(no), d2, cnt);
    }
    if (!d1.length) add('ok', label, '이야기 필드 ' + cnt.n + '개 중 다른 곳 없음 (대사·날짜·시간·장면·컷 순서·휴대폰 화면)');
    d1.forEach(function (d) { add('fail', label, d.path + ' : ' + short(d.was) + ' → ' + short(d.now)); });
    if (summarizeDirection && d2.length) {
      var by = {}; d2.forEach(function (d) { var k = d.path.split('.')[1] || d.path; by[k] = (by[k] || 0) + 1; });
      add('warn', label + ' 연출', '연출 필드 ' + d2.length + '곳이 다름 (' + Object.keys(by).map(function (k) { return k + ' ' + by[k]; }).join(', ') + ') — 목록은 report.json 의 ' + (label === 'main 원본' ? 'main' : 'baseline') + '.directionDiffs');
    } else d2.forEach(function (d) { add('warn', label + ' 연출', d.path + ' : ' + short(d.was) + ' → ' + short(d.now)); });
    return { fields: cnt.n, story: d1.length, direction: d2.length, storyDiffs: d1, directionDiffs: d2 };
  }

  /* ---------- data ---------- */
  async function checkData(ep) {
    section('data · 컷 순서와 이야기 필드');
    var nos = ep.cuts.map(function (c) { return c.no; });
    var bad = nos.filter(function (n, i) { return n !== i + 1; });
    if (ep.cuts.length !== 70) add('fail', '컷 수', ep.cuts.length + '컷 (70컷이어야 함)');
    else add('ok', '컷 수', '70컷');
    if (bad.length) add('fail', '컷 번호', '1부터 차례대로가 아님: ' + nos.join(','));
    else add('ok', '컷 번호', '1~' + nos.length + ' 차례대로');
    var kinds = {}; ep.cuts.forEach(function (c) { var k = c.kind || '(없음)'; kinds[k] = (kinds[k] || 0) + 1; });
    add('info', '분류', Object.keys(kinds).map(function (k) { return k + ' ' + kinds[k]; }).join(' / '));
    ep.cuts.forEach(function (c) {
      if (c.type === 'panel' && !c.image && !c.compose) add('warn', '컷' + pad(c.no), '그림 컷인데 image·compose 가 모두 없음 ("그림 준비 중"으로 표시)');
      if (c.image && c.compose) add('info', '컷' + pad(c.no), 'image 와 compose 가 둘 다 있음 — image 가 우선');
      (c.lines || []).forEach(function (l, i) {
        if (!l.text || !String(l.text).trim()) add('fail', '컷' + pad(c.no), '대사 ' + (i + 1) + ' 의 text 가 비었음');
        if (l.who && ep.speakers && !ep.speakers[l.who]) add('warn', '컷' + pad(c.no), '화자 "' + l.who + '" 가 speakers 목록에 없음');
      });
    });

    var now = storyOf(ep);
    report.storySnapshot = now;
    var base = await getJSON('ep01.baseline.json'.replace('ep01', EP));
    if (!base) add('warn', '기준 파일', 'tools/qa/' + EP + '.baseline.json 이 없음 — run.ps1 -UpdateBaseline 으로 만든다');
    else report.baseline = compareStory(base, now, '기준 파일');

    /* main 브랜치 데이터 (run.ps1 이 git show 로 out/<ep>.main.js 에 꺼내 둔다) */
    var saved = W.episodeData[EP];
    delete W.episodeData[EP];
    var okMain = await loadScript('out/' + EP + '.main.js');
    var main = W.episodeData[EP];
    W.episodeData[EP] = saved;
    if (okMain && main && main !== saved) report.main = compareStory(storyOf(main), now, 'main 원본', true);
    else add('info', 'main 원본', '비교 안 함 (out/' + EP + '.main.js 없음 — run.ps1 로 실행하면 자동 비교)');
  }

  /* ---------- refs ---------- */
  var SIG = { webp: function (b) { return b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 && b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80; },
    png: function (b) { return b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71; },
    jpg: function (b) { return b[0] === 255 && b[1] === 216; },
    svg: function (b) { var s = String.fromCharCode.apply(null, b).replace(/^﻿/, '').trim(); return s[0] === '<'; } };
  SIG.jpeg = SIG.jpg;

  function collectRefs(ep) {
    var refs = [];   /* { cut, role, src(데이터에 적힌 값), path(실제 경로), alias } */
    ep.cuts.forEach(function (c) {
      if (c.image) refs.push({ cut: c.no, role: '완성 컷', src: c.image, path: W.compose.resolve(c.image, ep.imageBase), size: c.imageSize });
      var m = c.compose; if (!m) return;
      if (m.bg) refs.push({ cut: c.no, role: '배경', src: m.bg, path: W.compose.resolve(m.bg, ep.imageBase) });
      if (m.export) refs.push({ cut: c.no, role: '내보낸 컷', src: m.export, path: W.compose.resolve(m.export, ep.imageBase), optional: !ep.useExportedCuts });
      (m.layers || []).forEach(function (l, i) {
        var alias = l.src && l.src.charAt(0) === '@' ? l.src.slice(1) : null;
        refs.push({ cut: c.no, role: '레이어' + (i + 1), src: l.src, alias: alias, path: alias ? (W.characters[alias] || {}).src : W.compose.resolve(l.src, ep.imageBase), layer: l });
      });
    });
    return refs;
  }

  var fileInfo = {};   /* path → { ok, w, h, bytes, fmt, img } */
  async function inspectFile(path) {
    if (fileInfo[path]) return fileInfo[path];
    var info = { path: path };
    try {
      var r = await fetch(ROOT + path, { cache: 'no-store' });
      info.http = r.status;
      if (r.ok) {
        var buf = new Uint8Array(await r.arrayBuffer()); info.bytes = buf.length;
        var ext = (path.split('.').pop() || '').toLowerCase(), head = Array.prototype.slice.call(buf, 0, 32);
        info.ext = ext; info.fmtOk = SIG[ext] ? SIG[ext](head) : null;
        info.fmt = SIG.webp(head) ? 'webp' : SIG.png(head) ? 'png' : SIG.jpg(head) ? 'jpg' : SIG.svg(head) ? 'svg' : '?';
        if (info.fmt === 'webp') {   /* WebP 안의 알파 유무 (VP8X 플래그 또는 VP8L) */
          var tag = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
          info.webpKind = tag.trim(); info.webpAlpha = tag === 'VP8X' ? !!(buf[20] & 16) : tag === 'VP8L' ? !!(buf[24] & 16) : false;
        }
      }
    } catch (e) { info.http = 'error'; }
    if (info.http === 200) {
      var im = await loadImg(ROOT + path);
      if (im) { info.img = im; info.w = im.naturalWidth; info.h = im.naturalHeight; }
    }
    fileInfo[path] = info;
    return info;
  }

  async function checkRefs(ep, manifest) {
    section('refs · 그림 파일과 인물 레이어 경로');
    var refs = collectRefs(ep), chars = W.characters || {};
    var tracked = {}, lower = {}, untracked = {};
    if (manifest) {
      manifest.tracked.forEach(function (p) { tracked[p] = 1; lower[p.toLowerCase()] = p; });
      (manifest.untracked || []).forEach(function (p) { untracked[p] = 1; lower[p.toLowerCase()] = lower[p.toLowerCase()] || p; });
    } else add('warn', '파일 목록', 'out/manifest.json 이 없어 대소문자·커밋 여부 검사를 못 함 (run.ps1 로 실행하면 자동 생성)');

    var bad = 0, seen = {};
    for (var i = 0; i < refs.length; i++) {
      var r = refs[i], where = '컷' + pad(r.cut) + ' ' + r.role;
      status('그림 확인 ' + (i + 1) + '/' + refs.length);
      if (r.alias && !chars[r.alias]) { add('fail', where, '인물 목록에 없는 이름 "@' + r.alias + '" (data/characters.js)'); bad++; continue; }
      if (!r.path) { add('fail', where, '경로가 비었음'); bad++; continue; }
      if (/^(https?:|data:|blob:)/.test(r.path)) { add('warn', where, '외부 주소 그림: ' + r.path); continue; }
      if (/\\/.test(r.path) || /^\//.test(r.path)) add('warn', where, '경로에 역슬래시나 맨 앞 / 가 있음: ' + r.path);
      if (manifest) {
        if (!tracked[r.path]) {
          if (untracked[r.path]) add('warn', where, '파일이 있지만 아직 git 에 커밋되지 않음: ' + r.path);
          else if (lower[r.path.toLowerCase()]) { add('fail', where, '대소문자가 다름 (GitHub Pages 에서 깨짐): ' + r.path + ' ↔ ' + lower[r.path.toLowerCase()]); bad++; }
          else if (!r.optional) { add('fail', where, '저장소에 없는 파일: ' + r.path); bad++; continue; }
        }
      }
      var f = await inspectFile(r.path);
      if (f.http !== 200) { if (!r.optional) { add('fail', where, '불러오기 실패 (HTTP ' + f.http + '): ' + r.path); bad++; } continue; }
      if (f.fmtOk === false) { add('fail', where, '확장자(.' + f.ext + ')와 실제 형식(' + f.fmt + ')이 다름: ' + r.path); bad++; }
      if (!f.img) { add('fail', where, '그림으로 열 수 없음 (깨진 파일): ' + r.path); bad++; continue; }
      if (r.size && r.size.w && Math.abs(r.size.w / r.size.h - f.w / f.h) > 0.01)
        add('warn', where, 'imageSize ' + r.size.w + '×' + r.size.h + ' 와 실제 ' + f.w + '×' + f.h + ' 비율이 다름 (컷 높이가 로딩 후 바뀜)');
      if (r.alias) {
        var e = chars[r.alias];
        if (e.size && (e.size.w !== f.w || e.size.h !== f.h)) add('warn', where, '"@' + r.alias + '" 목록 크기 ' + e.size.w + '×' + e.size.h + ' 와 실제 ' + f.w + '×' + f.h + ' 가 다름 — 좌표 재확인');
        if (e.status === 'replace' || e.status === 'temporary') seen[r.alias + '|' + e.status] = (seen[r.alias + '|' + e.status] || []).concat(r.cut);
      }
      /* 인물·소품 레이어인데 투명 배경이 없는 파일 (배경이 붙은 그림을 레이어로 쓴 경우) */
      if (r.layer && f.fmt !== 'svg' && /^assets\/(characters|props)\//.test(r.path) && f.fmt === 'webp' && !f.webpAlpha)
        { add('fail', where, '인물·소품 레이어인데 알파(투명) 채널이 없는 WebP: ' + r.path); bad++; }
    }
    if (!bad) add('ok', '참조', '그림 참조 ' + refs.length + '개 (파일 ' + Object.keys(fileInfo).length + '개) 모두 정상');
    Object.keys(seen).forEach(function (k) {
      var p = k.split('|'); add('info', '@' + p[0], (p[1] === 'replace' ? '교체 필요' : '임시 디자인') + ' 그림을 쓰는 컷: ' + seen[k].map(pad).join('·'));
    });

    /* 인물 목록 자체 검사 */
    var used = {}; refs.forEach(function (r) { if (r.alias) used[r.alias] = 1; });
    var keys = Object.keys(chars);
    for (var k = 0; k < keys.length; k++) {
      var name = keys[k], e2 = chars[name];
      if (!e2.src) { add('fail', '@' + name, 'src 가 없음'); continue; }
      if (manifest && !tracked[e2.src] && !untracked[e2.src]) { add(used[name] ? 'fail' : 'warn', '@' + name, '목록의 파일이 저장소에 없음: ' + e2.src); continue; }
      if (!used[name]) add('info', '@' + name, '1화에서 쓰지 않는 항목');
      if (!used[name] && e2.size) {
        var g = await inspectFile(e2.src);
        if (g.img && (g.w !== e2.size.w || g.h !== e2.size.h)) add('warn', '@' + name, '목록 크기 ' + e2.size.w + '×' + e2.size.h + ' 와 실제 ' + g.w + '×' + g.h + ' 가 다름');
      }
    }
    /* 공식 설정(data/cast.js)과 그림 항목 비교: 지금은 안경 유무 */
    var cast = W.cast || {}, byAlias = {};
    refs.forEach(function (r) { if (r.alias) (byAlias[r.alias] = byAlias[r.alias] || []).indexOf(r.cut) < 0 && byAlias[r.alias].push(r.cut); });
    if (!W.cast) add('warn', '공식 설정', 'data/cast.js 를 불러오지 못해 공식 설정 비교를 못 함');
    Object.keys(byAlias).forEach(function (alias) {
      var who = cast[alias.split('/')[0]], e3 = chars[alias] || {}, cutsTxt = byAlias[alias].map(pad).join('·');
      if (!who || who.glasses === undefined) return;
      if (/^haein\/hand-|\/hand-/.test(alias)) return;   /* 손만 나오는 그림 */
      if (who.glasses === true && e3.glasses !== true)
        add('warn', '@' + alias, who.name + ' 공식 설정은 안경 착용인데 ' + (e3.glasses === false ? '이 그림은 안경 없음' : '그림의 안경 여부가 목록에 없음') + ' (컷 ' + cutsTxt + ')');
      if (who.glasses === false && e3.glasses === true)
        add('warn', '@' + alias, who.name + ' 공식 설정은 안경 없음인데 이 그림은 안경을 씀 (컷 ' + cutsTxt + ')');
    });
    report.refs = refs.map(function (r) { return { cut: r.cut, role: r.role, src: r.src, path: r.path }; });
  }

  /* ---------- alpha ---------- */
  function analyzeAlpha(im) {
    var Wd = im.naturalWidth, H = im.naturalHeight, N = Wd * H;
    var cv = document.createElement('canvas'); cv.width = Wd; cv.height = H;
    var g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    var d = g.getImageData(0, 0, Wd, H).data, A = new Uint8Array(N), i, x, y;
    for (i = 0; i < N; i++) A[i] = d[i * 4 + 3];
    var r = { w: Wd, h: H, transparent: 0, haze: 0, hazeColor: 0, body: 0, seeThrough: 0, colorEdge: 0, brightEdge: 0, specks: 0, speckPx: 0, edgeTouch: [], edge: 0 };
    /* 가장자리 거리: 투명(a<=16)에서 3px 이내면 외곽 */
    var near = new Uint8Array(N);
    for (y = 0; y < H; y++) for (x = 0; x < Wd; x++) {
      if (A[y * Wd + x] > 16) continue;
      for (var dy = -3; dy <= 3; dy++) { var yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (var dx = -3; dx <= 3; dx++) { var xx = x + dx; if (xx >= 0 && xx < Wd) near[yy * Wd + xx] = 1; } }
    }
    function cls(p) { var R = d[p * 4], G = d[p * 4 + 1], B = d[p * 4 + 2];
      if ((G + B) / 2 - R > 70 && Math.min(G, B) > R + 40) return 1;   /* 청록 */
      if (R - Math.max(G, B) > 90) return 2;                           /* 빨강 */
      return 0; }
    function lum(p) { return 0.299 * d[p * 4] + 0.587 * d[p * 4 + 1] + 0.114 * d[p * 4 + 2]; }
    for (i = 0; i < N; i++) {
      var a = A[i];
      if (a === 0) { r.transparent++; continue; }
      if (a <= 16) { r.haze++; r.transparent++; if (cls(i)) r.hazeColor++; continue; }
      if (!near[i]) { r.body++; if (a < 230) r.seeThrough++; continue; }
      if (a >= 250) continue;
      r.edge++;
      /* 외곽 반투명 픽셀: 안쪽(4~6px) 불투명 그림과 색 계열·밝기가 크게 다르면 테두리 */
      x = i % Wd; y = (i - x) / Wd;
      var c = cls(i), sl = 0, sn = 0, same = 0;
      for (var oy = -6; oy <= 6; oy += 2) for (var ox = -6; ox <= 6; ox += 2) {
        var qx = x + ox, qy = y + oy; if (qx < 0 || qy < 0 || qx >= Wd || qy >= H) continue;
        var q = qy * Wd + qx; if (A[q] < 250 || near[q]) continue;
        sn++; sl += lum(q); if (c && cls(q) === c) same++;
      }
      if (!sn) continue;
      if (c && same / sn < 0.25) r.colorEdge++;
      if (lum(i) > 200 && lum(i) - sl / sn > 80) r.brightEdge++;
    }
    /* 떨어진 점: a>16 연결 덩어리 중 가장 큰 덩어리의 0.05% 미만 */
    var lab = new Int32Array(N), sizes = [], st = [];
    for (i = 0; i < N; i++) {
      if (A[i] <= 16 || lab[i]) continue;
      var id = sizes.length + 1, n = 0; lab[i] = id; st.push(i);
      while (st.length) { var u = st.pop(); n++; var ux = u % Wd, uy = (u - ux) / Wd;
        for (var ny = -1; ny <= 1; ny++) for (var nx = -1; nx <= 1; nx++) {
          var vx = ux + nx, vy = uy + ny; if (vx < 0 || vy < 0 || vx >= Wd || vy >= H) continue;
          var v = vy * Wd + vx; if (A[v] > 16 && !lab[v]) { lab[v] = id; st.push(v); } } }
      sizes.push(n);
    }
    var big = Math.max.apply(null, sizes.concat([0]));
    sizes.forEach(function (s) { if (s < big * 0.0005) { r.specks++; r.speckPx += s; } });
    r.parts = sizes.filter(function (s) { return s >= big * 0.0005; }).length;
    /* 그림 가장자리에 닿은 몸 (잘린 인물) */
    var sides = { 위: 0, 아래: 0, 왼쪽: 0, 오른쪽: 0 };
    for (x = 0; x < Wd; x++) { if (A[x] > 128) sides.위++; if (A[(H - 1) * Wd + x] > 128) sides.아래++; }
    for (y = 0; y < H; y++) { if (A[y * Wd] > 128) sides.왼쪽++; if (A[y * Wd + Wd - 1] > 128) sides.오른쪽++; }
    Object.keys(sides).forEach(function (s) { var len = (s === '위' || s === '아래') ? Wd : H; if (sides[s] > len * 0.02) r.edgeTouch.push(s); });
    r.transparentPct = r.transparent / N * 100;
    r.seeThroughPct = r.body ? r.seeThrough / r.body * 100 : 0;
    return r;
  }

  async function checkAlpha(ep) {
    section('alpha · 투명 배경 그림');
    var refs = collectRefs(ep), targets = {};
    refs.forEach(function (r) {
      if (!r.layer || !r.path || !/\.(png|webp)$/i.test(r.path)) return;
      if (!/^assets\/(characters|props)\//.test(r.path)) return;     /* 배경을 레이어로 쓴 경우는 제외 */
      var t = (targets[r.path] = targets[r.path] || []); if (t.indexOf(r.cut) < 0) t.push(r.cut);
    });
    var paths = Object.keys(targets), rows = [];
    for (var i = 0; i < paths.length; i++) {
      var p = paths[i], cuts = targets[p].map(pad).join('·'), where = p.replace(/^assets\//, '');
      status('알파 검사 ' + (i + 1) + '/' + paths.length + ' ' + where);
      var f = await inspectFile(p);
      if (!f.img) continue;   /* refs 에서 이미 fail */
      var a = analyzeAlpha(f.img); a.path = p; a.cuts = cuts; rows.push(a);
      var tag = where + ' (컷 ' + cuts + ')';
      if (a.transparentPct < 1) { add('fail', '투명 없음', tag + ' — 투명한 부분이 ' + a.transparentPct.toFixed(2) + '% 뿐 (배경이 붙은 그림)'); continue; }
      var isChar = /^assets\/characters\//.test(p);
      /* 인물 몸이 비치면 실패. 소품은 유리·그림자처럼 일부러 반투명일 수 있어 확인으로 */
      if (a.seeThroughPct > 2) add(isChar ? 'fail' : 'warn', '몸이 비침', tag + ' — 안쪽 ' + a.seeThroughPct.toFixed(1) + '% 가 불투명도 90% 미만 (뒤 배경이 비쳐 보임' + (isChar ? ')' : ' — 유리·그림자처럼 의도한 반투명이면 정상)'));
      if (a.colorEdge > 40) add('warn', '색 테두리', tag + ' — 외곽에 주변과 다른 청록·빨강 픽셀 ' + a.colorEdge + '개');
      if (a.brightEdge > 200 && a.brightEdge > a.edge * 0.02) add('warn', '밝은 테두리', tag + ' — 외곽 반투명 픽셀의 ' + (a.brightEdge / a.edge * 100).toFixed(1) + '% (' + a.brightEdge + '개)가 안쪽보다 훨씬 밝음 (흰 배경 잔여 의심)');
      if (a.specks > 20) add('warn', '떨어진 점', tag + ' — 몸에서 떨어진 작은 점 ' + a.specks + '개 (' + a.speckPx + 'px)');
      if (a.parts > 1) add('info', '덩어리', tag + ' — 큰 덩어리가 ' + a.parts + '개로 나뉨 (여러 인물·소품이면 정상)');
      if (a.edgeTouch.length) add('info', '잘린 몸', tag + ' — 그림 ' + a.edgeTouch.join('·') + ' 가장자리에 몸이 닿음 (상반신·손 클로즈업이면 정상, 아니면 원본이 잘림)');
      if (a.hazeColor > 1500) add('info', '옅은 색 픽셀', tag + ' — 불투명도 6% 이하 청록·빨강 픽셀 ' + a.hazeColor + '개 (화면에서는 거의 안 보임)');
    }
    var problems = cur.items.filter(function (it) { return it.level === 'fail' || it.level === 'warn'; }).length;
    if (!problems) add('ok', '알파', '투명 그림 ' + rows.length + '개 — 투명 없음·비침·색 테두리·밝은 테두리·떨어진 점 문제 없음');
    report.alpha = rows.map(function (a) { return { path: a.path, cuts: a.cuts, w: a.w, h: a.h, transparentPct: +a.transparentPct.toFixed(2),
      seeThroughPct: +a.seeThroughPct.toFixed(2), colorEdge: a.colorEdge, brightEdge: a.brightEdge, hazeColor: a.hazeColor, specks: a.specks, parts: a.parts, edgeTouch: a.edgeTouch }; });
  }

  /* ---------- selftest: 일부러 망가뜨린 가짜 그림으로 알파 검사가 문제를 잡는지 확인 ---------- */
  async function sprite(draw) {
    var c = document.createElement('canvas'); c.width = 240; c.height = 240;
    var g = c.getContext('2d'); draw(g);
    return loadImg(c.toDataURL('image/png'));
  }
  function disc(g, fill, r) { g.fillStyle = fill; g.beginPath(); g.arc(120, 120, r || 80, 0, Math.PI * 2); g.fill(); }
  function ring(g, color, w) { g.strokeStyle = color; g.lineWidth = w; g.beginPath(); g.arc(120, 120, 80 + w / 2, 0, Math.PI * 2); g.stroke(); }
  async function checkSelf() {
    section('selftest · 알파 검사 자체 점검');
    var cases = [
      ['깨끗한 그림', function (g) { disc(g, '#444'); }, function (a) { return a.transparentPct > 1 && a.seeThroughPct <= 2 && a.colorEdge <= 40 && !(a.brightEdge > 200 && a.brightEdge > a.edge * 0.02) && a.specks <= 20; }],
      ['투명 배경 없음', function (g) { g.fillStyle = '#556'; g.fillRect(0, 0, 240, 240); disc(g, '#444'); }, function (a) { return a.transparentPct < 1; }],
      ['몸이 비침', function (g) { disc(g, 'rgba(60,60,60,0.6)'); }, function (a) { return a.seeThroughPct > 2; }],
      ['청록 테두리', function (g) { disc(g, '#444'); ring(g, 'rgba(0,200,200,0.5)', 3); }, function (a) { return a.colorEdge > 40; }],
      ['붉은 테두리', function (g) { disc(g, '#444'); ring(g, 'rgba(230,20,20,0.5)', 3); }, function (a) { return a.colorEdge > 40; }],
      ['흰 테두리', function (g) { disc(g, '#333'); ring(g, 'rgba(255,255,255,0.7)', 3); }, function (a) { return a.brightEdge > 200 && a.brightEdge > a.edge * 0.02; }],
      ['떨어진 점', function (g) { disc(g, '#444'); g.fillStyle = '#0ff'; for (var i = 0; i < 30; i++) g.fillRect(5 + i * 7, 5 + (i % 3) * 4, 1, 1); }, function (a) { return a.specks > 20; }]
    ];
    var bad = 0;
    for (var i = 0; i < cases.length; i++) {
      var im = await sprite(cases[i][1]), a = analyzeAlpha(im);
      if (!cases[i][2](a)) { bad++; add('fail', cases[i][0], '검사가 예상대로 판정하지 못함: ' + JSON.stringify({ t: +a.transparentPct.toFixed(1), see: +a.seeThroughPct.toFixed(1), color: a.colorEdge, bright: a.brightEdge, edge: a.edge, specks: a.specks })); }
    }
    if (!bad) add('ok', '알파 검사', '가짜 그림 ' + cases.length + '종 모두 예상대로 판정 (깨끗함, 투명 없음, 비침, 청록·붉은·흰 테두리, 떨어진 점)');
  }

  /* ---------- viewer ---------- */
  function once(el, evs, ms) { return new Promise(function (r) { evs.forEach(function (e) { el.addEventListener(e, r); }); setTimeout(r, ms); }); }
  async function checkViewer(ep) {
    section('viewer · 휴대폰 폭 화면');
    report.viewer = [];
    for (var wi = 0; wi < WIDTHS.length; wi++) {
      var w = WIDTHS[wi], H = Math.round(w * 2.1), tag = w + 'px';
      status('화면 검사 ' + tag);
      var f = document.createElement('iframe');
      f.style.cssText = 'width:' + w + 'px;height:' + H + 'px;border:0;display:block';
      document.getElementById('frames').appendChild(f);
      f.src = ROOT + 'index.html?qa=' + Date.now() + '#' + EP;
      await once(f, ['load'], 15000);
      var win = f.contentWindow, d = f.contentDocument;
      for (var t = 0; t < 50 && !d.querySelector('section[id^=cut-]'); t++) await sleep(100);
      await sleep(800);
      /* 스크롤 막대 폭이 결과에 끼지 않게 숨김 (휴대폰과 같게) */
      var st = d.createElement('style'); st.textContent = 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}'; d.head.appendChild(st);
      var r = { width: w };
      var imgs = Array.prototype.slice.call(d.images);
      r.images = imgs.length;
      r.notLazy = imgs.filter(function (i) { return i.loading !== 'lazy'; }).map(function (i) { return i.getAttribute('src'); });
      /* 첫 화면에서 먼(화면 3개 아래) 그림을 이미 받았는지 — 지연 로딩이 실제로 동작하는지 */
      var reqd = {}; (win.performance.getEntriesByType('resource') || []).forEach(function (e) { reqd[decodeURI(e.name)] = 1; });
      r.farRequestedAtTop = imgs.filter(function (i) { return i.getBoundingClientRect().top > H * 3 && (reqd[decodeURI(i.src)] || (i.complete && i.naturalWidth)); }).length;
      /* 끝까지 스크롤하며 모든 그림 불러오기 */
      var full = d.documentElement.scrollHeight;
      for (var y = 0; y < full; y += Math.round(H * 0.8)) { win.scrollTo(0, y); await sleep(60); full = d.documentElement.scrollHeight; }
      win.scrollTo(0, full); await sleep(600);
      imgs = Array.prototype.slice.call(d.images);
      await Promise.all(imgs.map(function (i) { return i.complete ? 0 : once(i, ['load', 'error'], 15000); }));
      await sleep(300);
      imgs = Array.prototype.slice.call(d.images);   /* 실패한 레이어는 app.js 가 지움 */
      r.broken = imgs.filter(function (i) { return i.complete && !i.naturalWidth; }).map(function (i) { return i.getAttribute('src'); });
      r.pending = imgs.filter(function (i) { return !i.complete; }).length;
      r.docScrollWidth = d.documentElement.scrollWidth; r.innerWidth = win.innerWidth;
      var vw = win.innerWidth;
      r.overflow = Array.prototype.slice.call(d.querySelectorAll('body *')).filter(function (e) {
        if (e.closest('.art')) return false;   /* 그림 영역 안 레이어는 일부러 밖으로 나가고 잘린다 */
        var cs = getComputedStyle(e); if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
        var b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.right > vw + 0.5 || b.left < -0.5);
      }).slice(0, 10).map(function (e) { var b = e.getBoundingClientRect();
        return ((e.closest('section[id^=cut-]') || {}).id || '-') + ' <' + e.tagName.toLowerCase() + ' class="' + String(e.className).slice(0, 40) + '"> 왼쪽 ' + Math.round(b.left) + ' 오른쪽 ' + Math.round(b.right); });
      var cuts = Array.prototype.slice.call(d.querySelectorAll('section[id^=cut-]'));
      r.cuts = cuts.length;
      r.placeholder = cuts.filter(function (s) { var p = s.querySelector('.placeholder'); return p && getComputedStyle(p).display !== 'none'; }).map(function (s) { return +s.id.slice(4); });
      var miss = [];
      ep.cuts.forEach(function (c) {
        if (c.image || !c.compose) return;
        var want = (c.compose.layers || []).length + (c.compose.bg ? 1 : 0); if (!want) return;
        var box = d.querySelector('#cut-' + pad(c.no) + ' .art');
        var have = box ? box.querySelectorAll('.cmp-bg, .cmp-layer').length : 0;
        if (have < want) miss.push(pad(c.no) + '(' + have + '/' + want + ')');
      });
      r.missingLayers = miss;
      /* 대사 글상자가 그림 밖으로 넘치는지 (pos 로 그림 위에 겹친 대사) */
      r.lineOverflow = Array.prototype.slice.call(d.querySelectorAll('.art .line, .art [class*=bubble]')).filter(function (e) {
        var a = e.closest('.art').getBoundingClientRect(), b = e.getBoundingClientRect();
        return b.width && (b.left < a.left - 0.5 || b.right > a.right + 0.5);
      }).map(function (e) { return (e.closest('section[id^=cut-]') || {}).id; });
      report.viewer.push(r);
      f.remove();

      if (r.cuts !== ep.cuts.length) add('fail', tag, '화면에 그려진 컷 ' + r.cuts + '개 (데이터 ' + ep.cuts.length + '컷)');
      if (r.docScrollWidth > r.innerWidth) add('fail', tag, '가로 스크롤 생김: 문서 폭 ' + r.docScrollWidth + ' > 화면 ' + r.innerWidth);
      r.overflow.forEach(function (o) { add('fail', tag, '화면 밖으로 넘침: ' + o); });
      r.broken.forEach(function (s) { add('fail', tag, '깨진 그림: ' + s); });
      if (r.missingLayers.length) add('fail', tag, '빠진 레이어: ' + r.missingLayers.join(', '));
      if (r.pending) add('warn', tag, '15초 안에 다 불러오지 못한 그림 ' + r.pending + '개');
      if (r.notLazy.length) add('warn', tag, 'loading="lazy" 가 없는 그림 ' + r.notLazy.length + '개: ' + r.notLazy.slice(0, 3).join(', '));
      if (r.farRequestedAtTop) add('warn', tag, '첫 화면에서 화면 3개 이상 아래 그림 ' + r.farRequestedAtTop + '개를 미리 받음 (지연 로딩 확인)');
      if (r.lineOverflow.length) add('warn', tag, '그림 밖으로 나간 대사 상자: ' + r.lineOverflow.join(', '));
      if (r.placeholder.length) add('info', tag, '"그림 준비 중" 컷 ' + r.placeholder.length + '개: ' + r.placeholder.map(pad).join(','));
      if (!r.overflow.length && r.docScrollWidth <= r.innerWidth && !r.broken.length && !r.missingLayers.length && r.cuts === ep.cuts.length)
        add('ok', tag, r.cuts + '컷, 그림 ' + r.images + '개 — 넘침·깨짐·빠진 레이어 없음');
    }
  }

  /* ---------- 결과 ---------- */
  function render() {
    var lv = { fail: 0, warn: 0, info: 0, ok: 0 };
    report.sections.forEach(function (s) { s.items.forEach(function (it) { lv[it.level]++; }); });
    report.summary = lv;
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var name = { fail: '실패', warn: '확인', info: '참고', ok: '통과' };
    var h = '<p class="sum"><b class="fail">실패 ' + lv.fail + '</b><b class="warn">확인 ' + lv.warn + '</b><b class="info">참고 ' + lv.info + '</b><b class="ok">통과 ' + lv.ok + '</b></p>';
    report.sections.forEach(function (s) {
      h += '<section><h2>' + esc(s.name) + '</h2><table>';
      s.items.forEach(function (it) { h += '<tr><td class="' + it.level + '">' + name[it.level] + '</td><td>' + esc(it.where) + '</td><td>' + esc(it.msg) + '</td></tr>'; });
      h += '</table></section>';
    });
    document.getElementById('out').innerHTML = h;
  }

  async function main() {
    var meta = (W.series.episodes || []).filter(function (e) { return e.id === EP; })[0];
    if (!meta || !meta.file || !(await loadScript(ROOT + meta.file)) || !W.episodeData[EP]) {
      section('data'); add('fail', EP, '회차 데이터를 불러오지 못함'); return;
    }
    var ep = W.episodeData[EP];
    if (BASELINE) {
      var snap = storyOf(ep); snap.generatedAt = new Date().toISOString();
      await fetch('/__qa/baseline', { method: 'POST', body: JSON.stringify(snap, null, 1) });
      status('기준 파일 내용을 보냈습니다.'); document.title = 'qa baseline done'; return;
    }
    var manifest = await getJSON('out/manifest.json');
    if (manifest && manifest.commit) report.commit = manifest.commit;
    if (SKIP.indexOf('data') < 0) await checkData(ep);
    if (SKIP.indexOf('refs') < 0) await checkRefs(ep, manifest);
    if (SKIP.indexOf('alpha') < 0) { await checkSelf(); await checkAlpha(ep); }
    if (SKIP.indexOf('viewer') < 0) await checkViewer(ep);
  }

  main().catch(function (e) { section('오류'); add('fail', '검사 코드', String(e && e.stack || e)); })
    .then(function () {
      render();
      report.finishedAt = new Date().toISOString();
      status('완료 ' + report.finishedAt.slice(11, 19) + (report.commit ? ' · 커밋 ' + report.commit : ''));
      delete report.storySnapshot;
      if (AUTO) return fetch('/__qa/result', { method: 'POST', body: JSON.stringify(report, null, 1) });
    })
    .then(function () { if (!BASELINE) document.title = 'qa done ' + JSON.stringify(report.summary); });
})();
