/* =============================================================
 *  미스터리 추리게임 — 사건 생성 엔진 v3 (engine.js)
 *
 *  v3 대개편: "장소 허브형 수사" + 분기 대화 + 도구 아이템
 *  ──────────────────────────────────────────────────────────
 *   ● 세계 = 여러 장소(현장). 각 장소엔 그날 한 명의 NPC가 있을 수도/없을 수도.
 *       장소에 가면 → [현장 수색] 또는 [그곳의 NPC 심문] 중 선택.
 *   ● 심문 = 증언(주관, 범인은 거짓말). 분기 대화: 수긍/추궁 선택.
 *       잘못 수긍하면 거짓 정보를 사실로 믿게 된다(오판 유도).
 *   ● 현장 수색 = 물증(객관). 동기(문서)·수단(접근)·기회(흔적)를 확정.
 *       + 도구 아이템 발견: 거짓말 탐지기(1회용)·지문 감식 키트.
 *   ● 도구로 추리를 가속: 거짓말 탐지기 → 심문서 진위 표시 /
 *       지문 키트 → 현장 지문 감식으로 결정적 기회 물증 확보.
 *
 *   ● 범인 = 동기·기회·수단을 모두 가진 유일한 1명. 알리바이를 거짓으로 꾸미며
 *       물증·도구·추궁으로 그 거짓이 깨진다. (유일성은 패턴배정으로 보장)
 *   ● 일차(Day) 진행: 3일. 장소/NPC가 일차에 따라 점진적으로 열린다.
 *
 *  브라우저(전역)·Node(require) 양쪽 사용 가능.
 * ============================================================= */

