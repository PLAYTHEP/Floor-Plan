
/************ SheetOps — Combined Apps Script (Full) ************
 * Includes:
 * - CRUD: sheets + rows + values
 * - Plan: set_assignees + bulk_set_assignees
 * - Users: append_user (upsert), delete_user
 * - Issues: create (multipart + base64), list
 * - KPI: create_kpi, list_kpi
 * - AI: ai_chat (via OpenAI; set OPENAI_API_KEY in Script Properties)
 ***************************************************************/

/************ CONFIG ************/
const SHEET_ID   = '15nn-5GiBB8P8-OdUyLLUWrtVIbfFaljfwBBEJKs7hrU';
const SHEET_USER = 'User';
const SHEET_PLAN = 'Plan';
const SHEET_ISS  = 'ปัญหา';
const SHEET_KPI  = 'KPI';
const UPLOAD_FOLDER_NAME = 'SheetOps_Issues_Uploads';

/************ UTIL ************/
function _ss() { return SpreadsheetApp.openById(SHEET_ID); }
function _sh(name) { return _ss().getSheetByName(name) || _ss().insertSheet(name); }
function _headers(sh){
  if (!sh.getLastColumn()) return [];
  const h = sh.getRange(1,1,1,Math.max(1, sh.getLastColumn())).getValues()[0];
  return h.map(x => String(x||'').trim());
}
function _colIndex(headers, names, fallback){
  if (!headers || !headers.length) return fallback || 1;
  const lower = headers.map(h => String(h).toLowerCase());
  for (var i=0;i<names.length;i++){
    var ix = lower.indexOf(String(names[i]).toLowerCase());
    if (ix>-1) return ix+1; // 1-based
  }
  return fallback || 1;
}
function _nowStr(){
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}
function _ensureUploadFolder(){
  const iter = DriveApp.getFoldersByName(UPLOAD_FOLDER_NAME);
  if (iter.hasNext()) return iter.next();
  return DriveApp.createFolder(UPLOAD_FOLDER_NAME);
}
function _json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/************ ENTRY ************/
function doGet(e) {
  try { return handle((e && e.parameter) || {}); }
  catch (err) { return _json({ok:false, error:String(err)}); }
}
function doPost(e) {
  try {
    if (e.postData && e.postData.type === 'application/json') {
      return handle(JSON.parse(e.postData.contents||'{}'));
    }
    if (e.postData && e.postData.type === 'application/x-www-form-urlencoded') {
      const p = e.parameter || {};
      const data = p.payload ? JSON.parse(p.payload) : p;
      return handle(data);
    }
    const p = (e && e.parameter) || {};
    if (p.action === 'create_issue') return createIssueWithFiles_(e);
    return _json({ok:false, error:'Unsupported content type'});
  } catch (err) { return _json({ok:false, error:String(err)}); }
}

/************ ROUTER ************/
function handle(p){
  const a = String(p.action||'').trim();
  try {
    // CRUD - sheets
    if (a==='list_sheets')   return api_listSheets_();
    if (a==='create_sheet')  return api_createSheet_(p);
    if (a==='delete_sheet')  return api_deleteSheet_(p);
    if (a==='rename_sheet')  return api_renameSheet_(p);

    // CRUD - rows
    if (a==='append_row')    return api_appendRow_(p);
    if (a==='update_row')    return api_updateRow_(p);
    if (a==='delete_row')    return api_deleteRow_(p);
    if (a==='upsert_by_key') return api_upsertByKey_(p);

    // Values
    if (a==='get_values')    return api_getValues_(p);
    if (a==='set_values')    return api_setValues_(p);

    // Plan
    if (a==='set_assignees')        return api_setAssignees_(p);
    if (a==='bulk_set_assignees')   return api_bulkSetAssignees_(p);

    // Users
    if (a==='append_user')          return api_appendUser_(p);
    if (a==='delete_user')          return api_deleteUser_(p);
    if (a==='list_users')           return api_listUsers_(p);

    // Issues
    if (a==='create_issue_base64')  return api_createIssueBase64_(p);
    if (a==='list_issues')          return api_listIssues_(p);
    if (a==='update_issue_status')  return api_updateIssueStatus_(p);

    // KPI
    if (a==='create_kpi')           return api_createKPI_(p);
    if (a==='list_kpi')             return api_listKPI_(p);

    // AI
    if (a==='ai_chat')              return api_aiChat_(p);

    return _json({ok:false, error:'Unknown action'});
  } catch (err) { return _json({ok:false, error:String(err)}); }
}

