/* 말풍선 모양 종류·글꼴·글자 색·배경색·테두리 + 대사 정렬 (2단계 통합: 렌더러 지원 + Studio UI) */
const fs = require('fs'), path = require('path');
module.exports = async function (b, h) {
  const { openStudio, ok, go, BASE, OUT, sha } = h;
  const settle = async p => { await h.settle(p); await p.evaluate(() => Studio.modules.dialogue.ensureFresh()); await h.settle(p); await p.waitForTimeout(150); };
  const CLEAN = `try{ if(!sessionStorage.getItem('t')){ localStorage.clear(); sessionStorage.setItem('t','1'); } }catch(e){}`;
  const dom = (p, no, k) => p.evaluate(a => { const f = Studio.stage.frame, el = f.section(a[0]).querySelectorAll('.bv4-b')[a[1]], t = el.querySelector('.bv4-text'), path = el.querySelector('svg path:not(.bv4-cover)'), cs = f.win().getComputedStyle(t);
    return { cls: el.className, tcls: t.className, color: cs.color, family: cs.fontFamily, weight: cs.fontWeight, align: cs.textAlign, fill: path ? f.win().getComputedStyle(path).fill : null, stroke: path ? f.win().getComputedStyle(path).stroke : null, bg: f.win().getComputedStyle(el).backgroundColor, w: el.offsetWidth, h: el.offsetHeight }; }, [no, k]);
  const p = await openStudio(b, 'ep01v3/11', { init: CLEAN });
  await go(p, 11); await settle(p);
  await p.evaluate(() => { Studio.activate('bubbles'); Studio.modules.bubbles.selectLine('c011.l0'); Studio.emit('stage', {}); }); await p.waitForTimeout(200);
  const d0 = await dom(p, 11, 0);
  ok(/bv4-k-ellipse/.test(d0.cls) && d0.fill === 'rgb(255, 255, 255)', '기준: 타원·흰 배경');

  // 1) UI 로 모양·글꼴·색
  for (const [k, cls] of [['round', 'bv4-k-round'], ['jag', 'bv4-k-jag'], ['jagrect', 'bv4-k-jagrect'], ['rect', 'bv4-k-round'], ['ellipse', 'bv4-k-ellipse']]) {
    await p.selectOption('#bb-kind', k); await settle(p); const d = await dom(p, 11, 0);
    ok(d.cls.indexOf(cls) >= 0 && await p.evaluate(() => Studio.store.get('bubbles', 'c011.l0').style.kind) === k, '모양 ' + k + ' → 실제 화면 ' + cls + ' (' + d.w + '×' + d.h + ')');
  }
  await p.selectOption('#bb-font', 'serif'); await settle(p); let d = await dom(p, 11, 0);
  ok(/bv4-f-serif/.test(d.tcls) && /Noto Serif KR/.test(d.family), '글꼴 명조 → 실제 화면 글꼴 ' + d.family.slice(0, 30));
  await p.selectOption('#bb-font', 'bold'); await settle(p); d = await dom(p, 11, 0); ok(/bv4-f-bold/.test(d.tcls) && d.weight === '600', '글꼴 굵은 고딕(600)');
  const setColor = (id, v) => p.evaluate(a => { const e = document.getElementById(a[0]); e.value = a[1]; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);
  await setColor('bb-color', '#c0392b'); await setColor('bb-bg', '#fff3c4'); await setColor('bb-stroke', '#1a5276'); await settle(p); d = await dom(p, 11, 0);
  ok(d.color === 'rgb(192, 57, 43)' && d.fill === 'rgb(255, 243, 196)' && d.stroke === 'rgb(26, 82, 118)', '글자 색·배경색·테두리 색 → 실제 화면');
  ok(/대비 [\d.]+:1/.test(await p.locator('#bb-contrast').textContent()) && !/미만/.test(await p.locator('#bb-contrast').textContent()), '대비 표시(충분)');
  await setColor('bb-color', '#f5f5f5'); await settle(p); ok(/미만/.test(await p.locator('#bb-contrast').textContent()), '낮은 대비 경고(4.5:1 미만)');
  await p.click('#bb-color0'); await settle(p); d = await dom(p, 11, 0); ok(d.color === 'rgb(21, 23, 27)' && !('color' in (await p.evaluate(() => Studio.store.get('bubbles', 'c011.l0').style))), '글자 색 기본으로');
  const hs = await p.evaluate(() => Studio.store.history().length); await p.click('#undo'); await settle(p); d = await dom(p, 11, 0);
  ok(d.color === 'rgb(245, 245, 245)', '색 변경 실행 취소'); await p.click('#redo'); await settle(p);
  // 네모(rect)·독백 유형
  await go(p, 14); await settle(p); await p.evaluate(() => { Studio.modules.bubbles.selectLine('c014.l0'); Studio.emit('stage', {}); }); await p.waitForTimeout(200);
  const m0 = await dom(p, 14, 0); await setColor('bb-bg', '#e8f0ff'); await settle(p); const m1 = await dom(p, 14, 0);
  ok(/bv4-k-rect/.test(m0.cls) && m1.bg === 'rgb(232, 240, 255)', '독백(네모 유형) 배경색 → div 배경');
  await p.selectOption('#bb-kind', 'ellipse'); await settle(p); const m2 = await dom(p, 14, 0);
  ok(/bv4-k-ellipse/.test(m2.cls) && m2.fill === 'rgb(232, 240, 255)', '독백을 타원 모양으로 바꾸고 배경색 유지');
  // 2) 대사 정렬
  await go(p, 11); await settle(p);
  for (const a of ['left', 'right', 'center']) { await p.evaluate(a => Studio.modules.dialogue.setAlign('c011.l1', a), a); await settle(p); d = await dom(p, 11, 1); ok(d.align === a, '대사 정렬 ' + a + ' → 실제 화면 text-align'); }
  await p.evaluate(() => { Studio.activate('dialogue'); }); await p.waitForSelector('#dl-list .dl-row'); await p.locator('#dl-list .dl-row').nth(2).click(); await p.selectOption('#dl-align', 'right'); await settle(p);
  d = await dom(p, 11, 2); ok(d.align === 'right' && !/미반영/.test(await p.locator('#props').textContent()), '대사 메뉴 정렬 선택 → 화면 반영(미반영 표시 없음)');
  // 3) 분할 조각 각각 다른 모양·색
  await go(p, 12); await settle(p); await p.evaluate(() => Studio.modules.dialogue.confirmSplit('c012.l0')); await settle(p);
  await p.evaluate(() => Studio.store.set('bubbles', 'c012.l0.b1', { style: { kind: 'round', bg: '#ffe0e0' } }, { label: 'x' })); await settle(p); await go(p, 12);
  const s0 = await dom(p, 12, 0), s1 = await dom(p, 12, 1); ok(/ellipse/.test(s0.cls) && s0.fill === 'rgb(255, 255, 255)' && /bv4-k-round/.test(s1.cls) && s1.fill === 'rgb(255, 224, 224)', '분할 조각마다 독립 모양·색(b0 기본, b1 둥근 사각·분홍)');
  // 4) 저장·복원
  await go(p, 11); await settle(p);
  const E = await h.edits(p), snap = JSON.stringify([await dom(p, 11, 0), await dom(p, 11, 1), await dom(p, 11, 2)]);
  await p.evaluate(() => Studio.activate('bubbles'));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#jsonOut')]); const jf = path.join(OUT, 'style.json'); await dl.saveAs(jf);
  await p.evaluate(() => { Studio.store.flush(); localStorage.clear(); }); await p.reload(); await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 });
  await p.setInputFiles('#file', jf); await p.waitForFunction(() => Studio.store.count().bubbles > 0, null, { timeout: 10000 }); await settle(p); await go(p, 11); await settle(p);
  ok((await h.edits(p)) === E && JSON.stringify([await dom(p, 11, 0), await dom(p, 11, 1), await dom(p, 11, 2)]) === snap, '모양·글꼴·색·정렬 JSON 저장·복원(화면 동일)');
  await p.reload(); await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 }); await go(p, 11); await settle(p);
  ok(JSON.stringify([await dom(p, 11, 0), await dom(p, 11, 1), await dom(p, 11, 2)]) === snap, '자동 저장 복원(새로고침)');
  // 5) 실제 독자 화면(패치 주입)과 같은 HTML
  const dPatch = await p.evaluate(() => Studio.modules.dialogue._.patchText()), bPatch = await p.evaluate(() => Studio.modules.bubbles._.patchText());
  const strip = t => t.split('\n').filter(l => !/^\s*\/\/ /.test(l)).map(l => l.replace(/\s+\/\/ [^\n]*$/, '')).join('\n').replace(/,\s*$/, '');
  for (const W of [320, 360, 390, 430, 768]) {
    await p.evaluate(W => Studio.stage.setWidth(W), W); await settle(p);
    const e = await p.evaluate(() => { const o = {}; [11, 12, 14].forEach(n => { Studio.select(n); o[n] = Studio.stage.frame.section(n).querySelector('.bv4-layer').outerHTML.replace(/ data-src="\d+"/g, ''); }); return o; });
    const rp = await b.newPage({ viewport: { width: W, height: 900 } });
    await rp.route('**/data/ep01v3.js', async r => { const resp = await r.fetch(); let body = await resp.text(); body += '\n;(function(){ var P = {' + strip(dPatch) + '}; WEBTOON.episodeData.ep01v3.cuts.forEach(function(c){ if (P[c.no]) c.lines = P[c.no]; }); })();\n'; await r.fulfill({ response: resp, body }); });
    await rp.route('**/data/ep01v3-bubbles.js', async r => { const resp = await r.fetch(); let body = await resp.text(); body += '\n;(function(){ var P = {' + strip(bPatch) + '}; var B = window.EP01V3_BUBBLES; Object.keys(P).forEach(function(n){ B.cuts[n] = Object.assign({}, B.cuts[n] || {}, P[n]); }); })();\n'; await r.fulfill({ response: resp, body }); });
    await rp.goto(BASE + 'index.html#ep01v3'); await rp.waitForFunction(() => document.body.classList.contains('bv4-done'), null, { timeout: 60000 }); await rp.waitForTimeout(300);
    const r = await rp.evaluate(() => { const o = {}; [11, 12, 14].forEach(n => { o[n] = document.getElementById('cut-' + n).querySelector('.bv4-layer').outerHTML.replace(/ data-src="\d+"/g, ''); }); return o; });
    const bad = [11, 12, 14].filter(n => sha(e[n]) !== sha(r[n]));
    ok(!bad.length, W + 'px 모양·글꼴·색·정렬·분할 조각 스타일: Studio = 패치를 넣은 실제 독자 화면(#11·#12·#14 HTML 동일' + (bad.length ? ', 다름 ' + bad : '') + ')');
    await rp.close();
  }
  await p.evaluate(() => Studio.stage.setWidth(390)); await settle(p);
  // 6) 썸네일 반영
  await go(p, 11); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => { const r = document.querySelector('.tl-tile[data-no="11"] .tl-img').shadowRoot; const el = r && r.querySelector('.bv4-b.bv4-k-ellipse path'); return !!r && /bv4-f-bold/.test(r.querySelector('.bv4-b .bv4-text').className); }), '썸네일에 글꼴·모양 반영');
  // 7) 화면 크기
  ok(!p.errs.length, '오류 없음 ' + p.errs.slice(0, 3).join(' | ')); await p.context().close();
  for (const vw of [320, 360, 390, 430, 768, 1440]) {
    const q = await openStudio(b, 'ep01v3/11', { viewport: { width: vw, height: 900 }, init: CLEAN });
    await q.evaluate(() => { Studio.activate('bubbles'); Studio.modules.bubbles.selectLine('c011.l0'); Studio.emit('stage', {}); }); await q.waitForTimeout(300);
    const r = await q.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, kind: !!document.getElementById('bb-kind') && !document.getElementById('bb-kind').disabled }));
    ok(r.sw <= r.cw + 1 && r.kind, vw + 'px 모양·글꼴·색 컨트롤 표시, 가로 넘침 없음(' + r.sw + '/' + r.cw + ')');
    if (vw === 390 || vw === 1440) { await q.locator('#bb-kind').scrollIntoViewIfNeeded(); await q.screenshot({ path: path.join(OUT, 'style-' + vw + '.png') }); }
    await q.context().close();
  }
};
