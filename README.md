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
├─ js/compose.js              조립 컷 계산 (뷰어와 내보내기 도구가 함께 씀)
├─ data/episodes.js           작품 정보와 회차 목록
├─ data/ep01.js               1화 70컷 데이터
├─ assets/backgrounds/        배경 재료 (장소별 폴더)
├─ assets/characters/         인물 재료 (인물별 폴더, 투명 PNG/WebP)
├─ assets/props/              소품 재료 (투명 PNG/WebP)
├─ assets/cuts/ep01/          1화 완성 컷 (핵심 컷, 내보낸 조립 컷)
├─ assets/fonts/              표지 손글씨 글꼴 (OFL)
├─ tools/export.html          조립 컷을 WebP 한 장으로 내보내는 도구
├─ .nojekyll                  GitHub Pages 가 파일을 그대로 쓰도록 하는 빈 파일
└─ README.md
```

각 assets 폴더의 README.md 에 파일 이름 규칙이 있습니다.

## 컷 분류 (kind)

| kind | 뜻 | 그림 |
|---|---|---|
| `text` | 문자·메일·알림·통화 화면, 검은 화면 | 없음. 뷰어가 텍스트로 표시 |
| `compose` | 재료 조립 컷 | 배경 + 인물 + 소품을 겹쳐 표시 |
| `key` | 따로 그리는 핵심 컷 | 완성 컷 한 장 (`image`) |

## 그림 넣기

컷의 그림 영역은 아래 순서로 정해집니다.

1. `image` 가 있으면 완성 컷 한 장
2. `compose.export` 가 있고 회차의 `useExportedCuts` 가 켜져 있으면, 미리 합성해 둔 WebP 한 장
3. `compose` 가 있으면 배경 위에 투명 레이어를 화면에서 합성
4. 아무것도 없으면 임시 컷

### 완성 컷 (핵심 컷)

`assets/cuts/ep01/01.webp` 에 넣고 `data/ep01.js` 에서 연결합니다.
```
image: '01.webp', imageSize: { w: 900, h: 1200 },
```
`imageSize` 는 그림 원본의 가로·세로 픽셀입니다. 넣어 두면 로딩 중에도 아래 컷이 밀리지 않습니다.

### 조립 컷

```
compose: {
  bg: 'assets/backgrounds/musicroom/night-wide.webp',
  canvasSize: { w: 900, h: 1200 },
  layers: [
    { src: 'assets/characters/seungmin/reading.png', x: 20, y: 35, w: 60 }
  ]
}
```
- `canvasSize` 가 컷의 비율을 고정합니다.
- `x`, `y`, `w` (선택 `h`) 는 모두 **캔버스 가로 폭 기준 %** 이고, 레이어 왼쪽 위 모서리 위치입니다. 화면 폭이 바뀌어도 상대 위치는 같습니다.
- 선택 항목: `flip: true` 좌우 반전, `opacity: 0.8`
- 파일이 아직 없으면 그 배경·레이어만 빠지고 임시 컷이 보입니다.

### 조립 컷을 한 장으로 내보내기

1. 서버를 켠 상태에서 `http://localhost:8000/tools/export.html` 을 엽니다.
2. 회차를 고르고 **합성하기** → 컷마다 **저장** 을 눌러 WebP 를 받습니다.
3. 받은 파일을 `assets/cuts/ep01/` 에 넣고, 그 컷의 compose 에 `export: 'assets/cuts/ep01/18.webp'` 를 적습니다.
4. `data/ep01.js` 위쪽의 `useExportedCuts` 를 바꿉니다: `true` 항상 한 장 사용, `'mobile'` 휴대폰 폭에서만, `false` 화면에서 합성.

그림에는 대사나 휴대폰 글자를 넣지 않습니다. 글자는 데이터에서 텍스트로 표시됩니다.

## 컷 데이터 항목

`data/ep01.js` 맨 위 주석에 자세한 설명이 있습니다.

| 항목 | 내용 |
|---|---|
| `no` | 컷 번호 |
| `type` | `panel` 그림 컷, `black` 검은 화면 자막, `phone` 휴대폰 화면 |
| `kind` | 제작 분류 `text`, `compose`, `key` (선택) |
| `image` / `imageSize` | 완성 컷 파일 이름과 원본 크기 `{ w, h }` |
| `compose` | 재료 조립 `{ bg, canvasSize, layers, export }` (선택) |
| `ratio` / `tone` / `desc` | 그림이 없을 때 임시 컷의 비율·색조·설명 |
| `datetime` | `{ date, time }` — time 이 있으면 컷에 시각 표시 |
| `scene` | 장면 전환 카드 `{ date, time, place }` |
| `transition` | 등장 효과 `fade`, `slow`, `none` |
| `spacing` | 컷 앞뒤 여백 `{ before, after }` (폭 360px 기준, 화면 폭에 비례) |
| `lines` | 대사 `[{ who, text, style, pos }]` |
| `phone` | 휴대폰 화면 내용 (`notification`, `lock`, `email`, `sms`, `call`, `calllog`, `zoom`) |

## 새 회차 추가

1. `data/ep01.js` 를 복사해 `data/ep02.js` 를 만들고 `id: 'ep02'`, `no: 2`, `imageBase: 'assets/cuts/ep02/'` 로 바꿉니다.
2. `data/episodes.js` 의 2화 항목에 `title`, `ready: true`, `file: 'data/ep02.js'` 를 넣습니다.
3. 완성 컷은 `assets/cuts/ep02/` 에 넣습니다. 배경·인물·소품 재료는 회차와 상관없이 함께 씁니다.
