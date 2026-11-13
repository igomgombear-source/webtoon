/* 말풍선 v4 시범 설정 — 18·33·50·62·83 컷만.
 * index.html?bubbles=v4#ep01v3 에서만 쓰인다. 기본 화면(#ep01v3)은 이 파일을 무시한다.
 *
 * zones : 말풍선이 덮으면 안 되는 영역 (패널 기준 %, x·y·w·h)
 *         approved:true  = 승인 원화에서 직접 잰 위치
 *         approved:false = 임시 컷이라 콘티 '그림' 설명으로 가정한 위치 (원화가 오면 다시 잼)
 * lines : 데이터의 대사 순서와 1:1. 대사 문장은 data/ep01v3.js 그대로 쓰고 여기서는 배치만 정한다.
 *         type   speech | offscreen | mono | phone | caption  (제작기준 v2 1-3)
 *         pref   제작기준 말풍선 위치 → 선호 지점 {panel, at} 또는 {panel, x, y}
 *         region 'panel'(그 조각 안) | 'row'(같은 줄의 조각들, 사이 여백 걸침 허용)
 *         tail   꼬리가 가리킬 화자 지점 {panel, x, y} (패널 밖 값이면 테두리 밖으로 나가는 꼬리)
 *         edge   true면 컷 위·아래 경계에 걸치는 자리도 후보
 */
window.EP01V3_BUBBLE_PILOT = {
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
    note: '위 1컷 + 아래 사선 2분할 · 말풍선은 각 조각 안 · 최대 2줄',
    maxLines: 2,
    zones: [
      { panel: 0, x: 44, y: 8, w: 22, h: 46, label: '해인 얼굴', approved: false },
      { panel: 0, x: 66, y: 34, w: 18, h: 30, label: '펼친 손바닥', approved: false },
      { panel: 0, x: 16, y: 74, w: 20, h: 22, label: '해인의 폰', approved: false },
      { panel: 1, x: 22, y: 52, w: 58, h: 42, label: '메모하는 손', approved: false },
      { panel: 2, x: 46, y: 22, w: 38, h: 50, label: '해인 옆얼굴', approved: false }
    ],
    lines: [
      { type: 'speech', pref: { panel: 0, x: 20, y: 18 }, region: 'panel', tail: { panel: 0, x: 54, y: 40 } },
      { type: 'speech', pref: { panel: 0, x: 22, y: 50 }, region: 'panel', tail: { panel: 0, x: 54, y: 40 } },
      { type: 'speech', pref: { panel: 1, at: 'in-tl' }, region: 'panel', tail: { panel: 1, x: 30, y: 104 } },
      { type: 'speech', pref: { panel: 2, at: 'in-tl' }, region: 'panel', tail: { panel: 2, x: 52, y: 54 } },
      { type: 'speech', pref: { panel: 2, at: 'in-br' }, region: 'panel', tail: { panel: 2, x: 52, y: 54 } }
    ]
  },
  50: {
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
};
