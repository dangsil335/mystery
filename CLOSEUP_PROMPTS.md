# 사물 클로즈업(Close-up) 이미지 프롬프트

핫스팟을 누르면 그 사물이 **화면에 크게 클로즈업**되면서 단서 대사가 흐릅니다(역전재판·레이튼식). 엔진은 이미 연결돼 있어, **`clues/cu_<이름>.png`를 넣으면 자동으로 뜹니다.** 없으면 기존처럼 텍스트만 — 그러니 만드는 대로 하나씩 켜집니다.

> 📂 **폴더 규칙**: `illust/`=캐릭터 / `scenes/`=배경 / **`clues/`=단서 클로즈업(`cu_*.png`)** / **`docs/`=문서(전보 `telegram.png` 등)**

## 공통 규칙 (가장 중요)
- **모순/단서가 눈에 보여야 합니다.** 플레이어가 비비안의 대사를 읽기 *전에* 자기 눈으로 "어? 비 오는데 왜 안 젖었지?"를 먼저 잡아내는 게 이 연출의 핵심입니다. 각 항목의 **★결정적 디테일**을 반드시 화면에 또렷이 그려 주세요.
- **화풍**: 장소 배경과 같은 결의 **사실적·회화적 일러스트**(인물 일러의 애니풍 아님). 1920년대 어둑한 무드, 극적인 조명(스포트라이트가 사물에 떨어지는 느낌), **가장자리는 어둡게 비네팅**.
- **프레이밍 (중요)**: **사물 전체가 프레임 안에 들어오게** — 가장자리에 닿는 건 괜찮지만, "이게 뭔지" 못 알아볼 만큼 잘리면 안 됩니다(예: 만년필이면 펜촉까지 보여야 펜인 줄 압니다). 그러면서 **★결정적 디테일은 크고 또렷하게.** 약간 비스듬한 3/4 앵글이 사물도 다 보이고 입체감도 살아 좋습니다. 화면 중앙, 대략 **정사각~16:9**(가로형). 영문 프롬프트에 `the entire object fully within frame, nothing important cropped off`를 넣어 주세요.
- **배경 제거 불필요**(전체 그림 그대로). 파일명 **`cu_<이름>.png`**, **`clues/` 폴더**에 저장.
- **⚠️ AI 함정 2가지**:
  - **"빨강 + 젖음 = 피"로 그려짐.** 붉은 점토는 형광 빨강이 아니라 **벽돌색/테라코타의 칙칙한 흙**입니다. `matte earthy clay, NOT blood, NOT a glossy liquid, NOT a puddle`를 꼭 넣으세요.
  - **엉뚱한 사물·손·신발이 환각으로 끼어듦.** 단서 하나만 나오게 `single subject only, no people, no extra hands/shoes/objects`를 넣으세요.

---

## 1순위 — 추리 직결(꼭 있으면 좋은 핵심)

### `cu_pen.png` — 금제 루비 만년필 (피해품·중심 소재)
★결정적 디테일: **뚜껑에 새로 생긴 미세한 긁힘**, 뚜껑은 꽉 닫혀 잉크 한 방울 없음(진짜는 새지 않았다).
```
the entire ornate antique gold fountain pen shown in full on a dark mahogany desk,
BOTH the capped end (with a deep red ruby set into the cap) AND the gold nib visible within frame,
three-quarter angle, a single tiny fresh scratch on the cap clearly visible,
the entire object fully within frame nothing important cropped off,
1920s, dramatic warm spotlight, dark vignette edges, realistic painterly illustration
```

### `cu_gramophone.png` — 태엽식 최신형 축음기 (클로드의 트릭)
★결정적 디테일: **황동 태엽 손잡이 + 왁스 실린더**가 또렷이. (※붉은 점토 같은 흙은 넣지 마세요 — 아래 주의 참고)
```
a whole 1920s wind-up gramophone fully in frame (large flower horn, turntable, body),
composed so its brass crank handle and exposed wax recording cylinder are large and clearly readable,
the entire object fully within frame nothing important cropped off, polished brass catching dim light,
moody dark study, dramatic side lighting, vignette, realistic painterly illustration
```

### `cu_carbon.png` — 타자기 먹지 (검은 기름잉크)
★결정적 디테일: **두껍게 발린 순흑 기름잉크**, 손에 묻으면 안 지워질 듯한 질감. 쓰레기통 속.
```
the whole crumpled sheet of typewriter carbon paper sitting in a wastebasket, fully in frame,
thick glossy oily jet-black ink coating its surface, smudge-prone,
the entire object fully within frame nothing important cropped off,
dim 1920s office, hard directional light raking across the black sheen, vignette, painterly realism
```

### `cu_ledger.png` — 젖은 외상 장부 (엠마의 시간 트릭)
★결정적 디테일: **종이가 흠뻑 젖어 잉크 글씨가 번짐**(실내인데 젖었다는 모순).
```
the whole open pub tab ledger fully in frame, soaked with water, the handwritten ink entries
blurred and bleeding across the warped wet pages, droplets on the paper,
the entire object fully within frame nothing important cropped off,
dim indoor light, 1920s, vignette, realistic painterly illustration
```

### `cu_seat.png` — 비어 있던 마부석 (밀러)
★결정적 디테일: **가죽 시트 전체가 가장자리까지 고르게 젖음 — 사람이 앉아 가린 마른 자국이 전혀 없음.**
```
the whole luxury carriage driver's leather seat fully in frame, drenched evenly by rain,
the entire surface uniformly soaked and glistening with NO dry patch where a person
would have sat shielding it, the entire object fully within frame nothing important cropped off,
rain still falling, grey stormy 1920s street, vignette, painterly realism
```

