<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>SheetOps — Floor Plan + TV + ปัญหา + โครงสร้าง</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.19.3/xlsx.full.min.js"></script>
    <style>
      html,body,#root{height:100%}
      body{background:#f8fafc;color:#0f172a}
      .card{border:1px solid rgba(148,163,184,.25);border-radius:1rem;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:box-shadow .3s,transform .2s}
      .card:hover{box-shadow:0 4px 24px rgba(59,130,246,.12),0 2px 4px rgba(0,0,0,.04);transform:scale(1.01)}
      .tile{border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:.75rem;padding:14px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;justify-content:center;min-height:84px;transition:box-shadow .15s,transform .2s}
      .tile:hover{box-shadow:0 2px 12px rgba(0,213,255,.12);transform:scale(1.02) translateY(-1px)}
      .tile.drop{outline:2px dashed #38bdf8;outline-offset:2px;background:rgba(56,189,248,.06)}
      .tile.missing{background:linear-gradient(180deg,rgba(241,245,249,.7),rgba(255,255,255,1))}
      .pill{display:inline-flex;align-items:center;gap:.35rem;padding:.15rem .5rem;border-radius:999px;font-size:11px;border:1px solid rgba(148,163,184,.35);background:#fff;white-space:nowrap}
      .avatar{width:24px;height:24px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:white}
      .select{appearance:none;background:#fff url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22 fill=%22none%22><path d=%22M6 8l4 4 4-4%22 stroke=%22%23343a40%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>') no-repeat right .75rem center/1.3em 1.3em;border-radius:.5rem}
      .btn{padding:.5rem 1rem;border-radius:.7rem;border:1px solid rgba(148,163,184,.35);background:#fff;transition:all .2s cubic-bezier(.4,0,.2,1);min-width:120px}
      .btn:hover{background:#f0f9ff;transform:scale(1.04)}
      .btnP{background:linear-gradient(90deg,#0ea5e9 60%,#818cf8 100%);border-color:#0ea5e9;color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.07)}
      .badge{font-size:11px;border:1px solid rgba(148,163,184,.45);padding:.15rem .5rem;border-radius:9999px}
      .fadein{animation:fadein .4s}
      @keyframes fadein{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}

      /* TV view */
      .tv-wrap{background:#0b1220;color:#e2e8f0}
      .tv-card{background:rgba(17,24,39,.6);border:1px solid rgba(148,163,184,.25);border-radius:18px}
      .tv-station{border:1px solid rgba(148,163,184,.35);border-radius:14px;padding:10px 12px;min-height:86px;background:rgba(30,41,59,.6)}
      .tv-title{font-size:28px;font-weight:800;letter-spacing:.2px}
      .tv-emp{font-size:18px}
      .tv-avatar{width:30px;height:30px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800}
      .drag{cursor:grab}
      .drag:active{cursor:grabbing}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <div id="toasts" class="fixed top-3 right-3 space-y-2 z-[9999]"></div>

    <!-- Firebase -->
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
      const {useState,useEffect,useMemo} = React;

      /* ---------- Toast ---------- */
      function pushToast(msg, type='error'){
        try{
          const wrap = document.getElementById('toasts'); if(!wrap) return;
          const el = document.createElement('div');
          el.className = `fadein px-3 py-2 rounded-xl text-sm shadow border ${type==='error'?'bg-rose-50 border-rose-200 text-rose-800':'bg-emerald-50 border-emerald-200 text-emerald-800'}`;
          el.textContent = msg; wrap.appendChild(el);
          setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-6px)'; }, 3000);
          setTimeout(()=>{ try{wrap.removeChild(el)}catch{} }, 3400);
        }catch{}
      }

      /* ---------- XLSX Export ---------- */
      function exportUsers(users){
        if(!users?.length) return pushToast('ไม่มีรายชื่อให้ Export');
        const rows = users.map(u=>({ID:u.id||'', Name:u.name||'', TYPE:u.type||''}));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        XLSX.writeFile(wb, 'users.xlsx');
        pushToast('Export สำเร็จ','ok');
      }
      function exportAssignments(plan, userMap, groupFilter){
        const items = Object.values(plan||{});
        let rows=[];
        for(const t of items){
          if(groupFilter && !(t.group===groupFilter)) continue;
          for(const id of (t.assignedList||[])){
            const u=userMap[id]||{};
            rows.push({Station:t.station, EmployeeID:id, Name:u.name||'', TYPE:u.type||'', Group:t.group||''});
          }
        }
        if(rows.length===0) return pushToast('ไม่มีข้อมูลการมอบหมาย');
        const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb,ws,'Assignments');
        XLSX.writeFile(wb,'assignments.xlsx');
        pushToast('Export สำเร็จ','ok');
      }

      /* ---------- Firebase helpers ---------- */
      const hasFb = () => !!(window.fb && window.fb.db && window.fb.dbApi);
      const fbSet = (p,v)=>window.fb.dbApi.set(window.fb.dbApi.dbRef(window.fb.db,p),v);
      const fbUpdate = (p,v)=>window.fb.dbApi.update(window.fb.dbApi.dbRef(window.fb.db,p),v);
      const fbRemove = (p)=>window.fb.dbApi.remove(window.fb.dbApi.dbRef(window.fb.db,p));
      const fbPushRef = (p)=>window.fb.dbApi.push(window.fb.dbApi.dbRef(window.fb.db,p));
      const fbOn = (p,cb)=>window.fb.dbApi.onValue(window.fb.dbApi.dbRef(window.fb.db,p),cb);

      /* ---------- Defaults & Helpers ---------- */
      const DEFAULT_TYPES = ['Support','Case replen','Sorter','Picker','put to slot','Build','Tote'];
      const DEFAULT_LAYOUT = {
        order: ['Floor 1','Floor 2','Floor 3','Extra'],
        groups: {
          'Floor 1': { color:'#0284c7', cols:2, stations:[{id:'1101'},{id:'1102'},{id:'1103'},{id:'1104'},{id:'1105'},{id:'1106'},{id:'1107'},{id:'1201'},{id:'1203'},{id:'1205'}] },
          'Floor 2': { color:'#a16207', cols:2, stations:[{id:'2101'},{id:'2102'},{id:'2103'},{id:'2104'},{id:'2105'},{id:'2201'},{id:'2203'},{id:'2205'}] },
          'Floor 3': { color:'#4f46e5', cols:2, stations:[{id:'3101'},{id:'3105'},{id:'3201'},{id:'3205'}] },
          'Extra':   { color:'#0ea5e9', cols:2, stations:[{id:'Support'},{id:'Case replen'},{id:'Sorter'},{id:'put to slot'},{id:'Picker'},{id:'Build'},{id:'Tote'},{id:'Lan1'},{id:'Lan2'},{id:'Lan3'},{id:'Lan4'}] }
        }
      };
      const colorFor = key => { const colors=['#0ea5e9','#06b6d4','#14b8a6','#22c55e','#a3e635','#eab308','#f59e0b','#ef4444','#6366f1','#8b5cf6','#ec4899','#f43f5e']; let h=0; for(let i=0;i<key.length;i++)h=key.charCodeAt(i)+((h<<5)-h); return colors[Math.abs(h)%colors.length]; };
      const hexToRgba=(hex,alpha=1)=>{try{const c=hex.replace('#','');const n=c.length===3?c.split('').map(x=>x+x).join(''):c;const r=parseInt(n.slice(0,2),16),g=parseInt(n.slice(2,4),16),b=parseInt(n.slice(4,6),16);return `rgba(${r},${g},${b},${alpha})`;}catch{return 'rgba(14,165,233,.08)'}};
      const normStations = (group)=> (group?.stations||[]).map(s=> typeof s==='string'? {id:s,color:''} : {id:String(s.id), color:s.color||''});

      /* ======================= APP ======================= */
      function App(){
        const [page,setPage] = useState('plan'); // plan | tv | layout | issues
        const [users,setUsers] = useState([]);
        const [plan,setPlan] = useState({});        // {stationKey:{id,group,station,assignedList}}
        const [layout,setLayout] = useState(DEFAULT_LAYOUT);
        const [tvSettings,setTvSettings] = useState({auto:true, intervalSec:10, pageSize:4});
        const [loading,setLoading] = useState(true);

        // UI states
        const [search,setSearch] = useState('');
        const [typeFilter,setTypeFilter] = useState('All');
        const [addingUser,setAddingUser] = useState(false);
        const [newUser,setNewUser] = useState({id:'',name:'',type:''});
        const [assignStation,setAssignStation] = useState(null);
        const [assignQuery,setAssignQuery] = useState('');
        const [assignSel,setAssignSel] = useState(new Set());
        const [exportOpen,setExportOpen] = useState(false);

        // Subscriptions: Users / Plan / Layout / Settings
        useEffect(()=>{
          if(!hasFb()){ pushToast('ไม่พบ Firebase'); return; }
          const offUsers = fbOn('/User', snap=>{ const v=snap.val()||{}; setUsers(Object.values(v)); });
          const offPlan  = fbOn('/Plan', snap=>{ const v=snap.val()||{}; setPlan(v); });
          const offLayout= fbOn('/Layout', async snap=>{
            const v=snap.val();
            if(v && v.order && v.groups){ setLayout(v); setLoading(false); }
            else { await fbSet('/Layout', DEFAULT_LAYOUT); setLayout(DEFAULT_LAYOUT); setLoading(false); }
          });
          const offTv   = fbOn('/Settings/tv', snap=>{ const v=snap.val(); if(v) setTvSettings({...{auto:true,intervalSec:10,pageSize:4}, ...v}); });
          return ()=>{ try{offUsers();offPlan();offLayout();offTv();}catch{} };
        }, []);

        const userMap = useMemo(()=>Object.fromEntries(users.map(u=>[String(u.id),u])),[users]);
        const planByStation = useMemo(()=>{ const m=new Map(); for(const key of Object.keys(plan||{})){ const t=plan[key]; m.set(String(t.station), t); } return m; },[plan]);
        const empAssignMap = useMemo(()=>{ const m=new Map(); for(const key of Object.keys(plan||{})){ const t=plan[key]; for(const id of (t.assignedList||[])){ const arr=m.get(id)||[]; arr.push(t.station); m.set(id,arr); } } return m; }, [plan]);
        const allTypes = useMemo(()=>{ const raw = users.map(u=>String(u.type||'').trim()).filter(Boolean); const mp=new Map(); for(const t of raw){ const k=t.toLowerCase(); if(!mp.has(k)) mp.set(k,t); } return Array.from(mp.values()).sort((a,b)=>a.localeCompare(b,'th')); }, [users]);

        async function writePlan(station, group, list){
          const payload = { id:String(station), group:String(group), station:String(station), assignedList:Array.from(new Set(list||[])), updatedAt:new Date().toISOString() };
          await fbSet('/Plan/'+String(station), payload);
        }
        async function moveEmpToStation(empId, station, group){
          // remove from all stations
          for(const key of Object.keys(plan||{})){
            const t=plan[key]; if((t.assignedList||[]).includes(empId) && t.station!==station){ await writePlan(t.station, t.group, t.assignedList.filter(x=>x!==empId)); }
          }
          const cur=(planByStation.get(station)?.assignedList)||[]; if(!cur.includes(empId)) await writePlan(station, group, [...cur, empId]); pushToast(`มอบหมาย ${userMap[empId]?.name||empId} → ${station}`,'ok');
        }
        async function clearGroup(group){ const sts = normStations(layout.groups[group]).map(s=>s.id); for(const st of sts){ await writePlan(st, group, []); } pushToast('ล้างคนออกจาก '+group,'ok'); }

        async function addUser(){ if(!newUser.id.trim() || !newUser.name.trim()) return pushToast('กรุณากรอก ID และ ชื่อ-นามสกุล'); await fbSet('/User/'+String(newUser.id).trim(), { id:newUser.id.trim(), name:newUser.name.trim(), type:String(newUser.type||'').trim() }); setNewUser({id:'',name:'',type:''}); setAddingUser(false); pushToast('เพิ่มพนักงานเรียบร้อย','ok'); }
        async function deleteUser(id){ if(!confirm('ลบพนักงานนี้?')) return; await fbRemove('/User/'+String(id)); for(const key of Object.keys(plan||{})){ const t=plan[key]; if((t.assignedList||[]).includes(id)) await writePlan(t.station, t.group, t.assignedList.filter(x=>x!==id)); } pushToast('ลบสำเร็จ','ok'); }
        async function saveTvSettings(v){ const nv={...tvSettings, ...v}; setTvSettings(nv); await fbSet('/Settings/tv', nv); }

        return (
          <div className="min-h-screen">
            {/* Topbar */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
                <div className="text-xl md:text-2xl font-bold">KKRDC PITL</div>
                <div className="ml-4 flex items-center gap-2">
                  <button className={`btn ${page==='plan'?'btnP text-white':''}`} onClick={()=>setPage('plan')}>แผนผัง</button>
                  <button className={`btn ${page==='tv'?'btnP text-white':''}`} onClick={()=>setPage('tv')}>จอแสดงผล</button>
                  <button className={`btn ${page==='layout'?'btnP text-white':''}`} onClick={()=>setPage('layout')}>โครงสร้าง</button>
                  <button className={`btn ${page==='issues'?'btnP text-white':''}`} onClick={()=>setPage('issues')}>ปัญหา</button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {page==='plan' && (
                    <>
                      <button className="btn" onClick={()=>setExportOpen(true)}>Export</button>
                      <button className="btn" onClick={()=>setAddingUser(true)}>+ เพิ่มพนักงาน</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Pages */}
            <div className="max-w-7xl mx-auto px-4 py-5">
              {page==='plan' && (
                <PlanPage
                  users={users}
                  layout={layout}
                  planByStation={planByStation}
                  empAssignMap={empAssignMap}
                  userMap={userMap}
                  moveEmpToStation={moveEmpToStation}
                  deleteUser={deleteUser}
                  clearGroup={clearGroup}
                  search={search} setSearch={setSearch}
                  typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                  allTypes={allTypes}
                  setAssignStation={setAssignStation}
                  setAssignQuery={setAssignQuery}
                  setAssignSel={setAssignSel}
                />
              )}

              {page==='tv' && (
                <TvView layout={layout} planByStation={planByStation} userMap={userMap} tvSettings={tvSettings} saveTvSettings={saveTvSettings} />
              )}

              {page==='layout' && (
                <LayoutPage layout={layout} setLayout={setLayout} />
              )}

              {page==='issues' && (
                <IssuesPage layout={layout} />
              )}
            </div>

            {/* Modals */}
            {addingUser && (
              <AddUserModal onClose={()=>setAddingUser(false)} onSave={addUser} newUser={newUser} setNewUser={setNewUser} allTypes={allTypes} />
            )}

            {assignStation && (
              <AssignModal
                users={users}
                station={assignStation}
                group={Object.keys(layout.groups).find(g=> normStations(layout.groups[g]).some(s=>s.id===assignStation))}
                close={()=>{ setAssignStation(null); setAssignSel(new Set()); }}
                assignSel={assignSel}
                setAssignSel={setAssignSel}
                assignQuery={assignQuery}
                setAssignQuery={setAssignQuery}
                save={async (ids, group)=>{ await fbSet('/Plan/'+assignStation, { id:assignStation, group, station:assignStation, assignedList:ids, updatedAt:new Date().toISOString() }); setAssignStation(null); setAssignSel(new Set()); pushToast('อัปเดตพนักงานสำเร็จ','ok'); }}
              />
            )}

            {exportOpen && (
              <ExportModal
                close={()=>setExportOpen(false)}
                groups={layout.order}
                onExport={(opt)=>{
                  if(opt.kind==='users') exportUsers(users);
                  else if(opt.kind==='assign') exportAssignments(plan, userMap, opt.group==='ทั้งหมด'?null:opt.group);
                }}
              />
            )}
          </div>
        );
      }

      /* ---------- Components ---------- */
      function AddUserModal({onClose,onSave,newUser,setNewUser,allTypes}){
        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
            <div className="card w-[520px] max-w-[95vw] p-5 fadein">
              <div className="text-lg font-semibold">เพิ่มพนักงาน</div>
              <form onSubmit={(e)=>{e.preventDefault();onSave();}}>
                <div className="grid grid-cols-2 gap-3 mt-3">
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
                      {[...new Set([...DEFAULT_TYPES, ...allTypes])].map(t=>(<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button type="button" className="btn" onClick={onClose}>ยกเลิก</button>
                  <button type="submit" className="btnP">บันทึก</button>
                </div>
              </form>
            </div>
          </div>
        );
      }

      function PlanPage({ users, layout, planByStation, empAssignMap, userMap, moveEmpToStation, deleteUser, clearGroup, search, setSearch, typeFilter, setTypeFilter, allTypes, setAssignStation, setAssignQuery, setAssignSel }){
        function onDragStartEmp(e, emp){ e.dataTransfer.setData('text/plain', JSON.stringify(emp)); e.dataTransfer.effectAllowed='move'; }
        const filtered = useMemo(()=>{ const q=(search||'').toLowerCase(); return users.filter(u => (typeFilter==='All' || u.type===typeFilter) && (u.name+u.id).toLowerCase().includes(q)); }, [users, search, typeFilter]);

        return (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="col-span-12 md:col-span-3">
              <div className="card p-3 fadein">
                <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                  <span className="w-5 h-5 rounded bg-sky-500 text-white grid place-items-center text-[10px]">E</span>Employee
                </div>
                <input placeholder="Search by name..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={search} onChange={e=>setSearch(e.target.value)} />
                <div className="mt-2">
                  <select className="select w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
                    <option value="All">All</option>
                    {[...new Set([...DEFAULT_TYPES, ...allTypes])].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="mt-3 max-h-[60vh] overflow-auto pr-1">
                  {filtered.map(u=>{
                    const places = empAssignMap.get(u.id)||[]; const assigned = places.length>0;
                    return (
                      <div key={u.id} draggable onDragStart={(e)=>onDragStartEmp(e,u)} className={`flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 fadein ${assigned?'bg-emerald-50/50 border border-emerald-200':''}`}>
                        <span className="avatar shadow" style={{background:colorFor(String(u.id))}}>
                          {(u.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{u.name}{u.type?' ('+u.type+')':''}</div>
                          <div className="text-[11px] text-slate-500">{u.id}</div>
                          {assigned && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {places.map(p => <span key={p} className="badge bg-emerald-50 border-emerald-300 text-emerald-800">{p}</span>)}
                            </div>
                          )}
                        </div>
                        <button className="text-rose-600 text-xs border px-2 py-1 rounded" onClick={()=>deleteUser(u.id)}>ลบ</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Main */}
            <section className="col-span-12 md:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {layout.order.map(group=>{
                  const g = layout.groups[group]||{}; const gColor=g.color||'#0ea5e9'; const stations = normStations(g); const cols = Math.max(1, Number(g.cols)||2);
                  return (
                    <div key={group}>
                      <div className="mb-2 flex items-center justify-between px-3 py-2 rounded border" style={{background:`linear-gradient(90deg, ${hexToRgba(gColor,.09)}, transparent)`, borderColor:hexToRgba(gColor,.35)}}>
                        <div className="text-lg font-bold" style={{color:gColor}}>{group}</div>
                        <button className="btn" onClick={()=>clearGroup(group)}>🧹 ล้าง</button>
                      </div>
                      <div className={`grid gap-3`} style={{gridTemplateColumns:`repeat(${cols}, minmax(0, 1fr))`}}>
                        {stations.map(st=>{
                          const ids=(planByStation.get(st.id)?.assignedList)||[]; const assigned=ids.map(id=>userMap[id]).filter(Boolean); const missing=assigned.length===0; const color = st.color||gColor;
                          return (
                            <div key={st.id}
                              className={`tile ${missing?'missing':''}`}
                              style={{borderLeft:`5px solid ${color}`}}
                              onDragOver={(e)=>{e.preventDefault(); e.currentTarget.classList.add('drop');}}
                              onDragLeave={(e)=>{e.currentTarget.classList.remove('drop');}}
                              onDrop={async(e)=>{ e.preventDefault(); e.currentTarget.classList.remove('drop'); let emp=null; try{ emp = JSON.parse(e.dataTransfer.getData('text/plain')||''); }catch{} if(!emp?.id) return; await moveEmpToStation(emp.id, st.id, group); }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="font-semibold">{st.id}</div>
                                <button className="text-xs underline text-sky-600" onClick={()=>{ setAssignStation(st.id); setAssignQuery(''); setAssignSel(new Set(ids)); }}>แก้ไขพนักงาน</button>
                              </div>
                              {assigned.length>0 ? (
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {assigned.slice(0,6).map(a=>(
                                    <span key={a.id} className="flex items-center gap-1">
                                      <span className="avatar" style={{background:colorFor(String(a.id))}}>{(a.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                                      <span className="text-xs text-slate-700">{a.name}{a.type?' ('+a.type+')':''}</span>
                                    </span>
                                  ))}
                                  {assigned.length>6 && <span className="text-xs text-slate-500">+{assigned.length-6}</span>}
                                </div>
                              ) : (
                                <button className="pill hover:shadow" onClick={()=>{ setAssignStation(st.id); setAssignQuery(''); setAssignSel(new Set()); }}>คลิกเพื่อเลือกพนักงาน</button>
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
          </div>
        );
      }

      function AssignModal({users, station, group, close, assignSel, setAssignSel, assignQuery, setAssignQuery, save}){
        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
            <div className="card w-[560px] max-w-[95vw] p-4 fadein">
              <div className="text-lg font-semibold">เลือกพนักงาน — สถานี {station}</div>
              <div className="mt-2 flex items-center gap-2">
                <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="ค้นหา..." value={assignQuery} onChange={e=>setAssignQuery(e.target.value)} />
              </div>
              <div className="max-h-[50vh] overflow-auto mt-3 space-y-1 pr-1">
                {users.filter(u=> (u.name+u.id+(u.type||'')).toLowerCase().includes(assignQuery.toLowerCase())).map(u=>{
                  const chosen = assignSel.has(u.id);
                  return (
                    <label key={u.id} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${chosen?'bg-sky-50 border border-sky-200':'hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={chosen} onChange={()=>{ setAssignSel(s=>{ const c=new Set(s); if(c.has(u.id)) c.delete(u.id); else c.add(u.id); return c; }); }} />
                      <span className="avatar" style={{background:colorFor(String(u.id))}}>{(u.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{u.name}{u.type ? ' ('+u.type+')' : ''}</div>
                        <div className="text-[10px] text-slate-500">{u.id}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button className="btn" onClick={close}>ยกเลิก</button>
                <button className="btnP" onClick={()=>save(Array.from(assignSel), group)}>บันทึก</button>
              </div>
            </div>
          </div>
        );
      }

      function TvView({layout, planByStation, userMap, tvSettings, saveTvSettings}){
        const pages = useMemo(()=>{
          const size=Math.max(1, Number(tvSettings.pageSize)||4);
          const arr=[]; for(let i=0;i<layout.order.length;i+=size){ arr.push(layout.order.slice(i,i+size)); }
          return arr.length?arr:[[]];
        }, [layout.order, tvSettings.pageSize]);
        const [idx,setIdx] = React.useState(0);
        useEffect(()=>{ if(!tvSettings.auto) return; const t=setInterval(()=>setIdx(i=> (i+1)%pages.length), Math.max(3,Number(tvSettings.intervalSec)||10)*1000); return ()=>clearInterval(t); }, [tvSettings.auto, tvSettings.intervalSec, pages.length]);
        const curGroups = pages[idx]||[];
        const now = new Date();
        return (
          <div className="tv-wrap min-h-[82vh] p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="tv-title">KKRDC — แผนผังการมอบหมายงาน</div>
              <div className="text-xl font-semibold">{now.toLocaleString()}</div>
            </div>

            {/* Settings (สไลด์อัตโนมัติ) */}
            <div className="mb-3 flex items-center gap-3 text-slate-200">
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!tvSettings.auto} onChange={e=>saveTvSettings({auto:e.target.checked})}/> สไลด์อัตโนมัติ</label>
              <label className="flex items-center gap-2">ช่วง(วินาที)<input type="number" min="3" className="w-20 text-black rounded px-2 py-1" value={tvSettings.intervalSec} onChange={e=>saveTvSettings({intervalSec:Number(e.target.value)||10})}/></label>
              <label className="flex items-center gap-2">จำนวนกลุ่ม/สไลด์<select className="text-black rounded px-2 py-1" value={tvSettings.pageSize} onChange={e=>saveTvSettings({pageSize:Number(e.target.value)||4})}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
              <span className="ml-auto">สไลด์ {idx+1}/{pages.length}</span>
            </div>

            <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">
              {curGroups.map(group=>{
                const g = layout.groups[group]||{}; const gColor=g.color||'#0ea5e9'; const stations = normStations(g);
                return (
                  <div key={group} className="tv-card p-4" style={{borderColor:hexToRgba(gColor,.35)}}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xl font-bold" style={{color:gColor}}>{group}</div>
                    </div>
                    <div className={`grid gap-2`} style={{gridTemplateColumns:`repeat(${Math.max(1,Number(g.cols)||2)}, minmax(0, 1fr))`}}>
                      {stations.map(st=>{
                        const ids=(planByStation.get(st.id)?.assignedList)||[]; const emps=ids.map(id=>userMap[id]).filter(Boolean); const color=st.color||gColor;
                        return (
                          <div key={st.id} className="tv-station" style={{borderLeft:`6px solid ${color}`}}>
                            <div className="flex items-center justify-between">
                              <div className="font-bold">{st.id}</div>
                              {emps.length===0 && <span className="text-xs text-slate-300">ยังไม่มอบหมาย</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {emps.map(e=>(
                                <div key={e.id} className="tv-emp flex items-center gap-2">
                                  <span className="tv-avatar" style={{background:colorFor(String(e.id))}}>{(e.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                                  <span className="text-slate-100">{e.name}{e.type?' ('+e.type+')':''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      function LayoutPage({layout, setLayout}){
        const [draft,setDraft] = useState(JSON.parse(JSON.stringify(layout)));
        const [drag,setDrag] = useState({g:null, idx:-1});
        useEffect(()=>setDraft(JSON.parse(JSON.stringify(layout))), [layout]);

        function addGroup(){ const name=prompt('ชื่อกลุ่มใหม่'); if(!name) return; if(draft.groups[name]) return pushToast('มีกลุ่มนี้แล้ว'); const d={...draft, order:[...draft.order, name], groups:{...draft.groups,[name]:{color:'#0ea5e9',cols:2,stations:[]}}}; setDraft(d); }
        function removeGroup(g){ if(!confirm('ลบกลุ่ม '+g+' ?')) return; const d={...draft, order:draft.order.filter(x=>x!==g)}; const gg={...d.groups}; delete gg[g]; d.groups=gg; setDraft(d); }
        function renameGroup(g){ const name=prompt('ชื่อใหม่ของกลุ่ม', g); if(!name || name===g) return; const d={...draft}; d.groups[name]=d.groups[g]; delete d.groups[g]; d.order=d.order.map(x=> x===g?name:x); setDraft(d); }
        function setGroupColor(g, color){ const d={...draft}; d.groups[g]={...d.groups[g], color}; setDraft(d); }
        function setGroupCols(g, cols){ const d={...draft}; d.groups[g]={...d.groups[g], cols:Math.max(1,Math.min(6,Number(cols)||2))}; setDraft(d); }
        function addStation(g){ const id=prompt('เพิ่มสถานีใน '+g); if(!id) return; const d={...draft}; const arr=normStations(d.groups[g]); if(arr.find(x=>x.id===id)) return pushToast('มีสถานีนี้แล้ว'); d.groups[g].stations=[...arr,{id, color:''}]; setDraft(d); }
        function setStationColor(g, idx, color){ const d={...draft}; const arr=normStations(d.groups[g]); arr[idx]={...arr[idx], color}; d.groups[g].stations=arr; setDraft(d); }
        function removeStation(g, idx){ const d={...draft}; const arr=normStations(d.groups[g]); arr.splice(idx,1); d.groups[g].stations=arr; setDraft(d); }
        function moveStation(g, idx, dir){ const d={...draft}; const arr=normStations(d.groups[g]); const j=idx+dir; if(j<0||j>=arr.length) return; [arr[idx],arr[j]]=[arr[j],arr[idx]]; d.groups[g].stations=arr; setDraft(d); }
        async function saveDraft(){ await fbSet('/Layout', draft); pushToast('บันทึกโครงสร้างสำเร็จ','ok'); }

        return (
          <div className="card p-4">
            <div className="text-lg font-semibold mb-3">โครงสร้างเมนู/สถานี + สีประจำ + จัดตำแหน่ง (บันทึกลง Firebase)</div>
            <div className="flex items-center gap-2 mb-3">
              <button className="btn" onClick={addGroup}>+ เพิ่มกลุ่ม</button>
              <button className="btnP" onClick={saveDraft}>บันทึก</button>
            </div>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
              {draft.order.map(g=>{
                const group = draft.groups[g]||{color:'#0ea5e9',cols:2,stations:[]}; const stations = normStations(group);
                return (
                  <div key={g} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold flex items-center gap-3">
                        <span>{g}</span>
                        <button className="text-xs underline" onClick={()=>renameGroup(g)}>เปลี่ยนชื่อ</button>
                        <label className="text-xs flex items-center gap-2">สี: <input type="color" value={group.color||'#0ea5e9'} onChange={e=>setGroupColor(g, e.target.value)} /></label>
                        <label className="text-xs flex items-center gap-2">คอลัมน์: <input type="number" className="w-16 border rounded px-2 py-1" min="1" max="6" value={group.cols||2} onChange={e=>setGroupCols(g, e.target.value)} /></label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn" onClick={()=>addStation(g)}>+ เพิ่มสถานี</button>
                        <button className="btn text-rose-600" onClick={()=>removeGroup(g)}>ลบกลุ่ม</button>
                      </div>
                    </div>
                    <div className="mt-2 grid" style={{gridTemplateColumns:`repeat(${Math.max(1,Number(group.cols)||2)}, minmax(0, 1fr))`, gap:'10px'}}>
                      {stations.map((st,i)=> (
                        <div key={st.id} className="border rounded-lg p-2 drag" draggable
                             onDragStart={()=>setDrag({g,idx:i})}
                             onDragOver={(e)=>e.preventDefault()}
                             onDrop={()=>{ if(drag.g===g && drag.idx!==i){ moveStation(g, drag.idx, i-drag.idx); setDrag({g:null,idx:-1}); } }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="badge">{st.id}</span>
                              <label className="text-xs flex items-center gap-2">สี: <input type="color" value={st.color||''} onChange={e=>setStationColor(g,i,e.target.value)} /></label>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="text-xs px-2 py-1 border rounded" onClick={()=>moveStation(g,i,-1)}>↑</button>
                              <button className="text-xs px-2 py-1 border rounded" onClick={()=>moveStation(g,i, 1)}>↓</button>
                              <button className="text-xs px-2 py-1 border rounded text-rose-600" onClick={()=>removeStation(g,i)}>ลบ</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {stations.length===0 && <div className="text-slate-500 text-sm">ยังไม่มีสถานี</div>}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">ลากการ์ดเพื่อจัดตำแหน่ง ซ้าย→ขวา/บน→ล่าง ตามตาราง</div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-slate-500 mt-3">การจัดลำดับและจำนวนคอลัมน์จะสะท้อนในหน้าแผนผังและจอแสดงผล</div>
          </div>
        );
      }

      function IssuesPage({layout}){
        const [form,setForm] = useState({type:'Hardware',priority:'Medium',station:'',reporter:'',message:''});
        const [issues,setIssues] = useState([]);
        const [selected,setSelected] = useState(null);
        const [filters,setFilters] = useState({q:'', status:'ทั้งหมด', type:'ทั้งหมด', prio:'ทั้งหมด'});

        useEffect(()=>{ const off=fbOn('/Issues', snap=>{ const v=snap.val()||{}; const list=Object.values(v); list.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||''))); setIssues(list); }); return ()=>{ try{off();}catch{} }; },[]);
        const allStations = useMemo(()=> layout.order.flatMap(g=> normStations(layout.groups[g]).map(s=>s.id)), [layout]);

        async function createTicket(e){ e.preventDefault(); if(!form.message.trim()) return pushToast('กรุณากรอกรายละเอียด'); const ref=fbPushRef('/Issues'); const id=ref.key; await fbSet('/Issues/'+id, { id, time:new Date().toISOString(), type:form.type, priority:form.priority, station:form.station||'', reporter:form.reporter||'', message:form.message||'', status:'Open' }); setForm({type:'Hardware',priority:'Medium',station:'',reporter:'',message:''}); pushToast('บันทึกเคสแล้ว','ok'); }
        async function updateTicket(id, patch){ await fbUpdate('/Issues/'+id, patch); }
        async function deleteTicket(id){ if(confirm('ลบเคสนี้?')){ await fbRemove('/Issues/'+id); setSelected(null); } }

        const filtered = useMemo(()=> issues.filter(it=>{ if(filters.status!=='ทั้งหมด' && (it.status||'')!==filters.status) return false; if(filters.type!=='ทั้งหมด' && (it.type||'')!==filters.type) return false; if(filters.prio!=='ทั้งหมด' && (it.priority||'')!==filters.prio) return false; if(filters.q && !(`${it.station||''} ${it.message||''} ${it.reporter||''}`.toLowerCase().includes(filters.q.toLowerCase()))) return false; return true; }), [issues, filters]);

        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="card p-4">
                <div className="text-lg font-semibold mb-2">ปัญหา</div>
                <form onSubmit={createTicket} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">ประเภท</div>
                      <select className="w-full rounded border px-3 py-2" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['Hardware','Software','Network','Safety','อื่นๆ'].map(x=><option key={x}>{x}</option>)}</select>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">ความเร่งด่วน</div>
                      <select className="w-full rounded border px-3 py-2" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{['Low','Medium','High','Critical'].map(x=><option key={x}>{x}</option>)}</select>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">สถานี (ถ้ามี)</div>
                    <select className="w-full rounded border px-3 py-2" value={form.station} onChange={e=>setForm({...form,station:e.target.value})}>
                      <option value="">(ไม่ระบุ)</option>
                      {allStations.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">ผู้แจ้ง</div>
                    <input className="w-full rounded border px-3 py-2" value={form.reporter} onChange={e=>setForm({...form,reporter:e.target.value})}/>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">รายละเอียด *</div>
                    <textarea className="w-full rounded border px-3 py-2" rows="4" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required/>
                  </div>
                  <div className="flex justify-end"><button className="btnP" type="submit">บันทึก</button></div>
                </form>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg font-semibold mr-auto">ประวัติเคส</div>
                  <input className="rounded border px-3 py-2 text-sm" placeholder="ค้นหา..." value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
                  <select className="rounded border px-2 py-2 text-sm" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}>{['ทั้งหมด','Open','Assigned','In Progress','Resolved','Cancelled'].map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 xl:col-span-7 max-h-[55vh] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500"><tr><th className="py-2 pr-3">เวลา</th><th className="py-2 pr-3">สถานี</th><th className="py-2 pr-3">ประเภท</th><th className="py-2 pr-3">ด่วน</th><th className="py-2 pr-3">สถานะ</th><th className="py-2">รายละเอียด</th></tr></thead>
                      <tbody>
                        {filtered.map(it=> (
                          <tr key={it.id} className={`border-t cursor-pointer ${selected?.id===it.id?'bg-sky-50':''}`} onClick={()=>setSelected(it)}>
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
                          <div className="text-sm">
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-2">
                              <div><span className="text-slate-500">เวลา:</span> {new Date(selected.time).toLocaleString()}</div>
                              <div><span className="text-slate-500">สถานี:</span> {selected.station||'-'}</div>
                              <div><span className="text-slate-500">ประเภท:</span> {selected.type}</div>
                              <div><span className="text-slate-500">ด่วน:</span> {selected.priority}</div>
                              <div><span className="text-slate-500">ผู้แจ้ง:</span> {selected.reporter||'-'}</div>
                            </div>
                            <div className="mb-2 whitespace-pre-wrap">{selected.message}</div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <button className="btn" onClick={()=>updateTicket(selected.id,{status:'Assigned'})}>รับเรื่อง</button>
                              <button className="btn" onClick={()=>updateTicket(selected.id,{status:'In Progress'})}>กำลังดำเนินการ</button>
                              <button className="btn" onClick={()=>updateTicket(selected.id,{status:'Resolved',resolvedAt:new Date().toISOString()})}>แก้ไขแล้ว</button>
                              <button className="btn" onClick={()=>updateTicket(selected.id,{status:'Cancelled'})}>ยกเลิก</button>
                              <button className="btn text-rose-600" onClick={()=>deleteTicket(selected.id)}>ลบเคส</button>
                            </div>
                          </div>
                        </>
                      ) : <div className="text-sm text-slate-500">เลือกเคสจากตาราง</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      function ExportModal({close, groups, onExport}){
        const [kind,setKind] = useState('users');
        const [group,setGroup] = useState('ทั้งหมด');
        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
            <div className="card w-[520px] max-w-[95vw] p-5 fadein">
              <div className="text-lg font-semibold">Export</div>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">ประเภทข้อมูล</div>
                  <select className="w-full border rounded px-3 py-2" value={kind} onChange={e=>setKind(e.target.value)}>
                    <option value="users">รายชื่อพนักงาน (Excel)</option>
                    <option value="assign">การมอบหมาย (Excel)</option>
                  </select>
                </div>
                {kind==='assign' && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">กลุ่ม</div>
                    <select className="w-full border rounded px-3 py-2" value={group} onChange={e=>setGroup(e.target.value)}>
                      <option>ทั้งหมด</option>
                      {groups.map(g=>(<option key={g}>{g}</option>))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="btn" onClick={close}>ยกเลิก</button>
                <button className="btnP" onClick={()=>{ onExport({kind, group}); close(); }}>Export</button>
              </div>
            </div>
          </div>
        );
      }

      ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
    </script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch(()=>{});
        });
      }
    </script>
  </body>
</html>
