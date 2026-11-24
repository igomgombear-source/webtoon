# Studio 2단계 통합 기록 (2026-11-24)

브랜치 `studio-integration-phase2-20261124` · 기준 `studio-bubbles-20261124`(`7b6f791`, `studio-core-20261123` `c192273` 포함)

## 원격 확인
| 브랜치 | 지시 커밋 | 원격 | 결과 |
|---|---|---|---|
| `studio-core-20261123` | `c192273` | `c192273` | 일치 |
| `studio-bubbles-20261124` | `7b6f791` | `7b6f791` | 일치 |
| `studio-cuts-art-20261124` | `6eab439` | **없음**(브랜치 39개·PR·포크 확인, GitHub API `No commit found for SHA: 6eab439`) | 미통합 — 사용자 결정: 가능한 부분 먼저 |

## 처리한 변경 요청
| 요청서 | 처리 |
|---|---|
| `requests/20261124-renderer-epsig-race.md` | 코어 `Frame.full()` 시작 시점 서명. 대사 모듈 임시 보정 제거(중복 작동 없음 확인) |
| `requests/20261124-core-minor.md` | `store.batch`, 모듈 이름 표시, `cut` 이벤트 `changed`, `sync()` Promise 정리 |
| `requests/20261124-bubbles-style.md` | 엔진 `manual.style`(모양·글꼴·글자/배경/테두리 색) + Studio UI |
| `requests/20261124-dialogue-align.md` | 엔진 `cut.lines[i].align` + 대사 패널 |
| Codex 요청서 | 브랜치가 원격에 없어 확인 불가 |

## 코어 추가(후속 모듈용)
- 새·복제 컷 규약: 컴파일된 컷 `sid`('c~xxxxx')·`no`(겹치지 않는 번호)·`from`(원본 컷 ID). `Frame.idOf/noOf`, `Studio.cutId/cutNo`, 새 컷 대사 줄 `sid` 자동 부여, 편집값·초기화·QA·썸네일이 컷 ID 로 동작. `store.copyCut` 으로 편집 승계. (시험 모듈로 검증 — 실제 복제 기능은 Codex 컷 구성 모듈)
- 컴파일 순서: `after:[모듈ID]` 위상 정렬 + 문제 검출(`renderer.compileOrder`), QA 패널 표시. 대사는 `after:['cuts']`.
- 공통 좌표 변환 `Studio.geom`(point·invert·rect·quad·poly) — 말풍선 꼬리·보호 영역에서 사용, 휴대폰·합성·인셋이 같은 함수를 쓴다.
- 보호 영역 연동 `Studio.modules.bubbles.transformZones(panelId, T)`.
- 엔진: `BubblesV4.config(no)`, `info()` 에 `style`·`align`.

## 검증
`node tools/studio/tests/run.js` 268항목 통과(core·bubbles·timeline·layout·regression 88 + bubbles-v3 60 + dialogue 53 + bubbles-style 35 + integration 32). 엔진 확장 후 편집 없는 99컷 HTML 이 이전 엔진(7b6f791)과 같음(320~768px). `tools/qa/v3.html?auto` FAIL 2 / WARN 0(89컷 승인 대기, 변화 없음). 말풍선 편집기 v2 그대로 통과.

## 미완성(Codex 2단계 B 필요)
- 원화 확대·축소·이동·자르기·회전·반전·밝기·대비·채도·흐림, 개별 패널 폭·가로 간격, 컷 순서·복제의 실제 UI·렌더러, 패널 제거 시 연결 해제 표시.
- 원화 변형에 따른 휴대폰 화면·합성 레이어·인셋 원본 영역 자동 연동(공통 변환 함수만 준비).
- 원화 + 말풍선 + 대사를 한 컷에 함께 적용하는 교차 검사 중 '원화' 부분, 컷 복제·순서 변경·패널 제거 후 연결 관계의 실제 기능 검사.
