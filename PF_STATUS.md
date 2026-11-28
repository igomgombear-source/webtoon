# PF_STATUS — 제작 현황 및 승인 장부 대조
기준: 2026-11-29 / PF-002 / GPT 직접 수행 / 원격 읽기 검증 및 관리 문서 기록 한정.
공개 저장소용 요약. 상세 콘티·개인정보 미포함. 브라우저 실동작 및 테스트 재실행 미수행.

## 원격 기준
| 구분 | 브랜치 / 커밋 | 상태 |
|---|---|---|
| 기준 main | main / 3c791c9 | 보존 |
| 독자 구성 | ep01-reader99-20261123 / 17b1e94 | 관리 104, 독자 99, 숨김 16·59·60·85·86 |
| 승인 연결 | ep01-cut70-integration-20261123 / 6bb9880 | 70·98 승인 파일 연결, 위 숨김 목록 일치 |
| 원화 비교 | ep01-local-revisions-compare-20261123 / 3973e7e | 이전 수정안 17개 WebP 및 비교 도구 |
| 최신 수정안 | ep01-local-revisions-redraft-20261123 / dda7002 | 신규 DRAFT 12 WebP + SVG 1; 승인/최종 연결 미확인 |
| 공식 배포 정의 | official-pages / 9f37527 | 공식 소스 b80cde5(104컷), 검수 소스 885b149 고정; 실배포 실행 미검증 |
| Studio 코어 | studio-core-20261123 / c192273 | 원격 확인 |
| Studio A | studio-bubbles-20261124 / 7b6f791 | 원격 확인 |
| Studio 부분 통합 | studio-integration-phase2-20261124 / 7b3bb23 | B 미통합 |
| Studio B | studio-cuts-art-20261124 / 로컬 6eab439 | 원격 브랜치 미확인; 기존 작업 복구 우선 |

근거: 위 각 브랜치의 커밋/트리, data/ep01v3.js, 공식 배포 워크플로 .github/workflows/official-pages.yml.
공식 독자/검수 소스의 분리 유지. 최신 수정안과 검수 소스의 동기화 미확인. 공식 배포 변경 금지.

## 승인 장부 스냅샷
기준: dda7002 및 6bb9880의 data/ep01v3.js와 tools/qa/v3.js의 APPROVED 장부.
아래 9개 컷 14개 파일은 데이터상 approved 및 QA 예외 장부 일치. 장부는 전체 원화 승인 목록이 아니며 개별 사용자 승인 증빙을 대신하지 않음.
| 컷 | 원화 파일 |
|---|---|
| 1 | ep01v3-001-opening-portrait-DRAFT.webp; ep01v3-001-haein-portrait-DRAFT.webp; ep01v3-001-hyoeun-portrait-DRAFT.webp; ep01v3-001-gihun-tracksuit-portrait.webp; ep01v3-001-jin-portrait-DRAFT.webp |
| 16 | ep01v3-016-natural-mouse-grip-DRAFT.webp |
| 19c | ep01v3-019c-yangpyeong-school-night-APPROVED.webp |
| 41 | ep01v3-041-haein-doorway-trousers-REV1-DRAFT.webp |
| 43 | ep01v3-043-entrance-gesture-DRAFT.webp |
| 57 | ep01v3-057-half-size-clock-DRAFT.webp |
| 70 | ep01v3-070-two-shot-REV1-APPROVED.webp |
| 94a/b | ep01v3-094-a-slim-phone-DRAFT.webp; ep01v3-094-b-slim-phone-DRAFT.webp |
| 98 | ep01v3-098-reveal-dark-APPROVED.webp |

별도 확인:
- 1컷 다섯째 초상: 데이터 및 QA 장부 승인 처리 확인. 개별 사용자 승인 증빙은 아직 미확인. 과거 콘티의 초상 상태 메모와 대조 필요.
- 89: ep01v3-089-real-kitchen-DRAFT.webp, imageStatus 없음. 승인 미확인. 기존 QA FAIL 2건(data.image/data.draft), WARN 0 보고. 자동 승인 금지.
- 46: 기존 DRAFT, 최종 시각 검수 보류.
- 다른 원화의 승인 여부: 기존 장부 및 사용자 기록 대조 전 미확인. 파일명 DRAFT만으로 승인 여부 판단 금지.

## 수정안 인계
dda7002의 추가 파일: 10(원화 및 칠판 SVG), 13, 19b, 47, 48, 50, 51, 52a/b, 53, 54, 55.
해당 커밋 변경 파일은 원화 및 SVG뿐. 데이터/비교 페이지/공식 배포 갱신을 완료했다고 판단하지 않음.
원화 시각 검수 및 사용자 승인 후 정확한 파일 연결 필요. 14·18 등 별도 요청은 완료 근거 재확인.

## 설정 및 QA 미해결
- 서진석 나이: 최신 콘티 승인 보고 50대, dda7002의 data/cast.js는 40대(이전 승인 기록 명시). 설정 충돌. 최신 사용자 확정 기준으로 관련 문서/코드를 대조 후 제한된 정정 작업 필요. 최기훈 40대 유지.
- 콘티 동결: 관리 574/노출 예정 569. EP02~06 최종 원문 원격 보관 및 제작 준비 외형 승인 상태 별도 확인. 공개 저장소에 미공개 콘티 무단 저장 금지.
- Studio: 기존 통합 보고 268 테스트 통과, QA FAIL 2/WARN 0. B 로컬 복구 및 통합 전 신규 개발 보류.
- 실제 기기/브라우저 재검수 미수행. 과거 QA 수치와 현재 원격 정적 확인 구분.

## 근거 문서
- [승인 원화 통합 및 QA](https://github.com/igomgombear-source/webtoon/blob/ep01-cut70-integration-20261123/docs/EP01_FINAL_REVIEW_20261123.md)
- [99컷 구성](https://github.com/igomgombear-source/webtoon/blob/ep01-reader99-20261123/docs/EP01_READER99_20261123.md)
- [QA 장부](https://github.com/igomgombear-source/webtoon/blob/ep01-local-revisions-redraft-20261123/tools/qa/v3.js)
- [최신 원화 수정 커밋](https://github.com/igomgombear-source/webtoon/commit/dda7002dd165842cfe69dceed8f4cf9fac252542)
- [공식 배포 정의](https://github.com/igomgombear-source/webtoon/blob/official-pages/.github/workflows/official-pages.yml)
- [Studio 통합 기록](https://github.com/igomgombear-source/webtoon/blob/studio-integration-phase2-20261124/docs/studio/integration-phase2.md)

## 다음 작업
PF-003: 최신 원화 수정안·개별 승인 증빙 대조 및 제작 준비 체크리스트 정리. 수정안 재생성 금지. 시각 검수 불가 시 명시.
PF-003A: 인물 설정 충돌 정정 범위 확정 및 검토용 작업 지시. 기존 공식 배포/원화 보존.
PF-004: Studio B 기존 작업 복구(사용자 보류 해제 전 신규 개발 금지).
PF-005: 작업 ID 기반 GitHub 운영 계속.
