#!/usr/bin/env python3
"""EP01 104컷 제작판 — 원화가 없는 컷을 '기존 배경·원화의 재활용 + 보정 + 도형 합성'으로 만든다.

외부 이미지 생성은 쓰지 않는다. 원본 파일은 읽기만 하고, 결과는 새 이름
`assets/cuts/ep01v3/ep01v3-NNN-composite-DRAFT.webp` 로만 쓴다(기존 원화 덮어쓰기 없음).

  python3 tools/art/derive_ep01v3.py 2 8 87      # 만들 컷 번호
필요: Pillow, numpy
"""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

BG = 'assets/backgrounds/'
OUT = 'assets/cuts/ep01v3/ep01v3-%03d-composite-DRAFT.webp'

def arr(im): return np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
def img(a): return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB')
def lum(a): return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114
def blur(m, r):
    """2D float mask → gaussian blur via PIL"""
    im = Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im).astype(np.float32) / 255.0
def blur3(a, r): return arr(img(a).filter(ImageFilter.GaussianBlur(r)))
def save(a, n, w, h):
    im = img(a) if isinstance(a, np.ndarray) else a
    if im.size != (w, h): im = im.resize((w, h), Image.LANCZOS)
    im.save(OUT % n, 'WEBP', quality=88, method=6)
    print('wrote', OUT % n, im.size)

def sky_mask(a, top_rows=6):
    """위에서부터 이어진 하늘(파랑·흰 구름) 영역"""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    L = lum(a)
    cand = ((b - r) > 0.03) | ((L > 0.78) & (np.abs(r - b) < 0.10))
    m = Image.fromarray((cand * 255).astype(np.uint8), 'L').copy()   # copy: 배열과 메모리를 공유하면 floodfill 이 적용되지 않음
    for x in range(0, m.width, 7):
        for y in range(top_rows):
            if m.getpixel((x, y)) == 255: ImageDraw.floodfill(m, (x, y), 128)
    return (np.asarray(m) == 128).astype(np.float32)

def night_sky(h, w, top=(0.035, 0.045, 0.11), bottom=(0.17, 0.16, 0.27), seed=3):
    t = np.linspace(0, 1, h)[:, None, None] ** 1.3
    s = np.array(top)[None, None, :] * (1 - t) + np.array(bottom)[None, None, :] * t
    s = np.repeat(s, w, axis=1)
    rnd = random.Random(seed)
    im = img(s); d = ImageDraw.Draw(im)
    for _ in range(int(w * h / 9000)):
        x, y = rnd.randrange(w), rnd.randrange(int(h * 0.75)); v = rnd.randint(150, 230)
        d.point((x, y), fill=(v, v, min(255, v + 15)))
    return arr(im)

