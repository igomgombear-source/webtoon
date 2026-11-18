// 장면 HTML(1080 폭 캔버스)을 Playwright Chromium 으로 그려 PNG 로 저장한다.
//   node tools/art/scenes/render.js cut089 [cut010 ...]   (저장소 루트에서). 'cut008#night' 처럼 #변형을 붙이면 out/cut008-night.png
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  for (const name of process.argv.slice(2)) {
    const [base, hash] = name.split('#'); const file = path.resolve(__dirname, base + '.html');
    const p = await b.newPage();
    await p.goto('file://' + file + (hash ? '#' + hash : ''));
    const size = await p.evaluate(() => { const c = document.querySelector('.cv'); return { w: c.offsetWidth, h: c.offsetHeight }; });
    await p.setViewportSize({ width: size.w, height: size.h });
    await p.evaluate(() => document.fonts && document.fonts.ready);
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.resolve(__dirname, 'out', name.replace('#', '-') + '.png'), clip: { x: 0, y: 0, width: size.w, height: size.h } });
    console.log('rendered', name, size);
    await p.close();
  }
  await b.close();
})();