(function (root) {
  'use strict';

  /* ----------------------------- 튜닝 상수 ----------------------------- */
  const CONFIG = {
    SUSPECTS: 5,
    LOCATIONS: 8,
    DAYS: 3,
    DAY_ACTIONS: [4, 4, 4],       // 일차별 행동 한도 (수색/심문 각 1)
    LOCATIONS_PER_DAY: [3, 3, 2], // 일차별 개방 장소 수 (현장 포함, 합 = LOCATIONS)
  };

  /* ----------------------------- 데이터 풀 ----------------------------- */

  const VICTIMS = [
    { name: '장만호', title: '재벌 그룹 회장' },
    { name: '서문경', title: '저명한 골동품 수집가' },
    { name: '홍윤기', title: '명문 사학의 이사장' },
    { name: '마동철', title: '대형 건설사 대표' },
    { name: '백승호', title: '논란의 천재 화가' },
    { name: '구자선', title: '제약회사 오너' },
    { name: '천경자', title: '전직 외교관' },
    { name: '나경원', title: '저택의 안주인' },
  ];

  // 용의자 일러스트가 전부 여성이므로 이름도 전부 여성 이름.
  const NAME_POOL = [
    '김서연', '이수아', '박하윤', '최유나', '정예린', '강다은',
    '윤채원', '임지아', '한소율', '오예원', '서나경', '신소은',
    '문가영', '배은채', '조혜원', '권아린', '백시은', '나윤서',
  ];

  const ROLE_POOL = [
    '집사', '주치의', '사업 동업자', '먼 친척 조카', '전속 변호사',
    '개인 비서', '정원사', '전속 요리사', '옛 연인', '미술관 큐레이터',
    '운전기사', '회계 담당자', '가정부장', '수양딸',
  ];

  // 장소 풀 — [표시명, 씬 이미지 id(scenes/<id>.png)]
  const LOCATION_POOL = [
    ['서재', 'study'], ['응접실', 'parlor'], ['대식당', 'dining-hall'],
    ['주인의 침실', 'master-bedroom'], ['뒷마당 정원', 'garden'], ['와인 저장고', 'wine-cellar'],
    ['다락방', 'attic'], ['온실', 'greenhouse'], ['당구장', 'billiard-room'],
    ['음악실', 'music-room'], ['서고', 'archive'], ['난간 발코니', 'balcony'],
    ['지하 금고', 'vault'], ['하인 숙소', 'servants-quarters'],
  ];

  const WEAPON_POOL = [
    '은촛대', '골동품 단검', '독이 든 와인잔', '오래된 권총',
    '비단 끈', '묵직한 렌치', '청동 화병', '편지 칼',
  ];

  const TIME_POOL = [
    '자정 무렵', '밤 10시경', '새벽 1시경', '저녁 9시경',
    '폭우가 쏟아지던 밤 11시', '정전이 있던 자정 직전',
  ];

  const MOTIVE_REASONS = [
    '거액의 유산 상속 문제로', '오래 묵은 치정 관계 때문에', '사업 자금을 둘러싼 배신으로',
    '치명적인 비밀을 들켜', '과거의 처절한 복수심으로', '뿌리 깊은 질투와 열등감으로',
    '협박에 시달리던 끝에', '명예를 더럽힌 일에 대한 원한으로', '위조된 유언장을 감추기 위해',
  ];

  const TRACE_OBJECTS = [
    '흙 묻은 발자국', '떨어진 소매 단추', '향수 잔향', '찢긴 옷자락',
    '흘린 손수건', '구겨진 장갑 한 짝', '깨진 안경알', '머리카락 몇 올',
  ];

  // 도구 아이템 정의
  const ITEM_DEFS = {
    lie_detector: {
      id: 'lie_detector', name: '거짓말 탐지기', icon: '📟',
      desc: '심문 한 번 동안 상대 진술의 진위를 표시한다. (1회용)', consumable: true,
    },
    fingerprint_kit: {
      id: 'fingerprint_kit', name: '지문 감식 키트', icon: '🔬',
      desc: '현장의 지문을 감식해 그 시각 누가 있었는지 밝힌다.', consumable: false, use: 'crimeScene',
    },
    ledger: {
      id: 'ledger', name: '회계 장부', icon: '📒',
      desc: '한 인물의 재정 관계를 들춰 <b>동기</b> 유무를 단번에 밝힌다. (1회용)', consumable: true, use: 'revealMotive',
    },
    armory_log: {
      id: 'armory_log', name: '무기고 출입 명부', icon: '📕',
      desc: '한 인물이 흉기를 다룰 수 있었는지 <b>수단</b>을 밝힌다. (1회용)', consumable: true, use: 'revealMeans',
    },
    witness: {
      id: 'witness', name: '목격자 진술서', icon: '🗒️',
      desc: '한 인물의 그 시각 행적, 즉 <b>기회</b>를 밝힌다. (1회용)', consumable: true, use: 'revealOpportunity',
    },
    master_key: {
      id: 'master_key', name: '만능 열쇠', icon: '🗝️',
      desc: '아직 잠긴 장소 하나를 지금 열어 들어간다. (1회용)', consumable: true, use: 'unlock',
    },
  };
  ITEM_DEFS.lie_detector.use = 'interrogation';

  /* ----------------------------- 난수 유틸 ----------------------------- */
  function makeRng(seed) {
    if (seed === undefined || seed === null) return Math.random;
    let s = seed >>> 0;
    return function () {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const randInt = (rng, n) => Math.floor(rng() * n);
  const pick = (rng, arr) => arr[randInt(rng, arr.length)];
  function shuffle(rng, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = randInt(rng, i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const sample = (rng, arr, n) => shuffle(rng, arr).slice(0, n);

  /* --------------------------- 물증 단서 텍스트 --------------------------- */
  function motiveClue(s, victim, has) {
    return has
      ? `${s.name}(${s.role})이(가) ${victim.name}에게 보낸 협박성 편지가 나왔다. ${s.motiveReason} 깊은 원한을 품고 있었다. (동기 ✓)`
      : `${s.name}(${s.role})과(와) ${victim.name} 사이엔 이해 다툼이 없었다. 원한을 살 일도 없었다. (동기 ✗)`;
  }
  function meansClue(s, weapon, has) {
    return has
      ? `${weapon} 보관함 출입 기록에 ${s.name}의 흔적이 있다. 다루는 데에도 익숙했다. (수단 ✓)`
      : `${s.name}은(는) ${weapon}에 접근한 기록이 없고 다룰 줄도 몰랐다. (수단 ✗)`;
  }
  function alibiClue(s, crimeSceneName, time, has) {
    return has
      ? `${crimeSceneName} 부근에서 ${s.trace}이(가) 나왔다. ${time}, ${s.name}은(는) 분명 이곳에 있었다. (기회 ✓)`
      : `${time}, ${s.name}은(는) ${s.alibiPlace}에 있었음이 확인됐다. 확실한 알리바이다. (기회 ✗)`;
  }

  /* ----------------------- 증언(주관) 텍스트 ----------------------- */
  function introLine(s, rng) {
    const calm = [`${s.role}로서 할 말은 다 하겠습니다. 무엇이든 물으시죠.`, `…저를 의심하십니까. 떳떳하니 물으세요.`, `끔찍한 일이에요. 빨리 범인이 잡히길 바랍니다.`];
    const nervous = [`(시선을 피하며) …꼭 대답해야 하나요.`, `(손끝을 떨며) 저는… 아무것도 모릅니다.`, `왜 하필 저부터 부르신 거죠?`];
    const evasive = [`글쎄요. 그날 일은 잘 기억나지 않네요.`, `(어깨를 으쓱) 제가 알 게 뭐 있겠어요.`, `그 이야긴 별로 하고 싶지 않은데요.`];
    return s.demeanor === 'nervous' ? pick(rng, nervous) : s.demeanor === 'evasive' ? pick(rng, evasive) : pick(rng, calm);
  }
  function alibiLine(s, time) {
    if (s.alibiTruth === 'real') return `${time}이요? 저는 ${s.alibiPlace}에 있었어요. 거기 있던 사람들에게 물어보셔도 좋아요.`;
    if (s.alibiTruth === 'lie') return `${time}엔… ${s.claimAlibiPlace}에 혼자 있었습니다. 확실해요. 거긴 아무도 없었지만, 정말입니다.`;
    return `${time}이라… 솔직히 어디 있었는지 잘 모르겠어요. 증명할 사람이 없네요.`;
  }
  function relationLine(s, victim) {
    return s.hasMotive
      ? `제가 ${victim.name}을(를) 원망했냐고요? …누구나 사정은 있죠. 그게 살인의 이유는 아니에요.`
      : `${victim.name}와(과)요? 별 사이 아니었어요. 미워할 만큼 가깝지도 않았는걸요.`;
  }
  function weaponLine(s, weapon) {
    return s.hasMeans
      ? `${weapon} 말인가요. …다룰 줄은 압니다. 하지만 그날 만진 적은 없어요.`
      : `${weapon}이요? 그런 거 손에 쥐어 본 적도 없어요. 무서워서 어떻게.`;
  }
  function pressSuccessLine(s) {
    if (s.alibiTruth === 'lie') return `(얼굴이 굳는다) …어떻게 그걸… 좋아요, 거짓말이었어요. 거기 없었습니다. 하지만 제가 죽인 건 아니에요!`;
    return `(당황하며) 그, 그건… 제 기억이 틀렸을 수도 있죠. 하지만 결백합니다!`;
  }
  function pressFailLine(s) {
    if (s.alibiTruth === 'lie') return `(차갑게) 증거도 없이 사람을 몰아세우는 겁니까? 제 말이 진실입니다.`;
    return `(억울한 듯) 정말입니다! 어떻게 더 증명하라는 거죠. 믿어 주세요.`;
  }

  /* ----------------------------- 사건 생성 ----------------------------- */
  const PATTERNS_TWO = [[1, 1, 0], [1, 0, 1], [0, 1, 1]];
  const PATTERNS_ONE = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const PATTERN_ZERO = [0, 0, 0];

  function generateCase(opts) {
    opts = opts || {};
    const rng = makeRng(opts.seed);
    const portraitPool = (opts.portraits && opts.portraits.length) ? opts.portraits.slice() : null;

    const victim = pick(rng, VICTIMS);
    const weapon = pick(rng, WEAPON_POOL);
    const time = pick(rng, TIME_POOL);

    // 장소 + 일차 + 씬 id
    const locDefs = sample(rng, LOCATION_POOL, CONFIG.LOCATIONS);
    const locations = locDefs.map(([name, sceneId], i) => ({
      id: i, name, sceneId, clues: [], items: [],
      isCrimeScene: false, day: 1, occupants: [], searched: false,
    }));
    locations[0].isCrimeScene = true;
    const crimeScene = locations[0];
    let li = 1;
    const perDay = CONFIG.LOCATIONS_PER_DAY.slice(); perDay[0] -= 1;
    for (let d = 0; d < CONFIG.DAYS; d++) {
      for (let k = 0; k < perDay[d] && li < locations.length; k++) locations[li++].day = d + 1;
    }
    while (li < locations.length) locations[li++].day = CONFIG.DAYS;

    // 용의자
    const names = sample(rng, NAME_POOL, CONFIG.SUSPECTS);
    const roles = sample(rng, ROLE_POOL, CONFIG.SUSPECTS);
    const portraits = portraitPool ? sample(rng, portraitPool, CONFIG.SUSPECTS) : [];
    const altPlaces = sample(rng, LOCATION_POOL.map((l) => l[0]), CONFIG.SUSPECTS);

    const suspects = names.map((name, i) => ({
      id: i, name, role: roles[i], portrait: portraits[i] || null,
      motiveReason: pick(rng, MOTIVE_REASONS),
      alibiPlace: altPlaces[i],
      claimAlibiPlace: pick(rng, LOCATION_POOL.map((l) => l[0])),
      trace: pick(rng, TRACE_OBJECTS),
      hasMotive: false, hasOpportunity: false, hasMeans: false,
      isCulprit: false, location: null,
    }));

    // 1) 범인
    const culprit = suspects[randInt(rng, suspects.length)];
    culprit.isCulprit = true;
    culprit.hasMotive = culprit.hasOpportunity = culprit.hasMeans = true;

    // 2) 나머지 패턴
    const others = shuffle(rng, suspects.filter((s) => !s.isCulprit));
    others.forEach((s, idx) => {
      let pat;
      if (idx === 0) pat = pick(rng, PATTERNS_TWO);
      else { const r = rng(); pat = r < 0.4 ? pick(rng, PATTERNS_TWO) : r < 0.85 ? pick(rng, PATTERNS_ONE) : PATTERN_ZERO; }
      s.hasMotive = !!pat[0]; s.hasOpportunity = !!pat[1]; s.hasMeans = !!pat[2];
    });

    // 3) 알리바이 진위 + 태도
    suspects.forEach((s) => {
      if (!s.hasOpportunity) s.alibiTruth = 'real';
      else if (s.isCulprit) s.alibiTruth = 'lie';
      else s.alibiTruth = rng() < 0.5 ? 'lie' : 'none';
      const r = rng();
      if (s.alibiTruth === 'lie') s.demeanor = r < 0.45 ? 'nervous' : r < 0.8 ? 'evasive' : 'calm';
      else if (s.alibiTruth === 'none') s.demeanor = r < 0.5 ? 'evasive' : r < 0.75 ? 'nervous' : 'calm';
      else s.demeanor = r < 0.65 ? 'calm' : r < 0.85 ? 'nervous' : 'evasive';
    });

    // 4) NPC 배치 — 일차별로 분산(진행 의미) + 한 장소에 여러 명도 가능
    const dayCounts = [2, 2, 1]; // 일차별 등장 인물 수 (합 = SUSPECTS)
    const shuffledSusp = shuffle(rng, suspects);
    let si = 0;
    for (let d = 1; d <= CONFIG.DAYS; d++) {
      const locsOfDay = locations.filter((l) => l.day === d && !l.isCrimeScene);
      const cnt = (dayCounts[d - 1] || 0);
      for (let k = 0; k < cnt && si < shuffledSusp.length; k++) {
        const s = shuffledSusp[si++];
        const loc = locsOfDay.length ? pick(rng, locsOfDay) : pick(rng, locations.filter((l) => !l.isCrimeScene));
        s.location = loc.id; loc.occupants.push(s.id);
      }
    }
    while (si < shuffledSusp.length) {
      const s = shuffledSusp[si++];
      const loc = pick(rng, locations.filter((l) => !l.isCrimeScene));
      s.location = loc.id; loc.occupants.push(s.id);
    }

    // 5) 물증 단서 (동기·수단·기회 = 5×3)
    const scatter = [];
    suspects.forEach((s) => {
      scatter.push({ type: 'motive', suspectId: s.id, text: motiveClue(s, victim, s.hasMotive), reveal: { suspectId: s.id, attr: 'motive', value: s.hasMotive } });
      scatter.push({ type: 'means', suspectId: s.id, text: meansClue(s, weapon, s.hasMeans), reveal: { suspectId: s.id, attr: 'means', value: s.hasMeans } });
      scatter.push({ type: 'alibi', suspectId: s.id, breaksLie: s.alibiTruth === 'lie', text: alibiClue(s, crimeScene.name, time, s.hasOpportunity), reveal: { suspectId: s.id, attr: 'opportunity', value: s.hasOpportunity } });
    });
    // 범인 기회 물증은 범행 현장에 우선 배치
    const culpritAlibi = scatter.find((c) => c.type === 'alibi' && c.suspectId === culprit.id);
    crimeScene.clues.push(culpritAlibi);
    shuffle(rng, scatter.filter((c) => c !== culpritAlibi)).forEach((clue, i) => {
      locations[1 + (i % (locations.length - 1))].clues.push(clue);
    });

    // 6) 현장 지문(키트 게이트) — 범인을 가리키는 결정적 보강 단서
    crimeScene.clues.push({
      type: 'fingerprint', suspectId: culprit.id, gated: 'fingerprint_kit', breaksLie: culprit.alibiTruth === 'lie',
      text: `${weapon} 손잡이에서 선명한 지문이 채취됐다 — ${culprit.name}의 것이다. 그 시각 이 손으로 흉기를 쥐었다. (기회 ✓ · 결정적)`,
      reveal: { suspectId: culprit.id, attr: 'opportunity', value: true },
    });

    // 7) 도구 배치 — 키트·탐지기를 1일차 접근 가능 장소에 우선
    const day1Locs = shuffle(rng, locations.filter((l) => l.day === 1));
    const placeItem = (id, prefer) => {
      const pool = (prefer && prefer.length) ? prefer : locations;
      pick(rng, pool).items.push(id);
    };
    placeItem('fingerprint_kit', day1Locs);
    placeItem('lie_detector', shuffle(rng, locations.filter((l) => l.day <= 2)));
    // 추가 도구 2종(회계장부/무기고명부/목격자진술서/만능열쇠 중)
    sample(rng, ['ledger', 'armory_log', 'witness', 'master_key'], 2)
      .forEach((id) => placeItem(id, shuffle(rng, locations.filter((l) => l.day <= 2))));

    // 8) 분기 대화 데이터
    suspects.forEach((s) => {
      const targets = suspects.filter((o) => o.id !== s.id);
      const seen = pick(rng, targets);
      // 정직한 리드 = 목격 대상의 기회(알리바이) 흔적이 있는 장소를 가리킴.
      const trueLoc = locations.find((loc) => loc.clues.some((c) => c.type === 'alibi' && c.suspectId === seen.id))
        || locations.find((loc) => loc.occupants.includes(seen.id));
      // 범인은 엉뚱한 곳으로 유도(미끼 리드) — 그 대상의 단서가 없는 장소.
      const decoyLoc = pick(rng, locations.filter((loc) => !loc.isCrimeScene && !loc.clues.some((c) => c.suspectId === seen.id))) || trueLoc;
      const leadLoc = s.isCulprit ? decoyLoc : trueLoc;
      const leadReliable = !s.isCulprit;
      s.dialogue = {
        intro: introLine(s, rng),
        topics: {
          alibi: { q: `${time}, 어디 있었습니까?`, a: alibiLine(s, time), claim: s.claimAlibiPlace },
          relation: { q: `${victim.name}와(과)는 어떤 사이였죠?`, a: relationLine(s, victim) },
          weapon: { q: `${weapon}을(를) 다룰 줄 압니까?`, a: weaponLine(s, weapon) },
        },
        press: {
          q: '“그 시각 거기 있었다는 증거가 있습니까?” (추궁)',
          success: pressSuccessLine(s), fail: pressFailLine(s),
        },
        believe: { q: '“알겠습니다. 일단 믿겠습니다.” (수긍)' },
        lead: leadLoc ? { targetSuspectId: seen.id, locationId: leadLoc.id, reliable: leadReliable, text: `그러고 보니… ${time}쯤 ${seen.name}이(가) ${leadLoc.name} 쪽에 있는 걸 본 것 같아요. 거길 살펴보세요.` } : null,
      };
    });

    // 9) 인트로/내러티브
    crimeScene.intro = `${crimeScene.name}에서 ${victim.name} ${victim.title}이(가) ${weapon}에 의해 살해된 채 발견됐다. 범행 시각은 ${time}으로 추정된다.`;
    locations.forEach((loc) => { if (!loc.intro) loc.intro = `${loc.name}을(를) 둘러본다.`; });

    const dayBriefs = [
      `1일차 — 폭우가 쏟아진 밤, 비극이 일어났다. 저택을 돌며 사람들을 만나고 단서를 모아라.`,
      `2일차 — 잠긴 방들이 열리고, 사람들의 위치가 바뀌었다. 어제의 증언을 물증으로 검증하라.`,
      `3일차 — 마지막 날. 모든 장소가 열렸다. 진실을 꿰어 진범을 지목하라.`,
    ];

    return {
      victim, weapon, time, crimeScene, locations, suspects,
      culpritId: culprit.id,
      days: CONFIG.DAYS, dayActions: CONFIG.DAY_ACTIONS.slice(), dayBriefs,
      itemDefs: ITEM_DEFS, config: CONFIG,
      seed: opts.seed === undefined ? null : opts.seed,
    };
  }

  /* --------------------- 검증 --------------------- */
  function verifyCase(caseData) {
    const fullGuilty = caseData.suspects.filter((s) => s.hasMotive && s.hasOpportunity && s.hasMeans);
    const ok = fullGuilty.length === 1 && fullGuilty[0].id === caseData.culpritId;

    const revealed = {};
    caseData.suspects.forEach((s) => { revealed[s.id] = { motive: false, opportunity: false, means: false }; });
    caseData.locations.forEach((loc) => { loc.clues.forEach((c) => { revealed[c.reveal.suspectId][c.reveal.attr] = true; }); });
    let allRevealed = true;
    caseData.suspects.forEach((s) => { const r = revealed[s.id]; if (!r.motive || !r.opportunity || !r.means) allRevealed = false; });

    const culprit = caseData.suspects.find((s) => s.id === caseData.culpritId);
    const lieBreakable = culprit.alibiTruth === 'lie' &&
      caseData.locations.some((loc) => loc.clues.some((c) => c.type === 'alibi' && c.suspectId === culprit.id && c.breaksLie));

    // 모든 용의자가 어딘가에 배치됐는지 / 도구가 놓였는지 / 현장 지문 존재
    const allPlaced = caseData.suspects.every((s) => s.location !== null);
    const occupiedLocs = caseData.locations.filter((l) => l.occupants.length > 0).length;
    const hasKit = caseData.locations.some((l) => l.items.includes('fingerprint_kit'));
    const hasDetector = caseData.locations.some((l) => l.items.includes('lie_detector'));
    const hasPrint = caseData.crimeScene.clues.some((c) => c.type === 'fingerprint');

    return { ok, allRevealed, lieBreakable, allPlaced, occupiedLocs, hasKit, hasDetector, hasPrint, uniqueGuiltyCount: fullGuilty.length };
  }

  const Engine = { generateCase, verifyCase, makeRng, CONFIG, ITEM_DEFS };
  root.MysteryEngine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
