#!/usr/bin/env node
/* 마지막 접속 Studio 검증 — Playwright(Chromium)
 *   python3 -m http.server 8765   (저장소 루트에서)
 *   node tools/studio/tests/run.js [core|bubbles|timeline|layout|regression ...]   (인자 없으면 전부)
 * 환경 변수: BASE(기본 http://localhost:8765/), OUT(스크린숏 폴더, 기본 OS 임시 폴더/studio-tests), WIDTHS(일치 검사 폭)
 * 모듈 담당자는 자기 모듈 검사를 tests/<모듈>.test.js 로 더한다(자동 등록, 이 파일은 고치지 않는다). */
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), crypto = require('crypto');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('playwright 를 찾을 수 없습니다 (NODE_PATH=$(npm root -g) 로 실행)'); process.exit(2); }
const BASE = (process.env.BASE || 'http://localhost:8765/').replace(/\/?$/, '/');
const STUDIO = BASE + 'tools/studio/index.html';
const OUT = process.env.OUT || path.join(os.tmpdir(), 'studio-tests'); fs.mkdirSync(OUT, { recursive: true });
const sha = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else fails++; console.log((c ? '  PASS ' : '  FAIL ') + m); };

async function openStudio(b, hash, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: opt.viewport || { width: 1440, height: 950 }, acceptDownloads: true, deviceScaleFactor: opt.dpr || 1 });
  if (opt.init) await ctx.addInitScript(opt.init);
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', e => p.errs.push('pageerror ' + e.message)); p.on('console', m => m.type() === 'error' && p.errs.push('console ' + m.text()));
  p.on('response', r => { if (r.status() >= 400 && !/\.git\/|studio-base\.json/.test(r.url())) p.errs.push(r.status() + ' ' + r.url()); });
  p.on('requestfailed', r => { if (!/\.git\/|studio-base\.json/.test(r.url())) p.errs.push('failed ' + r.url()); });
  await p.goto(STUDIO + '#' + (hash || 'ep01v3'));
  await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 });
  return p;
}
const go = (p, no) => p.evaluate(no => Studio.select(no, 'test'), no);
const snap = p => p.evaluate(() => JSON.stringify(Studio.stage.frame.info(Studio.state.cut).map(i => [i.src, +i.x.toFixed(2), +i.y.toFixed(2), +i.w.toFixed(2), +i.h.toFixed(2), i.tip && [+i.tip.x.toFixed(2), +i.tip.y.toFixed(2)]])));
const edits = p => p.evaluate(() => JSON.stringify(Studio.store.episodes()));
const settle = p => p.waitForFunction(() => !Studio.stage.frame.rendering && !document.body.classList.contains('is-busy'), null, { timeout: 60000 });

