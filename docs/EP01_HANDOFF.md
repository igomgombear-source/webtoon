# 《마지막 접속》 1화 70컷 — 작업 상태 및 인계 보고서

- 작성: Claude Code (2026-11-11)
- 저장소: `igomgombear-source/webtoon`
- 작업 브랜치: `ep01-full-direction` (기준: `ep01-cut19-seungmin-compose` ← `main` 3c791c9)
- **main 병합 금지 / 공개 배포 금지** (사용자 최종 검수 전)
- 이 문서만으로 다음 작업자(ChatGPT 총괄 세션 등)가 이어서 작업할 수 있도록 썼다.

---

## 0. 한 줄 요약

1화 **스크롤 연출(여백·배경 톤·장면 전환)은 70컷 전체에 적용 완료**.
**그림은 70컷 중 4컷(19·21·23·25)만 본편 수준 원화로 조립 완료**, 나머지 66컷 중 그림이 필요한 47컷은 **공식 원화(인물·배경·소품·key)가 없어 임시 컷 상태**다. text 19컷은 기존 휴대폰/검은 화면 UI로 완성 상태.

→ **1화는 아직 '완성 웹툰'이 아니다.** 연출 골격 + 일부 원화 상태.

---

## 1. 절대 고정 (변경 금지)

- 스토리, 대사 원문, 날짜·시각, 장면 순서, 반전 구조, phone UI 내용.
- 컷 수 70 / 분류 text 19 · compose 44 · key 7 (key = 01·03·04·27·33·61·70).
- 화풍: A안 단독 (섬세한 2D 선화 + 셀 채색, 사진·3D 금지).
- 승민: 공식 외형 + 짙은 갈색 재킷 + 올리브색 상의 + 짙은 청바지 + 흑백 운동화, **모든 장면 동일**.
- 공식 밤 음악실 배경(1536×768): 창문 왼쪽, 피아노 뒤 왼편, 칠판 정면, 수납장 오른쪽, 교탁 정면 아래. 구조 변경·다른 장소로 위장 금지.
- 1화에서 해인의 09:50 업무메일 본문 공개 금지 / 10/31 오전 강당에 해인 등장 금지 / 69컷 문상윤은 목소리만 / 70컷 범인·반전 노출 금지.
- 17번 보관함 · 파란 파일 17 · C-17 출입카드는 서로 다른 물체. 해인 폰 ≠ 승민 폰 (케이스·카메라 배열 다르게).
- 그림 속에 한글·숫자를 생성하지 말 것 (필요하면 SVG 텍스트 레이어로 후편집).
- 저해상도/후보 이미지를 최종 원화처럼 넣지 말 것. 후보는 파일명에 `-DRAFT` 를 붙이고 완성으로 보고하지 않는다.
- `참고_비공개` 이미지(승민 설정표, 해인 외형참고)는 **공개 저장소에 절대 커밋 금지**. 얼굴 비교용으로만.

> 검증 방법: 아래 §7 의 회귀 검사 명령으로 main 대비 대사·시간·장면 필드가 바이트 단위로 같은지 확인 (현재 445개 필드 동일).

---

## 2. 이번 작업에서 실제로 바뀐 것

| 파일 | 변경 | 비고 |
|---|---|---|
| `assets/characters/seungmin/sit-talk.webp` | 최신 승인본(1313×1342, RGBA)으로 교체 | 과거 1313×1198 버전 폐기. 원본 PNG를 브라우저에서 WebP(q0.9, 알파 유지)로 변환, 261,884 bytes. 모서리 알파 0 / 얼굴 알파 253 확인 |
| `assets/backgrounds/musicroom/night-wide.jpg` | 변경 없음 | 공식 `1000035291.png` 와 sha256 동일 (원본은 확장자만 png 인 JPEG) |
| `assets/overlays/musicroom-night-grade.svg` | 신규 | 밤 음악실 조명 보정 레이어 (따뜻한 빛 10% + 가장자리 어둠). 조립 컷 맨 위 레이어 |
| `data/ep01.js` | 70컷 전부 `mood` 추가, 일부 `spacing.after`/`transition` 조정, 19·21·23·25 `compose` 연결, `endSpacing` 900→1400 | 대사·시간·장면·phone 내용 무변경 |
| `js/app.js` | **+5줄**: 컷 `<section>` 과 장면 카드에 `data-mood` 속성 출력 (`moodAttr`) | 이유·영향 §5 |
| `css/style.css` | 끝에 "장면 분위기 (mood)" 섹션 추가 | mood 없는 컷은 이전과 동일하게 보임 |
| `tools/review.html` | 신규 | 휴대폰 폭으로 회차 전체를 펼쳐 구간 캡처하는 검수 창 |
| `README.md` | mood 항목, 새 폴더/도구 설명 | |
| `js/compose.js` | **수정 없음** | |

