/* 모듈: 대사 — 대사·독백 내용, 줄바꿈·정렬, 화자, 순서, 추가·삭제, 분할·합치기 (담당: Claude Code · 2단계 A)
 * 규격 문서: docs/studio/dialogue.md · 공통 규격 docs/STUDIO_ARCHITECTURE.md
 *
 * 편집값(edits.dialogue):
 *   'c024.l0'        원본 대사 { text?, who?, align?, deleted?:true, absorb?:[대사ID…], split?:[{id,text}…] }
 *                    분할 조각은 부모의 split[k] = { id, text, who?, align?, deleted? } 안에 있다(조각 ID = 부모ID + '.' + id)
 *   'c024.l~k3f9a'   새 대사   { added:true, after:앞 대사ID, text, who, style, panel, align?, deleted?, split? }
 *   'c024'           컷       { order:[최상위 대사ID…] }         (없으면 원본 순서 + 새 대사는 after 뒤)
 * 모든 편집 동작은 편집값 한 곳만 한 번에 바꾼다(원자적 — 렌더러가 다시 그리는 도중의 변경 누락 방지).
 * 말풍선 설정은 대사 ID 로 연결된다(bubbles 모듈 편집값 키 = 대사 ID). 순서·추가·삭제·분할을 해도 ID 는 바뀌지 않으므로
 * 말풍선 설정이 다른 대사에 붙지 않는다. 컴파일된 대사 줄에는 sid(= 대사 ID)를 넣어 말풍선 모듈이 읽는다.
 * 렌더러 연동: level 'episode' — 데이터만 바꾼다. 정렬(align)은 js/bubbles.js 가 cut.lines[i].align 으로 읽는다(2단계 통합).
 * 새·복제 컷(cut.sid 'c~xxxxx', cut.from = 원본 컷 ID)도 컷 ID 로 편집한다 — 컷 구성 모듈 다음에 컴파일(after:['cuts']). */
