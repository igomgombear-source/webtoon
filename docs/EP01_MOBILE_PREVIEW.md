# EP01 104컷 모바일 비공개 미리보기 (GitHub Codespaces)

내 GitHub 계정으로 로그인한 사람만 볼 수 있다. 공개 배포가 아니며 `main`·`gh-pages`는 쓰지 않는다. 포트 공개 범위는 기본값인 **private**을 그대로 쓴다(공개로 바꾸지 말 것).

## 폰에서 처음 여는 순서 (갤럭시, 크롬)
1. 아래 링크를 누르고 GitHub에 로그인한다 → **Create codespace** (처음 한 번, 1~2분 걸린다).
   `https://codespaces.new/igomgombear-source/webtoon/tree/ep01-mobile-preview-codespaces?quickstart=1`
2. 코드 편집기 화면이 뜨면 아래 주소창에 쓰는 대신, 화면 하단/상단 메뉴의 **포트(Ports)** 탭에서 **8765** 줄의 지구본(🌐) 아이콘을 누른다. 새 탭에 웹툰이 열린다.
   - 포트 탭이 안 보이면: 편집기 메뉴(☰) → View → Terminal 을 열고 `cat ~/EP01_PREVIEW_LINKS.txt` 를 입력하면 주소가 나온다.
3. 열린 주소 뒤가 `/index.html#ep01v3` 이면 일반 감상용이다. 컷 번호·DRAFT 표시를 보려면 `/index.html?review=1#ep01v3`.

## 다음부터
- 폰 크롬에서 `github.com/codespaces` → 내 Codespace 선택 → 시작되면 위 2번과 같다. 주소는 `https://<codespace 이름>-8765.app.github.dev/index.html#ep01v3` 형식이고 즐겨찾기해 두면 편하다(Codespace가 켜져 있을 때만 열린다).
- 안 열리면 `github.com/codespaces`에서 Codespace가 **Available** 상태인지 확인하고, 필요하면 열어서 시작시킨다.
- 다 보면 `github.com/codespaces`에서 Codespace를 **Stop**(비용·시간 절약). 보는 동안 30분 정도 아무 조작이 없으면 자동 중지된다.

## 설정 설명
- `.devcontainer/devcontainer.json`: Python 이미지, 포트 8765 자동 전달, 시작 시 `start-preview.sh` 실행.
- `.devcontainer/start-preview.sh`: `python3 -m http.server 8765`로 저장소 루트를 서비스하고 주소를 `~/EP01_PREVIEW_LINKS.txt`에 적는다.
- 웹툰 코드·원화·대사는 이 설정과 무관하며 변경하지 않았다.
