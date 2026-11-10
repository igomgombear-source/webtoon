# 1화 완성 컷

한 장으로 끝난 컷 그림을 넣는 곳입니다. 핵심 컷(key)과, 조립 컷을 미리 합성해 내보낸 WebP가 여기에 들어갑니다.

- 파일 이름: 컷 번호 두 자리. 예: `01.webp`, `27.webp`
- 핵심 컷: `data/ep01.js` 에서 `image: '01.webp', imageSize: { w: 900, h: 1200 }` 처럼 연결합니다.
- 조립 컷을 내보낸 경우: `compose.export: 'assets/cuts/ep01/18.webp'` 로 연결하고, `useExportedCuts` 를 `true` 또는 `'mobile'` 로 바꿉니다.
- 그림에는 대사·휴대폰 글자를 넣지 않습니다.