# ---------- 2컷: 양평문화회관 외관, 밤 (3:4) ----------
# 원본(morning-exterior, 1664×936, 반전 전 좌표)에서 잰 창 영역과 창틀 위치
WIN = [
    # (x0, y0, x1, y1, 세로 창틀 x, 가로 창틀 y, 밝기)
    (505, 284, 1195, 456, [505, 548, 608, 705, 806, 888, 965, 1040, 1105, 1155, 1195], [284, 345, 400], 'upper'),
    (505, 532, 1195, 762, [505, 545, 610, 705, 760, 810, 895, 975, 1015, 1050, 1110, 1150, 1195], [532, 590, 762], 'lobby'),
    (1300, 352, 1388, 690, [1300, 1342, 1388], [352, 520, 690], 'side'),
]
def cut2():
    src = Image.open(BG + 'auditorium/morning-exterior.webp').convert('RGB')
    W0, H0 = src.size
    a0 = arr(src)
    sky = sky_mask(a0)
    # 밤 색: 어둡고 푸르게
    night = a0 ** 1.25 * np.array([0.25, 0.28, 0.40])
    im = img(night); d = ImageDraw.Draw(im, 'RGBA')
    glow = Image.new('L', (W0, H0), 0); gd = ImageDraw.Draw(glow)
    rnd = random.Random(5)
    for (x0, y0, x1, y1, vx, hy, kind) in WIN:
        # 창 칸마다 실내 불빛(위가 밝은 따뜻한 빛). 2층·옆 창은 칸마다 켜짐·꺼짐을 섞는다
        for i in range(len(vx) - 1):
            for j in range(len(hy) - 1):
                cx0, cx1, cy0, cy1 = vx[i], vx[i + 1], hy[j], hy[j + 1]
                lit = 1.0 if kind == 'lobby' else (rnd.choice([0.0, 0.55, 0.8, 0.9]))
                for yy in range(cy0, cy1):
                    t = (yy - cy0) / max(1, cy1 - cy0)
                    if lit:
                        c = (int(240 * (0.95 - 0.30 * t) * lit + 30 * (1 - lit)), int(172 * (0.95 - 0.34 * t) * lit + 34 * (1 - lit)), int(104 * (0.92 - 0.36 * t) * lit + 52 * (1 - lit)))
                    else:
                        c = (30, 34, 52)
                    d.line([cx0, yy, cx1, yy], fill=c + (255,))
                if lit: gd.rectangle([cx0, cy0, cx1, cy1], fill=int(255 * lit))
        if kind == 'lobby':   # 로비 안: 천장 조명 점과 옅은 실내 기둥
            for x in range(540, 1190, 70): d.ellipse([x - 9, y0 + 8, x + 9, y0 + 14], fill=(255, 246, 220, 255))
            for x in (650, 930, 1080): d.rectangle([x - 8, y0 + 60, x + 8, y1], fill=(170, 120, 78, 120))
        # 창틀
        for x in vx: d.line([x, y0, x, y1], fill=(36, 36, 44, 255), width=7)
        for y in hy: d.line([x0, y, x1, y], fill=(36, 36, 44, 255), width=7)
    # 캐노피 아래 매입등
    for x in range(560, 1180, 82): d.ellipse([x - 14, 520, x + 14, 527], fill=(255, 240, 210, 255)); gd.ellipse([x - 30, 515, x + 30, 545], fill=200)
    a = arr(im)
    g = np.asarray(glow).astype(np.float32) / 255.0
    # 불 켜진 유리에 원래 유리의 명암(반사된 나무·하늘 무늬)을 옅게 남겨 평평한 색 면이 되지 않게
    Lo = blur(lum(a0), 1.5)
    tex = (0.50 + 0.62 * Lo)[..., None]
    gi = np.clip(g * 1.0, 0, 1)[..., None]
    a = a * (1 - gi) + a * tex * gi
    warm = np.array([1.0, 0.72, 0.42])
    a = a + blur(g, 30)[..., None] * warm * 0.20 + blur(g, 8)[..., None] * warm * 0.08
    yy = np.arange(H0)[:, None] / H0; xx = np.arange(W0)[None, :] / W0
    spill = np.exp(-(((xx - 0.51) / 0.28) ** 2 + ((yy - 0.90) / 0.09) ** 2))[..., None] * warm * 0.26
    a = a + spill * (1 - sky[..., None])
    # 하늘 교체(밤)
    a = a * (1 - blur(sky, 1.2)[..., None]) + night_sky(H0, W0, seed=9) * blur(sky, 1.2)[..., None]
    # 강당과 같은 건물로 읽히지 않도록 좌우 반전 + 낮은 시점의 세로 구도
    src_n = ImageOps.mirror(img(a))
    cw = 880; cx = W0 - 850; x0 = max(0, min(W0 - cw, cx - cw // 2))
    W, H = 1080, 1440
    crop = src_n.crop((x0, 0, x0 + cw, H0)); sc = W / cw; ch = int(H0 * sc)
    crop = crop.resize((W, ch), Image.LANCZOS)
    canvas = img(night_sky(H, W, seed=9))
    canvas.paste(crop, (0, H - ch))
    # 위 하늘과 아래 하늘 이음새를 부드럽게: 이음 띠를 같은 하늘로 섞음
    ca = arr(canvas); top = H - ch
    sky_c = night_sky(H, W, seed=9)
    band = np.clip((np.arange(H) - top) / 60.0, 0, 1)[:, None, None]
    skyrow = ImageOps.mirror(img(np.zeros((1, 1, 3)))) if False else None
    m_full = np.zeros((H, W), np.float32)
    mcrop = np.asarray(Image.fromarray((blur(sky, 1.2) * 255).astype(np.uint8)).transpose(Image.FLIP_LEFT_RIGHT).crop((x0, 0, x0 + cw, H0)).resize((W, ch))).astype(np.float32) / 255
    m_full[:top] = 1; m_full[top:] = mcrop
    ca = ca * (1 - m_full[..., None]) + sky_c * m_full[..., None]
    im = img(ca); d = ImageDraw.Draw(im, 'RGBA')
    # 행사 현수막 틀(글자 없음): 캐노피 위 벽면, 조명에 옅게 비침
    by = top + int(ch * 0.505); bx0, bx1 = int(W * 0.24), int(W * 0.70)
    d.rectangle([bx0, by, bx1, by + 40], fill=(196, 186, 176, 150), outline=(48, 46, 54, 230), width=3)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=35, threshold=2))
    a = arr(im)
    vy = np.linspace(-1, 1, H)[:, None]; vx_ = np.linspace(-1, 1, W)[None, :]
    a = a * (1 - 0.30 * np.clip(vx_ ** 2 + vy ** 2 - 0.30, 0, 1))[..., None]
    save(a, 2, W, H)