### 2-1. 제작 마스터 v2 와의 차이 (사용자 최신 지시 우선)
마스터 v2 §1 은 "기존 간격·전환 수정 금지"였으나, 사용자 최신 지시("컷 spacing, scene transition, tone, black/text 컷 활용을 적극 검토, 기존 데이터 필드 활용 선에서 여백과 톤 조정")에 따라 **`spacing.after`, `transition`, `endSpacing` 만** 조정했다. 대사·시간·순서는 그대로다. 되돌리려면 `git diff main -- data/ep01.js` 에서 `spacing`/`transition` 줄만 되돌리면 된다.

---

## 3. 70컷 상태표

범례: ✅ 완성(본편 수준) · 🎨 연출만 적용(그림 없음, 임시 컷 표시) · 📱 text UI 완성

| 컷 | 분류 | mood | 상태 | 필요한 것 |
|---:|---|---|---|---|
| 01 | key | corridor | 🎨 | key 원화: 문화회관 복도, 비식별 실루엣, 파란 파일 일부 |
| 02 | compose | corridor | 🎨 | BG01 관계자 통로(밝은 행사장 문틈 vs 어두운 통로, 인물 없음) |
| 03 | key | corridor | 🎨 | key 원화: 손 + 파란 파일 17 모서리 (숫자는 후편집) |
| 04 | key | corridor | 🎨 | key 원화: 계단참·발끝·난간 (BG02 구조 고정) |
| 05 | text | void | 📱 | — (검은 화면 '이틀 전') |
| 06 | compose | night | 🎨 | BG03 양평중 야간 외관 |
| 07 | compose | lamp | 🎨 | 해인 PNG + 승민 다른 자세 PNG (투샷) |
| 08 | compose | lamp | 🎨 | BG05 책상 클로즈업 + 악보 넘기는 손 |
| 09 | compose | lamp | 🎨 | P02 해인 폰 (음원 목록은 UI 레이어) |
| 10 | compose | lamp | 🎨 | BG06 17번 보관함 고해상도 (현재 배경 확대는 해상도 부족) + '17' SVG 라벨 |
| 11·12 | text | lamp | 📱 | — |
| 13 | compose | lamp | 🎨 | P06 갈색 봉투 + 사진 찍는 손 |
| 14 | text | lamp | 📱 | — |
| 15 | compose | lamp | 🎨 | 해인 PNG (폰 보는 자세) |
| 16 | text | lamp | 📱 | — |
| 17 | compose | lamp | 🎨 | 승민 PNG (서서 퇴근 준비, 가방 P07) |
| 18 | compose | lamp | 🎨 | 해인 PNG (말하는 미디엄) |
| **19** | compose | lamp | ✅ | 승민 바스트 + 음악실(칠판 쪽) + 조명 보정 |
| 20 | compose | lamp | 🎨 | 해인 PNG (폰 가리키는 손) |
| **21** | compose | lamp | ✅ | 승민 리액션(약간 확대, 왼쪽 여백) |
| 22 | compose | lamp | 🎨 | 해인 오버숄더 + 책상·폰·악보 |
| **23** | compose | lamp | ✅ | 승민 클로즈업 |
| 24 | compose | lamp | 🎨 | 해인 미디엄 (손짓) |
| **25** | compose | lamp-deep | ✅ | 승민 클로즈업(인물 오른쪽, 빈 왼쪽 여백으로 불안) |
| 26 | compose | lamp-deep | 🎨 | 해인 클로즈업 |
| 27 | key | lamp-deep | 🎨 | key 원화: 해인→승민 폰 전달 손 (61과 역방향) |
| 28 | compose | lamp-deep | 🎨 | 해인 + 승민(폰 소지) 투샷 |
| 29 | compose | morning | 🎨 | BG07 강당 외관 아침 |
| 30 | compose | morning | 🎨 | BG08 강당 실내 입구 + 학생군 베이스 |
| 31 | compose | morning | 🎨 | BG10 음향석 + P08 콘솔 + 해인 폰 |
| 32 | compose | morning | 🎨 | BG09 무대 + 학생군 |
| 33 | key | morning | 🎨 | key 원화: 합창 리허설 전경 (해인 없음) |
| 34 | compose | morning | 🎨 | 승민 미디엄(아침 조명) + BG10 |
| 35·36 | text | alert | 📱 | — |
| 37 | compose | morning | 🎨 | 승민 손·눈 (알림 열지 않음) |
| 38 | compose | morning | 🎨 | BG09 재사용 |
| 39 | compose | morning | 🎨 | 해인 폰 + 승민 손 (화면 끔) |
| 40 | compose | morning | 🎨 | BG09 다른 크롭 |
| 41 | compose | morning | 🎨 | BG09 후면 + 학생 |
| 42 | compose | morning | 🎨 | BG10 + P11 학교 PC |
| 43 | compose | morning | 🎨 | 승민 중경 + 해인 폰 |
| 44 | compose | drift | 🎨 | P12 벽시계 (시각은 SVG 후편집) |
| 45 | compose | drift | 🎨 | BG08 빈 입구 대칭 |
| 46 | compose | drift | 🎨 | 질문 학생 + 승민 |
| 47 | compose | drift | 🎨 | 승민 바스트(강당) — 승민 PNG 재사용 가능하나 **강당 배경 없음** |
| 48·49 | text | slate | 📱 | — |
| 50 | compose | slate | 🎨 | P02 + P03 두 폰 |
| 51~54 | text | slate | 📱 | — |
| 55 | text | frost | 📱 | — |
| 56 | compose | frost | 🎨 | 효은 PNG (입구 등장) + BG08 |
| 57·58·60 | compose | frost | 🎨 | 효은 PNG (미디엄/손짓/클로즈업) |
| 59 | compose | frost | 🎨 | 승민 + 효은 투샷 |
| 61 | key | cold-deep | 🎨 | key 원화: 승민→효은 폰 전달 (27과 역방향, 같은 폰) |
| 62 | compose | cold-deep | 🎨 | BG08 롱샷, 승민 혼자 |
| 63 | compose | home | 🎨 | BG11 승민 집 저녁 + 승민 |
| 64~67 | text | home | 📱 | — |
| 68 | text | hush | 📱 | — |
| 69 | compose | hush | 🎨 | BG12 집(아침 빛) + 승민 통화 자세 |
| 70 | key | void | 🎨 | key 원화: 승민 극클로즈업 |

