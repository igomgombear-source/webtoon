/* 모듈: 자막·효과 — 자막·효과음, 합성 글씨, 암전·페이드·그라데이션, 확대 인셋 (담당: Codex, 2차 병렬)
 * 1단계: 자리만 있다(메뉴 + 현재 컷 원본 데이터 읽기 전용 표시). 편집값을 만들지 않는다.
 * 구현할 때 이 파일 전체를 담당자가 바꾼다. 규격: docs/STUDIO_ARCHITECTURE.md, 작업 규칙: docs/STUDIO_PARALLEL_DEV.md */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids;
  S.plannedModule({ id: 'fx', label: '자막·효과', order: 60, owner: 'Codex (2차)', status: 'planned', level: 'episode',
    planned: ['자막·효과음 추가·삭제(edits.fx[c###.f~xxxxx])', '글자 크기·색상·위치', '칠판 글씨 등 합성 레이어 편집', '암전·페이드인·그라데이션(cut.mood·transition)', '확대 인셋 위치·크기(edits.fx[c###.z#])'],
    view: function () { var c = S.api.cutData(); if (!c) return ''; var o = []; ['mood', 'transition', 'titleCard', 'caption', 'sfx'].forEach(function (k) { if (c[k] != null) o.push('<li>' + k + ': ' + U.esc(typeof c[k] === 'object' ? JSON.stringify(c[k]).slice(0, 80) : c[k]) + '</li>'); }); return o.length ? '<ul class="plan">' + o.join('') + '</ul>' : '<p>원본 효과 데이터 없음</p>'; } });
})();
