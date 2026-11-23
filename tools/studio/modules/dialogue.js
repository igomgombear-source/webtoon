/* 모듈: 대사 — 대사·독백 내용, 줄바꿈·정렬, 화자, 순서 (담당: Claude Code, 1차 병렬)
 * 1단계: 자리만 있다(메뉴 + 현재 컷 원본 데이터 읽기 전용 표시). 편집값을 만들지 않는다.
 * 구현할 때 이 파일 전체를 담당자가 바꾼다. 규격: docs/STUDIO_ARCHITECTURE.md, 작업 규칙: docs/STUDIO_PARALLEL_DEV.md */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  S.plannedModule({ id: 'dialogue', label: '대사', order: 20, owner: 'Claude Code', status: 'planned', level: 'episode',
    planned: ['대사·독백 내용 수정(edits.dialogue[c###.l#] = { text })', '줄바꿈·정렬 변경', '화자 변경', '대사 순서 변경(edits.dialogue[c###] = { order: [대사ID...] })', '대사 추가·삭제 시 말풍선 설정 lines 1:1 유지(말풍선 모듈과 공동 규칙)'],
    view: function () { var c = S.api.cutData(); return c && c.lines && c.lines.length ? '<ol class="plan">' + c.lines.map(function (l, i) { return '<li><code>' + I.line(c.no, i) + '</code> <b>' + U.esc(l.who || '(독백)') + '</b> ' + U.esc(l.text) + '</li>'; }).join('') + '</ol>' : '<p>대사 없음</p>'; } });
})();
