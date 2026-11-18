#!/usr/bin/env python3
"""101컷: 102컷 승민의 '귀에 댄 휴대폰을 든 팔뚝·손'을 팔꿈치를 축으로 아래로 돌려, 통화 중 팔이 내려가는 순간을 만든다.
비는 자리(귀·뺨 옆)는 바로 왼쪽의 머리카락 결을 옮겨 채운다. 원화는 읽기만."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src = Image.open('assets/cuts/ep01v3/ep01v3-102-police-call-threshold-DRAFT.webp').convert('RGB')
W, H = src.size
# 팔뚝+손+휴대폰 다각형(원화 좌표)
arm = [(656, 612), (690, 600), (712, 612), (726, 660), (752, 700), (770, 735), (764, 778), (738, 795), (712, 800), (700, 830), (690, 870), (674, 905), (640, 912), (636, 870), (650, 820), (662, 760), (656, 700), (650, 650)]
elbow = (660, 905); ang = 30   # PIL 기준 반시계 → 손이 얼굴에서 떨어져 바깥·아래로
am = Image.new('L', (W, H), 0); ImageDraw.Draw(am).polygon(arm, fill=255); am = am.filter(ImageFilter.GaussianBlur(1.2))
armL = src.convert('RGBA'); armL.putalpha(am)
# 1) 비는 자리 채우기: 같은 높이의 왼쪽 머리카락(가로 -70px)을 옮겨 붙임
base = src.copy()
fillsrc = src.crop((470, 590, 640, 920))   # 손에서 떨어진 왼쪽 머리카락 결
hole = Image.new('L', (W, H), 0); ImageDraw.Draw(hole).polygon(arm, fill=255); hole = hole.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(4))
patch = Image.new('RGB', (W, H)); patch.paste(src, (0, 0)); patch.paste(fillsrc, (626, 590))
base = Image.composite(patch, base, hole)
# 2) 팔을 팔꿈치 축으로 회전해 다시 얹기
rot = armL.rotate(ang, center=elbow, resample=Image.BICUBIC)
out = base.convert('RGBA'); out.alpha_composite(rot)
out = out.convert('RGB')
out.save('tools/art/scenes/parts/seungmin-102-armdown.png'); print('ok')