(function () {
  'use strict';
  var S = window.Studio, U = S.util, I = S.ids, MOD = 'dialogue';
  var STYLE_TYPE = { thought: 'mono', phone: 'phone', caption: 'caption', silence: 'mono' };   /* js/bubbles.js STYLE_TYPE 와 같다(검사로 일치 확인) */
  var STYLES = [['speech', '말'], ['thought', '독백'], ['phone', '휴대폰'], ['caption', '자막'], ['silence', '침묵']];
  var ALIGNS = [['', '기본'], ['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']];
  var D = { sel: null, el: null };

  function ed(id, ep) { return S.store.get(MOD, id, ep); }
  function trim(s) { return String(s == null ? '' : s).replace(/^\s+|\s+$/g, ''); }

  /* ---------- 계획: 원본 + 편집값 → 최종 대사 목록 ---------- */
  function lineWith(base, e) {
    var l = U.clone(base) || {};
    ['who', 'text', 'style', 'panel'].forEach(function (k) { if (e && e[k] !== undefined && e[k] !== null) l[k] = e[k]; });
    if (e && e.align) l.align = e.align;
    return l;
  }
  var CID = '(?:\\d+|~[a-z0-9]+)', ORIG = new RegExp('^c' + CID + '\\.l(\\d+)$'), ADDED = new RegExp('^c' + CID + '\\.l~[a-z0-9]+$');
  function lid(cutId, i) { return cutId + '.l' + i; }
  /* 컷 서술: 원본 컷이면 { cutId:'c017', base:원본 컷 }, 새·복제 컷이면 컴파일된 컷의 sid 와 원본(from) 의 대사를 쓴다.
   * cuts: 컴파일 중이면 ctx.data.episode.cuts, 아니면 편집 화면의 컴파일 결과 */
  function desc(no, ep, cuts) {
    ep = ep || S.state.ep; var b = S.base.cut(ep, no); if (b) return { no: no, cutId: I.cut(no), base: b, baseNo: no };
    cuts = cuts || (S.stage && S.stage.frame && S.stage.frame.compiled && S.stage.frame.compiled.episode.cuts) || [];
    var c = cuts.filter(function (x) { return x.no === no; })[0]; if (!c || !c.sid) return null;
    var srcNo = c.from ? I.cutNo(c.from) : null, src = srcNo != null ? S.base.cut(ep, srcNo) : null;
    return { no: no, cutId: c.sid, base: { no: no, lines: src ? src.lines || [] : (c.baseLines || []), rows: c.rows, ratio: c.ratio }, baseNo: src ? srcNo : null, template: c };
  }
  function descById(cutId) { var n = S.cutNo ? S.cutNo(cutId) : I.cutNo(cutId); return n == null ? null : desc(n); }
  function effText(slice, lines, id) {
    var m = ORIG.exec(id); if (!m) return null;
    var e = slice[id] || {}; return e.text != null ? e.text : (lines[+m[1]] ? lines[+m[1]].text : '');
  }
  function plan(no, ep, cuts) {
    ep = ep || S.state.ep; var d = desc(no, ep, cuts); if (!d) return null;
    var cutId = d.cutId, slice = S.store.slice(MOD, ep), cutEd = slice[cutId] || {}, lines = d.base.lines || [];
    var added = Object.keys(slice).filter(function (id) { return I.cutOf(id) === cutId && ADDED.test(id) && slice[id].added; });
    var origIds = lines.map(function (l, i) { return lid(cutId, i); }), all = origIds.concat(added), order = [];
    (cutEd.order || []).forEach(function (id) { if (all.indexOf(id) >= 0 && order.indexOf(id) < 0) order.push(id); });
    origIds.forEach(function (id) { if (order.indexOf(id) < 0) order.push(id); });
    added.forEach(function (id) {   /* 새 대사: 명시한 순서에 없으면 만들 때 지정한 앞 대사 바로 뒤(없으면 맨 끝) */
      if (order.indexOf(id) >= 0) return; var aft = slice[id].after, k = aft ? order.indexOf(aft) : -1; order.splice(k >= 0 ? k + 1 : order.length, 0, id);
    });
    var absorbed = {}; order.forEach(function (id) { var e = slice[id]; if (e && e.absorb) e.absorb.forEach(function (a) { absorbed[a] = id; }); });
    var entries = [], deleted = [];
    order.forEach(function (id) {
      var e = slice[id] || {}, m = ORIG.exec(id), idx = m ? +m[1] : null;
      if (e.deleted) { deleted.push({ id: id, text: idx != null ? lines[idx].text : e.text, who: idx != null ? lines[idx].who : e.who }); return; }
      if (absorbed[id]) return;
      var base = idx != null ? lines[idx] : { style: e.style || 'speech', at: 'gap' }, line = lineWith(base, idx != null ? e : e);
      if (idx == null && e.style) line.style = e.style;
      if (e.absorb && e.absorb.length) line.text = [line.text].concat(e.absorb.map(function (a) { return effText(slice, lines, a); }).filter(function (t) { return t != null; })).join(' ');
      if (e.split && e.split.length > 1 && !(e.absorb && e.absorb.length)) {
        var alive = 0;
        e.split.forEach(function (p, k) {
          var pid = id + '.' + p.id, pe = p;
          if (pe.deleted) { deleted.push({ id: pid, text: p.text, who: line.who }); return; }
          var pl = lineWith(line, pe); pl.text = p.text; alive++;
          entries.push({ id: pid, parent: id, kind: 'part', partIndex: k, partCount: e.split.length, srcIndex: idx, line: pl, noSplit: true, edited: true });
        });
        return;
      }
      var textChanged = idx == null || (e.text != null && e.text !== lines[idx].text) || !!(e.absorb && e.absorb.length);
      var edited = idx == null || !U.isEmpty(e);
      entries.push({ id: id, kind: idx != null ? 'orig' : 'added', srcIndex: idx, line: line, noSplit: textChanged, edited: edited });
    });
    var natural = entries.length === lines.length && entries.every(function (e, k) { return e.kind === 'orig' && e.srcIndex === k && JSON.stringify(e.line) === JSON.stringify(lines[k]); });
    return { no: no, cutId: cutId, entries: entries, deleted: deleted, identity: natural && !d.template, order: order, base: lines, desc: d };
  }
  function idsOf(no, ep) { var p = plan(no, ep); return p ? p.entries.map(function (e) { return e.id; }) : []; }

  /* ---------- 엔진으로 말풍선 설정 계산(데이터 바꿔치기) ---------- */
  function effectiveWith(frame, no, lines, cfgEntry, template) {
    var win = frame.win(), ep = frame.ep, cd = win.WEBTOON.episodeData[ep], cc = cd.cuts.filter(function (c) { return c.no === no; })[0], bo = S.base.bubbleObj(win, ep), pushed = false;
    if (!cc && template) { cc = U.clone(template); cd.cuts.push(cc); pushed = true; }   /* 새·복제 컷이 이 화면에 아직 없으면 잠시 넣고 뺀다 */
    if (!cc || !bo) return null; bo.cuts = bo.cuts || {};
    var sl = cc.lines, sb = bo.cuts[no];
    cc.lines = lines; if (cfgEntry) bo.cuts[no] = cfgEntry; else delete bo.cuts[no];
    try { return win.BubblesV4.effective(no) || []; } finally { cc.lines = sl; if (sb === undefined) delete bo.cuts[no]; else bo.cuts[no] = sb; if (pushed) cd.cuts.splice(cd.cuts.indexOf(cc), 1); }
  }
  /* 컷의 최종 말풍선 설정 lines. 구조가 그대로면 null. { lines:[cfg…], ids:[대사ID…], texts } */
  function finalConfig(frame, no, ep, cuts) {
    ep = ep || frame.ep; var pl = plan(no, ep, cuts); if (!pl || pl.identity) return null;
    var d = pl.desc, baseData = S.base.data(ep), baseCfg = d.baseNo != null && baseData.bubbles && baseData.bubbles.cuts && baseData.bubbles.cuts[d.baseNo];
    var origLines = U.clone(pl.base), newLines = pl.entries.map(function (e) { var l = U.clone(e.line); l.sid = e.id; return l; });
    var origEff = effectiveWith(frame, no, origLines, baseCfg ? U.clone(baseCfg) : null, d.template);
    var c2 = baseCfg ? U.clone(baseCfg) : null; if (c2) { delete c2.lines; if (U.isEmpty(c2)) c2 = null; }
    var autoNew = effectiveWith(frame, no, newLines, c2, d.template);
    if (!origEff || !autoNew) return null;
    var cfg = pl.entries.map(function (e, k) {
      var c = e.srcIndex != null && origEff[e.srcIndex] ? U.clone(origEff[e.srcIndex]) : U.clone(autoNew[k] || {});
      if (e.kind === 'part') {
        var sp = c.splitParts, pc = c.partCfg, texts = pl.entries.filter(function (x) { return x.parent === e.parent; }).map(function (x) { return x.line.text; });
        var baseText = pl.base[e.srcIndex].text;
        delete c.splitParts; delete c.partCfg; delete c.noSplit;
        if (sp && pc && sp.length === e.partCount && texts.join(' ') === baseText && sp.join(' ') === baseText && pc[e.partIndex]) Object.assign(c, pc[e.partIndex]);   /* 원래 나눔(splitParts)의 조각별 설정 이어받기 */
      }
      if (e.noSplit) c.noSplit = true;
      return c;
    });
    return { lines: cfg, ids: pl.entries.map(function (e) { return e.id; }), newLines: newLines };
  }

  /* ---------- 편집 동작 (모두 공개 API, 한 동작 = 편집값 한 곳을 한 번 바꿈) ---------- */
  var PART = /^(c\d+\.l(?:\d+|~[a-z0-9]+))\.(b(?:\d+|~[a-z0-9]+))$/;
  function once(label, id, value, ids) { S.store.set(MOD, id, value, { label: label }); }
  function get(id) { return U.clone(ed(id)) || {}; }
  function entryOf(id, no) { var p = plan(no == null ? S.cutNo(I.cutOf(id)) : no); if (!p) return null; var r = p.entries.filter(function (e) { return e.id === id; })[0]; return r || null; }
  function clean(e) { Object.keys(e).forEach(function (k) { if (e[k] === undefined || e[k] === null || e[k] === '') delete e[k]; }); return e; }
  function baseLine(p) { if (!p || p.parts.length !== 1 || p.parts[0].fresh) return null; var d = descById(p.cutId); return d ? (d.base.lines || [])[p.parts[0].index] || null : null; }
  function cutIdOf(no) { var d = desc(no); return d ? d.cutId : I.cut(no); }
  function setOrder(no, ids, label) { var cid = cutIdOf(no), e = get(cid); e.order = ids.slice(); once(label || '대사 순서', cid, e); }
  /* 조각이면 부모 split 항목을, 아니면 대사 편집 항목을 fn 으로 고친다 */
  function editField(label, id, fn) {
    var m = PART.exec(id), p = I.parse(id); if (!p) return false;
    if (m) { var e = get(m[1]); var it = (e.split || []).filter(function (q) { return q.id === m[2]; })[0]; if (!it) return false; fn(it, null); once(label, m[1], e); return true; }
    var e2 = get(id); fn(e2, baseLine(p)); once(label, id, clean(e2)); return true;
  }

  var A = {
    plan: plan, ids: idsOf, finalConfig: finalConfig, effectiveWith: effectiveWith,
    /* 글자·화자·정렬을 한 번에 바꾼다: fields { text?, who?, align? } (줄바꿈 \n 포함). 분할 조각이면 부모 split 항목 안을 바꾼다 */
    setLine: function (id, fields) {
      var f = {}; if ('text' in fields) { f.text = String(fields.text).replace(/\r\n?/g, '\n').replace(/^\s+|\s+$/g, ''); if (!f.text) { U.toast('빈 대사는 만들 수 없습니다(삭제를 쓰세요)'); return false; } }
      if ('who' in fields) f.who = trim(fields.who); if ('align' in fields) f.align = fields.align || '';
      return editField('대사 편집 ' + id, id, function (e, bl) {
        if ('text' in f) { if (e.id) e.text = f.text; else e.text = (bl && f.text === bl.text && !e.added) ? undefined : f.text; }
        if ('who' in f) { if (e.id) e.who = f.who || undefined; else e.who = (!e.added && bl && f.who === (bl.who || '')) ? undefined : (f.who || undefined); }
        if ('align' in f) e.align = f.align || undefined;
        if (e.id) clean(e);
      });
    },
    setText: function (id, text) { return A.setLine(id, { text: text }); },
    setWho: function (id, who) { return A.setLine(id, { who: who }); },
    setAlign: function (id, align) { return A.setLine(id, { align: align }); },
    /* 새 대사. opt { no, after:대사ID|null, who, text, style, panel } → 새 ID (한 번의 편집) */
    addLine: function (opt) {
      var no = opt.no, p = plan(no); if (!p) return null; var cutId = p.cutId; var text = String(opt.text == null ? '' : opt.text).replace(/\r\n?/g, '\n').replace(/^\s+|\s+$/g, ''); if (!text) { U.toast('대사 내용을 입력하세요'); return null; }
      var id = I.fresh(cutId, 'l'), after = opt.after ? opt.after.replace(/^(c\d+\.l(?:\d+|~[a-z0-9]+)).*$/, '$1') : null;
      if (!after) { var last = p.order.filter(function (x) { return !(S.store.get(MOD, x) || {}).deleted; }); after = last.length ? last[last.length - 1] : null; }
      once('대사 추가 ' + id, id, clean({ added: true, after: after || undefined, text: text, who: trim(opt.who) || undefined, style: opt.style || 'speech', panel: opt.panel || undefined })); return id;
    },
    deleteLine: function (id) {
      var p = I.parse(id); if (!p) return;
      if (p.parts.length === 1 && p.parts[0].fresh) { S.store.reset({ module: MOD, id: id }, '추가한 대사 삭제 ' + id); return; }
      editField('대사 삭제 ' + id, id, function (e) { e.deleted = true; });
    },
    restoreLine: function (id) { editField('대사 복원 ' + id, id, function (e) { delete e.deleted; }); },
    /* 최상위 대사를 delta 칸 이동(조각은 같은 분할 안에서만) */
    moveLine: function (id, delta) {
      var no = S.cutNo(I.cutOf(id)), p = plan(no); if (!p) return false; var en = p.entries.filter(function (e) { return e.id === id; })[0]; if (!en) return false;
      if (en.kind === 'part') {
        var par = en.parent, e = get(par), k = (e.split || []).map(function (q) { return par + '.' + q.id; }).indexOf(id), j = k + delta; if (k < 0 || j < 0 || j >= e.split.length) return false;
        var t = e.split[k]; e.split[k] = e.split[j]; e.split[j] = t; once('조각 순서 ' + id, par, e); return true;
      }
      var top = p.order.filter(function (x) { return p.entries.some(function (q) { return q.id === x || q.parent === x; }); }), k2 = top.indexOf(id), j2 = k2 + delta;
      if (k2 < 0 || j2 < 0 || j2 >= top.length) return false;
      var o2 = p.order.slice(), a = o2.indexOf(top[k2]), b = o2.indexOf(top[j2]); o2.splice(a, 1); o2.splice(b, 0, id); setOrder(no, o2, '대사 순서 ' + id); return true;
    },
    setOrder: setOrder,
    /* 글자 위치 pos(문자 수)에서 나눈다(null = 문장·공백 기준 가운데). 이미 나뉜 대사의 조각이면 그 조각을 나눈다. 반환: 새 조각 ID | null */
    split: function (id, pos) {
      var p = I.parse(id); if (!p) return null; var en = entryOf(id); if (!en) return null; var text = en.line.text;
      pos = pos == null ? bestSplit(text) : pos; var a = trim(text.slice(0, pos)), b = trim(text.slice(pos)); if (a.replace(/\s/g, '').length < 2 || b.replace(/\s/g, '').length < 2) { U.toast('나눈 조각마다 두 글자 이상이어야 합니다'); return null; }
      var parentId = en.kind === 'part' ? en.parent : id, nid = 'b~' + Math.random().toString(36).slice(2, 7).padEnd(5, '0'), e = get(parentId);
      if (en.kind === 'part') { var k = e.split.map(function (q) { return parentId + '.' + q.id; }).indexOf(id); var cur = e.split[k], nw = { id: nid, text: b }; if (cur.who) nw.who = cur.who; if (cur.align) nw.align = cur.align; cur.text = a; e.split.splice(k + 1, 0, nw); }
      else { e.split = [{ id: 'b0', text: a }, { id: 'b1', text: b }]; delete e.text; nid = 'b1'; }
      once('말풍선 분할 ' + id, parentId, e); return parentId + '.' + nid;
    },
    /* 엔진이 자동으로 나눠 그리는 대사를 조각 대사로 확정(글자·모양은 그대로, 조각마다 정밀 편집 가능) */
    confirmSplit: function (id, parts) {
      var en = entryOf(id); if (!en || en.kind === 'part') return false;
      parts = parts || autoParts(en); if (!parts || parts.length < 2) { U.toast('자동으로 나뉜 대사가 아닙니다'); return false; }
      var e = get(id); e.split = parts.map(function (t, k) { return { id: 'b' + k, text: t }; }); delete e.text; once('분할 확정 ' + id, id, e); return true;
    },
    /* 선택한 대사를 바로 다음 대사와 합친다 */
    mergeNext: function (id) {
      var no = S.cutNo(I.cutOf(id)), p = plan(no); if (!p) return false; var k = p.entries.map(function (e) { return e.id; }).indexOf(id), en = p.entries[k], nx = p.entries[k + 1];
      if (!en || !nx) { U.toast('합칠 다음 대사가 없습니다'); return false; }
      if (en.kind === 'part' && nx.kind === 'part' && en.parent === nx.parent) {
        var e = get(en.parent), i = e.split.map(function (q) { return en.parent + '.' + q.id; }).indexOf(id); e.split[i].text = e.split[i].text + ' ' + e.split[i + 1].text; e.split.splice(i + 1, 1);
        if (e.split.length === 1) { var bt = baseLine(I.parse(en.parent)), t = e.split[0].text; delete e.split; if (!bt || t !== bt.text) e.text = t; }
        once('말풍선 합치기 ' + id, en.parent, clean(e)); return true;
      }
      if (en.kind === 'part' || nx.kind === 'part') { U.toast('나뉜 말풍선은 먼저 같은 대사의 조각끼리 합치세요'); return false; }
      var e2 = get(id); e2.absorb = (e2.absorb || []).concat([nx.id]); once('말풍선 합치기 ' + id, id, e2); return true;
    },
    /* 합쳐진 대사 풀기(absorb 해제) */
    unmerge: function (id) { var e = get(id); delete e.absorb; once('합치기 풀기 ' + id, id, clean(e)); },
    /* 대사 하나 초기화(분할 조각이면 그 대사 전체) */
    resetLine: function (id) { var m = PART.exec(id); S.store.reset({ module: MOD, id: m ? m[1] : id }, '대사 초기화 ' + id); },
    selected: function () { return D.sel; },
    patchText: patchText
  };
  /* 화면이 편집값을 다 반영할 때까지 기다린다(테스트·외부 호출용). 2단계 통합에서 코어(renderer.js)가 경쟁 상태를 고쳐
   * 예전의 '다르면 강제로 다시 그리기' 보정은 지웠다 — 여기서는 렌더러 대기열만 기다린다(중복 작동 없음). */
  function frames() { return [S.stage && S.stage.frame, S.stage && S.stage.compare, S.timeline && S.timeline.frame && S.timeline.frame()].filter(function (f) { return f && f.compiled; }); }
  A.ensureFresh = function () { return Promise.all(frames().map(function (f) { return Promise.resolve(f.queue); })); };

  /* 엔진 자동 분할 규칙(js/bubbles.js layoutCut 와 같다): splitParts → 문장 부호 뒤 공백, 말·밖소리만, 공백 뺀 18자 초과, noSplit 아님 */
  function autoParts(en) {
    var f = S.stage.frame, no = S.cutNo(I.cutOf(en.id)), d = desc(no), eff = null, bc = d && d.baseNo != null ? (S.base.data(S.state.ep).bubbles.cuts || {})[d.baseNo] : null;
    try { if (d) eff = effectiveWith(f, no, U.clone(d.base.lines || []), bc ? U.clone(bc) : null, d.template); } catch (x) {}
    var cfg = (eff && eff[en.srcIndex]) || {}, ln = en.line, typ = cfg.type || STYLE_TYPE[ln.style] || 'speech';
    var sp = cfg.splitParts && cfg.splitParts.join(' ') === ln.text ? cfg.splitParts : null; if (sp) return sp.slice();
    var parts = ln.text.split(/(?<=[.?!])\s+/);
    if ((typ === 'speech' || typ === 'offscreen') && parts.length > 1 && ln.text.replace(/\s/g, '').length > 18 && !cfg.noSplit) return parts;
    return null;
  }
  function bestSplit(text) {
    var m, best = null, mid = text.length / 2, re = /[.?!…]\s+|\s+/g;
    while ((m = re.exec(text))) { var pos = m.index + m[0].length, d = Math.abs(pos - mid) - (/[.?!…]/.test(m[0]) ? 4 : 0); if (pos > 0 && pos < text.length && (best === null || d < best.d)) best = { pos: pos, d: d }; }
    return best ? best.pos : Math.floor(text.length / 2);
  }
  function slice(id) { return S.store.get(MOD, id); }

  /* ---------- 본편 반영용 패치 텍스트: data/<회차>.js 의 해당 컷 lines ---------- */
  function jsLit(v) { if (v === null) return 'null'; if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'"; if (typeof v !== 'object') return String(v); if (Array.isArray(v)) return '[' + v.map(jsLit).join(', ') + ']'; return '{ ' + Object.keys(v).map(function (k) { return k + ': ' + jsLit(v[k]); }).join(', ') + ' }'; }
  function patchText() {
    var slice0 = S.store.slice(MOD), nos = {}; Object.keys(slice0).forEach(function (id) { var n = I.cutNo(id); if (n != null) nos[n] = 1; });
    var list = Object.keys(nos).map(Number).sort(function (a, b) { return a - b; }).filter(function (n) { var p = plan(n); return p && !p.identity; });
    if (!list.length) return '// 대사 편집이 없습니다.';
    var out = ['// ' + S.state.ep + ' 대사 편집 패치 — ' + U.today() + ' (마지막 접속 Studio)', '// data/' + S.state.ep + '.js 의 해당 컷 lines 를 아래로 바꾼다. 말풍선 설정(lines)은 말풍선 패치를 함께 적용한다(같은 순서·같은 개수).', '// align(대사 정렬)은 js/bubbles.js 가 읽는다(2단계 통합). 새·복제 컷은 컷 구성 패치로 따로 낸다. 본편 적용은 사용자 승인 후.', ''];
    list.forEach(function (n) { var p = plan(n); out.push('  // 컷 ' + n, '  ' + n + ': ['); p.entries.forEach(function (e, i) { var l = U.clone(e.line); out.push('    ' + jsLit(l) + (i < p.entries.length - 1 ? ',' : '') + '  // ' + e.id); }); out.push('  ],'); });
    return out.join('\n');
  }

  /* ---------- 속성 패널 ---------- */
  var CSS = '.dl-list{list-style:none;margin:0;padding:0}.dl-row{display:flex;align-items:center;gap:4px;padding:4px 6px;border:1px solid var(--line);border-radius:8px;margin:3px 0;cursor:pointer;background:#10141a}' +
    '.dl-row.on{border-color:var(--sel);background:#12202f}.dl-row .dl-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.dl-row .dl-id{font-size:10px;color:var(--dim)}' +
    '.dl-row button{padding:2px 6px}.dl-row.over{outline:2px dashed var(--accent)}.dl-grip{cursor:grab;color:var(--dim)}.dl-tag{font-size:10px;color:var(--edit)}.dl-row.dl-part{margin-left:18px}' +
    '.dl-form label{display:block;margin:6px 0;font-size:13px}.dl-form textarea{width:100%;min-height:76px}.dl-form input[type=text],.dl-form select{width:100%}.dl-del{opacity:.6}';
  U.addStyle('dialogue', CSS);
  function sel(id) { var b = S.modules.bubbles; if (b && b.selectLine) b.selectLine(id); D.sel = id; }
  function speakers() { var o = {}; S.base.cuts(S.state.ep).forEach(function (c) { (c.lines || []).forEach(function (l) { if (l.who) o[l.who] = 1; }); }); return Object.keys(o); }
  function render() {
    var el = D.el; if (!el) return; var no = S.state.cut, p = plan(no); if (!p) { el.innerHTML = ''; return; }
    var ids = p.entries.map(function (e) { return e.id; }); if (D.sel == null || ids.indexOf(D.sel) < 0) D.sel = ids[0] || null;
    var en = p.entries.filter(function (e) { return e.id === D.sel; })[0], pnls = S.base.panelsOf(p.desc.template || p.desc.base), multi = pnls.length;
    var html = '<section class="card"><h2>대사 목록 <small>#' + no + ' · 끌어서 순서 변경</small></h2><ul class="dl-list" id="dl-list">' +
      p.entries.map(function (e, k) { return '<li class="dl-row' + (e.id === D.sel ? ' on' : '') + (e.kind === 'part' ? ' dl-part' : '') + '" draggable="true" data-id="' + e.id + '"><span class="dl-grip" title="끌어서 이동">⠿</span><span class="dl-t"><b>' + (k + 1) + '.</b> ' + U.esc(e.line.who || '(독백)') + ': ' + U.esc(e.line.text.replace(/\n/g, ' ⏎ ')) + '</span>' +
        (e.kind === 'part' ? '<span class="dl-tag">⧉</span>' : e.kind === 'added' ? '<span class="dl-tag">＋</span>' : e.edited ? '<span class="dl-tag">✎</span>' : '') + '<button data-up="' + e.id + '" title="위로" aria-label="위로">▲</button><button data-dn="' + e.id + '" title="아래로" aria-label="아래로">▼</button></li>'; }).join('') +
      '</ul>' + (p.entries.length ? '' : '<p class="note">이 컷에는 표시되는 대사가 없습니다</p>') + '</section>';
    if (en) {
      var l = en.line, mine = S.store.get(MOD, en.id) || {}, canAuto = en.kind === 'orig' && autoParts(en);
      html += '<section class="card dl-form"><h2>선택한 대사 <small><code>' + en.id + '</code></small></h2>' +
        '<label>화자<input type="text" id="dl-who" list="dl-speakers" value="' + U.esc(l.who || '') + '" placeholder="(독백은 비워 둠)"></label><datalist id="dl-speakers">' + speakers().map(function (s) { return '<option value="' + U.esc(s) + '">'; }).join('') + '</datalist>' +
        '<label>내용 <span class="dim">(Enter = 줄바꿈 · Ctrl+Enter = 적용)</span><textarea id="dl-text" spellcheck="false">' + U.esc(l.text) + '</textarea></label>' +
        '<label>정렬<select id="dl-align">' + ALIGNS.map(function (a) { return '<option value="' + a[0] + '"' + ((mine.align || '') === a[0] ? ' selected' : '') + '>' + a[1] + '</option>'; }).join('') + '</select></label>' +
        '<div class="chips"><button id="dl-apply">적용</button><button id="dl-split" title="글자 칸의 커서 위치에서 나눔">커서 위치에서 분할</button><button id="dl-merge">다음 대사와 합치기</button>' + (canAuto ? '<button id="dl-confirm" title="엔진이 자동으로 나눠 그리는 말풍선을 조각 대사로 확정">자동 분할 확정</button>' : '') + (mine.absorb ? '<button id="dl-unmerge">합치기 풀기</button>' : '') + '<button id="dl-del" class="dl-del">삭제</button><button id="dl-reset">이 대사 초기화</button></div></section>';
    }
    html += '<section class="card dl-form"><h2>대사 추가</h2><label>화자<input type="text" id="dl-nwho" list="dl-speakers" placeholder="(독백은 비워 둠)"></label>' +
      '<label>종류<select id="dl-nstyle">' + STYLES.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('') + '</select></label>' +
      (multi > 1 ? '<label>조각<select id="dl-npanel">' + pnls.map(function (_, i) { return '<option value="' + i + '">조각 ' + (i + 1) + '</option>'; }).join('') + '</select></label>' : '') +
      '<label>내용<textarea id="dl-ntext" spellcheck="false"></textarea></label><div class="chips"><button id="dl-add">선택한 대사 뒤에 추가</button><button id="dl-addend">맨 끝에 추가</button></div></section>';
    if (p.deleted.length) html += '<section class="card"><h2>삭제한 대사 <small>복원 가능</small></h2><ul class="dl-list">' + p.deleted.map(function (d) { return '<li class="dl-row"><span class="dl-t">' + U.esc(d.who || '(독백)') + ': ' + U.esc(String(d.text || '').slice(0, 24)) + ' <span class="dl-id">' + d.id + '</span></span><button data-restore="' + d.id + '">복원</button></li>'; }).join('') + '</ul></section>';
    html += '<section class="card"><h2>본편 반영용 패치</h2><div class="chips"><button id="dl-patch">대사 패치 텍스트</button></div><textarea class="out" id="dl-out" spellcheck="false" placeholder="data/*.js 해당 컷 lines (본편 적용은 사용자 승인 후)"></textarea>' +
      '<p class="note">대사 구조를 바꾼 컷은 말풍선 패치(말풍선 메뉴)와 함께 적용해야 말풍선 설정이 같은 순서로 맞습니다.</p></section>';
    el.innerHTML = html; bindPanel(el, p, en);
  }
  function bindPanel(el, p, en) {
    var $ = function (id) { return el.querySelector('#' + id); };
    var apply = function () {
      if (!en) return; var t = $('dl-text').value, w = $('dl-who').value, f = {}; if (t.replace(/\r\n?/g, '\n').trim() !== en.line.text) f.text = t; if (trim(w) !== (en.line.who || '')) f.who = w;
      if (U.isEmpty(f)) return U.toast('바뀐 내용이 없습니다'); A.setLine(en.id, f);
    };
    el.querySelector('#dl-list').addEventListener('click', function (e) {
      var up = e.target.closest('[data-up]'), dn = e.target.closest('[data-dn]'), row = e.target.closest('.dl-row');
      if (up) { A.moveLine(up.dataset.up, -1); return; } if (dn) { A.moveLine(dn.dataset.dn, 1); return; }
      if (row) { sel(row.dataset.id); render(); }
    });
    var dragId = null, list = el.querySelector('#dl-list');
    list.addEventListener('dragstart', function (e) { var r = e.target.closest('.dl-row'); if (!r) return; dragId = r.dataset.id; e.dataTransfer.setData('text/plain', dragId); });
    list.addEventListener('dragover', function (e) { var r = e.target.closest('.dl-row'); if (!r || !dragId) return; e.preventDefault(); [].forEach.call(list.children, function (c) { c.classList.toggle('over', c === r); }); });
    list.addEventListener('drop', function (e) { e.preventDefault(); var r = e.target.closest('.dl-row'); if (!r || !dragId || r.dataset.id === dragId) return; moveTo(dragId, r.dataset.id); dragId = null; });
    list.addEventListener('dragend', function () { dragId = null; [].forEach.call(list.children, function (c) { c.classList.remove('over'); }); });
    function moveTo(from, to) {   /* 끌어서 놓기 = 순서 한 번 변경(실행 취소 한 단계) */
      var fe = p.entries.filter(function (x) { return x.id === from; })[0], te = p.entries.filter(function (x) { return x.id === to; })[0]; if (!fe || !te) return;
      if (fe.kind === 'part' || te.kind === 'part') { if (fe.parent !== te.parent) return U.toast('조각은 같은 대사 안에서만 옮길 수 있습니다'); var a0 = p.entries.indexOf(fe), b0 = p.entries.indexOf(te); A.moveLine(from, b0 - a0); return; }
      var o = p.order.slice(), a = o.indexOf(from), b = o.indexOf(to); if (a < 0 || b < 0) return; o.splice(a, 1); o.splice(b, 0, from); A.setOrder(S.state.cut, o, '대사 순서 ' + from);
    }
    if (!en) { bindAdd(el, p, null); return; }
    $('dl-apply').onclick = apply;
    $('dl-text').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); apply(); } e.stopPropagation(); });
    $('dl-who').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); apply(); } e.stopPropagation(); });
    $('dl-align').onchange = function () { A.setAlign(en.id, this.value); };
    $('dl-split').onclick = function () { var pos = $('dl-text').selectionStart, t = $('dl-text').value; if (t !== en.line.text) { U.toast('먼저 적용을 눌러 글자 변경을 저장하세요'); return; } var cur = en.id, nid = A.split(cur, pos > 0 && pos < t.length ? pos : null); if (nid) sel(/\.b(?:\d+|~[a-z0-9]+)$/.test(cur) ? cur : cur + '.b0'); };
    $('dl-merge').onclick = function () { A.mergeNext(en.id); };
    if ($('dl-confirm')) $('dl-confirm').onclick = function () { A.confirmSplit(en.id); };
    if ($('dl-unmerge')) $('dl-unmerge').onclick = function () { A.unmerge(en.id); };
    $('dl-del').onclick = function () { var idx = p.entries.map(function (x) { return x.id; }).indexOf(en.id); A.deleteLine(en.id); D.sel = (p.entries[idx + 1] || p.entries[idx - 1] || {}).id || null; };
    $('dl-reset').onclick = function () { A.resetLine(en.id); };
    bindAdd(el, p, en);
  }
  function bindAdd(el, p, en) {
    var $ = function (id) { return el.querySelector('#' + id); };
    function add(after) { var id = A.addLine({ no: S.state.cut, after: after, who: $('dl-nwho').value, text: $('dl-ntext').value, style: $('dl-nstyle').value, panel: $('dl-npanel') ? +$('dl-npanel').value : undefined }); if (id) { sel(id); $('dl-ntext').value = ''; } }
    $('dl-add').onclick = function () { add(en ? en.id : null); }; $('dl-addend').onclick = function () { add(null); };
    var pb = $('dl-patch'); if (pb) pb.onclick = function () { $('dl-out').value = patchText(); };
    el.querySelectorAll('[data-restore]').forEach(function (b) { b.onclick = function () { A.restoreLine(b.dataset.restore); }; });
  }

  S.registerModule({
    id: MOD, label: '대사', order: 20, owner: 'Claude Code', status: 'ready', level: 'episode', after: ['cuts'],
    planned: [],
    compile: function (ctx) {
      var keyed = {}; Object.keys(ctx.edits || {}).forEach(function (id) { keyed[I.cutOf(id)] = 1; });
      ctx.data.episode.cuts.forEach(function (cut) {
        var no = cut.no, cid = cut.sid || I.cut(no); if (!keyed[cid]) return;   /* 원본 컷 c017 · 새·복제 컷 c~xxxxx 모두 컷 ID 로 찾는다 */
        var fc;
        try { fc = finalConfig(ctx.frame, no, ctx.ep, ctx.data.episode.cuts); } catch (e) { console.error('[studio] dialogue finalConfig #' + no, e); return; }
        if (!fc) return;   /* 구조가 원본과 같으면 건드리지 않는다 */
        cut.lines = fc.newLines;
        if (ctx.data.bubbles) { ctx.data.bubbles.cuts = ctx.data.bubbles.cuts || {}; var ent = ctx.data.bubbles.cuts[no] || (ctx.data.bubbles.cuts[no] = {}); ent.lines = fc.lines; }
      });
    },
    mount: function (el) { D.el = el; render(); if (!D.listening) { D.listening = true; S.on('change', function () { if (D.el) render(); }); } },
    unmount: function () { D.el = null; },
    onCut: function (n) { if (n !== D.cut) { D.sel = null; D.cut = n; } render(); },
    drawOverlay: function (ov) { ov.innerHTML = ''; if (D.el && !D.el.contains(document.activeElement)) render(); },
    selection: function () { return D.sel; },
    selectLine: function (id) { D.sel = id; },
    api: A, _: { plan: plan, autoParts: function (id) { var en = entryOf(id); return en ? autoParts(en) : null; }, patchText: patchText, finalConfig: finalConfig }
  });
  Object.keys(A).forEach(function (k) { S.modules[MOD][k] = A[k]; });
})();
