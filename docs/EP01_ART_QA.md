# 1화 최종 미술 QA 준비 (원화 교체 목록)

- 작성: Claude Code (2026-11-11), 기준 커밋 `bc4071e`
- 계기: ChatGPT 총괄 세션의 원화 검수 지적 3가지 (효은 외형, 투명 외곽 잔여 픽셀, 화풍 차이)
- 이 문서 작업에서 **그림 파일은 하나도 바꾸지 않았다**. 대사·컷 순서·시각·UI·스크롤 연출·좌표도 그대로다.
  바꾼 것은 `data/characters.js` 의 상태 표시(status·note)와 문서뿐이다.

---

## 1. 임효은 — 공식 디자인과 다름 (교체 필수)

| 구분 | 공식 디자인 (승인) | 현재 원화 |
|---|---|---|
| 겉옷 | 블루그레이 **짧은 재킷** | 청회색 **긴 코트** (무릎 아래) |
| 안쪽 | **흰 셔츠** | 밝은 회색 목폴라 |
| 하의 | 검은 슬랙스 | 짙은 회색 바지 (56컷 전신에서 보임) |
| 머리 | 낮게 묶은 머리 | 낮게 묶은 흑발 (일치) |
| 소품 | **교직원 명찰** | 없음 |

얼굴·머리 모양은 크게 다르지 않지만 의상이 모든 컷에서 다르다. 승인된 효은 공식 이미지가 없으므로 **새 얼굴을 만들지 않았고**, 지금 파일은 교체 전까지 그대로 쓴다.

| 컷 | 분류 | 교체 파일 (중앙 이름) | 보이는 부분 | 교체 방법 |
|---:|---|---|---|---|
| 56 | compose | `assets/characters/hyoeun/stand-enter.webp` (`@hyoeun/stand-enter`, 538×1773) | 전신 (입구에 등장, 작게) | 파일 교체 — 전신이라 슬랙스·재킷 길이가 그대로 드러남 |
| 57 | compose | `hyoeun/stand-talk.webp` (`@hyoeun/stand-talk`, 1165×1350) | 얼굴·상반신 | 파일 교체 — 명찰 보이게 |
| 58 | compose | `hyoeun/stand-gesture.webp` (`@hyoeun/stand-gesture`, 1199×1312) | 몸통·손짓 (얼굴 위쪽 잘림) | 파일 교체 — 셔츠·재킷·명찰이 화면 중심 |
| 59 | compose | `hyoeun/stand-listen.webp` (`@hyoeun/stand-listen`, 1165×1350) | 상반신 (승민과 투샷) | 효은 파일만 교체. 승민 레이어 `@seungmin/stand-question-phone` 은 유지 |
| 60 | compose | `hyoeun/stand-look-aside.webp` (`@hyoeun/stand-look-aside`, 1325×1187) | 얼굴 클로즈업 + 어깨·목 | 파일 교체 — 목폴라 → 셔츠 깃 |
| 61 | key | `assets/cuts/ep01/61.webp` (1120×1400 한 장) | 왼쪽 효은 소매 (청회색 코트 소매 + 회색 목폴라 소맷부리) | **컷 전체 재작화** — 한 장짜리 원화라 소매만 바꿀 수 없음. 오른쪽 승민 소매(짙은 갈색 재킷 + 올리브 소맷부리), 해인 폰(회보라 무광, 좌상단 대각선 듀얼 렌즈), 음향석·객석 구도는 유지 |

교체 방법은 해인과 같다 ([해인 교체 문서](HAEIN_REPLACEMENT.md) 3절). 새 파일을 새 이름으로 넣고 `data/characters.js` 의 `hyoeun/…` 항목 `src`·`size` 와 `status` 를 바꾸면 해당 컷이 함께 바뀐다. 지금 파일과 **같은 캔버스 크기·같은 머리 위치**로 받으면 좌표를 고치지 않아도 된다. 다르면 56~60컷의 `x·y·w` 만 다시 맞춘다.

