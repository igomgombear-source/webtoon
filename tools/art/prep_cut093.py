#!/usr/bin/env python3
"""93컷 재료: 58컷 승민 옆얼굴의 눈을 놀라 크게 뜬 눈으로 새로 그리고(finish_lib.open_eye_profile), 머리·어깨를 오려 낸다. 원화는 읽기만."""
import sys; sys.path.insert(0, 'tools/art')
from finish_lib import open_eye_profile, cutout
from PIL import Image
im = Image.open('assets/cuts/ep01v3/ep01v3-058-DRAFT.webp').convert('RGB')
im = open_eye_profile(im, (352, 322, 408, 360), upper=[(357, 337), (368, 329), (383, 325), (396, 327), (405, 335)],
                      lower=[(364, 349), (380, 351), (394, 348), (403, 341)], iris=(395, 337), iris_r=7.2)
poly = [(0, 75), (70, 38), (160, 18), (250, 22), (330, 55), (360, 70), (430, 110), (478, 190), (486, 290), (470, 330), (448, 390), (430, 445), (418, 500), (400, 560), (340, 610), (290, 760), (0, 760)]
bg = [(520, 200), (560, 100), (470, 60), (520, 300), (540, 480), (500, 520), (470, 640), (560, 650), (440, 560)]
co = cutout(im, poly, bg, soft=0.07, hard=0.17, close=7, feather=1.0, core=31)
co.crop((0, 0, 560, 760)).save('tools/art/scenes/parts/seungmin-058-shock.png')
print('ok')
