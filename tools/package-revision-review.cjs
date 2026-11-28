#!/usr/bin/env node
/* PF-006: add a separate revision comparison page to an existing review package.
 * node tools/package-revision-review.cjs <site-output-directory>
 * Run only after approved review package build. No deployment, no official changes.
 * Existing review files are preserved; different bytes at a shared path stop packaging.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const site = path.resolve(process.argv[2] || '_site');
const out = path.join(site, 'review');
const pageName = 'compare-local-revisions-20261129.html';
const read = (dir, file) => fs.readFileSync(path.join(dir,file));
const source = read(root, 'tools/compare-local-revisions.html').toString('utf8');
if (!fs.existsSync(path.join(out,'index.html')) ||
    !fs.existsSync(path.join(out,'compare-local-revisions.html'))) {
  throw Error('Existing review package required');
}
const data = 'data/ep01v3.js';
if (!read(root,data).equals(read(out,data))) throw Error('Review cut data mismatch; stop rather than replace');
const section = source.match(/var FILES = \[([\s\S]*?)\n  \];/);
if (!section) throw Error('Missing comparison manifest');
const names = [...section[1].matchAll(/\[\d+, \d+, '(ep01v3-[A-Za-z0-9._-]+\.webp)'\]/g)].map(m=>m[1]);
if (names.length !== 16 || new Set(names).size !== 16) throw Error('Unexpected manifest');
const overlay = 'ep01v3-010-chalk-REV3-DRAFT.svg';
if (!source.includes(overlay)) throw Error('Missing chalk layer reference');
const assets = [...names,overlay].map(n=>'assets/cuts/ep01v3/'+n);
const html = source.split('../data/').join('data/').split('../assets/').join('assets/')
  .replace('href="../index.html#ep01v3"', 'href="index.html#ep01v3"');
if (/\.\.\//.test(html) || !html.includes('name="robots" content="noindex"')) throw Error('Invalid page paths or robots metadata');
const planned = [];
function prepare(file, bytes) {
  const dest = path.join(out,file);
  if (fs.existsSync(dest)) {
    if (!read(out,file).equals(bytes)) throw Error('Existing review file differs: '+file);
  } else planned.push({dest,bytes});
}
for (const file of assets) prepare(file,read(root,file));
prepare(pageName,Buffer.from(html,'utf8'));
// All inputs/collisions checked before writing. Exclusive create: never overwrite.
for (const {dest,bytes} of planned) {
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,bytes,{flag:'wx'});
}
console.log('Revision review package:',planned.length,'new files; existing review preserved:',pageName);
