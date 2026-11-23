# EP01 검수판 GitHub Pages 배포 — 준비만 완료, 배포 보류 (2026-11-23)

**배포하지 않았다.** 이유와 대안은 아래. `official-pages`·`main` 은 수정하지 않았다.

## 왜 배포하지 않았나
- 공식 사이트는 `official-pages` 브랜치의 워크플로(`actions/upload-pages-artifact` + `deploy-pages`)가 만드는 **단일 Pages 배포본**이다. 이 방식은 배포할 때마다 사이트 전체를 교체하므로, 검수판 경로(`/review/`)만 따로 올릴 수 없고 공식 파일과 **한 아티팩트로 함께** 올려야 한다.
- 그러려면 `official-pages` 의 워크플로 자체를 고쳐 공식 배포 파이프라인을 다시 실행해야 한다(공식 사이트 내용은 같지만 배포 경로를 바꾸는 일). 사용자의 ‘기존 공식 사이트 변경 금지’와 충돌할 수 있어 승인 없이 하지 않았다.
- 이 환경에서는 Pages 설정(환경 브랜치 제한 등)을 조회할 수 없고 `github.io` 에도 접속할 수 없어, 배포 뒤 **공식 사이트 유지와 모바일·PC 접속을 확인할 수 없다.** 확인할 수 없는 상태로 공식 배포본을 교체하지 않았다.

## 준비된 것 (이 브랜치)
- `tools/package-review.js`: `node tools/package-review.js <출력폴더>` → `<출력폴더>/review/` 에 독립 사본(149개 파일, 약 15MB)과 두 페이지를 만든다. 원화·대사·연출은 소스 그대로 복사.
  - `review/index.html` → 99컷 + 컷 번호·desc (`?check=1` 자동)
  - `review/all.html` → 숨긴 컷 포함 104컷 + 컷 번호·desc (`?check=1&hidden=1` 자동)
  - 두 페이지 모두 `noindex, nofollow`.
- 로컬 확인(패키지 폴더를 `/review/` 로 서비스): 360px·1280px 모두 index 99컷·99라벨, all 104컷·104라벨, 깨진 이미지·404·콘솔 오류·가로 스크롤 없음.

## 배포하려면 (승인 후)
1. 검수 소스를 커밋 SHA 로 고정(현재 `ep01-cut70-integration-20261123` 계열 + 이 스크립트).
2. `official-pages` 의 워크플로 build 잡에서 공식 패키징 뒤, 업로드 전에 추가:
   ```yaml
   - uses: actions/checkout@v4
     with: { ref: <검수 소스 SHA>, path: review-src, persist-credentials: false }
   - run: node review-src/tools/package-review.js _site
   ```
   공식 파일이 그대로인지(`_site/index.html` 등) 비교하는 단언을 함께 둔다.
3. `official-pages` 에 push → 배포. 주소: `https://igomgombear-source.github.io/webtoon/review/` (99컷), `…/review/all.html` (104컷). 되돌리려면 위 두 단계를 제거하고 다시 push.

## 대안
- **A. 별도 저장소의 Pages**: 새 공개 저장소(예: `webtoon-review`)에 `review/` 결과만 올려 Pages 로 서비스 — 공식 사이트와 완전히 분리(권장). 저장소 생성은 사용자 권한 필요.
- **B. 기존 Codespaces 유지**: `?check=1` / `?check=1&hidden=1` (`docs/EP01_MOBILE_PREVIEW.md`).
- 공개 Pages 는 URL 을 아는 누구나 시안 원화를 볼 수 있다(noindex 는 검색 노출만 막음). 비공개가 필요하면 B 또는 접근 제한이 있는 호스팅.
