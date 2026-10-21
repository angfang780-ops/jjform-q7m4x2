async function k2bFill(d, opt) {
  opt = opt || {};
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pf = (application.popupframes || []);
  let P = null;
  for (let i = 0; i < pf.length; i++) if (pf[i].form && pf[i].form.name == 'EBP00130_P01') P = pf[i].form;
  if (!P) return {error: '상세내용 팝업(EBP00130_P01)이 안 열려 있음 — 상세보기 먼저'};
  const T = P.tab_Main.tabpage1, R2 = P.DS_EBP0120_R2, REQ = P.DS_EB0120_REQ;

  if (opt.add !== false) {
    T.btn_Add.click();
    for (let i = 0; i < 30 && !T.edt_SORT_ORDR.value; i++) await sleep(200);  // 차수는 서버(EBP0120_R9)가 채움
  }
  if (R2.getRowCount() != 1) return {error: 'DS_EBP0120_R2 행 수 ' + R2.getRowCount()};
  if (R2.getColumn(0, 'TCHSPP_ODR')) return {error: '저장된 기존 회차가 열려 있음(TCHSPP_ODR=' + R2.getColumn(0, 'TCHSPP_ODR') + ') — 쓰지 않음'};

  const set = (col, v) => R2.setColumn(0, col, (v === '' || v == null) ? null : String(v));
  const warn = [];
  const sortOrdr = String(T.edt_SORT_ORDR.value || R2.getColumn(0, 'SORT_ORDR') || '');
  if (d['회차'] && sortOrdr && sortOrdr != String(d['회차'])) warn.push('K2B 차수 ' + sortOrdr + ' ≠ 엑셀 ' + d['회차'] + '회차');
  if (sortOrdr && !R2.getColumn(0, 'SORT_ORDR')) set('SORT_ORDR', sortOrdr);

  set('TCHGUD_YMD', d['기술지도일']);
  set('PROCS_RAT_CVALUE', d['공정률']);
  set('CCH_NOCS', d['지도건수']);
  set('PREARNGE_NMPR_CNT', d['교육인원'] && d['교육인원'] != '0' ? d['교육인원'] : '');
  set('WDTB_DATA_NOCS', d['배포자료건수'] && d['배포자료건수'] != '0' ? d['배포자료건수'] : '');
  set('PARTCLR_MATTER_CN', d['특이사항'] || '');

  const chg = [];
  if (d['책임자'] && R2.getColumn(0, 'SPT_RSPNBER_NM') != d['책임자']) { chg.push('책임자 ' + (R2.getColumn(0, 'SPT_RSPNBER_NM') || '(빈칸)') + '→' + d['책임자']); set('SPT_RSPNBER_NM', d['책임자']); }
  const tel = String(d['책임자연락처'] || '').replace(/\D/g, '');
  if (tel && String(R2.getColumn(0, 'SPT_RSPNBER_TELNO_CN') || '').replace(/\D/g, '') != tel) { chg.push('연락처 ' + (R2.getColumn(0, 'SPT_RSPNBER_TELNO_CN') || '(빈칸)') + '→' + tel); set('SPT_RSPNBER_TELNO_CN', tel); }

  const ec = P.DS_EC001, gj = String(d['작업공종'] || '').replace(/\s/g, '');
  let gcode = null;
  if (gj) for (let i = 0; i < ec.getRowCount(); i++) { const nm = ec.getColumn(i, 'CODE_NM'); if (nm == gj || nm.indexOf(gj) == 0 || gj.indexOf(nm.replace('공사', '')) == 0) { gcode = ec.getColumn(i, 'CODE'); break; } }
  if (gcode) set('NOW_JOB_PROCS_CMMN_CD', gcode); else warn.push('작업공종 못 정함: "' + (d['작업공종'] || '') + '" — 직접 선택');

  const bg = String(d['비계'] || '');
  const c5 = T.SCFDG_INSTL_STLE_CMMN_CD_5, c6 = T.SCFDG_INSTL_STLE_CMMN_CD_6;
  if (/미사용/.test(bg)) {
    T.rdo_SCFDG_USE_YN.set_value('N'); c5.set_value('0'); c6.set_value('0'); c5.set_enable(false); c6.set_enable(false);
    set('SCFDG_USE_YN', 'N'); set('SCFDG_INSTL_STLE_CMMN_CD', '');
  } else if (/사용/.test(bg)) {
    const k = []; if (/강관/.test(bg)) k.push('5'); if (/시스템/.test(bg)) k.push('6');
    if (!k.length) warn.push('비계 사용인데 종류 없음: "' + bg + '" — 직접 선택');
    T.rdo_SCFDG_USE_YN.set_value('Y'); c5.set_enable(true); c6.set_enable(true);
    c5.set_value(k.indexOf('5') >= 0 ? '1' : '0'); c6.set_value(k.indexOf('6') >= 0 ? '1' : '0');
    set('SCFDG_USE_YN', 'Y'); set('SCFDG_INSTL_STLE_CMMN_CD', k.join('|'));
  } else warn.push('비계 값 없음 — K2B 화면에서 직접 선택');

  ['001', '002', '003', '004', '005'].forEach(c => T['chk01_' + c].set_value(c == '003' ? '1' : '0'));
  T.edt_SPT_RSPNBER_DSPTH_MTH_ETC_CN.set_enable(false);
  set('SPT_RSPNBER_DSPTH_MTH_SE_CD', '003'); set('SPT_RSPNBER_DSPTH_MTH_ETC_CN', '');

  const first = sortOrdr == '1';
  T.chk02_1.set_value(first ? '0' : '1'); T.chk02_0.set_value('0'); T.chk02_N.set_value(first ? '1' : '0');
  T.cal_CNTWRK_ORDER_MAN_DSPTH_DY.set_enable(false);
  set('BEFORE_TCHGUD_FLFL_YN', first ? 'N' : '1');

  const cn = T.div_Cnstrc;
  if (cn.DS_FUTR_LGZ_ACDNT_RISK_OPERT.getRowCount() == 0) cn.chk_N.set_value(true);
  else warn.push('대형사고 위험작업 행이 이미 있음 — 해당없음 안 누름');

  const titles = (d['문제점'] || []).filter(t => t);
  if (REQ.getRowCount() == 0) titles.forEach(t => { const r = REQ.addRow(); REQ.setColumn(r, 'DMND_MATTER_CN', t); });
  else warn.push('문제점 행이 이미 ' + REQ.getRowCount() + '개 있음 — 추가 안 함');

  const reqs = []; for (let i = 0; i < REQ.getRowCount(); i++) reqs.push(REQ.getColumn(i, 'DMND_MATTER_CN'));
  return {
    차수: T.edt_SORT_ORDR.value, 기술지도일: R2.getColumn(0, 'TCHGUD_YMD'), 공정률: T.edt_PROCS_RAT_CVALUE.value,
    지도건수: T.edt_CCH_NOCS.value, 교육인원: T.edt_PREARNGE_NMPR_CNT.value, 배포자료건수: T.edt_WDTB_DATA_NOCS.value,
    작업공종: T.cbo_NOW_OPERT_PROCS.text, 특이사항: T.edt_PARTCLR_MATTER_CN.value,
    책임자: T.edt_SPT_RSPNBER_NM.value, 연락처: T.msk_SPT_RSPNBER_TELNO.value, 책임자변경: chg,
    비계: T.rdo_SCFDG_USE_YN.value + ' 강관' + c5.value + ' 시스템' + c6.value + ' ds=' + R2.getColumn(0, 'SCFDG_INSTL_STLE_CMMN_CD'),
    통보방법: R2.getColumn(0, 'SPT_RSPNBER_DSPTH_MTH_SE_CD') + ' chk003=' + T.chk01_003.value,
    이행여부: R2.getColumn(0, 'BEFORE_TCHGUD_FLFL_YN') + ' 이행chk=' + T.chk02_1.value,
    대형사고해당없음: cn.chk_N.value, 문제점: reqs, 경고: warn
  };
}

