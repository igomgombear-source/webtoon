#!/usr/bin/env python3
"""87컷 재료: (1) 집 거실(저녁) 배경을 소파가 화면 가운데 오도록 16:9 로 자르고 늦은 밤 빛으로, (2) 85컷 승민(소파에서 폰을 든 머리·어깨·손)을 오려 냄.
조립은 tools/art/scenes/cut087.html (눕힌 인물 + 담요 SVG). 원화는 읽기만."""
import sys; sys.path.insert(0, 'tools/art')
import numpy as np
from PIL import Image, ImageFilter
from finish_lib import cutout
bg = Image.open('assets/backgrounds/home/evening-wide.webp').convert('RGB').crop((420, 520, 1120, 914)).resize((1080, 608), Image.LANCZOS)
a = np.asarray(bg).astype(np.float32) / 255
L = (a @ np.array([.299, .587, .114]))[..., None]
night = a ** 1.18 * np.array([.62, .62, .74])
lamp = np.clip((L - .58) / .3, 0, 1)
lamp = np.asarray(Image.fromarray((lamp[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32)[..., None] / 255
a = night * (1 - lamp) + a * lamp
H, W = a.shape[:2]; yy = np.linspace(0, 1, H)[:, None, None]; xx = np.linspace(0, 1, W)[None, :, None]
a = a + np.exp(-(((xx - .14) / .25) ** 2 + ((yy - .38) / .35) ** 2)) * np.array([.16, .10, .04])
Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save('tools/art/scenes/parts/livingroom-night.png')
import importlib.util
_s = importlib.util.spec_from_file_location('fin', 'tools/art/finish_ep01v3.py'); fin = importlib.util.module_from_spec(_s); _s.loader.exec_module(fin)
im = fin.eyes85()          # 85컷 승민, 눈을 감은 눈으로 새로 그린 것(84컷과 같은 손질)
_a = np.asarray(im).astype(np.float32)
_g = (np.abs(_a[..., 0] - _a[..., 1]) < 9) & (np.abs(_a[..., 1] - _a[..., 2]) < 9) & (_a[..., 0] > 100) & (_a[..., 0] < 170)
_b = np.zeros(_g.shape, bool); _b[330:770, 220:570] = True
_m = (_g & _b)[..., None]
_a = np.where(_m, np.array([26, 26, 33], np.float32), _a)        # 휴대폰 화면 꺼짐
im = Image.fromarray(_a.astype(np.uint8), 'RGB')
poly = [(415, 0), (1080, 0), (1080, 810), (300, 810), (238, 650), (240, 380), (330, 345), (420, 330), (410, 150)]
bgs = [(100, 120), (200, 300), (150, 500), (60, 700), (380, 120), (350, 250), (300, 60)]
co = cutout(im, poly, bgs, soft=.06, hard=.16, close=7, feather=1.0, core=41)
# 원화 테두리에서 잘린 머리카락·몸이 직선으로 끊기지 않도록 위·오른쪽·아래 가장자리를 부드럽게 사라지게
A = np.asarray(co).astype(np.float32)
Hh, Ww = A.shape[:2]; yy = np.arange(Hh)[:, None]; xx = np.arange(Ww)[None, :]
f = np.clip(yy / 110, 0, 1) * np.clip((Ww - xx) / 150, 0, 1) * np.clip((Hh - yy) / 120, 0, 1)
A[..., 3] *= f
Image.fromarray(A.astype(np.uint8), 'RGBA').save('tools/art/scenes/parts/seungmin-085-sofa.png'); print('ok')
