// 교실 학생 뒷모습(SVG) — 11·13컷 원화의 교복(남색 조끼·흰 셔츠·짙은 머리)과 셀 채색을 따라 그림자·하이라이트를 넣는다. 얼굴은 그리지 않는다(뒷모습).
// student(cx, top, w, opt): top = 의자 등받이 윗변 y, w = 어깨 폭(px).
//   opt: {girl, tail, pose:'listen'|'write'|'cheek'|'turn'|'hand'|'stretch', tilt, hair}
let __id = 0;
const LINE = '#2c2226';
function student(cx, top, w, o = {}) {
  const id = 's' + (__id++), u = w, sy = top - 0.30 * u;
  const T = (x, y) => `${(cx + x * u).toFixed(1)},${(sy + y * u).toFixed(1)}`;
  const X = x => (cx + x * u).toFixed(1), Y = y => (sy + y * u).toFixed(1);
  const sw = Math.max(1.1, u * 0.011);
  const hair = o.hair || '#2a2120';
  const defs = `<defs>
   <linearGradient id="${id}v" x1="0" x2="1"><stop offset="0" stop-color="#262a3a"/><stop offset=".4" stop-color="#3a3f56"/><stop offset=".75" stop-color="#323650"/><stop offset="1" stop-color="#1f2230"/></linearGradient>
   <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#c8c1c3"/><stop offset=".35" stop-color="#f4f1ef"/><stop offset="1" stop-color="#d4cdcf"/></linearGradient>
   <radialGradient id="${id}h" cx=".42" cy=".3" r=".75"><stop offset="0" stop-color="#5b4740"/><stop offset=".55" stop-color="${hair}"/><stop offset="1" stop-color="#140f0e"/></radialGradient>
   <linearGradient id="${id}k" x1="0" x2="1"><stop offset="0" stop-color="#d9a78c"/><stop offset="1" stop-color="#eec3a6"/></linearGradient></defs>`;
  let s = defs + `<g stroke="${LINE}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">`;
  const pose = o.pose || 'listen', lean = pose === 'write' ? .05 : 0;
  // 셔츠(어깨·소매) + 조끼
  s += `<path d="M${T(-.52,.62)} L${T(-.51,.16)} Q${T(-.49,-.01)} ${T(-.3,-.04)} L${T(-.1,-.08)} L${T(.1,-.08)} L${T(.3,-.04)} Q${T(.49,-.01)} ${T(.51,.16)} L${T(.52,.62)} Z" fill="url(#${id}s)"/>`;
  s += `<path d="M${T(-.32,.62)} L${T(-.31,-.03)} Q${T(-.2,-.08)} ${T(-.1,-.08)} L${T(0,-.02)} L${T(.1,-.08)} Q${T(.2,-.08)} ${T(.31,-.03)} L${T(.32,.62)} Z" fill="url(#${id}v)"/>`;
  s += `<path d="M${T(0,-.02)} L${T(0,.62)}" stroke="#1a1d29" stroke-width="${sw * 1.2}" opacity=".6"/>`;
  s += `<path d="M${T(-.48,.2)} Q${T(-.42,.3)} ${T(-.32,.26)} M${T(.48,.2)} Q${T(.42,.3)} ${T(.32,.26)}" fill="none" stroke="#b3abae" stroke-width="${sw}"/>`;
  // 자세별 팔
  if (pose === 'write') {   // 오른팔 팔꿈치가 옆으로 나오고 어깨가 앞으로
    s += `<path d="M${T(.42,.02)} Q${T(.66,.1)} ${T(.66,.34)} L${T(.52,.4)} Q${T(.5,.18)} ${T(.36,.08)} Z" fill="url(#${id}s)"/>`;
  }
  if (pose === 'cheek') {
    s += `<path d="M${T(.3,-.03)} Q${T(.46,-.08)} ${T(.53,.06)} L${T(.5,.18)} Q${T(.42,.02)} ${T(.3,0)} Z" fill="url(#${id}s)"/>`;
  }
  if (pose === 'hand') {    // 손을 든 학생(질문)
    s += `<path d="M${T(.36,.0)} Q${T(.5,-.3)} ${T(.48,-.78)} L${T(.6,-.8)} Q${T(.62,-.3)} ${T(.48,.06)} Z" fill="url(#${id}s)"/>`;
    s += `<path d="M${T(.47,-.79)} Q${T(.46,-.98)} ${T(.53,-1.0)} Q${T(.62,-.98)} ${T(.61,-.8)} Z" fill="url(#${id}k)"/>`;
  }
  if (pose === 'stretch') { // 하품·기지개: 두 팔을 위로
    s += `<path d="M${T(-.44,.02)} Q${T(-.62,-.3)} ${T(-.6,-.62)} L${T(-.48,-.66)} Q${T(-.46,-.3)} ${T(-.3,0)} Z" fill="url(#${id}s)"/><ellipse cx="${X(-.55)}" cy="${Y(-.7)}" rx="${(.065 * u).toFixed(1)}" ry="${(.075 * u).toFixed(1)}" fill="url(#${id}k)"/>`;
    s += `<path d="M${T(.44,.02)} Q${T(.62,-.3)} ${T(.6,-.62)} L${T(.48,-.66)} Q${T(.46,-.3)} ${T(.3,0)} Z" fill="url(#${id}s)"/><ellipse cx="${X(.55)}" cy="${Y(-.7)}" rx="${(.065 * u).toFixed(1)}" ry="${(.075 * u).toFixed(1)}" fill="url(#${id}k)"/>`;
  }
  // 목·옷깃
  s += `<path d="M${T(-.07,-.06)} L${T(-.07,-.19)} L${T(.07,-.19)} L${T(.07,-.06)} Z" fill="#c99179"/>`;
  s += `<path d="M${T(-.13,-.07)} L${T(0,.01)} L${T(.13,-.07)} L${T(.1,-.12)} L${T(0,-.06)} L${T(-.1,-.12)} Z" fill="#f6f3f1"/>`;
  // 머리
  const dy = (pose === 'write' ? .08 : 0), rot = (o.tilt || 0) + (pose === 'cheek' ? 10 : 0) + (pose === 'turn' ? -8 : 0) + (pose === 'stretch' ? -4 : 0);
  s += `<g transform="rotate(${rot} ${X(0)} ${Y(-.12)}) translate(0 ${(dy * u).toFixed(1)})">`;
  s += `<ellipse cx="${X(-.19)}" cy="${Y(-.31)}" rx="${(.04 * u).toFixed(1)}" ry="${(.06 * u).toFixed(1)}" fill="url(#${id}k)"/><ellipse cx="${X(.19)}" cy="${Y(-.31)}" rx="${(.04 * u).toFixed(1)}" ry="${(.06 * u).toFixed(1)}" fill="url(#${id}k)"/>`;
  if (pose === 'turn') s += `<path d="M${T(.12,-.36)} Q${T(.25,-.33)} ${T(.22,-.21)} Q${T(.16,-.16)} ${T(.1,-.2)} Z" fill="url(#${id}k)"/>`;
  if (o.girl) {
    s += `<path d="M${T(-.215,-.38)} Q${T(-.23,-.63)} ${T(0,-.64)} Q${T(.23,-.63)} ${T(.215,-.38)} L${T(.235,-.1)} Q${T(.1,-.04)} ${T(0,-.06)} Q${T(-.1,-.04)} ${T(-.235,-.1)} Z" fill="url(#${id}h)"/>`;
    if (o.tail) s += `<path d="M${T(-.05,-.3)} Q${T(-.08,-.02)} ${T(0,.1)} Q${T(.08,-.02)} ${T(.05,-.3)} Z" fill="url(#${id}h)"/><path d="M${T(-.05,-.31)} L${T(.05,-.31)}" stroke="#7b2f3a" stroke-width="${sw * 3}"/>`;
  } else {
    s += `<path d="M${T(-.205,-.33)} Q${T(-.225,-.61)} ${T(0,-.62)} Q${T(.225,-.61)} ${T(.205,-.33)} Q${T(.19,-.19)} ${T(.1,-.16)} L${T(-.1,-.16)} Q${T(-.19,-.19)} ${T(-.205,-.33)} Z" fill="url(#${id}h)"/>`;
  }
  s += `<path d="M${T(-.13,-.54)} Q${T(-.02,-.59)} ${T(.11,-.52)} M${T(-.16,-.45)} Q${T(-.11,-.33)} ${T(-.13,-.22)} M${T(-.05,-.51)} Q${T(-.03,-.36)} ${T(-.05,-.2)} M${T(.06,-.49)} Q${T(.1,-.35)} ${T(.08,-.21)} M${T(.15,-.43)} Q${T(.18,-.32)} ${T(.15,-.22)}" fill="none" stroke="#6b5650" stroke-width="${sw * .9}" opacity=".85"/>`;
  s += `<path d="M${T(-.1,-.57)} Q${T(0,-.61)} ${T(.09,-.56)}" fill="none" stroke="#a08880" stroke-width="${sw * 1.8}" opacity=".55"/>`;
  if (pose === 'cheek') s += `<path d="M${T(.13,-.24)} Q${T(.25,-.27)} ${T(.27,-.16)} Q${T(.26,-.07)} ${T(.18,-.05)} Q${T(.12,-.1)} ${T(.13,-.24)} Z" fill="url(#${id}k)"/>`;
  s += `</g></g>`;
  return s;
}