집계: ✅ 4 · 📱 19 · 🎨 47 (compose 40 + key 7).

---

## 4. 누락 에셋 목록 (만들어야 할 것, 파일 경로 규칙 포함)

모든 인물은 투명 PNG/WebP, 같은 인물은 같은 축척. 그림 속 한글·숫자 금지.

**인물** `assets/characters/<인물>/<자세>-<표정>.webp`
- `haein/` 해인 (36세, C컬 옆가르마, 승민과 비슷한 키) — 최소: `sit-talk`, `sit-phone`(폰 보기), `sit-point`(폰 가리킴), `handoff`(폰 건넴) — 10/30 밤 음악실 전용
- `seungmin/` 승민 추가 자세 — `stand-leave`(17), `stand-wait`(43·62), `sit-console`(34·37), `phone-call`(69), 강당 아침용은 같은 PNG + 아침 조명 레이어로 해결 가능
- `hyoeun/` 효은 (10/31 강당 의상 1세트) — `stand-enter`, `stand-talk`, `stand-hand`
- `student/` 합창부 학생군 베이스 1~2장 + 질문 학생 1명

**배경** `assets/backgrounds/<장소>/<시간대>-<각도>.webp` (가로 1536 이상 권장, 세로 컷용은 세로 원본 필요)
- `hall-corridor/evening-wide` (BG01, 01·02), `stairs/evening-landing` (BG02, 04)
- `schoolgate/night-wide` (BG03, 06)
- `musicroom/night-desk` (BG05 책상 클로즈업, 08·09·13·15·22·27) — 공식 음악실과 같은 책상·악보
- `musicroom/night-locker` (BG06 보관함, 10) — 현재 배경을 3~4배 확대하면 해상도가 부족하므로 별도 원본 필요
- `auditorium/morning-exterior` (BG07), `auditorium/morning-entrance` (BG08), `auditorium/morning-stage` (BG09), `auditorium/morning-booth` (BG10)
- `home/evening-wide` (BG11), `home/morning-wide` (BG12, BG11 과 같은 공간)

