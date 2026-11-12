/*
 * 인물 공식 설정 — 사용자가 확정한 외형 정보만 적는다. 추측·임시 디자인은 넣지 않는다.
 *
 * 그림을 만들거나 검수할 때 기준으로 쓴다. 뷰어(index.html)는 이 파일을 쓰지 않는다.
 * tools/qa/qa.js 가 data/characters.js 의 그림 항목과 비교한다 (예: 안경 착용 설정인데 그림에 안경이 없으면 확인 항목).
 *
 * 항목
 *   name        이름
 *   id          그림 폴더 이름 (assets/characters/<id>/, data/characters.js 의 '<id>/…')
 *   height      키 (cm)
 *   age         나이 (확정된 경우만)
 *   build       체형
 *   hair        머리
 *   eyes        눈
 *   glasses     true 안경 착용 · false 안경 없음 · 없으면 미확정
 *   outfit      공식 의상 (확정된 경우만)
 *   confirmed   확정 날짜와 출처
 *
 * 값을 바꿀 때는 사용자 확정을 받은 뒤 confirmed 를 함께 고친다.
 */
window.WEBTOON = window.WEBTOON || { episodeData: {} };

WEBTOON.cast = {
  gihun: {
    name: '최기훈', id: 'gihun',
    height: 185, build: '마른 체형', hair: '스포츠머리', eyes: '작은 눈', glasses: false,
    confirmed: '2026-11-11 사용자 확정'
  },
  jinseok: {
    name: '서진석', id: 'jinseok',
    height: 175, age: '50대', glasses: true,
    confirmed: '2026-11-11 사용자 확정'
  },
  hyoeun: {
    name: '임효은', id: 'hyoeun',
    height: 161, glasses: true,
    hair: '낮게 묶은 머리',
    outfit: '블루그레이 짧은 재킷, 흰 셔츠, 검은 슬랙스, 교직원 명찰',
    confirmed: '2026-11-11 사용자 확정 (키·안경). 머리·의상은 같은 날 총괄 검수에서 승인된 공식 디자인'
  },
  haein: {
    name: '권해인', id: 'haein',
    height: 168, glasses: false,
    build: '살집이 조금 있는 자연스러운 체형',
    hair: '앞머리가 있는 긴 검은 생머리',
    confirmed: '2026-11-12 사용자 확정 및 실제 사진 참고'
  }
};
