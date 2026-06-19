/* 엔진 공정성 검증 (engine.js v2) — Node로 실행: `node verify.js`
 * 다수의 사건을 생성해
 *  (1) 범인이 유일하게 결정되는지
 *  (2) 모든 사실이 물증으로 드러나는지
 *  (3) 범인의 거짓 알리바이가 물증으로 적발 가능한지
 * 를 확인한다.
 */
const { generateCase, verifyCase } = require('./engine.js');

const PORTRAITS = ['aria','biblia','cardista','chariot','chronia','devil','elementia','empress','fool','gravitas','hierophant','justice','levina','lovers','luna','magician','marine','merchant','misaki','sakura','solar','star','strength','sumika','sun','wheel','world'];

const N = 5000;
let okCount = 0, revealCount = 0, lieCount = 0, twoFactorRedHerrings = 0;
const fails = [];

for (let i = 0; i < N; i++) {
  const c = generateCase({ seed: i, portraits: PORTRAITS });
  const v = verifyCase(c);
  if (v.ok) okCount++; else fails.push({ seed: i, ...v });
  if (v.allRevealed) revealCount++;
  if (v.lieBreakable) lieCount++;
  twoFactorRedHerrings += c.suspects.filter(
    (s) => !s.isCulprit &&
      [s.hasMotive, s.hasOpportunity, s.hasMeans].filter(Boolean).length === 2
  ).length;
}

console.log('=== 미스터리 엔진 v2 검증 결과 ===');
console.log(`생성 사건 수            : ${N}`);
console.log(`범인 유일 결정 성공     : ${okCount}/${N} (${((okCount / N) * 100).toFixed(2)}%)`);
console.log(`모든 물증 노출 성공     : ${revealCount}/${N} (${((revealCount / N) * 100).toFixed(2)}%)`);
console.log(`범인 거짓말 적발 가능   : ${lieCount}/${N} (${((lieCount / N) * 100).toFixed(2)}%)`);
console.log(`평균 강한 함정 용의자 수: ${(twoFactorRedHerrings / N).toFixed(2)} 명/사건`);

if (fails.length) {
  console.log('\n[실패 사례 일부]');
  console.log(fails.slice(0, 5));
  process.exit(1);
} else {
  console.log('\n✅ 모든 사건에서 범인이 유일하게 결정됨 — 공정성 통과');
}

// 샘플 사건 1건 미리보기
const sample = generateCase({ seed: 42, portraits: PORTRAITS });
console.log('\n=== 샘플 사건 (seed 42) ===');
console.log(`피해자: ${sample.victim.name} (${sample.victim.title})`);
console.log(`흉기: ${sample.weapon} / 시각: ${sample.time} / 현장: ${sample.crimeScene.name}`);
console.log('용의자:');
sample.suspects.forEach((s) => {
  const tag = [s.hasMotive ? '동기' : '', s.hasOpportunity ? '기회' : '', s.hasMeans ? '수단' : '']
    .filter(Boolean).join('·') || '혐의없음';
  console.log(`  - ${s.name}(${s.role}) [${tag}] 알리바이:${s.alibiTruth} 태도:${s.demeanor} 일러:${s.portrait}${s.isCulprit ? '  ← 범인' : ''}`);
});
