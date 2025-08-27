<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>SheetOps — Login + Floor Plan + ปัญหา (Firebase DB)</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.19.3/xlsx.full.min.js"></script>
    <meta name="theme-color" content="#0ea5e9" />
    <style>
      html,body,#root{height:100%}
      body{background:#f8fafc;color:#0f172a}
      .card{border:1px solid rgba(148,163,184,.25);border-radius:1rem;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:box-shadow .3s,transform .2s}
      .card:hover{box-shadow:0 4px 24px rgba(59,130,246,.12),0 2px 4px rgba(0,0,0,.04);transform:scale(1.01)}
      .btn{padding:.55rem 1rem;border-radius:.7rem;border:1px solid rgba(148,163,184,.35);background:#fff;transition:all .18s;min-width:110px}
      .btn:hover{background:#f0f9ff;transform:translateY(-1px)}
      .btnP{background:linear-gradient(90deg,#0ea5e9 60%,#818cf8 100%);border-color:#0ea5e9;color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.07)}
      .pill{display:inline-flex;align-items:center;gap:.35rem;padding:.15rem .5rem;border-radius:999px;font-size:11px;border:1px solid rgba(148,163,184,.35);background:#fff;white-space:nowrap}
      .tile{border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:.75rem;padding:14px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;justify-content:center;min-height:80px}
      .tile.missing{background:linear-gradient(180deg,rgba(241,245,249,.7),rgba(255,255,255,1))}
      .avatar{width:24px;height:24px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:#fff}
      .fadein{animation:fadein .35s} @keyframes fadein{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
      #toasts>div{transition:opacity .4s,transform .6s}
      /* Display page auto-fit for any screen (mobile → TV 52") */
      .auto-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
      .display-title{font-size:clamp(16px,2vw,28px);font-weight:800}
      .display-station{font-size:clamp(14px,1.6vw,22px);font-weight:800}
      .display-pill{font-size:clamp(11px,1.2vw,16px)}
    </style>
  </head>
  <body class="bg-gradient-to-br from-sky-100 via-teal-50 to-indigo-100 min-h-screen">
    <div id="root"></div>
    <div id="toasts" class="fixed top-3 right-3 space-y-2 z-[9999]"></div>

    <!-- Firebase (Realtime Database only — no Auth to avoid config errors) -->
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

      /* ---------- Utils ---------- */
      function pushToast(msg, ok=true){
        const wrap = document.getElementById('toasts'); if(!wrap) return;
        const el = document.createElement('div');
        el.className = `fadein px-3 py-2 rounded-xl text-sm shadow border ${ok?'bg-emerald-50 border-emerald-200 text-emerald-800':'bg-rose-50 border-rose-200 text-rose-800'}`;
        el.textContent = msg; wrap.appendChild(el);
        setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(-6px)'},2600);
        setTimeout(()=>{try{wrap.removeChild(el)}catch{}},3000);
      }
      const hasFb = () => !!window.fb?.db && window.fb?.dbApi;
      const dbRefOf = (p)=> window.fb.dbApi.dbRef(window.fb.db, p);
      const fbGet = async(p)=>{ const s=await window.fb.dbApi.get(dbRefOf(p)); return s.exists()?s.val():null; };
      const fbSet = async(p,v)=> window.fb.dbApi.set(dbRefOf(p), v);
      const fbUpdate = async(p,v)=> window.fb.dbApi.update(dbRefOf(p), v);
      const fbRemove = async(p)=> window.fb.dbApi.remove(dbRefOf(p));
      const fbPush  = (p)=> window.fb.dbApi.push(dbRefOf(p));

      const colorFor = key => { const colors=['#0ea5e9','#06b6d4','#14b8a6','#22c55e','#a3e635','#eab308','#f59e0b','#ef4444','#6366f1','#8b5cf6','#ec4899','#f43f5e']; let h=0; const s=String(key||''); for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h); return colors[Math.abs(h)%colors.length]; };
      // simple SHA-256 hex
      async function sha256Hex(text){
        const enc = new TextEncoder().encode(text);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
      }
      function exportUsersXlsx(users){
        if(!users?.length) return pushToast('ไม่มีรายชื่อให้ Export', false);
        const rows = users.map(u=>({ID:u.id||'',Name:u.name||'',TYPE:u.type||''}));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Users');
        XLSX.writeFile(wb, 'users.xlsx'); pushToast('Export รายชื่อสำเร็จ');
      }

      /* ---------- Constants ---------- */
      const STATIONS = {
        'Floor 1': ['1101','1102','1103','1104','1105','1106','1107','1201','1203','1205'],
        'Floor 2': ['2101','2102','2103','2104','2105','2201','2203','2205'],
        'Floor 3': ['3101','3105','3201','3205']
      };
      const DEFAULT_TYPES = ['Support','Case replen','Sorter','Picker','put to slot','Build','Tote'];

      /* ---------- RBAC via Realtime DB (no Firebase Auth) ---------- */
      async function bootstrapAdminIfNeeded(){
        const ok = await fbGet('/RBAC/bootstrap_done');
        if(ok) return;
        const passHash = await sha256Hex('1213');
        await fbSet('/RBAC/users/Eur', { username:'Eur', passHash, role:'admin', createdAt:new Date().toISOString() });
        await fbSet('/RBAC/bootstrap_done', true);
      }

      /* ---------- App ---------- */
      function App(){
        const [auth,setAuth] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('SHEETOPS_AUTH')||'null'); }catch{return null} });
        const [page,setPage] = useState('display'); // guest default page
        const role = auth?.role || 'guest'; // admin | manager | guest

        // data
        const [users,setUsers] = useState([]);
        const [plan,setPlan]   = useState({}); // station -> {station,assignedList}
        const [issues,setIssues] = useState([]);

        // bootstrap admin user (Eur / 1213)
        useEffect(()=>{ if(hasFb()) bootstrapAdminIfNeeded(); },[]);

        // live data
        useEffect(()=>{
          if(!hasFb()) return;
          const offU = window.fb.dbApi.onValue(dbRefOf('/User'), s=>{ const v=s.val()||{}; setUsers(Object.values(v)); });
          const offP = window.fb.dbApi.onValue(dbRefOf('/Plan'), s=>{ setPlan(s.val()||{}); });
          const offI = window.fb.dbApi.onValue(dbRefOf('/Issues'), s=>{ const v=s.val()||{}; const arr=Object.values(v); arr.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||''))); setIssues(arr); });
          return ()=>{ try{offU();offP();offI();}catch{} };
        },[]);

        const userMap = useMemo(()=>Object.fromEntries(users.map(u=>[String(u.id),u])),[users]);
        const planBySt = useMemo(()=>{ const m=new Map(); Object.values(plan||{}).forEach(t=>m.set(String(t.station),t)); return m; },[plan]);

        const canPlan = role==='admin' || role==='manager';
        const canIssues = true; // ผู้ใช้ทั่วไป (guest) ก็ใช้หน้า "ปัญหา" ได้

        return (
          <div className="min-h-screen">
            {/* Topbar */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center gap-2">
                <div className="text-xl sm:text-2xl font-bold">KKRDC PITL</div>
                <div className="flex items-center gap-2 ml-0 sm:ml-4">
                  <button className={`btn ${page==='display'?'btnP text-white':''}`} onClick={()=>setPage('display')}>แสดงผล</button>
                  <button className="btn" disabled={!canPlan} onClick={()=>setPage('plan')}>แผนผัง</button>
                  <button className={`btn ${page==='issues'?'btnP text-white':''}`} disabled={!canIssues} onClick={()=>setPage('issues')}>ปัญหา</button>
                  {role==='admin' && <button className={`btn ${page==='admin'?'btnP text-white':''}`} onClick={()=>setPage('admin')}>Admin</button>}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {auth ? (
                    <>
                      <span className="pill">เข้าสู่ระบบ: {auth.username} • {auth.role}</span>
                      <button className="btn" onClick={()=>{ setAuth(null); localStorage.removeItem('SHEETOPS_AUTH'); pushToast('ออกจากระบบแล้ว'); setPage('display'); }}>ออกจากระบบ</button>
                    </>
                  ) : (
                    <>
                      <span className="pill">โหมดผู้ชม</span>
                      <LoginButton onLogged={(info)=>{ setAuth(info); localStorage.setItem('SHEETOPS_AUTH', JSON.stringify(info)); pushToast('เข้าสู่ระบบสำเร็จ'); setPage('plan'); }} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-[1800px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
              {page==='display' && <DisplayPage planBySt={planBySt} userMap={userMap} />}
              {page==='plan'    && (canPlan ? <PlanPage users={users} userMap={userMap} planBySt={planBySt} /> : <GuardCard text="ต้องเข้าสู่ระบบ (manager หรือ admin) เพื่อจัดแผนผัง" />)}
              {page==='issues'  && (canIssues ? <IssuesPage /> : <GuardCard text="หน้านี้เปิดให้ผู้ใช้ทั่วไปได้" />)}
              {page==='admin'   && (role==='admin' ? <AdminPage /> : <GuardCard text="ต้องเป็น admin เท่านั้น" />)}
            </div>
          </div>
        );
      }

      /* ---------- Login (DB-based, ผู้ใช้ต้องพิมพ์เอง) ---------- */
      function LoginButton({onLogged}){
        const [open,setOpen]=useState(false);
        return (
          <>
            <button className="btnP" onClick={()=>setOpen(true)}>เข้าสู่ระบบ</button>
            {open && <LoginModal onClose={()=>setOpen(false)} onLogged={(info)=>{ setOpen(false); onLogged?.(info); }} />}
          </>
        );
      }
      function LoginModal({onClose,onLogged}){
        const [username,setUsername]=useState('');
        const [password,setPassword]=useState('');
        const [loading,setLoading]=useState(false);
        async function submit(e){
          e.preventDefault();
          setLoading(true);
          try{
            const rec = await fbGet('/RBAC/users/'+encodeURIComponent(username));
            if(!rec) return pushToast('ชื่อผู้ใช้ไม่ถูกต้อง', false);
            const h = await sha256Hex(password);
            if(h!==rec.passHash) return pushToast('รหัสผ่านไม่ถูกต้อง', false);
            onLogged({username:rec.username, role:rec.role||'manager'});
          }catch(err){ pushToast('เข้าสู่ระบบไม่สำเร็จ', false); }
          finally{ setLoading(false); }
        }
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50">
            <div className="card w-[420px] max-w-[95vw] p-5 fadein">
              <div className="text-lg font-semibold mb-2">เข้าสู่ระบบ</div>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">ชื่อผู้ใช้</div>
                  <input className="w-full rounded border px-3 py-2" value={username} onChange={e=>setUsername(e.target.value)} required />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">รหัสผ่าน</div>
                  <input className="w-full rounded border px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn" onClick={onClose}>ยกเลิก</button>
                  <button className="btnP" disabled={loading} type="submit">{loading?'...':'เข้าสู่ระบบ'}</button>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  * ผู้ดูแลระบบเริ่มต้น: <b>Eur</b> / <b>1213</b> (สร้างให้อัตโนมัติใน Firebase Realtime Database)
                </div>
              </form>
            </div>
          </div>
        );
      }

      /* ---------- Admin (จัดการผู้ใช้ RBAC) ---------- */
      function AdminPage(){
        const [users,setUsers]=useState({});
        const [u,setU]=useState({username:'',password:'',role:'manager'});
        useEffect(()=>{ const off = window.fb.dbApi.onValue(dbRefOf('/RBAC/users'), s=> setUsers(s.val()||{})); return ()=>{try{off();}catch{}}; },[]);
        async function createUser(){
          if(!u.username || !u.password) return pushToast('กรอกชื่อผู้ใช้และรหัสผ่าน', false);
          const passHash = await sha256Hex(u.password);
          await fbSet('/RBAC/users/'+encodeURIComponent(u.username), { username:u.username, passHash, role:u.role, createdAt:new Date().toISOString() });
          setU({username:'',password:'',role:'manager'}); pushToast('สร้างผู้ใช้แล้ว');
        }
        async function setRole(username, role){ await fbUpdate('/RBAC/users/'+encodeURIComponent(username), {role}); pushToast('อัปเดตสิทธิ์เรียบร้อย'); }
        async function resetPass(username){
          const np = prompt('รหัสผ่านใหม่ของ '+username+':'); if(!np) return;
          const passHash = await sha256Hex(np);
          await fbUpdate('/RBAC/users/'+encodeURIComponent(username), {passHash}); pushToast('รีเซ็ตรหัสผ่านแล้ว');
        }
        async function delUser(username){
          if(username==='Eur') return pushToast('ห้ามลบผู้ใช้ Eur', false);
          if(!confirm('ลบผู้ใช้ '+username+' ?')) return;
          await fbRemove('/RBAC/users/'+encodeURIComponent(username)); pushToast('ลบผู้ใช้แล้ว');
        }
        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-5">
              <div className="card p-4">
                <div className="text-lg font-semibold mb-2">สร้างผู้ใช้</div>
                <div className="space-y-3">
                  <div><div className="text-xs text-slate-500 mb-1">ชื่อผู้ใช้</div><input className="w-full rounded border px-3 py-2" value={u.username} onChange={e=>setU({...u,username:e.target.value})}/></div>
                  <div><div className="text-xs text-slate-500 mb-1">รหัสผ่าน</div><input className="w-full rounded border px-3 py-2" value={u.password} onChange={e=>setU({...u,password:e.target.value})}/></div>
                  <div><div className="text-xs text-slate-500 mb-1">สิทธิ์</div>
                    <select className="w-full rounded border px-3 py-2" value={u.role} onChange={e=>setU({...u,role:e.target.value})}>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div className="flex justify-end"><button className="btnP" onClick={createUser}>สร้าง</button></div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7">
              <div className="card p-4">
                <div className="text-lg font-semibold mb-2">ผู้ใช้ทั้งหมด</div>
                <div className="max-h-[60vh] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500"><tr><th className="py-2 pr-3">ชื่อผู้ใช้</th><th className="py-2 pr-3">สิทธิ์</th><th className="py-2">จัดการ</th></tr></thead>
                    <tbody>
                      {Object.values(users).map(x=>(
                        <tr key={x.username} className="border-t">
                          <td className="py-2 pr-3">{x.username}</td>
                          <td className="py-2 pr-3">
                            <select className="border rounded px-2 py-1" value={x.role} onChange={e=>setRole(x.username,e.target.value)}>
                              <option value="manager">manager</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="py-2 flex items-center gap-2">
                            <button className="btn" onClick={()=>resetPass(x.username)}>เปลี่ยนรหัส</button>
                            <button className="btn text-rose-600" onClick={()=>delUser(x.username)}>ลบ</button>
                          </td>
                        </tr>
                      ))}
                      {Object.keys(users).length===0 && <tr><td className="py-3 text-slate-500" colSpan="3">ยังไม่มีผู้ใช้</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      }

      /* ---------- Display (รองรับทุกขนาดจอ) ---------- */
      function DisplayPage({planBySt,userMap}){
        return (
          <div className="card p-4">
            <div className="display-title mb-2">แสดงผล (ดูอย่างเดียว)</div>
            {Object.keys(STATIONS).map(group=>{
              const stations = STATIONS[group];
              return (
                <div key={group} className="mb-5">
                  <div className="font-bold text-sky-700 text-lg">{group}</div>
                  <div className="auto-grid mt-2">
                    {stations.map(st=>{
                      const rec = planBySt.get(st)||{station:st,assignedList:[]};
                      const emps = (rec.assignedList||[]).map(id=>userMap[id]).filter(Boolean);
                      return (
                        <div key={st} className="tile">
                          <div className="display-station">{st}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {emps.length? emps.map(e=> <span key={e.id} className="pill display-pill">{e.name}{e.type?` (${e.type})`:''}</span>) : <span className="text-slate-500 text-sm">-</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      /* ---------- Plan (มีปุ่มล้าง และบันทึก Firebase) ---------- */
      function PlanPage({users,userMap,planBySt}){
        const [search,setSearch]=useState('');
        const [typeFilter,setTypeFilter]=useState('All');
        const [assign,setAssign]=useState({open:false,station:'',sel:new Set(),q:''});
        const [adding,setAdding]=useState(false);
        const [newUser,setNewUser]=useState({id:'',name:'',type:''});

        const filtered = useMemo(()=>{
          const q=search.toLowerCase();
          return users.filter(u=> (typeFilter==='All' || u.type===typeFilter) && (u.name+u.id).toLowerCase().includes(q));
        },[users,search,typeFilter]);

        async function writePlan(station, list){
          await fbSet('/Plan/'+String(station), {id:String(station), station:String(station), assignedList:Array.from(new Set(list||[])), updatedAt:new Date().toISOString()});
        }
        function onDragStartEmp(e,emp){ e.dataTransfer.setData('text/plain', JSON.stringify(emp)); e.dataTransfer.effectAllowed='move'; }
        async function clearFloor(floor){ for (const st of STATIONS[floor]||[]) await writePlan(st, []); pushToast('ล้างคนออกจาก '+floor); }
        async function clearAll(){ await clearFloor('Floor 1'); await clearFloor('Floor 2'); await clearFloor('Floor 3'); }

        async function addUser(){
          if(!newUser.id.trim() || !newUser.name.trim()) return pushToast('กรอก ID และชื่อให้ครบ', false);
          await fbSet('/User/'+String(newUser.id).trim(), { id:newUser.id.trim(), name:newUser.name.trim(), type:String(newUser.type||'').trim() });
          setNewUser({id:'',name:'',type:''}); setAdding(false); pushToast('เพิ่มพนักงานเรียบร้อย');
        }
        async function deleteUser(id){
          if(!confirm('ลบพนักงานนี้?')) return;
          await fbRemove('/User/'+String(id));
          // remove from stations
          for(const g of Object.keys(STATIONS)){ for(const st of STATIONS[g]){ const r=planBySt.get(st); if(!r) continue; if((r.assignedList||[]).includes(id)){ await writePlan(st, (r.assignedList||[]).filter(x=>x!==id)); } } }
          pushToast('ลบพนักงานแล้ว');
        }

        // Build reverse index for "employee currently at" indicator
        const atStation = useMemo(()=>{
          const m = new Map();
          for(const st of Object.values(STATIONS).flat()){
            const r = planBySt.get(st); if(!r) continue;
            for(const id of (r.assignedList||[])) m.set(id, st);
          }
          return m;
        },[planBySt]);

        return (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button className="btnP" onClick={()=>setAdding(true)}>+ เพิ่มพนักงาน</button>
              <button className="btn" onClick={()=>exportUsersXlsx(users)}>Export รายชื่อ</button>
              <button className="btn" onClick={clearAll}>🧹 ล้างทั้งหมด</button>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <aside className="col-span-12 md:col-span-4 lg:col-span-3">
                <div className="card p-3">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                    <span className="w-5 h-5 rounded bg-sky-500 text-white grid place-items-center text-[10px]">E</span>Employee
                  </div>
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
                          <div className="text-sm font-medium truncate">
                            {u.name}{u.type?` (${u.type})`:''}
                            {atStation.get(u.id) && <span className="ml-2 pill">อยู่ที่ {atStation.get(u.id)}</span>}
                          </div>
                          <div className="text-[11px] text-slate-500">{u.id}</div>
                        </div>
                        <button className="text-rose-600 text-xs border px-2 py-1 rounded" onClick={()=>deleteUser(u.id)}>ลบ</button>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <section className="col-span-12 md:col-span-8 lg:col-span-9">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(STATIONS).map(group=>{
                    const stations=STATIONS[group];
                    return (
                      <div key={group}>
                        <div className="mb-2 px-3 py-2 rounded border bg-white/70 flex items-center justify-between">
                          <div className="text-lg font-bold text-sky-700">{group}</div>
                          <button className="btn" onClick={()=>clearFloor(group)}>🧹 ล้าง</button>
                        </div>
                        <div className="grid gap-3">
                          {stations.map(st=>{
                            const rec = planBySt.get(st)||{station:st,assignedList:[]};
                            const emps = (rec.assignedList||[]).map(id=>userMap[id]).filter(Boolean);
                            return (
                              <div key={st}
                                className={`tile ${emps.length? '' : 'missing'}`}
                                onDragOver={(e)=>e.preventDefault()}
                                onDrop={async(e)=>{
                                  e.preventDefault();
                                  let emp=null; try{ emp = JSON.parse(e.dataTransfer.getData('text/plain')||''); }catch{}
                                  if(!emp?.id) return;
                                  // remove from other stations
                                  for(const s of Object.values(STATIONS).flat()){
                                    const r = planBySt.get(s); if(!r) continue;
                                    if((r.assignedList||[]).includes(emp.id) && s!==st){
                                      await fbSet('/Plan/'+s, {id:s,station:s,assignedList:(r.assignedList||[]).filter(x=>x!==emp.id),updatedAt:new Date().toISOString()});
                                    }
                                  }
                                  await fbSet('/Plan/'+st, {id:st,station:st,assignedList:Array.from(new Set([...(rec.assignedList||[]), emp.id])),updatedAt:new Date().toISOString()});
                                  pushToast(`มอบหมาย ${emp.name} → ${st}`);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-extrabold">{st}</div>
                                  <button className="text-xs underline text-sky-600" onClick={()=> setAssign({open:true,station:st, sel:new Set(rec.assignedList||[]), q:''}) }>แก้ไขพนักงาน</button>
                                </div>
                                {emps.length?(
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {emps.map(e=><span key={e.id} className="pill">{e.name}{e.type?` (${e.type})`:''}</span>)}
                                  </div>
                                ): <button className="pill mt-1" onClick={()=> setAssign({open:true,station:st, sel:new Set(), q:''}) }>คลิกเพื่อเลือกพนักงาน</button>}
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

            {adding && <AddUserModal onClose={()=>setAdding(false)} newUser={newUser} setNewUser={setNewUser} onSave={addUser} />}
            {assign.open && <AssignModal state={assign} setState={setAssign} users={users} onSave={async(ids)=>{ await fbSet('/Plan/'+assign.station,{id:assign.station,station:assign.station,assignedList:Array.from(new Set(ids)),updatedAt:new Date().toISOString()}); setAssign({open:false,station:'',sel:new Set(),q:''}); pushToast('อัปเดตพนักงานสำเร็จ'); }} />}
          </>
        );
      }
      function AddUserModal({onClose,newUser,setNewUser,onSave}){
        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center z-50">
            <div className="card w-[520px] max-w-[95vw] p-5 fadein">
              <div className="text-lg font-semibold">เพิ่มพนักงาน</div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><div className="text-xs text-slate-500 mb-1">ID *</div><input className="w-full rounded border px-3 py-2" value={newUser.id} onChange={e=>setNewUser({...newUser,id:e.target.value})}/></div>
                <div><div className="text-xs text-slate-500 mb-1">ชื่อ-นามสกุล *</div><input className="w-full rounded border px-3 py-2" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})}/></div>
                <div className="col-span-2"><div className="text-xs text-slate-500 mb-1">TYPE</div>
                  <select className="w-full rounded border px-3 py-2" value={newUser.type} onChange={e=>setNewUser({...newUser,type:e.target.value})}>
                    <option value="">(ไม่ระบุ)</option>
                    {DEFAULT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="btn" onClick={onClose}>ยกเลิก</button>
                <button className="btnP" onClick={onSave}>บันทึก</button>
              </div>
            </div>
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

      /* ---------- Issues (ผู้ใช้ทั่วไปเข้าถึงได้) ---------- */
      function IssuesPage(){
        const [form,setForm]=useState({type:'Hardware',priority:'Medium',station:'',reporter:'',message:''});
        const [list,setList]=useState([]);
        const [selected,setSelected]=useState(null);
        const [chat,setChat]=useState([]);
        const [chatText,setChatText]=useState('');
        const [filters,setFilters]=useState({q:'',status:'ทั้งหมด',type:'ทั้งหมด',prio:'ทั้งหมด'});

        useEffect(()=>{ const off=window.fb.dbApi.onValue(dbRefOf('/Issues'), s=>{ const v=s.val()||{}; const arr=Object.values(v).sort((a,b)=>String(b.time||'').localeCompare(String(a.time||''))); setList(arr); }); return ()=>{try{off();}catch{}}; },[]);
        useEffect(()=>{ if(!selected){ setChat([]); return; } const off=window.fb.dbApi.onValue(dbRefOf('/IssueChats/'+selected.id), s=>{ const v=s.val()||{}; const arr=Object.values(v).sort((a,b)=>(a.ts||'').localeCompare(b.ts||'')); setChat(arr); }); return ()=>{try{off();}catch{}}; },[selected?.id]);

        async function createTicket(e){
          e.preventDefault();
          if(!form.message.trim()) return pushToast('กรุณากรอกรายละเอียด', false);
          const ref = fbPush('/Issues'); const id = ref.key;
          const obj = { id, time:new Date().toISOString(), type:form.type, priority:form.priority, station:form.station||'', reporter:form.reporter||'', message:form.message||'', status:'Open' };
          await fbSet('/Issues/'+id, obj);
          setForm({type:'Hardware',priority:'Medium',station:'',reporter:'',message:''});
          pushToast('บันทึกเคสแล้ว');
        }
        async function updateTicket(patch){ if(!selected) return; await fbUpdate('/Issues/'+selected.id, patch); setSelected(s=>({...s,...patch})); }
        async function deleteTicket(){ if(!selected) return; if(!confirm('ลบเคสนี้?')) return; await fbRemove('/Issues/'+selected.id); setSelected(null); pushToast('ลบเคสแล้ว'); }
        async function sendChat(){ if(!selected || !chatText.trim()) return; const ref=fbPush('/IssueChats/'+selected.id); await fbSet('/IssueChats/'+selected.id+'/'+ref.key,{role:'user',content:chatText.trim(),ts:new Date().toISOString()}); setChatText(''); }

        const stationOptions = useMemo(()=> Object.values(STATIONS).flat(), []);
        const filtered = useMemo(()=> list.filter(it=>{
          if(filters.status!=='ทั้งหมด' && (it.status||'')!==filters.status) return false;
          if(filters.type!=='ทั้งหมด' && (it.type||'')!==filters.type) return false;
          if(filters.prio!=='ทั้งหมด' && (it.priority||'')!==filters.prio) return false;
          if(filters.q && !(`${it.station||''} ${it.message||''} ${it.reporter||''}`.toLowerCase().includes(filters.q.toLowerCase()))) return false;
          return true;
        }), [list,filters]);

        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="card p-4">
                <div className="text-lg font-semibold mb-2">ปัญหา</div>
                <form onSubmit={createTicket} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-slate-500 mb-1">ประเภท</div><select className="w-full rounded border px-3 py-2" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['Hardware','Software','Network','Safety','อื่นๆ'].map(x=><option key={x}>{x}</option>)}</select></div>
                    <div><div className="text-xs text-slate-500 mb-1">ด่วน</div><select className="w-full rounded border px-3 py-2" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{['Low','Medium','High','Critical'].map(x=><option key={x}>{x}</option>)}</select></div>
                  </div>
                  <div><div className="text-xs text-slate-500 mb-1">สถานี</div><select className="w-full rounded border px-3 py-2" value={form.station} onChange={e=>setForm({...form,station:e.target.value})}><option value="">(ไม่ระบุ)</option>{stationOptions.map(s=><option key={s}>{s}</option>)}</select></div>
                  <div><div className="text-xs text-slate-500 mb-1">ผู้แจ้ง</div><input className="w-full rounded border px-3 py-2" value={form.reporter} onChange={e=>setForm({...form,reporter:e.target.value})} placeholder="เช่น ชื่อ/รหัส"/></div>
                  <div><div className="text-xs text-slate-500 mb-1">รายละเอียด *</div><textarea className="w-full rounded border px-3 py-2" rows="4" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required/></div>
                  <div className="flex justify-end"><button className="btnP" type="submit">บันทึก</button></div>
                </form>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <div className="card p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="text-lg font-semibold mr-auto">ประวัติเคส</div>
                  <input className="rounded border px-3 py-2 text-sm" placeholder="ค้นหา..." value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
                  <select className="rounded border px-2 py-2 text-sm" value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}>{['ทั้งหมด','Open','Assigned','In Progress','Resolved','Cancelled'].map(s=><option key={s}>{s}</option>)}</select>
                  <select className="rounded border px-2 py-2 text-sm" value={filters.type} onChange={e=>setFilters({...filters,type:e.target.value})}>{['ทั้งหมด','Hardware','Software','Network','Safety','อื่นๆ'].map(s=><option key={s}>{s}</option>)}</select>
                  <select className="rounded border px-2 py-2 text-sm" value={filters.prio} onChange={e=>setFilters({...filters,prio:e.target.value})}>{['ทั้งหมด','Low','Medium','High','Critical'].map(s=><option key={s}>{s}</option>)}</select>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 xl:col-span-7 max-h-[55vh] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500"><tr><th className="py-2 pr-3">เวลา</th><th className="py-2 pr-3">สถานี</th><th className="py-2 pr-3">ประเภท</th><th className="py-2 pr-3">ด่วน</th><th className="py-2 pr-3">สถานะ</th><th className="py-2">รายละเอียด</th></tr></thead>
                      <tbody>
                        {filtered.map(it=>(
                          <tr key={it.id} className={`border-t cursor-pointer ${selected?.id===it.id?'bg-sky-50':''}`} onClick={()=>setSelected(it)}>
                            <td className="py-2 pr-3 whitespace-nowrap">{new Date(it.time).toLocaleString()}</td>
                            <td className="py-2 pr-3">{it.station||'-'}</td>
                            <td className="py-2 pr-3">{it.type}</td>
                            <td className="py-2 pr-3">{it.priority}</td>
                            <td className="py-2 pr-3"><span className="pill">{it.status}</span></td>
                            <td className="py-2">{(it.message||'').slice(0,70)}</td>
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
                              <select className="w-full border rounded px-2 py-1" value={selected.status} onChange={e=>updateTicket({status:e.target.value})}>
                                {['Open','Assigned','In Progress','Resolved','Cancelled'].map(s=><option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2"><div className="text-slate-500 text-xs">สถานี</div><input className="w-full border rounded px-2 py-1" value={selected.station||''} onChange={e=>updateTicket({station:e.target.value})}/></div>
                            <div><div className="text-slate-500 text-xs">ประเภท</div><input className="w-full border rounded px-2 py-1" value={selected.type||''} onChange={e=>updateTicket({type:e.target.value})}/></div>
                            <div><div className="text-slate-500 text-xs">ด่วน</div><select className="w-full border rounded px-2 py-1" value={selected.priority||'Medium'} onChange={e=>updateTicket({priority:e.target.value})}>{['Low','Medium','High','Critical'].map(s=><option key={s}>{s}</option>)}</select></div>
                            <div className="col-span-2"><div className="text-slate-500 text-xs">ผู้แจ้ง</div><input className="w-full border rounded px-2 py-1" value={selected.reporter||''} onChange={e=>updateTicket({reporter:e.target.value})}/></div>
                            <div className="col-span-2"><div className="text-slate-500 text-xs">รายละเอียด</div><textarea className="w-full border rounded px-2 py-1" rows="4" value={selected.message||''} onChange={e=>updateTicket({message:e.target.value})}/></div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button className="btn text-rose-600" onClick={deleteTicket}>ลบเคส</button>
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
                      ) : <div className="text-sm text-slate-500">เลือกเคสจากตาราง</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      function GuardCard({text}){ return (<div className="card p-6 text-center"><div className="text-lg font-semibold mb-1">จำกัดสิทธิ์</div><div className="text-slate-600">{text}</div></div>); }

      /* ---------- Mount ---------- */
      ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
    </script>
  </body>
</html>
