/* =======================================================
 *  미스터리 추리게임 — 게임 로직 v5 (game.js)
 *
 *  시간 모델: 하루 = 아침·점심·저녁 3슬롯, 3일 = 총 9슬롯.
 *   한 슬롯 = 한 장소에서 "현장 수색" 하나 또는 "NPC에게 질문" 하나.
 *   질문 하나를 고르면 답을 듣고 시간이 흐른다(다른 질문은 다음 슬롯에).
 *   '심문 종료' 없음. 모든 걸 다 할 수 없으니 선택이 중요.
 *  추리 코어(동기·기회·수단 / 거짓말 적발 / 도구 / 등급)는 동일.
 * ======================================================= */
(function () {
  'use strict';

  const { generateCase } = window.MysteryEngine;
  const FALLBACK_PORTRAITS = ['aria','biblia','cardista','chariot','chronia','devil','elementia','empress','fool','gravitas','hierophant','justice','levina','lovers','luna','magician','marine','merchant','misaki','sakura','solar','star','strength','sumika','sun','wheel','world'];
  const PERIODS = ['아침', '점심', '저녁'];
  let portraitPool = FALLBACK_PORTRAITS.slice();
  let state = null;

  const $ = (id) => document.getElementById(id);
  function show(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active')); $(id).classList.add('active'); }
  let toastTimer = null;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }
  const portraitSrc = (id) => `illust/${id}.png`;
  const sceneSrc = (id) => `scenes/${id}.png`;
  const S = () => state.caseData.suspects;
  const L = () => state.caseData.locations;

  // ----------------------------- 상태 -----------------------------
  function newState(caseData) {
    const matrix = {}, claims = {}, asked = {};
    caseData.suspects.forEach((s) => {
      matrix[s.id] = { motive: undefined, opportunity: undefined, means: undefined };
      claims[s.id] = { alibiClaim: null, lieDetected: null };
      asked[s.id] = new Set();
    });
    return {
      caseData, matrix, claims, asked,
      notes: [], noteSet: new Set(),
      searched: new Set(), interrogated: new Set(), revealed: new Set(),
      caughtLies: new Set(), takenItems: new Set(),
      items: Object.keys(caseData.itemDefs).reduce((o, k) => (o[k] = 0, o), {}),
      day: 1, period: 0, timeUp: false, curLoc: null, dialogueId: null,
      accusedPick: null, finished: false,
    };
  }
  const isLastDay = () => state.day >= state.caseData.days;
  const isLastSlot = () => isLastDay() && state.period >= PERIODS.length - 1;
  const hasItem = (id) => state.items[id] > 0;

  // ----------------------------- 부팅/사건 -----------------------------
  async function loadPortraits() {
    try { const r = await fetch('illust/manifest.json?v=' + Date.now()); if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.portraits) && j.portraits.length) portraitPool = j.portraits; } } catch (e) {}
  }
  function startNewCase() {
    state = newState(generateCase({ portraits: portraitPool }));
    renderBriefing();
    ['overlay','itemPicker','accusePicker','dayOverlay','notebookPanel'].forEach((id) => $(id).classList.remove('active'));
    $('sceneView').hidden = true; $('mapView').hidden = false; $('sceneDialogue').hidden = true; $('sceneFound').hidden = true;
    show('introScreen');
  }
  function goToTitle() {
    ['overlay', 'itemPicker', 'accusePicker', 'dayOverlay', 'notebookPanel'].forEach((id) => $(id).classList.remove('active'));
    $('sceneView').hidden = true; $('mapView').hidden = false; $('sceneDialogue').hidden = true; $('sceneFound').hidden = true;
    show('titleScreen');
  }
  function renderBriefing() {
    const c = state.caseData;
    const n = 100 + Math.floor((c.victim.name.charCodeAt(0) + c.weapon.length * 7) % 900);
    $('caseNo').textContent = `CASE FILE No. ${n}`;
    $('caseTitle').textContent = `${c.victim.name} ${c.victim.title} 살인사건`;
    $('caseScene').textContent = c.crimeScene.intro;
    $('caseFacts').innerHTML = [['피해자', `${c.victim.name} (${c.victim.title})`], ['발견 장소', c.crimeScene.name], ['흉기', c.weapon], ['추정 시각', c.time], ['수사 기간', `${c.days}일 · 하루 ${PERIODS.length}회`]]
      .map(([k, v]) => `<div class="fact"><span>${k}</span><b>${v}</b></div>`).join('');
  }
  function startInvestigation() {
    state.day = 1; state.period = 0; state.timeUp = false; state.curLoc = null;
    show('gameScreen'); $('mapView').hidden = false; $('sceneView').hidden = true;
    openDayInterstitial(1, renderMap);
  }
  function openDayInterstitial(day, after) {
    $('dayOverlayNo').textContent = `${day}일차 아침`;
    $('dayOverlayBrief').textContent = state.caseData.dayBriefs[day - 1] || '';
    const ov = $('dayOverlay'); ov.classList.add('active');
    const btn = $('dayOverlayBtn'); btn.textContent = '수사 시작';
    btn.onclick = () => { ov.classList.remove('active'); if (after) after(); };
  }
  function openTimeUpOverlay() {
    $('dayOverlayNo').textContent = '수사 종료';
    $('dayOverlayBrief').textContent = '주어진 시간이 모두 흘렀다. 수첩을 마지막으로 점검하고 진범을 지목하라.';
    const ov = $('dayOverlay'); ov.classList.add('active');
    const btn = $('dayOverlayBtn'); btn.textContent = '진범 지목하기';
    btn.onclick = () => { ov.classList.remove('active'); openAccusePicker(); };
  }

  // ----------------------------- 시간 -----------------------------
  function commitAction() {
    // 한 슬롯 소비 → 시간 경과
    if (state.period < PERIODS.length - 1) { state.period++; backToMap(); return; }
    // 저녁 종료 → 다음 날 / 또는 수사 종료
    if (isLastDay()) { state.timeUp = true; backToMap(); openTimeUpOverlay(); return; }
    state.day++; state.period = 0; backToMap(); openDayInterstitial(state.day, renderMap);
  }

  // ----------------------------- 공통 렌더 -----------------------------
  function renderHud() {
    $('dayNow').textContent = state.day; $('dayTotal').textContent = state.caseData.days;
    $('periodLabel').textContent = state.timeUp ? '수사 종료' : PERIODS[state.period];
    const dots = $('periodDots'); dots.innerHTML = '';
    for (let i = 0; i < PERIODS.length; i++) { const d = document.createElement('i'); d.className = 'pdot' + (i < state.period ? ' past' : (i === state.period && !state.timeUp ? ' now' : '')); dots.appendChild(d); }
    $('clueCount').textContent = state.noteSet.size;
  }
  function refreshNotebook() { renderClaims(); renderMatrix(); renderInventory(); renderNotes(); }

  // ----------------------------- 평면도 맵 -----------------------------
  function renderMap() {
    renderHud();
    $('mapDayHint').textContent = `· ${state.day}일차 ${state.timeUp ? '수사 종료' : PERIODS[state.period]}`;
    const fp = $('floorplan'); fp.innerHTML = '';
    L().forEach((loc, i) => {
      const locked = loc.day > state.day;
      const searched = state.searched.has(loc.id);
      const occ = loc.occupants.map((id) => S()[id]);
      const room = document.createElement('div');
      room.className = 'room' + (locked ? ' locked' : '') + (loc.isCrimeScene ? ' crime' : '') + (searched ? ' searched' : '');
      room.style.gridArea = 'r' + (i + 1);
      room.dataset.scene = loc.sceneId;
      const figs = occ.map((s) => `<span class="room-fig ${state.interrogated.has(s.id) ? 'done' : ''}" style="background-image:url('${portraitSrc(s.portrait)}')" title="${s.name}"></span>`).join('');
      const foot = locked ? `🔒 ${loc.day}일차` : (searched ? `<span class="ok">✓ 수색</span>` : `<span class="todo">미수색</span>`) + (occ.length ? ` · 👤${occ.length}` : '');
      room.innerHTML =
        `<div class="room-bg" style="background-image:url('${sceneSrc(loc.sceneId)}'), linear-gradient(150deg,#241d18,#15120f)"></div>` +
        (loc.isCrimeScene ? `<div class="room-crime">현장</div>` : '') +
        `<div class="room-figs">${figs}</div>` +
        `<div class="room-info"><div class="room-name">${loc.name}</div><div class="room-foot">${foot}</div></div>` +
        (locked ? `<div class="room-lockicon">🔒</div>` : '');
      room.onclick = locked ? () => toast(`${loc.day}일차가 되어야 들어갈 수 있습니다.`) : () => openLocation(loc.id);
      fp.appendChild(room);
    });
  }

  // ----------------------------- 장소 씬 -----------------------------
  function openLocation(id) {
    if (state.timeUp) { toast('주어진 시간이 다 됐습니다. 진범을 지목하세요.'); return; }
    state.curLoc = id; state.dialogueId = null;
    $('sceneDialogue').hidden = true; $('sceneFound').hidden = true;
    $('mapView').hidden = true; $('sceneView').hidden = false;
    renderScene();
  }
  function backToMap() {
    state.curLoc = null; state.dialogueId = null;
    $('sceneDialogue').hidden = true; $('sceneFound').hidden = true;
    $('sceneView').hidden = true; $('mapView').hidden = false;
    renderMap();
  }
  function pendingPrint(loc) { return loc.clues.find((c) => c.gated === 'fingerprint_kit' && !state.revealed.has(c)); }

  function renderScene() {
    if (state.curLoc === null) return;
    const loc = L().find((l) => l.id === state.curLoc); if (!loc) return;
    const occupants = loc.occupants.map((id) => S()[id]);
    const searched = state.searched.has(loc.id);
    const bg = $('sceneBg'); bg.style.backgroundImage = `url('${sceneSrc(loc.sceneId)}'), linear-gradient(160deg,#262019,#14110e)`; bg.dataset.scene = loc.sceneId;
    $('sceneTitle').textContent = loc.name + (loc.isCrimeScene ? ' — 범행 현장' : '');

    const npcBox = $('sceneNpcs'); npcBox.innerHTML = ''; npcBox.classList.remove('talking');
    npcBox.classList.toggle('empty', occupants.length === 0);
    if (!occupants.length) npcBox.innerHTML = `<div class="scene-empty">이곳엔 아무도 없다. 현장을 수색할 수 있다.</div>`;
    occupants.forEach((s) => {
      const el = document.createElement('div');
      el.className = 'scene-npc' + (state.caughtLies.has(s.id) ? ' liar' : '');
      el.dataset.sid = s.id;
      const remain = 3 - state.asked[s.id].size;
      el.innerHTML =
        (state.caughtLies.has(s.id) ? `<div class="snpc-lie">거짓말 적발</div>` : '') +
        `<div class="snpc-sprite" style="background-image:url('${portraitSrc(s.portrait)}')"></div>` +
        `<div class="snpc-tag"><b>${s.name}</b><span>${s.role}</span><em>${state.interrogated.has(s.id) ? `심문 (남은 질문 ${remain})` : '심문하기'}</em></div>`;
      el.onclick = () => openDialogue(s.id);
      npcBox.appendChild(el);
    });

    const bar = $('sceneActionbar'); bar.innerHTML = '';
    const mk = (label, cls, fn) => { const b = document.createElement('button'); b.className = cls; b.textContent = label; b.onclick = fn; bar.appendChild(b); };
    if (!searched) mk('🔍 현장 수색 (시간 1)', 'primary', () => doSearch(loc.id));
    else mk('🔎 발견 단서 다시 보기', 'ghost', () => openFound(false));
    mk('🗒 수첩', 'ghost', openNotebook);
    renderHud();
  }

  // ----------------------------- 수색/단서 -----------------------------
  function applyClue(loc, c) {
    state.revealed.add(c);
    const sid = c.reveal.suspectId;
    const text = `【${loc.name}】 ` + c.text;
    if (!state.noteSet.has(text)) { state.noteSet.add(text); state.notes.unshift(text); }
    if (c.reveal.attr === 'opportunity') tryResolveOpp(sid); // 기회는 심문(알리바이)으로만 확정
    else state.matrix[sid][c.reveal.attr] = c.reveal.value;
  }
  const askedAlibi = (sid) => state.asked[sid] && state.asked[sid].has('alibi');
  // 기회(알리바이의 진실/거짓)는 ① 그 인물의 알리바이를 심문해 듣고 ② 현장 흔적을 찾았을 때만 확정.
  function tryResolveOpp(sid) {
    if (state.matrix[sid].opportunity !== undefined) return;
    if (!askedAlibi(sid)) return;
    const c = [...state.revealed].find((x) => x.reveal && x.reveal.attr === 'opportunity' && x.reveal.suspectId === sid);
    if (!c) return;
    state.matrix[sid].opportunity = c.reveal.value;
    if (c.breaksLie && !state.caughtLies.has(sid)) { state.caughtLies.add(sid); toast(`🔴 ${S()[sid].name}의 거짓말 적발! 알리바이 주장이 현장 물증과 모순됩니다.`); }
    else if (c.reveal.value === true) toast(`${S()[sid].name}은(는) 그 시각 현장에 있었다 — 기회 확인.`);
    else toast(`${S()[sid].name}의 알리바이가 물증으로 확인됐다 (결백 정황).`);
  }
  function doSearch(locId) {
    const loc = L().find((l) => l.id === locId);
    state.searched.add(locId);
    let gotItem = null;
    loc.clues.forEach((c) => { if (c.gated === 'fingerprint_kit') { if (hasItem('fingerprint_kit')) applyClue(loc, c); } else applyClue(loc, c); });
    loc.items.forEach((id) => { const key = loc.id + ':' + id; if (!state.takenItems.has(key)) { state.takenItems.add(key); state.items[id]++; gotItem = state.caseData.itemDefs[id]; } });
    refreshNotebook();
    if (gotItem) toast(`${gotItem.icon} 도구 발견: ${gotItem.name}!`);
    openFound(true); // 수색 결과 — 확인 시 시간 경과
  }
  function openFound(commit) {
    const loc = L().find((l) => l.id === state.curLoc); if (!loc) return;
    const shown = loc.clues.filter((c) => state.revealed.has(c));
    const lockedPrint = pendingPrint(loc);
    let html = shown.map((c) => {
      const isOpp = c.reveal && c.reveal.attr === 'opportunity';
      const resolved = isOpp ? state.matrix[c.reveal.suspectId].opportunity !== undefined : true;
      const broke = isOpp && resolved && c.breaksLie && state.caughtLies.has(c.reveal.suspectId);
      const icon = c.type === 'motive' ? '📜' : c.type === 'means' ? '🗡️' : c.type === 'fingerprint' ? '🔬' : '👣';
      let extra = '';
      if (broke) extra = ' <b class="ctr">— 증언과 모순!</b>';
      else if (isOpp && !resolved) extra = ` <b class="need-q">— ${S()[c.reveal.suspectId].name}을(를) 심문해 알리바이를 들어야 확정</b>`;
      return `<div class="found-clue ${broke ? 'contradiction' : ''} ${c.type === 'fingerprint' ? 'print' : ''} ${isOpp && !resolved ? 'pending' : ''}">${icon} ${c.text}${extra}</div>`;
    }).join('');
    if (lockedPrint) html += hasItem('fingerprint_kit')
      ? `<div class="found-clue locked-print">🔬 흉기에 지문이 남아 있다. <button class="mini-btn" id="dustBtn">지문 감식</button></div>`
      : `<div class="found-clue locked-print">🔬 흉기에 지문이 보이지만, <b>감식 키트</b>가 있어야 채취할 수 있다.</div>`;
    if (!shown.length && !lockedPrint) html = `<div class="found-clue muted">이렇다 할 단서가 없었다.</div>`;
    $('sceneFoundList').innerHTML = html;
    const d = $('dustBtn'); if (d) d.onclick = () => doDust(loc.id);
    const foot = $('sceneFoundFoot'); foot.innerHTML = '';
    const b = document.createElement('button');
    if (commit) { b.className = 'primary'; b.textContent = '▶ 확인 (시간이 흐른다)'; b.onclick = commitAction; }
    else { b.className = 'ghost'; b.textContent = '닫기'; b.onclick = () => { $('sceneFound').hidden = true; }; }
    foot.appendChild(b);
    $('sceneFound').hidden = false;
  }
  function doDust(locId) {
    const loc = L().find((l) => l.id === locId); const c = pendingPrint(loc);
    if (!c || !hasItem('fingerprint_kit')) { toast('지문 감식 키트가 필요합니다.'); return; }
    applyClue(loc, c); toast('🔬 지문을 채취했다!'); refreshNotebook();
    openFound(!state.searched.has(locId) ? true : ($('sceneFoundFoot').querySelector('.primary') ? true : false));
  }

  // ----------------------------- 심문 (질문 1개 = 1슬롯) -----------------------------
  let typingTimer = null;
  function typeLine(el, text) { clearInterval(typingTimer); el.textContent = ''; el.dataset.full = text; let i = 0; typingTimer = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typingTimer); }, 16); }
  function finishTyping(el) { if (el.dataset.full && el.textContent !== el.dataset.full) { clearInterval(typingTimer); el.textContent = el.dataset.full; return true; } return false; }
  function setDemeanor(s) {
    const cl = state.claims[s.id]; const dm = { calm: '침착함', nervous: '불안해 보임', evasive: '회피하는 태도' };
    const el = $('sdDemeanor');
    el.textContent = cl.lieDetected === true ? '📟 거짓 반응 감지' : cl.lieDetected === false ? '📟 진실 반응' : (dm[s.demeanor] || '');
    el.className = 'sd-demeanor' + (cl.lieDetected === true ? ' lie' : '');
  }
  function pressSucceeds(s) { const cl = state.claims[s.id]; return s.alibiTruth === 'lie' && (cl.lieDetected === true || state.matrix[s.id].opportunity === true); }

  function openDialogue(id) {
    const s = S()[id];
    state.dialogueId = id;
    $('sdName').textContent = s.name; $('sdRole').textContent = s.role; setDemeanor(s);
    $('sdPortrait').style.backgroundImage = `url('${portraitSrc(s.portrait)}')`; $('sdFallback').textContent = s.name[0];
    const txt = $('sdText');
    typeLine(txt, state.interrogated.has(id) ? '(다시 마주 앉는다.) …또 무엇이 궁금하십니까.' : s.dialogue.intro);
    txt.onclick = () => finishTyping(txt);
    $('sdLead').hidden = true; $('sdLead').innerHTML = '';
    renderQuestionChoices(s);
    $('sceneDialogue').hidden = false;
    const box = $('sceneNpcs'); box.classList.add('talking');
    [...box.children].forEach((el) => el.classList.toggle('active', +el.dataset.sid === id));
  }
  function renderQuestionChoices(s) {
    const box = $('sdChoices'); box.innerHTML = ''; const cl = state.claims[s.id]; const asked = state.asked[s.id];
    const mk = (label, cls, fn, dis) => { const b = document.createElement('button'); b.className = 'q-btn ' + (cls || ''); b.innerHTML = label; b.disabled = !!dis; if (!dis) b.onclick = fn; box.appendChild(b); };
    const T = s.dialogue.topics;
    mk(T.alibi.q + (asked.has('alibi') ? ' ✓' : ''), '', () => askQuestion(s, 'alibi'), asked.has('alibi'));
    mk(T.relation.q + (asked.has('relation') ? ' ✓' : ''), '', () => askQuestion(s, 'relation'), asked.has('relation'));
    mk(T.weapon.q + (asked.has('weapon') ? ' ✓' : ''), '', () => askQuestion(s, 'weapon'), asked.has('weapon'));
    mk(s.dialogue.press.q, 'press', () => askPress(s));
    if (hasItem('lie_detector') && cl.lieDetected === null) mk('📟 거짓말 탐지기 사용', 'tool', () => askLieDetector(s));
    mk('◀ 그만두기 (시간 안 감)', 'back', backToMap);
  }
  // 답을 보여주고 → '확인'으로 시간 경과
  function showAnswer(s, text, lead) {
    state.interrogated.add(s.id);
    const txt = $('sdText'); typeLine(txt, text);
    const box = $('sdLead');
    if (lead) { box.hidden = false; box.innerHTML = `<span class="lead-tag">목격 증언</span> ${lead.text}`; } else box.hidden = true;
    const ch = $('sdChoices'); ch.innerHTML = '';
    const b = document.createElement('button'); b.className = 'q-btn primary'; b.textContent = '▶ 확인 (시간이 흐른다)'; b.onclick = commitAction; ch.appendChild(b);
    refreshNotebook();
  }
  function askQuestion(s, qid) {
    state.asked[s.id].add(qid);
    const T = s.dialogue.topics[qid];
    if (qid === 'alibi') { state.claims[s.id].alibiClaim = T.claim; tryResolveOpp(s.id); }
    showAnswer(s, T.a, qid === 'alibi' ? s.dialogue.lead : null);
  }
  function askPress(s) {
    if (pressSucceeds(s)) {
      state.matrix[s.id].opportunity = true;
      if (!state.caughtLies.has(s.id)) { state.caughtLies.add(s.id); toast(`🔴 ${s.name}의 거짓말을 추궁으로 무너뜨렸다!`); }
      showAnswer(s, s.dialogue.press.success, null);
    } else { toast('근거가 부족해 추궁이 통하지 않았다. 물증이나 탐지기가 필요하다.'); showAnswer(s, s.dialogue.press.fail, null); }
  }
  function askLieDetector(s) {
    state.items.lie_detector--; state.claims[s.id].lieDetected = s.alibiTruth !== 'real'; setDemeanor(s);
    toast('📟 거짓말 탐지기를 사용했다.');
    showAnswer(s, state.claims[s.id].lieDetected ? '(탐지기 바늘이 거칠게 튄다 — 이 사람, 무언가 숨기고 있다.)' : '(탐지기 바늘이 잔잔하다 — 지금 진술은 진실로 보인다.)', null);
  }

  // ----------------------------- 수첩 -----------------------------
  function openNotebook() { refreshNotebook(); $('notebookPanel').classList.add('active'); }
  function closeNotebook() { $('notebookPanel').classList.remove('active'); }
  function renderClaims() {
    const box = $('claimsBoard'); const heard = S().filter((s) => state.interrogated.has(s.id));
    if (!heard.length) { box.innerHTML = `<p class="empty">아직 들은 증언이 없습니다.</p>`; return; }
    box.innerHTML = heard.map((s) => {
      const cl = state.claims[s.id]; const caught = state.caughtLies.has(s.id);
      const alibi = cl.alibiClaim ? `주장: <b>${cl.alibiClaim}</b>` : '알리바이 미확인';
      const tag = caught ? `<span class="claim-flag">🔴 거짓 판명</span>` : cl.lieDetected === true ? `<span class="claim-flag">📟 거짓 반응</span>` : cl.lieDetected === false ? `<span class="claim-believed">📟 진실</span>` : '';
      return `<div class="claim-row ${caught ? 'lie' : ''}"><div class="claim-nm">${s.name}</div><div class="claim-body">${alibi} ${tag}</div></div>`;
    }).join('');
  }
  function renderMatrix() {
    const tbody = $('matrixBody'); tbody.innerHTML = '';
    S().forEach((s) => {
      const m = state.matrix[s.id]; const tr = document.createElement('tr');
      if (state.accusedPick === s.id) tr.className = 'is-culprit-guess';
      const liar = state.caughtLies.has(s.id) ? ' 🔴' : '';
      tr.innerHTML = `<td class="nm">${s.name}${liar}</td>` + cell(m.motive) + cell(m.opportunity) + cell(m.means);
      tbody.appendChild(tr);
    });
  }
  const cell = (v) => v === true ? `<td><span class="mk guilty">✓</span></td>` : v === false ? `<td><span class="mk clear">✗</span></td>` : `<td><span class="mk unknown">?</span></td>`;

  const INV_USABLE = ['revealMotive', 'revealMeans', 'revealOpportunity', 'unlock'];
  const CAPATTR = { revealMotive: 'motive', revealMeans: 'means', revealOpportunity: 'opportunity' };
  const HASFIELD = { motive: 'hasMotive', means: 'hasMeans', opportunity: 'hasOpportunity' };
  const ATTR_KO = { motive: '동기', means: '수단', opportunity: '기회' };
  function renderInventory() {
    const box = $('inventory'); const defs = state.caseData.itemDefs;
    const owned = Object.keys(state.items).filter((k) => state.items[k] > 0);
    if (!owned.length) { box.innerHTML = `<p class="empty">아직 발견한 도구가 없습니다.</p>`; return; }
    box.innerHTML = owned.map((k) => {
      const d = defs[k]; const cnt = d.consumable ? ` ×${state.items[k]}` : '';
      const useBtn = INV_USABLE.includes(d.use) ? `<button class="inv-use" data-item="${k}">사용</button>` : d.use === 'interrogation' ? `<span class="inv-hint">심문 중 사용</span>` : d.use === 'crimeScene' ? `<span class="inv-hint">현장에서 사용</span>` : '';
      return `<div class="inv-item"><span class="inv-icon">${d.icon}</span><div class="inv-meta"><b>${d.name}${cnt}</b><div class="inv-desc">${d.desc}</div></div>${useBtn}</div>`;
    }).join('');
    [...box.querySelectorAll('.inv-use')].forEach((b) => { b.onclick = () => openItemPicker(b.dataset.item); });
  }
  function openItemPicker(itemId) {
    if (!state.items[itemId]) return;
    const d = state.caseData.itemDefs[itemId]; const ov = $('itemPicker'), list = $('itemPickerList');
    $('itemPickerTitle').textContent = `${d.icon} ${d.name}`; list.innerHTML = '';
    if (d.use === 'unlock') {
      $('itemPickerHint').textContent = '지금 열고 들어갈 잠긴 장소를 고르세요. (시간은 흐르지 않습니다)';
      const locked = L().filter((l) => l.day > state.day);
      if (!locked.length) list.innerHTML = `<p class="empty">잠긴 장소가 없습니다.</p>`;
      locked.forEach((l) => { const b = document.createElement('button'); b.className = 'pick-btn'; b.innerHTML = `<b>${l.name}</b> <span>${l.day}일차 구역</span>`; b.onclick = () => { l.day = state.day; state.items[itemId]--; toast(`🗝️ ${l.name}을(를) 열었다.`); closeItemPicker(); renderMap(); }; list.appendChild(b); });
    } else {
      const attr = CAPATTR[d.use], label = ATTR_KO[attr];
      $('itemPickerHint').textContent = `${label}을(를) 밝힐 인물을 고르세요. (시간은 흐르지 않습니다)`;
      S().forEach((s) => { const known = state.matrix[s.id][attr] !== undefined; const b = document.createElement('button'); b.className = 'pick-btn' + (known ? ' known' : ''); b.innerHTML = `<span class="pick-av" style="background-image:url('${portraitSrc(s.portrait)}')"></span><span class="pick-info"><b>${s.name}</b> <span>${s.role}${known ? ' · 이미 판명' : ''}</span></span>`; b.onclick = () => { revealAttr(s, attr); state.items[itemId]--; toast(`${d.icon} ${s.name}의 ${label}을(를) 밝혔다.`); closeItemPicker(); refreshNotebook(); }; list.appendChild(b); });
    }
    $('itemPickerCancel').onclick = closeItemPicker; ov.classList.add('active');
  }
  function closeItemPicker() { $('itemPicker').classList.remove('active'); }
  function revealAttr(s, attr) {
    const value = s[HASFIELD[attr]]; state.matrix[s.id][attr] = value;
    const text = `【도구】 ${s.name}의 ${ATTR_KO[attr]}: ${value ? '있음 ✓' : '없음 ✗'}`;
    if (!state.noteSet.has(text)) { state.noteSet.add(text); state.notes.unshift(text); }
    if (attr === 'opportunity' && value === true && s.alibiTruth === 'lie' && state.interrogated.has(s.id) && !state.caughtLies.has(s.id)) { state.caughtLies.add(s.id); toast(`🔴 ${s.name}의 거짓말 적발!`); }
  }
  function renderNotes() { const box = $('notes'); box.innerHTML = state.notes.length ? state.notes.map((t) => `<div class="note">${t}</div>`).join('') : `<p class="empty">아직 수집한 단서가 없습니다.</p>`; }

  // ----------------------------- 지목/판정 -----------------------------
  function toggleAccuseMode() { if (state.finished) return; state.accusedPick = null; if (state.curLoc !== null) backToMap(); openAccusePicker(); }
  function openAccusePicker() {
    const ov = $('accusePicker'), grid = $('accuseGrid'); grid.innerHTML = '';
    S().forEach((s) => {
      const card = document.createElement('div');
      card.className = 'acc-card' + (state.accusedPick === s.id ? ' picked' : '') + (state.caughtLies.has(s.id) ? ' liar' : '');
      card.innerHTML = `<div class="acc-av" style="background-image:url('${portraitSrc(s.portrait)}')"><span>${s.name[0]}</span></div><div class="acc-nm">${s.name}</div><div class="acc-ro">${s.role}</div>` + (state.caughtLies.has(s.id) ? `<div class="acc-lie">거짓말 적발</div>` : '');
      card.onclick = () => { state.accusedPick = s.id; openAccusePicker(); };
      grid.appendChild(card);
    });
    $('accuseConfirm').disabled = state.accusedPick === null;
    $('accuseConfirm').onclick = () => { if (state.accusedPick !== null) { ov.classList.remove('active'); resolve(state.accusedPick); } };
    $('accuseCancel').onclick = () => ov.classList.remove('active');
    ov.classList.add('active');
  }
  function gradeFor(win, p) { if (!win) return null; const k = (p.motive ? 1 : 0) + (p.opportunity ? 1 : 0) + (p.means ? 1 : 0); return k === 3 && p.lieCaught ? 'S' : k === 3 ? 'A' : k === 2 ? 'B' : 'C'; }
  function resolve(accusedId) {
    state.finished = true; const c = state.caseData;
    const culprit = c.suspects.find((s) => s.id === c.culpritId);
    const accused = c.suspects.find((s) => s.id === accusedId);
    const win = accusedId === c.culpritId; const m = state.matrix[culprit.id];
    const p = { motive: m.motive === true, opportunity: m.opportunity === true, means: m.means === true, lieCaught: state.caughtLies.has(culprit.id) };
    const v = $('verdict'); v.className = 'verdict ' + (win ? 'win' : 'lose');
    $('verdictStamp').textContent = win ? '사건 해결' : '오판 — 진범 도주';
    const g = gradeFor(win, p);
    if (g) { $('verdictGrade').textContent = '등급 ' + g; $('verdictGrade').style.display = ''; } else $('verdictGrade').style.display = 'none';
    const reveal = `<b>${culprit.name}</b>(${culprit.role})이(가) 진범이었습니다. ${c.victim.name}와(과) ${culprit.motiveReason} 살의를 품었고<b>(동기)</b>, ${c.time}의 알리바이를 거짓으로 꾸며댔으며<b>(기회)</b>, ${c.weapon}을(를) 자유로이 다룰 수 있었습니다<b>(수단)</b>.`;
    let body;
    if (win) {
      const pl = [p.motive ? '동기 ✓' : '동기 ✗', p.opportunity ? '기회 ✓' : '기회 ✗', p.means ? '수단 ✓' : '수단 ✗', p.lieCaught ? '거짓말 적발 ✓' : '거짓말 미적발'].join(' · ');
      body = `명탐정의 직관이 적중했습니다. ${reveal}<div class="proof-line">입증 내역 — ${pl}</div>` + (g === 'S' ? '<div class="proof-line gold">완벽한 입증입니다. 빠져나갈 구멍이 없었습니다.</div>' : g === 'C' ? '<div class="proof-line">다만 결정적 증거가 부족했습니다. 운이 따랐군요.</div>' : '');
    } else body = `당신이 지목한 <b>${accused.name}</b>은(는) 결백했습니다. 진실은 따로 있었습니다 — ${reveal}`;
    $('verdictEpilogue').innerHTML = body; $('overlay').classList.add('active');
  }

  // ----------------------------- 바인딩/부팅 -----------------------------
  function bind() {
    $('titleStartBtn').onclick = startNewCase;
    $('startBtn').onclick = startInvestigation;
    $('accuseBtn').onclick = toggleAccuseMode;
    $('openNotebook').onclick = openNotebook;
    $('closeNotebook').onclick = closeNotebook;
    $('notebookPanel').onclick = (e) => { if (e.target.id === 'notebookPanel') closeNotebook(); };
    $('sceneBack').onclick = backToMap;
    $('sceneFoundClose').onclick = () => { $('sceneFound').hidden = true; };
    $('restartBtn2').onclick = () => { closeNotebook(); goToTitle(); };
    $('playAgainBtn').onclick = goToTitle;
  }
  document.addEventListener('DOMContentLoaded', async () => { bind(); await loadPortraits(); goToTitle(); });
})();
