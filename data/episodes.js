/*
 * 작품 정보와 회차 목록.
 * 새 회차를 추가하려면:
 *   1) data/ep02.js 를 만들고 (ep01.js 형식 그대로) WEBTOON.registerEpisode({...}) 로 등록
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
  episodes: [
    { id: 'ep01', no: 1, title: '마지막 부탁', ready: true, file: 'data/ep01.js' },
    { id: 'ep01v3', no: 1, title: '마지막 부탁 · 104컷 제작판(개발 중)', ready: true, file: 'data/ep01v3.js' },
    { id: 'ep02', no: 2, title: '', ready: false },
    { id: 'ep03', no: 3, title: '', ready: false },
    { id: 'ep04', no: 4, title: '', ready: false },
    { id: 'ep05', no: 5, title: '', ready: false },
    { id: 'ep06', no: 6, title: '', ready: false }
  ]
};
