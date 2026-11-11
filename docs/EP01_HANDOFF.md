# 《마지막 접속》 1화 70컷 — 작업 상태 및 인계 보고서

- 작성: Claude Code (2026-11-11)
- 음악실 원화·소품 적용 및 검증: Codex (2026-11-11)
- 강당 원화·소품 적용 및 검증: Codex (2026-11-11)
- 프롤로그·엔딩 원화 적용 및 전체 뷰어 검증: Codex (2026-11-11)
- 저장소: `igomgombear-source/webtoon`
- 작업 브랜치: `ep01-full-direction` (기준: `ep01-cut19-seungmin-compose` ← `main` 3c791c9)
- **main 병합 금지 / 공개 배포 금지** (사용자 최종 검수 전)
- 이 문서만으로 다음 작업자(ChatGPT 총괄 세션 등)가 이어서 작업할 수 있도록 썼다.

---

## 0. 한 줄 요약

1화 70컷에 **원화 51컷과 text UI 19컷**을 연결했다. 뷰어의 그림 미적용 컷은 0개다.
음악실의 해인 외형은 정본 교체 대기 상태다. 외형 교체 범위는 07·15·18·20·22·24·26·28컷이며, 의상이 바뀌면 08·13·27컷의 소매도 맞춘다. [해인 교체 범위](HAEIN_REPLACEMENT.md)
강당 56~61컷의 효은 외형은 공식 디자인과 달라 교체가 필요하고, 학생 합창단(30·32·33·38·40·41·46컷)은 화풍 교체 후보다. [1화 미술 QA](EP01_ART_QA.md)

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

## 2. 음악실 적용 전 작업 내역 (`802cd1c` 기준)

| 파일 | 변경 | 비고 |
|---|---|---|
| `assets/characters/seungmin/sit-talk.webp` | 최신 승인본(1313×1342, RGBA)으로 교체 | 과거 1313×1198 버전 폐기. 원본 PNG를 브라우저에서 WebP(q0.9, 알파 유지)로 변환, 261,884 bytes. 모서리 알파 0 / 얼굴 알파 253 확인 |
| `assets/characters/haein/sit-talk.webp` | 신규 (2차 작업) | 해인 공식 대화 포즈 1656×1220 RGBA → WebP q0.9, 160,196 bytes, 알파 유지 확인. 화면 오른쪽을 보는 대화 표정, 손·휴대폰 없음 |
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

### 2-2. 음악실 06~28컷에 적용한 원화와 소품

공식 음악실 배경과 해인·승민의 `sit-talk.webp`를 바탕으로 A안 선화, 셀 채색, 밤 실내 조명에 맞춰 원화를 제작했다. 해인 폰은 회보라색 무광 케이스와 좌상단의 대각선 듀얼 렌즈를 사용한다. 27컷은 화면 왼쪽의 해인에서 오른쪽의 승민으로 건네며, 61컷은 같은 폰을 반대 방향으로 건넨다.