/************ SHEET CRUD ************/
function api_listSheets_(){
  const ss = _ss();
  const items = ss.getSheets().map(s=>s.getName());
  return _json({ok:true, sheets: items});
}
function api_createSheet_(p){
  const name = String(p.name||'').trim();
  if (!name) throw new Error('name required');
  const ss = _ss();
  if (ss.getSheetByName(name)) return _json({ok:true, existed:true});
  ss.insertSheet(name);
  return _json({ok:true});
}
function api_deleteSheet_(p){
  const name = String(p.name||'').trim();
  if (!name) throw new Error('name required');
  const ss = _ss();
  const sh = ss.getSheetByName(name);
  if (!sh) return _json({ok:false, error:'sheet not found'});
  ss.deleteSheet(sh);
  return _json({ok:true});
}
function api_renameSheet_(p){
  const from = String(p.from||'').trim();
  const to   = String(p.to||'').trim();
  if (!from || !to) throw new Error('from & to required');
  const ss = _ss();
  const sh = ss.getSheetByName(from);
  if (!sh) return _json({ok:false, error:'sheet not found'});
  sh.setName(to);
  return _json({ok:true});
}

/************ ROW CRUD ************/
function _ensureHeaders_(sh, obj){
  if (Array.isArray(obj)) return; // array append doesn't need headers
  const keys = Object.keys(obj||{});
  if (!keys.length) return;
  const H = _headers(sh);
  var changed = false;
  keys.forEach(k=>{ if (H.indexOf(k)===-1) { H.push(k); changed=true; } });
  if (changed) sh.getRange(1,1,1,H.length).setValues([H]);
}
function api_appendRow_(p){
  const sheet = String(p.sheet||'').trim();
  if (!sheet) throw new Error('sheet required');
  const sh = _sh(sheet);
  const row = p.row;
  if (row==null) throw new Error('row required');
  if (Array.isArray(row)) { sh.appendRow(row); return _json({ok:true}); }
  _ensureHeaders_(sh, row);
  const H = _headers(sh); const arr = new Array(H.length).fill('');
  Object.keys(row).forEach(k=>{ const ix = H.indexOf(k); if (ix>-1) arr[ix] = row[k]; });
  sh.appendRow(arr);
  return _json({ok:true});
}
function api_updateRow_(p){
  const sheet = String(p.sheet||'').trim();
  const rowIndex = parseInt(p.rowIndex,10);
  const data = p.data;
  if (!sheet || !rowIndex) throw new Error('sheet & rowIndex required');
  const sh = _sh(sheet);
  if (Array.isArray(data)){
    sh.getRange(rowIndex,1,1,data.length).setValues([data]); 
    return _json({ok:true});
  }
  _ensureHeaders_(sh, data);
  const H = _headers(sh); const arr = sh.getRange(rowIndex,1,1,Math.max(1,sh.getLastColumn())).getValues()[0];
  Object.keys(data).forEach(k=>{ const ix = H.indexOf(k); if(ix>-1) arr[ix] = data[k]; });
  sh.getRange(rowIndex,1,1,Math.max(1,sh.getLastColumn())).setValues([arr]);
  return _json({ok:true});
}
function api_deleteRow_(p){
  const sheet = String(p.sheet||'').trim();
  const rowIndex = parseInt(p.rowIndex,10);
  if (!sheet || !rowIndex) throw new Error('sheet & rowIndex required');
  _sh(sheet).deleteRow(rowIndex);
  return _json({ok:true});
}
function api_upsertByKey_(p){
  const sheet = String(p.sheet||'').trim();
  const key   = String(p.key||'').trim();
  const value = String(p.value||'').trim();
  const data  = p.data || {};
  if (!sheet || !key) throw new Error('sheet & key required');
  const sh = _sh(sheet);
  _ensureHeaders_(sh, Object.assign({[key]: value}, data));
  const H = _headers(sh);
  const cKey = _colIndex(H, [key], 1);
  const last = sh.getLastRow();
  var foundRow = 0;
  for (var r=2; r<=last; r++){ if (String(sh.getRange(r,cKey).getValue()).trim()===value){ foundRow=r; break; } }
  if (!foundRow){ 
    const arr = new Array(H.length).fill(''); 
    arr[cKey-1]=value; Object.keys(data).forEach(k=>{ const ix=H.indexOf(k); if(ix>-1) arr[ix]=data[k]; });
    sh.appendRow(arr); 
    return _json({ok:true, created:true});
  }
  const arr = sh.getRange(foundRow,1,1,H.length).getValues()[0];
  Object.keys(data).forEach(k=>{ const ix=H.indexOf(k); if(ix>-1) arr[ix]=data[k]; });
  sh.getRange(foundRow,1,1,H.length).setValues([arr]);
  return _json({ok:true, updated:true, row:foundRow});
}