function k2bWork() { return application.mainframe.frame.MainFrame.form.div_Form.div_Work['103015010'].div_Work; }
function k2bPopup() {
  const pf = application.popupframes || [];
  for (let i = 0; i < pf.length; i++) if (pf[i].form && pf[i].form.name == 'EBP00130_P01') return pf[i].form;
  return null;
}
async function k2bOpen(company, cnstrcPart) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const W = k2bWork(), S = W.div_Search, ds = W.DS_EBP0110_R2, hits = [];
  try { S.cal_TCHN_SDATE.set_value(null); S.cal_TCHN_EDATE.set_value(null); } catch (e) {}
  try { if (S.cbo_INSCTR_NM && S.cbo_INSCTR_NM.index != 0) S.cbo_INSCTR_NM.set_index(0); W.ds_search.setColumn(0, 'INSCTR_NM', null); } catch (e) {}
  const prev = ds.getRowCount() ? String(ds.getColumn(0, 'ENTRPS_NM')) + ds.getRowCount() : '';
  S.edt_BPLC_NM.set_value(company); S.btn_Search.click();
  for (let i = 0; i < 40; i++) { await sleep(250); const cur = ds.getRowCount() ? String(ds.getColumn(0, 'ENTRPS_NM')) + ds.getRowCount() : ''; if (i >= 6 && (cur != prev || i >= 20)) break; }
  for (let i = 0; i < ds.getRowCount(); i++) {
    const nm = String(ds.getColumn(i, 'ENTRPS_NM') || '');
    if (!cnstrcPart || nm.replace(/\s/g, '').indexOf(String(cnstrcPart).replace(/\s/g, '')) >= 0) hits.push(i);
  }
  if (hits.length != 1) { const all = []; for (let i = 0; i < ds.getRowCount(); i++) all.push(ds.getColumn(i, 'ENTRPS_NM')); return {error: '공사 ' + hits.length + '건 일치', 목록: all}; }
  ds.set_rowposition(hits[0]); W.btn_Detail.click();
  for (let i = 0; i < 40 && !k2bPopup(); i++) await sleep(200);
  await sleep(1500);
  const P = k2bPopup(); if (!P) return {error: '상세 팝업 안 열림'};
  const R1 = P.DS_EBP0120_R1, done = [];
  for (let i = 0; i < R1.getRowCount(); i++) done.push(R1.getColumn(i, 'SORT_ORDR') + '/' + R1.getColumn(i, 'TCHGUD_YMD'));
  return {공사: ds.getColumn(hits[0], 'ENTRPS_NM'), 기존차수: done};
}
function k2bPatch() {
  const patch = w => { try { const p = w.HTMLInputElement.prototype; if (!p.__origClick) { p.__origClick = p.click; p.click = function () { if (this.type === 'file') { window.__lastFile = this; return; } return p.__origClick.call(this); }; } } catch (e) {} };
  patch(window); document.querySelectorAll('iframe').forEach(f => patch(f.contentWindow));
}
function k2bUnpatch() {
  const un = w => { try { const p = w.HTMLInputElement.prototype; if (p.__origClick) { p.click = p.__origClick; delete p.__origClick; } } catch (e) {} };
  un(window); document.querySelectorAll('iframe').forEach(f => un(f.contentWindow));
  document.querySelectorAll('[aria-label="K2B업로드입력"]').forEach(e => e.remove());
}
async function k2bPrep(btn, waitDs, waitN) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const P = k2bPopup(); if (!P) return 'no popup';
  k2bPatch();
  if (waitDs) { for (let i = 0; i < 40 && P[waitDs].getRowCount() < waitN; i++) await sleep(300); if (P[waitDs].getRowCount() < waitN) return '앞 섹션 업로드 미완료 ' + waitDs + '=' + P[waitDs].getRowCount(); }
  await sleep(800);
  document.querySelectorAll('[aria-label="K2B업로드입력"]').forEach(e => e.remove());
  window.__lastFile = null; P.tab_Main.tabpage1[btn].click();
  for (let i = 0; i < 20 && !window.__lastFile; i++) await sleep(150);
  const f = window.__lastFile; if (!f) return 'no input';
  f.setAttribute('aria-label', 'K2B업로드입력'); f.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:30px;z-index:99999;display:block;opacity:1';
  document.body.appendChild(f); return 'ready';
}
async function k2bFiles(waitDs, waitN) {
  const P = k2bPopup();
  if (waitDs) for (let i = 0; i < 40 && P[waitDs].getRowCount() < waitN; i++) await new Promise(r => setTimeout(r, 300));
  const n = d => { const a = []; for (let i = 0; i < d.getRowCount(); i++) a.push(d.getColumn(i, 'ATCH_FILE_NM')); return a; };
  return {전경: n(P.DS_UploadFile_img), 점검: n(P.DS_UploadFile_img2), 개선: n(P.DS_UploadFile_img3), 보고서: n(P.DS_UploadFile_etc)};
}
function k2bSave() { k2bPopup().tab_Main.tabpage1.btn_Save.click(); return '저장 확인창 → 화면에서 「확인」 → 완료창 「확인」'; }
function k2bClose() { const P = k2bPopup(); if (P) P.close(); return 'closed'; }