| 컷 | 적용 파일과 작화 지시 |
|---:|---|
| 06 | `assets/backgrounds/schoolgate/night-wide.webp` — 10월 밤, 교문 너머로 음악실 창만 따뜻하게 켜진 학교 외관 |
| 07·22 | `assets/props/musicroom-desk-rehearsal.webp` — 공식 교실 책상과 같은 꿀색 상판, 악보 두 장, 화면을 끈 해인 폰. 22는 `assets/characters/haein/over-shoulder.webp`로 해인 어깨 너머 승민을 봄 |
| 08·09·13 | `assets/backgrounds/musicroom/night-desk.webp` — 앰버 조명이 닿는 같은 책상 상판을 다른 거리로 사용 |
| 08 | `assets/props/sheet-music-turn.webp` — 아이보리 니트 소매, 악보 가장자리를 집어 넘기는 손 |
| 09 | `assets/props/haein-phone-front.webp`와 `assets/overlays/haein-phone-playlist.svg` — 정면 폰과 재생목록. 곡명·재생 시각 없이 순서 표시 |
| 10 | `assets/backgrounds/musicroom/night-locker.webp`와 `assets/overlays/locker-17-label.svg` — 기존 오른쪽 수납장 하부와 금속 명판의 `17` |
| 13 | `assets/props/brown-envelope.webp`, `assets/props/haein-phone-camera-hand.webp`, `assets/overlays/haein-phone-camera.svg` — 갈색 봉투와 폰을 들어 촬영하는 손. 뷰파인더 안에도 같은 봉투를 재사용 |
| 15 | `assets/characters/haein/sit-phone.webp` — 해인이 자기 폰을 내려다보며 메시지를 확인 |
| 17 | `assets/characters/seungmin/stand-leave.webp` — 승민이 가방을 챙기는 전신, 기존 의상과 운동화 |
| 20 | `assets/characters/haein/sit-point.webp` — 해인이 폰을 들고 반대쪽 검지로 가리킴 |
| 24 | `assets/characters/haein/sit-explain.webp` — 창가 쪽 미디엄 와이드에서 한 손을 펴 설명 |
| 27 | `assets/cuts/ep01/27.webp` — 1120×1400 독립 원화, 아이보리 소매의 손이 폰을 내밀고 갈색 소매의 손이 받침 |
| 28 | `assets/characters/seungmin/sit-hold-phone.webp` — 승민이 받은 폰의 뒷면과 손이 보이는 투샷, 위쪽 방 여백 유지 |

인물·소품은 투명 WebP를 사용한다. 재생목록, 보관함 번호, 카메라 조작 화면은 SVG 레이어이며 `assets/overlays/contact-shadow.svg`는 책상과 바닥 그림자에 공통으로 쓴다.

### 2-3. 강당 29~62컷에 적용한 원화와 소품

첨부 ZIP의 분할 18장과 별도 33컷 후보를 검토했다. `ep01_cut33_stage_candidate.webp`의 합창대·피아노 배치, `set_a_r1c1.webp`의 외관 시점, `set_b_r1c1.webp`의 출입구 깊이만 참고했다. 본편에는 같은 2D 선화와 서늘한 아침 자연광을 적용한 새 원화를 사용했다.

