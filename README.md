# 마지막 접속 — 모바일 웹툰 뷰어

스마트폰 세로 스크롤용 웹툰 사이트입니다. HTML·CSS·JavaScript만 쓰고, 따로 설치할 프로그램이나 외부 라이브러리는 없습니다.

## 내 컴퓨터에서 실행하기

필요한 것: Git, Python 3

1. 터미널(윈도우는 명령 프롬프트)을 엽니다.
2. 저장소를 내려받습니다.
   ```
   git clone https://github.com/igomgombear-source/webtoon.git
   cd webtoon
   ```
3. 간단한 웹 서버를 켭니다.
   ```
   python3 -m http.server 8000
   ```
   윈도우에서 `python3` 가 안 되면 `py -m http.server 8000` 을 입력합니다.
4. 브라우저에서 `http://localhost:8000/` 을 엽니다.
   - 작품 메인: `http://localhost:8000/`
   - 1화: `http://localhost:8000/#ep01`
5. 끝낼 때는 터미널에서 `Ctrl + C` 를 누릅니다.

> 서버 없이 `index.html` 을 두 번 눌러 열어도 대부분 동작합니다. 다만 실제 서비스와 같은 상태로 보려면 위의 서버 방식을 권장합니다.

## 인터넷에 공개된 주소 (GitHub Pages)

저장소 Settings → Pages 에서 Branch 를 `main` / `(root)` 로 켜 두었다면 아래 주소로 볼 수 있습니다.

- https://igomgombear-source.github.io/webtoon/
- 1화: https://igomgombear-source.github.io/webtoon/#ep01

모든 경로가 상대경로라 이 주소(하위 경로)에서도 그대로 동작합니다.

## 폴더 구조

```
webtoon/
├─ index.html                 진입점 (작품 메인 / 회차 화면을 주소 끝 #ep01 로 전환)
├─ css/style.css              전체 스타일
├─ js/app.js                  뷰어 (컷 표시, 휴대폰 화면, 지연 로딩, 진행률)
├─ data/episodes.js           작품 정보와 회차 목록
├─ data/ep01.js               1화 70컷 데이터
├─ assets/episodes/ep01/      1화 그림 폴더
├─ .nojekyll                  GitHub Pages 가 파일을 그대로 쓰도록 하는 빈 파일
└─ README.md
```

## 그림 넣기

1. 그림 파일을 `assets/episodes/ep01/` 에 넣습니다. 예: `01.jpg`
2. `data/ep01.js` 에서 해당 컷의 `image: null` 을 바꿉니다.
   ```
   image: '01.jpg', imageSize: { w: 800, h: 1200 },
   ```
   `imageSize` 는 그림 원본의 가로·세로 픽셀입니다. 넣어 두면 그림이 늦게 불러와져도 아래 컷이 밀리지 않습니다. 빼도 동작하지만, 그 컷이 로딩될 때 높이가 바뀔 수 있습니다.
3. 그림은 잘리지 않고 원본 비율 그대로 보입니다. 파일이 없거나 이름이 틀리면 임시 컷이 그대로 남습니다.
4. 그림에는 대사나 휴대폰 글자를 넣지 않습니다. 글자는 데이터에서 텍스트로 표시됩니다.

## 컷 데이터 항목

`data/ep01.js` 맨 위 주석에 자세한 설명이 있습니다.

| 항목 | 내용 |
|---|---|
| `no` | 컷 번호 |
| `type` | `panel` 그림 컷, `black` 검은 화면 자막, `phone` 휴대폰 화면 |
| `image` / `imageSize` | 그림 파일 이름과 원본 크기 `{ w, h }` (선택) |
| `ratio` / `tone` / `desc` | 그림이 없을 때 임시 컷의 비율·색조·설명 |
| `datetime` | `{ date, time }` — time 이 있으면 컷에 시각 표시 |
| `scene` | 장면 전환 카드 `{ date, time, place }` |
| `transition` | 등장 효과 `fade`, `slow`, `none` |
| `spacing` | 컷 앞뒤 여백 `{ before, after }` (폭 360px 기준, 화면 폭에 비례) |
| `lines` | 대사 `[{ who, text, style, pos }]` |
| `phone` | 휴대폰 화면 내용 (`notification`, `lock`, `email`, `sms`, `call`, `calllog`, `zoom`) |

## 새 회차 추가

1. `data/ep01.js` 를 복사해 `data/ep02.js` 를 만들고 `id: 'ep02'`, `no: 2`, `imageBase: 'assets/episodes/ep02/'` 로 바꿉니다.
2. `data/episodes.js` 의 2화 항목에 `title`, `ready: true`, `file: 'data/ep02.js'` 를 넣습니다.
3. 그림은 `assets/episodes/ep02/` 에 넣습니다.
