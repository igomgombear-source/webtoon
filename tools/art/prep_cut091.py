#!/usr/bin/env python3
"""91컷 재료: 102컷과 같은 현관(같은 자리)에서, 한 짝만 신은 운동화·벗어 둔 한 짝·재킷 무릎 부분을 잘라 '신발을 신는 중'으로 쓴다.
바닥에 흩어진 학습지(102컷의 사건 뒤 상황)는 바닥색으로 지운다. 원화는 읽기만."""
import numpy as np
from PIL import Image, ImageFilter
im = Image.open('assets/cuts/ep01v3/ep01v3-102-police-call-threshold-DRAFT.webp').convert('RGB')
a = np.asarray(im).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]; L = (r * .299 + g * .587 + b * .114)
paper = (L > 92) & (np.abs(r - b) < 14)
reg = np.zeros(L.shape, bool); reg[1560:1660, 585:705] = True; reg[1700:1920, 580:1080] = True   # 운동화(흰 밑창·끈)는 건드리지 않음
paper &= reg
pm = Image.fromarray((paper * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
pm = np.asarray(pm) > 0
floor = np.array([70, 66, 76], np.float32)
# 바닥: 아래로 갈수록 살짝 어둡게
yy = np.arange(a.shape[0])[:, None, None]
fl = floor * (1.05 - (yy - 1540) / 1800)
a = np.where(pm[..., None], fl, a)
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB')
sm = img.filter(ImageFilter.GaussianBlur(2))
m = Image.fromarray((pm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
img = Image.composite(sm, img, m)
img.crop((376, 900, 1052, 1745)).resize((1080, 1350), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.3, percent=40, threshold=2)).save('tools/art/scenes/parts/entrance-shoes-102.png')
print('ok')
