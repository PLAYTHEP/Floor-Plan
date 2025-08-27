<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>SheetOps — Floor Plan + ปัญหา</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#0ea5e9" />
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.19.3/xlsx.full.min.js"></script>
    <style>
      html,body,#root{height:100%}
      body{background:#f8fafc; color:#0f172a}
      .card{border:1px solid rgba(148,163,184,.25);border-radius:1rem;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04)}
      .tile{border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:.75rem;padding:14px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;justify-content:center;min-height:80px;transition:box-shadow .15s,transform .2s;}
      .tile:hover{box-shadow:0 2px 12px rgba(0,213,255,0.12);transform:scale(1.025) translateY(-2px)}
      .tile.drop{outline:2px dashed #38bdf8; outline-offset:2px; background:rgba(56,189,248,.06)}
      .tile.missing{background:linear-gradient(180deg,rgba(241,245,249,.7),rgba(255,255,255,1));}
      .pill{display:inline-flex;align-items:center;gap:.35rem;padding:.15rem .5rem;border-radius:999px;font-size:11px;border:1px solid rgba(148,163,184,.35);background:#fff;white-space:nowrap}
      .avatar{width:24px;height:24px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:white;transition:box-shadow .2s;}
      .floor1{--c:#0284c7;--bg:linear-gradient(90deg,rgba(14,165,233,.06),rgba(14,165,233,0))}
      .floor2{--c:#a16207;--bg:linear-gradient(90deg,rgba(234,179,8,.09),rgba(234,179,8,0))}
      .floor3{--c:#4f46e5;--bg:linear-gradient(90deg,rgba(99,102,241,.08),rgba(99,102,241,0))}
      .floorX{--c:#0ea5e9;--bg:linear-gradient(90deg,rgba(14,165,233,.08),rgba(14,165,233,0))}
      .floorTitle{color:var(--c); font-weight:800}
      .sectionHead{padding:.5rem 1rem;border-radius:.75rem;background:var(--bg);border:1px dashed color-mix(in srgb, var(--c) 40%, transparent)}
      .tileTitle{font-weight:700}
      .btn{padding:.5rem 1rem;border-radius:.7rem;border:1px solid rgba(148,163,184,.35);background:white;transition:all .2s cubic-bezier(.4,0,.2,1);min-width:120px}
      .btn:hover{background:#f0f9ff; transform:scale(1.04);}
      .btn:disabled{opacity:.55; cursor:not-allowed; transform:none}
      .btnP{background:linear-gradient(90deg,#0ea5e9 60%,#818cf8 100%);border-color:#0ea5e9;color:white;box-shadow:0 2px 8px 0 rgba(14,165,233,0.07);}
      .btnP:hover{background:linear-gradient(90deg,#0284c7 60%,#6366f1 100%); border-color:#0284c7}
      .select{appearance:none;background:#fff url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22 fill=%22none%22><path d=%22M6 8l4 4 4-4%22 stroke=%22%23343a40%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>') no-repeat right .75rem center/1.3em 1.3em;border-radius:.5rem}
      .fadein {animation: fadein 0.4s;}
      @keyframes fadein {from {opacity: 0; transform: scale(0.98);} to {opacity: 1; transform: scale(1);} }
      #toasts>div { transition: opacity .4s, transform .6s; }
      .card { transition: box-shadow 0.3s, transform 0.2s;}
      .card:hover { box-shadow: 0 4px 24px rgba(59,130,246,0.12),0 2px 4px rgba(0,0,0,0.04); transform:scale(1.01);} 
      .badge{font-size:11px;border:1px solid rgba(148,163,184,.45);padding:.15rem .5rem;border-radius:9999px}
    </style>
  </head>
  <body class="bg-gradient-to-br from-sky-100 via-teal-50 to-indigo-100 min-h-screen">
    <div id="root"></div>
    <div id="toasts" class="fixed top-3 right-3 space-y-2 z-[9999]"></div>

    <!-- Firebase init -->
    <script type="module">
      import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
      import { getDatabase, ref as dbRef, get, set, update, remove, child, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
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
      window.fb = { app, db, dbApi:{ dbRef, get, set, update, remove, child, push, onValue } };
    </script>

    <script type="text/babel">
      const {useState, useEffect, useMemo} = React;

      /* ---------- Toast ---------- */
      function pushToast(msg, type='error'){
        try{
          const wrap = document.getElementById('toasts'); if(!wrap) return;
          const node = document.createElement('div');
          node.className = `fadein px-3 py-2 rounded-xl text-sm shadow border ${type==='error'?'bg-rose-50 border-rose-200 text-rose-800':'bg-emerald-50 border-emerald-200 text-emerald-800'}`;
          node.textContent = msg; wrap.appendChild(node);
          setTimeout(()=>{ node.style.opacity='0'; node.style.transform='translateY(-6px)'; }, 3200);
          setTimeout(()=>{ try{wrap.removeChild(node)}catch{} }, 3600);
        }catch{}
      }

      /* ---------- Excel Export (from Firebase users) ---------- */
      function exportUsersToExcel(users){
        if(!users?.length) return pushToast('ไม่มีรายชื่อให้ Export');
        const rows = users.map(u=>({ ID:u.id||'', Name:u.name||'', TYPE:u.type||'' }));
        const ws = XLSX.utils.json_to_sheet(rows, {header:['ID','Name','TYPE']});
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        XLSX.writeFile(wb, 'users.xlsx');
        pushToast('Export รายชื่อสำเร็จ','ok');
      }

      /* ---------- Firebase Helpers ---------- */
      const hasFb = () => !!(window.fb && window.fb.db && window.fb.dbApi);
      const fbSet = async (path, value) => window.fb.dbApi.set(window.fb.dbApi.dbRef(window.fb.db, path), value);
      const fbUpdate = async (path, value) => window.fb.dbApi.update(window.fb.dbApi.dbRef(window.fb.db, path), value);
      const fbRemove = async (path) => window.fb.dbApi.remove(window.fb.dbApi.dbRef(window.fb.db, path));
      const fbPushRef = (path) => window.fb.dbApi.push(window.fb.dbApi.dbRef(window.fb.db, path));

      /* ---------- Constants ---------- */
      const VIEW_ONLY = new URLSearchParams(location.search).get('mode') === 'view';
      const STATIONS = {
        'Floor 1': ['1101','1102','1103','1104','1105','1106','1107','1201','1203','1205'],
        'Floor 2': ['2101','2102','2103','2104','2105','2201','2203','2205'],
        'Floor 3': ['3101','3105','3201','3205'],
        // กลุ่มด้านล่างสุด (Extra)
        'Extra': ['Support','Case replen','Sorter','put to slot','Picker','Build','Tote','Lan1','Lan2','Lan3','Lan4']
      };
      const GROUP_ORDER = ['Floor 1','Floor 2','Floor 3','Extra'];
      const DEFAULT_TYPES = ['Support','Case replen','Sorter','Picker','put to slot','Build','Tote'];

      const colorFor = key => { const colors=['#0ea5e9','#06b6d4','#14b8a6','#22c55e','#a3e635','#eab308','#f59e0b','#ef4444','#6366f1','#8b5cf6','#ec4899','#f43f5e']; let hash=0; for(let i=0;i<key.length;i++)hash=key.charCodeAt(i)+((hash<<5)-hash); return colors[Math.abs(hash)%colors.length]; };
      const groupClass = name => name==='Floor 1'?'floor1':name==='Floor 2'?'floor2':name==='Floor 3'?'floor3':'floorX';

      /* ======================= APP ======================= */
      function App(){
        const [page,setPage] = useState('plan'); // 'plan' | 'issues'
        const [users,setUsers] = useState([]);
        const [tasks,setTasks] = useState([]);
        const [loading,setLoading] = useState(false);
        const [err,setErr] = useState(null);
        const [search,setSearch] = useState('');
        const [typeFilter,setTypeFilter] = useState('All');
        const [adding,setAdding] = useState(false);
        const [newUser,setNewUser] = useState({id:'',name:'',type:''});
        const [savingUser,setSavingUser] = useState(false);

        const [assignStation,setAssignStation] = useState(null);
        const [assignQuery,setAssignQuery] = useState('');
        const [assignSel,setAssignSel] = useState(new Set());

        /* realtime: users + plan */
        useEffect(()=>{
          if(!hasFb()){ setErr('ไม่พบ Firebase'); return; }
          setLoading(true);
          const {db, dbApi} = window.fb;
          const unsubs = [];
          unsubs.push(dbApi.onValue(dbApi.dbRef(db,'/User'), snap => { const v=snap.val()||{}; setUsers(Object.values(v)); }));
          unsubs.push(dbApi.onValue(dbApi.dbRef(db,'/Plan'), snap => { const v=snap.val()||{}; setTasks(Object.values(v)); }));
          setLoading(false);
          return ()=>{ unsubs.forEach(u=>{ try{u();}catch{} }); };
        }, []);

        const userMap = useMemo(()=>Object.fromEntries(users.map(u=>[String(u.id),u])),[users]);
        const taskByStation = useMemo(()=>{ const m = new Map(); tasks.forEach(t => m.set(String(t.station), t)); return m; }, [tasks]);

        const sheetTypes = useMemo(()=>{
          const raw = users.map(u=>String(u.type||'').trim()).filter(Boolean);
          const map = new Map(); for(const t of raw){ const k=t.toLowerCase(); if(!map.has(k)) map.set(k,t); }
          return Array.from(map.values()).sort((a,b)=>a.localeCompare(b,'th'));
        }, [users]);
        const filteredUsers = useMemo(()=>{ const q=search.toLowerCase(); return users.filter(u => (typeFilter==='All' || u.type===typeFilter) && (u.name+u.id).toLowerCase().includes(q)); }, [users, search, typeFilter]);

        async function writePlan(station, list){
          const payload = { id:String(station), station:String(station), assignedList:Array.from(new Set(list||[])), updatedAt: new Date().toISOString() };
          try{ await fbSet('/Plan/'+String(station), payload); return true; } catch(e){ pushToast('บันทึกไม่สำเร็จ: '+(e?.message||e)); return false; }
        }

        async function addUser(){
          if(VIEW_ONLY) return alert('View-only mode');
          const {id,name,type} = newUser;
          if(!String(id).trim() || !String(name).trim()) return pushToast('กรุณากรอก ID และ ชื่อ-สกุล');
          try{
            setSavingUser(true);
            await fbSet('/User/'+String(id).trim(), { id:String(id).trim(), name:String(name).trim(), type:String(type||'').trim() });
            setNewUser({id:'',name:'',type:''}); setAdding(false); pushToast('เพิ่มพนักงานเรียบร้อย','ok');
          }catch(e){ pushToast('เพิ่มพนักงานไม่สำเร็จ: '+(e?.message||e)); }
          finally{ setSavingUser(false); }
        }
        function onSubmitAdd(e){ e.preventDefault(); addUser(); }

        async function deleteUser(id){
          if(VIEW_ONLY) return alert('View-only mode');
          if(!confirm('แน่ใจว่าต้องการลบพนักงาน ID '+id+' ?')) return;
          try{
            await fbRemove('/User/'+String(id));
            const affected = (tasks||[]).filter(t=> (t.assignedList||[]).includes(id));
            for(const t of affected){ await writePlan(t.station, (t.assignedList||[]).filter(eid=>eid!==id)); }
            pushToast('ลบพนักงานสำเร็จ','ok');
          }catch(e){ pushToast('ลบพนักงานไม่สำเร็จ: '+(e?.message||e)); }
        }

        async function clearGroup(group){
          if(VIEW_ONLY) return alert('View-only mode');
          const stations = STATIONS[group] || [];
          for (const st of stations){ await writePlan(st, []); }
          pushToast('ล้างคนออกจาก '+group,'ok');
        }
        async function clearAll(){ for(const g of Object.keys(STATIONS)){ await clearGroup(g); } }

        const TypeSelect = ({value,onChange,withAll=false}) => (
          <select className="select w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={value} onChange={e=>onChange(e.target.value)}>
            {withAll && <option value="All">All</option>}
            {[...new Set([...DEFAULT_TYPES, ...sheetTypes])].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        );

        // ---- drag helpers ----
        function onDragStartEmp(e, emp) { e.dataTransfer.setData('text/plain', JSON.stringify(emp)); e.dataTransfer.effectAllowed = 'move'; }

        async function moveEmpToStation(empId, targetStation){
          // ดึงสถานีทั้งหมดที่มี empId อยู่
          const containing = (tasks||[]).filter(t => (t.assignedList||[]).includes(empId)).map(t=>({station:t.station, list:t.assignedList}));
          // เอาออกจากสถานีเดิมทั้งหมด (persist)
          for (const c of containing){
            if(c.station===targetStation) continue;
            const newList = (c.list||[]).filter(id=>id!==empId);
            await writePlan(c.station, newList);
          }
          // เพิ่มลงสถานีใหม่ (persist)
          const curList = (taskByStation.get(targetStation)?.assignedList)||[];
          const next = [...curList.filter(id=>id!==empId), empId];
          await writePlan(targetStation, next);
        }

        return (
          <div className="min-h-screen">
            {/* Topbar */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
                <button className="text-xl md:text-2xl font-bold hover:text-sky-600 transition-all" onClick={()=>setPage('plan')}>KKRDC PITL</button>
                <div className="ml-6 flex items-center gap-2">
                  <button className={`btn ${page==='plan'?'btnP text-white border-sky-500':''}`} onClick={()=>setPage('plan')}>แผนผัง</button>
                  <button className={`btn ${page==='issues'?'btnP text-white border-sky-500':''}`} onClick={()=>setPage('issues')}>ปัญหา</button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {!VIEW_ONLY && page==='plan' && (
                    <>
                      <button onClick={()=>exportUsersToExcel(users)} className="btn bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm hover:scale-105">Export รายชื่อ</button>
                      <button onClick={async()=>{ await clearAll(); }} className="btn">🧹 ล้างทั้งหมด</button>
                      <button onClick={()=>setAdding(true)} className="btn">+ เพิ่มพนักงาน</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-5">
              {page==='plan' && (
                <div className="grid grid-cols-12 gap-6">
                  {/* Sidebar */}
                  <aside className="col-span-12 md:col-span-3">
                    <div className="card p-3 fadein">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                        <span className="w-5 h-5 rounded bg-sky-500 text-white grid place-items-center text-[10px]">E</span>Employee
                      </div>
                      <input placeholder="Search by name..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={search} onChange={e=>setSearch(e.target.value)} />
                      <div className="mt-2"><TypeSelect value={typeFilter} onChange={setTypeFilter} withAll /></div>
                      <div className="mt-3 max-h-[60vh] overflow-auto pr-1">
                        {filteredUsers.map(u => (
                          <div key={u.id} draggable={!VIEW_ONLY} onDragStart={(e)=>onDragStartEmp(e,u)} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 fadein">
                            <span className="avatar shadow" style={{background:colorFor(String(u.id))}}>{(u.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{u.name}{u.type ? ' ('+u.type+')' : ''}</div>
                              <div className="text-[10px] text-slate-500">{u.id}</div>
                            </div>
                            {!VIEW_ONLY && <button className="text-rose-600 text-xs border px-2 py-1 rounded" onClick={()=>deleteUser(u.id)}>ลบ</button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>

                  {/* Main Grid */}
                  <section className="col-span-12 md:col-span-9">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {GROUP_ORDER.map(group => (
                        <div key={group} className={groupClass(group)}>
                          <div className="sectionHead mb-2 flex items-center justify-between">
                            <div className="floorTitle text-lg">{group}</div>
                            <div className="flex items-center gap-2">
                              {!VIEW_ONLY && <button className="btn" onClick={() => clearGroup(group)}>🧹 ล้าง</button>}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {(STATIONS[group]||[]).map(st => (
                              <Tile
                                key={st}
                                station={st}
                                userMap={userMap}
                                taskByStation={taskByStation}
                                onMoveEmp={moveEmpToStation}
                                setAssignStation={setAssignStation}
                                setAssignQuery={setAssignQuery}
                                setAssignSel={setAssignSel}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {page==='issues' && <IssuesPage />}
            </div>

            <div className="text-center text-xs text-slate-500 pb-6">{loading?'Loading…':err?`เกิดข้อผิดพลาด: ${err}`:'พร้อมใช้งาน'}</div>

            {/* Add User Modal */}
            {adding && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
                <div className="card w-[520px] max-w-[95vw] p-5 fadein">
                  <div className="text-lg font-semibold">เพิ่มพนักงาน</div>
                  <form onSubmit={onSubmitAdd}>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">ID *</div>
                        <input required className="w-full rounded-lg border border-slate-300 px-3 py-2" value={newUser.id} onChange={e=>setNewUser({...newUser,id:e.target.value})}/>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">ชื่อ-นามสกุล *</div>
                        <input required className="w-full rounded-lg border border-slate-300 px-3 py-2" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})}/>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-slate-500 mb-1">TYPE</div>
                        <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={newUser.type} onChange={e=>setNewUser({...newUser,type:e.target.value})}>
                          <option value="">(ไม่ระบุ)</option>
                          {[...new Set([...DEFAULT_TYPES, ...sheetTypes])].map(t=>(<option key={t} value={t}>{t}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button type="button" className="btn" onClick={()=>setAdding(false)}>ยกเลิก</button>
                      <button type="submit" className="btnP" disabled={savingUser}>{savingUser?'กำลังบันทึก...':'บันทึก'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Assign Modal */}
            {assignStation && (
              <AssignModal
                users={users}
                assignStation={assignStation}
                setAssignStation={setAssignStation}
                assignSel={assignSel}
                setAssignSel={setAssignSel}
                assignQuery={assignQuery}
                setAssignQuery={setAssignQuery}
                writePlan={writePlan}
              />
            )}
          </div>
        );

        /* ---------- Tile ---------- */
        function Tile({station, userMap, taskByStation, onMoveEmp, setAssignStation, setAssignQuery, setAssignSel}){
          const t = taskByStation.get(station) || {station, assignedList:[]};
          const assigned = (t.assignedList||[]).map(id => userMap[id]).filter(Boolean);
          const missing = !assigned.length;
          return (
            <div className={`tile ${missing?'missing':''}`}
              onDragOver={(e)=>{e.preventDefault(); e.currentTarget.classList.add('drop');}}
              onDragLeave={(e)=>{e.currentTarget.classList.remove('drop');}}
              onDrop={async(e)=>{
                e.preventDefault(); e.currentTarget.classList.remove('drop');
                let emp=null; try{ emp = JSON.parse(e.dataTransfer.getData('text/plain')||''); }catch{}
                if(!emp?.id) return;
                await onMoveEmp(emp.id, station);
                pushToast(`มอบหมาย ${emp.name} → ${station}`,'ok');
              }}>
              <div className="flex items-center gap-2 w-full justify-between">
                <div className="tileTitle flex items-center gap-2">{station}</div>
              </div>
              {assigned.length>0 ? (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {assigned.slice(0,6).map(a => (
                    <span key={a.id} className="flex items-center gap-1">
                      <span className="avatar" style={{background:colorFor(String(a.id))}}>{(a.name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}</span>
                      <span className="text-xs text-slate-700">{a.name}{a?.type ? ' ('+a.type+')' : ''}</span>
                    </span>
                  ))}
                  {assigned.length>6 && <span className="text-xs text-slate-500">+{assigned.length-6}</span>}
                </div>
              ) : (
                <button className="pill hover:shadow" onClick={()=>{ setAssignStation(station); setAssignQuery(''); setAssignSel(new Set()); }}>คลิกเพื่อเลือกพนักงาน</button>
              )}
              <div className="mt-2">
                <button className="text-xs underline text-sky-600" onClick={()=>{ setAssignStation(station); setAssignQuery(''); setAssignSel(new Set()); }}>แก้ไขพนักงาน</button>
              </div>
            </div>
          );
        }

        /* ---------- Assign Modal ---------- */
        function AssignModal({users, assignStation, setAssignStation, assignSel, setAssignSel, assignQuery, setAssignQuery, writePlan}){
          return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
              <div className="card w-[560px] max-w-[95vw] p-4 fadein">
                <div className="text-lg font-semibold">เลือกพนักงาน — สถานี {assignStation}</div>
                <div className="mt-2 flex items-center gap-2">
                  <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="ค้นหา..." value={assignQuery} onChange={e=>setAssignQuery(e.target.value)} />
                </div>
                <div className="max-h-[50vh] overflow-auto mt-3 space-y-1 pr-1">
                  {users.filter(u=> (u.name+u.id+(u.type||'')).toLowerCase().includes(assignQuery.toLowerCase())).map(u=>{
                    const chosen = assignSel.has(u.id);
                    return (
                      <label key={u.id} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${chosen?'bg-sky-50 border border-sky-200':'hover:bg-slate-50'}`}>
                        <input type="checkbox" checked={chosen} onChange={()=>{
                          setAssignSel(s=>{ const copy=new Set(s); if(copy.has(u.id)) copy.delete(u.id); else copy.add(u.id); return copy; });
                        }} />
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
                  <button className="btn" onClick={()=>{ setAssignStation(null); setAssignSel(new Set()); }}>ยกเลิก</button>
                  <button className="btnP" onClick={async()=>{
                    const list = Array.from(assignSel);
                    await writePlan(assignStation, list);
                    setAssignStation(null); setAssignSel(new Set());
                    pushToast('อัปเดตพนักงานสำเร็จ','ok');
                  }}>บันทึก</button>
                </div>
              </div>
            </div>
          );
        }
      }

      /* ---------- Issues Page (no images; Firebase only) ---------- */
      function IssuesPage(){
        const [form, setForm] = useState({ type:'Hardware', priority:'Medium', station:'', reporter:'', message:'' });
        const [issues, setIssues] = useState([]);
        const [selected, setSelected] = useState(null);
        const [filters, setFilters] = useState({q:'', status:'ทั้งหมด', type:'ทั้งหมด', prio:'ทั้งหมด'});
        const [chat, setChat] = useState([]);
        const [chatText, setChatText] = useState('');
        const [editing, setEditing] = useState(false);
        const [editForm, setEditForm] = useState({ type:'', priority:'', station:'', reporter:'', message:'' });
        const [savingTicket, setSavingTicket] = useState(false);
        const [savingEdit, setSavingEdit] = useState(false);

        useEffect(()=>{
          const {db, dbApi} = window.fb;
          const off = dbApi.onValue(dbApi.dbRef(db,'/Issues'), snap=>{
            const v = snap.val()||{}; const list = Object.values(v);
            list.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||'')));
            setIssues(list);
            if(selected){ const s = list.find(x=>x.id===selected.id); if(s) setSelected(s); }
          });
          return ()=>{ try{off();}catch{} };
        }, []);

        useEffect(()=>{
          const {db, dbApi} = window.fb;
          if(!selected){ setChat([]); return; }
          const ref = dbApi.dbRef(db, `/IssueChats/${selected.id}`);
          const off = dbApi.onValue(ref, snap=>{
            const v=snap.val()||{}; const msgs = Object.values(v);
            msgs.sort((a,b)=> (a.ts||'').localeCompare(b.ts||'')); setChat(msgs);
          });
          return ()=>{ try{off();}catch{} };
        }, [selected?.id]);

        useEffect(()=>{
          if(!selected){ setEditing(false); return; }
          setEditForm({
            type: selected.type||'Hardware',
            priority: selected.priority||'Medium',
            station: selected.station||'',
            reporter: selected.reporter||'',
            message: selected.message||'',
          });
        }, [selected?.id]);

        async function createTicket(e){
          e.preventDefault();
          if(!form.message.trim()) return pushToast('กรุณากรอกรายละเอียดปัญหา');
          try{
            setSavingTicket(true);
            const keyRef = fbPushRef('/Issues');
            const id = keyRef.key;
            const ticket = {
              id,
              time: new Date().toISOString(),
              type: form.type,
              priority: form.priority,
              station: form.station||'',
              reporter: form.reporter||'',
              message: form.message||'',
              status: 'Open',
              assignedTo: []
            };
            await fbSet('/Issues/'+id, ticket);
            setForm({ type:'Hardware', priority:'Medium', station:'', reporter:'', message:'' });
            pushToast('บันทึกเคสสำเร็จ','ok');
          }catch(e){ pushToast('สร้างเคสไม่สำเร็จ: '+(e?.message||e)); }
          finally { setSavingTicket(false); }
        }

        async function updateTicketFields(){
          if(!selected) return;
          try{
            setSavingEdit(true);
            await fbUpdate('/Issues/'+selected.id, {
              type: editForm.type,
              priority: editForm.priority,
              station: editForm.station,
              reporter: editForm.reporter,
              message: editForm.message
            });
            setEditing(false);
            pushToast('บันทึกการแก้ไขแล้ว','ok');
          }catch(e){ pushToast('บันทึกการแก้ไขไม่ได้: '+(e?.message||e)); }
          finally{ setSavingEdit(false); }
        }

        async function updateStatus(newStatus){
          if(!selected) return;
          try{
            await fbUpdate('/Issues/'+selected.id, { status:newStatus, updatedAt:new Date().toISOString() });
            pushToast('อัปเดตสถานะสำเร็จ','ok');
          }catch(e){ pushToast('อัปเดตสถานะไม่ได้: '+(e?.message||e)); }
        }

        async function deleteTicket(id){
          if(!id) return;
          if(!confirm('ต้องการลบเคสนี้หรือไม่?')) return;
          try{
            await fbRemove('/Issues/'+id);
            await fbRemove('/IssueChats/'+id);
            setSelected(null);
            pushToast('ลบเคสแล้ว','ok');
          }catch(e){ pushToast('ลบไม่ได้: '+(e?.message||e)); }
        }

        async function addChatMessage(txt){
          if(!selected) return;
          const content = (txt||'').trim(); if(!content) return;
          try{
            const keyRef = fbPushRef(`/IssueChats/${selected.id}`);
            await fbSet(`/IssueChats/${selected.id}/${keyRef.key}`, { role:'user', name: editForm.reporter||selected.reporter||'User', content, ts:new Date().toISOString() });
          }catch(e){ pushToast('ส่งข้อความไม่ได้: '+(e?.message||e)); }
        }

        const stationOptions = useMemo(()=>Object.values(STATIONS).flat(), []);
        const filtered = useMemo(()=>{
          return issues.filter(it=>{
            if(filters.status!=='ทั้งหมด' && (it.status||'')!==filters.status) return false;
            if(filters.type!=='ทั้งหมด' && (it.type||'')!==filters.type) return false;
            if(filters.prio!=='ทั้งหมด' && (it.priority||'')!==filters.prio) return false;
            if(filters.q && !(`${it.station||''} ${it.message||''} ${it.reporter||''}`.toLowerCase().includes(filters.q.toLowerCase()))) return false;
            return true;
          });
        }, [issues, filters]);

        return (
          <div className="grid grid-cols-12 gap-6">
            {/* Create Ticket */}
            <div className="col-span-12 lg:col-span-4">
              <div className="card p-4 fadein">
                <div className="text-lg font-semibold mb-2">ปัญหา</div>
                <form onSubmit={createTicket} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">ประเภท</div>
                      <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                        {['Hardware','Software','Network','Safety','อื่นๆ'].map(x=> <option key={x} value={x}>{x}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">ความเร่งด่วน</div>
                      <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                        {['Low','Medium','High','Critical'].map(x=> <option key={x} value={x}>{x}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">สถานี (ถ้ามี)</div>
                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={form.station} onChange={e=>setForm({...form,station:e.target.value})}>
                      <option value="">(ไม่ระบุ)</option>
                      {stationOptions.map(s=> <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">ผู้แจ้ง</div>
                    <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="เช่น รหัส หรือ ชื่อ" value={form.reporter} onChange={e=>setForm({...form,reporter:e.target.value})} />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">รายละเอียดปัญหา *</div>
                    <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2" rows="4" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="submit" className="btnP" disabled={savingTicket}>{savingTicket?'กำลังบันทึก...':'บันทึก'}</button>
                  </div>
                </form>
              </div>
            </div>

            {/* List + Detail */}
            <div className="col-span-12 lg:col-span-8">
              <div className="card p-4 fadein">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="text-lg font-semibold mr-auto">ประวัติเคส</div>
                  <input className="rounded border px-3 py-2 text-sm" placeholder="ค้นหา..." value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})} />
                  <select className="rounded border px-2 py-2 text-sm" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}>
                    {['ทั้งหมด','Open','Assigned','In Progress','Resolved','Cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="rounded border px-2 py-2 text-sm" value={filters.type} onChange={e=>setFilters({...filters,type:e.target.value})}>
                    {['ทั้งหมด','Hardware','Software','Network','Safety','อื่นๆ'].map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="rounded border px-2 py-2 text-sm" value={filters.prio} onChange={e=>setFilters({...filters,prio:e.target.value})}>
                    {['ทั้งหมด','Low','Medium','High','Critical'].map(s=> <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 xl:col-span-7 max-h-[55vh] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500">
                        <tr>
                          <th className="py-2 pr-3">เวลา</th>
                          <th className="py-2 pr-3">สถานี</th>
                          <th className="py-2 pr-3">ประเภท</th>
                          <th className="py-2 pr-3">ด่วน</th>
                          <th className="py-2 pr-3">สถานะ</th>
                          <th className="py-2">รายละเอียด</th>
                        </tr>
                      </thead>
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
                        {filtered.length===0 && <tr><td colSpan="6" className="py-4 text-center text-slate-500">ไม่พบเคส</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <div className="col-span-12 xl:col-span-5">
                    <div className="border rounded-xl p-3 h-full flex flex-col min-h-[260px]">
                      <div className="font-semibold mb-2">รายละเอียดเคส</div>
                      {selected ? (
                        <>
                          {!editing ? (
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
                                  <button className="btn" onClick={()=>updateStatus('Assigned')}>รับเรื่อง</button>
                                  <button className="btn" onClick={()=>updateStatus('In Progress')}>กำลังซ่อม</button>
                                  <button className="btn" onClick={()=>updateStatus('Resolved')}>แก้ไขแล้ว</button>
                                  <button className="btn" onClick={()=>updateStatus('Cancelled')}>ยกเลิก</button>
                                  <button className="btn" onClick={()=>setEditing(true)}>แก้ไขรายละเอียด</button>
                                  <button className="btn" onClick={()=>deleteTicket(selected.id)}>ลบเคส</button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">ประเภท</div>
                                  <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={editForm.type} onChange={e=>setEditForm({...editForm,type:e.target.value})}>
                                    {['Hardware','Software','Network','Safety','อื่นๆ'].map(x=> <option key={x} value={x}>{x}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">ความเร่งด่วน</div>
                                  <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={editForm.priority} onChange={e=>setEditForm({...editForm,priority:e.target.value})}>
                                    {['Low','Medium','High','Critical'].map(x=> <option key={x} value={x}>{x}</option>)}
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-slate-500 mb-1">สถานี</div>
                                  <select className="w-full rounded-lg border border-slate-300 px-3 py-2" value={editForm.station} onChange={e=>setEditForm({...editForm,station:e.target.value})}>
                                    <option value="">(ไม่ระบุ)</option>
                                    {Object.values(STATIONS).flat().map(s=> <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-slate-500 mb-1">ผู้แจ้ง</div>
                                  <input className="w-full rounded-lg border border-slate-300 px-3 py-2" value={editForm.reporter} onChange={e=>setEditForm({...editForm,reporter:e.target.value})}/>
                                </div>
                                <div className="col-span-2">
                                  <div className="text-xs text-slate-500 mb-1">รายละเอียด</div>
                                  <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2" rows="4" value={editForm.message} onChange={e=>setEditForm({...editForm,message:e.target.value})}/>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                <button className="btn" onClick={()=>{ setEditing(false); setEditForm({type:selected.type, priority:selected.priority, station:selected.station||'', reporter:selected.reporter||'', message:selected.message||''}); }}>ยกเลิก</button>
                                <button className="btnP" onClick={updateTicketFields} disabled={savingEdit}>{savingEdit?'กำลังบันทึก...':'บันทึกการแก้ไข'}</button>
                              </div>
                            </>
                          )}

                          <div className="mt-3 border-t pt-3 flex-1 flex flex-col">
                            <div className="font-medium mb-2">พูดคุยในเคส</div>
                            <div className="flex items-center gap-2">
                              <input className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="พิมพ์ข้อความ..." value={chatText} onChange={e=>setChatText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ addChatMessage(chatText); setChatText(''); }}} />
                              <button className="btnP" type="button" onClick={()=>{ addChatMessage(chatText); setChatText(''); }}>ส่ง</button>
                            </div>
                            <div className="flex-1 overflow-auto space-y-2 mt-2">
                              {chat.map((m,i)=>(
                                <div key={i} className={m.role==='user'?'text-right':'text-left'}>
                                  <div className={`inline-block px-3 py-2 rounded-lg ${m.role==='user'?'bg-sky-100':'bg-slate-100'}`}>
                                    <div className="text-xs text-slate-500">{m.name||m.role}</div>
                                    <div>{m.content}</div>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-1">{new Date(m.ts).toLocaleString()}</div>
                                </div>
                              ))}
                              {!chat.length && <div className="text-sm text-slate-500">ยังไม่มีการสนทนา</div>}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-500">เลือกเคสจากตารางเพื่อดู/แก้ไขรายละเอียด</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
    </script>
  </body>
</html>
