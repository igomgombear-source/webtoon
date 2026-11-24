/* 대사 모듈 검증 (Studio 2단계 A) — 대사 편집·재배열·추가·삭제·분할·합치기와 말풍선 연결, 실제 독자 화면 일치 */
const fs = require('fs'), path = require('path');
module.exports = async function (b, h) {
  const { openStudio, ok, go, BASE, OUT, sha } = h;
  const settle = async p => { await h.settle(p); await p.evaluate(() => Studio.modules.dialogue.ensureFresh()); await h.settle(p); };
  const CLEAN = `try{ if(!sessionStorage.getItem('t')){ localStorage.clear(); sessionStorage.setItem('t','1'); } }catch(e){}`;
  const norm = t => String(t).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  /* 지금 화면의 컷: 말풍선별 { id, text, 위치 } (글자는 화면에서 읽는다) */
  const bubbles = (p, no) => p.evaluate(no => { const f = Studio.stage.frame, ids = Studio.modules.bubbles._.liveIds(), sec = f.section(no), o = [];
    f.info(no).forEach(i => { const el = sec.querySelector('.bv4-b[data-src="' + i.src + '"][data-i="' + i.i + '"]') || sec.querySelectorAll('.bv4-b')[i.i]; o.push({ id: ids[i.src], src: i.src, text: el.querySelector('.bv4-text').textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim(), x: i.x, y: i.y, w: i.w, h: i.h, tip: i.tip, panel: i.panel }); }); return o; }, no);
  const reset = async p => { await p.evaluate(() => { Studio.store.reset({}, 'test reset'); }); await settle(p); };
  const pct = (b0) => ({ x: (b0.x + b0.w / 2 - b0.panel.x) / b0.panel.w * 100, y: (b0.y + b0.h / 2 - b0.panel.y) / b0.panel.h * 100 });

  const p = await openStudio(b, 'ep01v3/11', { init: CLEAN });
  await go(p, 11); await settle(p);
  const base = await bubbles(p, 11); ok(base.length === 3 && base.every((x, i) => x.id === 'c011.l' + i), '기준 컷 #11: 말풍선 3개, ID c011.l0~2');
  const texts0 = base.map(x => x.text);

  // 1) 대사 메뉴 UI: 글자·줄바꿈·화자
  await p.evaluate(() => Studio.activate('dialogue')); await p.waitForSelector('#dl-list .dl-row');
  ok(await p.locator('#dl-list .dl-row').count() === 3, '대사 목록 3줄');
  await p.locator('#dl-list .dl-row').nth(1).click(); await p.waitForSelector('#dl-text');
  await p.fill('#dl-text', '수정한 대사입니다.\n둘째 줄입니다.'); await p.fill('#dl-who', '해인'); await p.click('#dl-apply'); await settle(p); await p.waitForTimeout(200);
  let cur = await bubbles(p, 11);
  ok(cur[1].text === '수정한 대사입니다. 둘째 줄입니다.' && cur.length === 3, '글자 수정이 중앙 화면에 반영(말풍선 수 유지)');
  ok(await p.evaluate(() => /\n/.test(Studio.stage.frame.section(11).querySelectorAll('.bv4-b')[1].querySelector('.bv4-text').textContent)), '줄바꿈(\\n)이 화면에 그대로 표시');
  ok(await p.evaluate(() => Studio.stage.frame.section(11).querySelectorAll('.bv4-b')[1].querySelector('.bv4-sr').textContent.indexOf('해인') === 0), '화자 변경 반영');
  ok(cur[0].text === texts0[0] && cur[2].text === texts0[2], '다른 대사는 그대로');
  ok(await p.evaluate(() => Studio.store.get('dialogue', 'c011.l1').text.indexOf('둘째') > 0 && Studio.base.cut('ep01v3', 11).lines[1].text.indexOf('수정') < 0), '원본 데이터는 불변(편집값만 저장)');
  await p.click('#undo'); await settle(p); cur = await bubbles(p, 11); ok(cur[1].text === texts0[1] && await p.evaluate(() => Studio.stage.frame.section(11).querySelectorAll('.bv4-b')[1].querySelector('.bv4-sr').textContent.indexOf('해인') < 0), '글자·화자 실행 취소(한 단계) → 원래 글자·화자');
  await p.click('#redo'); await settle(p);
  ok((await bubbles(p, 11))[1].text === '수정한 대사입니다. 둘째 줄입니다.', '다시 실행');
  await reset(p);

  // 2) 말풍선 정밀값 + 재배열: 말풍선 설정이 글자를 따라간다
  const manual = { 0: { x: 30, y: 25, w: 55 }, 1: { x: 70, y: 55 }, 2: { x: 40, y: 85, w: 60 } };
  await p.evaluate(m => { Object.keys(m).forEach(i => Studio.store.set('bubbles', 'c011.l' + i, m[i], { live: true })); Studio.store.checkpoint('정밀값'); }, manual); await settle(p); await go(p, 11);
  const edited = await bubbles(p, 11); const posOf = (arr, id) => pct(arr.filter(x => x.id === id)[0]);
  const near = (a, bb, t) => Math.abs(a.x - bb.x) < t && Math.abs(a.y - bb.y) < t;
  ok(near(posOf(edited, 'c011.l0'), { x: 30, y: 25 }, 2) && near(posOf(edited, 'c011.l1'), { x: 70, y: 55 }, 2), '재배열 전: 정밀값 적용(l0·l1)');
  await p.evaluate(() => Studio.modules.dialogue.moveLine('c011.l2', -2)); await settle(p); await go(p, 11); await p.waitForTimeout(200);
  const re = await bubbles(p, 11);
  ok(JSON.stringify(re.map(x => x.id)) === '["c011.l2","c011.l0","c011.l1"]', '재배열 후 줄 순서(l2,l0,l1)');
  ok(re.every(x => x.text === texts0[+x.id.slice(-1)]), '각 말풍선의 글자가 원래 대사와 일치(ID↔글자)');
  ok(near(posOf(re, 'c011.l0'), { x: 30, y: 25 }, 2) && near(posOf(re, 'c011.l1'), { x: 70, y: 55 }, 2) && near(posOf(re, 'c011.l2'), { x: 40, y: 85 }, 3), '재배열 후에도 정밀값이 같은 대사에 붙어 있음(위치 동일)');
  ok(await p.evaluate(() => Object.keys(Studio.store.slice('bubbles')).sort().join()) === 'c011.l0,c011.l1,c011.l2', '말풍선 편집값 키는 대사 ID 그대로(다른 ID 로 옮겨 붙지 않음)');
  ok(await p.evaluate(() => JSON.stringify(Studio.store.get('bubbles', 'c011.l2'))) === JSON.stringify(manual[2]), 'l2 정밀값 내용 불변');
  // 목록의 ▲▼ 버튼
  await p.evaluate(() => Studio.activate('dialogue')); await p.waitForSelector('#dl-list .dl-row');
  await p.locator('#dl-list .dl-row').nth(1).locator('[data-dn]').click(); await settle(p);
  ok(await p.evaluate(() => Studio.modules.bubbles._.liveIds().join()) === 'c011.l2,c011.l1,c011.l0', '▼ 버튼으로 순서 변경');
  // 끌어서 순서 변경
  await p.locator('#dl-list .dl-row').nth(2).dragTo(p.locator('#dl-list .dl-row').nth(0)); await settle(p);
  ok(await p.evaluate(() => Studio.modules.bubbles._.liveIds().join()) === 'c011.l0,c011.l2,c011.l1', '끌어서 순서 변경');
  await p.keyboard.press('Control+z'); await settle(p); ok(await p.evaluate(() => Studio.modules.bubbles._.liveIds().join()) === 'c011.l2,c011.l1,c011.l0', '순서 변경 실행 취소');
  await p.evaluate(() => { Studio.store.reset({ module: 'dialogue' }); }); await settle(p); await go(p, 11);
  ok((await bubbles(p, 11)).map(x => x.id).join() === 'c011.l0,c011.l1,c011.l2', '대사 초기화 → 원래 순서·모양');
  ok(near(posOf(await bubbles(p, 11), 'c011.l0'), { x: 30, y: 25 }, 2), '초기화 후에도 말풍선 정밀값 유지');

  // 3) 삭제·복원(말풍선 정밀값 보존), 추가
  await p.evaluate(() => Studio.modules.dialogue.deleteLine('c011.l1')); await settle(p); await go(p, 11);
  let del = await bubbles(p, 11); ok(del.length === 2 && del.map(x => x.id).join() === 'c011.l0,c011.l2', '삭제: 말풍선 2개');
  ok(near(posOf(del, 'c011.l2'), { x: 40, y: 85 }, 3), '삭제 후 다른 말풍선 정밀값 유지');
  ok(await p.evaluate(() => !!Studio.store.get('bubbles', 'c011.l1')), '삭제한 대사의 말풍선 편집값은 보존');
  await p.evaluate(() => Studio.activate('bubbles')); ok(await p.locator('#bb-orph').textContent().then(t => /1개/.test(t)), '말풍선 패널에 보존된 편집 안내');
  await p.evaluate(() => Studio.modules.dialogue.restoreLine('c011.l1')); await settle(p); await go(p, 11); del = await bubbles(p, 11);
  ok(del.length === 3 && near(posOf(del, 'c011.l1'), { x: 70, y: 55 }, 2), '복원: 말풍선과 정밀값이 되살아남');
  const nid = await p.evaluate(() => Studio.modules.dialogue.addLine({ no: 11, after: 'c011.l0', who: '학생', text: '새로 넣은 대사예요.', style: 'speech' })); await settle(p); await go(p, 11);
  let add = await bubbles(p, 11); ok(/^c011\.l~[a-z0-9]{5}$/.test(nid) && add.length === 4 && add[1].id === nid && add[1].text === '새로 넣은 대사예요.', '추가: 선택 대사 뒤에 새 ID 로 삽입, 화면에 말풍선 생성');
  ok(add[0].id === 'c011.l0' && near(posOf(add, 'c011.l0'), { x: 30, y: 25 }, 2) && near(posOf(add, 'c011.l2'), { x: 40, y: 85 }, 3), '추가 후에도 기존 말풍선 정밀값 유지');
  await p.evaluate(nid => Studio.store.set('bubbles', nid, { x: 60, y: 40, w: 50 }, { label: '새 말풍선 정밀' }), nid); await settle(p); await go(p, 11);
  ok(near(posOf(await bubbles(p, 11), nid), { x: 60, y: 40 }, 2), '새 말풍선에도 정밀 편집 적용');
  ok(await p.evaluate(() => Studio.base.cut('ep01v3', 11).lines.length === 3), '원본 대사 수 불변(3)');
  await reset(p);

  // 4) 합치기·합치기 풀기
  await p.evaluate(() => Studio.modules.dialogue.mergeNext('c011.l0')); await settle(p); await go(p, 11);
  let mg = await bubbles(p, 11); ok(mg.length === 2 && mg[0].text === norm(texts0[0] + ' ' + texts0[1]), '합치기: 두 대사가 한 말풍선으로');
  await p.evaluate(() => Studio.modules.dialogue.unmerge('c011.l0')); await settle(p); await go(p, 11); ok((await bubbles(p, 11)).length === 3, '합치기 풀기');
  await reset(p);

  // 5) 분할: 각 조각 독립 편집·저장·복원
  const orig0 = (await bubbles(p, 11))[0].text;
  const pid = await p.evaluate(() => Studio.modules.dialogue.split('c011.l0', null)); await settle(p); await go(p, 11); await p.waitForTimeout(200);
  let sp = await bubbles(p, 11); ok(pid === 'c011.l0.b1' && sp.length === 4 && sp[0].id === 'c011.l0.b0' && sp[1].id === 'c011.l0.b1', '분할: 조각 ID c011.l0.b0 / b1, 말풍선 4개');
  ok(norm(sp[0].text + ' ' + sp[1].text) === norm(orig0), '두 조각을 이으면 원문과 같다');
  await p.evaluate(() => { const S = Studio; S.store.set('bubbles', 'c011.l0.b0', { x: 25, y: 20, w: 50 }, { live: true }); S.store.set('bubbles', 'c011.l0.b1', { x: 75, y: 45, w: 40, fs: 18, tail: { tip: { x: 60, y: 75 }, curve: 0.3 } }, { live: true }); S.store.checkpoint('조각 정밀'); }); await settle(p); await go(p, 11);
  sp = await bubbles(p, 11); ok(near(posOf(sp, 'c011.l0.b0'), { x: 25, y: 20 }, 2) && near(posOf(sp, 'c011.l0.b1'), { x: 75, y: 45 }, 2), '분할 조각이 각각 독립적으로 위치 편집');
  ok(Math.abs(sp[1].w / sp[1].panel.w * 100 - 40) < 2 && Math.abs(sp[0].w / sp[0].panel.w * 100 - 50) < 2, '조각별 폭 독립');
  ok(await p.evaluate(() => /Q/.test(Studio.stage.frame.section(11).querySelectorAll('.bv4-b')[1].innerHTML)), '조각별 꼬리 곡선');
  // 화면 UI 로 조각 선택·드래그
  await p.evaluate(() => { Studio.activate('bubbles'); Studio.modules.bubbles.selectLine('c011.l0.b1'); Studio.stage.layout(); Studio.emit('stage', {}); }); await p.waitForTimeout(200);
  let bx = await p.locator('#ov .hit.sel').boundingBox(); const before = pct((await bubbles(p, 11))[1]);
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.mouse.move(bx.x + bx.width / 2 + 30, bx.y + bx.height / 2 + 15, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(200);
  const after = pct((await bubbles(p, 11))[1]); ok(after.x > before.x + 3 && Math.abs(pct((await bubbles(p, 11))[0]).x - 25) < 2, '조각 말풍선을 화면에서 드래그(다른 조각 불변)');
  // 저장·복원
  const E = await h.edits(p), pos1 = JSON.stringify((await bubbles(p, 11)).map(x => [x.id, Math.round(x.x), Math.round(x.y), Math.round(x.w), Math.round(x.h)]));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#jsonOut')]); const f = path.join(OUT, 'dialogue-split.json'); await dl.saveAs(f);
  await p.evaluate(() => { Studio.store.flush(); localStorage.clear(); }); await p.reload(); await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 });
  ok((await h.edits(p)) === '{}', '분할 편집: 저장소 비움 확인'); await p.setInputFiles('#file', f); await p.waitForFunction(() => Studio.store.count().dialogue > 0, null, { timeout: 10000 }); await settle(p);
  ok((await h.edits(p)) === E, '분할 편집 JSON 복원: 편집값 동일'); await go(p, 11); await settle(p); await p.waitForTimeout(300);
  ok(JSON.stringify((await bubbles(p, 11)).map(x => [x.id, Math.round(x.x), Math.round(x.y), Math.round(x.w), Math.round(x.h)])) === pos1, '분할 편집 JSON 복원: 조각 위치·크기 동일');
  await p.reload(); await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 }); await go(p, 11); await settle(p); await p.waitForTimeout(300);
  ok(JSON.stringify((await bubbles(p, 11)).map(x => [x.id, Math.round(x.x), Math.round(x.y), Math.round(x.w), Math.round(x.h)])) === pos1, '분할 편집 자동 저장 복원(새로고침)');
  // 조각 합치기 → 원문으로
  await p.evaluate(() => Studio.modules.dialogue.mergeNext('c011.l0.b0')); await settle(p); await go(p, 11);
  ok((await bubbles(p, 11)).length === 3 && (await bubbles(p, 11))[0].text === norm(orig0) && await p.evaluate(() => !Studio.store.get('dialogue', 'c011.l0')), '조각 합치기 → 원래 대사로 복귀(편집값 정리)');

  // 5b) 렌더러 경쟁 상태: 그리는 도중에 대사 편집이 연달아 들어와도 결국 마지막 편집 상태로 그려진다(대사 모듈의 자동 보정)
  await reset(p);
  await p.evaluate(() => { const D = Studio.modules.dialogue; D.setText('c011.l0', '첫 번째 편집입니다.'); D.setText('c011.l2', '두 번째 편집!'); D.moveLine('c011.l2', -1); });
  await p.waitForFunction(() => { const f = Studio.stage.frame; return !f.rendering && Studio.modules.bubbles._.liveIds().join() === 'c011.l0,c011.l2,c011.l1'; }, null, { timeout: 30000 }).catch(() => {});
  const rc = await bubbles(p, 11); ok(rc.map(x => x.id).join() === 'c011.l0,c011.l2,c011.l1' && rc[0].text === '첫 번째 편집입니다.' && rc[1].text === '두 번째 편집!', '그리는 도중 연달은 편집 3개가 모두 화면에 반영(자동 보정)');
  await reset(p);

  // 6) 구조 편집 + 정밀값 → 패치를 실제 독자 화면에 주입했을 때 같은 모양
  await reset(p);
  await p.evaluate(() => { const D = Studio.modules.dialogue, S = Studio;
    D.setText('c011.l1', '고친 글자입니다. 두 번째 문장도 있어요.'); D.moveLine('c011.l2', -1); const nid = D.addLine({ no: 11, after: 'c011.l0', who: '학생', text: '끼어드는 대사', style: 'speech' });
    D.split('c011.l1', null); S.store.set('bubbles', 'c011.l1.b1', { x: 70, y: 70, w: 45 }, { live: true }); S.store.set('bubbles', nid, { x: 20, y: 40 }, { live: true }); S.store.set('bubbles', 'c011.l0', { x: 35, y: 20 }, { live: true }); S.store.checkpoint('구조 편집'); });
  await settle(p);
  const dPatch = await p.evaluate(() => Studio.modules.dialogue._.patchText()), bPatch = await p.evaluate(() => Studio.modules.bubbles._.patchText());
  ok(/c011\.l1\.b1/.test(dPatch) && /manual/.test(bPatch) && /11: \[/.test(dPatch), '대사·말풍선 패치 텍스트 생성');
  const widths = (process.env.WIDTHS || '320,360,390,430,768').split(',').map(Number);
  for (const W of widths) {
    await p.evaluate(W => Studio.stage.setWidth(W), W); await settle(p);
    const eInfo = await p.evaluate(() => { Studio.select(11); const f = Studio.stage.frame; return { info: f.info(11).map(i => [i.src, i.x, i.y, i.w, i.h, i.tip]), html: f.section(11).querySelector('.bv4-layer').outerHTML.replace(/ data-src="\d+"/g, '') }; });
    const rp = await b.newPage({ viewport: { width: W, height: 900 } });
    const strip = t => t.split('\n').filter(l => !/^\s*\/\/ /.test(l)).map(l => l.replace(/\s+\/\/ c\d+\.[^\n]*$/, '')).join('\n').replace(/,\s*$/, '');
    await rp.route('**/data/ep01v3.js', async r => { const resp = await r.fetch(); let body = await resp.text(); body += '\n;(function(){ var P = {' + strip(dPatch) + '}; WEBTOON.episodeData.ep01v3.cuts.forEach(function(c){ if (P[c.no]) c.lines = P[c.no]; }); })();\n'; await r.fulfill({ response: resp, body }); });
    await rp.route('**/data/ep01v3-bubbles.js', async r => { const resp = await r.fetch(); let body = await resp.text(); body += '\n;(function(){ var P = {' + strip(bPatch) + '}; var B = window.EP01V3_BUBBLES; Object.keys(P).forEach(function(n){ B.cuts[n] = Object.assign({}, B.cuts[n] || {}, P[n]); }); })();\n'; await r.fulfill({ response: resp, body }); });
    await rp.goto(BASE + 'index.html#ep01v3'); await rp.waitForFunction(() => document.body.classList.contains('bv4-done'), null, { timeout: 60000 }); await rp.waitForTimeout(300);
    const rInfo = await rp.evaluate(() => ({ info: BubblesV4.info(11).map(i => [i.src, i.x, i.y, i.w, i.h, i.tip]), html: document.getElementById('cut-11').querySelector('.bv4-layer').outerHTML.replace(/ data-src="\d+"/g, ''), n: document.getElementById('cut-11').querySelectorAll('.bv4-b').length }));
    const q = a => JSON.stringify(a.map(x => x.map(v => typeof v === 'number' ? Math.round(v * 2) : v && v.x != null ? [Math.round(v.x * 2), Math.round(v.y * 2)] : v)));
    ok(rInfo.n === 5 && q(eInfo.info) === q(rInfo.info) && sha(eInfo.html) === sha(rInfo.html), W + 'px 구조 편집(글자·순서·추가·분할)+정밀값: Studio = 패치를 넣은 실제 독자 화면 (말풍선 ' + rInfo.n + '개, 위치·크기·꼬리·HTML 동일)');
    await rp.close();
  }
  await p.evaluate(() => Studio.stage.setWidth(390)); await settle(p);

  // 7) 썸네일 반영, 초기화 연동
  await p.waitForTimeout(1500);
  const thumb = await p.evaluate(() => { const t = document.querySelector('.tl-tile[data-no="11"] .tl-img'); if (!t || !t.shadowRoot) return null; return t.shadowRoot.querySelectorAll('.bv4-b').length; });
  ok(thumb === 5, '썸네일에 구조 편집 반영(말풍선 5개) ' + thumb);
  await p.evaluate(() => { Studio.activate('bubbles'); Studio.select(11); }); await p.click('#rsCut'); await settle(p); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => Studio.store.count().dialogue === undefined && Studio.store.count().bubbles === undefined) && (await bubbles(p, 11)).length === 3, '컷 초기화: 대사·말풍선 편집이 함께 사라짐');
  ok(await p.evaluate(() => document.querySelector('.tl-tile[data-no="11"] .tl-img').shadowRoot.querySelectorAll('.bv4-b').length) === 3, '초기화 후 썸네일 복귀');
  ok(!p.errs.length, '오류 없음 ' + p.errs.slice(0, 3).join(' | '));
  await p.context().close();
};
