/*
 * 인물 그림 중앙 목록 — 조립 컷(compose)에서 '@인물/이름' 으로 부른다.
 *
 *   data/ep01.js   { src: '@haein/sit-talk', x: …, y: …, w: … }
 *   js/compose.js  resolve() 가 '@haein/sit-talk' 를 아래 src 경로로 바꾼다.
 *
 * 그림을 교체할 때는 컷 데이터를 고치지 말고 여기 src 한 줄만 바꾼다.
 *   - 같은 크기(size)·같은 구도(머리 위치, 투명 여백)로 만든 그림이면 컷 좌표를 그대로 쓸 수 있다.
 *   - 크기나 여백이 달라지면 이 그림을 쓰는 컷의 x·y·w 를 다시 맞춘다 (docs/HAEIN_REPLACEMENT.md).
 *   - 파일 형식을 바꾸면 확장자도 같이 바꾼다 (PNG 는 .png, WebP 는 .webp).
 *
 * status
 *   'official'   공식 승인 그림
 *   'production' 기존 설정에 맞춰 제작하고 뷰어에서 확인한 원화
 *   'temporary'  임시 디자인. 공식 그림이 오면 교체한다 (지우거나 고치지 말 것)
 * size  원본 픽셀 크기. 교체 그림이 같은 크기인지 확인할 때 쓴다.
 */
window.WEBTOON = window.WEBTOON || { episodeData: {} };

WEBTOON.characters = {
  /* ---------- 이승민 (공식) ---------- */
  'seungmin/sit-talk':       { src: 'assets/characters/seungmin/sit-talk.webp',       size: { w: 1313, h: 1342 }, status: 'official' },
  'seungmin/sit-hold-phone': { src: 'assets/characters/seungmin/sit-hold-phone.webp', size: { w: 1241, h: 1268 }, status: 'official' },
  'seungmin/stand-leave':    { src: 'assets/characters/seungmin/stand-leave.webp',    size: { w: 573,  h: 1769 }, status: 'official' },

  /* ---------- 제작 원화 ---------- */
  'seungmin/sit-check-score': { src: 'assets/characters/seungmin/sit-check-score.webp', size: { w: 1241, h: 1268 }, status: 'production' },
  'seungmin/sit-glance-phone': { src: 'assets/characters/seungmin/sit-glance-phone.webp', size: { w: 1241, h: 1268 }, status: 'production' },
  'seungmin/stand-wait-phone': { src: 'assets/characters/seungmin/stand-wait-phone.webp', size: { w: 1066, h: 1476 }, status: 'production' },
  'seungmin/stand-question-phone': { src: 'assets/characters/seungmin/stand-question-phone.webp', size: { w: 1066, h: 1476 }, status: 'production' },
  'seungmin/stand-alone': { src: 'assets/characters/seungmin/stand-alone.webp', size: { w: 495, h: 1832 }, status: 'production' },
  'seungmin/phone-call': { src: 'assets/characters/seungmin/phone-call.webp', size: { w: 1241, h: 1268 }, status: 'production' },
  'hyoeun/stand-enter': { src: 'assets/characters/hyoeun/stand-enter.webp', size: { w: 538, h: 1773 }, status: 'production' },
  'hyoeun/stand-talk': { src: 'assets/characters/hyoeun/stand-talk.webp', size: { w: 1165, h: 1350 }, status: 'production' },
  'hyoeun/stand-gesture': { src: 'assets/characters/hyoeun/stand-gesture.webp', size: { w: 1199, h: 1312 }, status: 'production' },
  'hyoeun/stand-listen': { src: 'assets/characters/hyoeun/stand-listen.webp', size: { w: 1165, h: 1350 }, status: 'production' },
  'hyoeun/stand-look-aside': { src: 'assets/characters/hyoeun/stand-look-aside.webp', size: { w: 1325, h: 1187 }, status: 'production' },
  'student/choir-enter': { src: 'assets/characters/student/choir-enter.webp', size: { w: 1140, h: 1005 }, status: 'production' },
  'student/choir-sing': { src: 'assets/characters/student/choir-sing.webp', size: { w: 1231, h: 1024 }, status: 'production' },
  'student/choir-question': { src: 'assets/characters/student/choir-question.webp', size: { w: 1024, h: 1536 }, status: 'production' },

  /* ---------- 권해인 (임시 디자인 — 공식 참고 사진을 받으면 교체) ---------- */
  'haein/sit-talk':          { src: 'assets/characters/haein/sit-talk.webp',      size: { w: 1656, h: 1220 }, status: 'temporary', note: '대화 표정, 손·휴대폰 없음' },
  'haein/sit-phone':         { src: 'assets/characters/haein/sit-phone.webp',     size: { w: 1122, h: 1402 }, status: 'temporary', note: '해인 폰을 내려다봄 (폰이 그림에 포함)' },
  'haein/sit-point':         { src: 'assets/characters/haein/sit-point.webp',     size: { w: 1254, h: 1254 }, status: 'temporary', note: '폰을 들고 검지로 가리킴 (폰·의자 포함)' },
  'haein/sit-explain':       { src: 'assets/characters/haein/sit-explain.webp',   size: { w: 1536, h: 1024 }, status: 'temporary', note: '한 손을 펴서 설명' },
  'haein/over-shoulder':     { src: 'assets/characters/haein/over-shoulder.webp', size: { w: 1312, h: 1199 }, status: 'temporary', note: '뒷모습 (머리·니트만 보임)' },
  /* 해인의 손·소매만 보이는 소품. 의상(아이보리 니트)이 바뀌면 함께 교체 */
  'haein/hand-sheet-music':  { src: 'assets/props/sheet-music-turn.webp',         size: { w: 1536, h: 1024 }, status: 'temporary', note: '악보 넘기는 손 + 니트 소매' },
  'haein/hand-phone-camera': { src: 'assets/props/haein-phone-camera-hand.webp',  size: { w: 972,  h: 1619 }, status: 'temporary', note: '폰으로 촬영하는 손 + 니트 소매' }
};
