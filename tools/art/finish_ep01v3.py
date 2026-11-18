#!/usr/bin/env python3
"""EP01 104컷 마감 — 대체 원화 14개 항목을 콘티의 연기·상황에 맞게 다시 만든다.

외부 이미지 생성 없음. 기존 원화는 읽기만 하고, 결과는 새 파일 `ep01v3-NNN-final-DRAFT.webp` 로 쓴다.
  - 인물 연기를 바꾸는 손그림: tools/art/finish_lib.py (예: 감은 눈)
  - 장면(배경·소품·인물 뒷모습·효과선): tools/art/scenes/cutNNN.html 을 Playwright 로 1080 폭 렌더 (render_scenes.js)
  python3 tools/art/finish_ep01v3.py 84 87 ...
"""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, 'tools/art')
from finish_lib import close_eye, tired_eye, mouth_down

CUT = 'assets/cuts/ep01v3/ep01v3-%s-DRAFT.webp'
OUT = 'assets/cuts/ep01v3/ep01v3-%s-final-DRAFT.webp'
def arr(im): return np.asarray(im.convert('RGB')).astype(np.float32) / 255
def img(a): return Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8), 'RGB')
def lum(a): return a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
def save(im, key):
    im = img(im) if isinstance(im, np.ndarray) else im
    im.save(OUT % key, 'WEBP', quality=90, method=6); print('wrote', OUT % key, im.size)

def eyes85():
    im = Image.open(CUT % '085').convert('RGB')
    kw = dict(skin_fill=True, lid_shade=0.92, feather=3.5)
    im = close_eye(im, (550, 280, 642, 314), inner=(632, 301), outer=(556, 297), sag=9, width=4.6, **kw)
    return close_eye(im, (708, 272, 824, 307), inner=(720, 294), outer=(814, 291), sag=9, width=4.6, **kw)

