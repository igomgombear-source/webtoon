/* 말풍선 v4 컷별 설정 — js/bubbles.js 가 읽는다 (104컷 전체에 적용되는 렌더러, 이 파일은 예외·실측값만 담는다).
 *
 * 설정이 없는 컷은 대사 데이터(at·panel·style·who)와 컷 비율에서 임시 설정을 자동으로 만든다.
 *   - 보호 영역(얼굴·손·휴대폰)은 원화가 없으면 컷 모양으로 가정한 임시값(approved:false)이다. 최종 승인 상태가 아니다.
 *   - 원화가 들어오면 그 컷의 zones 를 원화에서 직접 재서 아래 cuts 에 넣는다 (approved:true).
 *
 * zoneKind  원화가 없는 컷의 가정 보호 영역 종류: face | face2 | wide | phone | hands | none (생략하면 비율로: 가로로 넓으면 wide, 아니면 face)
 * offscreen 화면 밖 목소리(꼬리가 컷 테두리 밖으로)로 그릴 컷 번호
 * cuts      컷별 덮어쓰기
 *   status  'provisional'(기본, 배치 미승인) | 'monologue-approved'(50컷: 사용자가 독백 배치를 승인)
 *   zones   말풍선이 덮으면 안 되는 영역 (패널 기준 %, x·y·w·h, approved 는 원화에서 잰 값인지)
 *   lines   데이터의 대사 순서와 1:1. type speech|offscreen|mono|phone|caption · pref {panel, at|x,y} · region 'panel'|'row'
 *           tail {panel,x,y} · edge · place 'above'|'below' · bandPref · join:false
 *   screen  (예전) 83컷 임시 문자 화면 — 원화 합성 UI(js/screenui.js)로 대체되어 지금은 쓰지 않는다(겹침 방지)
 *   bandBase 큰 값이면 여백 띠를 마지막 수단으로만 쓴다 (33컷: 제작기준의 '각 조각 안쪽' 우선)
 */
