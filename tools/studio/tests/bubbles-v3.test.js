/* 말풍선 모듈 2단계 A 검증 — 말풍선 추가·삭제·분할·합치기(UI), 자동 분할 확정과 조각 독립 편집, 배치, transformTips, 회귀, 화면 크기 */
const fs = require('fs'), path = require('path');
module.exports = async function (b, h) {
  const { openStudio, ok, go, BASE, OUT, sha } = h;
  const settle = async p => { await h.settle(p); await p.evaluate(() => Studio.modules.dialogue.ensureFresh()); await h.settle(p); await p.waitForTimeout(150); };
  const CLEAN = `try{ if(!sessionStorage.getItem('t')){ localStorage.clear(); sessionStorage.setItem('t','1'); } }catch(e){}`;
  const geo = (p, no) => p.evaluate(no => { Studio.select(no); const f = Studio.stage.frame; return JSON.stringify(f.info(no).map(i => [i.src, Math.round(i.x), Math.round(i.y), Math.round(i.w), Math.round(i.h), i.tip && [Math.round(i.tip.x), Math.round(i.tip.y)]])); }, no);
  const layer = (p, no) => p.evaluate(no => Studio.stage.frame.section(no).querySelector('.bv4-layer').innerHTML.replace(/ data-src="\d+"/g, '').replace(/ data-i="\d+"/g, ''), no);
  const ctr = (it) => ({ x: (it.x + it.w / 2 - it.panel.x) / it.panel.w * 100, y: (it.y + it.h / 2 - it.panel.y) / it.panel.h * 100 });
  const infoOf = (p, no) => p.evaluate(no => { Studio.select(no); const f = Studio.stage.frame, ids = Studio.modules.bubbles._.liveIds(); return f.info(no).map(i => Object.assign({}, i, { id: ids[i.src] })); }, no);

  const p = await openStudio(b, 'ep01v3/11', { init: CLEAN });
  await go(p, 11); await settle(p);

  // 1) 컷 내부·경계·컷 사이 배치(버튼)
  await p.evaluate(() => { Studio.activate('bubbles'); Studio.modules.bubbles.selectLine('c011.l1'); Studio.emit('stage', {}); }); await p.waitForTimeout(200);
  const seq = [['edgeTop', 0], ['edgeBottom', 100], ['gap', 108], ['in', null]];
  for (const [k, y] of seq) { await p.click('[data-pre="' + k + '"]'); await settle(p); const it = (await infoOf(p, 11)).filter(x => x.id === 'c011.l1')[0], m = await p.evaluate(() => Studio.store.get('bubbles', 'c011.l1'));
    ok(k === 'in' ? (m.y >= 18 && m.y <= 82) : Math.abs(m.y - y) < 0.2, '배치 버튼 ' + k + ': 말풍선 중심 y ' + m.y + (k === 'in' ? '' : ' (기대 ' + y + ')') + ' · 실제 화면 y ' + Math.round(ctr(it).y)); }
  const gapIt = await p.evaluate(() => { const S = Studio; S.store.set('bubbles', 'c011.l1', { x: 50, y: 108 }, { label: 't' }); return 1; }); await settle(p);
  const gi = (await infoOf(p, 11)).filter(x => x.id === 'c011.l1')[0]; ok(ctr(gi).y > 100, '컷 사이 배치: 말풍선이 패널 아래 여백으로 내려감(중심 y ' + Math.round(ctr(gi).y) + '%)');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);

  // 2) 말풍선 패널 UI: 추가·분할·합치기·삭제
  await p.evaluate(() => { Studio.activate('bubbles'); Studio.modules.bubbles.selectLine('c011.l0'); Studio.emit('stage', {}); }); await p.waitForTimeout(200);
  await p.click('#bb-add'); await p.fill('#bb-nwho', '해인'); await p.fill('#bb-ntext', '말풍선 패널에서 추가했어요.'); await p.click('#bb-addok'); await settle(p);
  let ids = await p.evaluate(() => Studio.modules.bubbles._.liveIds()); ok(ids.length === 4 && /^c011\.l~/.test(ids[1]) && ids[0] === 'c011.l0', '말풍선 패널: 추가 → 선택한 말풍선 뒤에 새 ID');
  ok(await p.evaluate(() => Studio.stage.frame.section(11).querySelectorAll('.bv4-b').length) === 4, '추가한 말풍선이 중앙 화면에 표시');
  await p.evaluate(() => Studio.modules.bubbles.selectLine('c011.l0')); await p.evaluate(() => Studio.emit('stage', {})); await p.click('#bb-split'); await settle(p);
  ids = await p.evaluate(() => Studio.modules.bubbles._.liveIds()); ok(ids.indexOf('c011.l0.b0') >= 0 && ids.indexOf('c011.l0.b1') >= 0 && ids.length === 5, '말풍선 패널: 분할 → 조각 ID ' + ids.join(','));
  await p.click('#bb-merge'); await settle(p); ids = await p.evaluate(() => Studio.modules.bubbles._.liveIds()); ok(ids.length === 4 && ids.indexOf('c011.l0') >= 0, '합치기 → 조각 하나로(원래 대사 복귀)');
  const sel0 = await p.evaluate(() => Studio.modules.bubbles.selectedId()); await p.click('#bb-delete'); await settle(p);
  ids = await p.evaluate(() => Studio.modules.bubbles._.liveIds()); ok(ids.length === 3 && ids.indexOf(sel0) < 0, '말풍선 패널: 삭제');
  ok(await p.evaluate(() => Studio.base.cut('ep01v3', 11).lines.length === 3 && Studio.base.cut('ep01v3', 11).lines[0].text.length > 5), '원본 대사 데이터 불변');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);

  // 3) 자동 분할 12개: 확정해도 화면 동일, 조각 독립 편집
  const multi = await p.evaluate(() => { const f = Studio.stage.frame, D = Studio.modules.dialogue, out = []; f.order.forEach(no => { const c = f.cut(no); (c.lines || []).forEach((l, k) => { const id = Studio.ids.line(no, k); if (D._.autoParts(id)) out.push(id); }); }); return out; });
  ok(multi.length === 12, '엔진 자동 분할 대사 12개 탐지 ' + multi.join(' '));
  let same = 0, diffs = [];
  for (const id of multi) { const no = +id.slice(1, 4); const g0 = await geo(p, no), l0 = await layer(p, no);
    await p.evaluate(id => Studio.modules.dialogue.confirmSplit(id), id); await settle(p); const g1 = await geo(p, no), l1 = await layer(p, no);
    const strip = g => JSON.stringify(JSON.parse(g).map(a => a.slice(1)));
    if (strip(g0) === strip(g1) && l0 === l1) same++; else diffs.push(id);
    await p.evaluate(id => Studio.store.reset({ module: 'dialogue', id }, 'r'), id); await settle(p); }
  ok(same === 12, '자동 분할 확정 12개: 화면(위치·크기·꼬리·HTML)이 확정 전과 동일 ' + same + '/12' + (diffs.length ? ' 다름: ' + diffs.join(',') : ''));
  // 조각 독립 편집: 55컷 l0(조각별 설정 partCfg 사용)·12컷 l0
  for (const id of ['c012.l0', 'c055.l1']) { const no = +id.slice(1, 4);
    await p.evaluate(id => Studio.modules.dialogue.confirmSplit(id), id); await settle(p);
    const bs = (await infoOf(p, no)).filter(x => x.id.indexOf(id + '.') === 0); const b1 = bs[1], before0 = JSON.stringify(ctr(bs[0]));
    await p.evaluate(a => { const S = Studio; S.store.set('bubbles', a[0], { x: 65, y: 62, w: 42 }, { label: '조각 편집' }); }, [b1.id]); await settle(p);
    const af = (await infoOf(p, no)).filter(x => x.id.indexOf(id + '.') === 0);
    ok(Math.abs(ctr(af[1]).x - 65) < 2.5 && Math.abs(ctr(af[1]).y - 62) < 2.5 && JSON.stringify(ctr(af[0])) === before0, id + ' 조각 ' + b1.id + ' 만 독립 이동(다른 조각 불변)');
    // JSON 왕복
    const E = await h.edits(p), gsave = await geo(p, no); const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#jsonOut')]); const f = path.join(OUT, 'bubbles-v3-split.json'); await dl.saveAs(f);
    await p.evaluate(() => { Studio.store.flush(); localStorage.clear(); }); await p.reload(); await p.waitForFunction(() => window.Studio && Studio.ready, null, { timeout: 90000 });
    await p.setInputFiles('#file', f); await p.waitForFunction(() => Studio.store.count().dialogue > 0, null, { timeout: 10000 }); await settle(p);
    ok((await h.edits(p)) === E && (await geo(p, no)) === gsave, id + ' 분할 JSON 복원: 편집값·위치·크기·꼬리 동일');
    await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p); }
  // 자동 분할 대사는 화면에서 '분할 확정' 안내와 버튼
  await go(p, 12); await p.evaluate(() => { Studio.activate('bubbles'); Studio.modules.bubbles.selectLine('c012.l0'); Studio.emit('stage', {}); }); await p.waitForTimeout(300);
  ok(await p.locator('#bb-confirm').isVisible() && /자동 분할 확정/.test(await p.locator('#bb-who').textContent()), '자동 분할 대사: 확정 버튼·안내 표시');
  await p.click('#bb-confirm'); await settle(p); ok(await p.evaluate(() => Studio.modules.bubbles._.liveIds().join()) === 'c012.l0.b0,c012.l0.b1,c012.l1', '확정 → 조각 ID(c012.l0.b0, b1)');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);

  // 4) transformTips
  await go(p, 11); await settle(p);
  const tt = await p.evaluate(() => { const B = Studio.modules.bubbles, out = {};
    out.same = JSON.stringify(B.transformTips('c011.p0', {}, { size: { w: 1, h: 1 } }).moved.map(m => [m.from, m.to]).every(a => JSON.stringify(a[0]) === JSON.stringify(a[1])));
    const base = B.transformTips('c011.p0', { x: 0 }, { size: { w: 1, h: 1 } }); out.n = base.moved.length; out.skipped = base.skipped.length;
    const sh = B.transformTips('c011.p0', { x: 10, y: -5 }); out.src = sh.source; out.shift = sh.moved.map(m => [m.to.x - m.from.x, m.to.y - m.from.y]);
    out.scale = B.transformTips('c011.p0', { scale: 2 }, { size: { w: 1, h: 1 } }).moved.map(m => [m.from, m.to]);
    out.flip = B.transformTips('c011.p0', { flipX: true }, { size: { w: 1, h: 1 } }).moved.map(m => [m.from.x, m.to.x]);
    out.rot = B.transformTips('c011.p0', { rotate: 90 }, { size: { w: 1, h: 1 } }).moved.map(m => [m.from, m.to]);
    out.written = JSON.stringify(Studio.store.slice('bubbles')); out.bad = (function () { try { B.transformTips('c011.l0', {}); } catch (e) { return e.message; } })(); return out; });
  ok(tt.n === 3 && tt.same === 'true', 'transformTips: 항등 변환은 끝점 그대로(꼬리 ' + tt.n + '개) · 쓰기 없음(' + tt.written + ')');
  ok(tt.src === 'rendered' && tt.n === 3, 'transformTips: 지금 화면에 그려진 꼬리 끝점을 변환(source=' + tt.src + ')');
  const far = await p.evaluate(() => { Studio.select(55); return 0; }); await settle(p); await p.waitForTimeout(1500);
  const viaThumb = await p.evaluate(() => { const r = Studio.modules.bubbles.transformTips('c011.p0', { x: 10 }); return { src: r.source, n: r.moved.length, from: r.moved.map(m => m.from) }; });
  await go(p, 11); await settle(p); const direct = await p.evaluate(() => Studio.modules.bubbles.transformTips('c011.p0', { x: 10 }).moved.map(m => m.from));
  ok(viaThumb.src === 'rendered' && viaThumb.n === 3 && viaThumb.from.every((f, k) => Math.abs(f.x - direct[k].x) < 1.5 && Math.abs(f.y - direct[k].y) < 1.5), 'transformTips: 다른 컷을 보고 있어도 썸네일 렌더러 결과로 같은 끝점 ' + JSON.stringify(viaThumb));
  ok(tt.shift.every(d => Math.abs(d[0] - 10) < 0.02 && Math.abs(d[1] + 5) < 0.02), 'transformTips: 이동 (+10, -5)% ' + JSON.stringify(tt.shift));
  ok(tt.scale.every(a => Math.abs(a[1].x - (50 + (a[0].x - 50) * 2)) < 0.02 && Math.abs(a[1].y - (50 + (a[0].y - 50) * 2)) < 0.02), 'transformTips: 확대 2배(패널 중심 기준)');
  ok(tt.flip.every(a => Math.abs(a[1] - (100 - a[0])) < 0.02), 'transformTips: 좌우 반전');
  ok(tt.rot.every(a => Math.abs(a[1].x - (50 - (a[0].y - 50))) < 0.02 && Math.abs(a[1].y - (50 + (a[0].x - 50))) < 0.02), 'transformTips: 시계 방향 90° 회전');
  ok(/패널 ID/.test(tt.bad), 'transformTips: 패널 ID 가 아니면 오류');
  const h0 = await p.evaluate(() => Studio.store.history().length), t0 = JSON.stringify((await infoOf(p, 11)).map(i => i.tip));
  const ap = await p.evaluate(() => Studio.modules.bubbles.transformTips('c011.p0', { x: 8 }, { apply: true })); await settle(p); await go(p, 11);
  const t1 = (await infoOf(p, 11)).map(i => i.tip), t0a = JSON.parse(t0);
  ok(await p.evaluate(() => Studio.store.history().length) === h0 + 1 && ap.moved.length === 3, 'transformTips apply: 실행 취소 한 단계로 저장');
  const panelW = (await infoOf(p, 11))[0].panel.w; ok(t1.every((t, k) => t && Math.abs((t.x - t0a[k].x) - panelW * 0.08) < 1.5), 'transformTips apply: 화면의 꼬리 끝점이 패널 폭의 8% 이동(' + Math.round(panelW * 0.08) + 'px)');
  await p.click('#undo'); await settle(p); ok(JSON.stringify((await infoOf(p, 11)).map(i => i.tip)) === t0, 'transformTips 실행 취소 → 원래 꼬리');
  // 여러 조각 컷: 해당 조각의 꼬리만
  const mp = await p.evaluate(() => { const B = Studio.modules.bubbles; return ['c033.p0', 'c033.p1', 'c033.p2'].map(id => B.transformTips(id, { x: 5 }, { size: { w: 1, h: 1 } }).moved.map(m => m.id.replace('c033.', '')).join('/')); });
  ok(mp.join(' | ').split(/[ |/]+/).filter(Boolean).length >= 2 && new Set(mp.join('/').split('/').filter(Boolean)).size === mp.join('/').split('/').filter(Boolean).length, 'transformTips: 여러 조각 컷은 조각별로 해당 말풍선만 ' + mp.join(' | '));

  // 5) 구조 편집이 다른 컷에 영향을 주지 않는다(전체 컷 HTML 비교)
  await p.evaluate(() => { const D = Studio.modules.dialogue; D.setText('c011.l1', '글자 바꿈 테스트입니다.'); D.deleteLine('c011.l2'); D.addLine({ no: 24, after: 'c024.l0', who: '해인', text: '추가 대사', style: 'speech' }); }); await settle(p);
  const rp = await b.newPage({ viewport: { width: 390, height: 900 } }); await rp.goto(BASE + 'index.html#ep01v3'); await rp.waitForFunction(() => document.body.classList.contains('bv4-done'), null, { timeout: 60000 });
  const R = await rp.evaluate(() => { const o = {}; document.querySelectorAll('.cut').forEach(s => { o[s.dataset.no] = s.outerHTML.replace(/ (is-in|is-loaded)/g, ''); }); return o; }); await rp.close();
  const A = await p.evaluate(() => { const d = Studio.stage.frame.doc(); d.documentElement.classList.remove('st-one'); const o = {}; d.querySelectorAll('.cut').forEach(s => { o[s.dataset.no] = s.outerHTML.replace(/ (st-cur|st-prev|is-in|is-loaded)/g, '').replace(/ class=""/g, ''); }); return o; });
  const dif = Object.keys(R).filter(k => sha(R[k]) !== sha(A[k] || ''));
  ok(dif.join() === '11,24', '편집한 컷(#11, #24)만 달라지고 나머지 97개 컷은 독자 화면과 같다 (다른 컷: ' + dif.join(',') + ')');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);
  // 편집 전체를 되돌리면 모든 컷이 원래와 같다
  const A2 = await p.evaluate(() => { const d = Studio.stage.frame.doc(); const o = {}; d.querySelectorAll('.cut').forEach(s => { o[s.dataset.no] = s.outerHTML.replace(/ (st-cur|st-prev|is-in|is-loaded)/g, '').replace(/ class=""/g, ''); }); return o; });
  ok(Object.keys(R).filter(k => sha(R[k]) !== sha(A2[k] || '')).length === 0, '편집을 모두 초기화하면 99개 컷이 독자 화면과 같다');

  // 6) 예외 상황
  await p.evaluate(() => { const D = Studio.modules.dialogue; D.deleteLine('c011.l0'); D.deleteLine('c011.l1'); D.deleteLine('c011.l2'); }); await settle(p); await go(p, 11); await settle(p);
  ok(await p.evaluate(() => Studio.stage.frame.section(11).querySelectorAll('.bv4-b').length) === 0 && await p.evaluate(() => Studio.modules.dialogue.plan(11).deleted.length) === 3, '대사를 모두 삭제해도 오류 없이 말풍선 0개(복원 목록 3개)');
  await p.evaluate(() => Studio.activate('dialogue')); await p.waitForSelector('[data-restore]'); await p.locator('[data-restore]').first().click(); await settle(p);
  ok(await p.evaluate(() => Studio.stage.frame.section(11).querySelectorAll('.bv4-b').length) === 1, '복원 버튼으로 대사 복원');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);
  const emp = await p.evaluate(() => [Studio.modules.dialogue.addLine({ no: 11, text: '   ' }), Studio.modules.dialogue.setText('c011.l0', ''), Studio.modules.dialogue.split('c011.l2', null), Studio.store.count().dialogue === undefined]);
  ok(emp[0] === null && emp[1] === false && emp[2] === null && emp[3] === true, '빈 대사·너무 짧은 분할은 거부(편집값 생성 없음)');
  // 충돌: 원본 대사 글자가 달라진 버전의 편집
  await p.evaluate(() => { Studio.modules.dialogue.setText('c011.l1', '지문 확인용'); Studio.modules.dialogue.addLine({ no: 11, text: '추가' }); }); await settle(p);
  const an = await p.evaluate(() => Studio.store.anchors('ep01v3')); ok(an['c011.l1'] && Object.keys(an).some(k => /l~/.test(k) && an[k] === 'fresh'), '대사 편집 지문(원본 대사)·새 대사 fresh 기록');
  const d = await p.evaluate(() => { const d = Studio.store.exportData(); d.episodes.ep01v3.anchors['c011.l1'] = 'hold'; return d; }); const cf = path.join(OUT, 'dl-conflict.json'); fs.writeFileSync(cf, JSON.stringify(d)); await p.setInputFiles('#file', cf); await p.waitForTimeout(900);
  ok(await p.evaluate(() => Studio.store.conflicts('ep01v3').some(c => c.id === 'c011.l1' && c.module === 'dialogue' && c.reason === 'changed')), '다른 버전의 대사 편집 충돌 검출(changed)');
  await p.evaluate(() => Studio.store.reset({}, 'r')); await settle(p);

  // 7) 화면 크기별 패널·가로 넘침, 오류
  ok(!p.errs.length, '오류 없음 ' + p.errs.slice(0, 3).join(' | '));
  await p.context().close();
  for (const vw of [320, 360, 390, 430, 768, 1024, 1440]) {
    const q = await openStudio(b, 'ep01v3/11', { viewport: { width: vw, height: 900 }, init: CLEAN });
    await q.evaluate(() => { const D = Studio.modules.dialogue; D.setText('c011.l1', '고친 글자입니다. 두 번째 문장도 있어요.'); D.split('c011.l1', null); D.addLine({ no: 11, after: 'c011.l0', who: '학생', text: '추가', style: 'speech' }); });
    await settle(q);
    for (const panel of ['dialogue', 'bubbles']) { await q.evaluate(pn => Studio.activate(pn), panel); await q.waitForTimeout(300);
      const r = await q.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, rows: document.querySelectorAll('#props .dl-row, #props .blist button').length }));
      ok(r.sw <= r.cw + 1 && r.rows >= 4, vw + 'px ' + panel + ' 패널: 가로 넘침 없음(' + r.sw + '/' + r.cw + '), 항목 ' + r.rows);
      if ([320, 390, 1440].includes(vw)) await q.screenshot({ path: path.join(OUT, 'v3-' + panel + '-' + vw + '.png'), fullPage: vw < 800 }); }
    ok(!q.errs.length, vw + 'px 오류 없음 ' + q.errs.slice(0, 3).join(' | ')); await q.context().close();
  }
};