### `cu_shoe.png` — 밀러의 구두 (흑토 ≠ 붉은점토)
★결정적 디테일: **구두엔 붉은 점토가 아니라 평범한 검은 흙**만 묻음(외투는 흠뻑 젖었는데).
```
a coachman's worn leather shoes (both shoes fully in frame) caked with ordinary dark-black mud
(clearly NOT reddish clay), wet trouser cuffs dripping above, cobblestones,
the entire object fully within frame nothing important cropped off,
grey rainy 1920s light, vignette, realistic painterly illustration
```

### `cu_cigarette.png` — 마른 담배꽁초 (클로드 알리바이)
★결정적 디테일: **폭우 속 야외 쓰레기통인데 꽁초 끝이 바싹 말라 있음**(빗물 한 방울 안 묻음).
```
looking down into a grimy wet alley rubbish bin (the bin opening fully in frame), among soaked refuse a single
cigarette butt sitting on top conspicuously bone-dry, its paper end crisp and unwet,
the dry butt large and clearly the focus, the whole scene within frame nothing important cropped off,
rain-soaked surroundings contrast, dim 1920s alley, vignette, realistic painterly illustration
```

---

## 2순위 — 있으면 더 풍성(천천히)

### `cu_clay.png` — 붉은 점토 지대 (흙이 동선을 증언)
★결정적 디테일: **마차가 서 있는 자리 땅이 벽돌빛(테라코타) 점토**, 바퀴 자국이 패임 — 회색 자갈과 확연히 다른 흙색. (※외바퀴 아님 = 마차에 붙은 채, 피·웅덩이 아님)
```
a parked horse-drawn hansom carriage seen from the side, its wheels and lower body standing on
a patch of terracotta brick-red clay earth — earthy, matte, dried packed mud (NOT blood, NOT a glossy
red liquid, NOT a puddle), fresh wheel ruts pressed into the red clay, the reddish clay clearly a
different colour from the grey wet cobblestones bordering it,
a COMPLETE carriage attached to its wheels (NOT a single detached wheel lying alone), no people, single subject,
the carriage within frame nothing important cropped off,
overcast rainy 1920s street, muted desaturated light, vignette, realistic painterly illustration
```

### `cu_claude_hand.png` — 클로드의 오른손 (기름때)
★결정적 디테일: **검지·중지에 검은 기름 얼룩**(먹지를 만진 손). 손 클로즈업.
```
a thin nervous man's whole right hand fully in frame, black oily ink stains smudged on the
index and middle fingers, fingers slightly trembling, the stained fingers large and clear,
the entire hand within frame nothing important cropped off, dim 1920s office light,
shallow focus, vignette, realistic painterly illustration
```

---

## 레드 헤링(거짓 단서) — 다른 용의자를 수상하게

### `cu_key.png` — 밀러의 저택 열쇠 꾸러미 (밀러 떡밥)
★결정적 디테일: **해리스가(家) 문장이 새겨진 묵직한 황동 열쇠 한 꾸러미** — "마부가 왜 주인집 열쇠를?"
```
a heavy bunch of old brass mansion keys on an iron ring, resting on a wet dark surface
(or in a coachman's grimy palm), each key bow stamped with an ornate aristocratic family crest,
the whole key ring fully in frame, single subject, no people's faces, no extra objects,
the entire object fully within frame nothing important cropped off,
overcast rainy 1920s street, muted desaturated light, vignette, realistic painterly illustration
```

### `cu_brass.png` — 엠마의 놋쇠 병따개 (엠마 떡밥, 금빛 허당)
★결정적 디테일: **금빛으로 번쩍이지만 사실은 값싼 놋쇠 병따개** (만년필 부품이 절대 아님).
```
a humble cheap brass bottle opener glinting gold-like in dim light, lying on a worn wooden pub counter,
clearly an ordinary brass bar tool (NOT real gold, NOT a fountain pen part), single subject,
the whole opener fully in frame, no people, no extra objects,
the entire object fully within frame nothing important cropped off,
warm dim 1920s pub interior light, vignette, realistic painterly illustration
```

---

## ⚠️ 주의 — 축음기에 "붉은 점토"는 넣지 마세요
제안 주신 예시 중 *"축음기 기어 틈새에 붉은 점토"* 디테일은 **현재 사건 해법과 충돌**합니다:
- 축음기 트릭의 범인은 **클로드**인데, 클로드의 흙은 **흑토**(펍 뒷골목)입니다. **붉은 점토는 마차·밀러 구역**이에요.
- 축음기에 붉은 점토를 묻히면 "마차에서 온 사람(밀러 쪽)"을 가리켜 추리가 어긋납니다.

그래서 `cu_gramophone`은 **태엽·실린더만 깔끔하게** 그리도록 했고, 흙 단서는 `cu_shoe`/`cu_clay`/`cu_ground`로 분리해 두었습니다. (원하시면 "축음기 태엽에 **검은 기름때**가 묻어 클로드 손과 일치" 같은 변형은 해법과 맞아 추가 가능 — 말씀 주세요.)

> 우선순위: **1순위 7장**이면 추리 절정 구간이 전부 클로즈업으로 살아납니다. 넣어 주시는 대로 자동 적용되고, 안 넣은 건 기존 텍스트로 그대로 굴러갑니다.