| 컷 | 적용 파일과 작화 지시 |
|---:|---|
| 29 | `assets/backgrounds/auditorium/morning-exterior.webp` — 10/31 아침, 학교 교정의 낮은 강당 외관 |
| 30·45·56·62 | `assets/backgrounds/auditorium/morning-entrance.webp`와 `morning-entrance-front.webp` — 뒤편 왼쪽 목재 출입문, 문 아래로 들어오는 자연광, 회갈색 객석. 30은 `assets/characters/student/choir-enter.webp`로 합창부 입장, 45는 빈 문 정면, 62는 `assets/characters/seungmin/stand-alone.webp`로 혼자 남은 승민 |
| 31·39·50 | `assets/backgrounds/auditorium/booth-desk.webp` — 회갈색 음향석 상판. `assets/props/auditorium-phone-connect.webp`는 연결하는 손과 콘솔, `haein-phone-screen-off.webp`는 케이블을 꽂은 채 옆 버튼으로 화면을 끄는 손, `haein-phone-back.webp`와 `seungmin-phone-back.webp`는 두 기기의 후면 |
| 32·38 | `assets/backgrounds/auditorium/morning-stage.webp`와 `assets/characters/student/choir-sing.webp` — 왼쪽 그랜드피아노, 와인색 커튼, 3단 받침대, 동일 교복을 입은 학생 합창단 |
| 33 | `assets/cuts/ep01/33.webp` — 1664×936 독립 원화. 객석과 음향석 너머 3열 학생 합창단, 피아노와 무대의 거리감 |
| 34·37·43 | `assets/backgrounds/auditorium/morning-booth.webp` — 뒤편 오른쪽 음향석. `assets/characters/seungmin/`의 `sit-check-score.webp`, `sit-glance-phone.webp`, `stand-wait-phone.webp`로 악보 확인, 알림을 흘깃 보는 표정, 해인 폰을 들고 기다리는 자세 |
| 40·41 | `assets/cuts/ep01/40-rehearsal.webp`와 `41-dismissal.webp` — 같은 합창단의 측면 연습, 뒤쪽 객석에서 본 학생 퇴장 |
| 42 | `assets/backgrounds/auditorium/booth-copy.webp`와 `assets/overlays/auditorium-audio-copy.svg` — 학교 PC에 연결된 해인 폰과 음원 복사 표시 |
| 44 | `assets/backgrounds/auditorium/clock-wall.webp`, `assets/props/auditorium-clock-frame.webp`, `assets/overlays/auditorium-clock-1030.svg` — 10시와 11시 중간의 시침, 6을 가리키는 분침 |
| 46·47 | `assets/characters/student/choir-question.webp`와 기존 승민 `sit-hold-phone.webp`, `sit-talk.webp` — 악보집을 든 학생의 질문과 승민의 답변 |
| 56~60 | `assets/characters/hyoeun/`의 `stand-enter.webp`, `stand-talk.webp`, `stand-gesture.webp`, `stand-listen.webp`, `stand-look-aside.webp` — 효은 등장, 설명, 빈손 손짓, 승민 질문을 듣는 표정, 시선을 낮춘 대답. 59는 `assets/characters/seungmin/stand-question-phone.webp`와 투샷 |
| 61 | `assets/cuts/ep01/61.webp` — 1120×1400 독립 원화. 화면 오른쪽 승민의 짙은 갈색 재킷 소매에서 왼쪽 효은의 청회색 코트 소매로 해인 폰을 건넨다 |

> **2026-11-11 미술 QA: 아래 효은 외형은 승인된 공식 디자인(블루그레이 짧은 재킷, 흰 셔츠, 검은 슬랙스, 낮게 묶은 머리, 교직원 명찰)과 다르다. 56~61컷 교체 필요 — [1화 미술 QA 문서](EP01_ART_QA.md) 1절.**

효은은 제작 마스터의 교사 설정에서 기준화를 새로 만들었다. 낮게 묶은 흑발과 청회색 코트, 밝은 회색 목폴라로 56~61컷의 외형을 통일한다. 승민 폰은 각진 흑연색 케이스와 세로형 단일 렌즈, 해인 폰은 음악실과 같은 회보라색 케이스와 대각선 듀얼 렌즈를 사용한다.

### 2-4. 프롤로그 01~04컷과 엔딩 63·69·70컷에 적용한 원화

| 컷 | 적용 파일과 작화 지시 |
|---:|---|
| 01 | `assets/cuts/ep01/01.webp` — 18:34 문화회관 복도, 공연장 문틈의 황색 빛, 먼 실루엣과 파란 파일 가장자리 |
| 02 | `assets/backgrounds/hall-corridor/evening-wide.webp` — 비어 있는 관계자 통로와 끝쪽의 계단 입구 |
| 03 | `assets/cuts/ep01/03.webp`와 `assets/overlays/blue-file-17-label.svg` — 정체를 알 수 없는 손과 파일의 모서리, 명판의 `17`을 별도 SVG로 적용 |
| 04 | `assets/cuts/ep01/04.webp` — 복도 끝의 계단참을 아래에서 본 난간과 익명의 발끝 |
| 63 | `assets/backgrounds/home/evening-wide.webp`와 기존 `@seungmin/stand-leave` — 저녁에 돌아온 승민, 현관과 조명이 켜진 거실 |
| 69 | `assets/backgrounds/home/morning-wide.webp`와 `assets/characters/seungmin/phone-call.webp` — 같은 거실의 아침 빛, 흑연색 폰으로 전화를 받는 승민, 경찰의 기존 음성 대사 |
| 70 | `assets/cuts/ep01/70.webp` — 같은 통화에서 굳은 승민의 얼굴과 폰 가장자리 클로즈업 |