# ---------- 8컷: 양평중학교 오후 (16:9) ----------
def cut8():
    src = Image.open(BG + 'auditorium/morning-exterior.webp').convert('RGB')   # 양평중학교 강당 외관(43컷 강당과 같은 학교)
    a = arr(src.resize((1080, 608), Image.LANCZOS))
    H, W = a.shape[:2]
    yy = np.linspace(0, 1, H)[:, None]; xx = np.linspace(0, 1, W)[None, :]
    # 가을 오후: 따뜻하게, 대비 약간 낮추고 왼쪽 위에서 낮은 해
    warm = a * np.array([1.06, 1.0, 0.88]) + np.array([0.02, 0.012, -0.01])
    sun = np.exp(-(((xx - 0.05) / 0.55) ** 2 + ((yy - 0.0) / 0.55) ** 2))[..., None] * np.array([0.16, 0.10, 0.03])
    out = warm * 0.94 + 0.03 + sun
    # 떨어지는 단풍잎 몇 장 (작게)
    im = img(out); d = ImageDraw.Draw(im, 'RGBA'); rnd = random.Random(11)
    for _ in range(14):
        x, y = rnd.randrange(60, W - 20), rnd.randrange(20, int(H * 0.8)); s = rnd.uniform(3, 6); ang = rnd.uniform(0, math.pi)
        pts = [(x + s * math.cos(ang + t * math.pi / 2) * (1.0 if t % 2 == 0 else 0.45), y + s * math.sin(ang + t * math.pi / 2) * (1.0 if t % 2 == 0 else 0.45)) for t in range(4)]
        d.polygon(pts, fill=(rnd.randint(200, 235), rnd.randint(90, 130), 40, 200))
    save(im, 8, 1080, 608)

