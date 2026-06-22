# 캐릭터 일러스트 재생성 프롬프트 — 「저택의 그림자」

1920년대 영국 런던 배경. 현재 일러와 같은 **애니메이션 상반신(3:4)** 결.
탐정·조수는 여성, 용의자는 컨셉에 맞춰 성별 혼합(클로드·밀러 남, 엠마 여, 해리스 노신사 남).

---

## 0. 공통 스타일 (모든 캐릭터 앞에 붙여 쓰기)

**Positive (공통 prefix):**
```
masterpiece, best quality, highly detailed anime illustration, soft cel shading, clean lineart,
1920s London period setting, upper body portrait, slight 3/4 angle facing viewer, 3:4 vertical,
muted vintage palette (sepia, gaslight amber, deep teal shadows), gentle rim light, expressive eyes,
```

**Negative (공통):**
```
photorealistic, 3d render, photograph, realistic, extra fingers, deformed hands, bad anatomy,
text, watermark, signature, logo, modern clothing, hoodie, smartphone, busy background, multiple people,
lowres, blurry, jpeg artifacts, extra limbs, cropped head
```

**배경 처리(중요 — 텍스트 프롬프트로는 '투명 배경'이 안 나옵니다):**
대부분의 생성기(SD·NovelAI·Midjourney 기본)는 프롬프트에 `transparent background`를 써도 알파(투명)를 못 만듭니다.
오히려 체커보드 무늬를 그려버리기도 하니 **그 문구는 빼세요.** 투명은 '생성 후 배경 제거' 단계로 처리합니다.

- **권장 절차: 단색 평면 배경으로 생성 → 배경 제거.** 프롬프트 끝에 이걸 붙이세요:
  ```
  flat plain solid background, single uniform color, no scenery, no props behind,
  even soft studio lighting, character cleanly separated from background, clear clean silhouette
  ```
  (배경색은 캐릭터와 안 겹치는 색으로 — 머리·옷이 어두우면 밝은 회색, 밝으면 연두 크로마)
- **배경 제거 방법(택1):**
  1. 웹 원클릭(무료, 1장씩): **remove.bg**, **pixlr.com**(배경 제거), **photoroom.com**
  2. **Photopea**(무료 브라우저 포토샵) → 매직 컷 / 개체 선택 후 배경 삭제
  3. **Stable Diffusion** 사용 시: **LayerDiffuse(LayerDiffusion)** 확장 = 진짜 RGBA 투명 애니 캐릭터를 바로 출력(가장 깔끔). 또는 `rembg` / ABG Remover 노드.
- 최종: **투명 PNG, 3:4**(예 768×1024 또는 기존과 같은 433×577), 허리~가슴 위주 상반신.
- 💡 배경 제거가 번거로우면 **단색 배경 그대로** `illust/raw/`에 넣어 주세요 — 제가 일괄로 배경 제거해 드릴 수 있습니다.

---

## 1. 비비안 — 탐정 (여성) · 테마색: 딥 틸 & 골드
냉철한 워커홀릭 명탐정. 차가운 미인, 꿰뚫는 눈빛, 감정을 드러내지 않는 기품.
```
a sharp-eyed beautiful woman in her late 20s, cold composed expression, intelligent piercing gaze,
slicked-back dark charcoal hair in a low bun with a few loose strands,
tailored 1920s detective attire: dark three-piece waistcoat over a white high-collar blouse,
a long deep-teal overcoat draped on the shoulders, thin cravat, leather gloves,
minimal jewelry, aura of detached brilliance, deep teal and gold theme
```