const SUITES = {
  /* 공통: 식별자·저장소·마이그레이션·충돌 */
  async core(b) {
    const v2 = { 24: { 0: { x: 40, y: 30, w: 60 } } };
    const p = await openStudio(b, 'ep01v3', { init: `try{ if(!sessionStorage.getItem('t')){ localStorage.clear(); localStorage.setItem('ep-bubble-editor-v2', ${JSON.stringify(JSON.stringify({ ep01v3: v2 }))}); sessionStorage.setItem('t','1'); } }catch(e){}` });
    const r = await p.evaluate(() => {
      const I = Studio.ids, o = {};
      o.parse = I.parse('c017.l0.b1'); o.fresh = I.parse(I.fresh('c017', 'l')); o.screen = I.screen(60, 0, 1); o.bad = I.parse('x17');
      o.migrated = Studio.store.get('bubbles', 'c024.l0'); o.legacyKept = localStorage.getItem('ep-bubble-editor-v2') !== null;
      o.v1 = Studio.store.migrate({ tool: 'bubble-editor', version: 1, edits: { ep01v3: { '24:0': { x: 45, y: 35, w: 62, h: 20, tail: { on: true, tx: 35, ty: 78, sa: null, th: 14, curve: 0.2 } } } } }).episodes;
      o.anchor = Studio.store.anchors('ep01v3')['c024.l0']; o.fpNow = Studio.base.fingerprint('ep01v3', 'c024.l0');
      o.missing = Studio.base.fingerprint('ep01v3', 'c024.l9'); o.info = Studio.base.info(); o.links = Studio.base.links('ep01v3', 'c094.p1'); o.links33 = [0, 1, 2].map(i => Studio.base.links('ep01v3', 'c033.p' + i).lines.length); return o;
    });
    ok(r.parse && r.parse.cut === 17 && r.parse.kind === 'b' && r.parse.index === 1 && r.parse.parts[0].kind === 'l', 'ID 파싱 c017.l0.b1');
    ok(r.fresh && r.fresh.fresh && r.fresh.cut === 17, '새 요소 ID(~) 생성·파싱'); ok(r.screen === 'c060.s0_1', '화면 ID 형식'); ok(r.bad === null, '잘못된 ID 거부');
    ok(r.migrated && r.migrated.x === 40, '예전 v2 자동 저장값 → Studio 로 이전'); ok(r.legacyKept, '예전 자동 저장 키는 지우지 않음');
    ok(r.v1.ep01v3 && r.v1.ep01v3.edits.bubbles['c024.l0'].tail.tip.x === 35, 'v1 JSON → v3 변환');
    ok(r.anchor && r.anchor === r.fpNow, '편집 지문 기록'); ok(r.missing === null, '없는 요소 지문 null');
    ok(r.links.screens.indexOf('c094.s1') >= 0, '패널 연결 관계(c094.p1 → 휴대폰 화면 c094.s1)'); ok(r.links33.reduce((x, y) => x + y, 0) > 0, '패널 연결 관계(c033 조각별 대사 ' + r.links33.join('/') + ')');
    ok(r.info.commit && r.info.episodes.ep01v3.cuts === 104 && r.info.episodes.ep01v3.readerCuts === 99, '기준 정보(커밋·104컷·독자 99컷) ' + (r.info.commit || '').slice(0, 7));
    // 충돌: 지문을 다른 값으로 넣은 파일을 불러오면 changed, 없는 대사는 missing
    const d = await p.evaluate(() => { const d = Studio.store.exportData(); d.episodes.ep01v3.anchors['c024.l0'] = 'hdeadbeef'; d.episodes.ep01v3.edits.bubbles['c024.l9'] = { x: 1, y: 1 }; d.episodes.ep01v3.anchors['c024.l9'] = 'h1'; return d; });
    const cf = path.join(OUT, 'conflict.json'); fs.writeFileSync(cf, JSON.stringify(d)); await p.setInputFiles('#file', cf); await p.waitForTimeout(800);
    const res = await p.evaluate(() => Studio.store.conflicts('ep01v3'));
    ok(res.some(c => c.id === 'c024.l0' && c.reason === 'changed') && res.some(c => c.id === 'c024.l9' && c.reason === 'missing'), '불러오기 충돌 검출(changed·missing)');
    ok(await p.evaluate(() => document.querySelector('.nav .on') && document.querySelector('.nav .on').dataset.panel === 'qa'), '충돌 시 QA 패널 열림');
    await p.evaluate(() => Studio.store.undo()); ok(await p.evaluate(() => !Studio.store.get('bubbles', 'c024.l9')), '불러오기 실행 취소');
    ok(!p.errs.length, '오류 없음 ' + p.errs.slice(0, 3).join(' | ')); await p.context().close();
  },

  /* 말풍선 모듈: v2 조작 유지 + 편집기↔실제 독자 화면 일치 */
  async bubbles(b) {
    const p = await openStudio(b, 'ep01v3/11', { init: `try{ if(!sessionStorage.getItem('t')){ localStorage.clear(); sessionStorage.setItem('t','1'); } }catch(e){}` });
    await go(p, 11); const s0 = await snap(p);
    let bx = await p.locator('#ov .hit.sel').boundingBox();
    await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.mouse.move(bx.x + bx.width / 2 + 40, bx.y + bx.height / 2 + 20, { steps: 6 }); await p.mouse.up();
    const s1 = await snap(p), a = JSON.parse(s0)[0], c = JSON.parse(s1)[0];
    ok(Math.abs((c[1] - a[1]) - 40) < 2 && Math.abs((c[2] - a[2]) - 20) < 2, '드래그 이동 (40,20) → ' + (c[1] - a[1]).toFixed(1) + ',' + (c[2] - a[2]).toFixed(1));
    ok(a[5] && c[5] && Math.abs((c[5][0] - a[5][0]) - 40) < 2, '꼬리 끝점 함께 이동');
    bx = await p.locator('#ov .h.size').boundingBox(); await p.mouse.move(bx.x + 8, bx.y + 8); await p.mouse.down(); await p.mouse.move(bx.x + 48, bx.y + 28, { steps: 5 }); await p.mouse.up();
    const s2 = JSON.parse(await snap(p))[0]; ok(s2[3] > c[3] + 10, '크기 핸들 폭 ' + c[3].toFixed(0) + '→' + s2[3].toFixed(0));
    bx = await p.locator('#ov .h[data-h=tip]').boundingBox(); await p.mouse.move(bx.x + 8, bx.y + 8); await p.mouse.down(); await p.mouse.move(bx.x - 20, bx.y + 30, { steps: 5 }); await p.mouse.up();
    ok(JSON.parse(await snap(p))[0][5][0] < s2[5][0] - 10, '꼬리 끝점 드래그');
    await p.evaluate(() => { const e = document.getElementById('bb-gf'); e.value = 19; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
    ok(await p.evaluate(() => { const d = Studio.stage.frame.doc(), t = d.querySelector('#cut-11 .bv4-b .bv4-text'); return d.defaultView.getComputedStyle(t).fontSize; }) === '19px', '글자 크기 슬라이더 → 실제 화면 19px');
    await p.evaluate(() => { const e = document.getElementById('bb-tc'); e.value = 0.4; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
    ok(await p.evaluate(() => /Q/.test(Studio.stage.frame.doc().querySelector('#cut-11 .bv4-layer').innerHTML)), '꼬리 곡선 → Q 경로');
    const e4 = await edits(p), nh = await p.evaluate(() => Studio.store.history().length); ok(nh >= 6, '실행 취소 이력 ' + nh);
    await p.click('#undo'); await p.click('#undo'); ok((await edits(p)) !== e4, '되돌리기'); await p.click('#redo'); await p.click('#redo'); ok((await edits(p)) === e4, '다시 실행');
    await p.keyboard.press('Control+z'); await p.keyboard.press('Control+Shift+z'); ok((await edits(p)) === e4, 'Ctrl+Z / Ctrl+Shift+Z');
    const k0 = await snap(p); await p.locator('#stage').click({ position: { x: 2, y: 2 } }).catch(() => {}); await p.keyboard.press('Shift+ArrowRight'); ok((await snap(p)) !== k0, '화살표 키 이동');
    // 통합 JSON 왕복
    await p.evaluate(() => Studio.store.set('bubbles', 'c024.l0', { x: 40, y: 30, w: 60, pad: 10, fs: 18, tail: { tip: { x: 30, y: 80 }, thick: 20, curve: -0.3, start: 120 } }, { label: 't' }));
    const E = await edits(p), before = {}; for (const n of [11, 24]) { await go(p, n); before[n] = await snap(p); }
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#jsonOut')]); const f = path.join(OUT, 'studio-export.json'); await dl.saveAs(f);
    const ex = JSON.parse(fs.readFileSync(f, 'utf8'));
    ok(ex.format === 'lastaccess-studio' && ex.version === 3 && JSON.stringify(ex.episodes) === E && ex.base && ex.base.episodes.ep01v3.art.c017, '통합 JSON v3(편집·기준 정보·원화 식별)');
    await p.evaluate(() => { Studio.store.flush(); localStorage.clear(); }); await p.reload(); await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 });
    ok((await edits(p)) === '{}', '저장소 비운 뒤 편집 없음');
    await p.setInputFiles('#file', f); await p.waitForFunction(() => Studio.store.count().bubbles > 0, null, { timeout: 10000 }); await settle(p);
    ok((await edits(p)) === E, 'JSON 불러오기 → 편집 동일');
    for (const n of [11, 24]) { await go(p, n); ok((await snap(p)) === before[n], 'JSON 복원 후 #' + n + ' 위치·크기·꼬리 동일'); }
    await p.reload(); await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 }); ok((await edits(p)) === E, '새로고침 후 자동 복원');
    const v2f = path.join(OUT, 'v2.json'); fs.writeFileSync(v2f, JSON.stringify({ tool: 'bubble-editor', version: 2, edits: { ep01v3: { 13: { 0: { x: 50, y: 50 } } } } }));
    await p.setInputFiles('#file', v2f); await p.waitForTimeout(800); ok(await p.evaluate(() => (Studio.store.get('bubbles', 'c013.l0') || {}).x === 50), '말풍선 편집기 v2 JSON 불러오기');
    await p.evaluate(() => { Studio.select(13); Studio.activate('bubbles'); }); await p.click('#rsCut'); ok(await p.evaluate(() => !Studio.store.get('bubbles', 'c013.l0')), '컷 초기화');
    ok(!p.errs.length, '오류 없음 ' + p.errs.slice(0, 3).join(' | '));
    // 편집기 ↔ 실제 독자 화면 일치
    const CUTS = [10, 11, 13, 14, 19, 24, 45, 62, 95, 98, 101, 102, 33, 52, 70];
    await p.evaluate(CUTS => { const S = Studio, I = S.ids, ep = {}; CUTS.forEach((no, k) => { S.select(no); const info = S.stage.frame.info(no), srcs = [...new Set(info.map(i => i.src))].filter(s => info.filter(q => q.src === s).length === 1);
      srcs.slice(0, 2).forEach((s, j) => { const it = info.filter(q => q.src === s)[0], pr = it.panel, cx = (it.x + it.w / 2 - pr.x) / pr.w * 100, cy = (it.y + it.h / 2 - pr.y) / pr.h * 100, m = { x: +(cx + (j ? -6 : 7)).toFixed(1), y: +(cy + (j ? 4 : -5)).toFixed(1) };
        if ((k + j) % 2 === 0) { m.w = +(it.w / pr.w * 90).toFixed(1); m.pad = it.type === 'mono' ? 14 : 8; m.fs = (it.fs || 16) + 1; m.lh = 1.3; }
        if ((k + j) % 3 === 0) { m.h = +(it.h / pr.h * 100 + 4).toFixed(1); m.radius = it.type === 'mono' ? 10 : 24; }
        if (it.tip) { const t = { tip: { x: +((it.tip.x - pr.x) / pr.w * 100 + (j ? 4 : -8)).toFixed(1), y: +((it.tip.y - pr.y) / pr.h * 100 + 6).toFixed(1) }, thick: 12 + k % 3 * 4, curve: [0, 0.3, -0.3][k % 3] }; if (k % 2) t.start = [30, 90, 150, 210, 270, 330][(k + j) % 6]; m.tail = t; }
        else if (k % 4 === 0) m.tail = { on: false };
        ep[I.line(no, s)] = m; }); });
      S.store.reset({ module: 'bubbles' }); Object.keys(ep).forEach(id => S.store.set('bubbles', id, ep[id], { live: true })); S.store.checkpoint('일치 검사'); }, CUTS);
    const patch = await p.evaluate(() => Studio.modules.bubbles._.patchText());
    for (const W of (process.env.WIDTHS || '320,360,390,430,768').split(',').map(Number)) {
      await p.evaluate(W => Studio.stage.setWidth(W), W); await settle(p);
      const eInfo = await p.evaluate(CUTS => { const o = {}; CUTS.forEach(no => { Studio.select(no); const sec = Studio.stage.frame.section(no); o[no] = { info: Studio.stage.frame.info(no).map(i => [i.src, i.x, i.y, i.w, i.h, i.tip]), html: sec.querySelector('.bv4-layer').outerHTML }; }); return o; }, CUTS);
      const rp = await b.newPage({ viewport: { width: W, height: 900 } });
      await rp.route('**/data/ep01v3-bubbles.js', async r => { const resp = await r.fetch(); let body = await resp.text(); const src = patch.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
        body += '\n;(function(){ var P = {' + src.replace(/,\s*$/, '') + '}; var B = window.EP01V3_BUBBLES; Object.keys(P).forEach(function(n){ B.cuts[n] = Object.assign({}, B.cuts[n] || {}, P[n]); }); })();\n'; await r.fulfill({ response: resp, body }); });
      await rp.goto(BASE + 'index.html#ep01v3'); await rp.waitForFunction(() => document.body.classList.contains('bv4-done'), null, { timeout: 60000 }); await rp.waitForTimeout(300);
      const rInfo = await rp.evaluate(CUTS => { const o = {}; CUTS.forEach(no => { const sec = document.getElementById('cut-' + (no < 10 ? '0' : '') + no); o[no] = { info: BubblesV4.info(no).map(i => [i.src, i.x, i.y, i.w, i.h, i.tip]), html: sec.querySelector('.bv4-layer').outerHTML }; }); return o; }, CUTS);
      let nb = 0, nh = 0; CUTS.forEach(no => { const A = eInfo[no], R = rInfo[no]; if (JSON.stringify(A.info.map(x => x.map(v => typeof v === 'number' ? Math.round(v * 2) : v && v.x != null ? [Math.round(v.x * 2), Math.round(v.y * 2)] : v))) !== JSON.stringify(R.info.map(x => x.map(v => typeof v === 'number' ? Math.round(v * 2) : v && v.x != null ? [Math.round(v.x * 2), Math.round(v.y * 2)] : v)))) nb++; if (sha(A.html) !== sha(R.html)) nh++; });
      ok(nb === 0 && nh === 0, W + 'px 편집기↔독자 화면(패치 주입) ' + CUTS.length + '컷: 위치·크기·꼬리 불일치 ' + nb + ' · 렌더 HTML 불일치 ' + nh);
      await rp.close();
    }
    await p.context().close();
  },

  /* 썸네일 탐색 바 */
  async timeline(b) {
    const t0 = Date.now();
    const p = await openStudio(b, 'ep01v3/40', { init: `try{ if(!sessionStorage.getItem('t')){ localStorage.clear(); sessionStorage.setItem('t','1'); } }catch(e){}` });
    const ready = Date.now() - t0; await p.waitForTimeout(800);
    const st = await p.evaluate(() => ({ tiles: Object.keys(Studio.timeline.tiles()).length, built: [...document.querySelectorAll('.tl-tile')].filter(t => t._built != null).length, sel: document.querySelector('.tl-tile.is-sel').dataset.no, hidden: [...document.querySelectorAll('.tl-tile.is-hidden')].map(t => t.dataset.no).join(',') }));
    ok(st.tiles === 104, '원본 104컷 타일(숨김 포함) ' + st.tiles); ok(st.hidden === '16,59,60,85,86', '숨김 컷 흐리게 ' + st.hidden);
    ok(st.built > 0 && st.built < 40, '가상화: 화면 근처만 생성 ' + st.built + '/104'); ok(st.sel === '40', '처음 컷 선택 표시'); ok(ready < 20000, '썸네일까지 준비 ' + ready + 'ms');
    ok(await p.evaluate(() => { const t = document.querySelector('.tl-tile.is-sel'), r = t.getBoundingClientRect(), b = document.getElementById('tlBar').getBoundingClientRect(); return r.left >= b.left && r.right <= b.right; }), '선택 타일 자동 스크롤');
    ok(await p.evaluate(() => { const t = document.querySelector('.tl-tile.is-sel'); return getComputedStyle(t).borderTopColor; }) === 'rgb(47, 129, 247)', '선택 타일 파란 테두리');
    const img = await p.evaluate(() => { const t = document.querySelector('.tl-tile[data-no="40"] .tl-img').shadowRoot; return { bub: t.querySelectorAll('.bv4-b').length, img: t.querySelectorAll('img').length }; });
    ok(img.bub > 0 && img.img > 0, '썸네일 = 원화+말풍선 합성 ' + JSON.stringify(img));
    await p.evaluate(() => { document.getElementById('tlBar').style.scrollBehavior = 'auto'; document.getElementById('tlBar').scrollLeft = 99999; }); await p.waitForTimeout(600);
    const st2 = await p.evaluate(() => ({ built: [...document.querySelectorAll('.tl-tile')].filter(t => t._built != null).length, first: document.querySelector('.tl-tile[data-no="1"]')._built })); ok(st2.first == null && st2.built < 60, '멀어진 타일 비우기(끝으로 이동 후 생성 ' + st2.built + ', #1 비움)'); await p.evaluate(() => { document.getElementById('tlBar').style.scrollBehavior = ''; });
    await p.locator('.tl-tile[data-no="38"]').click(); await p.waitForTimeout(200);
    ok(await p.evaluate(() => Studio.state.cut === 38 && document.getElementById('cutSel').value === '38'), '썸네일 클릭 → 중앙·컷 목록 동기');
    await p.selectOption('#cutSel', '45'); await p.waitForTimeout(300); ok(await p.evaluate(() => document.querySelector('.tl-tile.is-sel').dataset.no === '45'), '컷 목록 → 썸네일 동기');
    await p.fill('#tlFind', '27'); await p.press('#tlFind', 'Enter'); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => Studio.state.cut === 27 && document.querySelector('.tl-tile.is-sel').dataset.no === '27'), '컷 번호 검색 이동');
    ok(await p.evaluate(() => { const t = document.querySelector('.tl-tile.is-sel'), r = t.getBoundingClientRect(), b = document.getElementById('tlBar').getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1; }), '검색 후 자동 스크롤');
    await p.evaluate(() => { const e = document.getElementById('tlSize'); e.value = 140; e.dispatchEvent(new Event('input')); }); ok(await p.evaluate(() => document.querySelector('.tl-img').clientWidth === 140), '썸네일 크기 조절');
    // 숨김 컷 선택·복원
    await p.locator('.tl-tile[data-no="16"]').scrollIntoViewIfNeeded(); await p.locator('.tl-tile[data-no="16"]').click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => Studio.state.cut === 16 && Studio.stage.hidden(16) && /숨김/.test(document.getElementById('cutInfo').textContent)), '숨김 컷 선택·표시');
    await p.evaluate(() => Studio.activate('cuts')); await p.click('#ct-show'); await p.waitForFunction(() => !Studio.stage.hidden(16), null, { timeout: 30000 }); await settle(p); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => !document.querySelector('.tl-tile[data-no="16"]').classList.contains('is-hidden') && document.querySelector('.tl-tile[data-no="16"]').classList.contains('is-edited')), '숨김 컷 복원(편집값) → 썸네일 표시·편집 표시');
    await p.click('#undo'); await p.waitForFunction(() => Studio.stage.hidden(16), null, { timeout: 30000 }); ok(true, '복원 실행 취소 → 다시 숨김');
    // 편집 → 썸네일 반영
    await p.evaluate(() => { Studio.activate('bubbles'); Studio.select(40); }); await p.waitForTimeout(800);
    const h0 = await p.evaluate(() => document.querySelector('.tl-tile[data-no="40"] .tl-img').shadowRoot.querySelector('.bv4-b').getAttribute('style'));
    await p.evaluate(() => Studio.store.set('bubbles', 'c040.l0', { x: 20, y: 20 }, { label: 't' })); await p.waitForTimeout(1500);
    const h1 = await p.evaluate(() => document.querySelector('.tl-tile[data-no="40"] .tl-img').shadowRoot.querySelector('.bv4-b').getAttribute('style'));
    ok(h0 !== h1, '편집 → 썸네일 반영'); ok(await p.evaluate(() => document.querySelector('.tl-tile[data-no="40"]').classList.contains('is-edited')), '편집 컷 표시');
    // 썸네일 = 실제 독자 화면 같은 컷의 레이어(편집 없는 컷)
    const same = await p.evaluate(() => { const f = Studio.timeline.frame(), sec = f.section(41); const t = document.querySelector('.tl-tile[data-no="41"]'); t.scrollIntoView(); return sec.querySelector('.bv4-layer').outerHTML.length; });
    ok(same > 0, '썸네일 렌더러에 컷 레이어 존재');
    ok(!p.errs.length, '오류 없음 ' + p.errs.slice(0, 3).join(' | ')); await p.context().close();
  },

  /* 화면 크기 */
  async layout(b) {
    for (const vw of [320, 360, 390, 430, 768, 1024, 1440]) {
      const p = await openStudio(b, 'ep01v3/62', { viewport: { width: vw, height: 900 } });
      const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, w: Studio.stage.width, hits: document.querySelectorAll('#ov .hit').length }));
      ok(r.sw <= r.cw + 1 && r.w === 390 && r.hits > 0, vw + 'px: 가로 넘침 없음(' + r.sw + '/' + r.cw + ') · 기본 폭 390 · 말풍선 핸들 ' + r.hits);
      await p.screenshot({ path: path.join(OUT, 'layout-' + vw + '.png'), fullPage: vw < 800 });
      ok(!p.errs.length, vw + 'px 오류 없음 ' + p.errs.slice(0, 3).join(' | ')); await p.context().close();
    }
    const p = await openStudio(b, 'ep01v3/62');
    for (const w of [320, 360, 430, 768, 390]) { await p.click('#widths [data-w="' + w + '"]'); await settle(p); const r = await p.evaluate(() => ({ w: Studio.stage.frame.el.clientWidth, hits: document.querySelectorAll('#ov .hit').length })); ok(r.w === w && r.hits > 0, '미리보기 폭 ' + w + ' 전환'); }
    await p.click('[data-mode=side]'); await settle(p); await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, 'side-by-side.png') });
    ok(await p.evaluate(() => Studio.stage.compare && Studio.stage.compare.el.style.display !== 'none' && Studio.stage.compare.section(62) != null), '나란히 비교');
    await p.click('[data-mode=edit]'); await settle(p); await p.context().close();
  },

  /* 회귀: 편집이 없으면 독자 화면과 같은 HTML (모든 컷, 3개 폭) */
  async regression(b) {
    for (const W of [320, 390, 768]) {
      const rp = await b.newPage({ viewport: { width: W, height: 900 } });
      await rp.goto(BASE + 'index.html#ep01v3'); await rp.waitForFunction(() => document.body.classList.contains('bv4-done'), null, { timeout: 60000 });
      const R = await rp.evaluate(() => { const o = {}; document.querySelectorAll('.cut').forEach(s => { o[s.dataset.no] = s.outerHTML.replace(/ (is-in|is-loaded)/g, ''); }); return o; }); await rp.close();   /* 그림 로딩 완료 표시(is-loaded)는 렌더 결과가 아니라 로딩 시점 차이 */
      const p = await openStudio(b, 'ep01v3', { init: `try{ localStorage.clear(); }catch(e){}` });
      if (W !== 390) { await p.evaluate(W => Studio.stage.setWidth(W), W); await settle(p); }
      const A = await p.evaluate(() => { const f = Studio.stage.frame, d = f.doc(); d.documentElement.classList.remove('st-one'); const o = {}; d.querySelectorAll('.cut').forEach(s => { o[s.dataset.no] = s.outerHTML.replace(/ (st-cur|st-prev|is-in|is-loaded)/g, '').replace(/ class=""/g, ''); }); return o; });
      const diff = Object.keys(R).filter(k => sha(R[k]) !== sha(A[k] || ''));
      ok(Object.keys(R).length === 99 && diff.length === 0, W + 'px: 편집 없는 Studio 렌더 = 독자 화면 (99컷 HTML 동일, 다름 ' + diff.length + (diff.length ? ': ' + diff.slice(0, 8).join(',') : '') + ')');
      ok(Object.keys(A).length === 104, W + 'px: Studio 는 숨김 5컷 포함 104컷 렌더');
      await p.context().close();
    }
  }
};

/* 모듈 검사 파일 자동 등록: tests/<이름>.test.js → module.exports = async function (browser, h) { … } */
const H = { openStudio, ok: (c, m) => ok(c, m), go, snap, edits, settle, BASE, STUDIO, OUT, sha };
for (const f of fs.readdirSync(__dirname).filter(f => /\.test\.js$/.test(f)).sort()) { const name = f.replace(/\.test\.js$/, ''); if (SUITES[name]) { console.error('검사 이름 중복: ' + name); process.exit(2); } const fn = require(path.join(__dirname, f)); SUITES[name] = b => fn(b, H); }

(async () => {
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SUITES);
  const b = await chromium.launch();
  for (const s of want) { console.log('[' + s + ']'); const t = Date.now(); try { await SUITES[s](b); } catch (e) { fails++; console.log('  FAIL 예외 ' + (e && e.stack || e).toString().split('\n').slice(0, 3).join(' / ')); } console.log('  (' + ((Date.now() - t) / 1000).toFixed(1) + 's)'); }
  await b.close();
  console.log((fails ? 'FAIL ' + fails : 'ALL PASS') + ' · pass ' + passes + ' · 스크린숏 ' + OUT);
  process.exit(fails ? 1 : 0);
})();
