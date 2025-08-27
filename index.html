<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>SheetOps — Floor Plan / ปัญหา / โครงสร้าง / แสดงผล</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#0ea5e9" />
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.19.3/xlsx.full.min.js"></script>
    <style>
      html,body,#root{height:100%}
      body{background:#f8fafc;color:#0f172a}

      /* Cards / Tiles / Buttons */
      .card{border:1px solid rgba(148,163,184,.25);border-radius:1rem;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:box-shadow .3s,transform .2s}
      .card:hover{box-shadow:0 4px 24px rgba(59,130,246,.12),0 2px 4px rgba(0,0,0,.04);transform:scale(1.01)}
      .tile{border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:.75rem;padding:14px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;justify-content:center;min-height:80px;transition:box-shadow .15s,transform .2s}
      .tile:hover{box-shadow:0 2px 12px rgba(0,213,255,.12);transform:translateY(-1px)}
      .tile.drop{outline:2px dashed #38bdf8;outline-offset:2px;background:rgba(56,189,248,.06)}
      .tile.missing{background:linear-gradient(180deg,rgba(241,245,249,.7),rgba(255,255,255,1))}
      .pill{display:inline-flex;align-items:center;gap:.35rem;padding:.15rem .5rem;border-radius:999px;font-size:11px;border:1px solid rgba(148,163,184,.35);background:#fff;white-space:nowrap}
      .avatar{width:24px;height:24px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:white}
      .btn{padding:.5rem 1rem;border-radius:.7rem;border:1px solid rgba(148,163,184,.35);background:#fff;transition:all .2s cubic-bezier(.4,0,.2,1);min-width:110px}
      .btn:hover{background:#f0f9ff;transform:scale(1.03)}
      .btnP{background:linear-gradient(90deg,#0ea5e9 60%,#818cf8 100%);border-color:#0ea5e9;color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.07)}
      .badge{font-size:11px;border:1px solid rgba(148,163,184,.45);padding:.15rem .5rem;border-radius:9999px}

      .fadein{animation:fadein .35s} @keyframes fadein{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}

      /* Responsive tweaks for phones */
      @media (max-width: 640px){
        .tile{min-height:68px;padding:12px}
        .btn{min-width:auto;padding:.45rem .8rem}
      }

      /* Fullscreen display page (TV 52”) */
      .display-wrap{height:calc(100vh - 64px)}
      .display-grid{gap:14px}
      @media (min-width:1536px){ .display-grid{gap:18px} }
    </style>
  </head>
  <body class="bg-gradient-to-br from-sky-100 via-teal-50 to-indigo-100 min-h-screen">
    <div id="root"></div>
    <div id="toasts" class="fixed top-3 right-3 space-y-2 z-[9999]"></div>

    <!-- Firebase (Database only; allข้อมูลอยู่ใน Firebase) -->
    <script type="module">
      import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
      import { getDatabase, ref as dbRef, get, set, update, remove, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
      const firebaseConfig = {
        apiKey: "AIzaSyC6Qnfm0xiOsN_FZksKgGi_0i5wovGZ97E",
        authDomain: "inventory-21fd3.firebaseapp.com",
        databaseURL: "https://inventory-21fd3-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "inventory-21fd3",
        storageBucket: "inventory-21fd3.appspot.com",
        messagingSenderId: "27307205860",
        appId: "1:27307205860:web:8d5da549bc1a1a519238f1"
      };
      const app = initializeApp(firebaseConfig);
      const db = getDatabase(app);
      window.fb = { app, db, dbApi:{ dbRef, get, set, update, remove, push, onValue } };
    </script>

    <script type="text/babel">
      const {useState,useEffect,useMemo,useRef} = React;

      /* ---------- Toast ---------- */
      function pushToast(msg, type='error'){
        try{
          const wrap = document.getElementById('toasts'); if(!wrap) return;
          const el = document.createElement('div');
          el.className = `fadein px-3 py-2 rounded-xl text-sm shadow border ${type==='error'?'bg-rose-50 border-rose-200 text-rose-800':'bg-emerald-50 border-emerald-200 text-emerald-800'}`;
          el.textContent = msg; wrap.appendChild(el);
          setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-6px)'; }, 2600);
          setTimeout(()=>{ try{wrap.removeChild(el)}catch{} }, 3000);
        }catch{}
      }

      /* ---------- Helpers ---------- */
      const hasFb = () => !!(window.fb && window.fb.db && window.fb.dbApi);
      const fbSet = (p,v)=>window.fb.dbApi.set(window.fb.dbApi.dbRef(window.fb.db,p),v);
      const fbUpdate = (p,v)=>window.fb.dbApi.update(window.fb.dbApi.dbRef(window.fb.db,p),v);
      const fbRemove = (p)=>window.fb.dbApi.remove(window.fb.dbApi.dbRef(window.fb.db,p));
      const fbOn = (p,cb)=>window.fb.dbApi.onValue(window.fb.dbApi.dbRef(window.fb.db,p),cb);
      const fbPushRef = (p)=>window.fb.dbApi.push(window.fb.dbApi.dbRef(window.fb.db,p));
      const colorFor = key => { const colors=['#0ea5e9','#06b6d4','#14b8a6','#22c55e','#a3e635','#eab308','#f59e0b','#ef4444','#6366f1','#8b5cf6','#ec4899','#f43f5e']; let h=0; const s=String(key||''); for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h); return colors[Math.abs(h)%colors.length]; };
      const hexToRgba=(hex,alpha=1)=>{try{const c=hex.replace('#','');const n=c.length===3?c.split('').map(x=>x+x).join(''):c;const r=parseInt(n.slice(0,2),16),g=parseInt(n.slice(2,4),16),b=parseInt(n.slice(4,6),16);return `rgba(${r},${g},${b},${alpha})`;}catch{return 'rgba(14,165,233,.1)'}};
      const wrapCsv=t=>/[",\n]/.test(t)?`"${t.replace(/"/g,'""')}"`:t;

      /* ---------- Defaults ---------- */
      const DEFAULT_TYPES = ['Support','Case replen','Sorter','Picker','put to slot','Build','Tote'];
      const DEFAULT_LAYOUT = {
        order: ['Floor 1','Floor 2','Floor 3','Extra'],
        autoSlide:{enabled:false, intervalSec:15, pages:['Floor 1','Floor 2','Floor 3','Extra']},
        groups:{
          'Floor 1':{color:'#0284c7',cols:2,fontPx:18,stations:[{id:'1101'},{id:'1102'},{id:'1103'},{id:'1104'},{id:'1105'},{id:'1106'},{id:'1107'},{id:'1201'},{id:'1203'},{id:'1205'}]},
          'Floor 2':{color:'#a16207',cols:2,fontPx:18,stations:[{id:'2101'},{id:'2102'},{id:'2103'},{id:'2104'},{id:'2105'},{id:'2201'},{id:'2203'},{id:'2205'}]},
          'Floor 3':{color:'#4f46e5',cols:2,fontPx:18,stations:[{id:'3101'},{id:'3105'},{id:'3201'},{id:'3205'}]},
          'Extra':  {color:'#0ea5e9',cols:2,fontPx:18,stations:[{id:'Support'},{id:'Case replen'},{id:'Sorter'},{id:'put to slot'},{id:'Picker'},{id:'Build'},{id:'Tote'},{id:'Lan1'},{id:'Lan2'},{id:'Lan3'},{id:'Lan4'}]}
        }
      };
      const normStations = g => (g?.stations||[]).map(s=> typeof s==='string'? {id:s,color:'',fontPx:null}:{id:String(s.id),color:s.color||'',fontPx: s.fontPx??null});

      /* ---------- Excel Export (robust) ---------- */
      function exportUsersXlsx(users){
        if(!users?.length) return pushToast('ไม่มีรายชื่อให้ Export');
        const rows = users.map(u=>({ID:u.id||'',Name:u.name||'',TYPE:u.type||''}));
        try{
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Users');
          XLSX.writeFile(wb, 'users.xlsx');
          pushToast('Export รายชื่อสำเร็จ','ok');
        }catch(e){
          const csv = ['ID,Name,TYPE',...rows.map(r=>`${wrapCsv(r.ID)},${wrapCsv(r.Name)},${wrapCsv(r.TYPE)}`)].join('\n');
          const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
          const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='users.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{document.body.removeChild(a); URL.revokeObjectURL(url)},0);
          pushToast('Export CSV สำเร็จ (โหมดสำรอง)','ok');
        }
      }
      function exportIssuesXlsx(issues){
        if(!issues?.length) return pushToast('ไม่มีประวัติเคส');
        const rows = issues.map(i=>({
          ID:i.id||'',
          Time:new Date(i.time||'').toLocaleString(),
          Station:i.station||'',
          Type:i.type||'',
          Priority:i.priority||'',
          Status:i.status||'',
          Reporter:i.reporter||'',
          Message:i.message||''
        }));
        try{
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Issues');
          XLSX.writeFile(wb, 'issues.xlsx'); pushToast('Export เคสสำเร็จ','ok');
        }catch(e){
          const head = Object.keys(rows[0]);
          const csv = [head.join(','), ...rows.map(r=>head.map(k=>wrapCsv(String(r[k]??''))).join(','))].join('\n');
          const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
          const a=document.createElement('a'); a.href=url; a.download='issues.csv'; document.body.appendChild(a); a.click(); setTimeout(()=>{document.body.removeChild(a); URL.revokeObjectURL(url)},0);
          pushToast('Export CSV สำเร็จ (โหมดสำรอง)','ok');
        }
      }

      /* ===========================================================
         Root App
         =========================================================== */
      function App(){
        const [page,setPage] = useState('plan'); // plan | issues | layout | display
        const [users,setUsers] = useState([]);
        const [plan,setPlan] = useState({});      // {station:{station,assignedList,updatedAt}}
        const [layout,setLayout] = useState(DEFAULT_LAYOUT);
        const [adding,setAdding] = useState(false);
        const [newUser,setNewUser] = useState({id:'',name:'',type:''});
        const [exportOpen,setExportOpen] = useState(false);

        // Realtime
        useEffect(()=>{
          if(!hasFb()){ pushToast('ไม่พบ Firebase'); return; }
          const offUsers = fbOn('/User', s=>{ const v=s.val()||{}; setUsers(Object.values(v)); });
          const offPlan  = fbOn('/Plan', s=>{ setPlan(s.val()||{}); });
          const offLayout= fbOn('/Layout', async s=>{ const v=s.val(); if(v && v.order && v.groups){ setLayout(v); } else { await fbSet('/Layout', DEFAULT_LAYOUT); setLayout(DEFAULT_LAYOUT); } });
          return ()=>{ try{offUsers();offPlan();offLayout();}catch{} };
        },[]);

        const userMap = useMemo(()=>Object.fromEntries(users.map(u=>[String(u.id),u])),[users]);
        const planBySt = useMemo(()=>{ const m=new Map(); Object.values(plan||{}).forEach(t=>m.set(String(t.station), t)); return m; }, [plan]);

        // Employee current station lookup
        const stationByEmp = useMemo(()=>{
          const map = new Map();
          Object.values(plan||{}).forEach(t=>{
            (t.assignedList||[]).forEach(id=> map.set(String(id), t.station));
          });
          return map;
        },[plan]);

        // Simple assign (drag/drop or modal)
        async function writePlan(station, list){
          const payload = { id:String(station), station:String(station), assignedList:Array.from(new Set(list||[])), updatedAt:new Date().toISOString() };
          await fbSet('/Plan/'+String(station), payload);
        }
        async function moveEmpToStation(empId, station){
          // remove from others
          for(const k of Object.keys(plan||{})){
            const t=plan[k]; if((t.assignedList||[]).includes(empId) && t.station!==station){
              await writePlan(t.station, (t.assignedList||[]).filter(x=>x!==empId));
            }
          }
          const cur = (planBySt.get(station)?.assignedList)||[];
          if(!cur.includes(empId)) await writePlan(station, [...cur, empId]);
          pushToast(`มอบหมาย ${userMap[empId]?.name||empId} → ${station}`,'ok');
        }

        // Add/Remove employee
        async function addUser(e){ e?.preventDefault?.(); if(!newUser.id.trim()||!newUser.name.trim()) return pushToast('กรุณากรอก ID และ ชื่อ-นามสกุล'); await fbSet('/User/'+newUser.id.trim(), {id:newUser.id.trim(), name:newUser.name.trim(), type:(newUser.type||'').trim()}); setNewUser({id:'',name:'',type:''}); setAdding(false); pushToast('เพิ่มพนักงานเรียบร้อย','ok'); }
        async function deleteUser(id){
          if(!confirm('ลบพนักงานนี้?')) return;
          await fbRemove('/User/'+String(id));
          // remove from plan
          for(const k of Object.keys(plan||{})){
            const t=plan[k]; if((t.assignedList||[]).includes(id)) await writePlan(t.station,(t.assignedList||[]).filter(x=>x!==id));
          }
          pushToast('ลบสำเร็จ','ok');
        }

        return (
          <div className="min-h-screen">
            {/* Topbar */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center gap-2">
                <div className="text-xl sm:text-2xl font-bold">KKRDC PITL</div>
                <div className="flex items-center gap-2 ml-0 sm:ml-4">
                  <button className={`btn ${page==='plan'?'btnP text-white':''}`} onClick={()=>setPage('plan')}>แผนผัง</button>
                  <button className={`btn ${page==='issues'?'btnP text-white':''}`} onClick={()=>setPage('issues')}>ปัญหา</button>
                  <button className={`btn ${page==='layout'?'btnP text-white':''}`} onClick={()=>setPage('layout')}>โครงสร้าง</button>
                  <button className={`btn ${page==='display'?'btnP text-white':''}`} onClick={()=>setPage('display')}>แสดงผล</button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button className="btn" onClick={()=>setExportOpen(true)}>Export</button>
                  <button className="btn" onClick={()=>setAdding(true)}>+ เพิ่มพนักงาน</button>
                </div>
              </div>
            </div>

            {/* Pages */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
              {page==='plan'   && <PlanPage users={users} userMap={userMap} planBySt={planBySt} layout={layout} moveEmpToStation={moveEmpToStation} onDeleteUser={deleteUser} />}
              {page==='issues' && <IssuesPage exportIssuesXlsx={exportIssuesXlsx} />}
              {page==='layout' && <LayoutPage layout={layout} setLayout={setLayout} />}
              {page==='display'&& <DisplayPage layout={layout} planBySt={planBySt} userMap={userMap} />}
            </div>

            {/* Add user modal */}
            {adding && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
                <div className="card w-[520px] max-w-[95vw] p-5 fadein">
                  <div className="text-lg font-semibold">เพิ่มพนักงาน</div>
                  <form onSubmit={addUser} className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">ID *</div>
                      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={newUser.id} onChange={e=>setNewUser({...newUser,id:e.target.value})} required/>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">ชื่อ-นามสกุล *</div>
                      <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} required/>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500 mb-1">TYPE</div>
                      <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={newUser.type} onChange={e=>setNewUser({...newUser,type:e.target.value})}>
                        <option value="">(ไม่ระบุ)</option>
                        {DEFAULT_TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button type="button" className="btn" onClick={()=>setAdding(false)}>ยกเลิก</button>
                      <button className="btnP" type="submit">บันทึก</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Export modal */}
            {exportOpen && <ExportModal onClose={()=>setExportOpen(false)} users={users} />}
          </div>
        );
      }

      /* ---------- Export Modal ---------- */
      function ExportModal({onClose, users}){
        const [choice,setChoice] = useState('users'); // users | issues
        const [issues,setIssues] = useState([]);
        useEffect(()=>{ const off=fbOn('/Issues', s=>{ const v=s.val()||{}; const arr=Object.values(v); arr.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||''))); setIssues(arr); }); return ()=>{try{off();}catch{}}; },[]);
        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-[60]">
            <div className="card w-[440px] max-w-[95vw] p-5 fadein">
              <div className="text-lg font-semibold mb-2">Export ข้อมูล</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2"><input type="radio" checked={choice==='users'} onChange={()=>setChoice('users')} /> รายชื่อพนักงาน</label>
                <label className="flex items-center gap-2"><input type="radio" checked={choice==='issues'} onChange={()=>setChoice('issues')} /> ประวัติเคสปัญหา</label>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="btn" onClick={onClose}>ยกเลิก</button>
                <button className="btnP" onClick={()=>{
                  if(choice==='users') exportUsersXlsx(users);
                  else exportIssuesXlsx(issues);
                  onClose();
                }}>Export</button>
              </div>
            </div>
          </div>
        );
      }

      /* ---------- Plan Page ---------- */
      function PlanPage({users,userMap,planBySt,layout,moveEmpToStation,onDeleteUser}){
        const [search,setSearch] = useState('');
        const [typeFilter,setTypeFilter] = useState('All');
        const filtered = useMemo(()=>{ const q=search.toLowerCase(); return users.filter(u=> (typeFilter==='All'||u.type===typeFilter) && (u.name+u.id).toLowerCase().includes(q)); },[users,search,typeFilter]);

        const [assign, setAssign] = useState({open:false, station:'', sel:new Set(), q:''});

        // lookup station for each employee
        const stationByEmp = useMemo(()=>{
          const map=new Map(); for(const [k,t] of planBySt.entries()){ (t.assignedList||[]).forEach(id=>map.set(String(id),k)); } return map;
        },[planBySt]);

        function groupColorOfStation(stId){
          for(const gName of layout.order){
            const g=layout.groups[gName]; if(!g) continue;
            if(normStations(g).some(s=>s.id===stId)) return g.color||'#0ea5e9';
          } return '#0ea5e9';
        }

        function onDragStartEmp(e, emp){ e.dataTransfer.setData('text/plain', JSON.stringify(emp)); e.dataTransfer.effectAllowed='move'; }

        return (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar employees */}
            <aside className="col-span-12 md:col-span-4 lg:col-span-3">
              <div className="card p-3">
                <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2"><span className="w-5 h-5 rounded bg-sky-500 text-white grid place-items-center text-[10px]">E</span>Employee</div>
                <div className="flex gap-2">
                  <input className="w-full rounded border px-3 py-2 text-sm" placeholder="ค้นหา..." value={search} onChange={e=>setSearch(e.target.value)} />
                  <select className="rounded border px-2 py-2 text-sm" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
                    <option>All</option>
                    {DEFAULT_TYPES.concat(users.map(u=>u.type).filter(Boolean)).filter((v,i,a)=>a.indexOf(v)===i).map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="mt-3 max-h-[60vh] overflow-auto pr-1">
                  {filtered.map(u=>(
                    <div key={u.id} draggable onDragStart={e=>onDragStartEmp(e,u)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50">
                      <span className="avatar" style={{background:colorFor(u.id)}}>{(u.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{u.name}{u.type?` (${u.type})`:''}</div>
                        <div className="text-[11px] text-slate-500">{u.id}</div>
                      </div>
                      {stationByEmp.has(String(u.id)) && (
                        <span className="pill text-[10px]" style={{borderColor:groupColorOfStation(stationByEmp.get(String(u.id))), color:groupColorOfStation(stationByEmp.get(String(u.id)))}}>
                          อยู่: {stationByEmp.get(String(u.id))}
                        </span>
                      )}
                      <button className="text-rose-600 text-xs border px-2 py-1 rounded" onClick={()=>onDeleteUser(u.id)}>ลบ</button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Boards */}
            <section className="col-span-12 md:col-span-8 lg:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {layout.order.map(group=>{
                  const g=layout.groups[group]||{}; const gColor=g.color||'#0ea5e9'; const stations=normStations(g); const cols=Math.max(1,Number(g.cols)||2);
                  return (
                    <div key={group}>
                      <div className="mb-2 flex items-center justify-between px-3 py-2 rounded border" style={{background:`linear-gradient(90deg, ${hexToRgba(gColor,.08)}, transparent)`, borderColor:hexToRgba(gColor,.35)}}>
                        <div className="text-lg font-bold" style={{color:gColor}}>{group}</div>
                      </div>
                      <div className="grid gap-3" style={{gridTemplateColumns:`repeat(${cols}, minmax(0, 1fr))`}}>
                        {stations.map(st=>{
                          const rec = planBySt.get(st.id)||{station:st.id,assignedList:[]};
                          const emps = (rec.assignedList||[]).map(id=>userMap[id]).filter(Boolean);
                          const fontPx = (st.fontPx || g.fontPx || 18);
                          return (
                            <div key={st.id}
                              className={`tile ${emps.length? '' : 'missing'}`}
                              style={{borderLeft:`6px solid ${st.color||gColor}`}}
                              onDragOver={(e)=>{e.preventDefault(); e.currentTarget.classList.add('drop');}}
                              onDragLeave={(e)=>{e.currentTarget.classList.remove('drop');}}
                              onDrop={(e)=>{e.preventDefault(); e.currentTarget.classList.remove('drop'); let emp=null; try{emp=JSON.parse(e.dataTransfer.getData('text/plain')||'')}catch{} if(!emp?.id) return; moveEmpToStation(emp.id, st.id); }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="font-extrabold" style={{fontSize:`${fontPx}px`}}>{st.id}</div>
                                <button className="text-xs underline text-sky-600" onClick={()=> setAssign({open:true,station:st.id, sel:new Set(rec.assignedList||[]), q:''}) }>แก้ไขพนักงาน</button>
                              </div>
                              {emps.length>0?(
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {emps.slice(0,6).map(a=>(
                                    <span key={a.id} className="flex items-center gap-1">
                                      <span className="avatar" style={{background:colorFor(a.id)}}>{(a.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                                      <span className="text-xs text-slate-700">{a.name}{a.type?` (${a.type})`:''}</span>
                                    </span>
                                  ))}
                                  {emps.length>6 && <span className="text-xs text-slate-500">+{emps.length-6}</span>}
                                </div>
                              ):(
                                <button className="pill mt-1" onClick={()=> setAssign({open:true,station:st.id, sel:new Set(), q:''}) }>คลิกเพื่อเลือกพนักงาน</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Assign modal */}
            {assign.open && <AssignModal state={assign} setState={setAssign} users={users} onSave={async(ids)=>{ await fbSet('/Plan/'+assign.station, {id:assign.station, station:assign.station, assignedList:Array.from(new Set(ids)), updatedAt:new Date().toISOString()}); setAssign({open:false,station:'',sel:new Set(),q:''}); pushToast('อัปเดตพนักงานสำเร็จ','ok'); }} />}
          </div>
        );
      }

      function AssignModal({state,setState,users,onSave}){
        const {station,sel,q} = state;
        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
            <div className="card w-[560px] max-w-[95vw] p-4 fadein">
              <div className="text-lg font-semibold">เลือกพนักงาน — สถานี {station}</div>
              <div className="mt-2"><input className="w-full rounded border px-3 py-2 text-sm" placeholder="ค้นหา..." value={q} onChange={e=>setState(s=>({...s,q:e.target.value}))} /></div>
              <div className="max-h-[52vh] overflow-auto mt-3 space-y-1 pr-1">
                {users.filter(u=> (u.name+u.id+(u.type||'')).toLowerCase().includes(q.toLowerCase())).map(u=>{
                  const chosen = sel.has(u.id);
                  return (
                    <label key={u.id} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${chosen?'bg-sky-50 border border-sky-200':'hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={chosen} onChange={()=> setState(s=>{ const copy=new Set(s.sel); if(copy.has(u.id)) copy.delete(u.id); else copy.add(u.id); return {...s, sel:copy}; }) }/>
                      <span className="avatar" style={{background:colorFor(u.id)}}>{(u.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{u.name}{u.type?` (${u.type})`:''}</div>
                        <div className="text-[10px] text-slate-500">{u.id}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button className="btn" onClick={()=>setState({open:false,station:'',sel:new Set(),q:''})}>ยกเลิก</button>
                <button className="btnP" onClick={()=> onSave(Array.from(sel)) }>บันทึก</button>
              </div>
            </div>
          </div>
        );
      }

      /* ---------- Issues Page (no images, editable & deletable) ---------- */
      function IssuesPage({exportIssuesXlsx}){
        const [form,setForm] = useState({type:'Hardware',priority:'Medium',station:'',reporter:'',message:''});
        const [issues,setIssues] = useState([]);
        const [selected,setSelected] = useState(null);
        const [edit,setEdit] = useState(null); // editable copy
        const [filters,setFilters] = useState({q:'',status:'ทั้งหมด'});
        const [chatText,setChatText] = useState('');
        const [chat,setChat] = useState([]);

        useEffect(()=>{ const off=fbOn('/Issues', s=>{ const v=s.val()||{}; const arr=Object.values(v); arr.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||''))); setIssues(arr); }); return ()=>{try{off();}catch{}}; },[]);
        useEffect(()=>{ if(!selected){ setChat([]); setEdit(null); return; } const off=fbOn('/IssueChats/'+selected.id, s=>{ const v=s.val()||{}; const arr=Object.values(v); arr.sort((a,b)=>(a.ts||'').localeCompare(b.ts||'')); setChat(arr); }); return ()=>{ try{off();}catch{} }; },[selected?.id]);

        async function createTicket(e){ e.preventDefault(); if(!form.message.trim()) return pushToast('กรุณากรอกรายละเอียด'); const ref=fbPushRef('/Issues'); const id=ref.key; const obj={id,time:new Date().toISOString(),type:form.type,priority:form.priority,station:form.station||'',reporter:form.reporter||'',message:form.message||'',status:'Open'}; await fbSet('/Issues/'+id,obj); setForm({type:'Hardware',priority:'Medium',station:'',reporter:'',message:''}); pushToast('บันทึกเคสแล้ว','ok'); }
        async function saveEdit(){ if(!edit) return; await fbUpdate('/Issues/'+edit.id, {...edit}); setSelected(edit); pushToast('อัปเดตเคสแล้ว','ok'); }
        async function delIssue(){ if(!selected) return; if(!confirm('ลบเคสนี้?')) return; await fbRemove('/Issues/'+selected.id); setSelected(null); setEdit(null); pushToast('ลบแล้ว','ok'); }
        async function setStatus(st){ if(!selected) return; await fbUpdate('/Issues/'+selected.id,{status:st}); }
        async function sendChat(){ if(!selected||!chatText.trim()) return; const ref=fbPushRef('/IssueChats/'+selected.id); const id=ref.key; await fbSet('/IssueChats/'+selected.id+'/'+id,{role:'user',content:chatText.trim(),ts:new Date().toISOString()}); setChatText(''); }

        const filtered = useMemo(()=> issues.filter(i=> (filters.status==='ทั้งหมด'||i.status===filters.status) && (!filters.q || `${i.station||''} ${i.message||''} ${i.reporter||''}`.toLowerCase().includes(filters.q.toLowerCase())) ), [issues,filters]);

        return (
          <div className="grid grid-cols-12 gap-6">
            {/* Create */}
            <div className="col-span-12 lg:col-span-4">
              <div className="card p-4">
                <div className="text-lg font-semibold mb-2">ปัญหา</div>
                <form onSubmit={createTicket} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-slate-500 mb-1">ประเภท</div><select className="w-full rounded border px-3 py-2" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['Hardware','Software','Network','Safety','อื่นๆ'].map(x=><option key={x}>{x}</option>)}</select></div>
                    <div><div className="text-xs text-slate-500 mb-1">ด่วน</div><select className="w-full rounded border px-3 py-2" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{['Low','Medium','High','Critical'].map(x=><option key={x}>{x}</option>)}</select></div>
                  </div>
                  <div><div className="text-xs text-slate-500 mb-1">สถานี</div><input className="w-full rounded border px-3 py-2" value={form.station} onChange={e=>setForm({...form,station:e.target.value})}/></div>
                  <div><div className="text-xs text-slate-500 mb-1">ผู้แจ้ง</div><input className="w-full rounded border px-3 py-2" value={form.reporter} onChange={e=>setForm({...form,reporter:e.target.value})}/></div>
                  <div><div className="text-xs text-slate-500 mb-1">รายละเอียด *</div><textarea className="w-full rounded border px-3 py-2" rows="4" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required/></div>
                  <div className="flex justify-end"><button className="btnP" type="submit">บันทึก</button></div>
                </form>
                <div className="mt-4"><button className="btn w-full" onClick={()=>exportIssuesXlsx(issues)}>Export เคสทั้งหมด</button></div>
              </div>
            </div>

            {/* List + Detail */}
            <div className="col-span-12 lg:col-span-8">
              <div className="card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="text-lg font-semibold mr-auto">ประวัติเคส</div>
                  <input className="rounded border px-3 py-2 text-sm" placeholder="ค้นหา..." value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
                  <select className="rounded border px-2 py-2 text-sm" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}>{['ทั้งหมด','Open','Assigned','In Progress','Resolved','Cancelled'].map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 xl:col-span-7 max-h-[55vh] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500"><tr><th className="py-2 pr-3">เวลา</th><th className="py-2 pr-3">สถานี</th><th className="py-2 pr-3">ประเภท</th><th className="py-2 pr-3">ด่วน</th><th className="py-2 pr-3">สถานะ</th><th className="py-2">รายละเอียด</th></tr></thead>
                      <tbody>
                        {filtered.map(it=>(
                          <tr key={it.id} className={`border-t cursor-pointer ${selected?.id===it.id?'bg-sky-50':''}`} onClick={()=>{ setSelected(it); setEdit({...it}); }}>
                            <td className="py-2 pr-3 whitespace-nowrap">{new Date(it.time).toLocaleString()}</td>
                            <td className="py-2 pr-3">{it.station||'-'}</td>
                            <td className="py-2 pr-3">{it.type}</td>
                            <td className="py-2 pr-3">{it.priority}</td>
                            <td className="py-2 pr-3"><span className="badge">{it.status}</span></td>
                            <td className="py-2">{(it.message||'').slice(0,60)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="col-span-12 xl:col-span-5">
                    <div className="border rounded-xl p-3 h-full flex flex-col">
                      <div className="font-semibold mb-2">รายละเอียดเคส</div>
                      {selected ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><div className="text-slate-500 text-xs">เวลา</div><div>{new Date(selected.time).toLocaleString()}</div></div>
                            <div>
                              <div className="text-slate-500 text-xs">สถานะ</div>
                              <select className="w-full border rounded px-2 py-1" value={selected.status} onChange={e=>{ setSelected({...selected,status:e.target.value}); fbUpdate('/Issues/'+selected.id,{status:e.target.value}); }}>
                                {['Open','Assigned','In Progress','Resolved','Cancelled'].map(s=><option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2"><div className="text-slate-500 text-xs">สถานี</div><input className="w-full border rounded px-2 py-1" value={edit?.station||''} onChange={e=>setEdit({...edit,station:e.target.value})}/></div>
                            <div><div className="text-slate-500 text-xs">ประเภท</div><input className="w-full border rounded px-2 py-1" value={edit?.type||''} onChange={e=>setEdit({...edit,type:e.target.value})}/></div>
                            <div><div className="text-slate-500 text-xs">ด่วน</div><select className="w-full border rounded px-2 py-1" value={edit?.priority||'Medium'} onChange={e=>setEdit({...edit,priority:e.target.value})}>{['Low','Medium','High','Critical'].map(s=><option key={s}>{s}</option>)}</select></div>
                            <div className="col-span-2"><div className="text-slate-500 text-xs">ผู้แจ้ง</div><input className="w-full border rounded px-2 py-1" value={edit?.reporter||''} onChange={e=>setEdit({...edit,reporter:e.target.value})}/></div>
                            <div className="col-span-2"><div className="text-slate-500 text-xs">รายละเอียด</div><textarea className="w-full border rounded px-2 py-1" rows="4" value={edit?.message||''} onChange={e=>setEdit({...edit,message:e.target.value})}/></div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button className="btn" onClick={()=>saveEdit()}>บันทึกการแก้ไข</button>
                            <button className="btn text-rose-600" onClick={delIssue}>ลบเคส</button>
                          </div>
                          <div className="mt-3 border-t pt-3 flex-1 flex flex-col">
                            <div className="font-medium mb-2">พูดคุยในเคส</div>
                            <div className="flex-1 overflow-auto space-y-2 mb-2">
                              {chat.map((m,i)=>(
                                <div key={i} className={m.role==='user'?'text-right':'text-left'}>
                                  <div className={`inline-block px-3 py-2 rounded-lg ${m.role==='user'?'bg-sky-100':'bg-slate-100'}`}>{m.content}</div>
                                  <div className="text-[10px] text-slate-500 mt-1">{new Date(m.ts).toLocaleString()}</div>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <input className="flex-1 rounded border px-3 py-2 text-sm" placeholder="พิมพ์ข้อความ..." value={chatText} onChange={e=>setChatText(e.target.value)} />
                              <button className="btnP" type="button" onClick={sendChat}>ส่ง</button>
                            </div>
                          </div>
                        </>
                      ):<div className="text-sm text-slate-500">เลือกเคสจากตาราง</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      /* ---------- Layout Page (โครงสร้าง) ---------- */
      function LayoutPage({layout,setLayout}){
        const [draft,setDraft] = useState(JSON.parse(JSON.stringify(layout)));
        useEffect(()=> setDraft(JSON.parse(JSON.stringify(layout))),[layout]);

        function save(){ fbSet('/Layout', draft).then(()=>pushToast('บันทึกโครงสร้างสำเร็จ','ok')); }
        function addGroup(){ const name=prompt('ชื่อกลุ่มใหม่'); if(!name) return; if(draft.groups[name]) return pushToast('มีกลุ่มนี้แล้ว'); const d={...draft}; d.groups[name]={color:'#0ea5e9',cols:2,fontPx:18,stations:[]}; d.order=[...d.order,name]; setDraft(d); }
        function removeGroup(g){ if(!confirm('ลบกลุ่ม '+g+' ?')) return; const d={...draft}; delete d.groups[g]; d.order=d.order.filter(x=>x!==g); setDraft(d); }
        function renameGroup(g){ const name=prompt('ชื่อใหม่',g); if(!name||name===g) return; const d={...draft}; d.groups[name]=d.groups[g]; delete d.groups[g]; d.order=d.order.map(x=>x===g?name:x); setDraft(d); }
        function setColor(g,val){ const d={...draft}; d.groups[g]={...d.groups[g],color:val}; setDraft(d); }
        function setCols(g,val){ const d={...draft}; d.groups[g]={...d.groups[g],cols:Math.max(1,Math.min(6,Number(val)||2))}; setDraft(d); }
        function setFont(g,val){ const d={...draft}; d.groups[g]={...d.groups[g],fontPx:Math.max(10,Math.min(56,Number(val)||18))}; setDraft(d); }
        function addStation(g){ const id=prompt('เพิ่มสถานีใน '+g); if(!id) return; const d={...draft}; const arr=normStations(d.groups[g]); if(arr.find(x=>x.id===id)) return pushToast('มีสถานีนี้แล้ว'); d.groups[g].stations=[...arr,{id, color:'', fontPx:null}]; setDraft(d); }
        function setStationColor(g,idx,val){ const d={...draft}; const arr=normStations(d.groups[g]); arr[idx]={...arr[idx],color:val}; d.groups[g].stations=arr; setDraft(d); }
        function setStationFont(g,idx,val){ const d={...draft}; const arr=normStations(d.groups[g]); arr[idx]={...arr[idx],fontPx:Math.max(10,Math.min(72,Number(val)||null))}; d.groups[g].stations=arr; setDraft(d); }
        function moveStation(g,idx,dir){ const d={...draft}; const arr=normStations(d.groups[g]); const j=idx+dir; if(j<0||j>=arr.length) return; [arr[idx],arr[j]]=[arr[j],arr[idx]]; d.groups[g].stations=arr; setDraft(d); }
        function removeStation(g,idx){ const d={...draft}; const arr=normStations(d.groups[g]); arr.splice(idx,1); d.groups[g].stations=arr; setDraft(d); }

        return (
          <div className="card p-4">
            <div className="text-lg font-semibold mb-3">โครงสร้าง — สีประจำกลุ่ม/สถานี • สไลด์อัตโนมัติ • จัดตำแหน่งสถานี</div>

            {/* Auto slide settings */}
            <div className="border rounded-xl p-3 mb-4">
              <div className="font-medium mb-2">สไลด์อัตโนมัติ (หน้า “แสดงผล”)</div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!draft.autoSlide?.enabled} onChange={e=>setDraft(d=>({...d,autoSlide:{...d.autoSlide,enabled:e.target.checked}}))}/>
                  เปิดใช้งาน
                </label>
                <label className="flex items-center gap-2">ทุก
                  <input type="number" className="w-20 border rounded px-2 py-1" min="5" max="120" value={Number(draft.autoSlide?.intervalSec||15)} onChange={e=>setDraft(d=>({...d,autoSlide:{...d.autoSlide,intervalSec:Math.max(5,Math.min(120,Number(e.target.value)||15))}}))}/>
                  วินาที
                </label>
                <span className="text-slate-500">หน้าที่จะวน: {draft.autoSlide?.pages?.join(', ')||draft.order.join(', ')}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button className="btn" onClick={addGroup}>+ เพิ่มกลุ่ม</button>
              <button className="btnP" onClick={save}>บันทึก</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {draft.order.map(g=>{
                const group=draft.groups[g]||{color:'#0ea5e9',cols:2,fontPx:18,stations:[]};
                const stations=normStations(group);
                return (
                  <div key={g} className="border rounded-xl p-3">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div className="font-semibold text-base sm:text-lg" style={{color:group.color}}>{g}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button className="btn" onClick={()=>renameGroup(g)}>เปลี่ยนชื่อ</button>
                        <button className="btn text-rose-600" onClick={()=>removeGroup(g)}>ลบกลุ่ม</button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                      <label className="flex items-center gap-2">สี: <input type="color" value={group.color} onChange={e=>setColor(g,e.target.value)}/></label>
                      <label className="flex items-center gap-2">คอลัมน์: <input type="number" className="w-20 border rounded px-2 py-1" min="1" max="6" value={group.cols} onChange={e=>setCols(g,e.target.value)}/></label>
                      <label className="flex items-center gap-2">ขนาดตัวหนังสือ(สถานี): <input type="number" className="w-24 border rounded px-2 py-1" min="10" max="56" value={group.fontPx} onChange={e=>setFont(g,e.target.value)}/> px</label>
                      <button className="btn" onClick={()=>addStation(g)}>+ เพิ่มสถานี</button>
                    </div>

                    <div className="mt-3 grid" style={{gridTemplateColumns:`repeat(${Math.max(1,Number(group.cols)||2)}, minmax(0,1fr))`, gap:'10px'}}>
                      {stations.map((st,idx)=>(
                        <div key={st.id} className="border rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold" style={{fontSize:`${st.fontPx||group.fontPx||18}px`}}>
                              {st.id} <span className="text-xs text-slate-500">(font {st.fontPx||group.fontPx||18}px)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="text-xs px-2 py-1 border rounded" onClick={()=>moveStation(g,idx,-1)}>↑</button>
                              <button className="text-xs px-2 py-1 border rounded" onClick={()=>moveStation(g,idx, 1)}>↓</button>
                              <button className="text-xs px-2 py-1 border rounded text-rose-600" onClick={()=>removeStation(g,idx)}>ลบ</button>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                            <label className="flex items-center gap-2">สี(สถานี): <input type="color" value={st.color||''} onChange={e=>setStationColor(g,idx,e.target.value)}/></label>
                            <label className="flex items-center gap-2">ขนาดตัวหนังสือ: <input type="number" className="w-20 border rounded px-2 py-1" min="10" max="72" value={st.fontPx||''} onChange={e=>setStationFont(g,idx,e.target.value)}/> px</label>
                          </div>
                        </div>
                      ))}
                      {stations.length===0 && <div className="text-slate-500 text-sm">ยังไม่มีสถานี</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      /* ---------- Display Page (read-only, TV-ready, auto-slide) ---------- */
      function DisplayPage({layout,planBySt,userMap}){
        const [pageIdx,setPageIdx] = useState(0);
        const pages = layout.autoSlide?.pages?.length ? layout.autoSlide.pages : layout.order;
        const active = pages[Math.min(pageIdx, pages.length-1)] || pages[0];

        useEffect(()=>{
          if(!layout.autoSlide?.enabled) return;
          const t = setInterval(()=> setPageIdx(i => (i+1)%pages.length), Math.max(5000,(layout.autoSlide?.intervalSec||15)*1000));
          return ()=>clearInterval(t);
        },[layout.autoSlide?.enabled, layout.autoSlide?.intervalSec, pages.length]);

        function renderGroup(group){
          const g = layout.groups[group]||{};
          const cols = Math.max(1,Number(g.cols)||2);
          const color = g.color||'#0ea5e9';
          const stations = normStations(g);
          return (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 text-2xl font-bold" style={{color:color, background:`linear-gradient(90deg, ${hexToRgba(color,.08)}, transparent)`, borderTop:'1px solid '+hexToRgba(color,.35), borderBottom:'1px solid '+hexToRgba(color,.35)}}>{group}</div>
              <div className="flex-1 overflow-auto p-4">
                <div className="display-grid grid" style={{gridTemplateColumns:`repeat(${cols}, minmax(0, 1fr))`}}>
                  {stations.map(st=>{
                    const rec = planBySt.get(st.id)||{station:st.id,assignedList:[]};
                    const emps = (rec.assignedList||[]).map(id=>userMap[id]).filter(Boolean);
                    const fontPx = (st.fontPx||g.fontPx||22);
                    return (
                      <div key={st.id} className="tile" style={{borderLeft:`8px solid ${st.color||color}`}}>
                        <div className="font-extrabold" style={{fontSize:`${fontPx}px`}}>{st.id}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          {emps.length? emps.map(e=>(
                            <span key={e.id} className="pill">{e.name}{e.type?` (${e.type})`:''}</span>
                          )) : <span className="text-slate-500 text-sm">-</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="card display-wrap">
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 flex items-center justify-between border-b">
                <div className="text-lg font-semibold">แสดงผล (อ่านอย่างเดียว)</div>
                <div className="flex items-center gap-2 text-sm">
                  <button className="btn" onClick={()=>setPageIdx(i=>(i-1+pages.length)%pages.length)}>ก่อนหน้า</button>
                  <div className="badge">{pageIdx+1}/{pages.length}</div>
                  <button className="btn" onClick={()=>setPageIdx(i=>(i+1)%pages.length)}>ถัดไป</button>
                </div>
              </div>
              <div className="flex-1">
                {renderGroup(active)}
              </div>
            </div>
          </div>
        );
      }

      /* ---------- Mount ---------- */
      ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
    </script>
  </body>
</html>
