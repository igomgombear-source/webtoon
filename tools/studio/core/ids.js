/* 안정 식별자 — 편집값은 모두 이 ID 로 연결한다 (통합 담당 전용 파일)
 *
 * 원본 요소: 원본 데이터 안의 위치로 만든 ID. 컷 순서가 바뀌거나 패널을 빼도 바뀌지 않는다.
 *   c017            컷(원본 컷 번호 cut.no, 3자리)
 *   c017.p0         패널(조각) — rows 를 펼친 원본 순서(단독 컷은 p0)
 *   c017.l0         대사 — cut.lines 의 원본 순서
 *   c017.l0.b1      분할 말풍선 조각(대사 l0 의 두 번째 말풍선)
 *   c017.s0         휴대폰 화면 — 화면 데이터 키 '17'(또는 '17:조각') 의 조각 번호, 한 원화에 화면이 둘이면 c060.s0_1
 *   c017.z0         확대 인셋
 *   c017.f0         자막·효과음·합성 글씨 등(원본에 있는 것)
 * 새로 만든 요소: 종류 글자 + '~' + 무작위 5자. 예) c017.l~k3f9a(추가 대사), c~x8q2m(복제·추가 컷)
 * 숫자 위치는 '원본 기준'이다. 새 순서는 편집값(예: cuts.order)에 ID 배열로 저장한다. */
(function () {
  'use strict';
  var S = window.Studio, U = S.util;
  var SEG = /^([a-z])(\d+|~[a-z0-9]+)(?:_(\d+))?$/;
  function rand() { return Math.random().toString(36).slice(2, 7).padEnd(5, '0'); }
  var I = S.ids = {
    cut: function (no) { return 'c' + U.pad3(no); },
    panel: function (no, i) { return I.cut(no) + '.p' + i; },
    line: function (no, i) { return I.cut(no) + '.l' + i; },
    part: function (lineId, k) { return lineId + '.b' + k; },
    screen: function (no, piece, idx) { return I.cut(no) + '.s' + (piece || 0) + (idx ? '_' + idx : ''); },
    zoom: function (no, i) { return I.cut(no) + '.z' + i; },
    fx: function (no, i) { return I.cut(no) + '.f' + i; },
    fresh: function (parent, kind) { return parent ? parent + '.' + kind + '~' + rand() : 'c~' + rand(); },
    /* 'c017.l0.b1' → { cutId:'c017', cut:17, parts:[{kind:'l',index:0},{kind:'b',index:1}], kind:'b', index:1, fresh:false } */
    parse: function (id) {
      if (typeof id !== 'string') return null;
      var segs = id.split('.'), m0 = /^c(\d{3,}|~[a-z0-9]+)$/.exec(segs[0]); if (!m0) return null;
      var out = { id: id, cutId: segs[0], cut: m0[1].charAt(0) === '~' ? null : +m0[1], fresh: m0[1].charAt(0) === '~', parts: [] };
      for (var i = 1; i < segs.length; i++) {
        var m = SEG.exec(segs[i]); if (!m) return null;
        var fresh = m[2].charAt(0) === '~';
        out.parts.push({ kind: m[1], index: fresh ? null : +m[2], key: m[2], sub: m[3] != null ? +m[3] : null, fresh: fresh });
        if (fresh) out.fresh = true;
      }
      var last = out.parts[out.parts.length - 1];
      out.kind = last ? last.kind : 'c'; out.index = last ? last.index : out.cut;
      return out;
    },
    cutOf: function (id) { return typeof id === 'string' ? id.split('.')[0] : null; },
    cutNo: function (id) { var p = I.parse(id); return p ? p.cut : null; },
    valid: function (id) { return !!I.parse(id); }
  };
})();