/************ VALUES ************/
function api_getValues_(p){
  const sh = _sh(p.sheet||SHEET_USER);
  const rng = sh.getRange(p.range||'A1:Z');
  return _json({ok:true, values: rng.getValues()});
}
function api_setValues_(p){
  const sh = _sh(p.sheet||SHEET_USER);
  const rng = sh.getRange(p.range||'A1:Z');
  const vals = p.values;
  if (!Array.isArray(vals)) throw new Error('values (2D array) required');
  rng.setValues(vals);
  return _json({ok:true});
}

/************ PLAN ************/
function api_setAssignees_(p){
  const taskId = String(p.taskId||'').trim();
  var employeeIds = p.employeeIds;
  if (!Array.isArray(employeeIds))
    employeeIds = String(employeeIds||'').split(',').map(s=>String(s).trim()).filter(String);
  if (!taskId) throw new Error('taskId required');

  const sh = _sh(SHEET_PLAN), H=_headers(sh);
  const cTask     = _colIndex(H, ['taskid','task id','station','สแตชัน','สถานี','สเตชัน'], 1);
  const cAssigned = _colIndex(H, ['assignedto','assigned','พนักงาน','รหัส','ผู้รับผิดชอบ'], 4);
  const last = Math.max(2, sh.getLastRow());
  const data = last>=2 ? sh.getRange(2,1,last-1, sh.getLastColumn()).getValues() : [];
  for (var r=0;r<data.length;r++){
    if (String(data[r][cTask-1]).trim() === taskId){
      sh.getRange(r+2, cAssigned).setValue(employeeIds.join(','));
      return _json({ok:true});
    }
  }
  var row = []; row[cTask-1]=taskId; row[cAssigned-1]=employeeIds.join(',');
  sh.appendRow(row);
  return _json({ok:true, created:true});
}
// Bulk save (from UI "บันทึก (n)")
function api_bulkSetAssignees_(p){
  var items = Array.isArray(p.items)? p.items : [];
  var sh = _sh(SHEET_PLAN), H=_headers(sh);
  var cTask     = _colIndex(H, ['taskid','task id','station','สแตชัน','สถานี','สเตชัน'], 1);
  var cAssigned = _colIndex(H, ['assignedto','assigned','พนักงาน','รหัส','ผู้รับผิดชอบ'], 4);

  // Index: taskId -> row number
  var idx = {}, last = Math.max(2, sh.getLastRow());
  if (last>=2){
    var data = sh.getRange(2,1,last-1, sh.getLastColumn()).getValues();
    for (var r=0;r<data.length;r++){
      var tid = String(data[r][cTask-1]||'').trim();
      if (tid) idx[tid] = r+2;
    }
  }
  items.forEach(function(it){
    var tid = String(it.taskId||'').trim();
    var list = Array.isArray(it.employeeIds)? it.employeeIds : [];
    if (!tid) return;
    var row = idx[tid];
    if (!row){
      var newRow = []; newRow[cTask-1]=tid; newRow[cAssigned-1]=list.join(',');
      sh.appendRow(newRow);
      idx[tid] = sh.getLastRow();
    } else {
      sh.getRange(row, cAssigned).setValue(list.join(','));
    }
  });
  return _json({ok:true, updated: items.length});
}

