# EP01 승인 원화 통합·최종 검수판 (2026-11-23)

브랜치 `ep01-final-review-20261123` ← `ep01-reader99-20261123`(`17b1e94`). `main`·`official-pages` 미수정, 배포 없음. 원본 104컷·독자 화면 99컷(숨김 16·59·60·85·86) 유지. 46컷 보류. AI는 컷 수정·승인 판정을 하지 않았고 아래는 기존 기록에 따른 반영이다.

## 1. 승인 원화 연결
| 컷 | 내용 |
|---|---|
| 98 | `ep01v3-098-reveal-dark-APPROVED.webp`(브랜치 `ep01-cut98-approved-art`, 승인 커밋 `14da725`, 1080×1920)를 파일 그대로 연결. `imageStatus:"approved"`, `imageLqip` 갱신. 말풍선 대신 가운데 정렬 자막 유지. 5개 폭(320~768)에서 자막 16px·밝은 글자·화면 안·가로 스크롤 없음 확인 |
| 70 | **연결하지 못함.** Work의 70컷 승인 WebP는 저장소의 어떤 브랜치에도 없다(`ep01v3-070-DRAFT.webp` 만 존재, 파일명·커밋 정보 없음). 효은 대사 2개의 얼굴·휴대폰 비침범 확인도 새 원화가 올라온 뒤에 가능하다. 현재 70컷은 기존 원화·말풍선 그대로 |

## 2. QA FAIL 19건 대조
승인 기록: `docs/EP01_APPROVED_ART_INTEGRATION.md`(‘승인 원화 반영’)·승인 연결 커밋 `b80cde5`·공식 배포 승인본. 이 기록에 올라 있는 파일만 **정확한 파일명 + `imageStatus:"approved"`** 가 맞을 때 허용(`tools/qa/v3.js` `APPROVED` 장부).
| 구분 | 컷 | 처리 |
|---|---|---|
| 확인됨 → 반영 | 1(초상 5장), 16 `natural-mouse-grip`, 41 `trousers-REV1`, 43 `entrance-gesture`, 57 `half-size-clock`, 94-a·b `slim-phone`, (19-c·98 은 기존/이번 승인) | 데이터에 `imageStatus:"approved"` 추가, QA 장부에 정확한 파일명 등록 |
| **미확인 → 유지** | 89 `ep01v3-089-real-kitchen-DRAFT.webp` | 기록이 ‘확보한 DRAFT 를 원본 그대로 연결’뿐이라 사용자 승인 문구가 없다. 장부에 넣지 않았고 FAIL 2건(`data.image`·`data.draft`)으로 남긴다 |

## 3. 사용자 최종 검수판
- 주소: `index.html?check=1#ep01v3` (숨긴 5컷까지 보려면 `&hidden=1`). Codespaces 8765 포트 주소 뒤에 붙인다(`docs/EP01_MOBILE_PREVIEW.md`).
- 독자 화면과 같은 99컷·순서·원화·대사·말풍선·휴대폰 UI·간격. 각 컷 위쪽 왼쪽에 `#원본 컷 번호 + 컷 데이터 desc`(수정하지 않음) 칩, 여러 패널 컷(1·18·19·23·26·33·52·75·88·90·94)은 패널마다 ‘조각 a/b…’. 번호는 1~104 원본 그대로.
- 칩은 `position:absolute` 라 컷 간격을 바꾸지 않고, 오른쪽 아래 ‘번호·설명 끄기’ 버튼으로 숨길 수 있다. 폰·PC 모두 같은 화면(최대 폭 720px 가운데 정렬, 720px 이상에서 칩 13px).
- 설명은 컷 데이터 `desc` 를 그대로 읽으므로 수정은 `data/ep01v3.js` 의 `desc` 만 고치면 된다. 주소에 `check=1` 이 없으면 독자 화면에는 아무 것도 나오지 않는다(독자 화면 칩 0개 확인).

## 4. QA (`tools/qa/v3.html?auto`, 320·360·390·430·768)
FAIL 19 → **2**(89컷 `data.image`·`data.draft`), WARN 0, 새 FAIL 0, 콘솔 오류 0.