window.EP01V3_BUBBLES = {
  zoneKind: { 10: 'wide', 20: 'phone', 31: 'phone', 59: 'phone', 60: 'hands', 65: 'phone' },
  offscreen: { 51: 1 },
  cuts: {

  18: {
    note: '분할2 · 효은(왼쪽 a)→승민(오른쪽 b)→효은. 승민 말풍선 꼬리는 b의 승민 얼굴로, 마지막 효은 말풍선은 b 아래 경계의 왼쪽(조각 사이 쪽)에 두고 꼬리를 a의 효은 쪽으로 (2026-11-14 꼬리 방향 수정, 정본 위치 유지)',
    zones: [
      { panel: 0, x: 26, y: 4, w: 40, h: 42, label: '효은 얼굴', approved: true },
      { panel: 1, x: 44, y: 3, w: 40, h: 40, label: '승민 얼굴', approved: true },
      { panel: 1, x: 16, y: 54, w: 50, h: 28, label: '귤 받는 손', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, at: 'in-tl' }, region: 'panel', tail: { panel: 0, x: 45, y: 40 } },
      { type: 'speech', pref: { panel: 1, x: 0, y: 30 }, region: 'row', tail: { panel: 1, x: 62, y: 38 } },
      { type: 'speech', pref: { panel: 1, x: 0, y: 100 }, bandPref: { panel: 0, x: 80, y: 100 }, region: 'panel', edge: true, tailMax: 80, tail: { panel: 0, x: 60, y: 40 } }
    ]
  },
  10: {
    note: '마감 원화(교실·교탁 옆 승민) — 승민 얼굴·분필 손, 칠판 글씨 보호. 첫 말은 칠판 왼쪽 위(승민 쪽 꼬리), 둘째는 경계-하 (2026-11-18)',
    zones: [
      { panel: 0, x: 50, y: 20, w: 22, h: 30, label: '승민 얼굴·분필 손', approved: true },
      { panel: 0, x: 15, y: 18, w: 40, h: 16, label: '칠판 三人成虎', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 26, y: 40 }, region: 'panel', tailMax: 60, tail: { panel: 0, x: 58, y: 30 } },
      { type: 'speech', pref: { panel: 0, at: 'edge-bottom-l' }, region: 'panel', edge: true, join: false, tailMax: 60, tail: { panel: 0, x: 58, y: 32 } }
    ]
  },
  17: {
    note: '마감 원화(화이트보드 앞 최기훈 3/4 뒷모습, 전경 승민 뒷머리) — 공지는 보드 오른쪽 위 벽 쪽, 꼬리는 최기훈 머리. 화면 밖 교사들의 답은 작게 경계-하-좌 (2026-11-18)',
    zones: [
      { panel: 0, x: 22, y: 10, w: 56, h: 36, label: '화이트보드 공지', approved: true },
      { panel: 0, x: 54, y: 24, w: 26, h: 76, label: '최기훈', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 88, y: 12 }, region: 'panel', tailMax: 60, tail: { panel: 0, x: 74, y: 34 } },
      { type: 'offscreen', pref: { panel: 0, at: 'edge-bottom-l' }, region: 'panel', edge: true, tail: { panel: 0, x: 30, y: 80 } }
    ]
  },
  33: {
    note: '위 1컷 + 아래 사선 2분할 · 제작기준 v2의 \'각 조각 안쪽\'을 우선(사용자 지시), 자리가 정말 없을 때만 여백 띠 · 최대 2줄 · 배치 미승인, 원화가 오면 원화와 말풍선 공간을 함께 조정',
    maxLines: 2,
    status: 'provisional',
    bandBase: 500,
    zones: [
      { panel: 0, x: 46, y: 10, w: 18, h: 42, label: '해인 얼굴(핵심만)', approved: false },
      { panel: 1, x: 36, y: 62, w: 34, h: 28, label: '메모하는 손', approved: false },
      { panel: 2, x: 56, y: 30, w: 24, h: 40, label: '해인 옆얼굴', approved: false }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 20, y: 18 }, region: 'panel', tail: { panel: 0, x: 54, y: 40 } },
      { type: 'speech', pref: { panel: 0, x: 22, y: 50 }, region: 'panel', tail: { panel: 0, x: 54, y: 40 } },
      { type: 'speech', pref: { panel: 1, at: 'in-tl' }, region: 'panel', tail: { panel: 1, x: 30, y: 104 } },
      { type: 'speech', pref: { panel: 2, at: 'in-tl' }, region: 'panel', tail: { panel: 2, x: 52, y: 54 } },
      { type: 'speech', pref: { panel: 2, at: 'in-br' }, region: 'panel', tail: { panel: 2, x: 52, y: 54 } }
    ]
  },
  35: {
    note: '승인 원화(DRAFT) — 얼굴 위치를 원화에서 직접 잼 (3:4, 좌상 빈 배경에 말풍선)',
    status: 'provisional',
    zones: [
      { panel: 0, x: 38, y: 25, w: 56, h: 60, label: '얼굴·눈·앞머리·표정', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, at: 'in-tl' }, region: 'panel', edge: true, tail: { panel: 0, x: 52, y: 52 } }
    ]
  },
  38: {
    note: 'DRAFT 원화(왼쪽 해인 서 있음·오른쪽 승민 메모) — 정본: 승민 오른쪽 위 / 해인 왼쪽 아래. 얼굴·손·폰 보호, 좌하는 토트백·하체라 넓은 말풍선은 아래 여백으로 내려갈 수 있음 (2026-11-17)',
    zones: [
      { panel: 0, x: 10, y: 8, w: 22, h: 46, label: '해인 얼굴·폰 든 손', approved: true },
      { panel: 0, x: 72, y: 28, w: 26, h: 34, label: '승민 얼굴', approved: true },
      { panel: 0, x: 58, y: 70, w: 30, h: 30, label: '승민 손·펜·큐시트', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, at: 'in-tr' }, region: 'panel', tail: { panel: 0, x: 82, y: 34 } },
      { type: 'speech', pref: { panel: 0, at: 'in-bl' }, region: 'panel', tailMax: 50, tail: { panel: 0, x: 20, y: 26 } }
    ]
  },
  41: {
    note: 'DRAFT 원화(문가에서 돌아보는 해인) — 작은 말풍선을 문 위 어두운 복도 쪽에, 꼬리는 얼굴로. 얼굴·어깨·문손잡이 보호 (2026-11-17)',
    zones: [
      { panel: 0, x: 44, y: 9, w: 34, h: 22, label: '해인 얼굴·머리·어깨', approved: true },
      { panel: 0, x: 74, y: 28, w: 16, h: 12, label: '문손잡이 잡은 손', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 62, y: 5 }, region: 'panel', tail: { panel: 0, x: 62, y: 14 } }
    ]
  },
  45: {
    note: '승인 원화 REV1(DRAFT) — 발화자는 무대 중앙 앞줄의 손을 든 학생(손끝 원화 약 (527,312)). 말풍선은 그 학생 바로 아래(객석 빈 곳, 믹서 위)에 두고 꼬리가 위로 그 학생을 가리킴 — 위쪽은 뒷줄 얼굴 때문에 다른 학생을 가리키게 되고, 꼬리 길이는 엔진 상한이라 폭에 따라 위치가 달라지지 않는 아래쪽을 택함',
    status: 'provisional',
    zones: [
      { panel: 0, x: 30, y: 21, w: 42, h: 52, label: '합창부 학생들(얼굴·몸·발)', approved: true }
    ],
    lines: [
      { type: 'offscreen', pref: { panel: 0, x: 51.8, y: 82 }, region: 'panel', tail: { panel: 0, x: 51.8, y: 66 } }
    ]
  },
  50: {
    status: 'monologue-approved',
    note: '승인 원화 · 인물 중심 독백 2개 (제작기준 좌상·우하 → 얼굴을 피해 우상 벽·우하 믹서로, 오른쪽 끝선 맞춤)',
    zones: [
      { panel: 0, x: 24, y: 8, w: 32, h: 45, label: '얼굴·눈·앞머리·표정', approved: true },
      { panel: 0, x: 17, y: 70, w: 50, h: 22, label: '손·멈춘 검지', approved: true },
      { panel: 0, x: 55, y: 78, w: 42, h: 19, label: '휴대폰 화면', approved: true }
    ],
    lines: [
      { type: 'mono', pref: { panel: 0, x: 82, y: 12 }, region: 'panel' },
      { type: 'mono', pref: { panel: 0, x: 82, y: 60 }, region: 'panel' }
    ]
  },
  55: {
    note: '승민(오른쪽 믹서 앞) 말은 꼬리를 승민 얼굴로, 학생들 인사는 정본대로 경계-하-우에 두되 꼬리를 문으로 나가는 학생들 쪽(왼쪽 위)으로 (2026-11-14 꼬리 방향 수정)',
    zones: [
      { panel: 0, x: 56, y: 0, w: 32, h: 42, label: '승민 얼굴·머리', approved: true },
      { panel: 0, x: 70, y: 40, w: 30, h: 18, label: '믹서 위 손', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, at: 'in-tl' }, region: 'panel', tail: { panel: 0, x: 66, y: 22 } },
      { type: 'speech', pref: { panel: 0, at: 'edge-bottom-r' }, region: 'panel', edge: true, join: false, tailMax: 40, tail: { panel: 0, x: 22, y: 34 },
        splitParts: ['네에~', '안녕히 계세요!'], partCfg: [{ pref: { panel: 0, x: 30, y: 100 }, tail: { panel: 0, x: 14, y: 40 } }, { pref: { panel: 0, x: 62, y: 100 }, tail: { panel: 0, x: 28, y: 36 } }] }
    ]
  },
  62: {
    note: '3:1 띠 · 독백(띠 위 여백) → 전화 음성(띠 안, 얼굴 왼쪽 빈 객석 쪽 — 꼬리는 귀에 댄 휴대폰(원화 약 84%,50%)까지) → 독백(띠 아래 여백). 보호 영역을 원화에서 다시 잼(2026-11-14: 이전 값이 얼굴보다 왼쪽이라 전화 음성이 얼굴을 덮었음)',
    zones: [
      { panel: 0, x: 66, y: 0, w: 15, h: 74, label: '승민 옆얼굴(귀의 폰 제외)', approved: true },
      { panel: 0, x: 62, y: 55, w: 13, h: 45, label: '가슴에 댄 해인의 폰', approved: true }
    ],
    lines: [
      { type: 'mono', pref: { panel: 0, x: 22, y: 0 }, region: 'panel', place: 'above' },
      { type: 'phone', pref: { panel: 0, x: 48, y: 30 }, region: 'panel', tailMax: 60, tail: { panel: 0, x: 84, y: 50 } },
      { type: 'mono', pref: { panel: 0, x: 22, y: 100 }, region: 'panel', place: 'below' }
    ]
  },
  67: {
    note: '효은(왼쪽, 안경·묶은 머리)의 말 — 효은과 승민 사이 빈 벽에 두고 꼬리를 효은 얼굴로(좁은 폭에서 자리가 없으면 컷 아래 여백, 긴 꼬리) (2026-11-14 꼬리 방향 수정)',
    zones: [
      { panel: 0, x: 26, y: 2, w: 13, h: 24, label: '효은 얼굴', approved: true },
      { panel: 0, x: 18, y: 26, w: 34, h: 74, label: '효은 몸·손', approved: true },
      { panel: 0, x: 72, y: 15, w: 22, h: 36, label: '승민 얼굴', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 56, y: 14 }, region: 'panel', tailMax: 90, tail: { panel: 0, x: 37, y: 14 } }
    ]
  },
  69: {
    note: '마감 원화(피곤한 얼굴 클로즈업 + 우상 35컷 인셋) — 얼굴 전체 보호, 대사는 정본(gap)대로 컷 아래 (2026-11-18)',
    zones: [
      { panel: 0, x: 0, y: 0, w: 72, h: 100, label: '승민 얼굴·입', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 40, y: 112 }, region: 'panel', place: 'below', tail: { panel: 0, x: 52, y: 70 } }
    ]
  },
  70: {
    note: '효은 얼굴(안경)·폰을 내미는 손 보호 — 경계-상 말풍선은 안경·머리를 피해 오른쪽 위(창·벽) 경계로, 안-좌하는 몸 위 — 휴대폰과 안경은 어느 폭에서도 덮지 않음 (2026-11-14 얼굴 가림 수정)',
    zones: [
      { panel: 0, x: 4, y: 0, w: 52, h: 40, label: '효은 얼굴·안경·머리', approved: true },
      { panel: 0, x: 46, y: 22, w: 32, h: 60, label: '폰과 손', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 76, y: 0 }, region: 'panel', edge: true, tail: { panel: 0, x: 50, y: 14 } },
      { type: 'speech', pref: { panel: 0, x: 20, y: 78 }, region: 'panel', tail: { panel: 0, x: 34, y: 34 } }
    ]
  },
  71: {
    note: '4:1 띠 전체가 눈·얼굴 — 독백은 정본(gap)대로 띠 아래 여백에만 (2026-11-14 얼굴 가림 수정)',
    zones: [
      { panel: 0, x: 0, y: 0, w: 100, h: 100, label: '두 사람의 눈·얼굴', approved: true }
    ],
    lines: [
      { type: 'mono', pref: { panel: 0, x: 70, y: 100 }, region: 'panel', place: 'below' }
    ]
  },
  75: {
    note: '분할2 · a 승민, b 효은. 승민 두 말풍선은 a 아래 여백, 효은 말풍선은 b 아래 여백 — 꼬리는 각자 쪽으로 (2026-11-14 꼬리 방향 수정, 정본 gap 유지)',
    zones: [
      { panel: 0, x: 40, y: 18, w: 40, h: 34, label: '승민 얼굴', approved: true },
      { panel: 1, x: 44, y: 18, w: 38, h: 38, label: '효은 얼굴·안경', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 45, y: 112 }, bandPref: { panel: 0, x: 45, y: 100 }, region: 'panel', place: 'below', tail: { panel: 0, x: 58, y: 60 } },
      { type: 'speech', pref: { panel: 0, x: 45, y: 112 }, bandPref: { panel: 0, x: 45, y: 100 }, region: 'panel', place: 'below', tail: { panel: 0, x: 58, y: 60 } },
      { type: 'speech', pref: { panel: 1, x: 55, y: 112 }, bandPref: { panel: 1, x: 60, y: 100 }, region: 'panel', place: 'below', join: false, tail: { panel: 1, x: 62, y: 62 } }
    ]
  },
  83: {
    note: '휴대폰 메시지 화면(U10)은 원화 위 합성 UI(data/ep01v3-screens.js "83")만 쓴다 — 예전 말풍선 엔진의 임시 문자 화면(screen)은 합성 UI와 겹쳐 두 번 보여 제거함',
    zones: [
      { panel: 0, x: 0, y: 88, w: 100, h: 12, label: '엄지 두 개', approved: false }
    ],
    lines: []
  },
  90: {
    note: '분할2 · 오른쪽 b 휴대폰 아래쪽 입력창(쓰다 지운 문장)이 독백에 가려지던 것 → 독백 두 개를 정본(gap)대로 각 조각 아래 여백으로 (2026-11-21)',
    zones: [
      { panel: 1, x: 30, y: 0, w: 70, h: 100, label: '휴대폰 화면·입력창', approved: true }
    ],
    lines: [
      { type: 'mono', pref: { panel: 0, x: 50, y: 100 }, region: 'panel', place: 'below' },
      { type: 'mono', pref: { panel: 1, x: 50, y: 100 }, region: 'panel', place: 'below' }
    ]
  },
  93: {
    note: '마감 원화(놀라 눈을 크게 뜬 옆얼굴, 집중선) — 얼굴 보호, 독백 두 개는 정본(gap)대로 컷 아래 (2026-11-18)',
    zones: [
      { panel: 0, x: 10, y: 10, w: 75, h: 90, label: '승민 얼굴·머리', approved: true }
    ],
    lines: [
      { type: 'mono', pref: { panel: 0, x: 30, y: 100 }, region: 'panel', place: 'below' },
      { type: 'mono', pref: { panel: 0, x: 70, y: 100 }, region: 'panel', place: 'below' }
    ]
  },
  95: {
    note: '마감 원화(유리문에 얼비친 승민, 폰은 귀) — 전화 음성은 왼쪽 위 유리 쪽, 꼬리는 휴대폰 (2026-11-18)',
    zones: [
      { panel: 0, x: 40, y: 8, w: 52, h: 92, label: '승민 얼굴·폰 든 손', approved: true }
    ],
    lines: [
      { type: 'phone', pref: { panel: 0, x: 18, y: 14 }, region: 'panel', tailMax: 60, tail: { panel: 0, x: 50, y: 56 } }
    ]
  },
  96: {
    note: '마감 원화(입·턱·폰 클로즈업 + 모서리를 쥔 손 삽입 칸) — 얼굴·손 보호, 말과 전화 음성은 컷 아래 여백 (2026-11-18)',
    zones: [
      { panel: 0, x: 0, y: 0, w: 100, h: 100, label: '얼굴·폰·삽입 칸', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 70, y: 112 }, region: 'panel', place: 'below', tail: { panel: 0, x: 80, y: 50 } },
      { type: 'phone', pref: { panel: 0, x: 30, y: 112 }, region: 'panel', place: 'below', tail: { panel: 0, x: 22, y: 30 } }
    ]
  },
  97: {
    note: '얼굴이 컷 대부분 — 승민 말은 정본(gap)대로 컷 아래 여백, 꼬리는 위로 입 쪽 (2026-11-14 얼굴 가림 수정)',
    zones: [
      { panel: 0, x: 20, y: 6, w: 64, h: 74, label: '승민 얼굴·전화 든 손', approved: true }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 58, y: 112 }, region: 'panel', place: 'below', tail: { panel: 0, x: 58, y: 70 } }
    ]
  },
  102: {
    note: 'DRAFT 원화(현관에 주저앉은 승민, 왼쪽 통화 여백) — 전화 음성 3개를 왼쪽 여백에 위에서 아래로, 꼬리는 귀의 휴대폰으로. 얼굴·휴대폰·바닥 짚은 손 보호 (2026-11-17)',
    zones: [
      { panel: 0, x: 52, y: 18, w: 34, h: 18, label: '얼굴·귀의 휴대폰', approved: true },
      { panel: 0, x: 80, y: 62, w: 20, h: 12, label: '바닥 짚은 손', approved: true }
    ],
    lines: [
      { type: 'phone', pref: { panel: 0, x: 26, y: 26 }, region: 'panel', tailMax: 50, tail: { panel: 0, x: 60, y: 28 } },
      { type: 'phone', pref: { panel: 0, x: 26, y: 40 }, region: 'panel', tailMax: 50, tail: { panel: 0, x: 60, y: 28 } },
      { type: 'phone', pref: { panel: 0, x: 26, y: 70 }, region: 'panel', tailMax: 50, tail: { panel: 0, x: 60, y: 28 } }
    ]
  }
  }
};
