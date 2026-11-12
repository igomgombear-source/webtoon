# 1화 자동 검수 (tools/qa)

그림이나 컷 데이터를 바꾼 뒤 한 번에 다시 검수하는 도구. **읽기만 하고 그림·데이터는 고치지 않는다.**
설치할 것 없음: Windows PowerShell 5.1 + Edge(또는 Chrome) + Git.

## 1. 실행

저장소 폴더에서:

```
powershell -ExecutionPolicy Bypass -File tools\qa\run.ps1
```

- 약 1분. 결과는 화면에 실패·확인 항목이 나오고, 전체는 `tools/qa/out/report.txt`, `tools/qa/out/report.json` 에 저장된다 (`out/` 은 커밋되지 않음).
- 종료 코드: `0` 실패 없음 · `1` 실패 있음 · `2` 검수를 끝까지 못 돌림.
- 자주 쓰는 옵션

| 옵션 | 뜻 |
|---|---|
| `-Widths 360,375,430` | 화면 폭만 골라서 (기본 320·360·375·390·412·430·768) |
| `-Skip viewer` | 묶음 건너뛰기 (`data`, `refs`, `alpha`, `viewer`) |
| `-ShowInfo` | 참고 항목까지 화면에 출력 |
| `-Port 8800` | 포트가 겹칠 때 |
| `-MainRef origin/main` | 원본 비교에 쓸 브랜치 |
| `-UpdateBaseline` | 기준 파일 다시 만들기 (아래 4절) |

브라우저로 직접 보고 싶으면 `powershell -ExecutionPolicy Bypass -File tools\qa\serve.ps1` 로 서버를 켜고
`http://localhost:8765/tools/qa/qa.html` 을 연다 (결과가 표로 보인다. 대소문자·main 비교는 run.ps1 을 한 번 돌린 뒤에 된다).

## 2. 검사 내용

| 묶음 | 검사 | 실패(fail) | 확인(warn) |
|---|---|---|---|
| **data** | 컷 수·번호 | 70컷이 아님, 1~70 순서가 아님 | 그림 컷인데 image·compose 없음 |
| | 이야기 필드 비교 — `ep01.baseline.json` 과 main 브랜치 둘 다 | `no, type, scene, datetime, lines, phone, text, desc` 와 회차 `title, speakers` 가 하나라도 다름 | 연출 필드 `kind, ratio, mood, transition, spacing, tone, endSpacing` 가 다름 (main 대비 차이는 한 줄 요약) |
| **refs** | 완성 컷·배경·레이어·SVG 모든 참조 | 파일 없음, **대소문자 다름**(GitHub Pages에서 깨짐), 확장자와 실제 형식 다름, 깨진 파일, 인물 목록에 없는 `@이름`, 인물·소품 레이어인데 알파 없는 WebP | 커밋 안 된 파일, imageSize 비율 불일치, 인물 목록 크기와 실제 크기 불일치 (좌표 재확인 필요) |
| | 인물 목록 `data/characters.js` | 쓰는 항목의 파일이 없음 | 안 쓰는 항목의 파일 없음·크기 불일치 |
| **alpha** | 인물·소품 투명 그림 (`assets/characters`, `assets/props` 레이어) | 투명한 곳이 1% 미만 (배경이 붙음), 인물 몸 안쪽 2% 넘게 불투명도 90% 미만 (비침) | 소품 반투명, 외곽 청록·빨강 테두리, 외곽 밝은 테두리(흰 배경 잔여), 떨어진 점 20개 초과 |
| | 자체 점검 | 일부러 망가뜨린 가짜 그림 7종을 예상대로 못 잡음 | |
| **viewer** | 실제 `index.html` 을 폭별로 띄워 끝까지 스크롤 | 그려진 컷 수가 데이터와 다름, 가로 스크롤, 화면 밖으로 넘친 요소, 깨진 그림, 빠진 조립 레이어 | `loading="lazy"` 없음, 첫 화면에서 화면 3개 아래 그림을 미리 받음, 그림 밖으로 나간 대사 상자, 15초 안에 못 불러온 그림, **글자 잘림**(줄 수 제한·overflow 로 안 보이는 대사·문자, 안 보이는 부분 추정 표시) |
| **compat** | 뷰어 CSS·HTML·JS 정적 검사 (iOS Safari·Android Chrome) | | 대체 없는 기능(aspect-ratio·inset·WebP)의 최소 버전, 최신 JS 문법, `-webkit-` 접두어 누락 |

참고(info) 항목: 분류 집계, 임시·교체 필요 그림을 쓰는 컷, 그림 가장자리에 닿은 몸(잘린 원본 의심), 불투명도 6% 이하 색 픽셀, 안 쓰는 인물 목록 항목, "그림 준비 중" 컷.

알파 기준값(몸 비침 2%, 색 테두리 40개, 밝은 테두리 2%·200개, 떨어진 점 20개)은 현재 1화 그림 32장이 통과하고 가짜 불량 그림은 걸리도록 맞췄다. 바꾸려면 `qa.js` 의 `checkAlpha`.

## 3. 원화를 교체한 뒤 다시 검수하는 순서