**소품** `assets/props/<소품>.webp`
- `haein-phone`(앞·뒤·옆), `seungmin-phone`, `blue-file-17`, `brown-envelope`, `sheet-music`, `audio-console`, `school-pc`, `wall-clock`, `locker-17-label`(또는 SVG)

**key 원화** `assets/cuts/ep01/NN.webp` + `data/ep01.js` 에 `image: 'NN.webp', imageSize: { w, h }`
- 01 (3:4), 03 (1:1), 04 (3:4), 27 (4:5), 33 (16:9), 61 (4:5), 70 (4:5) — 비율은 현재 `ratio` 값 기준

**조명 보정 레이어** `assets/overlays/`
- `auditorium-morning-grade.svg`(서늘한 회백, 약한 청색), `auditorium-cold-grade.svg`(55~62), `home-evening-grade.svg`, `home-dawn-grade.svg` — `musicroom-night-grade.svg` 를 복사해 색만 바꾸면 된다

---

## 5. 뷰어/코드 수정 내역 (이유와 영향 범위)

**`js/app.js` (+5줄, 기존 동작 변경 없음)**
- `moodAttr(m)` 함수 추가, `renderScene(sc, mood)` 와 `renderCut` 의 `<section>` 에 `data-mood="..."` 속성 출력.
- 이유: 컷 사이 여백(컷 밖 공간)의 색을 장면별로 바꾸려면 CSS 가 컷의 장면을 알아야 한다. 기존 필드(`tone`)는 임시 컷 안쪽 색에만 쓰이고 phone/black 컷에는 없다. CSS 만으로 컷 번호(`#cut-NN`)에 색을 매기면 2화 이후에도 같은 번호에 1화 색이 걸리므로 회차 데이터에 두는 것이 맞다.
- 영향: `mood` 가 없는 컷/회차는 속성이 출력되지 않아 이전과 완전히 같다. `js/compose.js`, 내보내기 도구는 영향 없음.

**`css/style.css` (끝에 섹션 추가)**
- `.cut[data-mood]` 는 여백을 margin → padding 으로 바꿔 색이 칠해지게 함 (간격 값은 같음).
- 다음 요소의 mood 가 다르면 현재 컷의 `spacing.after` 구간 전체를 그라데이션으로 다음 색에 넘김 (`:has()` 사용. 미지원 브라우저 — iOS 15.3 이하 등 — 에서는 경계가 또렷하게 바뀔 뿐 내용은 정상).
- 등장 효과(fade)를 mood 컷에서는 내용에만 걸어 배경색이 항상 보이게 함.
- 밝은 mood(morning·drift·frost)는 글자·말풍선 테두리 색을 조정.

**`tools/review.html` (신규, 검수 전용)** — 본편에 영향 없음.

---