# ---------- 87컷: 평온한 밤 (16:9) ----------
def cut87():
    src = Image.open(BG + 'home/evening-wide.webp').convert('RGB')     # 승민의 집 거실(81컷 이후 집 장면과 같은 배경)
    W0, H0 = src.size
    ch = int(W0 * 608 / 1080); y0 = int(H0 * 0.40)
    a = arr(src.crop((0, y0, W0, y0 + ch)).resize((1080, 608), Image.LANCZOS))
    H, W = a.shape[:2]
    yy = np.linspace(0, 1, H)[:, None]; xx = np.linspace(0, 1, W)[None, :]
    L = lum(a)
    # 늦은 밤: 전체를 낮추고 푸르게, 스탠드 쪽 따뜻한 빛만 남김
    night = a ** 1.2 * np.array([0.42, 0.45, 0.60])
    lamp = np.clip((L - 0.62) / 0.3, 0, 1)
    lamp = blur(lamp, 3)[..., None]
    out = night * (1 - lamp) + a * lamp
    halo = np.exp(-(((xx - 0.30) / 0.22) ** 2 + ((yy - 0.38) / 0.30) ** 2))[..., None] * np.array([0.20, 0.13, 0.05])
    out = out + halo
    # 소파 방석 위에 엎어 둔 휴대폰(뒷면, 승민이 방금 내려놓은 자리) — 작은 그림자 + 테두리 하이라이트
    im = img(out); d = ImageDraw.Draw(im, 'RGBA')
    cx, cy, ang = W * 0.80, H * 0.455, -0.32
    def quad(hw, hh, ox=0.0, oy=0.0):
        c, s_ = math.cos(ang), math.sin(ang)
        return [(cx + ox + x * c - y * s_ * 0.45, cy + oy + x * s_ * 0.45 + y * c * 0.45) for x, y in ((-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh))]
    d.polygon(quad(40, 20, 5, 6), fill=(20, 16, 14, 90))
    d.polygon(quad(38, 18), fill=(52, 50, 60, 255))
    d.polygon(quad(35, 15), fill=(70, 68, 82, 255))
    d.line(quad(38, 18)[:2], fill=(150, 146, 160, 180), width=2)
    d.ellipse([cx - 26, cy - 9, cx - 18, cy - 4], fill=(30, 30, 36, 255))
    save(im, 87, 1080, 608)

FN = {2: cut2, 8: cut8, 87: cut87}
# ---------- 공통: 기존 원화의 일부를 다시 쓰는 컷(재구도 + 장면 조명) ----------
CUT = 'assets/cuts/ep01v3/ep01v3-%s-DRAFT.webp'
def grade(a, mood):
    L = lum(a)[..., None]
    if mood == 'frost':   # 차가운 낮, 채도 낮춤
        g = a * 0.75 + L * 0.25; return g * np.array([0.93, 0.98, 1.06])
    if mood == 'hush':    # 월요일 아침 현관: 창백, 검정이 들뜸
        g = a * 0.72 + L * 0.28; return 0.06 + g * np.array([0.92, 0.96, 1.03]) * 0.95
    if mood == 'void':    # 회백으로 바래 감
        g = a * 0.55 + L * 0.45; return 0.16 + g * np.array([0.90, 0.92, 0.96]) * 0.84
    if mood == 'home':    # 집 저녁, 텅스텐
        return a * np.array([1.05, 0.98, 0.86])
    if mood == 'night':
        return a ** 1.25 * np.array([0.55, 0.58, 0.72])
    return a
def recrop(src_key, box, size, mood, n, extra=None):
    """box: 원본에 대한 비율 (x0, y0, x1, y1). size: (w, h)."""
    src = Image.open(CUT % src_key).convert('RGB'); W0, H0 = src.size
    x0, y0, x1, y1 = [int(round(v)) for v in (box[0] * W0, box[1] * H0, box[2] * W0, box[3] * H0)]
    tw, th = size
    # 비율 강제(가운데 기준으로 상자를 맞춤)
    want = tw / th; bw, bh = x1 - x0, y1 - y0
    if bw / bh > want: nb = int(bh * want); x0 += (bw - nb) // 2; x1 = x0 + nb
    else: nh = int(bw / want); y0 += (bh - nh) // 2; y1 = y0 + nh
    crop = src.crop((x0, y0, x1, y1)).resize(size, Image.LANCZOS)
    if crop.size[0] > (x1 - x0) * 1.2:   # 확대한 경우 윤곽을 살짝 세움
        crop = crop.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
    a = grade(arr(crop), mood)
    if extra: a = extra(a)
    print('  source', src_key, (x0, y0, x1, y1), '→', size, 'scale %.2f' % (size[0] / (x1 - x0)))
    save(a, n, *size)