1. 새 그림을 **새 이름**으로 넣는다 (예: `assets/characters/hyoeun/stand-talk-official.webp`). 투명 PNG/WebP, 확장자와 실제 형식 일치.
2. `data/characters.js` 의 해당 항목 `src`·`size`·`status` 를 바꾼다. 한 장짜리 원화(key 컷)는 `assets/cuts/ep01/` 파일과 컷의 `imageSize` 를 바꾼다.
3. `git add` 로 새 파일을 스테이지한다 (안 하면 "커밋 안 된 파일" 확인 항목이 뜬다).
4. `powershell -ExecutionPolicy Bypass -File tools\qa\run.ps1` 실행.
5. 보는 순서
   - **실패 0** 인지 (종료 코드 0).
   - data: 이야기 필드 "다른 곳 없음" 두 줄 (기준 파일, main). 좌표만 고쳤다면 여기에 아무것도 안 떠야 한다.
   - refs: 새 그림의 "목록 크기와 실제 크기가 다름" 이 뜨면 `characters.js` 의 `size` 를 고치고 그 그림을 쓰는 컷 좌표를 다시 맞춘다.
   - alpha: 새 그림 이름으로 뜨는 항목. 비침·테두리·떨어진 점이 있으면 원본 제작자에게 돌려보낸다.
   - viewer: 모든 폭 "넘침·깨짐·빠진 레이어 없음".
6. 숫자로는 못 보는 것: 얼굴·의상이 공식 디자인과 같은지, 컷 안 인물 크기·위치, 말풍선 겹침. `tools/review.html?w=375` 나 실제 휴대폰으로 사람이 본다.

## 4. 기준 파일 (`ep01.baseline.json`)

이야기 필드의 "정답" 스냅샷. 커밋 `bf84c63` (ep01-full-direction) 데이터로 만들었고, 그때 main 의 이야기 필드 766개와 모두 같다.
대사·날짜·시간·장면을 **승인받아 바꾼 경우에만** 다시 만든다:

```
powershell -ExecutionPolicy Bypass -File tools\qa\run.ps1 -UpdateBaseline
```

그림·좌표 교체 때는 다시 만들지 않는다 (만들면 실수로 바뀐 대사를 못 잡는다).

## 5. 파일

| 파일 | 역할 |
|---|---|
| `run.ps1` | 한 번에 실행: git 파일 목록·main 데이터 꺼내기 → 서버 → 헤드리스 브라우저 → 결과 정리 |
| `device.ps1`, `device-probe.js` | 모바일 측정: 휴대폰 화면·CPU 감속·통신 속도 흉내 → 로딩·스크롤·메모리·잘림 (6절) |
| `known-issues.json` | 원인 확인된 알파 문제 목록 |
| `serve.ps1` | 로컬 서버 (저장소 루트, 결과 받기) |
| `qa.html`, `qa.js` | 검사 본체 (브라우저에서 실행) |
| `ep01.baseline.json` | 이야기 필드 기준 |
| `out/` | 실행 결과 (git 제외) |

헤드리스 브라우저는 실제 시간으로 돌아서 지연 로딩도 휴대폰과 같은 방식으로 확인한다. 실제 iOS Safari·안드로이드 화면은 이 도구로 확인되지 않는다.

## 6. 모바일 측정 (`device.ps1`)

```
powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1                  # 기기 5종, 약 4분
powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1 -Profiles iphone-se,galaxy-a
powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1 -Shots            # + 375px 컷별 캡처 70장 (out/shots/iphone-se)
powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1 -NoHas            # + :has() 미지원 흉내 경계 비교 (out/shots/no-has)
powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1 -Profiles narrow-320 -Shots -ShotProfile narrow-320   # 320px 측정·캡처
```

Edge(또는 Chrome)를 개발자 도구 프로토콜로 직접 조종해 휴대폰 화면 크기·픽셀 밀도·터치·User-Agent·CPU 감속·통신 속도를 흉내 낸다. 설치할 것 없음.

| 기기 프로필 | 화면 | CPU 감속 | 통신 |
|---|---|---:|---|
| `iphone-se` | 375×667 @2x | ×2 | 4G (9Mbps, 60ms) |
| `iphone-15` | 393×852 @3x | ×1 | 4G |
| `galaxy-a` | 360×800 @3x | ×4 | 4G |
| `pixel-7` | 412×915 @2.625x | ×2 | 4G |
| `slow-3g` | 375×667 @2x | ×4 | 3G (1.6Mbps, 300ms) |
| `narrow-320` (기본 실행에서 빠짐, `-Profiles` 로 지정) | 320×568 @2x | ×2 | 4G |

재는 것 (`out/device-report.txt`)
- **첫 화면**: DOM 준비, 가장 큰 그림 표시(LCP), 첫 화면에서 받은 그림 수·용량, 화면 3개 아래 그림을 미리 받았는지
- **스크롤**: 1200px/s 로 끝까지 내리며 프레임 간격(중앙·95%·최대), 50ms 넘는 프레임과 그 위치(컷), 긴 작업, 레이아웃 밀림(CLS), **빈 그림 대기**(컷이 화면에 들어왔는데 그림이 아직 없던 시간)
- **메모리**: JS 힙, 그림 디코딩 추정(파일별 가로×세로×4 바이트 — 전체 / 화면 주변 최대), DOM 수, 총 그림 용량
- **검사**: 가로 넘침, 글자 잘림, 그림 밖 말풍선, 깨진 그림, lazy 없는 그림, 12px 미만 글자

한계 — **반드시 함께 적을 것**
- 엔진은 Chromium 하나다. iOS Safari(WebKit) 결과가 아니고, 실제 휴대폰 결과도 아니다. User-Agent 만 iPhone 이다.
- 헤드리스 브라우저는 화면 주사율(60/120Hz)에 맞춰 그리지 않아 프레임 간격이 실제보다 짧다. "느린 프레임 개수·위치" 를 기기 간·수정 전후 비교에 쓴다.
- CPU 감속은 이 PC 기준 배수라 PC 가 바뀌면 숫자도 바뀐다. 같은 PC 에서 비교한다.
