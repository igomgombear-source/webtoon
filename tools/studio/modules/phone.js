/* 모듈: 휴대폰 UI — 화면 네 모서리, 문자·카톡·알림 내용, 화면 켜짐·꺼짐 (담당: Claude Code, 2차 병렬)
 * 1단계: 자리만 있다(메뉴 + 현재 컷 원본 데이터 읽기 전용 표시). 편집값을 만들지 않는다.
 * 구현할 때 이 파일 전체를 담당자가 바꾼다. 규격: docs/STUDIO_ARCHITECTURE.md, 작업 규칙: docs/STUDIO_PARALLEL_DEV.md */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  S.plannedModule({ id: 'phone', label: '휴대폰 UI', order: 50, owner: 'Claude Code (2차)', status: 'planned', level: 'episode',
    planned: ['화면 네 모서리 좌표 드래그(edits.phone[c###.s#] = { quad })', '문자·카톡·알림 내용 변경', '화면 켜짐·꺼짐'],
    view: function () { var c = S.api.cutData(); if (!c) return ''; var sc = S.base.data(S.state.ep).screens || {}, out = [];
      S.base.panelsOf(c).forEach(function (p, i) { var k = S.base.screenKey(c, i), s = sc[k]; if (!s) return; (Array.isArray(s) ? s : [s]).forEach(function (x, j) { out.push('<li><code>' + I.screen(c.no, i, j) + '</code> 키 ' + U.esc(k) + ' · ' + U.esc(x.view || '') + (x.zoomOnly ? ' · 인셋 전용' : '') + '</li>'); }); });
      if (c.phone) out.push('<li>휴대폰 컷 데이터(cut.phone): ' + U.esc(c.phone.view || '') + '</li>');
      return out.length ? '<ul class="plan">' + out.join('') + '</ul>' : '<p>휴대폰 UI 없음</p>'; } });
})();