## 6. 연출 설계 (스크롤 리듬)

| 구간 | mood (색) | 의도 | 주요 여백 변경 (360px 기준) |
|---|---|---|---|
| 회차 제목→01~04 | corridor `#080a0f` | 흰 바탕이 아닌 "일이 벌어진 뒤의 공간". 장면 카드 상하 여백 확대 | 01·02 after 96, 03 after 120, 04 after 160(→검정으로 넘어감) |
| 05 이틀 전 | void `#000` | 검은 화면 + 520 높이 + 긴 뒤 여백으로 시간 단절 | after 220→320 |
| 06 | night `#0a1020` | 바깥 밤 (검정→남색 전환) | after 96 |
| 07~24 | lamp `#1b1612` | 따뜻한 실내등. 바깥 남색과 대비 | 17 after 72 (대화 진입 전 숨) |
| 25~28 | lamp-deep `#110e0c` | 휴대폰 전달 직전 조금씩 어두워짐. 25 승민 컷은 빈 왼쪽 여백 | 24→25→26 after 56→64→96, 27 slow + 96, 28 after 360 (밤→아침, 어둠에서 회백으로 긴 전환) |
| 29~34, 37~43 | morning `#e5e7ea` | 밝지만 흰색이 아닌 서늘한 회백. 정돈됐지만 어색한 공기 | 34 after 120, 40 after 160 (시간 경과), 43 after 240 |
| 35~36 | alert `#252b33` | 09:17 메시지에서 아침 속 한순간 어둠으로 꺼짐 → 다시 회백 | 35 after 64, 36 slow + 140 |
| 44~47 | drift `#ccd1d7` | 해인 부재. 흐린 청회색, 넓은 여백으로 시간 어긋남 | 44·45 after 120, 47 after 180 |
| 48~54 | slate `#283038` | 전화 불통·알림 재확인. 불안의 정점 | 49 after 140, 52 after 160, 54 after 260 |
| 55~60 | frost `#d2d9e1` | 효은 등장: 낮이지만 차가운 청색 | 55 after 96, 56 after 72, 60 after 96 |
| 61~62 | cold-deep `#343e4a` | 휴대폰을 넘긴 뒤 비어 버린 강당 | 61 slow + 120, 62 after 320 |
| 63~67 | home `#1c1a18` | 집 저녁, 정적 | 64 after 160, 65 slow, 67 after 420 |
| 68~69 | hush `#0b0c0e` | 11/2 아침 경찰 전화. 무거운 정적, 장면 카드 넓게 | 68 after 180, 69 slow + 260 |
| 70→끝 | void `#000` | 마지막 대사 후 검은 여백 1400 → '1화 끝' | endSpacing 900→1400 |

### 시선축 규칙 (음악실 대화 18~28)
- 승민 단독 컷은 **왼쪽을 본다** (승인된 19컷 기준) → 해인은 화면 왼쪽 밖에 있는 것으로 고정.
- 승민 단독 컷의 배경은 **칠판~수납장 쪽(원본 x ≈ 600~1500)** 을 보여 준다. 해인 단독 컷을 만들 때는 반대편 **창문~피아노 쪽(원본 x ≈ 0~800)** 을 배경으로 쓰고 해인은 오른쪽을 보게 한다.
- 승민 PNG 는 좌우 반전(`flip`) 금지 (가르마·지퍼 방향이 바뀜).
- 대화 컷은 같은 PNG 를 크롭만 바꿔 쓴다: 19 바스트(w 92) → 21 조금 확대(w 110) → 23 클로즈업(w 140) → 25 클로즈업 + 빈 왼쪽(w 125).

### 배경 크롭 방법 (compose.js 수정 없이)
`compose.bg` 는 항상 가운데 기준으로 채우므로, 다른 부분을 보이려면 배경을 **첫 번째 레이어**로 넣는다. 1:1 캔버스(900×900)에서 1536×768 배경은 `w ≥ 200` 이어야 세로가 찬다.
```
layers: [
  { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -80.2, y: 0, w: 200 },   // 배경 (x 로 좌우 위치)
  { src: 'assets/characters/seungmin/sit-talk.webp', x: 18, y: 5.9, w: 92 },       // 인물
  { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }  // 조명 보정 (4:5 면 h: 125)
]
```
배경을 2.5배 이상 확대하면 흐려지므로 클로즈업용 배경은 별도 원본을 만든다.