01~04컷의 문화회관은 학교 강당과 별도 공간이다. 63·69컷의 거실은 가상의 같은 공간이며 시간에 따라 조명을 바꿨다. 03컷은 key 분류를 유지하면서 독립 원화 위에 SVG를 표시한다.

---

## 3. 70컷 상태표

범례: ✅ 원화 적용 및 검수 · 🔄 원화 적용, 해인 외형 교체 대기 · ⛔ 원화 적용, 공식 디자인과 달라 교체 필요 · 🎨 원화 적용, 화풍 교체 후보 · 🔍 교체 그림 적용, 총괄 QA 대기 · 📱 text UI

| 컷 | 분류 | mood | 상태 | 필요한 것 |
|---:|---|---|---|---|
| 01 | key | corridor | ✅ | 문화회관 복도, 비식별 실루엣과 파란 파일 일부 |
| 02 | compose | corridor | ✅ | 밝은 행사장 문틈과 빈 관계자 통로 |
| 03 | key | corridor | ✅ | 손과 파란 파일 모서리, `17` SVG |
| 04 | key | corridor | ✅ | 계단참·발끝·난간 |
| 05 | text | void | 📱 | — (검은 화면 '이틀 전') |
| 06 | compose | night | ✅ | BG03 양평중 야간 외관 |
| 07 | compose | lamp | 🔄 | 해인·승민 투샷과 책상 위 악보·해인 폰 |
| 08 | compose | lamp | ✅ | BG05 책상 클로즈업과 악보 넘기는 손 |
| 09 | compose | lamp | ✅ | P02 해인 폰 정면과 재생목록 SVG |
| 10 | compose | lamp | ✅ | BG06 보관함 클로즈업과 `17` SVG 명판 |
| 11·12 | text | lamp | 📱 | — |
| 13 | compose | lamp | ✅ | P06 갈색 봉투와 촬영하는 손, 뷰파인더 SVG |
| 14 | text | lamp | 📱 | — |
| 15 | compose | lamp | 🔄 | 휴대폰을 내려다보는 해인 |
| 16 | text | lamp | 📱 | — |
| 17 | compose | lamp | ✅ | 가방을 챙겨 일어선 승민 |
| **18** | compose | lamp | 🔄 | 해인 미디엄 + 음악실(창문·피아노 쪽) |
| **19** | compose | lamp | ✅ | 승민 바스트 + 음악실(칠판 쪽) + 조명 보정 |
| 20 | compose | lamp | 🔄 | 자기 휴대폰을 가리키는 해인 |
| **21** | compose | lamp | ✅ | 승민 리액션(약간 확대, 왼쪽 여백) |
| 22 | compose | lamp | 🔄 | 해인 어깨 너머의 승민과 책상 위 폰·악보 |
| **23** | compose | lamp | ✅ | 승민 클로즈업 |
| **24** | compose | lamp | 🔄 | 밤 창가의 해인 미디엄 와이드와 설명하는 손짓 |
| **25** | compose | lamp-deep | ✅ | 승민 클로즈업(인물 오른쪽, 빈 왼쪽 여백으로 불안) |
| **26** | compose | lamp-deep | 🔄 | 해인 클로즈업 |
| 27 | key | lamp-deep | ✅ | 해인→승민 폰 전달 독립 원화 (61과 역방향) |
| 28 | compose | lamp-deep | 🔄 | 승민의 손에 해인 폰이 보이는 투샷과 위쪽 방 여백 |
| 29 | compose | morning | ✅ | 08:58 강당 외관 |
| 30 | compose | morning | 🎨 | 강당 입구로 들어오는 합창부 |
| 31 | compose | morning | ✅ | 해인 폰과 음향 콘솔을 연결하는 손 |
| 32 | compose | morning | 🎨 | 09:00 무대에서 리허설 시작 |
| 33 | key | morning | 🎨 | 학생 합창 리허설 전경 독립 원화 |
| 34 | compose | morning | ✅ | 음향석에서 악보를 보는 승민 |
| 35·36 | text | alert | 📱 | — |
| 37 | compose | morning | ✅ | 알림에 시선이 멈추는 승민 |
| 38 | compose | morning | 🎨 | 계속되는 합창 |
| 39 | compose | morning | ✅ | 해인 폰의 옆 버튼을 눌러 화면을 끄는 승민 |
| 40 | compose | morning | 🎨 | 연습 중 악보를 넘기는 학생들, 무대 측면 |
| 41 | compose | morning | 🎨 | 10:15 리허설 종료 후 무대를 내려오는 학생들 |
| 42 | compose | morning | ✅ | 학교 PC 음원 복사와 연결된 해인 폰 |
| 43 | compose | morning | ✅ | 반환할 폰을 들고 기다리는 승민 |
| 44 | compose | drift | ✅ | 10:30 벽시계와 SVG 시곗바늘 |
| 45 | compose | drift | ✅ | 빈 강당 출입문 정면 |
| 46 | compose | drift | 🎨 | 해인이 언제 오는지 묻는 학생과 듣는 승민 |
| 47 | compose | drift | ✅ | 학생에게 답하는 승민 |
| 48·49 | text | slate | 📱 | — |
| 50 | compose | slate | ✅ | 케이스와 카메라가 다른 두 폰 |
| 51~54 | text | slate | 📱 | — |
| 55 | text | frost | 📱 | — |
| 56 | compose | frost | ⛔ | 10:50 강당 입구에 나타난 효은 — 공식 의상 전신(v5 팩) 적용, 안경 없음 → 안경 쓴 그림으로 다시 교체 |
| 57·58·60 | compose | frost | ⛔ | 효은의 설명, 빈손 손짓, 시선을 낮춘 답변 |
| 59 | compose | frost | ⛔ | 해인 폰을 들고 묻는 승민과 듣는 효은 |
| 61 | key | cold-deep | ⛔ | 10:52 승민→효은 해인 폰 전달 독립 원화 |
| 62 | compose | cold-deep | ✅ | 강당에 혼자 남아 빈 문을 보는 승민 |
| 63 | compose | home | ✅ | 저녁에 집 현관에 들어선 승민 |
| 64~67 | text | home | 📱 | — |
| 68 | text | hush | 📱 | — |
| 69 | compose | hush | ✅ | 아침 거실에서 경찰 전화를 받는 승민 |
| 70 | key | void | ✅ | 통화 중 승민 극클로즈업 |

