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
 *   screen  83컷 문자 화면(원화 합성 전 임시 UI. 최종은 두 손으로 쥔 휴대폰에 표시)
 *   bandBase 큰 값이면 여백 띠를 마지막 수단으로만 쓴다 (33컷: 제작기준의 '각 조각 안쪽' 우선)
 */
window.EP01V3_BUBBLES = {
  zoneKind: { 10: 'wide', 20: 'phone', 31: 'phone', 59: 'phone', 60: 'hands', 65: 'phone' },
  offscreen: { 51: 1 },
  cuts: {

  18: {
    note: '분할2 · 일반 대화(효은→승민→효은). 아래 여백에서는 화자 쪽으로 좌우 지그재그',
    zones: [
      { panel: 0, x: 30, y: 12, w: 42, h: 42, label: '효은 얼굴', approved: false },
      { panel: 1, x: 16, y: 46, w: 68, h: 40, label: '귤 받는 손', approved: false }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, at: 'in-tl' }, region: 'panel', tail: { panel: 0, x: 52, y: 44 } },
      { type: 'speech', pref: { panel: 1, x: 0, y: 30 }, region: 'row', tail: { panel: 1, x: 96, y: 22 } },
      { type: 'speech', pref: { panel: 1, at: 'edge-bottom-r' }, bandPref: { panel: 0, x: 55, y: 100 }, region: 'panel', edge: true, tail: { panel: 0, x: 52, y: 44 } }
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
  62: {
    note: '3:1 띠 · 독백(띠 위 여백) → 전화 음성(띠 안 폰 옆) → 독백(띠 아래 여백) — 폭과 관계없이 같은 구성',
    zones: [
      { panel: 0, x: 44, y: 4, w: 22, h: 80, label: '승민 옆얼굴·귀의 폰', approved: false },
      { panel: 0, x: 42, y: 66, w: 22, h: 34, label: '가슴에 댄 해인의 폰', approved: false }
    ],
    lines: [
      { type: 'mono', pref: { panel: 0, x: 22, y: 0 }, region: 'panel', place: 'above' },
      { type: 'phone', pref: { panel: 0, x: 86, y: 30 }, region: 'panel', tail: { panel: 0, x: 63, y: 36 } },
      { type: 'mono', pref: { panel: 0, x: 22, y: 100 }, region: 'panel', place: 'below' }
    ]
  },
  83: {
    note: '휴대폰 메시지 화면(U10) · 말풍선 2개만 크게 · 첫 문장 잘림 금지',
    zones: [
      { panel: 0, x: 0, y: 88, w: 100, h: 12, label: '엄지 두 개', approved: false }
    ],
    screen: {
      panel: 0, x: 4, y: 3, w: 92, h: 85, approved: false,
      title: '권해인 쌤',
      messages: [
        { me: true, time: '19:20', text: '해인쌤, 몸은 좀 괜찮으세요? 휴대폰은 효은쌤께 드렸어요.' },
        { me: false, keepFirst: true, time: '19:36', text: '승민쌤, 저 해인이에요. 휴대폰 잘 받았어요. 몸이 안 좋아서 당분간 쉬려고 해요. 휴직도 생각 중이에요. 걱정해 주셔서 감사해요.' }
      ]
    },
    lines: []
  }
  }
};
