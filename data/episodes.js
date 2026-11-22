/*
 * 작품 정보와 회차 목록.
 * 새 회차를 추가하려면:
 *   1) data/ep02.js 를 만들고 (ep01v3.js 형식 그대로) WEBTOON.registerEpisode({...}) 로 등록
 *   2) 아래 episodes 배열의 해당 회차에 ready: true, file: 'data/ep02.js' 를 넣는다
 *   3) 그림은 assets/episodes/ep02/ 에 넣는다
 */
window.WEBTOON = window.WEBTOON || { episodeData: {} };

WEBTOON.registerEpisode = function (ep) {
  WEBTOON.episodeData[ep.id] = ep;
};

WEBTOON.series = {
  title: '마지막 접속',
  genre: '미스터리 · 범죄 스릴러',
  status: '6화 완결 예정',
  aliases: { ep01: 'ep01v3' },   /* 옛 주소 → 정식판 (70컷 구판은 2026-11-22 제거) */
  start: 'ep01v3',   /* 주소에 회차가 없을 때 바로 시작할 회차(초기 화면 없이 1컷부터) */
  episodes: [
    { id: 'ep01v3', no: 1, title: '마지막 부탁 · 104컷 완성판', ready: true, file: 'data/ep01v3.js' },
    /* 2화: 본편 전까지 '공개 예정' 안내 화면. 문구는 아래 comingSoon 에서 바꾼다. 본편이 준비되면 ready: true, file: 'data/ep02.js' 를 넣고 comingSoon 을 지운다 */
    { id: 'ep02', no: 2, title: '', ready: false,
      comingSoon: { title: '2화', message: '12월 중 공개 예정', backLabel: '1화로 돌아가기' } },
    { id: 'ep03', no: 3, title: '', ready: false },
    { id: 'ep04', no: 4, title: '', ready: false },
    { id: 'ep05', no: 5, title: '', ready: false },
    { id: 'ep06', no: 6, title: '', ready: false }
  ]
};