def cut84():
    """‘다행이다’ — 85컷의 승민이 문자를 읽고 눈을 감고 길게 숨을 내쉰다(감은 눈은 새로 그림). 휴대폰 화면은 꺼져 가는 어두운 유리."""
    im = eyes85()
    a = arr(im)
    # 휴대폰 빈 회색 화면 → 어두운 유리(위쪽에 옅은 반사)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    grey = (np.abs(r - g) < .035) & (np.abs(g - b) < .035) & (r > .40) & (r < .66)
    box = np.zeros_like(grey); box[330:770, 220:570] = True
    m = np.asarray(Image.fromarray(((grey & box) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)[..., None] / 255
    yy = np.linspace(0, 1, a.shape[0])[:, None, None]; xx = np.linspace(0, 1, a.shape[1])[None, :, None]
    glass = np.array([.10, .10, .13]) + .10 * np.clip(1 - (yy - .40) * 4 - (xx - .25) * 2, 0, 1) * np.array([1, .95, .9])
    a = a * (1 - m) + glass * m
    crop = img(a).crop((180, 0, 990, 810)).resize((1080, 1080), Image.LANCZOS)
    crop = crop.filter(ImageFilter.UnsharpMask(radius=1.4, percent=40, threshold=2))
    c = arr(crop) * np.array([1.03, 1.0, .95])           # 집 저녁(텅스텐)
    save(c, '084')

def cut87():
    """평온한 밤 — 소파 쿠션에 얼굴을 묻고 잠든 듯 눈을 감은 승민(90컷 그림에서 감은 눈을 새로 그림), 따뜻한 스탠드 빛, 베개 → 소파 쿠션 색."""
    im = Image.open(CUT % '090-a').convert('RGB')
    kw = dict(lash=(40, 30, 34), crease=(120, 96, 104), skin_fill=True, lid_shade=.93, feather=4)
    im = close_eye(im, (412, 376, 632, 488), inner=(620, 470), outer=(436, 408), sag=13, width=5.0, **kw)
    im = close_eye(im, (772, 516, 914, 576), inner=(782, 543), outer=(904, 551), sag=9, width=4.4, **kw)
    a = arr(im.crop((0, 230, 1080, 838)))
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; L = lum(a)
    # 베개(푸른 천) → 소파의 회갈색 패브릭: 밝기는 그대로, 색만
    pillow = np.clip((b - r - .05) / .05, 0, 1) * np.clip((.46 - L) / .05, 0, 1)   # 얼굴(밝고 덜 푸름)은 제외
    yy = np.linspace(0, 1, a.shape[0])[:, None]; xx = np.linspace(0, 1, a.shape[1])[None, :]
    pillow = pillow * (xx > .45) * (yy > .35)
    pillow = np.asarray(Image.fromarray((pillow * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
    fabric = L[..., None] * np.array([.86, .84, .82])
    a = a * (1 - pillow[..., None]) + fabric * pillow[..., None]
    # 푸른 밤빛 → 스탠드의 따뜻한 빛(왼쪽 위에서), 전체는 어둡게 유지
    warm = a * np.array([1.22, 1.02, .80])
    lamp = np.exp(-(((xx - .15) / .55) ** 2 + ((yy - .05) / .6) ** 2))[..., None]
    a = warm * (.78 + .32 * lamp) + lamp * np.array([.05, .03, .0])
    save(a, '087')

FN = {84: cut84}   # 87 은 이제 장면 HTML(cut087.html, 거실 소파 전신) — cut87() 은 이전 클로즈업 방식
def cut101():
    """‘듣고 계십니까?’ — 102컷과 같은 자리, 귀에 대던 휴대폰을 든 팔이 얼굴에서 떨어져 내려가는 순간(팔을 팔꿈치 축으로 돌려 새로 앉힘, prep_cut101.py).
    화면은 회백으로 바래 간다(소리가 멀어지는 느낌)."""
    im = Image.open('tools/art/scenes/parts/seungmin-102-armdown.png').convert('RGB').crop((360, 300, 1080, 1200)).resize((1080, 1350), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=45, threshold=2))
    a = arr(im); L = lum(a)[..., None]
    g = a * .62 + L * .38
    yy = np.linspace(0, 1, a.shape[0])[:, None, None]; xx = np.linspace(0, 1, a.shape[1])[None, :, None]
    fade = np.clip(np.sqrt((xx - .55) ** 2 + (yy - .38) ** 2) * 1.25 - .25, 0, 1) * .55   # 가장자리부터 하얗게 바램
    g = .08 + g * .9
    g = g * (1 - fade) + np.array([.86, .87, .90]) * fade
    save(g, '101')
FN[101] = cut101

def cut96():
    """확인 질문 — 97컷 승민의 입·턱·폰 쥔 손 클로즈업(마른 입술) + 오른쪽 아래 '신발장 모서리를 꽉 쥔 다른 손' 삽입 칸(102컷의 모서리를 짚은 손).
    두 그림 모두 기존 원화이며, 삽입 칸 구성은 콘티의 두 정보(입이 마름 / 모서리를 잡은 손)를 한 컷에 담기 위한 것."""
    src = Image.open(CUT % '097').convert('RGB')
    base = src.crop((184, 432, 702, 1080)).resize((1080, 1350), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
    a = arr(base); L = lum(a)[..., None]; a = .06 + (a * .72 + L * .28) * np.array([.92, .96, 1.03]) * .95
    base = img(a)
    hand = Image.open(CUT % '102-police-call-threshold').convert('RGB').crop((852, 1262, 1077, 1423)).resize((560, 400), Image.LANCZOS)
    hand = hand.filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))
    h = arr(hand); hL = lum(h)[..., None]; h = .05 + (h * .75 + hL * .25) * np.array([.94, .97, 1.03]) * .95
    hand = img(h)
    x0, y0 = 1080 - 560 - 36, 1350 - 400 - 40
    d = ImageDraw.Draw(base)
    d.rectangle([x0 - 10, y0 - 10, x0 + 570, y0 + 410], fill=(250, 250, 248))
    d.rectangle([x0 - 10, y0 - 10, x0 + 570, y0 + 410], outline=(40, 40, 46), width=3)
    base.paste(hand, (x0, y0))
    save(base, '096')
FN[96] = cut96

def cut95():
    """‘양평경찰서 문상윤 순경입니다’ — 현관에서 폰을 귀에 댄 승민(102컷 상반신을 4:3으로), 왼쪽 문 유리에 그 모습이 희미하게 얼비침(좌우 반전·청회색·흐림)."""
    src = Image.open(CUT % '102-police-call-threshold').convert('RGB')
    W, H = 1080, 810
    base = src.crop((300, 300, 1080, 885)).resize((W, H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=45, threshold=2))
    a = arr(base)
    xx = np.linspace(0, 1, W)[None, :, None]; yy = np.linspace(0, 1, H)[:, None, None]
    # 문 유리(왼쪽 40%): 어둡고 차가운 반사면 + 대각 반사 줄
    gm = np.clip((.40 - xx) / .06, 0, 1)
    glass = a * .45 * np.array([.8, .88, 1.0]) + np.array([.05, .06, .09])
    sheen = np.exp(-((xx - (.08 + yy * .25)) / .03) ** 2) * .12
    a = a * (1 - gm) + (glass + sheen) * gm
    refl = img(a).transpose(Image.FLIP_LEFT_RIGHT).filter(ImageFilter.GaussianBlur(4))   # 오른쪽의 승민이 유리에 비침
    r = arr(refl); rL = lum(r)[..., None]; r = (r * .3 + rL * .7) * np.array([.78, .88, 1.0])
    a = a * (1 - gm * .32) + r * gm * .32
    img_ = img(a); d = ImageDraw.Draw(img_)
    d.rectangle([int(W * .40) - 9, 0, int(W * .40) + 9, H], fill=(44, 46, 54))                  # 유리문 틀
    a = arr(img_); L = lum(a)[..., None]
    a = .05 + (a * .74 + L * .26) * np.array([.93, .97, 1.04]) * .96
    save(a, '095')
FN[95] = cut95

def cut69():
    """승민의 기억 — 어제 밤의 피곤한 얼굴: 61컷 승민의 윗눈꺼풀을 내려 무겁게 하고(새 눈꺼풀 선), 다크서클·눈 밑 주름, 처진 입꼬리를 더함. 차가운 낮빛.
    오른쪽 위 35컷 인셋은 데이터의 inset 으로 따로 얹힌다."""
    im = Image.open(CUT % '061').convert('RGB')
    im = tired_eye(im, old_top=[(604, 375), (618, 369), (634, 366), (652, 364), (668, 371)], new_top=[(604, 376), (620, 374), (638, 372), (655, 372), (669, 375)],
                   lower=[(611, 383), (630, 386), (650, 386), (666, 380)], skin_at=(640, 352), bag_alpha=.36)
    im = tired_eye(im, old_top=[(706, 362), (718, 359), (730, 357), (740, 360)], new_top=[(706, 364), (718, 364), (730, 363), (740, 364)],
                   lower=[(710, 375), (724, 377), (738, 374)], skin_at=(722, 348), bag_alpha=.36)
    im = mouth_down(im, (677, 484), (719, 474), length=5)
    c = im.crop((440, 230, 880, 670)).resize((1080, 1080), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.0, percent=60, threshold=2))   # 얼굴 클로즈업(콘티)
    a = arr(c); L = lum(a)[..., None]
    a = (a * .74 + L * .26) * np.array([.93, .98, 1.05])
    H, W = a.shape[:2]; vy = np.linspace(-1, 1, H)[:, None]; vx = np.linspace(-1, 1, W)[None, :]
    a = a * (1 - .25 * np.clip(vx ** 2 + vy ** 2 - .35, 0, 1))[..., None]
    save(a, '069')
FN[69] = cut69

def cut19c():
    """19컷 (다) — 늦은 밤, 교무실 창밖 운동장: 8컷의 교정 그림(교문·트랙·본관·은행나무)을 밤으로 바꾸고 운동장 조명은 꺼짐, 가로등 하나만.
    앞쪽은 불 꺼진 교무실 창틀·창턱(19 (가)(나)와 같은 공간, 더 어두움). 3:1 띠."""
    out = Image.open('tools/art/scenes/out/cut008-night.png').convert('RGB')    # 1080×608, 학생 없는 변형
    view = out.crop((0, 90, 1080, 450)).resize((1080, 360), Image.LANCZOS)
    a = arr(view); L = lum(a)[..., None]
    night = (a * .45 + L * .55) ** 1.35 * np.array([.30, .34, .52])            # 달빛 정도의 푸른 밤
    H, W = night.shape[:2]; yy = np.linspace(0, 1, H)[:, None, None]; xx = np.linspace(0, 1, W)[None, :, None]
    night = night + np.array([.01, .015, .04]) * (1 - yy)
    im = img(night); d = ImageDraw.Draw(im, 'RGBA')
    # 본관: 한 칸만 불 켜진 창(숙직실), 나머지는 꺼짐
    d.rectangle([700, 150, 716, 168], fill=(255, 214, 140, 210))
    # 운동장 끝 가로등 하나(나머지 조명 꺼짐) + 바닥에 번지는 빛
    glow = Image.new('L', (W, H), 0); gd = ImageDraw.Draw(glow); gd.ellipse([880, 220, 1000, 300], fill=150); gd.ellipse([905, 120, 945, 160], fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    g = np.asarray(glow).astype(np.float32)[..., None] / 255
    a = arr(im) + g * np.array([.55, .45, .30])
    im = img(a); d = ImageDraw.Draw(im, 'RGBA')
    d.line([(925, 140), (925, 300)], fill=(12, 14, 22, 255), width=5); d.ellipse([915, 132, 935, 146], fill=(255, 236, 190, 255))
    # 별 몇 개
    rnd = random.Random(19)
    for _ in range(40): x, y = rnd.randrange(W), rnd.randrange(0, 70); d.point((x, y), fill=(210, 215, 235, 200))
    # 유리 반사(교무실 안의 희미한 모니터 대기등)
    a = arr(im) + np.exp(-(((xx - .28) / .05) ** 2 + ((yy - .55) / .12) ** 2)) * np.array([.04, .06, .10])
    im = img(a); d = ImageDraw.Draw(im, 'RGBA')
    # 창틀(불 꺼진 실내 쪽, 거의 검정에 가까운 남회색): 세로 창살 3개, 가로대, 아래 창턱
    for x in (0, 350, 720, 1060):
        d.rectangle([x, 0, x + 22, H], fill=(22, 22, 30, 255)); d.line([(x + 21, 0), (x + 21, H)], fill=(60, 62, 78, 255), width=2)
    d.rectangle([0, 0, W, 14], fill=(22, 22, 30, 255))
    d.rectangle([0, 300, W, H], fill=(26, 25, 32, 255)); d.line([(0, 300), (W, 300)], fill=(70, 72, 88, 255), width=3)
    # 창턱 위 소품 실루엣(19(나)의 책상 소품과 같은 계열): 화분·서류 꽂이
    d.ellipse([90, 262, 150, 304], fill=(20, 20, 26, 255)); d.polygon([(100, 266), (120, 220), (140, 266)], fill=(18, 26, 22, 255))
    d.rectangle([520, 250, 600, 302], fill=(30, 30, 38, 255)); d.rectangle([530, 240, 545, 252], fill=(40, 40, 50, 255)); d.rectangle([555, 236, 570, 252], fill=(36, 38, 46, 255))
    im.save(OUT % '019-c'); print('wrote', OUT % '019-c', im.size)
FN[19] = cut19c

# 장면 HTML(tools/art/scenes/cutNNN.html)을 render.js 로 그린 PNG → 최종 WebP
SCENES = {2: '002', 8: '008', 10: '010', 17: '017', 87: '087', 89: '089', 91: '091', 93: '093'}
def scene(n):
    im = Image.open('tools/art/scenes/out/cut%s.png' % SCENES[n]).convert('RGB')
    save(im, SCENES[n])
for _n in SCENES: FN.setdefault(_n, (lambda k: (lambda: scene(k)))(_n))

if __name__ == '__main__':
    for n in sys.argv[1:] or FN: FN[int(n)]()
