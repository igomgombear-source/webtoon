
## 수정 시안 비교 페이지 (검수용, 본편과 분리)
- 주소: `/tools/compare.html` (Codespaces 8765 포트 주소 뒤에 붙인다. 예: `https://<codespace 이름>-8765.app.github.dev/tools/compare.html`)
- 1·16·41·43·57·94-a·94-b컷의 기존 원화와 미승인 수정 시안을 전환·겹쳐 보기·확대로 비교하고, 판단(승인 후보/보류/반려)을 눌러 요약을 복사할 수 있다. 본편(`#ep01v3`)에는 연결되지 않았고 43컷 대사는 바뀌지 않는다.

## 사용자 최종 검수판 (본편과 같은 화면 + 컷 번호·설명)
- 주소: `/index.html?check=1#ep01v3` (숨긴 컷 포함은 `?check=1&hidden=1#ep01v3`). 자세한 내용은 `docs/EP01_FINAL_REVIEW_20261123.md`.

## 로컬 수정 시안 17장 비교 (미승인, 본편 미연결)
- 주소: `/tools/compare-local-revisions.html` (Codespaces 8765 포트 주소 뒤). 출처 브랜치 `ep01-local-revisions-art`(`b8789b4`).
- 승인본과 충돌하는 컷(41)은 빨간 경고로 따로 모았다.

## 말풍선 편집기 v2 (EP01~EP06 공용, 원화·대사 불변)
- 주소: `/tools/bubble-editor.html`(저장소) · GitHub Pages `…/webtoon/review/bubble-editor.html`. `#ep01v3/70` 처럼 회차·컷 번호를 붙여 바로 열 수 있다.
- 구조: **실제 독자 화면**(`index.html`, Pages 에서는 `review/viewer.html`)을 iframe 으로 띄우고 같은 말풍선 엔진(`js/bubbles.js`)으로 다시 배치한다. 휴대폰 UI·확대 인셋·원화 속 글자 등 합성 레이어와 순서가 독자 화면과 같다. 그 위에 투명 핸들(이동·크기·꼬리 시작/끝)만 얹는다.
- 엔진: `manual`(말풍선 위치 x·y %, 폭 w %, 높이 h % 또는 'auto', pad px, radius px, fs px, lh, 꼬리 `{on:false}` 또는 `{tip:{x,y}, start°, thick, curve}`)을 줄 단위로 읽는다. `manual` 이 없는 컷은 이전과 출력이 완전히 같다(5개 폭에서 HTML 해시 동일 확인). 여러 말풍선으로 나뉘는 대사(분할)는 `manual` 을 무시한다.
- 모드: 편집 후 / 원래 / 나란히(실제 화면 2개). 편집한 대사는 전·후 수치 표로 확인한다.
- 저장: 브라우저(localStorage) 자동 저장 + JSON 내보내기·불러오기(v2). v1 편집기 JSON·저장값은 불러올 때 자동 변환. 패치 텍스트는 컷별 전체 `lines` 에 `manual`(+호환용 `pref`·`tail`)을 담는다. **패치는 본편 데이터에 자동 반영되지 않으며, 반영은 사용자 승인 후 별도 작업이다.**
- 회차 추가(EP02~): 회차 데이터가 `data/episodes.js` 에 `ready: true` 로 등록되고 `window.EP_BUBBLES['<id>']` 가 있으면 회차 선택에 자동으로 나타난다(편집기 코드 수정 없음).
