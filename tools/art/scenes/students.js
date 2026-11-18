// 교실 학생 뒷모습(SVG) — 기존 11컷의 교복(남색 조끼·흰 셔츠·짙은 머리)을 따른다. 얼굴은 보이지 않는 뒷모습만 그린다.
// student(cx, top, w, opt): top = 의자 등받이 윗변 y, w = 어깨 폭(px). opt: {girl, pose:'cheek'|'stretch'|'write'|'turn', tilt, hair}
const LINE = '#33272a', VEST = '#2e3142', VEST2 = '#3b3f55', SHIRT = '#ebe7e6', SHIRT2 = '#c9c2c4', SKIN = '#e7b99c', SKIN2 = '#c8937a';
function student(cx, top, w, o = {}) {
  const u = w, sy = top - 0.30 * u;                     // 어깨선 y
  const T = (x, y) => `${(cx + x * u).toFixed(1)},${(sy + y * u).toFixed(1)}`;
  const sw = Math.max(1.4, u * 0.012);
  const hair = o.hair || '#2a2120', hl = o.hl || '#55433d';
  let s = `<g stroke="${LINE}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">`;
  // 몸통(조끼) + 소매
  s += `<path d="M${T(-.5,.6)} L${T(-.5,.18)} Q${T(-.49,.0)} ${T(-.3,-.03)} L${T(-.1,-.07)} L${T(.1,-.07)} L${T(.3,-.03)} Q${T(.49,.0)} ${T(.5,.18)} L${T(.5,.6)} Z" fill="${SHIRT}"/>`;
  s += `<path d="M${T(-.31,.6)} L${T(-.3,-.02)} L${T(-.1,-.07)} L${T(.1,-.07)} L${T(.3,-.02)} L${T(.31,.6)} Z" fill="${VEST}"/>`;
  s += `<path d="M${T(-.3,.05)} Q${T(0,.12)} ${T(.3,.05)}" fill="none" stroke="${VEST2}" stroke-width="${sw*2.2}"/>`;
  s += `<path d="M${T(-.5,.3)} Q${T(-.42,.36)} ${T(-.31,.32)} M${T(.5,.3)} Q${T(.42,.36)} ${T(.31,.32)}" fill="none" stroke="${SHIRT2}" stroke-width="${sw*1.4}"/>`;
  if (o.pose === 'cheek') {          // 턱을 괸 손: 오른쪽 어깨가 살짝 올라가고, 손바닥이 턱 옆에 보인다(팔뚝은 몸에 가려짐)
    s += `<path d="M${T(.3,-.03)} Q${T(.46,-.08)} ${T(.52,.06)} L${T(.5,.18)} Q${T(.42,.02)} ${T(.3,.0)} Z" fill="${SHIRT}"/>`;
  }
  if (o.pose === 'stretch') {        // 기지개(하품): 두 팔을 위로
    s += `<path d="M${T(-.46,.05)} L${T(-.6,-.55)} L${T(-.48,-.62)} L${T(-.32,-.02)} Z" fill="${SHIRT}"/><ellipse cx="${(cx-.55*u).toFixed(1)}" cy="${(sy-.66*u).toFixed(1)}" rx="${.06*u}" ry="${.07*u}" fill="${SKIN}"/>`;
    s += `<path d="M${T(.46,.05)} L${T(.6,-.55)} L${T(.48,-.62)} L${T(.32,-.02)} Z" fill="${SHIRT}"/><ellipse cx="${(cx+.55*u).toFixed(1)}" cy="${(sy-.66*u).toFixed(1)}" rx="${.06*u}" ry="${.07*u}" fill="${SKIN}"/>`;
  }
  // 목·옷깃
  s += `<path d="M${T(-.07,-.07)} L${T(-.07,-.19)} L${T(.07,-.19)} L${T(.07,-.07)} Z" fill="${SKIN2}"/>`;
  s += `<path d="M${T(-.12,-.07)} L${T(0,.0)} L${T(.12,-.07)} L${T(.09,-.11)} L${T(0,-.06)} L${T(-.09,-.11)} Z" fill="${SHIRT}"/>`;
  // 머리
  const dy = o.pose === 'write' ? .07 : 0, rot = (o.tilt || 0) + (o.pose === 'cheek' ? 9 : 0) + (o.pose === 'turn' ? -6 : 0);
  const hx = cx, hy = sy + (-.36 + dy) * u;
  s += `<g transform="rotate(${rot} ${hx.toFixed(1)} ${(sy - .12 * u).toFixed(1)})">`;
  s += `<ellipse cx="${(hx - .19 * u).toFixed(1)}" cy="${(hy + .05 * u).toFixed(1)}" rx="${.04 * u}" ry="${.06 * u}" fill="${SKIN}"/>`;
  s += `<ellipse cx="${(hx + .19 * u).toFixed(1)}" cy="${(hy + .05 * u).toFixed(1)}" rx="${.04 * u}" ry="${.06 * u}" fill="${SKIN}"/>`;
  if (o.pose === 'turn') s += `<path d="M${T(.12,-.36+dy)} Q${T(.24,-.33+dy)} ${T(.21,-.22+dy)} Q${T(.16,-.17+dy)} ${T(.1,-.2+dy)} Z" fill="${SKIN}"/>`;   // 옆 친구 쪽으로 돌린 뺨
  if (o.girl) {   // 단발·묶은 머리
    s += `<path d="M${T(-.21,-.38+dy)} Q${T(-.22,-.62+dy)} ${T(0,-.63+dy)} Q${T(.22,-.62+dy)} ${T(.21,-.38+dy)} L${T(.23,-.12+dy)} Q${T(0,-.06+dy)} ${T(-.23,-.12+dy)} Z" fill="${hair}"/>`;
    if (o.tail) s += `<path d="M${T(-.04,-.3+dy)} Q${T(-.07,-.05+dy)} ${T(0,.08+dy)} Q${T(.07,-.05+dy)} ${T(.04,-.3+dy)} Z" fill="${hair}"/>`;
  } else {
    s += `<path d="M${T(-.2,-.33+dy)} Q${T(-.22,-.6+dy)} ${T(0,-.61+dy)} Q${T(.22,-.6+dy)} ${T(.2,-.33+dy)} Q${T(.19,-.2+dy)} ${T(.1,-.17+dy)} L${T(-.1,-.17+dy)} Q${T(-.19,-.2+dy)} ${T(-.2,-.33+dy)} Z" fill="${hair}"/>`;
  }
  // 머리 결 하이라이트
  s += `<path d="M${T(-.13,-.53+dy)} Q${T(-.02,-.58+dy)} ${T(.11,-.51+dy)} M${T(-.16,-.44+dy)} Q${T(-.11,-.33+dy)} ${T(-.13,-.23+dy)} M${T(-.05,-.5+dy)} Q${T(-.03,-.36+dy)} ${T(-.05,-.22+dy)} M${T(.05,-.48+dy)} Q${T(.09,-.35+dy)} ${T(.07,-.22+dy)} M${T(.14,-.43+dy)} Q${T(.17,-.33+dy)} ${T(.15,-.24+dy)}" fill="none" stroke="${hl}" stroke-width="${sw*1.1}"/>`;
  s += `<path d="M${T(-.09,-.56+dy)} Q${T(0,-.6+dy)} ${T(.08,-.56+dy)}" fill="none" stroke="#7a6660" stroke-width="${sw*1.6}" opacity=".7"/>`;
  if (o.pose === 'cheek') s += `<path d="M${T(.13,-.24+dy)} Q${T(.25,-.27+dy)} ${T(.27,-.16+dy)} Q${T(.26,-.07+dy)} ${T(.18,-.05+dy)} Q${T(.12,-.1+dy)} ${T(.13,-.24+dy)} Z" fill="${SKIN}"/><path d="M${T(.17,-.22+dy)} Q${T(.23,-.2+dy)} ${T(.24,-.14+dy)}" fill="none" stroke="${SKIN2}" stroke-width="${sw}"/>`;
  s += `</g></g>`;
  return s;
}