function k2bStage() {
  document.querySelectorAll('[aria-label="K2B전체첨부"]').forEach(e => e.remove());
  const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.setAttribute('aria-label', 'K2B전체첨부');
  i.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:30px;z-index:99999';
  document.body.appendChild(i); return 'staged — find K2B전체첨부 → file_upload';
}
async function k2bDistribute(plan) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const P = k2bPopup(); if (!P) throw new Error('상세 팝업 없음');
  if (!P.DS_EBP0120_R2.getRowCount()) throw new Error('새 회차 행 없음 — k2bFill 먼저');
  const T = P.tab_Main.tabpage1, st = document.querySelector('[aria-label="K2B전체첨부"]');
  if (!st || !st.files.length) throw new Error('K2B전체첨부에 올린 파일 없음');
  const byName = {}; [...st.files].forEach(f => byName[f.name] = f);
  const SEC = [['전경', 'btn_imgAdd', 'DS_UploadFile_img'], ['점검', 'btn_imgAdd2', 'DS_UploadFile_img2'],
               ['개선', 'btn_imgAdd3', 'DS_UploadFile_img3'], ['보고서', 'btn_etcAdd', 'DS_UploadFile_etc']];
  k2bPatch(); const log = [];
  for (const [sec, btn, ds] of SEC) {
    const names = plan[sec] || []; if (!names.length) continue;
    const miss = names.filter(n => !byName[n]); if (miss.length) throw new Error(sec + ' 파일 없음: ' + miss.join(','));
    const before = P[ds].getRowCount();
    window.__lastFile = null; T[btn].click();
    for (let i = 0; i < 20 && !window.__lastFile; i++) await sleep(150);
    const inp = window.__lastFile; if (!inp) throw new Error(sec + ' 입력창 안 생김');
    const Wn = inp.ownerDocument.defaultView, dt = new Wn.DataTransfer();
    names.forEach(n => { const f = byName[n]; dt.items.add(new Wn.File([f], f.name, {type: f.type, lastModified: f.lastModified})); });
    inp.files = dt.files; inp.dispatchEvent(new Wn.Event('change', {bubbles: true}));
    for (let i = 0; i < 60 && P[ds].getRowCount() < before + names.length; i++) await sleep(300);
    const got = P[ds].getRowCount() - before; log.push(sec + ' ' + got + '/' + names.length);
    if (got < names.length) throw new Error(sec + ' 업로드 미완료 ' + got + '/' + names.length + ' — 다음 섹션 안 누름');
    await sleep(500);
  }
  const f = await k2bFiles();
  const bad = SEC.filter(([sec]) => JSON.stringify((plan[sec] || []).slice().sort()) != JSON.stringify(f[sec].slice().sort())).map(s => s[0]);
  return Object.assign({log, 일치: !bad.length, 다른섹션: bad}, f);
}
function k2bDialog() {
  const pf = application.popupframes || [];
  for (let i = 0; i < pf.length; i++) { const f = pf[i].form; if (f && /^com/.test(f.name)) return {text: pf[i].name, form: f}; }
  return null;
}
async function k2bSaveAuto() {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const P = k2bPopup(); if (!P) throw new Error('상세 팝업 없음');
  const msgs = [];
  P.tab_Main.tabpage1.btn_Save.click();
  for (let step = 0; step < 3; step++) {
    let d = null; for (let i = 0; i < 40 && !(d = k2bDialog()); i++) await sleep(250);
    if (!d) break;
    msgs.push(d.form.name + ': ' + d.text);
    const bd = d.form.div_Btn;
    const b = d.form.btn_confirm || d.form.btn_Confirm || d.form.btn_ok || d.form.btn_Ok || (bd && (bd.btn_confirm || bd.btn_ok));
    if (!b) { msgs.push('확인 버튼 못 찾음 — 화면에서 직접'); break; }
    b.click(); await sleep(1500);
    if (/정상|저장되었|완료/.test(d.text)) break;
  }
  const R1 = P.DS_EBP0120_R1;
  return {메시지: msgs, 저장됨: msgs.some(m => /정상|저장되었/.test(m)), 최근차수: R1.getRowCount() ? R1.getColumn(0, 'SORT_ORDR') + '/' + R1.getColumn(0, 'TCHGUD_YMD') : ''};
}

async function k2bStep1(job) {
  const o = await k2bOpen(job.회사, job.공사일부);
  if (o.error) return Object.assign({단계: '열기 실패'}, o);
  const n = String(job.값 && job.값['회차'] || '');
  if (n && (o.기존차수 || []).some(x => x.split('/')[0] == n)) return {단계: '중복', 메시지: n + '차가 K2B에 이미 있음 — 입력 안 함', 기존차수: o.기존차수};
  const f = await k2bFill(job.값);
  if (f.error) return Object.assign({단계: '채우기 실패'}, f);
  k2bStage();
  return {단계: '채움 — 다음: find K2B전체첨부 → file_upload → await k2bStep2(window.__k2bJob)', 공사: o.공사, 채운값: f};
}
async function k2bStep2(job) {
  const d = await k2bDistribute(job.plan);
  if (!d.일치) return Object.assign({단계: '첨부 불일치 — 저장 안 함'}, d);
  const s = await k2bSaveAuto();
  if (s.저장됨) { k2bClose(); k2bUnpatch(); }
  return {단계: s.저장됨 ? '저장 완료' : '저장 확인 필요(화면 확인)', 첨부: d.log, 저장: s};
}
