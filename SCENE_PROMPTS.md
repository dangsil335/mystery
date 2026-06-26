# 장소(배경) 일러스트 프롬프트 — 프롤로그

현재 상태:
- `scenes/study.png` — 사무소·인트로·추리·엔딩에 공용 (그럭저럭 맞음, 업그레이드 선택)
- `scenes/garden.png` — **거리에 쓰이는데 정원 그림이라 안 맞음** → 교체 필요(높음)
- 펍 뒷골목 — **이미지 없음**(CSS 그라데이션 폴백) → 새로 필요(높음)

→ **거리 / 펍 2장**이 우선, **사무소**는 선택 업그레이드. 인물 없는 **가로(16:9) 배경**, 캐릭터 일러와 같은 애니 결.

## 공통 스타일 (앞에 붙이기)
```
anime background art, soft painterly illustration, 1920s London, moody atmospheric lighting,
detailed environment, no people, no text, wide cinematic 16:9
```
배경은 투명 처리 불필요(꽉 찬 배경). 약간 어둡게(인물 입상이 위에 올라가므로).

## 1. 탐정 사무소 (선택 업그레이드) → `office.png`
```
cozy 1920s London private detective office interior at night, heavy rain streaking the tall window,
warm gaslight glow, wooden desk with a typewriter and a wind-up gramophone, bookshelves,
worn leather sofa, patterned rug, amber light and deep teal shadows
```

## 2. 베이커 가 거리 (우선) → `street.png`
```
a 1920s London street at night in heavy rain, wet cobblestones reflecting gas lamps,
rows of brick townhouses, a parked horse-drawn carriage, drifting fog,
gloomy blue-grey palette, lonely and moody
```

## 3. 펍 〈블랙 도그〉 뒷골목 (우선) → `pub-alley.png`
```
a dim narrow back alley behind an old London pub at night in the rain, brick walls,
a wooden back door with worn stairs, trash bins and crates, a single faint hanging lantern,
wet black ground with puddles, ominous deep shadows
```

## 4. 사무소 복도 (신규) → `hallway.png`
```
a dim 1920s building corridor at night, a dead gas wall-lamp (unlit), a heavy wooden lavatory door at the far end,
a narrow back staircase descending into shadow, faint wet footprints on worn floorboards,
cold gloomy darkness with a sliver of warm light from one doorway
```

## 5. 펍 〈블랙 도그〉 안 (신규) → `pub-interior.png`
```
inside a crowded 1920s London pub at night, warm dim lamplight, a worn wooden bar with taps and a chalk tab board,
patrons playing cards in a smoky corner, empty glasses, cozy but a little seedy,
amber and brown tones, rain blurred on the windows
```

## 6. 베이커 가 역 (신규) → `station.png`
```
a 1920s London train station platform at night in the rain, a departure board reading 16:30,
empty wet platform, a single steam train just departed leaving drifting steam, gas lamps,
iron pillars and arched roof, lonely melancholic blue-grey atmosphere
```

## 적용
1. 가로 16:9 PNG로 생성(예: 1600×900 이상).
2. `scenes/` 에 `office.png · street.png · pub-alley.png` 로 저장.
3. `scenes/` 에 저장. 신규 3곳은 코드의 `bg:` 값이 이미 `hallway`·`pub-interior`·`station`이라
   **그 파일명으로 넣으면 바로 적용**됩니다. 거리/펍골목/사무소는 알려주시면 `bg:` 값을 연결합니다
   (거리 `garden`→`street`, 펍골목 `wine-cellar`→`pub-alley`, 사무소 `study`→`office`),
   또는 기존 이름(`garden`/`wine-cellar`/`study`)으로 저장하면 코드 변경 없이 적용됩니다.

**현재 장소(6곳)와 bg 파일명:**
| 장소 | bg(파일명) | 상태 |
|---|---|---|
| 탐정 사무소 (인트로·조사·추리·엔딩) | `study.png` | 있음(선택 업그레이드 `office`) |
| 사무소 복도 | `hallway.png` | **없음 → 필요** |
| 베이커 가 거리 | `garden.png` | 있음(정원 그림=불일치 → `street`) |
| 펍 〈블랙 도그〉 뒷골목 | `wine-cellar.png` | **없음 → 필요** (`pub-alley`) |
| 펍 〈블랙 도그〉 안 | `pub-interior.png` | **없음 → 필요** |
| 베이커 가 역 | `station.png` | **없음 → 필요** |