/************ USERS ************/
function api_appendUser_(p){
  const u = p.user || {}, id=String(u.id||'').trim(), name=String(u.name||'').trim(), type=String(u.type||'').trim();
  if(!id || !name) throw new Error('id and name required');
  const sh = _sh(SHEET_USER);
  if (sh.getLastRow()===0) sh.appendRow(['ID','Name','(D)','Type','(F)']);
  const H=_headers(sh);
  const cB=_colIndex(H,['id','รหัส'],2), cC=_colIndex(H,['name','ชื่อ','ชื่อ-สกุล','ชื่อสกุล'],3), cE=_colIndex(H,['type','ประเภท','ชนิด'],5);

  // Upsert by ID
  var last = sh.getLastRow(); var updated = false;
  for (var r=2;r<=last;r++){
    var cur = String(sh.getRange(r, cB).getValue()).trim();
    if (cur === id){
      sh.getRange(r, cC).setValue(name);
      if (cE) sh.getRange(r, cE).setValue(type);
      updated = true; break;
    }
  }
  if (!updated){
    var row=[]; row[cB-1]=id; row[cC-1]=name; row[cE-1]=type; sh.appendRow(row);
  }
  return _json({ok:true, updated});
}
function api_deleteUser_(p){
  const id = String(p.employeeId||'').trim();
  if(!id) throw new Error('employeeId required');
  const su=_sh(SHEET_USER), Hu=_headers(su); const cB=_colIndex(Hu,['id','รหัส'],2);
  for (var r=su.getLastRow(); r>=2; r--){
    if (String(su.getRange(r,cB).getValue()).trim()===id) su.deleteRow(r);
  }
  const sp=_sh(SHEET_PLAN), Hp=_headers(sp); const cA=_colIndex(Hp,['assignedto','assigned','พนักงาน','รหัส','ผู้รับผิดชอบ'],4);
  if (sp.getLastRow()>=2){
    var data = sp.getRange(2,1,sp.getLastRow()-1, sp.getLastColumn()).getValues();
    for (var i=0;i<data.length;i++){ var cur=String(data[i][cA-1]||''); if(!cur) continue;
      var parts=cur.split(',').map(s=>s.trim()).filter(Boolean).filter(s=>s!==id);
      if (parts.join(',')!==cur) sp.getRange(i+2,cA).setValue(parts.join(','));
    }
  }
  return _json({ok:true});
}
function api_listUsers_(_p){
  var sh=_sh(SHEET_USER); if (sh.getLastRow()<2) return _json({ok:true, items:[]});
  var values=sh.getRange(2,1,sh.getLastRow()-1, sh.getLastColumn()).getValues();
  var H=_headers(sh);
  var cId=_colIndex(H,['id','รหัส'],2)-1;
  var cName=_colIndex(H,['name','ชื่อ','ชื่อ-สกุล','ชื่อสกุล'],3)-1;
  var cType=_colIndex(H,['type','ประเภท','ชนิด'],5)-1;
  var items=values.map(function(r){
    return { id:String(r[cId]||'').trim(), name:String(r[cName]||'').trim(), type:String(r[cType]||'').trim() };
  }).filter(function(u){ return u.id && u.name; });
  return _json({ok:true, items:items});
}

