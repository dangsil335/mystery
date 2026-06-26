/* =======================================================
 *  저택의 그림자 — 스토리 모드 런타임 (story.js)
 *
 *  STORY_* 데이터를 읽어 재생: 컷신 · 탐색(조사 핫스팟/인물 화제) ·
 *  만담 · 증거 수집. 기존 씬/대화/수첩 UI를 재활용.
 * ======================================================= */
(function () {
  'use strict';
  const PRO = window.STORY_PROLOGUE;
  const $ = (id) => document.getElementById(id);
  const portraitSrc = (id) => `illust/${id}.png?b=3`;
  // 일러마다 프레이밍(줌)이 달라 머리 크기가 제각각 → 입상별 배율로 정규화(바닥 기준 축소)
  const PORTRAIT_TUNE = { vivian: 0.88, lily: 0.76, harris: 0.75, claude: 0.80, miller: 0.82, emma: 0.84 };
  const tuneOf = (portrait) => PORTRAIT_TUNE[portrait] || 1;
  const sceneSrc = (id) => `scenes/${id}.png`;
  const cast = (id) => PRO.cast[id];
  let st = null;
  let toastTimer = null;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }
  function showScreen(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active')); $(id).classList.add('active'); }

  function newState() { return { flags: {}, evidence: [], evidenceSet: new Set(), seen: new Set(), dialogueLog: [], clockMin: 16 * 60 + 18, scene: null, stage: { left: null, right: null, active: null } }; }

  // 대화 입상 무대: 말하는 인물을 배경 위 좌/우에 마주보게 세운다.
  function resetStage() {
    st.stage = { left: null, right: null, active: null };
    $('dlgLeft') && $('dlgLeft').classList.remove('enter'); $('dlgRight') && $('dlgRight').classList.remove('enter');
    renderStage(null);
  }
  // 새로 자리에 올라온 입상만 해당 벽에서 슬라이드. 같은 인물이 이어 말하거나 이미 무대에 있으면 가만히.
  function speak(who) {
    const s = st.stage; let enter = null;
    if (!who) { s.active = null; }
    else if (s.left === who) { s.active = 'left'; }
    else if (s.right === who) { s.active = 'right'; }
    else if (!s.left) { s.left = who; s.active = 'left'; enter = 'left'; }
    else if (!s.right) { s.right = who; s.active = 'right'; enter = 'right'; }
    else { const side = (s.active === 'left') ? 'right' : 'left'; s[side] = who; s.active = side; enter = side; }
    renderStage(enter);
  }
  function setSprite(el, who) {
    el.hidden = !who; if (!who) return;
    const c = cast(who), img = el.querySelector('.dlg-img');
    img.style.backgroundImage = `url('${portraitSrc(c.portrait)}')`;
    const flip = el.id === 'dlgRight' ? 'scaleX(-1) ' : '';   // 우측 입상은 좌우반전 유지
    img.style.transformOrigin = 'bottom center';
    img.style.transform = `${flip}scale(${tuneOf(c.portrait)})`;
  }
  function animEnter(el) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); el.addEventListener('animationend', () => el.classList.remove('enter'), { once: true }); }
  // 감정 연출 — 활성 입상에 무드(틴트/흔들림/강조)를 입히고, 정렬된 표정 변형 일러가 있으면 그림 자체를 바꿔 끼운다.
  const MOOD_LABEL = { anger: '분노', shock: '동요', fear: '불안', sad: '침통', despair: '절망', smug: '여유', emphasis: '확신', soft: '…', cold: '냉정' };
  const MOODS = ['anger', 'shock', 'fear', 'sad', 'despair', 'smug', 'emphasis', 'soft', 'cold'];
  // 무드 → 표정 변형 일러 매핑 (illust/<portrait>_<suffix>.png, 머리 정렬됨). 없는 조합은 베이스+틴트로 폴백.
  const EXPR = {
    vivian: { emphasis: 'sharp', soft: 'soft' },
    lily:   { shock: 'surprise', fear: 'surprise', sad: 'sad', despair: 'sad', cold: 'calm' },
    claude: { fear: 'fear', shock: 'fear', despair: 'despair', sad: 'despair' },
    miller: { shock: 'shock', sad: 'sad', despair: 'sad' },
    emma:   { fear: 'fear', despair: 'despair', sad: 'despair' },
    harris: { sad: 'sad', despair: 'sad' },
  };
  const exprFile = (portrait, mood) => { const m = EXPR[portrait]; const s = m && mood && m[mood]; return s ? `${portrait}_${s}` : null; };
  function clearMoods() {
    ['dlgLeft', 'dlgRight'].forEach((id) => { const e = $(id); if (!e) return; e.classList.remove('shake', 'tremble'); const img = e.querySelector('.dlg-img'); if (img) MOODS.forEach((m) => img.classList.remove('mood-' + m)); });
  }
  function applyMood(mood) {
    clearMoods();
    $('sdDemeanor').textContent = mood ? (MOOD_LABEL[mood] || '') : '';
    const side = st.stage.active; if (!side) return;
    const outer = $(side === 'left' ? 'dlgLeft' : 'dlgRight'); if (!outer) return;
    const img = outer.querySelector('.dlg-img');
    // 표정 변형 일러 스왑: (인물,무드) 매핑이 있으면 그림 교체, 없으면 setSprite가 깐 베이스 유지
    const who = st.stage[side], portrait = who && cast(who).portrait;
    if (img && portrait) { const ef = exprFile(portrait, mood); img.style.backgroundImage = `url('${portraitSrc(ef || portrait)}')`; }
    if (!mood) return;
    if (img) img.classList.add('mood-' + mood);
    if (mood === 'shock') { void outer.offsetWidth; outer.classList.add('shake'); outer.addEventListener('animationend', () => outer.classList.remove('shake'), { once: true }); }
    else if (mood === 'fear') { outer.classList.add('tremble'); }
  }
  function renderStage(enter) {
    const s = st.stage, L = $('dlgLeft'), R = $('dlgRight'); if (!L || !R) return;
    setSprite(L, s.left); setSprite(R, s.right);
    L.classList.toggle('dim', !!s.active && s.active !== 'left');
    R.classList.toggle('dim', !!s.active && s.active !== 'right');
    if (enter === 'left') animEnter(L); else if (enter === 'right') animEnter(R);
  }
  function dlgMode(on) { $('dlgStage').hidden = !on; $('sceneNpcs').style.display = on ? 'none' : ''; }

  // 챕터 타이틀 카드: 전체화면으로 스르륵 떠올랐다 사라진 뒤 다음 대사로.
  function showChapterCard(card, done) {
    const el = $('chapterCard'); if (!el) { done(); return; }
    $('ccKind').textContent = card.kind || ''; $('ccTitle').textContent = card.title || ''; $('ccSub').textContent = card.sub || '';
    const dlg = $('sceneDialogue'); dlg.style.visibility = 'hidden';
    el.hidden = false; el.classList.remove('show', 'out'); void el.offsetWidth; el.classList.add('show');
    let fired = false;
    function finish() {
      if (fired) return; fired = true; el.onclick = null; clearTimeout(auto);
      el.classList.remove('show'); el.classList.add('out');
      setTimeout(() => { el.hidden = true; el.classList.remove('out'); dlg.style.visibility = ''; done(); }, 620);
    }
    const auto = setTimeout(finish, 3700);
    el.onclick = finish;
  }

  // 장소 · 시각 인장: 장소를 옮기거나 시작할 때 짧게 떴다 사라진다.
  function fmtTime(min) { const h = Math.floor(min / 60), m = min % 60; const ap = h < 12 ? '오전' : '오후'; const h12 = (h % 12) || 12; return `${ap} ${h12}시 ${m}분`; }
  function showPlaceCard(place, sub, done) {
    const el = $('placeCard'); if (!el) { done(); return; }
    $('pcPlace').textContent = place; $('pcTime').textContent = sub || '';
    const dlg = $('sceneDialogue'); const dvis = dlg.style.visibility; dlg.style.visibility = 'hidden';
    el.hidden = false; el.classList.remove('show', 'out'); void el.offsetWidth; el.classList.add('show');
    let fired = false;
    function finish() {
      if (fired) return; fired = true; el.onclick = null; clearTimeout(auto);
      el.classList.remove('show'); el.classList.add('out');
      setTimeout(() => { el.hidden = true; el.classList.remove('out'); dlg.style.visibility = dvis; done(); }, 560);
    }
    const auto = setTimeout(finish, 2400);
    el.onclick = finish;
  }
  function enterPlace(sc, done) {
    clearInteract(); $('sceneDialogue').hidden = true;
    if (st._skipClock) st._skipClock = false; else st.clockMin += 12;   // 불러오기 시엔 시간 진행 안 함
    showPlaceCard(sc.place, (PRO.date ? PRO.date + ' · ' : '') + fmtTime(st.clockMin), done);
  }

  // 문서(전보·편지)를 화면 중앙에 이미지로 띄운다. 이미지가 없으면 전보 용지풍 카드로 폴백.
  function showDoc(doc, done) {
    const el = $('docView'); if (!el) { done(); return; }
    const img = $('docImg'), paper = $('docPaper');
    $('docTitle').textContent = doc.title || '전보 · TELEGRAM'; $('docBody').textContent = doc.text || '';
    img.hidden = true; paper.hidden = true; img.onload = null; img.onerror = null;
    if (doc.src) { img.onload = () => { img.hidden = false; }; img.onerror = () => { paper.hidden = false; }; img.src = doc.src; }
    else paper.hidden = false;
    const dlg = $('sceneDialogue'); const dvis = dlg.style.visibility; dlg.style.visibility = 'hidden';
    el.hidden = false; el.classList.remove('show', 'out'); void el.offsetWidth; el.classList.add('show');
    let fired = false;
    function finish() {
      if (fired) return; fired = true; el.onclick = null;
      el.classList.remove('show'); el.classList.add('out');
      setTimeout(() => { el.hidden = true; el.classList.remove('out'); dlg.style.visibility = dvis; done(); }, 460);
    }
    el.onclick = finish;   // 문서는 자동으로 안 닫힘 — 읽고 클릭
  }

  function enterGameScreen() {
    showScreen('gameScreen');
    $('mapView').hidden = true; $('sceneView').hidden = false;
    $('sceneBack').style.display = 'none';                 // 스토리는 선형 — 뒤로가기 숨김
    $('sdPortrait').style.display = 'none';                // 작은 초상 폐기 — 배경 입상 사용
    document.querySelector('.hud-mid') && (document.querySelector('.hud-mid').style.visibility = 'hidden');
    $('accuseBtn') && ($('accuseBtn').style.display = 'none');
    $('dayEndBtn') && ($('dayEndBtn').style.display = 'none');
  }
  function startStory() {
    st = newState();
    enterGameScreen();
    showScene(PRO.start);
    const f = $('storyFade'); if (f) { f.classList.remove('run'); void f.offsetWidth; f.classList.add('run'); }
  }
  function goToTitle() {
    ['overlay', 'notebookPanel', 'dayOverlay', 'logOverlay', 'itemPicker', 'accusePicker', 'saveLoad'].forEach((id) => $(id) && $(id).classList.remove('active'));
    $('sceneDialogue').hidden = true; $('sceneFound') && ($('sceneFound').hidden = true);
    showScreen('titleScreen');
  }

  function setBg(sc) { const bg = $('sceneBg'); bg.style.backgroundImage = `url('${sceneSrc(sc)}'), linear-gradient(160deg,#262019,#14110e)`; bg.dataset.scene = sc; }
  function clearInteract() { $('sceneNpcs').innerHTML = ''; $('sceneNpcs').classList.remove('talking'); $('sceneActionbar').innerHTML = ''; hideHotspots(); }
  function hideHotspots() { const b = $('sceneHotspots'); if (b) b.hidden = true; }

  // ---------------- 씬 분기 ----------------
  function showScene(id) {
    if (!id) { endChapter(); return; }
    const sc = PRO.scenes[id]; if (!sc) { endChapter(); return; }
    st.scene = id;
    $('mapView').hidden = true; $('sceneView').hidden = false;
    setBg(sc.bg); $('sceneView').classList.toggle('bright', !!sc.bright); $('sceneTitle').textContent = sc.title || '';
    if (sc.type === 'cutscene') { clearInteract(); const at = (st.cut && st.cut.scene === id) ? st.cut.idx : 0; playSequence(sc.lines, () => showScene(sc.next), true, at); }
    else if (sc.type === 'deduction') { clearInteract(); playDeduction(sc); }
    else if (sc.place) enterPlace(sc, () => { st.exploreMode = 'hub'; renderExplore(sc); autosave(); });   // 장소 이동 시 인장 + 자동저장
    else { st.exploreMode = 'hub'; renderExplore(sc); autosave(); }
  }

  // ---------------- 대사 시퀀스(컷신·인라인 공용) ----------------
  let typing = null;
  function typeLine(el, text) { clearInterval(typing); el.textContent = ''; el.dataset.full = text; let i = 0; typing = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typing); }, 16); }
  function finishTyping(el) { if (el.dataset.full && el.textContent !== el.dataset.full) { clearInterval(typing); el.textContent = el.dataset.full; return true; } return false; }

  function playSequence(lines, after, track, startIdx) {
    const dlg = $('sceneDialogue'); dlg.hidden = false; hideHotspots(); dlgMode(true); resetStage();
    $('sdLead') && ($('sdLead').hidden = true);
    let i = startIdx || 0;
    function render() {
      if (track) st.cut = { scene: st.scene, idx: i };   // 대사 위치 저장(불러오기 시 이 줄부터)
      const ln = lines[i]; if (ln.bg) setBg(ln.bg);
      if (ln.card) { showChapterCard(ln.card, next); return; }
      if (ln.place) { showPlaceCard(ln.place.name, ln.place.time, next); return; }
      if (ln.doc) { showDoc(ln.doc, next); return; }
      if (ln.set) Object.assign(st.flags, ln.set);            // 사건 개요 등 진행 플래그
      const txt = $('sdText');
      if (ln.narr !== undefined) {
        speak(null); applyMood(null);
        $('sdName').textContent = ''; $('sdRole').textContent = '';
        const np = $('sdName').closest('.sd-nameplate'); if (np) np.style.display = 'none';   // 내레이션엔 이름표 숨김
        txt.classList.add('narr'); typeLine(txt, ln.narr);
        st.dialogueLog.push({ narr: ln.narr });
      } else {
        const c = cast(ln.who); speak(ln.who); applyMood(ln.mood);
        const np2 = $('sdName').closest('.sd-nameplate'); if (np2) np2.style.display = '';
        $('sdName').textContent = c.name; $('sdRole').textContent = c.role;
        txt.classList.remove('narr'); typeLine(txt, ln.text);
        st.dialogueLog.push({ name: c.name, text: ln.text });
      }
      const last = i >= lines.length - 1;
      $('sdChoices').innerHTML = `<button class="seq-caret" id="seqNext" title="${last ? '닫기' : '계속'}">${last ? '✦' : '❯'}</button>`;
      $('seqNext').onclick = next;
    }
    function next() { const txt = $('sdText'); if (finishTyping(txt)) return; i++; if (i >= lines.length) { if (track) st.cut = null; dlg.onclick = null; $('sdChoices').innerHTML = ''; if (after) after(); else { dlg.hidden = true; } } else render(); }
    dlg.onclick = next; render();
  }

  // ---------------- 탐색 씬 ----------------
  function mkBtn(label, cls) { const b = document.createElement('button'); if (cls) b.className = cls; b.textContent = label; return b; }
  function renderExplore(sc) {
    const dlg = $('sceneDialogue'); dlg.hidden = true; dlg.onclick = null; dlgMode(false); hideCloseup();
    // 일정 수만큼 조사하면 해금되는 게이트(예: 평화로운 탐색 → 사건 발생)
    if (sc.gate && (sc.hotspots || []).filter((h) => st.seen.has('hs:' + h.id)).length >= sc.gate.count) st.flags[sc.gate.flag] = true;
    // 입장 만담(1회) — 먼저 재생하고 조사 허브로
    const enterKey = sc.title + ':onEnter';
    if (sc.onEnter && !st.seen.has(enterKey)) { st.seen.add(enterKey); playSequence(sc.onEnter, () => renderExplore(sc)); return; }

    const mode = st.exploreMode || 'hub';
    const hasPeople = !!(sc.present && sc.present.length);
    const hasSpots = !!(sc.hotspots && sc.hotspots.length);
    const npcBox = $('sceneNpcs'); npcBox.innerHTML = ''; npcBox.classList.remove('talking');
    npcBox.classList.add('empty');

    // 인물(탐문 모드에서만 표시)
    if (mode === 'people' && hasPeople) {
      npcBox.classList.remove('empty');
      (sc.present || []).forEach((cid) => {
        const c = cast(cid);
        const el = document.createElement('div'); el.className = 'scene-npc'; el.dataset.cid = cid;
        el.innerHTML = `<div class="snpc-sprite" style="background-image:url('${portraitSrc(c.portrait)}'); transform:scale(${tuneOf(c.portrait)}); transform-origin:bottom center"></div>` +
          `<div class="snpc-tag"><b>${c.name}</b><span>${c.role}</span><em>이야기한다</em></div>`;
        el.onclick = () => openTopics(sc, cid);
        npcBox.appendChild(el);
      });
    }
    // 배경 핫스팟(현장 모드에서만 표시)
    renderHotspots(mode === 'scene' ? (sc.hotspots || []) : []);

    // 액션바
    const bar = $('sceneActionbar'); bar.innerHTML = '';
    if (mode === 'hub') {
      if (hasSpots) { const b = mkBtn('🔍 현장을 살펴본다', 'primary'); b.onclick = () => { st.exploreMode = 'scene'; renderExplore(sc); }; bar.appendChild(b); }
      if (hasPeople) { const b = mkBtn(`💬 인물에게 묻는다 (${sc.present.length}명)`, 'primary'); b.onclick = () => { st.exploreMode = 'people'; renderExplore(sc); }; bar.appendChild(b); }
      (sc.actions || []).forEach((a) => {
        if (a.requires && !st.flags[a.requires]) return;
        const b = mkBtn(a.label, 'ghost'); b.onclick = () => { if (a.set) Object.assign(st.flags, a.set); if (a.goto) showScene(a.goto); }; bar.appendChild(b);
      });
      if (sc.hint && (sc.actions || []).every((a) => a.requires && !st.flags[a.requires])) {
        const h = document.createElement('div'); h.className = 'scene-hint'; h.textContent = '💡 ' + sc.hint; bar.appendChild(h);
      }
    } else {
      const back = mkBtn('◀ 돌아가기', 'ghost'); back.onclick = () => { st.exploreMode = 'hub'; renderExplore(sc); }; bar.appendChild(back);
      const tip = document.createElement('div'); tip.className = 'scene-hint';
      tip.textContent = mode === 'scene' ? '💡 화면 곳곳을 눌러 단서를 찾으세요.' : '💡 인물을 눌러 증언을 들으세요.';
      bar.appendChild(tip);
    }
    const nb = mkBtn('🗒 수첩', 'ghost'); nb.onclick = openNotebook; bar.appendChild(nb);
  }

  // 조사 핫스팟
  function renderHotspots(list) {
    const box = $('sceneHotspots'); if (!box) return;
    if (!list.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    const sc = PRO.scenes[st.scene] || {}; const posMap = sc.hsPos || {};
    box.innerHTML = list.map((h, i) => {
      const seen = st.seen.has('hs:' + h.id);
      const pos = posMap[h.id] || h.pos || { x: 14 + (i % 6) * 14, y: 22 + Math.floor(i / 6) * 17 };   // 좌표 없으면 그리드 폴백
      return `<div class="hs-spot ${seen ? 'seen' : ''} ${h.key ? 'key' : ''}" data-hs="${h.id}" style="left:${pos.x}%;top:${pos.y}%"><span class="hs-label">${h.label}</span></div>`;
    }).join('');
    [...box.querySelectorAll('.hs-spot')].forEach((b) => { b.onclick = () => doHotspot(list.find((h) => h.id === b.dataset.hs)); });
  }
  function doHotspot(h) {
    const sc = PRO.scenes[st.scene];
    const first = !st.seen.has('hs:' + h.id);
    st.seen.add('hs:' + h.id);
    st.visits = st.visits || {};
    const v = (st.visits[h.id] = (st.visits[h.id] || 0) + 1);   // 1=첫 조사, 2·3…=재조사
    if (first) { if (h.give) addEvidence(h.give); if (h.gives) h.gives.forEach(addEvidence); if (h.set) Object.assign(st.flags, h.set); }
    let lines = h.lines;
    if (v > 1 && h.repeat && h.repeat.length) {
      // repeat: 단일 배열([{…}]) 또는 회차별 변주([[…],[…]]) 둘 다 지원
      const variations = Array.isArray(h.repeat[0]) ? h.repeat : [h.repeat];
      lines = variations[Math.min(v - 2, variations.length - 1)];   // 2회차→[0], 3회차→[1], 이후 마지막 고정
    }
    showCloseup(h.popup);   // 클로즈업 이미지(있으면)
    playSequence(lines, () => { hideCloseup(); renderExplore(sc); });
  }

  // 사물 클로즈업: 이미지가 로드되면 띄우고, 없거나 404면 조용히 폴백(텍스트만).
  function showCloseup(name) {
    const el = $('closeup'), img = $('closeupImg'); if (!el || !img) return;
    el.hidden = true; img.onload = null; img.onerror = null;
    if (!name) return;
    img.onload = () => { el.hidden = false; };
    img.onerror = () => { el.hidden = true; };
    img.src = `clues/${name}.png?b=2`;   // 단서 클로즈업 전용 폴더
  }
  function hideCloseup() {
    const el = $('closeup'), img = $('closeupImg'); if (!el) return;
    el.hidden = true; if (img) { img.onload = null; img.onerror = null; img.removeAttribute('src'); }
  }

  // 인물 화제
  function openTopics(sc, cid) {
    const c = cast(cid); const topics = (sc.topics && sc.topics[cid]) || [];
    const dlg = $('sceneDialogue'); dlg.hidden = false; dlg.onclick = null; dlgMode(true); resetStage(); speak(cid);
    $('sdName').closest('.sd-nameplate').style.display = ''; $('sdName').textContent = c.name; $('sdRole').textContent = c.role; $('sdDemeanor').textContent = '';
    const txt = $('sdText'); txt.classList.remove('narr'); typeLine(txt, '(무엇이든 물어보세요.)');
    const box = $('sdChoices'); box.innerHTML = '';
    if (!topics.length) { const p = document.createElement('div'); p.className = 'topic-none'; p.textContent = '딱히 물어볼 게 없다.'; box.appendChild(p); }
    topics.forEach((t) => {
      if (t.requires && !st.flags[t.requires]) return;                 // 단서를 찾아야 열리는 조건부 화제
      const asked = st.seen.has('tp:' + cid + ':' + t.id);
      const fresh = !!t.requires && !asked;                            // 새로 해금된 화제 강조
      const b = document.createElement('button'); b.className = 'q-btn' + (asked ? ' asked' : '') + (fresh ? ' unlocked' : '');
      b.innerHTML = (fresh ? '🔓 ' : '') + t.label;
      b.onclick = () => { st.seen.add('tp:' + cid + ':' + t.id); if (t.give) addEvidence(t.give); if (t.set) Object.assign(st.flags, t.set); playSequence(t.lines, () => openTopics(sc, cid)); };
      box.appendChild(b);
    });
    const back = document.createElement('button'); back.className = 'q-btn back'; back.textContent = '◀ 그만 이야기한다';
    back.onclick = () => { dlg.hidden = true; renderExplore(sc); }; box.appendChild(back);
  }

  // ---------------- 추리 / 논파 (역전재판식 증거 제시) ----------------
  function playDeduction(sc) { dlgMode(true); playSequence(sc.intro || [], () => presentStep(sc, 0)); }
  function presentStep(sc, i) {
    if (i >= (sc.steps || []).length) { accusePhase(sc); return; }
    const step = sc.steps[i];
    playSequence(step.claim || [], () => {
      const dlg = $('sceneDialogue'); dlg.hidden = false; dlg.onclick = null;
      $('sdName').closest('.sd-nameplate').style.display = ''; $('sdName').textContent = '비비안'; $('sdRole').textContent = '탐정'; speak('vivian');
      $('sdText').classList.remove('narr'); typeLine($('sdText'), step.ask || '어긋난 진술을 짚어낼 단서를 제시하라.');
      const box = $('sdChoices'); box.innerHTML = '';
      const b = document.createElement('button'); b.className = 'q-btn press'; b.textContent = '🔍 증거를 제시한다';
      b.onclick = () => evidencePicker(step,
        () => playSequence(step.success || [], () => presentStep(sc, i + 1)),
        (ev) => playSequence(step.fail || failLines(ev), () => presentStep(sc, i)));
      box.appendChild(b);
    });
  }
  function failLines(ev) {
    return [{ who: 'vivian', text: `…〈${ev.name}〉? 아니야. 그건 이 모순과 맞지 않아.` }, { who: 'lily', text: '음~ 다시 한 번 생각해 봐요, 선생님!' }];
  }
  function evidencePicker(step, onCorrect, onWrong) {
    $('itemPickerTitle').textContent = '🔍 증거 제시';
    $('itemPickerHint').textContent = step.hint || '어긋난 진술을 가리키는 단서를 제시하세요.';
    const list = $('itemPickerList'); list.innerHTML = '';
    if (!st.evidence.length) list.innerHTML = `<p class="empty">제시할 단서가 없습니다.</p>`;
    st.evidence.forEach((ev) => {
      const b = document.createElement('button'); b.className = 'pick-btn';
      b.innerHTML = `<span class="pick-info"><b>${ev.name}</b> <span>${ev.desc.slice(0, 38)}…</span></span>`;
      b.onclick = () => { $('itemPicker').classList.remove('active'); if ((step.accept || []).includes(ev.id)) onCorrect(); else onWrong(ev); };
      list.appendChild(b);
    });
    $('itemPickerCancel').onclick = () => $('itemPicker').classList.remove('active');
    $('itemPicker').classList.add('active');
  }
  function accusePhase(sc) { playSequence((sc.accuse && sc.accuse.intro) || [], () => pickCulprit(sc)); }
  function pickCulprit(sc) {
    const a = sc.accuse; dlgMode(true); resetStage();
    const dlg = $('sceneDialogue'); dlg.hidden = false; dlg.onclick = null;
    $('sdName').closest('.sd-nameplate').style.display = ''; $('sdName').textContent = '비비안'; $('sdRole').textContent = '탐정'; speak('vivian');
    $('sdText').classList.remove('narr'); typeLine($('sdText'), '……진범은. 이 손가락이 가리키는 단 한 사람이다.');
    const box = $('sdChoices'); box.innerHTML = '';
    (a.suspects || []).forEach((cid) => {
      const c = cast(cid); const b = document.createElement('button'); b.className = 'q-btn press';
      b.textContent = `“${c.name}, 당신이다.”`;
      b.onclick = () => { if (cid === a.culprit) playSequence(a.win || [], () => showScene(sc.next)); else playSequence(a.wrong || [], () => pickCulprit(sc)); };
      box.appendChild(b);
    });
  }

  // ---------------- 증거 / 수첩 ----------------
  function addEvidence(ev) {
    if (st.evidenceSet.has(ev.id)) return;
    st.evidenceSet.add(ev.id); st.evidence.push(ev); toast(`🔎 단서 입수: ${ev.name}`);
    const req = PRO.deduceRequires;   // 각 용의자 핵심 단서를 다 모아야 추리 해금(없으면 개수 10)
    if (req) { if (req.every((grp) => grp.some((id) => st.evidenceSet.has(id)))) st.flags.gotKeys = true; }
    else if (st.evidence.length >= 10) st.flags.gotKeys = true;
  }
  // 사건 개요 — 진행하며 ?가 채워진다(해리스 진술 시점에 공개).
  function renderCaseInfo() {
    const known = st.flags.know_client;
    const rows = [`<div class="ci-row"><span>사건</span><b class="${known ? '' : 'ci-unknown'}">${known ? PRO.title.replace(/^프롤로그 — /, '') : '?'}</b></div>`];
    (PRO.premise || []).forEach((p) => {
      const k = p.k != null ? p.k : p[0], v = p.v != null ? p.v : p[1];
      const ok = !p.flag || st.flags[p.flag];
      rows.push(`<div class="ci-row"><span>${k}</span><b class="${ok ? '' : 'ci-unknown'}">${ok ? v : '?'}</b></div>`);
    });
    $('caseInfo').innerHTML = rows.join('');
  }
  // 대화 일지 — 단서와 별개로 오간 말을 시간순으로 남긴다.
  function renderLog() {
    const box = $('logList'); if (!box) return;
    box.innerHTML = st.dialogueLog.length
      ? st.dialogueLog.map((e) => e.narr !== undefined
        ? `<div class="log-narr">${e.narr}</div>`
        : `<div class="log-line"><b>${e.name}</b><span>${e.text}</span></div>`).join('')
      : `<p class="empty">아직 나눈 대화가 없습니다.</p>`;
    box.scrollTop = box.scrollHeight;   // 최신(맨 아래)부터 보이게
  }
  function openNotebook() {
    renderCaseInfo();
    $('notes').innerHTML = st.evidence.length
      ? st.evidence.map((e) => `<div class="note"><b>${e.name}</b><br>${e.desc}</div>`).join('')
      : `<p class="empty">아직 조사한 단서가 없습니다.</p>`;
    // 스토리 모드: 시스템이 채우던 용의자 정보(증언보드·매트릭스·도구) 섹션 숨김 — 직접 조사한 단서만.
    ['claimsBoard', 'matrixBody', 'inventory'].forEach((id) => { const sec = $(id) && $(id).closest('.nb-section'); if (sec) sec.style.display = 'none'; });
    const lb = $('openLog'); if (lb) { lb.style.display = ''; lb.textContent = `💬 대화 일지 보기 (${st.dialogueLog.length})`; }
    $('notebookPanel').classList.add('active');
  }

  // ---------------- 저장 / 불러오기 ----------------
  const SAVE_KEY = 'sotw_saves_v1';
  let slMode = 'save';
  function loadSaves() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY)); if (o && Array.isArray(o.slots)) return o; } catch (e) {} return { auto: null, slots: [null, null, null, null, null] }; }
  function writeSaves(o) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) {} }
  function serializeState() { return { flags: st.flags, evidence: st.evidence, evidenceSet: [...st.evidenceSet], seen: [...st.seen], dialogueLog: st.dialogueLog, clockMin: st.clockMin, visits: st.visits || {}, scene: st.scene, cut: st.cut || null }; }
  function reviveState(d) { return { flags: d.flags || {}, evidence: d.evidence || [], evidenceSet: new Set(d.evidenceSet || []), seen: new Set(d.seen || []), dialogueLog: d.dialogueLog || [], clockMin: d.clockMin != null ? d.clockMin : 16 * 60 + 30, visits: d.visits || {}, scene: d.scene || PRO.start, cut: d.cut || null, stage: { left: null, right: null, active: null }, _skipClock: true }; }
  function nowStr() { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
  function slotMeta() { const sc = PRO.scenes[st.scene] || {}; const inStory = sc.type === 'cutscene' || sc.type === 'deduction'; return { savedAt: nowStr(), place: sc.place || sc.title || (inStory ? (PRO.title || '').replace(/^프롤로그 — /, '') + ' (이야기 중)' : '—'), time: (PRO.date ? PRO.date + ' · ' : '') + fmtTime(st.clockMin), clue: st.evidence.length }; }
  function canSave() { return !!st && $('gameScreen').classList.contains('active') && !!PRO.scenes[st.scene]; }
  function saveToSlot(idx) { if (!st) return; const s = loadSaves(), data = { st: serializeState(), meta: slotMeta() }; if (idx === 'auto') s.auto = data; else s.slots[idx] = data; writeSaves(s); }
  function delSlot(idx) { const s = loadSaves(); if (idx === 'auto') s.auto = null; else s.slots[idx] = null; writeSaves(s); }
  function loadFromSlot(idx) {
    const s = loadSaves(), data = idx === 'auto' ? s.auto : s.slots[idx]; if (!data) return;
    $('saveLoad').classList.remove('active'); $('notebookPanel').classList.remove('active');
    st = reviveState(data.st); enterGameScreen(); showScene(st.scene || PRO.start);
  }
  function autosave() { if (canSave()) saveToSlot('auto'); }
  function openSaveLoad(mode) { slMode = mode; $('slTitle').textContent = mode === 'save' ? '💾 저장' : '📂 불러오기'; renderSlots(); $('saveLoad').classList.add('active'); }
  function renderSlots() {
    const saves = loadSaves(), rows = [];
    const make = (idx, label, data, isAuto) => {
      const info = data
        ? `<div class="sl-info"><b>${data.meta.place}</b><span>${data.meta.time} · 단서 ${data.meta.clue}</span><em>${data.meta.savedAt} 저장</em></div>`
        : `<div class="sl-info empty">— 비어 있음 —</div>`;
      const b = [];
      if (slMode === 'save' && !isAuto) b.push(`<button class="sl-btn save" data-act="save" data-idx="${idx}">${data ? '덮어쓰기' : '저장'}</button>`);
      if (data) b.push(`<button class="sl-btn load" data-act="load" data-idx="${idx}">불러오기</button>`);
      if (data && slMode === 'save' && !isAuto) b.push(`<button class="sl-btn del" data-act="del" data-idx="${idx}">삭제</button>`);
      rows.push(`<div class="sl-row ${isAuto ? 'auto' : ''}"><div class="sl-label">${label}</div>${info}<div class="sl-acts">${b.join('')}</div></div>`);
    };
    make('auto', '⏱ 자동저장', saves.auto, true);
    for (let i = 0; i < 5; i++) make(i, '슬롯 ' + (i + 1), saves.slots[i], false);
    $('slList').innerHTML = rows.join('');
    [...$('slList').querySelectorAll('.sl-btn')].forEach((btn) => {
      btn.onclick = () => {
        const act = btn.dataset.act, idx = btn.dataset.idx === 'auto' ? 'auto' : +btn.dataset.idx;
        if (act === 'save') { if (!canSave()) { toast('탐색 중에 저장할 수 있습니다.'); return; } saveToSlot(idx); renderSlots(); toast('저장했습니다.'); }
        else if (act === 'load') loadFromSlot(idx);
        else if (act === 'del') { delSlot(idx); renderSlots(); }
      };
    });
  }

  function endChapter() {
    $('dayOverlayNo').textContent = '프롤로그 — 완료';
    $('dayOverlayBrief').textContent = '「베이커 가 22번지의 모순」 해결. — 다음 무대 〈안개의 만찬회〉(본편)는 이어서 집필합니다. —';
    const ov = $('dayOverlay'); ov.classList.add('active');
    const btn = $('dayOverlayBtn'); btn.textContent = '메인으로'; btn.onclick = () => { ov.classList.remove('active'); goToTitle(); };
  }

  // ---------------- 바인딩/부팅 ----------------
  document.addEventListener('DOMContentLoaded', () => {
    $('titleStartBtn').onclick = startStory;
    $('closeNotebook') && ($('closeNotebook').onclick = () => $('notebookPanel').classList.remove('active'));
    $('notebookPanel') && ($('notebookPanel').onclick = (e) => { if (e.target.id === 'notebookPanel') $('notebookPanel').classList.remove('active'); });
    $('restartBtn2') && ($('restartBtn2').onclick = goToTitle);
    $('playAgainBtn') && ($('playAgainBtn').onclick = goToTitle);
    $('openLog') && ($('openLog').onclick = () => { $('logOverlay').classList.add('active'); renderLog(); });
    $('logClose') && ($('logClose').onclick = () => $('logOverlay').classList.remove('active'));
    $('logOverlay') && ($('logOverlay').onclick = (e) => { if (e.target.id === 'logOverlay') $('logOverlay').classList.remove('active'); });
    $('openNotebook') && ($('openNotebook').onclick = openNotebook);
    $('titleLoadBtn') && ($('titleLoadBtn').onclick = () => openSaveLoad('load'));
    $('saveBtn') && ($('saveBtn').onclick = () => openSaveLoad('save'));
    $('slClose') && ($('slClose').onclick = () => $('saveLoad').classList.remove('active'));
    $('saveLoad') && ($('saveLoad').onclick = (e) => { if (e.target.id === 'saveLoad') $('saveLoad').classList.remove('active'); });
    setInterval(autosave, 90000);
    goToTitle();
  });
})();
