# 104컷 자동 검수 (tools/qa)

그림이나 컷 데이터를 바꾼 뒤 다시 검수하는 도구. **읽기만 하고 그림·데이터는 고치지 않는다.** (70컷 구판 QA·기준 파일은 2026-11-22 구판 제거와 함께 삭제)

## 실행
저장소 루트에서 `python3 -m http.server 8765` 후 브라우저(또는 Playwright Chromium)로
`http://localhost:8765/tools/qa/v3.html?auto` 를 연다. 320·360·390·430·768px 폭별로 돌고, 끝나면 `FAIL 0건 / WARN 0건`과 `완료`가 나온다.

## 파일
| 파일 | 역할 |
|---|---|
| `v3.html`, `v3.js` | 104컷 자동 검수(데이터·말풍선·휴대폰 UI·확대 인셋·이미지 허용 목록·폭별 표시) |
| `ep01v3.spec.json` | 컷 번호·형태·대사·위치 기준(승인 변경만 갱신) |
| `known-issues.json` | 모바일 측정(`device.ps1`)이 읽는 알려진 글자 말줄임 목록 |
| `device.ps1`, `device-probe.js`, `serve.ps1` | 모바일 환경(화면·CPU·통신) 흉내 측정(Windows PowerShell + Edge/Chrome) |

검사 기준값을 낮춰 통과시키지 않는다. 사람이 보는 시각 검수(320~768px)는 자동 QA와 따로 한다.
