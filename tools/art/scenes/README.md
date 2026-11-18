# EP01 마감 원화 — 장면 HTML

`assets/cuts/ep01v3/ep01v3-NNN-final-DRAFT.webp` 중 2·8·10·17·89·91·93 은 이 폴더의 `cutNNN.html`(SVG·CSS + 기존 원화에서 오려 낸 인물)을
Playwright Chromium 으로 1080 폭 렌더한 것이다. 84·87·95·96·101 은 `tools/art/finish_ep01v3.py`(Pillow·numpy) 로 만든다.

다시 만들기(저장소 루트에서):
1. 재료(`parts/`, 커밋하지 않음): `python3 tools/art/prep_cut010.py`, `prep_cut010_figure.py`, `prep_cut091.py`, `prep_cut093.py`, `prep_cut101.py`
   — 일부 재료(80컷 승민 뒷머리 `seungmin-back-080.png`, 15컷 흐린 교무실 `staffroom-blur.png`, 현관 흐림 `entrance-morning-blur.png`)는
   `finish_lib.cutout` / Pillow 블러로 만든 것으로, 만든 방법은 docs/EP01_V3_STATUS.md 에 적었다.
   2컷은 `python3 tools/art/derive_ep01v3.py 2` 로 밤 외관을 먼저 만든다(cut002.html 이 참조).
2. 글꼴(`fonts/`, 커밋하지 않음): `npm pack @fontsource/nanum-pen-script` 의 `files/` 와 `index.css`(→ `np.css`). SIL OFL 1.1.
3. `node tools/art/scenes/render.js cut002 cut008 cut010 cut017 cut089 cut091 cut093` → `out/`
4. `python3 tools/art/finish_ep01v3.py 2 8 10 17 19 69 84 87 89 91 93 95 96 101` (19 는 `render.js "cut008#night"` 를 먼저, 87 재료는 `prep_cut087.py`, 101 재료는 `prep_cut101.py`)
