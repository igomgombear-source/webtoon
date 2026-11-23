/* 원본 데이터 보관·지문·기준 정보 (통합 담당 전용 파일)
 * 독자 화면이 불러온 직후의 원본(회차 데이터·말풍선 설정·휴대폰 화면 설정)을 깊은 복사로 보관한다.
 * 편집은 언제나 이 원본 사본 위에 다시 적용한다(원본 파일·원본 객체는 바꾸지 않는다). */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  var eps = {}, commit = { commit: null, branch: null, source: null };

  function bubbleObj(win, ep) {
    if (win.EP_BUBBLES && win.EP_BUBBLES[ep]) return win.EP_BUBBLES[ep];
    if (ep === 'ep01v3') return win.EP01V3_BUBBLES || (win.EP01V3_BUBBLES = { cuts: {} });
    return null;
  }
  function panelsOf(cut) { return cut.rows ? [].concat.apply([], cut.rows) : [cut]; }
  function cutByNo(ep, no) { var d = eps[ep]; if (!d) return null; for (var i = 0; i < d.episode.cuts.length; i++) if (d.episode.cuts[i].no === no) return d.episode.cuts[i]; return null; }
  function screenKey(cut, piece) { return cut.rows ? cut.no + ':' + piece : String(cut.no); }

  var B = S.base = {
    bubbleObj: bubbleObj, panelsOf: panelsOf, screenKey: screenKey,
    /* 독자 화면 iframe 이 처음 그려진 직후 1회 */
    capture: function (win, ep) {
      if (eps[ep]) return eps[ep];
      var W = win.WEBTOON, bo = bubbleObj(win, ep);
      eps[ep] = Object.freeze({
        episode: U.clone(W.episodeData[ep]),
        screens: U.clone((W.screens && W.screens[ep]) || null),
        bubbles: U.clone(bo || null),
        series: U.clone(W.series)
      });
      return eps[ep];
    },
    ready: function (ep) { return !!eps[ep]; },
    data: function (ep) { return eps[ep] || null; },
    cut: function (ep, no) { return cutByNo(ep, no); },
    cuts: function (ep) { return eps[ep] ? eps[ep].episode.cuts : []; },
    /* 요소 ID → 원본 지문. 원본에 없으면 null, 새로 만든 요소는 'fresh' */
    fingerprint: function (ep, id) {
      var p = I.parse(id); if (!p) return null; if (p.fresh) return 'fresh';
      var cut = cutByNo(ep, p.cut); if (!cut) return null;
      var cutFp = function () { return U.fp({ no: cut.no, type: cut.type, image: cut.image || null, ratio: cut.ratio || null, rows: cut.rows ? cut.rows.map(function (r) { return r.map(function (q) { return [q.image || null, q.ratio || null]; }); }) : null }); };
      var head = p.parts[0];
      if (!head) return cutFp();
      if (head.kind === 'p') { var pa = panelsOf(cut)[head.index]; return pa ? U.fp({ image: pa.image || null, ratio: pa.ratio || cut.ratio || null }) : null; }
      if (head.kind === 'l') { var l = (cut.lines || [])[head.index]; return l ? U.fp({ who: l.who || null, text: l.text || '', style: l.style || null, at: l.at || null, panel: l.panel == null ? null : l.panel }) : null; }
      if (head.kind === 's') { var sc = eps[ep].screens || {}, spec = sc[screenKey(cut, head.index)]; if (!spec) return null; if (Array.isArray(spec)) spec = spec[head.sub || 0]; return spec ? U.fp(spec) : null; }
      return cutFp();   /* z·f 등: 해당 모듈이 세부 지문을 정하기 전까지는 컷 지문 */
    },
    /* 연결 관계: 패널(조각) ID 에 붙어 있는 대사·말풍선 설정·휴대폰 화면·보호 영역 — 패널 제거 경고·복원에 쓴다(컷 구성 모듈)
     * 반환 { lines:[대사ID], bubbleRefs:[{id, key:'pref'|'tail'|'zone'}], screens:[화면ID] } */
    links: function (ep, id) {
      var p = I.parse(id), out = { lines: [], bubbleRefs: [], screens: [] }; if (!p || !p.parts.length || p.parts[0].kind !== 'p') return out;
      var cut = cutByNo(ep, p.cut), pi = p.parts[0].index; if (!cut) return out;
      var nPanels = panelsOf(cut).length, last = nPanels - 1;
      (cut.lines || []).forEach(function (l, i) { var lp = l.panel != null ? l.panel : ((l.at || 'gap') === 'gap' ? last : 0); if (lp === pi) out.lines.push(I.line(cut.no, i)); });
      var bc = eps[ep].bubbles && eps[ep].bubbles.cuts && eps[ep].bubbles.cuts[cut.no];
      if (bc) {
        (bc.lines || []).forEach(function (l, i) { if (!l) return; if (l.pref && l.pref.panel === pi) out.bubbleRefs.push({ id: I.line(cut.no, i), key: 'pref' }); if (l.tail && l.tail.panel === pi) out.bubbleRefs.push({ id: I.line(cut.no, i), key: 'tail' }); });
        (bc.zones || []).forEach(function (z, i) { if (z.panel === pi) out.bubbleRefs.push({ id: I.cut(cut.no), key: 'zone', index: i }); });
      }
      var sc = eps[ep].screens || {}, spec = sc[screenKey(cut, pi)];
      if (spec) (Array.isArray(spec) ? spec : [spec]).forEach(function (x, j) { out.screens.push(I.screen(cut.no, pi, j)); });
      return out;
    },
    /* 기준 정보: 커밋·회차 데이터 지문·원화 파일 */
    info: function () {
      var o = { commit: commit.commit, branch: commit.branch, commitSource: commit.source, studio: S.version, episodes: {} };
      Object.keys(eps).forEach(function (ep) {
        var d = eps[ep], art = {};
        d.episode.cuts.forEach(function (c) { var ps = panelsOf(c); if (ps.length === 1) { if (c.image) art[I.cut(c.no)] = c.image; } else ps.forEach(function (q, i) { if (q.image) art[I.panel(c.no, i)] = q.image; }); });
        o.episodes[ep] = { cuts: d.episode.cuts.length, readerCuts: d.episode.cuts.filter(function (c) { return c.reader !== false; }).length,
          data: U.fp(d.episode), bubbles: U.fp(d.bubbles), screens: U.fp(d.screens), art: art };
      });
      return o;
    },
    /* 기준 커밋: 로컬 서버(저장소 루트 제공)면 .git 에서, 배포본이면 studio-base.json 에서. 없으면 null */
    loadCommit: function (root) {
      function txt(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }); }
      return txt(root + '.git/HEAD').then(function (head) {
        head = head.trim(); var m = /^ref:\s*(\S+)/.exec(head);
        if (!m) { commit = { commit: head, branch: null, source: 'git' }; return commit; }
        var ref = m[1], branch = ref.replace(/^refs\/heads\//, '');
        return txt(root + '.git/' + ref).then(function (sha) { return sha.trim(); }, function () {
          return txt(root + '.git/packed-refs').then(function (pk) { var mm = new RegExp('^([0-9a-f]{40}) ' + ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'm').exec(pk); return mm ? mm[1] : null; });
        }).then(function (sha) { commit = { commit: sha, branch: branch, source: 'git' }; return commit; });
      }).catch(function () {
        return fetch(root + 'studio-base.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.commit) commit = { commit: j.commit, branch: j.branch || null, source: 'studio-base.json' }; return commit; }, function () { return commit; });
      });
    }
  };
})();
