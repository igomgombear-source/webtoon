/* PF-003C: browser-only QA for latest local revision comparison.
 * Run from repository root after starting python3 -m http.server 8765.
 * Requires locally available playwright-core and Chrome/Chromium.
 * No deployment, no approval writes, no external network needed after setup.
 */
'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : { channel: 'chrome' });
  const base = process.env.QA_URL || 'http://127.0.0.1:8765';
  try {
    for (const width of [320, 360, 390, 430, 768]) {
      const ctx = await browser.newContext({viewport:{width,height:800},hasTouch:true,isMobile:true,deviceScaleFactor:1});
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => {if(r.status() >= 400 && /\.(webp|svg|js)(\?|$)/.test(r.url())) errors.push(r.status()+' '+r.url());});
      await page.addInitScript(() => {localStorage.setItem('ep01-localrev-verdict', JSON.stringify({x10:'ok'}));});
      await page.goto(base + '/tools/compare-local-revisions.html');
      await page.locator('.card').last().waitFor();
      assert.equal(await page.locator('.card').count(),16);
      assert.equal(await page.locator('#x18p0').count(),0);
      assert.equal(await page.locator('#x18p1').count(),1);
      assert.equal(await page.locator('#count').textContent(),'0 / 16 판단');
      await page.locator('.stage img').evaluateAll(async imgs => {
        await Promise.all(imgs.map(async img => {img.loading='eager'; await img.decode(); if(!img.naturalWidth) throw Error(img.src);}));
      });
      const c = page.locator('#x10');
      assert.equal(await c.locator('.stage img').count(),2);
      await c.locator('[data-mode="old"]').click();
      assert.equal(await c.locator('.stage img').count(),1);
      await c.locator('[data-mode="cmp"]').click();
      assert.equal(await c.locator('.cmp img').count(),2);
      await c.locator('input[type="range"]').evaluate(el => {el.value=75;el.dispatchEvent(new Event('input',{bubbles:true}));});
      assert.match(await c.locator('.cmp').getAttribute('style'),/25%/);
      await c.locator('.stage').click();
      assert.equal(await page.locator('#zoom.on').count(),1);
      assert.equal(await page.locator('#zinner img').count(),2);
      await page.locator('#zclose').click();
      await c.locator('[data-v="ok"]').click();
      assert.equal(await page.locator('#count').textContent(),'1 / 16 판단');
      await page.locator('#show').click();
      assert.match(await page.locator('#out').textContent(),/010-restore-students-REV3-DRAFT\.webp \+ ep01v3-010-chalk-REV3-DRAFT\.svg/);
      await page.reload();
      await page.locator('#x10').waitFor();
      assert.equal(await page.locator('#count').textContent(),'1 / 16 판단');
      await page.locator('#x10 [data-v="ok"]').click();
      assert.equal(await page.locator('#count').textContent(),'0 / 16 판단');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
      assert.deepEqual(errors,[]);
      await ctx.close();
      console.log('PASS comparison browser QA width',width);
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
