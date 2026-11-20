async function mailCheck(expect) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const EM = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
  for (let i = 0; i < 60 && !/\d+개 업로드 완료/.test(document.body.innerText); i++) await sleep(250);
  const text = document.body.innerText;
  const toRow = [...document.querySelectorAll('.address_info')].find(e => /^\s*받는사람/.test(e.innerText || ''))
    || [...document.querySelectorAll('*')].filter(e => /^\s*받는사람/.test(e.innerText || '') && /@/.test(e.innerText || '') && !/보내는사람|제목/.test(e.innerText || ''))
    .sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)[0];
  const got = (((toRow && toRow.innerText) || '').match(EM) || []).sort();
  const want = [...new Set(expect.to)].sort();
  const errs = [];
  if (JSON.stringify(got) != JSON.stringify(want)) errs.push('받는사람 ' + JSON.stringify(got) + ' ≠ ' + JSON.stringify(want));
  const toVals = toRow ? [...toRow.querySelectorAll('input, textarea')].map(i => (i.value || '').trim()).filter(Boolean) : [];
  const bad = toVals.filter(v => !(v.match(EM) || []).some(a => want.includes(a)));
  if (bad.length) errs.push('받는사람 칸에 주소 아닌 값 ' + JSON.stringify(bad));
  const inRow = e => toRow && toRow.contains(e);
  const nameOf = i => [i.getAttribute('title'), i.getAttribute('aria-label'), i.getAttribute('placeholder'), i.name, i.id,
                       ...(i.labels ? [...i.labels].map(l => l.innerText) : [])].filter(Boolean).join(' ');
  const cand = [...document.querySelectorAll('input')].filter(i => !inRow(i) && i.type != 'hidden' && i.type != 'file');
  const subjBox = cand.find(i => /제목|subject/i.test(nameOf(i)));
  const subjVals = subjBox ? [subjBox.value] : cand.filter(i => i.offsetParent !== null).map(i => i.value);
  if (!subjVals.some(v => v && v.trim() == expect.subject.trim()))
    errs.push('제목이 "' + expect.subject + '"와 다름' + (subjBox ? ' (제목 칸: "' + subjBox.value + '")' : ' (제목 칸 못 찾음)'));
  if (expect.pdf && text.indexOf(expect.pdf) < 0) errs.push('첨부 ' + expect.pdf + ' 없음');
  if (!/1개 업로드 완료/.test(text)) errs.push('첨부 업로드 미완료/개수 다름');
  if (errs.length) throw new Error('보내지 않음 — ' + errs.join(' / '));
  return 'OK ' + want.join(', ');
}
