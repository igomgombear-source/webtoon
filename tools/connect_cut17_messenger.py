#!/usr/bin/env python3
"""17컷 승인 원화(메신저 공지)를 데이터에 연결한다. 원화가 저장소에 들어온 뒤에만 실행.

  1) 승인 원화를 assets/cuts/ep01v3/ep01v3-017-messenger-approved-DRAFT.webp 로 넣는다(새 파일, 기존 원화는 건드리지 않음)
  2) python3 tools/connect_cut17_messenger.py --dry-run   # 바뀔 내용만 출력
  3) python3 tools/connect_cut17_messenger.py             # 적용

바꾸는 것은 딱 두 곳이다.
  - data/ep01v3.js 17컷의 image · imageSize · imageLqip (그리고 비율이 다르면 중단)
  - tools/qa/v3.js 의 승인 이미지 허용 목록에 `017-messenger-approved` 한 항목 추가
말풍선·대사·다른 컷은 건드리지 않는다. 적용 뒤 `python3 -m http.server 8765` → tools/qa/v3.html?auto 로 검수하고,
모바일 폭에서 기준 원화(35·50·66)와 나란히 비교한 뒤 사용자 승인을 받는다. Pillow 필요.
"""
import os, re, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from lqip import lqip

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAME = 'ep01v3-017-messenger-approved-DRAFT.webp'
PATH = os.path.join(ROOT, 'assets/cuts/ep01v3', NAME)
DATA = os.path.join(ROOT, 'data/ep01v3.js')
QA = os.path.join(ROOT, 'tools/qa/v3.js')
dry = '--dry-run' in sys.argv

if not os.path.isfile(PATH):
    sys.exit('승인 원화가 아직 없습니다: assets/cuts/ep01v3/' + NAME + '\n임의 이미지로 대체하지 말고, 파일이 들어온 뒤 다시 실행하세요.')
im = Image.open(PATH)
w, h = im.size
if im.format != 'WEBP':
    sys.exit('WEBP 가 아닙니다: ' + str(im.format))
if abs(w / h - 4 / 3) > 0.02:
    sys.exit('비율 %dx%d (%.3f) 가 현재 17컷 비율 4:3 과 다릅니다. 컷 ratio·width 변경은 사용자 확인이 필요합니다. 중단.' % (w, h, w / h))

src = open(DATA, encoding='utf-8').read()
i = src.index('    {"no": 17,'); j = src.index('\n', i)
line = src[i:j]
line = re.sub(r'"image": "[^"]*"', '"image": "%s"' % NAME, line, count=1)
line = re.sub(r'"imageSize": \{[^}]*\}', '"imageSize": {"w": %d, "h": %d}' % (w, h), line, count=1)
line = re.sub(r'"imageLqip": "[^"]*"', '"imageLqip": "%s"' % lqip(PATH), line, count=1)
new = src[:i] + line + src[j:]

qa = open(QA, encoding='utf-8').read()
key = '|015-afternoon-staffroom'
if '017-messenger-approved' not in qa:
    assert qa.count(key) == 1
    qa = qa.replace(key, key + '|017-messenger-approved')

print('17컷 image →', NAME, '(%dx%d)' % (w, h))
if dry:
    print('dry-run: 파일을 쓰지 않았습니다.'); sys.exit(0)
open(DATA, 'w', encoding='utf-8').write(new)
open(QA, 'w', encoding='utf-8').write(qa)
print('적용 완료. 다음: 104컷 QA, 70컷 회귀 QA, 320~768px 시각 검수.')
