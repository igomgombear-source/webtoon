"""EP01 104컷 마감용 그림 손질 도구 (Pillow·numpy만 사용, 외부 생성 없음).

close_eye(): 원화의 뜬 눈을 같은 피부 명암으로 덮고, 감은 눈의 속눈썹 선(곡선)과 쌍꺼풀 선을 새로 그린다.
"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def _arr(im): return np.asarray(im.convert('RGB')).astype(np.float32)

def close_eye(im, box, inner, outer, sag, lash=(48, 26, 20), crease=(150, 92, 72), width=3.2, lashes=4, protect=None, skin_fill=False, lid_shade=0.94, feather=2.2):
    """box: 덮을 눈 영역 (x0,y0,x1,y1). inner/outer: 감은 눈 선의 양 끝 (x,y). sag: 선이 아래로 처지는 정도(px, +면 아래로 볼록=편안히 감음).
    protect: (r,g,b)와 비슷한 머리카락 가닥은 다시 덮어 쓴다(가닥이 눈 위를 지나는 경우)."""
    a = _arr(im); H, W = a.shape[:2]
    x0, y0, x1, y1 = box
    out = a.copy()
    # 1) 눈 둘레 띠에서 '피부'만 골라(밝은 쪽 절반) 대표색을 잡고, 위는 눈꺼풀 그늘만큼 살짝 어둡게 세로 그라데이션으로 덮는다
    if skin_fill:
        ring = np.zeros((H, W), bool); ring[max(0, y0 - 14):y1 + 14, max(0, x0 - 14):x1 + 14] = True; ring[y0:y1, x0:x1] = False
        px = a[ring]; L = px @ np.array([0.299, 0.587, 0.114])
        sk = np.median(px[L >= np.percentile(L, 55)], axis=0)
        for y in range(y0, y1):
            t = (y - y0) / max(1, (y1 - y0 - 1))
            out[y, x0:x1] = sk * (lid_shade + (1 - lid_shade) * t)
    else:
      for x in range(x0, x1):
        top = np.median(a[max(0, y0 - 6):y0 - 1, x], axis=0)
        bot = np.median(a[y1 + 1:min(H, y1 + 6), x], axis=0)
        for y in range(y0, y1):
            t = (y - y0) / max(1, (y1 - y0 - 1))
            out[y, x] = top * (1 - t) + bot * t
    if False:
      pass
    # 위·아래 표본에 머리카락 가닥이 섞여 생기는 세로 줄무늬를 가로 방향 평균으로 없앤다
    k = 21; ker = np.ones(k) / k
    reg = out[y0:y1, max(0, x0 - k):min(W, x1 + k)]
    sm = np.stack([np.apply_along_axis(lambda r: np.convolve(r, ker, 'same'), 1, reg[..., c]) for c in range(3)], -1)
    out[y0:y1, x0:x1] = sm[:, (x0 - max(0, x0 - k)):(x0 - max(0, x0 - k)) + (x1 - x0)]
    # 가장자리를 타원으로 부드럽게 섞는다
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).ellipse([x0, y0, x1, y1], fill=255)
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(feather))).astype(np.float32)[..., None] / 255
    res = a * (1 - m) + out * m
    # 피부 결: 아주 약한 노이즈 대신 원래 피부의 밝기 변화를 0으로 → 평평한 면이 셀 채색과 어울린다
    img = Image.fromarray(np.clip(res, 0, 255).astype(np.uint8), 'RGB')
    # 2) 선: 4배로 그려서 줄여 부드러운 선
    S = 4
    pad = 30
    bx0, by0, bx1, by1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    patch = img.crop((bx0, by0, bx1, by1)).resize(((bx1 - bx0) * S, (by1 - by0) * S), Image.LANCZOS)
    d = ImageDraw.Draw(patch, 'RGBA')
    def P(p): return ((p[0] - bx0) * S, (p[1] - by0) * S)
    (ix, iy), (ox, oy) = inner, outer
    cx, cy = (ix + ox) / 2, (iy + oy) / 2 + sag
    pts = []
    N = 40
    for k in range(N + 1):
        t = k / N
        x = (1 - t) ** 2 * ix + 2 * (1 - t) * t * cx + t ** 2 * ox
        y = (1 - t) ** 2 * iy + 2 * (1 - t) * t * cy + t ** 2 * oy
        pts.append((x, y))
    # 선 굵기: 바깥쪽이 굵고 안쪽 끝은 가늘게
    for k in range(N):
        t = k / N
        wv = width * (0.35 + 0.65 * t) * S
        d.line([P(pts[k]), P(pts[k + 1])], fill=lash + (255,), width=max(1, int(round(wv))))
    # 바깥 끝 속눈썹 몇 가닥
    for j in range(lashes):
        t = 0.62 + j * 0.11
        k = min(N - 1, int(t * N)); (px, py) = pts[k]
        ang = math.radians(100 + j * 14) * (1 if ox < ix else -1)
        ln = (3.5 + j * 1.2)
        ex, ey = px + math.cos(ang) * ln * (1 if ox < ix else -1) * -1, py + math.sin(abs(ang)) * ln
        d.line([P((px, py)), P((ex, ey))], fill=lash + (230,), width=max(1, int(1.4 * S)))
    # 쌍꺼풀(위 주름) — 감은 선보다 위로 옅게
    cp = [(x, y - (y1 - y0) * 0.55) for (x, y) in pts[4:-6]]
    for k in range(len(cp) - 1):
        d.line([P(cp[k]), P(cp[k + 1])], fill=crease + (150,), width=max(1, int(1.3 * S)))
    patch = patch.resize((bx1 - bx0, by1 - by0), Image.LANCZOS)
    img.paste(patch, (bx0, by0))
    if protect is not None:   # 원래 머리카락 가닥 복원
        orig = _arr(im); cur = _arr(img)
        dist = np.sqrt(((orig - np.array(protect)) ** 2).sum(-1))
        hm = (dist < 38).astype(np.float32)
        box_m = np.zeros_like(hm); box_m[y0 - 2:y1 + 2, x0 - 2:x1 + 2] = 1
        # 눈 안의 어두운 홍채/속눈썹은 제외: 가닥은 위·아래로 이어지는 픽셀만 (세로로 긴 성분)
        hm = hm * box_m
        cur = cur * (1 - hm[..., None]) + orig * hm[..., None]
        img = Image.fromarray(np.clip(cur, 0, 255).astype(np.uint8), 'RGB')
    return img

def cutout(im, poly, bg_samples, soft=0.10, hard=0.22, feather=1.2, keep=None, close=0, core=0):
    """배경색 표본과의 색 거리로 인물을 오려 낸다(투명 PNG). poly: 인물이 들어 있는 대략의 다각형(바깥은 무조건 투명).
    bg_samples: 배경 위 좌표 목록. 거리 soft 이하 투명 → hard 이상 불투명. keep: 무조건 불투명으로 둘 다각형 목록(얼굴 안쪽 등)."""
    a = _arr(im) / 255.0; H, W = a.shape[:2]
    bgs = np.array([a[y, x] for (x, y) in bg_samples])
    d = np.min(np.sqrt(((a[:, :, None, :] - bgs[None, None, :, :]) ** 2).sum(-1)), axis=2)
    al = np.clip((d - soft) / (hard - soft), 0, 1)
    pm = Image.new('L', (W, H), 0); ImageDraw.Draw(pm).polygon(poly, fill=255)
    al = al * (np.asarray(pm).astype(np.float32) / 255)
    if core:   # 다각형 안쪽(윤곽에서 core px 이상 안)은 무조건 불투명 — 색 판정은 윤곽 근처에서만
        cm = pm.filter(ImageFilter.MinFilter(core | 1))
        al = np.maximum(al, np.asarray(cm).astype(np.float32) / 255)
    if keep:
        km = Image.new('L', (W, H), 0); dk = ImageDraw.Draw(km)
        for k in keep: dk.polygon(k, fill=255)
        al = np.maximum(al, np.asarray(km).astype(np.float32) / 255 * (np.asarray(pm) > 0))
    am = Image.fromarray((al * 255).astype(np.uint8), 'L')
    am = am.filter(ImageFilter.MedianFilter(3))
    if close:   # 머리카락 하이라이트처럼 배경과 비슷한 색 때문에 생긴 구멍 메우기(닫힘 연산), 바깥 윤곽은 다각형으로 제한
        am = am.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
        am = Image.fromarray(np.minimum(np.asarray(am), np.asarray(pm)).astype(np.uint8), 'L')
    am = am.filter(ImageFilter.GaussianBlur(feather))
    out = im.convert('RGBA'); out.putalpha(am)
    return out

def open_eye_profile(im, cover, upper, lower, iris, iris_r, lash=(44, 30, 28), iris_col=(92, 66, 50), skin_ring=14):
    """옆얼굴의 눈을 놀라 크게 뜬 눈으로 다시 그린다. cover: 원래 눈을 피부색으로 덮을 상자.
    upper/lower: 윗·아랫 눈꺼풀 선의 점 목록 (원화 좌표). iris: 홍채 중심, iris_r: 반지름(작을수록 놀란 표정)."""
    a = _arr(im); H, W = a.shape[:2]
    x0, y0, x1, y1 = cover
    ring = np.zeros((H, W), bool); ring[y0 - skin_ring:y1 + skin_ring, x0 - skin_ring:x1 + skin_ring] = True; ring[y0:y1, x0:x1] = False
    px = a[ring]; L = px @ np.array([.299, .587, .114]); sk = np.median(px[L >= np.percentile(L, 60)], axis=0)
    out = a.copy(); out[y0:y1, x0:x1] = sk
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).ellipse([x0, y0, x1, y1], fill=255)
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(3))).astype(np.float32)[..., None] / 255
    img = Image.fromarray(np.clip(a * (1 - m) + out * m, 0, 255).astype(np.uint8), 'RGB')
    S = 4; pad = 24
    bx0, by0, bx1, by1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    patch = img.crop((bx0, by0, bx1, by1)).resize(((bx1 - bx0) * S, (by1 - by0) * S), Image.LANCZOS)
    d = ImageDraw.Draw(patch, 'RGBA')
    P = lambda p: ((p[0] - bx0) * S, (p[1] - by0) * S)
    def smooth(pts, n=12):   # 점들을 잇는 부드러운 곡선(Catmull-Rom)
        pts = [pts[0]] + list(pts) + [pts[-1]]; out = []
        for i in range(1, len(pts) - 2):
            p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
            for k in range(n):
                t = k / n
                out.append(tuple(.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in (0, 1)))
        out.append(pts[-2]); return out
    upper = smooth(upper); lower = smooth(lower)
    eye = [P(p) for p in upper] + [P(p) for p in reversed(lower)]
    d.polygon(eye, fill=(232, 222, 216, 255))
    ix, iy = P(iris); r = iris_r * S
    iris_layer = Image.new('RGBA', patch.size, (0, 0, 0, 0)); di = ImageDraw.Draw(iris_layer)
    di.ellipse([ix - r, iy - r * 1.1, ix + r, iy + r * 1.1], fill=iris_col + (255,))
    di.ellipse([ix - r * .45, iy - r * .5, ix + r * .45, iy + r * .5], fill=(24, 16, 14, 255))
    di.ellipse([ix - r * .9, iy - r * .95, ix - r * .25, iy - r * .35], fill=(255, 255, 255, 230))
    em = Image.new('L', patch.size, 0); ImageDraw.Draw(em).polygon(eye, fill=255)
    patch.paste(iris_layer, (0, 0), Image.fromarray(np.minimum(np.asarray(iris_layer)[..., 3], np.asarray(em)).astype(np.uint8)))
    sh = Image.new('RGBA', patch.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).line([P(p) for p in upper], fill=(90, 60, 55, 120), width=int(S * 4))
    sh = sh.filter(ImageFilter.GaussianBlur(S * 1.5)); patch.paste(sh, (0, 6), Image.fromarray(np.minimum(np.asarray(sh)[..., 3], np.asarray(em)).astype(np.uint8)))
    d = ImageDraw.Draw(patch, 'RGBA')
    for k in range(len(upper) - 1):
        t = k / max(1, len(upper) - 2)
        d.line([P(upper[k]), P(upper[k + 1])], fill=lash + (255,), width=int(S * (2.0 + 2.2 * t)))
    for k in range(len(lower) - 1):
        d.line([P(lower[k]), P(lower[k + 1])], fill=(120, 80, 66, 200), width=int(S * 1.2))
    patch = patch.resize((bx1 - bx0, by1 - by0), Image.LANCZOS)
    img.paste(patch, (bx0, by0))
    return img

def _crv(pts, n=10):
    pts = [pts[0]] + list(pts) + [pts[-1]]; out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(n):
            t = k / n
            out.append(tuple(.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in (0, 1)))
    out.append(pts[-2]); return out

def tired_eye(im, old_top, new_top, lower, skin_at, lash=(46, 30, 28), bag=(120, 70, 80), bag_alpha=.30, lid_dark=.90):
    """피곤한 눈: 윗눈꺼풀을 new_top 까지 내려 눈동자 위를 덮고(무거운 눈꺼풀), 눈 밑에 다크서클·주름을 더한다.
    old_top: 원래 윗눈꺼풀 선(위쪽 경계로 쓸 점들), new_top: 내려온 눈꺼풀 선, lower: 아랫눈꺼풀 선, skin_at: 눈꺼풀 피부색을 딸 좌표."""
    a = _arr(im); H, W = a.shape[:2]
    sk = np.median(a[skin_at[1] - 2:skin_at[1] + 3, skin_at[0] - 2:skin_at[0] + 3].reshape(-1, 3), axis=0) * lid_dark
    S = 4
    xs = [p[0] for p in old_top + new_top + lower]; ys = [p[1] for p in old_top + new_top + lower]
    bx0, by0, bx1, by1 = int(min(xs)) - 16, int(min(ys)) - 16, int(max(xs)) + 16, int(max(ys)) + 22
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB')
    patch = img.crop((bx0, by0, bx1, by1)).resize(((bx1 - bx0) * S, (by1 - by0) * S), Image.LANCZOS)
    P = lambda p: ((p[0] - bx0) * S, (p[1] - by0) * S)
    ot = _crv(old_top); nt = _crv(new_top); lw = _crv(lower)
    # 1) 눈꺼풀 면: 원래 선 조금 위 ~ 새 선 사이
    lid = Image.new('L', patch.size, 0); dl = ImageDraw.Draw(lid)
    dl.polygon([P((x, y - 2.5)) for x, y in ot] + [P(p) for p in reversed(nt)], fill=255)
    lid = lid.filter(ImageFilter.GaussianBlur(S * .8))
    grad = Image.new('RGB', patch.size, tuple(int(v) for v in sk))
    # 눈꺼풀 아래쪽(새 선 가까이)은 살짝 그늘
    gd = ImageDraw.Draw(grad)
    for k, (x, y) in enumerate(nt[:-1]):
        gd.line([P((x, y - 3)), P(nt[k + 1])], fill=tuple(int(v * .86) for v in sk), width=int(S * 3))
    grad = grad.filter(ImageFilter.GaussianBlur(S * 1.2))
    patch.paste(grad, (0, 0), lid)
    d = ImageDraw.Draw(patch, 'RGBA')
    # 2) 새 윗눈꺼풀 선(바깥쪽이 굵음) + 원래 쌍꺼풀 자리에 옅은 주름선
    for k in range(len(nt) - 1):
        t = k / max(1, len(nt) - 2)
        d.line([P(nt[k]), P(nt[k + 1])], fill=lash + (255,), width=max(1, int(S * (1.6 + 2.0 * t))))
    for k in range(len(ot) - 1):
        d.line([P((ot[k][0], ot[k][1] - 3)), P((ot[k + 1][0], ot[k + 1][1] - 3))], fill=(150, 98, 84, 120), width=int(S * 1.1))
    # 3) 다크서클·눈 밑 주름
    bagl = Image.new('RGBA', patch.size, (0, 0, 0, 0)); db = ImageDraw.Draw(bagl)
    db.line([P((x, y + 4)) for x, y in lw], fill=bag + (int(255 * bag_alpha),), width=int(S * 6))
    bagl = bagl.filter(ImageFilter.GaussianBlur(S * 2.2))
    patch.alpha_composite(bagl) if patch.mode == 'RGBA' else patch.paste(bagl, (0, 0), bagl)
    d = ImageDraw.Draw(patch, 'RGBA')
    d.line([P((x, y + 7)) for x, y in lw[2:-3]], fill=(135, 85, 78, 110), width=int(S * 1.0))
    patch = patch.resize((bx1 - bx0, by1 - by0), Image.LANCZOS)
    img.paste(patch, (bx0, by0))
    return img

def mouth_down(im, left, right, length=5, col=(140, 82, 76), alpha=110):
    """입꼬리를 살짝 처지게: 양 끝에서 아래로 짧은 그늘 선."""
    img = im.copy(); S = 4
    for (x, y), sgn in ((left, -1), (right, 1)):
        bx0, by0 = int(x) - 12, int(y) - 8
        patch = img.crop((bx0, by0, bx0 + 24, by0 + 24)).resize((96, 96), Image.LANCZOS)
        d = ImageDraw.Draw(patch, 'RGBA')
        px, py = (x - bx0) * S, (y - by0) * S
        d.line([(px, py), (px + sgn * 1.5 * S, py + length * S)], fill=col + (alpha,), width=int(1.4 * S))
        img.paste(patch.resize((24, 24), Image.LANCZOS), (bx0, by0))
    return img