def vignette(strength):
    def f(a):
        H, W = a.shape[:2]; vy = np.linspace(-1, 1, H)[:, None]; vx = np.linspace(-1, 1, W)[None, :]
        return a * (1 - strength * np.clip(vx ** 2 + vy ** 2 - 0.35, 0, 1))[..., None]
    return f

def cut69():   # 승민의 걱정스러운 클로즈업 — 61컷 승민 얼굴 재구도, 차가운 낮 (인셋 35컷은 데이터의 inset 으로 따로 얹힘)
    recrop('061', (0.30, 0.06, 0.86, 0.50), (1080, 1080), 'frost', 69, vignette(0.25))
def cut84():   # 소파에 기댄 승민 — 85컷 얼굴·소파 등받이 재구도(휴대폰은 빼고), 집 저녁. 85컷이 바로 뒤에 넓게 이어짐
    recrop('085', (0.36, 0.0, 0.92, 0.56), (1080, 1080), 'home', 84, vignette(0.35))
def cut93():   # 멈춘 승민 — 58컷 얼굴(폰을 내려다봄) 재구도, 창백한 아침
    recrop('058', (0.0, 0.03, 0.50, 0.43), (1080, 1080), 'hush', 93, vignette(0.2))
def cut95():   # 폰을 귀에 댄 승민 — 102컷 현관의 상반신 재구도(앉은 자세는 화면 밖), 창백한 아침
    recrop('102-police-call-threshold', (0.30, 0.13, 1.0, 0.43), (1080, 810), 'hush', 95)
def cut96():   # 입이 마르는 순간 — 97컷 입·턱·폰 쥔 손 재구도
    recrop('097', (0.12, 0.40, 0.70, 1.0), (1080, 1350), 'hush', 96)
def cut101():  # 듣고 있지만 팔이 내려가는 승민 — 102컷 상반신 재구도, 회백으로 바래 감
    recrop('102-police-call-threshold', (0.34, 0.12, 1.0, 0.58), (1080, 1350), 'void', 101)
def cut19c():  # 19컷 (다): 19:50(나)와 같은 자리, 모니터까지 꺼진 더 늦은 밤 — 같은 구도에서 빛만 바뀌는 시간 경과
    src = arr(Image.open(CUT % '019-b').convert('RGB'))
    L = lum(src); r, g, b = src[..., 0], src[..., 1], src[..., 2]
    x0, y0, x1, y1 = 411, 21, 651, 154                                       # 19-b 가운데 모니터 화면(밝기 경계로 잰 값)
    screen = np.zeros_like(L); screen[y0:y1, x0:x1] = 1
    yy = np.linspace(0, 1, src.shape[0])[:, None]
    off = (np.array([0.07, 0.075, 0.095]) + 0.05 * (1 - yy)[..., None])      # 꺼진 검은 화면(위쪽에 옅은 반사)
    a = src * (1 - screen[..., None]) + off * screen[..., None]
    glowzone = blur(screen, 60)[..., None]
    a = a * (1 - 0.55 * glowzone)                                            # 모니터 빛이 비추던 책상도 어둡게
    a = a ** 1.18 * np.array([0.62, 0.66, 0.82])
    im = img(a); W, H = im.size
    out = OUT.replace('-composite-DRAFT', '-c-composite-DRAFT') % 19
    im.save(out, 'WEBP', quality=88, method=6); print('wrote', out, im.size)

FN.update({69: cut69, 84: cut84, 93: cut93, 95: cut95, 96: cut96, 101: cut101, 19: cut19c})

