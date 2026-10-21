async function mailCheck(expect) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const EM = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
  for (let i = 0; i < 60 && !/\d+개 업로드 완료/.test(document.body.innerText); i++) await sleep(250);
  const text = document.body.innerText;
  const toRow = [...document.querySelectorAll('*')].filter(e => /^\s*받는사람/.test(e.innerText || '') && /@/.test(e.innerText || '') && !/보내는사람|제목/.test(e.innerText || ''))
    .sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)[0];
  const got = [...new Set(((toRow && toRow.innerText) || '').match(EM) || [])].sort();
  const want = [...new Set(expect.to)].sort();
  const subj = [...document.querySelectorAll('input')].map(i => i.value).find(v => v && v.trim() == expect.subject.trim());
  const errs = [];
  if (JSON.stringify(got) != JSON.stringify(want)) errs.push('받는사람 ' + JSON.stringify(got) + ' ≠ ' + JSON.stringify(want));
  if (!subj) errs.push('제목이 "' + expect.subject + '"와 다름');
  if (expect.pdf && text.indexOf(expect.pdf) < 0) errs.push('첨부 ' + expect.pdf + ' 없음');
  if (!/1개 업로드 완료/.test(text)) errs.push('첨부 업로드 미완료/개수 다름');
  if (errs.length) throw new Error('보내지 않음 — ' + errs.join(' / '));
  return 'OK ' + want.join(', ');
}
