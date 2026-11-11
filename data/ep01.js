/*
 * 1화 〈마지막 부탁〉 — 70컷
 *
 * 컷 항목
 *   no         컷 번호 (1~70)
 *   type       'panel'  그림 컷 (그림이 없으면 임시 컷 표시)
 *              'black'  검은 화면 자막 컷
 *              'phone'  휴대폰 화면 컷 (문자·메일·알림·통화를 실제 텍스트로 표시)
 *   kind       (선택) 제작 분류 'text' 그림 없음 | 'compose' 재료 조립 컷 | 'key' 따로 그리는 핵심 컷
 *   image      완성 컷 파일 이름. imageBase(assets/cuts/ep01/) 기준 (예: '01.webp'). 없으면 null
 *   compose    (선택) 재료 조립 { bg, canvasSize: { w, h }, layers: [{ src, x, y, w, h?, flip?, opacity? }], export? }
 *              좌표·크기는 모두 캔버스 가로 폭 기준 %. 자세한 설명은 js/compose.js 맨 위 주석
 *              표시 우선순위: image > compose.export(useExportedCuts 일 때) > compose > 임시 컷
 *   imageSize  (선택) 그림 원본 크기 { w, h } (px). 넣어 두면 그림이 로딩되기 전에 컷 높이를 미리 잡아
 *              아래 컷이 밀리지 않는다. 없으면 ratio 로 자리를 잡고, 로딩 후 원본 비율로 맞춘다
 *   ratio      그림 영역 비율 '가로:세로'. 그림이 없을 때(임시 컷)와 imageSize 가 없을 때 쓰인다
 *   tone       임시 컷 배경 색조 (css/style.css 의 .tone-* 참고)
 *   desc       임시 컷에 보이는 장면 설명 (그림이 들어가면 표시되지 않음)
 *   datetime   { date, time }  time 이 있으면 컷 왼쪽 위에 시각 표시
 *   scene      장면 전환 카드 { date, time, place } — 이 컷 앞에 표시
 *   transition 등장 효과 'fade' | 'slow' | 'none'
 *   spacing    { before, after } 컷 앞뒤 여백(px, 폭 360px 기준)
 *   mood       (선택) 장면 분위기. 컷과 그 앞뒤 여백, 장면 카드를 이 색으로 칠하고, 다음 컷의 mood 가 다르면 아래 여백에서 서서히 넘긴다
 *              corridor void night lamp lamp-deep morning alert drift slate frost cold-deep home hush (색은 css/style.css)
 *              배경을 가운데가 아닌 다른 부분으로 자르거나 확대하려면 compose.bg 대신 배경을 첫 레이어로 넣는다 (예: 19컷)
 *   lines      대사 [{ who, text, style }]
 *              style: 'speech' 말풍선 | 'thought' 독백 | 'phone' 전화 음성 | 'caption' 자막
 *              pos: { x, y } (0~100, %) 를 넣으면 그림 위 그 위치에 겹쳐 표시. 없으면 그림 아래에 표시
 *   phone      type 'phone' 일 때 화면 내용 (js/app.js 의 renderPhone 참고)
 *              owner: 'haein' (해인의 휴대폰, 밝은 화면) | 'seungmin' (승민의 휴대폰, 어두운 화면)
 *              view 'notification' 에 focus: true 를 넣으면 알림 미리보기를 크게 보여 준다
 */
