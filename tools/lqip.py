#!/usr/bin/env python3
"""원화 → 로드 전 바탕용 저해상도 미리보기(24px WEBP data URI) 출력.

  python3 tools/lqip.py assets/cuts/ep01v3/ep01v3-NNN-DRAFT.webp

출력 문자열을 data/ep01v3.js 의 해당 컷 `imageLqip` 에 넣는다(조각 컷은 조각 항목에).
원화 파일은 읽기만 하고 수정하지 않는다. 이 미리보기가 없으면 느린 회선에서 원화가
어두운 바탕 위로 서서히 나타나 승인본보다 어둡게 보인다(컷 50 사례).
Pillow 필요.
"""
import base64, io, sys
from PIL import Image

def lqip(path, width=24, quality=45):
    im = Image.open(path).convert('RGB')
    h = max(1, round(im.height * width / im.width))
    buf = io.BytesIO()
    im.resize((width, h), Image.LANCZOS).save(buf, 'WEBP', quality=quality)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    print(lqip(sys.argv[1]))
