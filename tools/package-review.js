#!/usr/bin/env node
/* 사용자 최종 검수판 패키징 (배포 전 준비용, 배포하지 않음)
 *   node tools/package-review.js <출력폴더>
 * <출력폴더>/review/ 에 독립 사본(index.html·css·js·data·assets)을 만들고 두 진입 페이지를 둔다.
 *   review/index.html  → 99컷(독자 화면과 같은 구성) + 컷 번호·desc   (주소에 ?check=1 자동 추가)
 *   review/all.html    → 숨긴 컷까지 104컷 + 컷 번호·desc            (?check=1&hidden=1 자동 추가)
 * 두 페이지 모두 noindex. 원화·대사·연출은 소스 그대로 복사한다(수정 없음). 공식 독자용 사이트 파일은 건드리지 않는다. */
'use strict';
const fs = require('node:fs'), path = require('node:path');
const out = path.join(process.argv[2] || '_site', 'review');
const root = path.resolve(__dirname, '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const copy = f => { const t = path.join(out, f); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(path.join(root, f), t); };

const index = rd('index.html');
const files = new Set(['css/style.css']);
for (const [, f] of index.matchAll(/(?:src|href)="((?:css|js|data)\/[A-Za-z0-9._-]+)"/g)) files.add(f);
for (const [, f] of rd('data/episodes.js').matchAll(/\{\s*id:\s*'[^']+'[^}]*?ready:\s*true,\s*file:\s*'(data\/[A-Za-z0-9._-]+)'/g)) files.add(f);   /* 회차 데이터는 index.html 이 아니라 episodes.js 가 불러온다 */
for (const f of fs.readdirSync(path.join(root, 'assets/fonts'))) files.add('assets/fonts/' + f);
/* 데이터가 가리키는 그림(독자 화면 99컷 + 숨김 5컷, 휴대폰 배경·전경, 이름표) */
const text = ['data/ep01v3.js', 'data/ep01v3-screens.js', 'data/ep01v3-bubbles.js', 'tools/compare-local-revisions.html', 'tools/bubble-editor.html'].map(rd).join('\n');   /* 비교 페이지가 가리키는 수정 시안 17개도 함께 */
for (const [m] of text.matchAll(/assets\/[A-Za-z0-9_\/.-]+\.(?:webp|png|svg|jpe?g)/g)) files.add(m);
for (const [m] of text.matchAll(/ep01v3-[A-Za-z0-9._-]+\.(?:webp|png|svg)/g)) { const p = 'assets/cuts/ep01v3/' + m; if (fs.existsSync(path.join(root, p))) files.add(p); }
for (const f of files) { if (!fs.existsSync(path.join(root, f))) { console.error('missing', f); process.exitCode = 1; continue; } copy(f); }

const robots = '<meta name="robots" content="noindex, nofollow">';
function page(query) {
  const jump = '<script>if (!/[?&]check=1\\b/.test(location.search)) history.replaceState(null, "", location.pathname + "' + query + '" + location.hash);</script>';
  return index.replace('<head>', '<head>\n' + robots + '\n' + jump).replace('<title>', '<title>[검수판] ');
}
fs.writeFileSync(path.join(out, 'index.html'), page('?check=1'));
/* 수정 원화 17개 비교 페이지: review/ 바로 아래에 두고 같은 폴더의 data·assets 를 가리키도록 상대경로만 바꾼다(기능·내용은 그대로) */
for (const name of ['compare-local-revisions.html', 'bubble-editor.html']) {
  const html = rd('tools/' + name).replace('<head>', '<head>\n' + robots).split('../data/').join('data/').split('../assets/').join('assets/').replace('href="../index.html#ep01v3"', 'href="index.html#ep01v3"').replace("'../index.html'", "'viewer.html'");   /* 편집기: 독자 화면 사본 viewer.html 을 iframe 으로 */
  if (/\.\.\//.test(html.replace(/<!--[\s\S]*?-->/g, ''))) { console.error(name + ' still has ../ paths'); process.exitCode = 1; }
  fs.writeFileSync(path.join(out, name), html);
}
fs.writeFileSync(path.join(out, 'all.html'), page('?check=1&hidden=1'));
/* 편집기가 iframe 으로 띄우는 실제 독자 화면 사본(검수용 번호·설명 없음, noindex) */
fs.writeFileSync(path.join(out, 'viewer.html'), index.replace('<head>', '<head>\n' + robots));
console.log('review package:', files.size + 3, 'files ->', out);