집계는 원화 51컷(검수 30, 해인 외형 교체 대기 8, 효은 외형 교체 필요 6, 화풍 교체 후보 7)과 text UI 19컷이다. 효은·화풍 판정 근거는 [1화 미술 QA 문서](EP01_ART_QA.md)에 있다.

---

## 4. 해인 정본 교체 대기

외형 정본을 확보하면 `data/characters.js`의 해인 항목을 교체한다. 컷별 범위와 투명 원본 규격은 [해인 교체 문서](HAEIN_REPLACEMENT.md)에 있다.

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
- 캡처 창은 지연 로딩을 끄고 모든 그림을 불러오고 디코딩한 뒤 제목을 `ready <높이> missing=<빠진 레이어가 있는 컷|none>` 으로 바꾼다. 로컬 서버가 느리면 레이어가 빠질 수 있으므로 서버 없이 `file://` + `--allow-file-access-from-files` 로 여는 것이 가장 안정적이다.

**회귀 검사 (대사·시간·장면이 main 과 같은지)**
```
ext() { grep -oE "(text|body|title|time|date|place|name|status|who|desc|contact|clock|highlight|view|type|kind|owner|duration|from|app): '[^']*'" | tr -d '\r'; }
diff <(git show main:data/ep01.js | ext) <(ext < data/ep01.js) && echo SAME
grep -oE "kind: '(text|compose|key)'" data/ep01.js | sort | uniq -c   # compose 44 / key 7 / text 19
```

