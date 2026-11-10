/* 조립 컷(compose) 계산 — 뷰어(js/app.js)와 내보내기 도구(tools/export.html)가 함께 쓴다.
 *
 * compose: {
 *   bg: 'assets/backgrounds/musicroom/night-wide.webp',   배경 (캔버스를 꽉 채움, 비율이 다르면 가운데 기준으로 잘림)
 *   canvasSize: { w: 900, h: 1200 },                       합성 캔버스 크기(px). 컷 비율이 이 값으로 고정된다
 *   layers: [                                              아래에서 위 순서로 겹침
 *     { src: 'assets/characters/seungmin/reading.png',     투명 PNG/WebP
 *       x: 20, y: 35, w: 60,                               모두 '캔버스 가로 폭'에 대한 % (왼쪽 위 모서리 기준)
 *       h: 40,            (선택) 높이도 가로 폭 기준 %. 없으면 그림 원본 비율
 *       flip: true,       (선택) 좌우 반전
 *       opacity: 0.8 }    (선택)
 *   ],
 *   export: 'assets/cuts/ep01/18.webp'                     (선택) 미리 합성해 내보낸 완성 컷
 * }
 */
(function () {
  'use strict';
  var W = window.WEBTOON = window.WEBTOON || { episodeData: {} };

  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }

  /* 캔버스 크기. 없으면 컷의 ratio(없으면 4:5)로 만든다 */
  function canvasSize(cut) {
    var c = (cut.compose && cut.compose.canvasSize) || {};
    if (num(c.w, 0) > 0 && num(c.h, 0) > 0) return { w: +c.w, h: +c.h };
    var p = String(cut.ratio || '4:5').split(':');
    var rw = num(p[0], 4) || 4, rh = num(p[1], 5) || 5;
    return { w: 1000, h: Math.round(1000 * rh / rw) };
  }

  /* 경로: 'assets/…', './', '/', http(s) 로 시작하면 그대로, 아니면 base 기준 */
  function resolve(path, base) {
    if (!path) return '';
    return /^(assets\/|\.|\/|https?:|data:|blob:)/.test(path) ? path : (base || '') + path;
  }

  /* 레이어의 CSS 위치. 가로 폭 기준 %를 컨테이너 높이 기준 %로 바꿔
   * 화면 폭이 달라져도 레이어의 상대 위치가 같게 유지된다. */
  function layerStyle(layer, size) {
    var k = size.w / size.h;          /* 가로 폭 1% = 높이의 k% */
    var s = 'left:' + num(layer.x, 0) + '%;' +
            'top:' + (num(layer.y, 0) * k) + '%;' +
            'width:' + num(layer.w, 100) + '%;';
    if (num(layer.h, 0) > 0) s += 'height:' + (num(layer.h, 0) * k) + '%;';
    if (layer.flip) s += 'transform:scaleX(-1);';
    if (layer.opacity != null) s += 'opacity:' + num(layer.opacity, 1) + ';';
    return s;
  }

  /* 내보내기용: 캔버스에 실제 픽셀로 그린다. 불러오지 못한 파일은 missing 으로 알려 준다 */
  function loadImg(src) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { ok(null); };
      im.src = src;
    });
  }
  function draw(canvas, cut, base) {
    var c = cut.compose || {}, size = canvasSize(cut);
    canvas.width = size.w; canvas.height = size.h;
    var g = canvas.getContext('2d');
    var list = [c.bg].concat((c.layers || []).map(function (l) { return l.src; }));
    return Promise.all(list.map(function (p) { return p ? loadImg(resolve(p, base)) : Promise.resolve(null); }))
      .then(function (imgs) {
        var missing = [];
        g.fillStyle = '#0d1015'; g.fillRect(0, 0, size.w, size.h);
        var bg = imgs[0];
        if (c.bg && !bg) missing.push(c.bg);
        if (bg) {                                   /* cover: 꽉 채우고 가운데 기준 */
          var r = Math.max(size.w / bg.naturalWidth, size.h / bg.naturalHeight);
          var bw = bg.naturalWidth * r, bh = bg.naturalHeight * r;
          g.drawImage(bg, (size.w - bw) / 2, (size.h - bh) / 2, bw, bh);
        }
        (c.layers || []).forEach(function (l, i) {
          var im = imgs[i + 1];
          if (!im) { missing.push(l.src); return; }
          var x = num(l.x, 0) / 100 * size.w, y = num(l.y, 0) / 100 * size.w;
          var w = num(l.w, 100) / 100 * size.w;
          var h = num(l.h, 0) > 0 ? num(l.h, 0) / 100 * size.w : w * im.naturalHeight / im.naturalWidth;
          g.save();
          g.globalAlpha = l.opacity != null ? num(l.opacity, 1) : 1;
          if (l.flip) { g.translate(x + w, y); g.scale(-1, 1); g.drawImage(im, 0, 0, w, h); }
          else g.drawImage(im, x, y, w, h);
          g.restore();
        });
        return { size: size, missing: missing };
      });
  }

  W.compose = { canvasSize: canvasSize, resolve: resolve, layerStyle: layerStyle, draw: draw };
})();