## 2. 릴리 — 조수 (여성) · 테마색: 소프트 로즈 & 크림
밝고 사랑스러운 가면 뒤에 읽히지 않는 그림자(진범 복선). 따뜻한 미소, 눈가에 옅은 음영.
```
a bright cheerful young woman in her early 20s, warm disarming smile, soft rounded features,
a faint unreadable shadow behind the eyes, light honey-auburn wavy bob with a ribbon,
1920s assistant/secretary outfit: cream blouse with a bow, knit cardigan or pinafore,
faint ink stains on fingertips, holding a small notebook, sweet but with a subtle glint,
soft rose and cream theme
```
> 연출 의도: 80%는 사랑스럽게, 20%만 서늘하게. 미소는 짓되 눈은 완전히 웃지 않도록.

## 3. 해리스 경 — 의뢰인·자산가 (남성, 노신사) · 테마색: 버건디 & 골드
품위 있고 약간 거만한 노신사, 사건으로 불안에 떪.
```
a distinguished wealthy elderly gentleman in his 60s, neatly combed white-grey hair and trimmed moustache,
dignified slightly pompous expression with an anxious undertone,
fine 1920s upper-class attire: dark tailored frock coat, silk waistcoat, pocket watch chain, cravat,
rain-damp shoulders, burgundy and gold theme
```

## 4. 클로드 — 해리스 경의 비서 (남성) · 테마색: 그레이그린 & 잉크블랙
**[진범]** 도박빚에 쫓기는 30대 초반 비서. 단정함 뒤의 절박함, 억지로 누른 불안.
```
a nervous young man in his early 30s, secretary, neat but tired appearance, slightly sunken anxious eyes,
forced composure hiding desperation, dark brown side-parted hair, round thin glasses,
modest 1920s clerk attire: buttoned vest over a white shirt with sleeve garters, a loosened tie,
a faint dark ink stain on his right hand, clutching a leather bag,
muted grey-green and ink-black theme
```
> 디테일: **오른손의 검은 잉크 얼룩**은 사건의 핵심 단서 — 살짝이라도 보이면 좋음.

## 5. 밀러 — 전속 마부 (남성) · 테마색: 어시 브라운 & 젖은 슬레이트
험상궂지만 악인은 아닌 중년 마부. 비에 흠뻑 젖은 모습.
```
a rough burly middle-aged coachman in his late 40s, weathered stern face, heavy brow, light scar,
gruff intimidating but not evil expression, short unkempt dark hair and stubble,
worker's 1920s attire: heavy rain-soaked greatcoat, leather gloves, a flat cap, mud-flecked,
broad shoulders, earthy brown and wet slate theme
```

## 6. 엠마 — 펍 〈블랙 도그〉 바텐더 (여성) · 테마색: 와인 레드 & 브라스
돈에 민감하고 경계심 강한 20대 중반 바텐더. 재빠른 눈, 방어적인 태도.
```
a sharp pretty barmaid in her mid 20s, guarded wary expression, quick darting eyes, slightly defensive,
wavy dark-red hair loosely tied up with strands falling,
1920s pub barmaid attire: rolled-up blouse sleeves, a waistcoat and apron, a few cheap brass accessories,
deep wine-red and brass theme
```

---

## 7. 파일명 & 게임 적용 방법

1. 각 캐릭터를 **3:4 PNG**로 생성(투명 배경 권장).
2. `illust/` 폴더에 아래 이름으로 저장:
   `vivian.png · lily.png · harris.png · claude.png · miller.png · emma.png`
3. 저장 후 알려주시면 제가 두 군데를 갱신해 바로 적용합니다(직접 하셔도 됨):
   - `illust/manifest.json`의 `portraits` 배열에 6개 이름 추가
   - `story/prologue.js`의 `cast` 안 `portrait:` 값을 각 이름으로 교체
     (현재: vivian→aria, lily→sakura, harris→empress, claude→justice, miller→strength, emma→cardista)

> ⚠️ 파일을 넣기 *전에* 매핑을 바꾸면 이미지가 404로 깨지니, **파일을 먼저 넣고** 매핑을 바꿉니다.
> 캐릭터별 표정 변형까지 만들면(평온/동요/절망 등) 무드 연출과 연동해 더 살릴 수 있습니다.