- 효은은 1화에서 56~61컷에만 나온다 (55컷은 문자 화면, 63~67컷은 이름만 언급). 다른 회차 데이터는 아직 없다.
- 지금 효은 그림의 머리 바깥쪽에 칠해진 옅은 청색 림라이트(불투명 픽셀)는 잔여 픽셀이 아니라 그림의 일부다. 교체하면 함께 사라진다.

## 2. 투명 외곽 잔여 픽셀 (청록색·붉은색) — 자동 보정 0개

투명 배경 그림 32개(인물 22, 소품 10)를 모두 검사했다. 배경·완성 컷은 투명하지 않아 대상이 아니다.

**검사 방법** (Edge 헤드리스, 원본 픽셀 직접 분석)
1. 눈에 보이는 잔여 픽셀: 불투명도 17/255 이상인 픽셀 가운데 청록(G·B가 R보다 확연히 큼) 또는 빨강(R이 G·B보다 확연히 큼)이면서, 주변 6px 안의 불투명한 그림 색과 계열이 다른 것.
2. 거의 투명한 픽셀: 불투명도 1~16/255(6% 이하)인 외곽 픽셀의 색.
3. 완전히 투명한 픽셀(불투명도 0)에 숨어 있는 RGB 값. 알파를 무시하는 뷰어에서는 이 색이 보인다.
4. 몸에서 떨어진 작은 점(분리된 픽셀 덩어리).
5. 실제 합성 컷(19·46·57~61 등)을 확대해 흰색·검은색·회색 배경에서 외곽 확인.

**결과**

| 파일 | 보이는 청록·빨강 잔여 | 6% 이하 청록 | 6% 이하 붉은색 | 떨어진 점 |
|---|---:|---:|---:|---:|
| `characters/haein/over-shoulder.webp` | 0 | 141 | 3123 | 3 (3px) |
| `characters/haein/sit-explain.webp` | 1 | 58 | 3183 | 6 (13px) |
| `characters/haein/sit-phone.webp` | 0 | 125 | 3255 | 2 (4px) |
| `characters/haein/sit-point.webp` | 0 | 40 | 1819 | 3 (3px) |
| `characters/haein/sit-talk.webp` | 0 | 0 | 3 | 3 (13px) |
| `characters/hyoeun/stand-enter.webp` | 0 | 407 | 527 | 1 (1px) |
| `characters/hyoeun/stand-gesture.webp` | 0 | 544 | 747 | 0 (0px) |
| `characters/hyoeun/stand-listen.webp` | 0 | 767 | 193 | 0 (0px) |
| `characters/hyoeun/stand-look-aside.webp` | 0 | 1140 | 414 | 0 (0px) |
| `characters/hyoeun/stand-talk.webp` | 0 | 1132 | 213 | 0 (0px) |
| `characters/seungmin/phone-call.webp` | 0 | 54 | 821 | 13 (15px) |
| `characters/seungmin/sit-check-score.webp` | 0 | 87 | 1487 | 3 (3px) |
| `characters/seungmin/sit-glance-phone.webp` | 0 | 91 | 568 | 2 (2px) |
| `characters/seungmin/sit-hold-phone.webp` | 0 | 21 | 1448 | 7 (13px) |
| `characters/seungmin/sit-talk.webp` | 0 | 0 | 273 | 8 (10px) |
| `characters/seungmin/stand-alone.webp` | 0 | 47 | 516 | 6 (18px) |
| `characters/seungmin/stand-leave.webp` | 0 | 20 | 1714 | 2 (4px) |
| `characters/seungmin/stand-question-phone.webp` | 0 | 36 | 673 | 1 (1px) |
| `characters/seungmin/stand-wait-phone.webp` | 0 | 30 | 1070 | 10 (12px) |
| `characters/student/choir-enter.webp` | 0 | 355 | 5213 | 0 (0px) |
| `characters/student/choir-question.webp` | 0 | 30 | 968 | 0 (0px) |
| `characters/student/choir-sing.webp` | 0 | 302 | 7993 | 1 (1px) |
| `props/auditorium-clock-frame.webp` | 0 | 124 | 61 | 36 (41px) |
| `props/auditorium-phone-connect.webp` | 0 | 11 | 1784 | 0 (0px) |
| `props/brown-envelope.webp` | 0 | 0 | 3154 | 0 (0px) |
| `props/haein-phone-back.webp` | 0 | 66 | 316 | 0 (0px) |
| `props/haein-phone-camera-hand.webp` | 0 | 20 | 1260 | 0 (0px) |
| `props/haein-phone-front.webp` | 0 | 14 | 617 | 0 (0px) |
| `props/haein-phone-screen-off.webp` | 0 | 24 | 1283 | 0 (0px) |
| `props/musicroom-desk-rehearsal.webp` | 0 | 3 | 1439 | 0 (0px) |
| `props/seungmin-phone-back.webp` | 0 | 9 | 0 | 0 (0px) |
| `props/sheet-music-turn.webp` | 0 | 64 | 4431 | 0 (0px) |

