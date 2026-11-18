#!/usr/bin/env python3
"""10컷용: 12컷 원화의 승민(분필 든 상반신)을 오려 낸다. 다각형 + 팔·머리 사이 칠판 녹색만 지움. 원화는 읽기만."""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
D = [(180,684),(185,580),(230,490),(240,480),(210,440),(175,415),(125,402),(118,390),(150,375),(170,365),(200,330),(215,318),(245,322),(265,330),(290,333),(300,350),(305,400),(315,450),(322,480),(345,478),(360,470),(365,420),(372,330),(380,260),(392,190),(400,150),(420,110),(470,78),(540,68),(610,85),(650,115),(680,160),(705,210),(725,260),(745,320),(765,380),(800,420),(837,450),(837,684)]
P = [(x / 0.9 + 150, y / 0.9) for x, y in D]
im = Image.open('assets/cuts/ep01v3/ep01v3-012-DRAFT.webp').convert('RGB'); a = np.asarray(im).astype(float)
m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon(P, fill=255); m = np.asarray(m).astype(float) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]
green = (g >= r) & (g > b) & (r < 130)
reg = np.zeros_like(m); reg[300:760, 300:640] = 1
m = m * (1 - green * reg)
mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
o = im.convert('RGBA'); o.putalpha(mi); o.crop((270, 60, 1080, 760)).save('tools/art/scenes/parts/seungmin-012-upper.png')