**이전 결과 (`802cd1c`, Edge 헤드리스 375px·DPR2)**
- 대사·시간·장면 필드 445개 main 과 동일, 컷 순서 1~70, 분류 19/44/7 유지.
- 19·21·23·25 조립 컷: 레이어 3개 모두 로딩, 승민 1313×1342 확인, 말풍선과 겹침 없음.
- mood 색 전환: 프롤로그 어둠 → 검정 '이틀 전' → 남색 → 음악실 → 아침 회백 → 09:17 어둠 → 부재 청회 → slate → frost → 집 → 검정 엔딩 순으로 끊김 없이 이어짐 확인.
- 가로 스크롤 없음. 임시 컷은 "핵심 컷/조립 컷 · 그림 준비 중" 표시가 그대로 보여 미완성임이 드러남 (의도).
- 미확인: 실제 iOS Safari / 안드로이드 실기기, `tools/export.html` 로 19·21·23·25 WebP 내보내기(SVG 레이어 포함) 결과.

**음악실 적용 결과 (2026-11-11, 로컬 Edge)**

- `main` 기준 대사·시각·장면·휴대폰 UI 데이터와 `802cd1c` 기준 비율·여백·등장 효과·mood를 비교했다. 70컷 순서와 분류 19/44/7이 일치한다.
- 360·375·430·960px 뷰어에서 원화 19컷과 UI 19컷 로딩, 남은 임시 컷 32개, 가로 넘침 없음 확인. 375px에서 변경한 13컷의 구도와 텍스트를 확인했다. `tools/review.html`은 `ready 41143 missing=none`을 반환했다.
- `tools/export.html`에서 조립 18컷을 SVG와 함께 합성했다. 09·10·13컷의 WebP 다운로드도 검증했다. 모바일 실기기 검수는 전체 원화 적용 후 진행한다.

**강당 적용 결과 (2026-11-11, 로컬 Edge)**

- 29~62컷에 조립 23컷과 key 2컷을 연결했다. 360·375·430·960px에서 원화 44컷과 UI 19컷이 로드됐고, 가로 넘침과 말풍선 겹침이 없었다. 375px에서 강당 그림 컷 25개의 구도와 텍스트를 확인했다.
- `tools/review.html`은 `ready 41143 missing=none`을 반환했다. `tools/export.html`에서 조립 41컷을 SVG와 함께 합성했고, 32·42·44·59컷의 WebP 다운로드를 검증했다.
- 대사·시각·장면·휴대폰 UI는 `main`, 컷 비율과 스크롤 연출은 `c2d54f6`과 일치한다. 70컷의 순서와 분류(text 19 · compose 44 · key 7)를 확인했다.
- 33컷 무대에는 합창부 학생만 등장한다. 37컷에서 승민은 09:17 알림을 흘깃 보고, 39컷에서 화면을 끈다. 53컷은 10:35 잠금화면에 남은 기존 09:17 알림이다. 61컷에서 27컷과 같은 폰을 반대 방향으로 넘긴다.

**1화 전체 연결 결과 (2026-11-11, 로컬 Edge)**

- 360·375·430·960px에서 원화 51컷과 UI 19컷이 로드됐다. 그림 미적용, 누락 레이어, 가로 넘침, 대사 겹침은 각각 0개였다. 375px에서 01~04·63·69·70컷을 추가로 시각 검수했다.
- `tools/review.html`은 `ready 41143 missing=none`을 반환했다. `tools/export.html`의 레이어 사용 컷 45개에서 저장 링크를 확인했고 03·42·44·59·69컷을 WebP로 다운로드했다.
- 원문·시간·날짜·장면·휴대폰 UI는 `main`과 일치한다. 컷 비율과 여백, 전환, mood도 강당 적용 커밋 `ddf2dbb`와 일치한다. 문화회관의 18:34 표시, 03컷 파일 번호, 69컷의 경찰 음성 대사와 70컷의 마지막 대사를 대조했다.