---

## 7. 테스트 방법과 결과

**로컬 실행**: 저장소 폴더에서 `python -m http.server 8000` → `http://localhost:8000/#ep01`

**375px 전체 스크롤 검수 캡처**: `http://localhost:8000/tools/review.html?w=375&from=0&h=3000` 의 `from` 을 3000씩 늘리며 캡처 (헤드리스 Chrome/Edge: `--headless=new --window-size=375,3000 --force-device-scale-factor=2 --virtual-time-budget=15000 --screenshot=...`).

**회귀 검사 (대사·시간·장면이 main 과 같은지)**
```
ext() { grep -oE "(text|body|title|time|date|place|name|status|who|desc|contact|clock|highlight|view|type|kind|owner|duration|from|app): '[^']*'" | tr -d '\r'; }
diff <(git show main:data/ep01.js | ext) <(ext < data/ep01.js) && echo SAME
grep -oE "kind: '(text|compose|key)'" data/ep01.js | sort | uniq -c   # compose 44 / key 7 / text 19
```

**이번 결과 (2026-11-11, Edge 헤드리스 375px·DPR2, 전체 높이 41,143px, 14구간)**
- 대사·시간·장면 필드 445개 main 과 동일, 컷 순서 1~70, 분류 19/44/7 유지.
- 19·21·23·25 조립 컷: 레이어 3개 모두 로딩, 승민 1313×1342 확인, 말풍선과 겹침 없음.
- mood 색 전환: 프롤로그 어둠 → 검정 '이틀 전' → 남색 → 음악실 → 아침 회백 → 09:17 어둠 → 부재 청회 → slate → frost → 집 → 검정 엔딩 순으로 끊김 없이 이어짐 확인.
- 가로 스크롤 없음. 임시 컷은 "핵심 컷/조립 컷 · 그림 준비 중" 표시가 그대로 보여 미완성임이 드러남 (의도).
- 미확인: 실제 iOS Safari / 안드로이드 실기기, `tools/export.html` 로 19·21·23·25 WebP 내보내기(SVG 레이어 포함) 결과.

---

## 8. 다음 작업 순서 (권장)

1. 해인 PNG 4종 확보 → 07·15·18·20·22·24·26·28 조립 (위 시선축 규칙). 이것만으로 음악실 장면(06~28)이 대부분 완성된다.
2. key 27 원화 → 음악실 장면 완성.
3. 강당 배경 4종 + 학생군 + 효은 → 29~62. 아침 조명 레이어 추가.
4. 문화회관 BG01·BG02 + key 01·03·04 → 프롤로그.
5. 집 BG11·BG12 + key 70 → 엔딩.
6. 각 단계마다 §7 회귀 검사 + 375px 캡처. 완성 컷만 ✅ 로 표에 반영.
7. 전부 끝난 뒤 `tools/export.html` 로 조립 컷 WebP 내보내기 → `useExportedCuts: 'mobile'` 검토.
8. 사용자 최종 검수 후에만 main 병합.

## 9. main 병합 전 주의사항
- `참고_비공개` 이미지가 커밋에 섞이지 않았는지 `git log --stat main..HEAD` 로 확인.
- 임시 컷(🎨)이 남아 있으면 공개 사이트에 그대로 "그림 준비 중"이 보인다. 완성 전 병합 금지.
- `spacing`/`transition` 조정은 마스터 v2 §1 과 다르다 (§2-1). 총괄 승인 필요.
- `:has()` 미지원 구형 브라우저에서는 장면 색 경계가 그라데이션 없이 바뀐다.
- `assets/characters/seungmin/sit-talk.webp` 는 파일명이 같고 내용만 바뀌었다. 브라우저 캐시 주의.
