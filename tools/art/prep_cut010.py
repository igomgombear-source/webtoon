#!/usr/bin/env python3
"""10컷 배경 준비: 음악실(밤) 배경 → 3학년 1반 교실(오후). 보면대 지우기, 칠판의 오선 지우기, 낮 조명. 원본은 읽기만."""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
im = Image.open('assets/backgrounds/musicroom/night-wide.jpg').convert('RGB')
a = np.asarray(im).astype(np.float32)
def hfill(box):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        l = a[y, x0 - 3:x0].mean(0); r = a[y, x1:x1 + 3].mean(0)
        for x in range(x0, x1):
            t = (x - x0) / max(1, x1 - x0 - 1); a[y, x] = l * (1 - t) + r * t
def vfill(box):
    x0, y0, x1, y1 = box
    for x in range(x0, x1):
        u = a[y0 - 3:y0, x].mean(0); d = a[y1:y1 + 3, x].mean(0)
        for y in range(y0, y1):
            t = (y - y0) / max(1, y1 - y0 - 1); a[y, x] = u * (1 - t) + d * t
# 보면대(머리·기둥·다리)
hfill((1228, 326, 1310, 452))   # 보면대(머리·기둥·다리·벽 그림자): 좌우 벽색으로 가로 보간
# 칠판 오선: 칠판 안쪽을 가로 방향으로 부드럽게(선만 사라지고 조명 번짐은 남음)
x0, y0, x1, y1 = 848, 190, 1224, 318
reg = a[y0:y1, x0:x1].copy()
k = 9; ker = np.ones(k) / k
sm = np.stack([np.apply_along_axis(lambda c: np.convolve(np.pad(c, k, mode='edge'), ker, 'same')[k:-k], 0, reg[..., ch]) for ch in range(3)], -1)
a[y0:y1, x0:x1] = sm
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB').crop((760, 90, 1536, 672))
b = np.asarray(img).astype(np.float32) / 255
# 밤 실내 → 가을 오후: 밝고 따뜻하게, 왼쪽(창 쪽)에서 들어오는 빛
H, W = b.shape[:2]; xx = np.linspace(0, 1, W)[None, :]; yy = np.linspace(0, 1, H)[:, None]
b = b * np.array([1.10, 1.08, 1.0]) + 0.05
b = b + np.clip(0.6 - xx, 0, 1)[..., None] * np.array([0.10, 0.08, 0.03])
img = Image.fromarray((np.clip(b, 0, 1) * 255).astype(np.uint8), 'RGB').resize((1080, 810), Image.LANCZOS)
img = img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=40, threshold=2))
img.save('tools/art/scenes/parts/classroom-afternoon.png'); print('ok', img.size)
