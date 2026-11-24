/* 중앙 편집 화면 — 실제 독자 화면 iframe(한 컷만 표시) + 투명 오버레이 + 원래/나란히 비교 (통합 담당 전용 파일)
 * 모듈이 쓰는 좌표: '컷 섹션 좌표'(px, 확대 전). S.stage.point(e) 가 포인터 위치를 이 좌표로 바꿔 준다.
 * 오버레이(#ov)는 확대 배율이 곱해진 화면 좌표다: 화면 x = (origin.x + 섹션 x) * zoom */
(function () {
  'use strict';
  var S = window.Studio, U = S.util;
  var GAP = 12;
  var st = S.stage = {
    frame: null, compare: null, width: 390, zoom: 1, mode: 'edit', cut: null, ep: null,
    init: function () {
      var host = U.$('stage');
      st.frame = S.renderer.create('main', { host: host, single: true, edits: true, width: st.width, title: '편집 화면(실제 독자 화면)' });
      st.ov = document.createElement('div'); st.ov.id = 'ov'; st.ov.className = 'ov'; host.appendChild(st.ov);
      S.on('rendered', function (ev) { if (ev.frame === st.frame || ev.frame === st.compare) { st.layout(); S.emit('stage', ev); } });
      window.addEventListener('resize', U.debounce(function () { st.layout(); S.emit('stage', {}); }, 120));
    },
    load: function (ep) {
      st.ep = ep; st.cut = null;
      return st.frame.load(ep).then(function () { if (st.compare) return st.compare.load(ep); });
    },
    /* 현재 컷(원본 컷 번호) 선택 — 썸네일·컷 목록과 동기 */
    select: function (no, opt) {
      if (!st.frame.cut(no)) return false;
      var prev = st.cut; st.cut = no; S.state.cut = no;
      st.frame.applyCut(no, true); st.frame.showCut(no);
      if (st.compare && st.mode === 'side') { st.compare.applyCut(no, true); st.compare.showCut(no); }
      st.layout(); S.emit('cut', { no: no, source: opt && opt.source, changed: prev !== no });   /* changed:false = 같은 컷 다시 고름(폭·모드 전환) */ S.emit('stage', {});
      return true;
    },
    hidden: function (no) { return !!st.frame.hidden[no == null ? st.cut : no]; },
    origin: function () { var sec = st.frame.section(st.cut); if (!sec) return { x: 0, y: 0, w: 0, h: 0 }; var r = sec.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; },
    /* 포인터 이벤트 → 컷 섹션 좌표(px) */
    point: function (e) { var r = st.ov.getBoundingClientRect(), o = st.origin(); return { x: (e.clientX - r.left) / st.zoom - o.x, y: (e.clientY - r.top) / st.zoom - o.y }; },
    /* 섹션 좌표 → 오버레이 css px */
    toOv: function (x, y) { var o = st.origin(); return { x: (o.x + x) * st.zoom, y: (o.y + y) * st.zoom }; },
    layout: function () {
      var f = st.frame; if (!f || st.cut == null) return;
      f.fit(); var W = st.width, z = st.zoom, H = parseInt(f.el.style.height, 10) || 600, side = st.mode === 'side' && st.compare;
      f.el.style.transform = 'scale(' + z + ')';
      if (st.compare) { st.compare.el.style.display = side ? '' : 'none'; if (side) { st.compare.fit(); st.compare.el.style.transform = 'scale(' + z + ')'; st.compare.el.style.left = (W * z + GAP) + 'px'; H = Math.max(H, parseInt(st.compare.el.style.height, 10) || 0); } }
      var host = U.$('stage'); host.style.width = (W * z * (side ? 2 : 1) + (side ? GAP : 0)) + 'px'; host.style.height = (H * z) + 'px';
      st.ov.style.width = (W * z) + 'px'; st.ov.style.height = ((parseInt(f.el.style.height, 10) || 600) * z) + 'px';
      st.ov.style.pointerEvents = st.mode === 'before' ? 'none' : 'auto';
    },
    setWidth: function (w) {
      st.width = w; var ps = [st.frame.setWidth(w)]; if (st.compare) ps.push(st.compare.setWidth(w));
      return Promise.all(ps).then(function () { if (st.cut != null) st.select(st.cut, { source: 'width' }); });
    },
    setZoom: function (z) { st.zoom = z; st.layout(); S.emit('stage', {}); },
    setMode: function (m) {
      st.mode = m; S.emit('mode', { mode: m });
      var p = st.frame.setEdits(m !== 'before');
      if (m === 'side') {
        if (!st.compare) {
          st.compare = S.renderer.create('compare', { host: U.$('stage'), single: true, edits: false, width: st.width, title: '원래 화면(편집 전)' });
          st.compare.el.style.left = (st.width * st.zoom + GAP) + 'px';
          p = Promise.all([p, st.compare.load(st.ep)]);
        } else p = Promise.all([p, st.compare.setWidth(st.width)]);
      }
      return p.then(function () { if (st.cut != null) st.select(st.cut, { source: 'mode' }); });
    }
  };
})();
