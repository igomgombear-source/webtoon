/* Studio 2단계 통합 검증 — 엔진 회귀(이전 엔진과 HTML 비교), 렌더러 경쟁 상태, 일괄 편집, 새·복제 컷 ID·편집 승계, 컴파일 순서, 교차 모듈, 좌표 변환 */
const fs = require('fs'), path = require('path'), cp = require('child_process');
module.exports = async function (b, h) {
  const { openStudio, ok, go, BASE, OUT, sha } = h;
  const settle = async p => { await h.settle(p); await p.evaluate(() => Studio.modules.dialogue.ensureFresh()); await h.settle(p); await p.waitForTimeout(150); };
  const CLEAN = `try{ if(!sessionStorage.getItem('t')){ localStorage.clear(); sessionStorage.setItem('t','1'); } }catch(e){}`;
  const root = path.resolve(__dirname, '../../..');
  const BASEREF = process.env.ENGINE_BASE || '7b6f791';

  // 1) 엔진 회귀: 이전 엔진(js/bubbles.js·css/bubbles.css @ 7b6f791)과 지금 엔진의 독자 화면 HTML 이 같다(편집값 없음)
  let oldJs = null, oldCss = null; try { oldJs = cp.execSync('git show ' + BASEREF + ':js/bubbles.js', { cwd: root }).toString(); oldCss = cp.execSync('git show ' + BASEREF + ':css/bubbles.css', { cwd: root }).toString(); } catch (e) {}
  if (!oldJs) ok(false, '이전 엔진(' + BASEREF + ')을 git 에서 읽지 못함');
  else for (const W of [320, 360, 390, 430, 768]) {
    const grab = async old => { const ctx = await b.newContext({ viewport: { width: W, height: 900 } }); const p = await ctx.newPage();
      if (old) { await p.route('**/js/bubbles.js', r => r.fulfill({ body: oldJs, contentType: 'text/javascript' })); await p.route('**/css/bubbles.css', r => r.fulfill({ body: oldCss, contentType: 'text/css' })); }
      await p.goto(BASE + 'index.html#ep01v3'); await p.waitForFunction(() => document.body.classList.contains('bv4-done'), null, { timeout: 60000 }); await p.waitForTimeout(250);
      const o = await p.evaluate(() => [...document.querySelectorAll('.cut')].map(s => s.dataset.no + ':' + s.outerHTML.replace(/ (is-in|is-loaded)/g, '')).join('\n')); await ctx.close(); return o; };
    const a = await grab(true), c = await grab(false);
    ok(sha(a) === sha(c), W + 'px 엔진 확장(manual.style·align·config) 후 편집 없는 99컷 HTML 이 이전 엔진과 동일');
  }

  const p = await openStudio(b, 'ep01v3/11', { init: CLEAN });
  await go(p, 11); await settle(p);

  // 2) 경쟁 상태(코어 수정): 그리는 도중 들어온 편집이 반영되고, 강제 재그리기 없이 정확히 두 번만 그린다
  const race = await p.evaluate(async () => { const f = Studio.stage.frame; let n = 0; const on = Studio.on('rendered', ev => { if (ev.frame === f && ev.full) n++; });
    Studio.modules.dialogue.setText('c011.l0', '경쟁 상태 첫 편집입니다.'); await new Promise(r => setTimeout(r, 30)); Studio.modules.dialogue.setText('c011.l1', '도중에 들어온 편집'); Studio.modules.dialogue.setText('c011.l2', '세 번째!');
    await f.queue; await new Promise(r => setTimeout(r, 300)); Studio.off('rendered', on);
    const txt = [...f.section(11).querySelectorAll('.bv4-b .bv4-text')].map(t => t.textContent.replace(/ /g, ' ')); return { n, txt }; });
  ok(race.txt.join('|') === '경쟁 상태 첫 편집입니다.|도중에 들어온 편집|세 번째!', '그리는 도중 들어온 편집 2개까지 화면에 반영(코어 서명 수정) ' + race.txt.join('|'));
  ok(race.n === 2, '회차 다시 그리기 2회(첫 편집 + 대기 중 편집 묶음) — 임시 보정의 중복 재그리기 없음 (' + race.n + '회)');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);

  // 3) 일괄 편집 API
  const bt = await p.evaluate(() => { const S = Studio, h0 = S.store.history().length; let ch = 0; const on = S.on('change', () => ch++);
    S.store.batch('일괄 테스트', st => { st.set('bubbles', 'c011.l0', { x: 30, y: 30 }); st.set('bubbles', 'c011.l1', { x: 60, y: 60 }); S.store.batch('안쪽', () => S.store.set('dialogue', 'c011.l2', { who: '해인' })); S.store.checkpoint('무시되어야 함'); });
    const after = { ch, h: S.store.history().length - h0, last: S.store.history().slice(-1)[0].label, n: Object.keys(S.store.slice('bubbles')).length + Object.keys(S.store.slice('dialogue')).length };
    S.store.undo(); after.undone = Object.keys(S.store.slice('bubbles')).length + Object.keys(S.store.slice('dialogue')).length; S.store.redo(); after.redone = Object.keys(S.store.slice('bubbles')).length;
    S.off('change', on); return after; });
  ok(bt.ch === 1 && bt.h === 1 && bt.last === '일괄 테스트' && bt.n === 3, '일괄 편집: 변경 알림 1번·실행 취소 1단계(안쪽 batch·checkpoint 합쳐짐) ' + JSON.stringify(bt));
  ok(bt.undone === 0 && bt.redone === 2, '일괄 편집 실행 취소 한 번에 3개 모두 되돌림·다시 실행');
  await settle(p);
  const tt = await p.evaluate(() => { const h0 = Studio.store.history().length; Studio.store.batch('원화+꼬리(모의)', () => { Studio.store.set('cuts', 'c011', { hidden: false }, { live: true }); Studio.modules.bubbles.transformTips('c011.p0', { x: 5 }, { apply: true }); }); return Studio.store.history().length - h0; });
  ok(tt === 1, '다른 모듈 편집 + transformTips(apply) 를 바깥 batch 로 감싸면 실행 취소 한 단계');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);

  // 4) 컴파일 순서
  const co = await p.evaluate(() => Studio.renderer.compileOrder(Studio.stage.frame));
  ok(co.episode.indexOf('cuts') >= 0 && co.episode.indexOf('cuts') < co.episode.indexOf('dialogue') && co.cut.join() === 'bubbles' && co.issues.length === 0, '컴파일 순서: 컷 구성 → 대사(회차 단계), 말풍선(컷 단계), 문제 없음 ' + JSON.stringify(co));

  // 5) 새·복제 컷: 컷 구성 모듈의 복제(후속 Codex 구현 자리)를 테스트용으로 흉내 — 코어의 컷 ID·승계·초기화·QA·썸네일 경로 검증
  await p.evaluate(() => { const C = Studio.modules.cuts, orig = C.compile; C.__orig = orig;
    C.compile = function (ctx) { orig.call(this, ctx); const dups = Object.keys(ctx.edits).filter(id => ctx.edits[id] && ctx.edits[id].dupAs).map(id => [id, ctx.edits[id].dupAs]);
      dups.forEach(([src, sid], k) => { const cuts = ctx.data.episode.cuts, i = cuts.findIndex(c => c.no === Studio.ids.cutNo(src)); if (i < 0) return; const c = JSON.parse(JSON.stringify(cuts[i])); c.no = 1000 + c.no + k * 100; c.sid = sid; c.from = src; cuts.splice(i + 1, 0, c);
        if (ctx.data.bubbles && ctx.data.bubbles.cuts && ctx.data.bubbles.cuts[cuts[i].no]) ctx.data.bubbles.cuts[c.no] = JSON.parse(JSON.stringify(ctx.data.bubbles.cuts[cuts[i].no])); }); }; });
  // 원본 컷에 편집 → 복제하면서 승계
  await p.evaluate(() => { const S = Studio; S.store.batch('원본 편집', () => { S.store.set('bubbles', 'c011.l0', { x: 32, y: 22, w: 58, style: { bg: '#fff3c4' } }); S.modules.dialogue.setText('c011.l2', '승계될 대사!'); }); }); await settle(p);
  const nCopied = await p.evaluate(() => { const S = Studio; let n = 0; S.store.batch('컷 복제(모의)', () => { S.store.set('cuts', 'c011', { dupAs: 'c~dup01' }); n = S.store.copyCut('c011', 'c~dup01', { modules: ['bubbles', 'dialogue'] }); }); return n; });
  await settle(p);
  const dup = await p.evaluate(() => { const f = Studio.stage.frame; return { no: f.noOf('c~dup01'), id: f.idOf(1011), order: f.order.slice(f.order.indexOf(11), f.order.indexOf(11) + 3), sids: (f.cut(1011) || {}).lines && f.cut(1011).lines.map(l => l.sid) }; });
  ok(nCopied === 2 && dup.no === 1011 && dup.id === 'c~dup01' && dup.order.join() === '11,1011,12', '복제 컷: 컷 ID c~dup01 ↔ 번호 1011, 원본 바로 뒤 · 승계 편집 ' + nCopied + '개');
  ok(dup.sids && dup.sids.join() === 'c~dup01.l0,c~dup01.l1,c~dup01.l2', '복제 컷 대사 줄 ID(c~dup01.l0~2)');
  const geo = no => p.evaluate(no => { Studio.select(no); const f = Studio.stage.frame; return { info: f.info(no).map(i => [Math.round(i.x), Math.round(i.y), Math.round(i.w), Math.round(i.h)]), txt: [...f.section(no).querySelectorAll('.bv4-b .bv4-text')].map(t => t.textContent.replace(/ /g, ' ')), fill: f.section(no).querySelector('.bv4-b path').style.fill }; }, no);
  const g11 = await geo(11), g1011 = await geo(1011);
  ok(JSON.stringify(g11) === JSON.stringify(g1011) && g1011.txt[2] === '승계될 대사!' && /255, 243, 196|fff3c4/i.test(g1011.fill), '복제 컷이 원본의 말풍선 위치·색·대사 편집을 승계(화면 동일)');
  await p.evaluate(() => Studio.store.set('bubbles', 'c~dup01.l0', { x: 70, y: 70 }, { label: '복제 컷만 편집' })); await settle(p);
  const g11b = await geo(11), g1011b = await geo(1011);
  ok(JSON.stringify(g11b.info) === JSON.stringify(g11.info) && JSON.stringify(g1011b.info) !== JSON.stringify(g11.info), '복제 컷만 따로 편집(원본 불변)');
  await p.evaluate(() => { Studio.activate('bubbles'); Studio.select(1011); }); await p.waitForTimeout(200);
  ok(/c~dup01/.test(await p.locator('#cutInfo').textContent()), '컷 머리글에 복제 컷 ID 표시');
  await p.waitForTimeout(1500);
  const tl = await p.evaluate(() => { const t = document.querySelector('.tl-tile[data-no="1011"]'); return !t ? 'no tile' : { ed: t.classList.contains('is-edited'), txt: t.textContent, sel: t.classList.contains('is-sel'), built: t._built, n: t.querySelector('.tl-img').shadowRoot ? t.querySelector('.tl-img').shadowRoot.querySelectorAll('.bv4-b').length : -1 }; });
  ok(tl.ed && /새/.test(tl.txt) && tl.n === 3, '썸네일: 복제 컷 타일(새·편집 표시·말풍선 3개) ' + JSON.stringify(tl));
  await p.evaluate(() => Studio.activate('qa')); ok(await p.locator('#props [data-go="1011"]').count() === 1, 'QA 편집 현황에 복제 컷(#1011 c~dup01) 이동 버튼');
  ok(await p.evaluate(() => Studio.store.conflicts('ep01v3').length === 0 && Studio.store.anchors('ep01v3')['c~dup01.l0'] === 'fresh'), '복제 컷 편집은 충돌 검사 대상 아님(fresh)');
  // JSON 왕복
  const E = await h.edits(p); const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => Studio.activate('bubbles')).then(() => p.click('#jsonOut'))]); const jf = path.join(OUT, 'integration-dup.json'); await dl.saveAs(jf);
  await p.evaluate(() => { Studio.store.flush(); localStorage.clear(); }); await p.reload(); await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 });
  await p.evaluate(() => { const C = Studio.modules.cuts, orig = C.compile; C.compile = function (ctx) { orig.call(this, ctx); Object.keys(ctx.edits).filter(id => ctx.edits[id] && ctx.edits[id].dupAs).forEach((src, k) => { const sid = ctx.edits[src].dupAs, cuts = ctx.data.episode.cuts, i = cuts.findIndex(c => c.no === Studio.ids.cutNo(src)); const c = JSON.parse(JSON.stringify(cuts[i])); c.no = 1000 + c.no + k * 100; c.sid = sid; c.from = src; cuts.splice(i + 1, 0, c); if (ctx.data.bubbles.cuts[cuts[i].no]) ctx.data.bubbles.cuts[c.no] = JSON.parse(JSON.stringify(ctx.data.bubbles.cuts[cuts[i].no])); }); }; });
  await p.setInputFiles('#file', jf); await p.waitForFunction(() => Studio.store.count().cuts > 0, null, { timeout: 10000 }); await settle(p);
  ok((await h.edits(p)) === E && JSON.stringify((await geo(1011)).info) === JSON.stringify(g1011b.info), '복제 컷 편집 JSON 저장·복원(위치 동일)');
  // 복제 컷 초기화는 복제 컷만
  await p.evaluate(() => { Studio.activate('bubbles'); Studio.select(1011); }); await p.click('#rsCut'); await settle(p);
  const left = await p.evaluate(() => ({ dup: Object.keys(Studio.store.slice('bubbles')).filter(k => k.indexOf('c~dup01') === 0).length + Object.keys(Studio.store.slice('dialogue')).filter(k => k.indexOf('c~dup01') === 0).length, orig: !!Studio.store.get('bubbles', 'c011.l0'), cutKeep: !!Studio.store.get('cuts', 'c011') }));
  ok(left.dup === 0 && left.orig && left.cutKeep, '복제 컷 초기화: 복제 컷(c~dup01) 편집만 지움, 원본 c011 편집·복제 설정 유지');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);
  ok(await p.evaluate(() => Studio.stage.frame.order.indexOf(1011) < 0 && Studio.stage.frame.order.length === 104), '복제 설정 초기화 → 원래 104컷');

  // 6) 공통 좌표 변환
  const gm = await p.evaluate(() => { const G = Studio.geom, T = { scale: 1.3, x: 7, y: -4, rotate: 23, flipX: true }, sz = { w: 4, h: 3 }, pt = { x: 31, y: 64 };
    const a = G.point(pt, T, sz), back = G.invert(a, T, sz); const q = G.quad([[0.2, 0.3], [0.4, 0.3], [0.4, 0.6], [0.2, 0.6]], { x: 10 }, sz); const r = G.rect({ x: 10, y: 10, w: 20, h: 10 }, { rotate: 90 }, { w: 1, h: 1 });
    return { back, q, r, id: G.identity({}), nid: G.identity({ x: 1 }) }; });
  ok(Math.abs(gm.back.x - 31) < 0.01 && Math.abs(gm.back.y - 64) < 0.01, '좌표 변환 왕복(확대·이동·회전·반전 → 역변환)');
  ok(Math.abs(gm.q[0][0] - 0.3) < 1e-6 && Math.abs(gm.q[0][1] - 0.3) < 1e-6 && gm.r.w === 10 && gm.r.h === 20 && gm.id && !gm.nid, '휴대폰 화면 모서리(quad 0~1)·보호 영역 사각형 변환');

  // 7) 교차 모듈: 한 컷에 대사 수정·재배열·분할 + 말풍선 정밀값·모양·색 + 정렬 + 보호 영역 연동 + 꼬리 연동 → 패치를 넣은 실제 독자 화면과 같다
  await go(p, 11); await settle(p);
  await p.evaluate(() => { const S = Studio, D = S.modules.dialogue, B = S.modules.bubbles;
    D.setText('c011.l1', '교차 모듈 검사입니다. 두 번째 문장!'); D.moveLine('c011.l2', -1); D.split('c011.l1', null); D.setAlign('c011.l0', 'left');
    S.store.set('bubbles', 'c011.l0', { x: 40, y: 22, w: 62, style: { kind: 'round', font: 'serif', color: '#1a3a6b', bg: '#eef6ff', stroke: '#1a3a6b' } }, { label: 'x' });
    S.store.set('bubbles', 'c011.l1.b1', { x: 68, y: 72, w: 44, style: { kind: 'jag' } }, { label: 'x' }); });
  await settle(p); await go(p, 11); await settle(p);
  await p.evaluate(() => { Studio.modules.bubbles.transformZones('c011.p0', { x: 4, y: 3 }, { apply: true }); Studio.modules.bubbles.transformTips('c011.p0', { x: 3 }, { apply: true }); }); await settle(p); await go(p, 11); await settle(p);
  const dPatch = await p.evaluate(() => Studio.modules.dialogue._.patchText()), bPatch = await p.evaluate(() => Studio.modules.bubbles._.patchText());
  ok(/align: 'left'/.test(dPatch) && /style: \{ kind: 'round'/.test(bPatch) && /zones: \[/.test(bPatch), '패치에 정렬·모양·보호 영역 포함');
  const strip = t => t.split('\n').filter(l => !/^\s*\/\/ /.test(l)).map(l => l.replace(/\s+\/\/ [^\n]*$/, '')).join('\n').replace(/,\s*$/, '');
  for (const W of [320, 390, 768]) {
    await p.evaluate(W => Studio.stage.setWidth(W), W); await settle(p);
    const e = await p.evaluate(() => { Studio.select(11); const f = Studio.stage.frame; return { info: f.info(11).map(i => [i.x, i.y, i.w, i.h, i.tip]), html: f.section(11).querySelector('.bv4-layer').outerHTML.replace(/ data-src="\d+"/g, '') }; });
    const rp = await b.newPage({ viewport: { width: W, height: 900 } });
    await rp.route('**/data/ep01v3.js', async r => { const resp = await r.fetch(); let body = await resp.text(); body += '\n;(function(){ var P = {' + strip(dPatch) + '}; WEBTOON.episodeData.ep01v3.cuts.forEach(function(c){ if (P[c.no]) c.lines = P[c.no]; }); })();\n'; await r.fulfill({ response: resp, body }); });
    await rp.route('**/data/ep01v3-bubbles.js', async r => { const resp = await r.fetch(); let body = await resp.text(); body += '\n;(function(){ var P = {' + strip(bPatch) + '}; var B = window.EP01V3_BUBBLES; Object.keys(P).forEach(function(n){ B.cuts[n] = Object.assign({}, B.cuts[n] || {}, P[n]); }); })();\n'; await r.fulfill({ response: resp, body }); });
    await rp.goto(BASE + 'index.html#ep01v3'); await rp.waitForFunction(() => document.body.classList.contains('bv4-done'), null, { timeout: 60000 }); await rp.waitForTimeout(300);
    const r = await rp.evaluate(() => ({ info: BubblesV4.info(11).map(i => [i.x, i.y, i.w, i.h, i.tip]), html: document.getElementById('cut-11').querySelector('.bv4-layer').outerHTML.replace(/ data-src="\d+"/g, '') }));
    const q = a => JSON.stringify(a.map(x => x.map(v => typeof v === 'number' ? Math.round(v * 2) : v && v.x != null ? [Math.round(v.x * 2), Math.round(v.y * 2)] : v)));
    ok(q(e.info) === q(r.info) && sha(e.html) === sha(r.html), W + 'px 교차 모듈(대사 수정·재배열·분할·정렬 + 정밀값·모양·글꼴·색 + 보호 영역·꼬리 연동): Studio = 패치를 넣은 실제 독자 화면');
    await rp.close();
  }
  await p.evaluate(() => Studio.stage.setWidth(390)); await settle(p);
  // 실행 취소로 처음 상태까지 → 편집 없음 = 독자 화면
  const steps = await p.evaluate(async () => { let n = 0; while (Studio.store.canUndo() && n < 40) { Studio.store.undo(); n++; } await Studio.stage.frame.queue; return { n, edits: JSON.stringify(Studio.store.count()) }; }); await settle(p);
  ok(steps.edits === '{}', '실행 취소를 끝까지(' + steps.n + '단계) → 편집 없음');
  const rp2 = await b.newPage({ viewport: { width: 390, height: 900 } }); await rp2.goto(BASE + 'index.html#ep01v3'); await rp2.waitForFunction(() => document.body.classList.contains('bv4-done'), null, { timeout: 60000 }); await rp2.waitForTimeout(300);
  const R11 = await rp2.evaluate(() => document.getElementById('cut-11').outerHTML.replace(/ (is-in|is-loaded)/g, '')); await rp2.close();
  const A11 = await p.evaluate(() => { const d = Studio.stage.frame.doc(); return d.getElementById('cut-11').outerHTML.replace(/ (st-cur|st-prev|is-in|is-loaded)/g, '').replace(/ class=""/g, ''); });
  ok(sha(R11) === sha(A11), '모두 되돌리면 #11 이 독자 화면과 같은 HTML');
  ok(!p.errs.length, '오류 없음 ' + p.errs.slice(0, 3).join(' | '));
  await p.context().close();

  // 8) 컴파일 순서 문제 검출(별도 창: 시험용 모듈을 등록하므로)
  const q2 = await openStudio(b, 'ep01v3/11', { init: CLEAN });
  const iss = await q2.evaluate(() => { Studio.registerModule({ id: 'zz-a', label: 'A', level: 'episode', after: ['zz-b'], compile() {} }); Studio.registerModule({ id: 'zz-b', label: 'B', level: 'episode', after: ['zz-a'], compile() {} }); Studio.registerModule({ id: 'zz-c', label: 'C', level: 'episode', after: ['없는모듈'], compile() {} }); return Studio.renderer.compileOrder().issues; });
  ok(iss.some(x => /순환/.test(x)) && iss.some(x => /없는 모듈/.test(x)), '컴파일 순서 문제 검출(순환·없는 모듈) ' + JSON.stringify(iss));
  await q2.context().close();
};