---

## 8. 다음 작업 순서 (권장)

1. 효은 공식 디자인(안경 착용)으로 56~60컷 투명 그림 교체, 61컷 재작화 (56컷 v5 그림은 안경이 없어 다시 교체) ([1화 미술 QA](EP01_ART_QA.md)).
2. 학생 합창단 화풍 교체 여부 결정 (46컷 우선).
3. 해인 외형 정본 적용 및 해당 컷의 구도 재검수.
4. 1화 전체 모바일 실기기 및 사용자 최종 검수.

## 9. main 병합 전 주의사항
- `참고_비공개` 이미지가 커밋에 섞이지 않았는지 `git log --stat main..HEAD` 로 확인.
- 해인 정본 교체와 사용자 최종 검수는 작업 브랜치에서 진행한다.
- `spacing`/`transition` 조정은 마스터 v2 §1 과 다르다 (§2-1). 총괄 승인 필요.
- `:has()` 미지원 구형 브라우저에서는 장면 색 경계가 그라데이션 없이 바뀐다.
- `assets/characters/seungmin/sit-talk.webp` 는 파일명이 같고 내용만 바뀌었다. 브라우저 캐시 주의.

---

## 10. 해인 교체 준비 · 기술 검수 (Claude Code, 2026-11-11, `c2d54f6` 이후)

아래 기술 검수 결과는 해인 교체 준비 커밋 `33eddfa` 시점의 이력이다.

**해인 교체 준비** — 자세한 내용은 `docs/HAEIN_REPLACEMENT.md`.
- 인물 그림 경로를 `data/characters.js` 한 곳에서 관리하도록 바꿨다. `data/ep01.js` 의 인물 레이어는 `src: '@haein/sit-talk'` 처럼 이름으로 부른다 (경로 문자열 18곳만 바뀜, 좌표·대사·시간·비율 무변경).
- `js/compose.js` 의 `resolve()` 에 `@이름` 처리를 추가했다 (5절의 "compose.js 수정 없음"은 이 커밋부터 해당하지 않음). 목록에 없는 이름은 불러오기 실패로 처리되어 `missing` 에 이름 그대로 나온다.
- `index.html`, `tools/export.html` 에 `data/characters.js` 를 불러오는 줄을 추가했다 (`tools/review.html` 은 index.html 을 띄우므로 자동 적용).
- 해인 그림 파일은 지우거나 고치지 않았다.

**기술 검수 결과** (로컬 서버 + Edge 헤드리스)
- 대사·시각·장면 필드 445개 main 과 동일, 컷 순서 1~70, 분류 text 19 / compose 44 / key 7, 비율 main 과 동일.
- 참조 에셋 23개(레이어 22 + key 27) 모두 저장소에 있음, 대소문자까지 경로 일치. 확장자와 실제 형식 일치 (webp=RIFF/WEBP, jpg=JPEG, svg=XML).
- 조립 컷 18개를 변경 전 데이터와 픽셀 단위로 비교: 18/18 동일 (중앙 관리 전환으로 화면이 바뀌지 않음).
- 320·360·375·390·412·430·768px: 가로 넘침 없음, 깨진 그림 0, 빠진 레이어 0, 원화 표시 19컷, 임시 컷 32개는 "그림 준비 중" 그대로 표시.
- 지연 로딩: 그림 65개 모두 `loading="lazy"`. 실시간 헤드리스 375px 에서 첫 화면(첫 그림이 4237px 아래)일 때 요청 0개, 끝까지 스크롤 후 65/65 로딩.
- 미확인: 실제 iOS Safari·안드로이드 실기기.

## 11. 최종 미술 QA 준비 (Claude Code, 2026-11-11, `bc4071e` 이후)