WEBTOON.registerEpisode({
  id: 'ep01',
  no: 1,
  title: '마지막 부탁',
  imageBase: 'assets/cuts/ep01/',
  /* true: 조립 컷마다 compose.export 완성 이미지를 씀 / 'mobile': 폭 720px 이하에서만 / false: 화면에서 합성 */
  useExportedCuts: false,
  showSpeakerNames: true,
  speakers: {
    '승민': { side: 'left' },
    '해인': { side: 'right' },
    '효은': { side: 'right' },
    '학생': { side: 'right' },
    '문상윤': { side: 'center' }
  },
  endSpacing: 1400,
  cuts: [
    /* ---------- 01~05 프롤로그 ---------- */
    { no: 1, mood: 'corridor', type: 'panel', kind: 'key', image: null, ratio: '3:4', tone: 'hall',
      scene: { date: '11월 1일', time: '18:34', place: '양평문화회관' },
      datetime: { date: '11월 1일', time: '18:34' },
      desc: '11월 1일 18:34, 양평문화회관 복도', transition: 'slow', spacing: { before: 40, after: 96 } },
    { no: 2, mood: 'corridor', type: 'panel', kind: 'compose', image: null, ratio: '9:16', tone: 'backstage',
      datetime: { date: '11월 1일' },
      desc: '행사장과 대비되는 어두운 관계자 통로', spacing: { after: 96 } },
    { no: 3, mood: 'corridor', type: 'panel', kind: 'key', image: null, ratio: '1:1', tone: 'backstage',
      datetime: { date: '11월 1일' },
      desc: '누군가 들고 있는 파란 파일의 일부', spacing: { after: 120 } },
    { no: 4, mood: 'corridor', type: 'panel', kind: 'key', image: null, ratio: '3:4', tone: 'backstage',
      datetime: { date: '11월 1일' },
      desc: '계단참과 발끝, 사건 암시', spacing: { after: 160 } },
    { no: 5, mood: 'void', type: 'black', kind: 'text', text: '이틀 전',
      datetime: { date: '10월 30일' },
      transition: 'slow', spacing: { before: 0, after: 320 } },

    /* ---------- 06~28 10월 30일 밤 음악실 ---------- */
    { no: 6, mood: 'night', type: 'panel', kind: 'compose', image: null, ratio: '16:9', tone: 'schoolnight',
      compose: {
        bg: 'assets/backgrounds/schoolgate/night-wide.webp',
        canvasSize: { w: 1664, h: 936 }
      },
      scene: { date: '10월 30일', time: '밤', place: '양평중학교' },
      datetime: { date: '10월 30일' },
      desc: '야간의 양평중학교', transition: 'slow', spacing: { after: 96 } },
    { no: 7, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '4:3', tone: 'musicroom',
      compose: {
        canvasSize: { w: 1200, h: 900 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -25, y: 0, w: 150 },
          { src: '@seungmin/sit-talk', x: 41.17, y: 8.6, w: 61.27 },
          { src: '@haein/sit-talk', x: -17.83, y: 4.3, w: 91.08 },
          { src: 'assets/props/musicroom-desk-rehearsal.webp', x: -4.5, y: 41.8, w: 109 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 75 }
        ]
      },
      datetime: { date: '10월 30일' },
      desc: '음악실에서 준비 중인 승민과 해인' },
    { no: 8, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom',
      compose: {
        bg: 'assets/backgrounds/musicroom/night-desk.webp',
        canvasSize: { w: 1000, h: 1000 },
        layers: [
          { src: '@haein/hand-sheet-music', x: -7, y: 11, w: 110 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      datetime: { date: '10월 30일' },
      desc: '리허설 자료 정리' },
    { no: 9, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'musicroom',
      compose: {
        bg: 'assets/backgrounds/musicroom/night-desk.webp',
        canvasSize: { w: 1120, h: 1400 },
        layers: [
          { src: 'assets/overlays/contact-shadow.svg', x: 18, y: 8, w: 68, h: 114, opacity: 0.8 },
          { src: 'assets/props/haein-phone-front.webp', x: 23.5, y: 8.8, w: 53 },
          { src: 'assets/overlays/haein-phone-playlist.svg', x: 27.75, y: 16, w: 44.5 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 125 }
        ]
      },
      datetime: { date: '10월 30일' },
      desc: '해인 휴대폰의 재생목록' },
    { no: 10, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'musicroom',
      compose: {
        bg: 'assets/backgrounds/musicroom/night-locker.webp',
        canvasSize: { w: 1120, h: 1400 },
        layers: [
          { src: 'assets/overlays/locker-17-label.svg', x: 41, y: 43.05, w: 18 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 125 }
        ]
      },
      datetime: { date: '10월 30일' },
      desc: '음악실 17번 보관함', spacing: { after: 80 } },
    { no: 11, mood: 'lamp', type: 'phone', kind: 'text',
      datetime: { date: '10월 30일', time: '20:31' },
      desc: '20:31 공유폴더 초대 메일 알림',
      phone: { owner: 'seungmin', view: 'notification',
        items: [{ app: '메일', from: '권해인', time: '20:31', title: '공유폴더 초대 · 작년 자료 검토',
          body: '승민쌤, 합창제 자료에 확인이 필요한 부분이 있어 공유해 둘게요. 제가 없는 동안이라도 자료 자체는 보존되도록요. 확인 중인 자료이니 단정하지 말아 주세요.' }] } },
    { no: 12, mood: 'lamp', type: 'phone', kind: 'text',
      datetime: { date: '10월 30일', time: '20:31' },
      desc: '20:31 공유폴더 초대 메일 알림 미리보기 (메일을 열지 않음)',
      phone: { owner: 'seungmin', view: 'notification', focus: true,
        items: [{ app: '메일', from: '권해인', time: '20:31', title: '공유폴더 초대 · 작년 자료 검토',
          body: '승민쌤, 합창제 자료에 확인이 필요한 부분이 있어 공유해 둘게요. 제가 없는 동안이라도 자료 자체는 보존되도록요. 확인 중인 자료이니 단정하지 말아 주세요.' }] },
      spacing: { after: 80 } },
    { no: 13, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'musicroom',
      compose: {
        bg: 'assets/backgrounds/musicroom/night-desk.webp',
        canvasSize: { w: 1120, h: 1400 },
        layers: [
          { src: 'assets/props/brown-envelope.webp', x: -4, y: 11, w: 99 },
          { src: 'assets/overlays/contact-shadow.svg', x: 44, y: 45, w: 65, h: 76, opacity: 0.42 },
          { src: '@haein/hand-phone-camera', x: 48.5, y: 40, w: 54.5 },
          { src: 'assets/overlays/haein-phone-camera.svg', x: 48.5, y: 40, w: 54.5 },
          { src: 'assets/props/brown-envelope.webp', x: 55.65, y: 61, w: 25.3 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 125 }
        ]
      },
      datetime: { date: '10월 30일', time: '20:59' },
      desc: '20:59 갈색 서류 봉투 사진' },
    { no: 14, mood: 'lamp', type: 'phone', kind: 'text',
      datetime: { date: '10월 30일', time: '21:11' },
      desc: '21:11 서진석의 메시지',
      phone: { owner: 'haein', view: 'notification',
        items: [{ app: '메시지', from: '서진석', time: '21:11',
          body: '아까 학교 앞을 지나왔는데 음악실 불이 켜져 있더군요. 아직 계세요?' }] } },
    { no: 15, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'musicroom',
      compose: {
        canvasSize: { w: 900, h: 1125 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -25, y: 0, w: 250 },
          { src: '@haein/sit-phone', x: 0.5, y: 8, w: 94 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 125 }
        ]
      },
      datetime: { date: '10월 30일' },
      desc: '메시지를 확인하는 해인' },
    { no: 16, mood: 'lamp', type: 'phone', kind: 'text',
      datetime: { date: '10월 30일', time: '21:20' },
      desc: '21:20 최기훈의 46초 전화 기록',
      phone: { owner: 'haein', view: 'calllog',
        entries: [{ name: '최기훈', kind: '수신', time: '21:20', duration: '46초' }] },
      spacing: { after: 96 } },
    { no: 17, mood: 'lamp', spacing: { after: 72 }, type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'musicroom',
      compose: {
        canvasSize: { w: 900, h: 1125 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -148.5, y: 0, w: 250 },
          { src: 'assets/overlays/contact-shadow.svg', x: 44.5, y: 113.5, w: 31, h: 8 },
          { src: '@seungmin/stand-leave', x: 44, y: 14.5, w: 34 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 125 }
        ]
      },
      datetime: { date: '10월 30일', time: '21:37' },
      desc: '21:37 승민이 퇴근하려는 장면' },
    { no: 18, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 900, h: 900 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -8.6, y: 0, w: 200 },
          { src: '@haein/sit-talk', x: -30, y: 10.56, w: 128.8 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '해인', text: '승민쌤, 내일 리허설 앞부분만 대신 진행해 주실 수 있어요?' }] },
    { no: 19, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 900, h: 900 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -80.2, y: 0, w: 200 },
          { src: '@seungmin/sit-talk', x: 18, y: 5.9, w: 92 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '승민', text: '네. 학생들 모이면 강당에서 시작하면 되죠?' }] },
    { no: 20, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 1000, h: 1000 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -13.5, y: 0, w: 200 },
          { src: '@haein/sit-point', x: -11.4, y: 5, w: 124 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '해인', text: '네. 아침에 행정실에서 확인할 게 있어서요. 음원은 이 휴대폰에 순서대로 준비해 뒀어요.' }] },
    { no: 21, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 900, h: 900 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -114.7, y: -6.7, w: 230 },
          { src: '@seungmin/sit-talk', x: 14.4, y: 8.7, w: 110 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '승민', text: '휴대폰을 맡기시게요? 파일만 보내주셔도 되는데.' }] },
    { no: 22, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 1000, h: 1000 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -80.2, y: 0, w: 200 },
          { src: '@seungmin/sit-talk', x: 51.4, y: 24.5, w: 49.4 },
          { src: 'assets/props/musicroom-desk-rehearsal.webp', x: -11, y: 60, w: 122 },
          { src: '@haein/over-shoulder', x: -15, y: 25, w: 86 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '해인', text: '강당 장비에 연결해서 시작 부분과 음량을 맞춰 놨어요. 첫 리허설은 그대로 틀어 주시면 돼요.' }] },
    { no: 23, mood: 'lamp', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 900, h: 900 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -110.9, y: -10, w: 260 },
          { src: '@seungmin/sit-talk', x: -0.8, y: 1.8, w: 140 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '승민', text: '그 뒤에 반복해서 연습할 곡은요?' }] },
    { no: 24, mood: 'lamp', spacing: { after: 56 }, type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 900, h: 900 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -2.1, y: 0, w: 200 },
          { src: '@haein/sit-explain', x: -27, y: 18, w: 126 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '해인', text: '컴퓨터로 옮겨도 괜찮아요. 그때 시작 부분과 음량만 다시 맞춰 주세요.' }] },
    { no: 25, mood: 'lamp-deep', spacing: { after: 64 }, type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 900, h: 900 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -111, y: -4, w: 215 },
          { src: '@seungmin/sit-talk', x: 12.4, y: 8.6, w: 125 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '승민', text: '알겠습니다. 휴대폰은 언제 돌려드리면 될까요?' }] },
    { no: 26, mood: 'lamp-deep', spacing: { after: 96 }, type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 900, h: 900 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -31.2, y: -10, w: 240 },
          { src: '@haein/sit-talk', x: -50.6, y: -3.2, w: 174.8 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 100 }
        ]
      },
      lines: [{ who: '해인', text: '열 시 반쯤 제가 찾으러 올게요. 잠금은 풀어 둘게요. 부탁드려요.' }] },
    { no: 27, mood: 'lamp-deep', transition: 'slow', spacing: { after: 96 }, type: 'panel', kind: 'key', image: '27.webp', imageSize: { w: 1120, h: 1400 }, ratio: '4:5', tone: 'musicroom', datetime: { date: '10월 30일' },
      desc: '해인이 승민에게 휴대폰 전달' },
    { no: 28, mood: 'lamp-deep', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'musicroom', datetime: { date: '10월 30일' },
      compose: {
        canvasSize: { w: 900, h: 1125 },
        layers: [
          { src: 'assets/backgrounds/musicroom/night-wide.jpg', x: -73.8, y: 0, w: 250 },
          { src: '@seungmin/sit-hold-phone', x: 41.78, y: 65.2, w: 61.8 },
          { src: '@haein/sit-talk', x: -16.67, y: 66.1, w: 92 },
          { src: 'assets/overlays/musicroom-night-grade.svg', x: 0, y: 0, w: 100, h: 125 }
        ]
      },
      lines: [{ who: '해인', text: '고마워요. 승민쌤은 확인하고 말하는 사람이라 좋아요.' }],
      spacing: { after: 360 } },

    /* ---------- 29~43 10월 31일 리허설 ---------- */
    { no: 29, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '16:9', tone: 'auditorium',
      scene: { date: '10월 31일', time: '08:58', place: '양평중학교 강당' },
      datetime: { date: '10월 31일', time: '08:58' },
      desc: '08:58 강당 외부', transition: 'slow' },
    { no: 30, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '16:9', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '합창부 학생들 입장' },
    { no: 31, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '해인의 휴대폰을 음향 장비에 연결' },
    { no: 32, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '4:3', tone: 'auditorium',
      datetime: { date: '10월 31일', time: '09:00' },
      desc: '09:00 리허설 시작' },
    { no: 33, mood: 'morning', type: 'panel', kind: 'key', image: null, ratio: '16:9', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '합창 장면' },
    { no: 34, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '음원과 악보를 확인하는 승민', spacing: { after: 120 } },
    { no: 35, mood: 'alert', spacing: { after: 64 }, type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '09:17' },
      desc: '09:17 문자 알림',
      phone: { owner: 'haein', view: 'notification', overPlayer: true,
        items: [{ app: '메시지', from: '알 수 없는 발신자', time: '09:17', body: '' }] } },
    { no: 36, mood: 'alert', transition: 'slow', spacing: { after: 140 }, type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '09:17' },
      desc: "'홍온유 학생 일은 이번에도 그냥 넘어가실 건가요?'",
      phone: { owner: 'haein', view: 'zoom', time: '09:17',
        text: '홍온유 학생 일은 이번에도 그냥 넘어가실 건가요?' } },
    { no: 37, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '알림을 확인하는 승민' },
    { no: 38, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '16:9', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '계속되는 합창' },
    { no: 39, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '승민이 알림을 열지 않고 화면을 끔' },
    { no: 40, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '4:3', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '연습 장면과 시간 경과', spacing: { after: 160 } },
    { no: 41, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '16:9', tone: 'auditorium',
      datetime: { date: '10월 31일', time: '10:15' },
      desc: '10:15 리허설 종료' },
    { no: 42, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '반복 연습용 음원을 학교 컴퓨터로 복사' },
    { no: 43, mood: 'morning', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '반환할 휴대폰을 들고 있는 승민', spacing: { after: 240 } },

    /* ---------- 44~54 오지 않는 해인 ---------- */
    { no: 44, mood: 'drift', spacing: { after: 120 }, type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium',
      datetime: { date: '10월 31일', time: '10:30' },
      desc: '10:30 시계', transition: 'slow' },
    { no: 45, mood: 'drift', spacing: { after: 120 }, type: 'panel', kind: 'compose', image: null, ratio: '3:4', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '해인이 나타나지 않는 강당 입구' },
    { no: 46, mood: 'drift', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium', datetime: { date: '10월 31일' },
      lines: [{ who: '학생', text: '쌤, 해인쌤은 언제 오세요? 다음 곡 음원이 필요한데요.' }] },
    { no: 47, mood: 'drift', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium', datetime: { date: '10월 31일' },
      lines: [{ who: '승민', text: '곧 오실 거야.' }], spacing: { after: 180 } },
    { no: 48, mood: 'slate', spacing: { after: 64 }, type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '10:33' },
      desc: '10:33 승민이 교무실에 전화',
      phone: { owner: 'seungmin', view: 'call', state: 'calling', name: '교무실', status: '연결 중…' } },
    { no: 49, mood: 'slate', type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '10:33' },
      desc: '받지 않는 전화',
      phone: { owner: 'seungmin', view: 'call', state: 'ended', name: '교무실', status: '응답 없음' },
      spacing: { after: 140 } },
    { no: 50, mood: 'slate', spacing: { after: 96 }, type: 'panel', kind: 'compose', image: null, ratio: '4:3', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '승민과 해인의 서로 다른 휴대폰' },
    { no: 51, mood: 'slate', spacing: { after: 64 }, type: 'phone', kind: 'text',
      datetime: { date: '10월 31일' },
      desc: '전날 공유폴더 초대 메일 알림 재확인',
      phone: { owner: 'seungmin', view: 'notification',
        items: [{ app: '메일', from: '권해인', time: '어제 20:31', title: '공유폴더 초대 · 작년 자료 검토',
          body: '승민쌤, 합창제 자료에 확인이 필요한 부분이 있어 공유해 둘게요. 제가 없는 동안이라도 자료 자체는 보존되도록요. 확인 중인 자료이니 단정하지 말아 주세요.' }] } },
    { no: 52, mood: 'slate', type: 'phone', kind: 'text',
      datetime: { date: '10월 31일' },
      desc: "'제가 없는 동안' 문구 강조",
      phone: { owner: 'seungmin', view: 'zoom',
        text: '제가 없는 동안이라도 자료 자체는 보존되도록요.', highlight: '제가 없는 동안' },
      spacing: { after: 160 } },
    { no: 53, mood: 'slate', spacing: { after: 96 }, type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '10:35' },
      desc: '10:35 해인 휴대폰에 남아 있는 09:17 알림',
      phone: { owner: 'haein', view: 'lock', clock: '10:35', date: '10월 31일 토요일',
        items: [{ app: '메시지', from: '알 수 없는 발신자', time: '09:17',
          body: '홍온유 학생 일은 이번에도 그냥 넘어가실 건가요?' }] } },
    { no: 54, mood: 'slate', type: 'phone', kind: 'text',
      datetime: { date: '10월 31일' },
      desc: '홍온유 관련 문구 확대',
      phone: { owner: 'haein', view: 'zoom',
        text: '홍온유 학생 일은 이번에도 그냥 넘어가실 건가요?', highlight: '홍온유' },
      spacing: { after: 260 } },

    /* ---------- 55~62 임효은 등장 ---------- */
    { no: 55, mood: 'frost', spacing: { after: 96 }, type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '10:45' },
      desc: "10:45 효은: '승민쌤 강당이세요? 잠깐 갈게요.'",
      phone: { owner: 'seungmin', view: 'sms', contact: '임효은',
        messages: [{ from: 'them', text: '승민쌤 강당이세요? 잠깐 갈게요.', time: '10:45' }] } },
    { no: 56, mood: 'frost', spacing: { after: 72 }, type: 'panel', kind: 'compose', image: null, ratio: '3:4', tone: 'auditorium',
      datetime: { date: '10월 31일', time: '10:50' },
      desc: '10:50 효은 등장' },
    { no: 57, mood: 'frost', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium', datetime: { date: '10월 31일' },
      lines: [{ who: '효은', text: '해인 선생님이 몸이 안 좋아서 못 오신대요.' }] },
    { no: 58, mood: 'frost', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium', datetime: { date: '10월 31일' },
      lines: [{ who: '효은', text: '휴대폰은 제가 전해 드리기로 했어요.' }] },
    { no: 59, mood: 'frost', type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium', datetime: { date: '10월 31일' },
      lines: [{ who: '승민', text: '해인쌤과 직접 통화해 볼 수 있을까요?' }] },
    { no: 60, mood: 'frost', spacing: { after: 96 }, type: 'panel', kind: 'compose', image: null, ratio: '1:1', tone: 'auditorium', datetime: { date: '10월 31일' },
      lines: [{ who: '효은', text: '지금은 쉬셔야 한대요. 제가 바로 갖다 드릴게요.' }] },
    { no: 61, mood: 'cold-deep', transition: 'slow', spacing: { after: 120 }, type: 'panel', kind: 'key', image: null, ratio: '4:5', tone: 'auditorium',
      datetime: { date: '10월 31일', time: '10:52' },
      desc: '10:52 승민이 효은에게 휴대폰 전달' },
    { no: 62, mood: 'cold-deep', type: 'panel', kind: 'compose', image: null, ratio: '16:9', tone: 'auditorium', datetime: { date: '10월 31일' },
      desc: '효은이 떠나고 승민이 강당에 남음', spacing: { after: 320 } },

    /* ---------- 63~67 마지막 안부 문자 ---------- */
    { no: 63, mood: 'home', spacing: { after: 96 }, type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'home',
      scene: { date: '10월 31일', time: '저녁', place: '승민의 집' },
      datetime: { date: '10월 31일' },
      desc: '10월 31일 저녁, 집에 돌아온 승민', transition: 'slow' },
    { no: 64, mood: 'home', type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '19:20' },
      phone: { owner: 'seungmin', view: 'sms', contact: '권해인',
        messages: [{ from: 'me', text: '해인쌤, 몸은 좀 괜찮으세요? 휴대폰은 효은쌤께 드렸어요.', time: '19:20' }] },
      spacing: { after: 160 } },
    { no: 65, mood: 'home', transition: 'slow', spacing: { after: 64 }, type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '19:36' },
      desc: '19:36 문자 알림',
      phone: { owner: 'seungmin', view: 'notification',
        items: [{ app: '메시지', from: '권해인', time: '19:36',
          body: '승민쌤, 저 해인이에요. 휴대폰 잘 받았어요. 몸이 안 좋아서 당분간 쉬려고 해요. 휴직도 생각 중이에요. 걱정해 주셔서 감사해요.' }] } },
    { no: 66, mood: 'home', spacing: { after: 64 }, type: 'phone', kind: 'text',
      datetime: { date: '10월 31일', time: '19:36' },
      phone: { owner: 'seungmin', view: 'sms', contact: '권해인',
        messages: [
          { from: 'me', text: '해인쌤, 몸은 좀 괜찮으세요? 휴대폰은 효은쌤께 드렸어요.', time: '19:20' },
          { from: 'them', text: '승민쌤, 저 해인이에요. 휴대폰 잘 받았어요. 몸이 안 좋아서 당분간 쉬려고 해요. 휴직도 생각 중이에요. 걱정해 주셔서 감사해요.', time: '19:36' }
        ] } },
    { no: 67, mood: 'home', type: 'phone', kind: 'text',
      datetime: { date: '10월 31일' },
      phone: { owner: 'seungmin', view: 'sms', contact: '권해인',
        messages: [
          { from: 'me', text: '해인쌤, 몸은 좀 괜찮으세요? 휴대폰은 효은쌤께 드렸어요.', time: '19:20' },
          { from: 'them', text: '승민쌤, 저 해인이에요. 휴대폰 잘 받았어요. 몸이 안 좋아서 당분간 쉬려고 해요. 휴직도 생각 중이에요. 걱정해 주셔서 감사해요.', time: '19:36' },
          { from: 'me', text: '푹 쉬세요. 학교 일은 걱정하지 마세요.' }
        ] },
      spacing: { after: 420 } },

    /* ---------- 68~70 11월 2일 경찰 전화 ---------- */
    { no: 68, mood: 'hush', type: 'phone', kind: 'text',
      scene: { date: '11월 2일', time: '07:48' },
      datetime: { date: '11월 2일', time: '07:48' },
      desc: '07:48 양평경찰서 문상윤 순경의 전화',
      phone: { owner: 'seungmin', view: 'call', state: 'incoming', name: '양평경찰서', status: '수신 전화' },
      transition: 'slow', spacing: { after: 180 } },
    { no: 69, mood: 'hush', transition: 'slow', type: 'panel', kind: 'compose', image: null, ratio: '4:5', tone: 'dawn', datetime: { date: '11월 2일' },
      desc: '문상윤의 전화 음성 (문상윤은 화면에 등장하지 않음)',
      lines: [
        { who: '문상윤', style: 'phone', text: '권해인 선생님이 어제 저녁 양평문화회관 계단에서 숨진 채 발견되셨습니다.' },
        { who: '문상윤', style: 'phone', text: '사고로 보고 있습니다.' },
        { who: '문상윤', style: 'phone', text: '최근 건강 상태에 대해 들으신 게 있습니까?' }
      ], spacing: { after: 260 } },
    { no: 70, mood: 'void', type: 'panel', kind: 'key', image: null, ratio: '4:5', tone: 'dawn', datetime: { date: '11월 2일' },
      lines: [{ who: '승민', text: '그저께… 몸이 안 좋다는 문자를 받았습니다.' }],
      transition: 'slow', spacing: { after: 0 } }
  ]
});