/************ ISSUES ************/
function _userNameById_(id){
  if(!id) return '';
  try{
    var su=_sh(SHEET_USER), Hu=_headers(su);
    var cB=_colIndex(Hu,['id','รหัส'],2), cC=_colIndex(Hu,['name','ชื่อ','ชื่อ-สกุล','ชื่อสกุล'],3);
    var last=su.getLastRow();
    for (var r=2;r<=last;r++){ if (String(su.getRange(r,cB).getValue()).trim()===id) return String(su.getRange(r,cC).getValue()).trim(); }
  }catch(e){}
  return '';
}
function _appendIssueRow_(empId, taskId, message, linksArr){
  var sh=_sh(SHEET_ISS);
  if (sh.getLastRow()===0) sh.appendRow(['เวลา','รหัส','พนักงาน','งานที่เกี่ยวข้อง','ข้อความ','รูป','สถานะ']);
  var H=_headers(sh);
  var cTime=_colIndex(H,['เวลา','time','timestamp'],1);
  var cEmp=_colIndex(H,['รหัส','รหัสพนักงาน','employeeid','empid'],2);
  var cName=_colIndex(H,['พนักงาน','ชื่อพนักงาน','employee name','name'],3);
  var cTask=_colIndex(H,['งานที่เกี่ยวข้อง','task','taskid','station','สแตชัน','สถานี'],4);
  var cMsg=_colIndex(H,['ข้อความ','message','content'],5);
  var cImg=_colIndex(H,['รูป','images','attachments'],6);
  var cStatus=_colIndex(H,['สถานะ','status'],7);
  var maxC=Math.max(cTime,cEmp,cName,cTask,cMsg,cImg,cStatus);
  var row=new Array(maxC).fill('');
  row[cTime-1]=_nowStr();
  row[cEmp-1]=String(empId||'');
  row[cName-1]=_userNameById_(empId);
  row[cTask-1]=String(taskId||'');
  row[cMsg-1]=String(message||'');
  row[cImg-1]=(linksArr||[]).join(',');
  row[cStatus-1]='open';
  sh.appendRow(row);
}
function api_createIssueBase64_(p){
  var empId=String(p.employeeId||'').trim(); var taskId=String(p.taskId||'').trim(); var message=String(p.message||'').trim();
  var files=Array.isArray(p.files)?p.files:[]; var folder=_ensureUploadFolder(); var links=[];
  files.forEach(function(f,idx){ try{ var name=(f&&f.name)?String(f.name):('image'+(idx+1)+'.png'); var type=(f&&f.type)?String(f.type):'image/png'; var data=(f&&f.data)?String(f.data):''; if(!data) return; var blob=Utilities.newBlob(Utilities.base64Decode(data), type, name); var file=folder.createFile(blob); file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); links.push(file.getUrl()); }catch(e){} });
  _appendIssueRow_(empId, taskId, message, links); return _json({ok:true, images:links});
}
function createIssueWithFiles_(e){
  var p=e.parameter||{}; var empId=String(p.employeeId||'').trim(); var taskId=String(p.taskId||'').trim(); var message=String(p.message||'').trim();
  var folder=_ensureUploadFolder(); var links=[];
  if(e.files) Object.keys(e.files).forEach(function(k){ var f=e.files[k]; if(!f||!f.length) return; var blob=Utilities.newBlob(f[0].bytes,f[0].type,f[0].filename); var file=folder.createFile(blob); file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); links.push(file.getUrl()); });
  _appendIssueRow_(empId, taskId, message, links); return _json({ok:true, images:links});
}
function api_listIssues_(_p){
  var sh=_sh(SHEET_ISS); if (sh.getLastRow()<2) return _json({ok:true, items:[]});
  var values=sh.getRange(1,1,sh.getLastRow(), sh.getLastColumn()).getValues(); var H=values.shift().map(String);
  var ixTime=_colIndex(H,['เวลา','time','timestamp'],1)-1;
  var ixEmp=_colIndex(H,['รหัส','รหัสพนักงาน','employeeid','empid','employee'],2)-1;
  var ixName=_colIndex(H,['พนักงาน','ชื่อพนักงาน','employee name','name'],3)-1;
  var ixTask=_colIndex(H,['งานที่เกี่ยวข้อง','task','taskid','station','สแตชัน','สถานี'],4)-1;
  var ixMsg=_colIndex(H,['ข้อความ','message','content'],5)-1;
  var ixImgs=_colIndex(H,['รูป','images','attachments'],6)-1;
  var ixStatus=_colIndex(H,['สถานะ','status'],7)-1;
  var items=values.map(function(r,i){
    var empId=String(r[ixEmp]||'').trim();
    var name = ixName>=0 ? String(r[ixName]||'').trim() : _userNameById_(empId);
    var imgs=String(r[ixImgs]||'').split(',').map(function(s){return s.trim();}).filter(String);
    return { rowIndex:i+2, time:r[ixTime]||'', employeeId:empId, employeeName:name, taskId:r[ixTask]||'', message:r[ixMsg]||'', images:imgs, status: r[ixStatus]||'' };
  });
  items.sort(function(a,b){ var sa=String(a.status||'').toLowerCase()==='open'?0:1; var sb=String(b.status||'').toLowerCase()==='open'?0:1; if(sa!==sb) return sa-sb; return String(b.time).localeCompare(String(a.time)); });
  return _json({ok:true, items});
}
function api_updateIssueStatus_(p){
  var row=parseInt(p.rowIndex,10); var status=String(p.status||'').trim();
  if(!row || !status) throw new Error('rowIndex & status required');
  var sh=_sh(SHEET_ISS); if (row<2 || row>sh.getLastRow()) throw new Error('row out of range');
  var H=_headers(sh); var cStatus=_colIndex(H,['สถานะ','status'],7);
  sh.getRange(row, cStatus).setValue(status);
  return _json({ok:true});
}