def cut10():   # 3학년 1반 교실, 오후 5교시 — 교실 배경(음악실 배경의 창가·책상 쪽만 잘라 피아노·오선 칠판 제외)을 낮으로 바꿈. 인물 없음
    src = Image.open(BG + 'musicroom/night-wide.jpg').convert('RGB')
    a = arr(src.crop((0, 115, 600, 565)).resize((1080, 810), Image.LANCZOS))
    H, W = a.shape[:2]; L = lum(a); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    yy = np.linspace(0, 1, H)[:, None]; xx = np.linspace(0, 1, W)[None, :]
    # 창: 밤하늘이 비치던 푸른 유리 → 오후의 밝은 하늘 + 단풍 나무 실루엣
    win = ((b - r) > 0.04) & (yy < 0.62)
    win = blur(win.astype(np.float32), 1.0)
    sky = np.array([0.97, 0.92, 0.80]) * (1 - yy[..., None] * 0.35) + np.array([0.0, 0.0, 0.0])
    tree = np.clip((0.22 - L) / 0.22, 0, 1)[..., None]                      # 어둡던 나무 = 단풍 실루엣
    foliage = np.array([0.86, 0.58, 0.30]) * 0.85
    pane = sky * (1 - tree) + foliage * tree
    out = a * (1 - win[..., None]) + pane * win[..., None]
    # 실내: 밝고 따뜻하게, 창에서 들어오는 오후 햇살
    room = out * np.array([1.18, 1.10, 0.96]) + 0.04
    shaft = np.zeros((H, W), np.float32)
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    for k in range(4):
        x0 = 60 + k * 190
        d.polygon([(x0, 260), (x0 + 120, 260), (x0 + 520, H), (x0 + 300, H)], fill=70)
    shaft = np.asarray(im.filter(ImageFilter.GaussianBlur(40))).astype(np.float32) / 255.0
    room = room + shaft[..., None] * np.array([0.30, 0.22, 0.10])
    out = room * (1 - win[..., None]) + out * win[..., None]
    save(np.clip(out, 0, 1), 10, 1080, 810)

def cut89():   # 18:34 승민의 집 — 거실 배경(현관 쪽)을 저녁 식사 무렵의 주황 조명으로. 인물·부엌·전자레인지 시계(18:34) 없음
    src = Image.open(BG + 'home/evening-wide.webp').convert('RGB')        # 1120×1400 (4:5)
    a = arr(src.resize((1080, 1350), Image.LANCZOS))
    H, W = a.shape[:2]; yy = np.linspace(0, 1, H)[:, None]; xx = np.linspace(0, 1, W)[None, :]
    out = a * np.array([1.10, 0.92, 0.74]) + np.array([0.04, 0.015, 0.0])
    lamp = np.exp(-(((xx - 0.15) / 0.5) ** 2 + ((yy - 0.75) / 0.45) ** 2))[..., None] * np.array([0.20, 0.10, 0.02])
    out = out + lamp
    o = out
    save(o, 89, 1080, 1350)

def cut91():   # 11월 2일 월요일 07:48, 출근 직전 — 승민의 집 아침 배경을 현관 쪽으로 다시 잘라 창백한 아침 빛. 인물 없음
    src = Image.open(BG + 'home/morning-wide.webp').convert('RGB')        # 1120×1400
    a = arr(src.crop((0, 120, 820, 1145)).resize((1080, 1350), Image.LANCZOS))
    a = arr(img(a).filter(ImageFilter.UnsharpMask(radius=1.5, percent=45, threshold=2)))
    a = grade(a, 'hush')
    H, W = a.shape[:2]; yy = np.linspace(0, 1, H)[:, None]; xx = np.linspace(0, 1, W)[None, :]
    a = a + np.exp(-(((xx - 0.30) / 0.30) ** 2 + ((yy - 0.30) / 0.35) ** 2))[..., None] * np.array([0.08, 0.09, 0.11])
    save(a, 91, 1080, 1350)

FN.update({10: cut10, 89: cut89, 91: cut91})

if __name__ == '__main__':
    for n in (sys.argv[1:] or FN):
        FN[int(n)]()
