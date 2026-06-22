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
  const portraitSrc = (id) => `illust/${id}.png`;
  const sceneSrc = (id) => `scenes/${id}.png`;
  const cast = (id) => PRO.cast[id];
  let st = null;
  let toastTimer = null;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }
  function showScreen(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active')); $(id).classList.add('active'); }

  function newState() { return { flags: {}, evidence: [], evidenceSet: new Set(), seen: new Set(), scene: null, stage: { left: null, right: null, active: null } }; }

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
  function setSprite(el, who) { el.hidden = !who; if (who) el.querySelector('.dlg-img').style.backgroundImage = `url('${portraitSrc(cast(who).portrait)}')`; }
  function animEnter(el) { el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); el.addEventListener('animationend', () => el.classList.remove('enter'), { once: true }); }
  // 감정 연출 — 표정 변형 일러가 없으므로 활성 입상에 무드(틴트/흔들림/강조)를 입힌다.
  const MOOD_LABEL = { anger: '분노', shock: '동요', fear: '불안', sad: '침통', despair: '절망', smug: '여유', emphasis: '확신', soft: '…', cold: '냉정' };
  const MOODS = ['anger', 'shock', 'fear', 'sad', 'despair', 'smug', 'emphasis', 'soft', 'cold'];
  function clearMoods() {
    ['dlgLeft', 'dlgRight'].forEach((id) => { const e = $(id); if (!e) return; e.classList.remove('shake', 'tremble'); const img = e.querySelector('.dlg-img'); if (img) MOODS.forEach((m) => img.classList.remove('mood-' + m)); });
  }
  function applyMood(mood) {
    clearMoods();
    $('sdDemeanor').textContent = mood ? (MOOD_LABEL[mood] || '') : '';
    if (!mood) return;
    const side = st.stage.active; if (!side) return;
    const outer = $(side === 'left' ? 'dlgLeft' : 'dlgRight'); if (!outer) return;
    const img = outer.querySelector('.dlg-img'); if (img) img.classList.add('mood-' + mood);
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

  function startStory() {
    st = newState();
    showScreen('gameScreen');
    $('mapView').hidden = true; $('sceneView').hidden = false;
    $('sceneBack').style.display = 'none';                 // 스토리는 선형 — 뒤로가기 숨김
    $('sdPortrait').style.display = 'none';                // 작은 초상 폐기 — 배경 입상 사용
    document.querySelector('.hud-mid') && (document.querySelector('.hud-mid').style.visibility = 'hidden');
    document.getElementById('accuseBtn') && (document.getElementById('accuseBtn').style.display = 'none');
    document.getElementById('dayEndBtn') && (document.getElementById('dayEndBtn').style.display = 'none');
    showScene(PRO.start);
    const f = $('storyFade'); if (f) { f.classList.remove('run'); void f.offsetWidth; f.classList.add('run'); }
  }
  function goToTitle() {
    ['overlay', 'notebookPanel', 'dayOverlay', 'logOverlay', 'itemPicker', 'accusePicker'].forEach((id) => $(id) && $(id).classList.remove('active'));
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
    setBg(sc.bg); $('sceneTitle').textContent = sc.title || '';
    if (sc.type === 'cutscene') { clearInteract(); playSequence(sc.lines, () => showScene(sc.next)); }
    else if (sc.type === 'deduction') { clearInteract(); playDeduction(sc); }
    else renderExplore(sc);
  }

  // ---------------- 대사 시퀀스(컷신·인라인 공용) ----------------
  let typing = null;
  function typeLine(el, text) { clearInterval(typing); el.textContent = ''; el.dataset.full = text; let i = 0; typing = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typing); }, 16); }
  function finishTyping(el) { if (el.dataset.full && el.textContent !== el.dataset.full) { clearInterval(typing); el.textContent = el.dataset.full; return true; } return false; }

  function playSequence(lines, after) {
    const dlg = $('sceneDialogue'); dlg.hidden = false; hideHotspots(); dlgMode(true); resetStage();
    $('sdLead') && ($('sdLead').hidden = true);
    let i = 0;
    function render() {
      const ln = lines[i]; if (ln.bg) setBg(ln.bg);
      if (ln.card) { showChapterCard(ln.card, next); return; }
      const txt = $('sdText');
      if (ln.narr !== undefined) {
        speak(null); applyMood(null);
        $('sdName').textContent = '— 상황 —'; $('sdRole').textContent = '';
        txt.classList.add('narr'); typeLine(txt, ln.narr);
      } else {
        const c = cast(ln.who); speak(ln.who); applyMood(ln.mood);
        $('sdName').textContent = c.name; $('sdRole').textContent = c.role;
        txt.classList.remove('narr'); typeLine(txt, ln.text);
      }
      const last = i >= lines.length - 1;
      $('sdChoices').innerHTML = `<button class="q-btn primary" id="seqNext">${last ? '▶ 닫기' : '▶ 계속'}</button>`;
      $('seqNext').onclick = next;
    }
    function next() { const txt = $('sdText'); if (finishTyping(txt)) return; i++; if (i >= lines.length) { dlg.onclick = null; $('sdChoices').innerHTML = ''; if (after) after(); else { dlg.hidden = true; } } else render(); }
    dlg.onclick = next; render();
  }

  // ---------------- 탐색 씬 ----------------
  function renderExplore(sc) {
    const dlg = $('sceneDialogue'); dlg.hidden = true; dlg.onclick = null; dlgMode(false);
    // 인물
    const npcBox = $('sceneNpcs'); npcBox.innerHTML = ''; npcBox.classList.remove('talking');
    npcBox.classList.toggle('empty', !(sc.present && sc.present.length));
    (sc.present || []).forEach((cid) => {
      const c = cast(cid);
      const el = document.createElement('div'); el.className = 'scene-npc'; el.dataset.cid = cid;
      el.innerHTML = `<div class="snpc-sprite" style="background-image:url('${portraitSrc(c.portrait)}')"></div>` +
        `<div class="snpc-tag"><b>${c.name}</b><span>${c.role}</span><em>이야기한다</em></div>`;
      el.onclick = () => openTopics(sc, cid);
      npcBox.appendChild(el);
    });
    // 조사 핫스팟
    renderHotspots(sc.hotspots || []);
    // 행동/이동
    const bar = $('sceneActionbar'); bar.innerHTML = '';
    (sc.actions || []).forEach((a) => {
      if (a.requires && !st.flags[a.requires]) return;
      const b = document.createElement('button'); b.className = 'primary'; b.textContent = a.label;
      b.onclick = () => { if (a.set) Object.assign(st.flags, a.set); if (a.goto) showScene(a.goto); };
      bar.appendChild(b);
    });
    if (sc.hint && (sc.actions || []).every((a) => a.requires && !st.flags[a.requires])) {
      const h = document.createElement('div'); h.className = 'scene-hint'; h.textContent = '💡 ' + sc.hint; bar.appendChild(h);
    }
    const nb = document.createElement('button'); nb.className = 'ghost'; nb.textContent = '🗒 수첩'; nb.onclick = openNotebook; bar.appendChild(nb);
    // 입장 만담(1회)
    const enterKey = sc.title + ':onEnter';
    if (sc.onEnter && !st.seen.has(enterKey)) { st.seen.add(enterKey); playSequence(sc.onEnter, () => renderExplore(sc)); }
  }

  // 조사 핫스팟
  function renderHotspots(list) {
    const box = $('sceneHotspots'); if (!box) return;
    if (!list.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<div class="hs-title">🔍 조사</div>` + list.map((h) => {
      const seen = st.seen.has('hs:' + h.id);
      return `<button class="hs-btn ${seen ? 'seen' : ''} ${h.key ? 'key' : ''}" data-hs="${h.id}">${seen ? '· ' : ''}${h.label}</button>`;
    }).join('');
    [...box.querySelectorAll('.hs-btn')].forEach((b) => { b.onclick = () => doHotspot(list.find((h) => h.id === b.dataset.hs)); });
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
    playSequence(lines, () => renderExplore(sc));
  }

  // 인물 화제
  function openTopics(sc, cid) {
    const c = cast(cid); const topics = (sc.topics && sc.topics[cid]) || [];
    const dlg = $('sceneDialogue'); dlg.hidden = false; dlg.onclick = null; dlgMode(true); resetStage(); speak(cid);
    $('sdName').textContent = c.name; $('sdRole').textContent = c.role; $('sdDemeanor').textContent = '';
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
      $('sdName').textContent = '비비안'; $('sdRole').textContent = '탐정'; speak('vivian');
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
    $('sdName').textContent = '비비안'; $('sdRole').textContent = '탐정'; speak('vivian');
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
  function addEvidence(ev) { if (st.evidenceSet.has(ev.id)) return; st.evidenceSet.add(ev.id); st.evidence.push(ev); toast(`🔎 단서 입수: ${ev.name}`); if (st.evidence.length >= 10) st.flags.gotKeys = true; }
  function openNotebook() {
    $('caseInfo').innerHTML = `<div class="ci-row"><span>사건</span><b>${PRO.title.replace(/^프롤로그 — /, '')}</b></div>` +
      (PRO.premise || []).map(([k, v]) => `<div class="ci-row"><span>${k}</span><b>${v}</b></div>`).join('');
    $('notes').innerHTML = st.evidence.length
      ? st.evidence.map((e) => `<div class="note"><b>${e.name}</b><br>${e.desc}</div>`).join('')
      : `<p class="empty">아직 조사한 단서가 없습니다.</p>`;
    // 스토리 모드: 시스템이 채우던 용의자 정보(증언보드·매트릭스·도구) 섹션 숨김 — 직접 조사한 단서만.
    ['claimsBoard', 'matrixBody', 'inventory'].forEach((id) => { const sec = $(id) && $(id).closest('.nb-section'); if (sec) sec.style.display = 'none'; });
    const lb = $('openLog'); if (lb) lb.style.display = 'none';
    $('notebookPanel').classList.add('active');
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
    $('openLog') && ($('openLog').style.display = 'none');
    $('openNotebook') && ($('openNotebook').onclick = openNotebook);
    goToTitle();
  });
})();
