# 공통 규칙 등록 안내 — 다른 모델·도구에서 쓰기

원본은 **`docs/EP01_PRODUCTION_RULES.md`** 하나다. 다른 도구에는 이 파일을 그대로 첨부하고, 아래 짧은 지침만 붙여 넣는다. 규칙을 고칠 때는 원본만 고친 뒤 각 도구의 첨부 파일을 새 버전으로 바꾼다. 붙여 넣은 문장 안에 규칙을 복사해 두지 않는 것은 내용이 어긋나지 않게 하기 위해서다.

| 도구 | 읽는 위치 | 등록 방법 |
|---|---|---|
| Claude Code | 저장소 루트 `CLAUDE.md` | 브랜치에 파일이 있으면 자동으로 읽는다(아래 "브랜치 적용" 참고) |
| Codex 등 코딩 에이전트 | 저장소 루트 `AGENTS.md` | 위와 같다 |
| Claude(일반 대화, Opus 등) | 프로젝트 지식 + 프로젝트 지침 | 규칙 문서를 프로젝트 파일로 올리고, 아래 지침을 프로젝트 지침 칸에 붙여 넣는다 |
| ChatGPT Work | 프로젝트(작업 공간)의 파일 + 지침 | 규칙 문서를 파일로 첨부하고, 아래 지침을 지침 칸에 붙여 넣는다 |

## 붙여 넣을 지침 (Claude 프로젝트·ChatGPT Work 공통)

```
《마지막 접속》 작업은 첨부한 「EP01_PRODUCTION_RULES.md」(제작 공통 규칙)를 따른다.
충돌하면 사용자의 최신 지시 → 공통 규칙 → 기존 문서 순서로 따르고, 충돌 내용을 알린다.
핵심: 2D 펜선·셀 채색(기준 원화 35·50·66컷) 유지 / 원화를 SVG·도형·아이콘으로 대체 금지 /
대사·말풍선·글자는 원화에 넣지 않음 / 승인 인물 외형 유지, 최기훈·서진석은 40대 남성 /
대사·시각·날짜·컷 순서 보존 / 휴대폰은 iPhone 17 일반형(승민 Black, 해인 Lavender),
메시지 모자이크·흐림·원문 창작 금지 / 오디오 재생 기능 추가 금지 /
EP01 104컷판만 대상, 70컷판 보존, main·gh-pages 변경과 배포 금지, EP02 금지 /
끝나지 않은 일은 완성이라고 보고하지 않는다.
```

ChatGPT Work에서 원화를 만들 때는 결과물을 저장소에 바로 넣지 않는다. 새 파일 이름(승인 전에는 `-DRAFT`)으로 전달하면, 코딩 에이전트가 독립 브랜치에서 연결하고 모바일 화면에서 비교 검수한다.

## 브랜치 적용 순서

`CLAUDE.md`·`AGENTS.md`는 **작업 중인 브랜치에 들어 있어야** 에이전트가 읽는다. 규칙 브랜치 `ep01-production-rules`는 새 문서 4개만 더한 커밋이라, 어느 작업 브랜치에 넣어도 충돌하지 않는다.

1. **기준 브랜치부터**(사용자 승인 후): `ep01-redesign-v3`에 `ep01-production-rules`를 병합한다. 이후 기준 브랜치에서 새로 만드는 브랜치는 자동으로 규칙을 갖는다.
2. **이미 진행 중인 병렬 브랜치**(예: `ep01-phone-ui-refactor`): 다른 브랜치와 병합하지 않는 원칙을 지키기 위해 **파일만 가져와** 문서 커밋을 하나 더한다.
   ```
   git fetch origin ep01-production-rules
   git switch ep01-phone-ui-refactor
   git checkout origin/ep01-production-rules -- CLAUDE.md AGENTS.md docs/EP01_PRODUCTION_RULES.md docs/EP01_RULES_REGISTRATION.md
   git commit -m "공통 제작 규칙 문서 추가"
   git push origin ep01-phone-ui-refactor
   ```
   나중에 그 브랜치를 기준 브랜치에 병합해도 같은 내용의 같은 파일이라 충돌하지 않는다. 규칙이 바뀌었다면 위 `checkout` 한 줄을 다시 실행한다.
3. **ChatGPT Work·Claude 프로젝트**: 규칙 문서를 새 버전으로 다시 첨부한다.