- **눈에 보이는 잔여 픽셀: 32개 파일 모두 0** (해인 `sit-explain` 의 1픽셀은 불투명도 20/255의 피부색 가장자리).
- 완전히 투명한 픽셀에 숨은 RGB는 거의 검은색이다. 알파를 무시하는 뷰어에서도 청록·빨강 띠는 나오지 않는다.
- 떨어진 점은 모두 1~9px 크기의 머리카락 끝 색(갈색·회색)이다. 청록·빨강이 아니고 머리 가닥의 일부일 수 있어 지우지 않았다.
- 청록·빨강은 **불투명도 6% 이하 외곽 픽셀**에만 있다. 효은 그림에는 청록, 승민·학생·소품에는 붉은 계열이 많다. 일반 화면에서는 보이지 않지만, 외곽을 강조하거나 알파를 무시하는 도구로 보면 색 점이 줄지어 보일 수 있다. 검수에서 본 잔여 픽셀은 이것일 가능성이 높다.

**보정하지 않은 이유**: 모든 그림이 손실 압축 WebP(VP8 + 별도 알파)다. 이 외곽 픽셀만 지우려 해도 그림 전체를 다시 압축해야 하고, 그러면 승인된 승민 공식 그림을 포함한 모든 픽셀이 미세하게 바뀐다. "안전한 자동 보정" 기준에 맞지 않아 파일을 그대로 두었다.

**권장**
- 효은 5장은 교체 대상이라 함께 해결된다. 학생 3장도 화풍 교체 후보다 (3절).
- 남는 그림(승민·해인·소품)은 무손실 원본 PNG가 있으면, 원본에서 "불투명도 16 이하 픽셀 지우기 + 투명 픽셀 RGB 0" 처리 후 한 번만 WebP로 내보낸다.
- 총괄 검수에서 특정 컷·위치의 잔여 픽셀을 봤다면 컷 번호와 위치를 알려 주면 그 부분만 다시 확인한다.

## 3. 화풍 차이 — 원화 교체 목록

판정 기준: 주인공 원화(승민·해인·효은)는 가는 선화 + 부드러운 반실사 채색이다. 아래 컷은 선 굵기·채색 방식이 눈에 띄게 다르다. 최종 판단은 총괄 검수에서 한다.