자세한 내용은 `docs/EP01_ART_QA.md`.
- 효은(56~61컷): 공식 디자인과 의상이 달라 교체 필수. 56~60은 `data/characters.js` 의 `hyoeun/…` 파일 5장 교체, 61은 한 장짜리 원화라 재작화. 승인된 효은 이미지가 없어 새 얼굴은 만들지 않았다.
- 투명 외곽 잔여 픽셀: 투명 그림 32개 검사, 눈에 보이는 청록·빨강 잔여 0. 색은 불투명도 6% 이하 외곽에만 있다. 지우려면 손실 압축 WebP 전체를 다시 압축해야 해서 자동 보정 대상에서 뺐다. **보정한 파일 0개**.
- 화풍 차이: 학생 합창단(30·32·33·38·40·41·46, 46 우선)이 굵은 선·셀 채색의 애니풍이라 교체 후보로 분류. 44 시계·29 외관·소품 렌더는 참고 사항.
- `data/characters.js`: 효은 5장 `status: 'replace'`, 학생 3장에 화풍 메모 추가. 상태 값 `'replace'` 설명 추가. 화면·좌표·대사·순서·시각·UI·연출 변경 없음.
- 해인은 실제 사진을 받을 때까지 임시 버전 유지.

### 11-1. 효은 v5 팩 적용 (2026-11-11)

- `ep01_hyoeun_asset_pack_v5.zip` 의 `hyoeun_stand_enter_official.webp` (538×1773, 무손실 WebP, 투명)를 `assets/characters/hyoeun/stand-enter-official.webp` 로 추가하고 `@hyoeun/stand-enter` 가 이 파일을 쓰게 했다. 이전 `stand-enter.webp` 는 비교용으로 남겼다.
- 56컷 좌표만 `x 36.2, y 28, w 21.6` → `x 36, y 25.1, w 23.04`. 새 그림의 투명 여백이 넓어서, 인물 키(캔버스 폭의 70.5%)·발 위치(98.9%)·몸 중심(47%)을 이전과 같게 다시 계산했다. 대사·시각·순서·비율 변경 없음.
- 외곽 검사: 보이는 잔여 픽셀 0, 불투명도 6% 이하 색 픽셀 148개 (이전 934개).
- 팩의 `cut56~61_sheet_crop_draft.webp` 는 배경과 다른 인물이 합쳐진 장면 참고용이라 쓰지 않았다 (팩 README도 같은 내용).
- `cut61_handoff_candidate.webp` 는 적용하지 않았다. 문제점은 `docs/EP01_ART_QA.md` 1절.
- 지금 상태에서는 56컷만 새 효은(갈색 머리·짧은 재킷)이고 57~61컷은 이전 효은(흑발·긴 코트)이라, 한 장면 안에서 외형이 이어지지 않는다.

## 12. 2인 체제 전환 · 검수 도구 통합 · 공식 인물 설정 (2026-11-11)

- 제작 체제: ChatGPT High(원화 제작) + Claude Code(통합·검수). Work(솔)는 사용량 부족으로 중단. Work(Codex)의 마지막 반영 커밋은 `bc4071e` (프롤로그·엔딩 7컷). 효은 57~61컷 작업은 푸시되지 않았다.
- `ep01-qa-automation` 의 자동 검수 도구(`tools/qa/`)를 이 브랜치에 빨리감기(fast-forward)로 통합했다. 충돌 없음. 사용법은 `tools/qa/README.md`.
- 사용자 확정 인물 설정을 `data/cast.js` 에 저장 (최기훈·서진석·임효은·권해인). 검수 도구가 그림 목록의 안경 유무와 비교한다.
- 56컷 효은 그림은 안경이 없어 다시 교체 대상(⛔)으로 돌렸다. 그림·스토리·좌표는 바꾸지 않았다.
- ChatGPT High 의 새 원화는 받으면 `tools/qa/README.md` 3절 순서대로 검수한 뒤 따로 적용한다.
