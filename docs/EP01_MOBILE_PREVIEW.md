
## 수정 시안 비교 페이지 (검수용, 본편과 분리)
- 주소: `/tools/compare.html` (Codespaces 8765 포트 주소 뒤에 붙인다. 예: `https://<codespace 이름>-8765.app.github.dev/tools/compare.html`)
- 1·16·41·43·57·94-a·94-b컷의 기존 원화와 미승인 수정 시안을 전환·겹쳐 보기·확대로 비교하고, 판단(승인 후보/보류/반려)을 눌러 요약을 복사할 수 있다. 본편(`#ep01v3`)에는 연결되지 않았고 43컷 대사는 바뀌지 않는다.

## 사용자 최종 검수판 (본편과 같은 화면 + 컷 번호·설명)
- 주소: `/index.html?check=1#ep01v3` (숨긴 컷 포함은 `?check=1&hidden=1#ep01v3`). 자세한 내용은 `docs/EP01_FINAL_REVIEW_20261123.md`.

## 로컬 수정 시안 17장 비교 (미승인, 본편 미연결)
- 주소: `/tools/compare-local-revisions.html` (Codespaces 8765 포트 주소 뒤). 출처 브랜치 `ep01-local-revisions-art`(`b8789b4`).
- 승인본과 충돌하는 컷(41)은 빨간 경고로 따로 모았다.
