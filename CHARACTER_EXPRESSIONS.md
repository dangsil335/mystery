# 무드별 표정 · 자세 변화 일러 프롬프트

현재는 한 장의 기본 일러에 **무드(틴트·흔들림)**만 입힙니다. 여기에 **표정/자세가 다른 변형 일러**를 더하면, 대사의 `mood`에 따라 엔진이 그림을 바꿔 끼웁니다(이미지 넣어 주시면 제가 스왑 연결).

## 공통 규칙 (가장 중요)
각 변형은 **반드시 기존 일러와 같은 인물·같은 복장·같은 헤어·같은 화풍·같은 프레이밍**이어야 자연스럽게 교체됩니다. **표정과 상반신 자세만** 바꾸세요.
```
same character as the existing portrait, identical outfit, hairstyle, hair color and art style,
same anime illustration style and upper-body framing, only the facial expression and pose change,
```
- 배경: 기존과 동일하게 **단색 평면 배경**으로 뽑아 주시면 제가 `reprocess.py`로 투명 처리합니다(워터마크 있으면 `dewatermark.py`).
- 파일명: **`<id>_<무드>.png`** (예: `claude_fear.png`). `illust/raw/`에 넣어 주세요.

---

## 1. 비비안 (vivian) — 기본=냉정한 표정(이미 있음)
| 파일명 | 무드 | 표정·자세 프롬프트 |
|---|---|---|
| `vivian_sharp.png` | **확신(emphasis)** — 논파·지목 | `sharp narrowed eyes, intense piercing glare, chin slightly lowered, leaning forward a little, one hand raised as if pointing out a contradiction, cold confidence` |
| `vivian_soft.png` | **여운(soft)** — 릴리와의 따뜻한 순간 | `a faint, rare gentle expression, eyes softened, the ghost of a small smile, relaxed shoulders, quiet warmth she rarely shows` |

## 2. 릴리 (lily) — 기본=밝은 미소(이미 있음)
| 파일명 | 무드 | 표정·자세 프롬프트 |
|---|---|---|
| `lily_surprise.png` | **놀람(shock/fear)** — "어? 진짜로 왔네" | `wide surprised eyes, eyebrows raised, one hand lifted toward her mouth, leaning back slightly, startled but still cute` |
| `lily_sad.png` | **걱정(sad)** — "선생님이 다치는 게 싫어요" | `downcast worried eyes, soft frown, hands clasped at her chest, a tender pleading look` |
| `lily_calm.png` | **잔잔함(cold)** — 아주 드문 한순간 | `a calm, quiet, unreadable expression, the smile gone but not hostile — just still, eyes looking somewhere far away, serene` (※위협적이지 않게, '읽히지 않는 고요함'으로) |

## 3. 클로드 (claude) — 기본=불안한 비서(이미 있음)
| 파일명 | 무드 | 표정·자세 프롬프트 |
|---|---|---|
| `claude_fear.png` | **불안(fear/shock)** — 추궁당할 때 | `cold sweat on his brow, darting frightened eyes, stiff hunched shoulders, clutching his bag tighter, forced trembling composure` |
| `claude_despair.png` | **절망(despair/sad)** — 무너지는 자백 | `slumped forward, head bowed, hollow defeated eyes, one hand covering his face, utterly broken` |

## 4. 밀러 (miller) — 기본=험상궂은 마부(이미 있음)
| 파일명 | 무드 | 표정·자세 프롬프트 |
|---|---|---|
| `miller_shock.png` | **동요(shock)** — "뭐, 뭐라고?" | `wide startled eyes breaking his tough scowl, mouth slightly open, recoiling a step, caught off guard` |
| `miller_sad.png` | **체념(sad)** — 착각을 깨달을 때 | `the hard scowl softened into weary resignation, gaze lowered, shoulders dropping, a tired honest sorrow` |

## 5. 엠마 (emma) — 기본=경계하는 바텐더(이미 있음)
| 파일명 | 무드 | 표정·자세 프롬프트 |
|---|---|---|
| `emma_fear.png` | **불안(fear)** — 추궁·회피 | `eyes averted to the side, defensive guarded frown, arms crossing tighter, leaning away, nervous` |
| `emma_despair.png` | **무너짐(despair)** — "주저앉으며" | `crumpling expression, eyes welling up, sinking down, shoulders caved, the defiance gone` |

## 6. 해리스 경 (harris) — 기본=다급한 의뢰인(이미 있음)
| 파일명 | 무드 | 표정·자세 프롬프트 |
|---|---|---|
| `harris_sad.png` | **침통(sad)** — 비서의 자백 앞에서 | `a sorrowful, hollow expression, eyes downcast and wet, clutching the recovered pen to his chest, a dignified grief` |

---

## 적용 우선순위 (꼭 다 안 만들어도 됩니다)
1순위(드라마 큼): `claude_despair` · `lily_sad` · `lily_surprise` · `vivian_sharp` · `emma_despair`
2순위: `claude_fear` · `miller_shock` · `harris_sad` · `vivian_soft` · `miller_sad` · `emma_fear`
3순위(아주 가끔): `lily_calm`

> 넣어 주시면 엔진의 `applyMood`가 무드별로 해당 표정 일러를 background로 바꿔 끼우도록 연결하겠습니다(없는 무드는 기본 일러 + 틴트로 폴백). 우상단·좌우반전·크기 정규화(`PORTRAIT_TUNE`)는 그대로 적용됩니다.