/************ KPI ************/
function _ensureKPIHeaders_(){
  var sh = _sh(SHEET_KPI);
  if (sh.getLastRow()===0){
    sh.appendRow(['User ID','Date','UserName','KPI Target','Station','Floor','Shift','Function','Standard Hour','Productive Hour','Idle Time','Break Time','Total Hour','Total Unit','Total Tote','UPMH / TPMH','PERCENT']);
  }
  return sh;
}
function api_createKPI_(p){
  var rec = p.record || {};
  var sh = _ensureKPIHeaders_(), H=_headers(sh);
  var arr = new Array(H.length).fill('');
  H.forEach(function(h, i){ arr[i] = rec[h] !== undefined ? rec[h] : ''; });
  sh.appendRow(arr);
  return _json({ok:true});
}
function api_listKPI_(p){
  var sh = _ensureKPIHeaders_(), H=_headers(sh);
  var last = sh.getLastRow();
  if (last<2) return _json({ok:true, items:[]});
  var vals = sh.getRange(2,1,last-1, sh.getLastColumn()).getValues();
  var items = vals.map(function(r){ var obj={}; H.forEach(function(h,i){ obj[h]=r[i]; }); return obj; });

  var uid = String(p.userId||'').trim(); var date = String(p.date||'').trim();
  if (uid) items = items.filter(function(x){ return String(x['User ID']||'').trim()===uid; });
  if (date) items = items.filter(function(x){ return String(x['Date']||'').slice(0,10)===date; });
  return _json({ok:true, items: items});
}

/************ AI CHAT ************/
function api_aiChat_(p){
  var key=PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if(!key) return _json({ok:false, error:'Missing OPENAI_API_KEY'});
  var msgs=p.messages||[];
  var body={ model:'gpt-4o-mini', messages:[{role:'system', content:'คุณเป็นผู้ช่วยงานคลัง/สแตชัน ตอบสั้น กระชับ เป็นขั้นตอน'}].concat(msgs) };
  var resp=UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions',{ method:'post', contentType:'application/json', headers:{'Authorization':'Bearer '+key}, payload:JSON.stringify(body), muteHttpExceptions:true });
  var txt=resp.getContentText(); try{ var j=JSON.parse(txt); var reply=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content||'...'; return _json({ok:true, reply}); }catch(e){ return _json({ok:false, error:txt}); }
}
