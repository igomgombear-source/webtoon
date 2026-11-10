# 마지막 접속 — 모바일 웹툰 뷰어

스마트폰 세로 스크롤용 정적 웹툰 사이트. HTML·CSS·JavaScript만 쓰고 외부 라이브러리는 없다.

## 실행

```
cd last-access-webtoon
python3 -m http.server 8000
```
브라우저에서 `http://localhost:8000/` 을 연다. `index.html` 을 파일로 바로 열어도 동작한다.

- 작품 메인: `index.html`
- 1화: `index.html#ep01`

## 파일 구조

```
index.html                 진입점 (작품 메인 / 회차 화면을 해시로 전환)
css/style.css              전체 스타일
js/app.js                  뷰어 (라우팅, 컷 렌더링, 휴대폰 화면, 지연 로딩, 진행률)
data/episodes.js           작품 정보와 회차 목록
data/ep01.js               1화 70컷 데이터
assets/episodes/ep01/      1화 그림 폴더
.nojekyll                  GitHub Pages가 파일을 그대로 서비스하도록
```

## 컷 데이터

`data/ep01.js` 맨 위 주석에 항목 설명이 있다. 요약:

| 항목 | 내용 |
|---|---|
| `no` | 컷 번호 |
| `type` | `panel` 그림 컷, `black` 검은 화면 자막, `phone` 휴대폰 화면 |
| `image` | 그림 파일 이름 (`imageBase` 기준). 없으면 `null` → 임시 컷 |
| `ratio` | 임시 컷 비율 `'가로:세로'` |
| `tone` | 임시 컷 색조 |
| `desc` | 임시 컷 장면 설명 |
| `datetime` | `{ date, time }` — time이 있으면 컷에 시각 표시 |
| `scene` | 장면 전환 카드 `{ date, time, place }` |
| `transition` | `fade`, `slow`, `none` |
| `spacing` | `{ before, after }` 여백(px, 폭 360px 기준으로 화면 폭에 비례) |
| `lines` | 대사 `[{ who, text, style, pos }]`, style은 `speech`, `thought`, `phone`, `caption` |
| `phone` | 휴대폰 화면 내용. `view`: `notification`, `lock`, `email`, `sms`, `call`, `calllog`, `zoom` |

화자 위치(왼쪽/오른쪽)는 `speakers`, 화자 이름 표시 여부는 `showSpeakerNames` 로 정한다.

## 새 회차 추가

1. `data/ep01.js` 를 복사해 `data/ep02.js` 를 만들고 `id: 'ep02'`, `no: 2`, `imageBase: 'assets/episodes/ep02/'` 로 바꾼다.
2. `data/episodes.js` 의 2화 항목에 `title`, `ready: true`, `file: 'data/ep02.js'` 를 넣는다.
3. 그림은 `assets/episodes/ep02/` 에 넣는다.

## GitHub Pages 배포

모든 경로가 상대경로라 저장소 하위 경로(`https://아이디.github.io/저장소/`)에서도 동작한다.

1. 이 폴더 내용을 새 저장소(예: `last-access-webtoon`)의 루트에 올린다.
2. 저장소 Settings → Pages → Branch를 `main` / `(root)` 로 지정한다.
