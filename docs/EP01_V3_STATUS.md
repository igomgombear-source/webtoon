# EP01 104컷 제작판 (data/ep01v3.js) 상태

- 보는 곳: `index.html#ep01v3` (기존 70컷 `#ep01` 은 그대로, 수정 없음)
- 출처: EP01_104컷_제작기준_v2.md (번호·형태·대사·시각). 콘티 원본은 내부 정본이라 저장소에 넣지 않았다.

## 원화 연결 현황
| 컷 | 상태 |
|---|---|
| 35 (해인) | DRAFT 원화 연결 |
| 50 (승민) | `ep01v3-050-webtoon-style-DRAFT.webp` 연결. `lockscreen-REV1` 은 휴대폰 UI 참고용으로만 보관 |
| 66 (효은) | DRAFT 원화 연결 |
| 1, 16, 76 | 승인 원화 파일 미수령 → 임시 컷 유지 (16은 REV2가 최종) |
| 그 외 | 임시 컷 |

## 휴대폰 화면 (컷 49 / 63)
- 배경 사진과 시계·날짜·알림을 분리. 시계·알림은 CSS(`cqw` 단위)로 그리고 시각은 데이터(`phone.time`)로 지정 → 다른 시각에 재사용 가능.
- 49컷 09:17 (해인), 63컷 10:36 (승민 화면).
- 배경은 승인본에서 구워진 시계를 지운 파생본(`assets/phone/*-CLEAN-DERIVED.webp`). **파생본은 승인 대기.** 원본(`*-DRAFT.webp`)은 그대로 보존.

## 렌더러 (제작기준 v2)
- 지원: width/align/ratio, shape(box, slant-r, slant-l, bleed), split2·strip·stack(rows), diagonal, link, inset(prev/self), overflow, 말풍선 위치 `at`(in-*, edge-*, gap), 작은 말풍선, 이름 숨김, DRAFT 배지.
- 미지원 shape 값은 box 로 처리 (사용하는 컷 없음).

## 자동 QA
- `tools/qa/v3.html` (브라우저에서 열면 320/360/390/430/768 폭에서 104컷 전부 점검), 기준표 `tools/qa/ep01v3.spec.json`.
- 점검: 가로 스크롤, 컷 폭·정렬, 패널 비율, link/inset 간격, 말풍선 글자 크기·줄 수·잘림·겹침, 휴대폰 시각 문구, 이미지 로드.
- 70컷 `#ep01` 회귀 확인 포함.

## 미완성 / 미확정
- 50컷 말풍선 위치: 사용자 승인 전.
- 얼굴 위 말풍선 겹침은 자동 점검 불가 → 눈으로 확인 필요.
- 실제 기기 테스트 미실시 (headless Chrome 만 사용).
- 기존 `tools/qa/run.ps1` 은 70컷용 그대로.
