# 인물

인물별 폴더 하나. 배경이 투명한 PNG 또는 WebP.

```
characters/<인물>/<자세>-<표정>.png
예) characters/seungmin/stand-worried.png
    characters/haein/sit-smile.png
```

- 인물 이름: `seungmin`, `haein`, `hyoeun`, `jinseok`, `gihun`, `sangyun`, `student`
- 날짜별 옷이 다르면 뒤에 붙입니다: `jinseok/stand-neutral-1101.png`
- 같은 인물의 그림은 같은 축척으로 만들어야 컷 데이터의 w 값이 일정하게 맞습니다.

## 중앙 목록 (data/characters.js)

컷 데이터는 인물 파일 경로를 직접 쓰지 않고 `@인물/이름` 으로 부릅니다 (예: `src: '@haein/sit-talk'`).
실제 파일 경로·원본 크기·제작 상태는 `data/characters.js` 한 곳에 있습니다.

- 그림 교체: 새 파일을 넣고 `data/characters.js` 의 `src`·`size`·`status` 만 바꿉니다.
- 같은 크기·같은 구도(머리 위치, 투명 여백)면 컷 좌표를 고치지 않아도 됩니다. 다르면 그 그림을 쓰는 컷의 `x`·`y`·`w` 를 다시 맞춥니다.
- 새 자세를 추가할 때도 이 목록에 먼저 등록합니다. 목록에 없는 이름은 불러오기 실패로 표시되어 검수 창(`missing=`)에 드러납니다.
