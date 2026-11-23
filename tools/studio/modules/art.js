/* 모듈: 원화 — 교체·시안 선택, 확대·자르기·위치, 회전·반전, 밝기·대비·채도·흐림 (담당: Codex, 1차 병렬)
 * 1단계: 자리만 있다(메뉴 + 현재 컷 원본 데이터 읽기 전용 표시). 편집값을 만들지 않는다.
 * 구현할 때 이 파일 전체를 담당자가 바꾼다. 규격: docs/STUDIO_ARCHITECTURE.md, 작업 규칙: docs/STUDIO_PARALLEL_DEV.md */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  S.plannedModule({ id: 'art', label: '원화', order: 40, owner: 'Codex', status: 'planned', level: 'episode',
    planned: ['원화 교체·기존 시안 선택(edits.art[c###.p#] = { src })', '확대·축소·자르기·상하좌우 위치', '회전·좌우 반전', '밝기·대비·채도·흐림', '원화 변형 시 합성 레이어 좌표 연동(문서 §6 규칙)'],
    view: function () { var c = S.api.cutData(); if (!c) return ''; return '<ul class="plan">' + S.base.panelsOf(c).map(function (p, i) { return '<li><code>' + I.panel(c.no, i) + '</code> ' + U.esc(p.image || '(원화 없음)') + (p.imageStatus ? ' · ' + U.esc(p.imageStatus) : '') + ' · ' + U.esc(p.ratio || c.ratio || '') + '</li>'; }).join('') + '</ul>'; } });
})();