| 우선 | 컷 | 파일 | 차이 | 비고 |
|:---:|---|---|---|---|
| 1 | 46 | `assets/characters/student/choir-question.webp` | 학생: 굵은 외곽선·셀 채색·큰 눈의 애니풍. 같은 화면의 승민은 반실사 | 한 컷 안에서 두 화풍이 붙어 있어 가장 잘 보임 |
| 2 | 30 | `assets/characters/student/choir-enter.webp` | 학생 4명 애니풍. 배경은 반실사 | |
| 2 | 32·38 | `assets/characters/student/choir-sing.webp` | 합창단 애니풍 (무대 배경 위) | 한 파일을 두 컷이 씀 |
| 2 | 33 | `assets/cuts/ep01/33.webp` (key) | 합창단 애니풍 | 한 장짜리 원화 → 컷 전체 재작화 |
| 2 | 40 | `assets/cuts/ep01/40-rehearsal.webp` (compose의 배경) | 합창단 클로즈업 애니풍 | 학생이 화면을 꽉 채워 차이가 큼 |
| 3 | 41 | `assets/cuts/ep01/41-dismissal.webp` (compose의 배경) | 퇴장하는 학생 애니풍 | 학생이 작게 보여 덜 눈에 띔 |
| 3 | 61 | `assets/cuts/ep01/61.webp` (key) | 손이 매끈한 3D 렌더 느낌, 선화 없음 | 효은 소매 때문에 어차피 재작화 (1절) |
| 참고 | 44 | `props/auditorium-clock-frame.webp` + `backgrounds/auditorium/clock-wall.webp` | 단순한 평면 그림. 다른 배경보다 묘사가 적음 | 교체 필수 아님 |
| 참고 | 29 | `backgrounds/auditorium/morning-exterior.webp` | 채도 높은 가을 풍경, 다른 강당 배경보다 회화적 | 교체 필수 아님 |
| 참고 | 31·39·50 | `props/auditorium-phone-connect.webp`, `haein-phone-screen-off.webp`, `haein-phone-back.webp`, `seungmin-phone-back.webp` | 사진에 가까운 제품 렌더 | 소품 클로즈업이라 허용 범위로 봄 |

- 학생 그림을 교체할 때도 같은 교복(남색 조끼, 흰 셔츠, 붉은 넥타이, 남색 치마·바지)을 유지해야 30·32·33·38·40·41·46컷이 이어진다.
- 학생 key·배경 원화(33·40·41)는 한 장짜리라 학생만 바꿀 수 없다. 컷 전체를 다시 그린다.
- 해인(07·15·18·20·22·24·26·28 등)은 실제 사진을 받을 때까지 임시 버전 유지 ([해인 교체 문서](HAEIN_REPLACEMENT.md)).

## 4. 요약

| 구분 | 컷 | 개수 |
|---|---|---:|
| 자동 보정한 컷 | 없음 (보이는 잔여 픽셀 0, 안전한 자동 보정 대상 없음) | 0 |
| 원화 교체 필수: 효은 외형 | 56·57·58·59·60 (파일 교체), 61 (재작화) | 6 |
| 원화 교체 후보: 화풍 | 46 (1순위), 30·32·33·38·40 (2순위), 41 (3순위) | 7 |
| 교체 대기: 해인 실제 사진 | 07·15·18·20·22·24·26·28 (+ 의상 변경 시 08·13·27) | 8 (+3) |

필요한 그림: 효은 공식 투명 그림 5장 + 61컷 재작화 1장, 학생 투명 그림 3장(choir-enter, choir-sing, choir-question) + 학생 원화 3장(33, 40-rehearsal, 41-dismissal).

## 5. 남은 검수 사항

- 효은 공식 디자인 이미지(정면·명찰 위치) 확보 → 56~61컷 교체 후 59컷 투샷 축척 확인.
- 학생 화풍 교체 여부 총괄 결정 (특히 46컷).
- 해인 실제 사진 확보 → 해인 컷 교체.
- 교체 그림이 오면 이 문서 2절과 같은 외곽 검사를 다시 한다 (불투명도 16 이하 외곽 색, 투명 픽셀 RGB).
- 실제 iOS Safari·안드로이드 기기 확인 (아직 미확인).
