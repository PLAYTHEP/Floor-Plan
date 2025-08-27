<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>SheetOps — Login + RBAC + Floor Plan</title>
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
      .card{border:1px solid rgba(148,163,184,.25);border-radius:1rem;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:box-shadow .3s,transform .2s}
      .card:hover{box-shadow:0 4px 24px rgba(59,130,246,.12),0 2px 4px rgba(0,0,0,.04);transform:scale(1.01)}
      .btn{padding:.55rem 1rem;border-radius:.7rem;border:1px solid rgba(148,163,184,.35);background:#fff;transition:all .18s;min-width:110px}
      .btn:hover{background:#f0f9ff;transform:translateY(-1px)}
      .btnP{background:linear-gradient(90deg,#0ea5e9 60%,#818cf8 100%);border-color:#0ea5e9;color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.07)}
      .pill{display:inline-flex;align-items:center;gap:.35rem;padding:.15rem .5rem;border-radius:999px;font-size:11px;border:1px solid rgba(148,163,184,.35);background:#fff;white-space:nowrap}
      .tile{border:1px solid rgba(148,163,184,.35);background:#fff;border-radius:.75rem;padding:14px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;justify-content:center;min-height:80px}
      .tile.missing{background:linear-gradient(180deg,rgba(241,245,249,.7),rgba(255,255,255,1))}
      .avatar{width:24px;height:24px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;color:#fff}
      .badge{font-size:11px;border:1px solid rgba(148,163,184,.45);padding:.15rem .5rem;border-radius:9999px}
      .fadein{animation:fadein .35s} @keyframes fadein{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
      @media (max-width:640px){ .tile{min-height:68px;padding:12px} .btn{min-width:auto;padding:.45rem .8rem}}
      #toasts>div{transition:opacity .4s,transform .6s}
    </style>
  </head>
  <body class="bg-gradient-to-br from-sky-100 via-teal-50 to-indigo-100 min-h-screen">
    <div id="root"></div>
    <div id="toasts" class="fixed top-3 right-3 space-y-2 z-[9999]"></div>

    <!-- Firebase init (Auth + DB + Storage). 100% client-side RBAC. -->
    <script type="module">
      import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
      import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
      import { getDatabase, ref as dbRef, get, set, update, remove, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
      import { getStorage, ref as stRef, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

      const firebaseConfig = {
        apiKey: "AIzaSyC6Qnfm0xiOsN_FZksKgGi_0i5wovGZ97E",
        authDomain: "inventory-21fd3.firebaseapp.com",
        databaseURL: "https://inventory-21fd3-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "inventory-21fd3",
        storageBucket: "inventory-21fd3.appspot.com",
        messagingSenderId: "27307205860",
        appId: "1:27307205860:web:8d5da549bc1a1a519238f1"
      };

      // Main app (current signed-in user)
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getDatabase(app);
      const storage = getStorage(app);

      // Secondary app for bootstrap/admin user creation (won't switch current session)
      const adminApp = initializeApp(firebaseConfig, "admin-secondary");
      const adminAuth = getAuth(adminApp);

      // expose to window for React code
      window.fb = {
        app, db, storage,
        dbApi: { dbRef, get, set, update, remove, push, onValue },
        stApi: { stRef, uploadString, getDownloadURL }
      };
      window.fbauth = { auth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword };
      window.fbAdminAuth = { adminAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut };

      // -------- Bootstrap default ADMIN (username: Eur, password: 1213) --------
      async function fbGet(path){ const snap = await get(dbRef(db,path)); return snap.exists()?snap.val():null; }
      async function fbSet(path,val){ return set(dbRef(db,path),val); }
      async function fbUpdate(path,val){ return update(dbRef(db,path),val); }

      (async function bootstrapAdmin(){
        try{
          const done = await fbGet('/Auth/bootstrap_done');
          const email = 'Eur@local.local'; // map username→email
          const pass  = '1213';
          if(!done){
            try{
              const cred = await createUserWithEmailAndPassword(adminAuth, email, pass);
              const uid = cred.user.uid;
              await fbSet('/Auth/users/'+uid, {uid,email,displayName:'Eur',role:'admin'});
              await fbSet('/Auth/roles/'+uid, {role:'admin'});
              await fbSet('/Auth/bootstrap_done', true);
            }catch(e){
              // if already exists, sign in to discover uid, then ensure roles
              try{
                const cred2 = await signInWithEmailAndPassword(adminAuth, email, pass);
                const uid2 = cred2.user.uid;
                await fbUpdate('/Auth/users/'+uid2, {uid:uid2,email,displayName:'Eur',role:'admin'});
                await fbSet('/Auth/roles/'+uid2, {role:'admin'});
                await fbSet('/Auth/bootstrap_done', true);
              }catch(_){}
            } finally {
              try{ await window.fbAdminAuth.signOut(adminAuth); }catch{}
            }
          }
        }catch(e){ /* silent */ }
      })();
    </script>

    <script type="text/babel">
      const {useState,useEffect,useMemo} = React;

      /* ----------------- Utils ----------------- */
      function pushToast(msg, type='ok'){
        const wrap = document.getElementById('toasts'); if(!wrap) return;
        const el = document.createElement('div');
        el.className = `fadein px-3 py-2 rounded-xl text-sm shadow border ${type==='ok'?'bg-emerald-50 border-emerald-200 text-emerald-800':'bg-rose-50 border-rose-200 text-rose-800'}`;
        el.textContent = msg; wrap.appendChild(el);
        setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(-6px)'},2600);
        setTimeout(()=>{try{wrap.removeChild(el)}catch{}},3000);
      }
      const hasFb = () => !!(window.fb && window.fbauth);
      const fbSet=(p,v)=>window.fb.dbApi.set(window.fb.dbApi.dbRef(window.fb.db,p),v);
      const fbUpdate=(p,v)=>window.fb.dbApi.update(window.fb.dbApi.dbRef(window.fb.db,p),v);
      const fbRemove=(p)=>window.fb.dbApi.remove(window.fb.dbApi.dbRef(window.fb.db,p));
      const fbGet = async(p)=>{ const s=await window.fb.dbApi.get(window.fb.dbApi.dbRef(window.fb.db,p)); return s.exists()?s.val():null; };
      const fbOn  = (p,cb)=> window.fb.dbApi.onValue(window.fb.dbApi.dbRef(window.fb.db,p),cb);
      const toEmail = (idOrEmail)=> idOrEmail.includes('@') ? idOrEmail : (idOrEmail.trim() ? `${idOrEmail.trim()}@local.local` : '');

      const colorFor = key => { const colors=['#0ea5e9','#06b6d4','#14b8a6','#22c55e','#a3e635','#eab308','#f59e0b','#ef4444','#6366f1','#8b5cf6','#ec4899','#f43f5e']; let h=0; const s=String(key||''); for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h); return colors[Math.abs(h)%colors.length]; };

      // Excel export helpers
      function exportUsersXlsx(users){
        if(!users?.length) return pushToast('ไม่มีรายชื่อให้ Export','err');
        const rows = users.map(u=>({ID:u.id||'',Name:u.name||'',TYPE:u.type||''}));
        try{
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Users');
          XLSX.writeFile(wb, 'users.xlsx'); pushToast('Export รายชื่อสำเร็จ');
        }catch{ pushToast('Export ล้มเหลว','err'); }
      }

      /* ----------------- Constants ----------------- */
      const DEFAULT_TYPES = ['Support','Case replen','Sorter','Picker','put to slot','Build','Tote'];
      const STATIONS = {
        'Floor 1': ['1101','1102','1103','1104','1105','1106','1107','1201','1203','1205'],
        'Floor 2': ['2101','2102','2103','2104','2105','2201','2203','2205'],
        'Floor 3': ['3101','3105','3201','3205'],
        'Extra'  : ['Support','Case replen','Sorter','put to slot','Picker','Build','Tote','Lan1','Lan2','Lan3','Lan4']
      };

      /* ----------------- Auth-aware App ----------------- */
      function App(){
        const [authUser,setAuthUser] = useState(null);
        const [role,setRole] = useState('guest'); // guest | manager | admin
        const [page,setPage] = useState('display'); // default: display for guests

        // app data
        const [users,setUsers] = useState([]);
        const [plan,setPlan] = useState({}); // {station:{station,assignedList}}
        const userMap = useMemo(()=>Object.fromEntries(users.map(u=>[String(u.id),u])),[users]);
        const planBySt = useMemo(()=>{ const m=new Map(); Object.values(plan||{}).forEach(t=>m.set(String(t.station),t)); return m;},[plan]);

        // auth state
        useEffect(()=>{
          if(!hasFb()) return;
          return window.fbauth.onAuthStateChanged(window.fbauth.auth, async (u)=>{
            setAuthUser(u||null);
            if(u){
              const r = await fbGet('/Auth/roles/'+u.uid+'/role');
              setRole(r || 'manager');
            }else{
              setRole('guest');
            }
          });
        },[]);

        // live data (users + plan)
        useEffect(()=>{
          if(!hasFb()) return;
          const offU = fbOn('/User', s=>{ const v=s.val()||{}; setUsers(Object.values(v)); });
          const offP = fbOn('/Plan', s=>{ setPlan(s.val()||{}); });
          return ()=>{ try{offU();offP();}catch{} };
        },[]);

        const canManage = role==='admin' || role==='manager';
        const isAdmin = role==='admin';

        return (
          <div className="min-h-screen">
            {/* Topbar */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center gap-2">
                <div className="text-xl sm:text-2xl font-bold">KKRDC PITL</div>
                <div className="flex items-center gap-2 ml-0 sm:ml-4">
                  <button className={`btn ${page==='display'?'btnP text-white':''}`} onClick={()=>setPage('display')}>แสดงผล</button>
                  <button className="btn" disabled={!canManage} onClick={()=>setPage('plan')}>แผนผัง</button>
                  <button className="btn" disabled={!canManage} onClick={()=>setPage('issues')}>ปัญหา</button>
                  {isAdmin && <button className={`btn ${page==='admin'?'btnP text-white':''}`} onClick={()=>setPage('admin')}>Admin</button>}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {authUser ? (
                    <>
                      <span className="pill">เข้าสู่ระบบ: {authUser.email} • {role}</span>
                      <button className="btn" onClick={async()=>{ await window.fbauth.signOut(window.fbauth.auth); pushToast('ออกจากระบบแล้ว'); setPage('display'); }}>ออกจากระบบ</button>
                    </>
                  ) : (
                    <>
                      <span className="pill">โหมดผู้ชม (ไม่ต้องล็อกอิน)</span>
                      <LoginButton onSuccess={()=>{ setPage('plan'); }} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
              {page==='display' && <DisplayPage planBySt={planBySt} userMap={userMap} />}
              {page==='plan'    && (canManage ? <PlanPage users={users} userMap={userMap} planBySt={planBySt} /> : <GuardCard />)}
              {page==='issues'  && (canManage ? <IssuesPage /> : <GuardCard />)}
              {page==='admin'   && (isAdmin   ? <AdminPage />  : <GuardCard />)}
            </div>
          </div>
        );
      }

      /* ----------------- Login ----------------- */
      function LoginButton({onSuccess}){
        const [open,setOpen] = useState(false);
        return (
          <>
            <button className="btnP" onClick={()=>setOpen(true)}>เข้าสู่ระบบ</button>
            {open && <LoginModal onClose={()=>setOpen(false)} onSuccess={()=>{ setOpen(false); onSuccess?.(); }} />}
          </>
        );
      }

      function LoginModal({onClose,onSuccess}){
        const [idOrEmail,setIdOrEmail]=useState('Eur'); // prefill as requested
        const [pass,setPass]=useState('1213'); // prefill as requested
        const [loading,setLoading]=useState(false);

        async function submit(e){
          e.preventDefault();
          try{
            setLoading(true);
            await window.fbauth.signInWithEmailAndPassword(window.fbauth.auth, toEmail(idOrEmail.trim()), pass);
            pushToast('เข้าสู่ระบบสำเร็จ'); onSuccess?.();
          }catch(e){ pushToast('เข้าสู่ระบบไม่สำเร็จ: '+(e?.message||e),'err'); }
          finally{ setLoading(false); }
        }
        async function forgot(){
          if(!idOrEmail.trim()) return pushToast('กรุณากรอกอีเมล/ชื่อผู้ใช้ก่อน','err');
          try{ await window.fbauth.sendPasswordResetEmail(window.fbauth.auth, toEmail(idOrEmail.trim())); pushToast('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว'); }catch(e){ pushToast('ส่งลิงก์ไม่สำเร็จ: '+(e?.message||e),'err'); }
        }

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50">
            <div className="card w-[420px] max-w-[95vw] p-5 fadein">
              <div className="text-lg font-semibold mb-2">เข้าสู่ระบบ</div>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">อีเมลหรือชื่อผู้ใช้</div>
                  <input className="w-full rounded border px-3 py-2" value={idOrEmail} onChange={e=>setIdOrEmail(e.target.value)} required/>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">รหัสผ่าน</div>
                  <input className="w-full rounded border px-3 py-2" type="password" value={pass} onChange={e=>setPass(e.target.value)} required/>
                </div>
                <div className="flex items-center justify-between">
                  <button className="text-sky-600 underline text-sm" type="button" onClick={forgot}>ลืมรหัสผ่าน</button>
                  <div className="flex gap-2">
                    <button className="btn" type="button" onClick={onClose}>ยกเลิก</button>
                    <button className="btnP" disabled={loading} type="submit">{loading?'...':'เข้าสู่ระบบ'}</button>
                  </div>
                </div>
              </form>
              <div className="mt-3 text-xs text-slate-500">ผู้ใช้ทั่วไปไม่ต้องล็อกอิน สามารถกดปุ่ม “แสดงผล” ด้านบนเพื่อดูหน้าแสดงผลได้</div>
            </div>
          </div>
        );
      }

      /* ----------------- Admin Page ----------------- */
      function AdminPage(){
        const [list,setList] = useState([]); // from /Auth/users
        const [idOrEmail,setIdOrEmail]=useState('');
        const [pass,setPass]=useState('');
        const [role,setRole]=useState('manager'); // default
        const [busy,setBusy]=useState(false);

        useEffect(()=>{
          const off = fbOn('/Auth/users', s=>{ const v=s.val()||{}; setList(Object.values(v)); });
          return ()=>{ try{off();}catch{} };
        },[]);

        async function createUser(){
          if(!idOrEmail.trim()||!pass) return pushToast('กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน','err');
          setBusy(true);
          try{
            const email = toEmail(idOrEmail.trim());
            // create with current session (any signed-in admin can create; or use public signup if enabled)
            const cred = await window.fbauth.createUserWithEmailAndPassword(window.fbauth.auth, email, pass);
            const uid = cred.user.uid;
            await fbSet('/Auth/users/'+uid, {uid,email,role});
            await fbSet('/Auth/roles/'+uid, {role});
            pushToast('สร้างผู้ใช้สำเร็จ');
          }catch(e){ pushToast('สร้างผู้ใช้ไม่สำเร็จ: '+(e?.message||e),'err'); }
          finally{ setBusy(false); }
        }
        async function setUserRole(uid,newRole){
          await fbUpdate('/Auth/users/'+uid, {role:newRole});
          await fbSet('/Auth/roles/'+uid, {role:newRole});
          pushToast('อัปเดตสิทธิ์เรียบร้อย');
        }

        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-5">
              <div className="card p-4">
                <div className="text-lg font-semibold mb-2">สร้างผู้ใช้ใหม่</div>
                <div className="space-y-3">
                  <div><div className="text-xs text-slate-500 mb-1">อีเมลหรือชื่อผู้ใช้</div><input className="w-full rounded border px-3 py-2" value={idOrEmail} onChange={e=>setIdOrEmail(e.target.value)} placeholder="เช่น tom หรือ tom@company.com"/></div>
                  <div><div className="text-xs text-slate-500 mb-1">รหัสผ่านเริ่มต้น</div><input className="w-full rounded border px-3 py-2" value={pass} onChange={e=>setPass(e.target.value)} placeholder="อย่างน้อย 6 ตัว"/></div>
                  <div><div className="text-xs text-slate-500 mb-1">สิทธิ์</div>
                    <select className="w-full rounded border px-3 py-2" value={role} onChange={e=>setRole(e.target.value)}>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div className="flex justify-end"><button className="btnP" disabled={busy} onClick={createUser}>{busy?'...':'สร้างผู้ใช้'}</button></div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-7">
              <div className="card p-4">
                <div className="text-lg font-semibold mb-2">รายชื่อผู้ใช้ (Auth)</div>
                <div className="max-h-[60vh] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500"><tr><th className="py-2 pr-3">อีเมล</th><th className="py-2 pr-3">สิทธิ์</th><th className="py-2">การจัดการ</th></tr></thead>
                    <tbody>
                      {list.map(u=>(
                        <tr key={u.uid} className="border-t">
                          <td className="py-2 pr-3">{u.email}</td>
                          <td className="py-2 pr-3">
                            <select className="border rounded px-2 py-1" value={u.role} onChange={e=>setUserRole(u.uid,e.target.value)}>
                              <option value="manager">manager</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="py-2">
                            <span className="text-slate-400 text-xs">แก้รหัสผ่าน: ใช้ “ลืมรหัสผ่าน” ที่หน้า Login</span>
                          </td>
                        </tr>
                      ))}
                      {list.length===0 && <tr><td className="py-3 text-slate-500" colSpan="3">ยังไม่มีผู้ใช้</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      }

      function GuardCard(){
        return (
          <div className="card p-6 text-center">
            <div className="text-lg font-semibold mb-1">ต้องเข้าสู่ระบบ</div>
            <div className="text-slate-600">กรุณาเข้าสู่ระบบด้วยสิทธิ์ที่เหมาะสมเพื่อใช้งานหน้านี้</div>
          </div>
        );
      }

      /* ----------------- Display (public) ----------------- */
      function DisplayPage({planBySt,userMap}){
        return (
          <div className="card p-4">
            <div className="text-lg font-semibold mb-3">แสดงผล (ดูอย่างเดียว)</div>
            {Object.keys(STATIONS).map(group=>{
              const stations = STATIONS[group];
              return (
                <div key={group} className="mb-4">
                  <div className="font-bold text-sky-700">{group}</div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                    {stations.map(st=>{
                      const rec = planBySt.get(st)||{station:st,assignedList:[]};
                      const emps = (rec.assignedList||[]).map(id=>userMap[id]).filter(Boolean);
                      return (
                        <div key={st} className="tile">
                          <div className="font-bold">{st}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {emps.length? emps.map(e=> <span key={e.id} className="pill">{e.name}{e.type?` (${e.type})`:''}</span>) : <span className="text-slate-500 text-sm">-</span>}
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

      /* ----------------- Plan (manager/admin) ----------------- */
      function PlanPage({users,userMap,planBySt}){
        const [search,setSearch]=useState('');
        const [typeFilter,setTypeFilter]=useState('All');
        const [assign,setAssign]=useState({open:false,station:'',sel:new Set(),q:''});
        const [adding,setAdding]=useState(false);
        const [newUser,setNewUser]=useState({id:'',name:'',type:''});

        const filtered = useMemo(()=>{ const q=search.toLowerCase(); return users.filter(u=> (typeFilter==='All'||u.type===typeFilter) && (u.name+u.id).toLowerCase().includes(q)); },[users,search,typeFilter]);

        function onDragStartEmp(e,emp){ e.dataTransfer.setData('text/plain', JSON.stringify(emp)); e.dataTransfer.effectAllowed='move'; }

        async function writePlan(station, list){
          await fbSet('/Plan/'+String(station), {id:String(station), station:String(station), assignedList:Array.from(new Set(list||[])), updatedAt:new Date().toISOString()});
        }

        async function addUser(){
          if(!String(newUser.id).trim() || !String(newUser.name).trim()) return pushToast('กรอก ID และชื่อให้ครบ','err');
          await fbSet('/User/'+String(newUser.id).trim(), { id:String(newUser.id).trim(), name:String(newUser.name).trim(), type:String(newUser.type||'').trim() });
          setNewUser({id:'',name:'',type:''}); setAdding(false); pushToast('เพิ่มพนักงานเรียบร้อย');
        }
        async function deleteUser(id){
          if(!confirm('ลบพนักงานนี้?')) return;
          await fbRemove('/User/'+String(id));
          // remove from every station
          for (const g of Object.keys(STATIONS)){
            for (const st of STATIONS[g]){
              const r = planBySt.get(st); if(!r) continue;
              if((r.assignedList||[]).includes(id)){
                await writePlan(st, (r.assignedList||[]).filter(x=>x!==id));
              }
            }
          }
          pushToast('ลบพนักงานแล้ว');
        }

        return (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button className="btnP" onClick={()=>setAdding(true)}>+ เพิ่มพนักงาน</button>
              <button className="btn" onClick={()=>exportUsersXlsx(users)}>Export รายชื่อ</button>
            </div>

            <div className="grid grid-cols-12 gap-6">
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
                        <div className="mb-2 px-3 py-2 rounded border bg-white/70">
                          <div className="text-lg font-bold text-sky-700">{group}</div>
                        </div>
                        <div className="grid gap-3">
                          {stations.map(st=>{
                            const rec = planBySt.get(st)||{station:st,assignedList:[]};
                            const emps = (rec.assignedList||[]).map(id=>userMap[id]).filter(Boolean);
                            return (
                              <div key={st}
                                className={`tile ${emps.length? '' : 'missing'}`}
                                onDragOver={(e)=>{e.preventDefault();}}
                                onDrop={async(e)=>{
                                  e.preventDefault();
                                  let emp=null; try{ emp = JSON.parse(e.dataTransfer.getData('text/plain')||''); }catch{}
                                  if(!emp?.id) return;
                                  // remove from other stations
                                  const all = Object.values(STATIONS).flat();
                                  for(const s of all){
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

      /* ----------------- Issues (manager/admin) ----------------- */
      function IssuesPage(){
        const [form,setForm]=useState({type:'Hardware',priority:'Medium',station:'',reporter:'',message:''});
        const [issues,setIssues]=useState([]);
        const [selected,setSelected]=useState(null);
        const [chat,setChat]=useState([]);
        const [chatText,setChatText]=useState('');

        useEffect(()=>{ const off=fbOn('/Issues', s=>{ const v=s.val()||{}; const arr=Object.values(v); arr.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||''))); setIssues(arr); }); return ()=>{try{off();}catch{}}; },[]);
        useEffect(()=>{ if(!selected){ setChat([]); return; } const off=fbOn('/IssueChats/'+selected.id, s=>{ const v=s.val()||{}; const arr=Object.values(v); arr.sort((a,b)=>(a.ts||'').localeCompare(b.ts||'')); setChat(arr); }); return ()=>{try{off();}catch{}}; },[selected?.id]);

        async function createTicket(e){ e.preventDefault(); if(!form.message.trim()) return pushToast('กรุณากรอกรายละเอียด','err'); const ref=window.fb.dbApi.push(window.fb.dbApi.dbRef(window.fb.db,'/Issues')); const id=ref.key; const obj={id,time:new Date().toISOString(),type:form.type,priority:form.priority,station:form.station||'',reporter:form.reporter||'',message:form.message||'',status:'Open'}; await fbSet('/Issues/'+id,obj); setForm({type:'Hardware',priority:'Medium',station:'',reporter:'',message:''}); pushToast('บันทึกเคสแล้ว'); }
        async function updateTicket(patch){ if(!selected) return; await fbUpdate('/Issues/'+selected.id, patch); setSelected(s=>({...s,...patch})); }
        async function deleteTicket(){ if(!selected) return; if(!confirm('ลบเคสนี้?')) return; await fbRemove('/Issues/'+selected.id); setSelected(null); pushToast('ลบเคสแล้ว'); }
        async function sendChat(){ if(!selected||!chatText.trim()) return; const ref=window.fb.dbApi.push(window.fb.dbApi.dbRef(window.fb.db,'/IssueChats/'+selected.id)); await fbSet('/IssueChats/'+selected.id+'/'+ref.key,{role:'user',content:chatText.trim(),ts:new Date().toISOString()}); setChatText(''); }

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
                  <div><div className="text-xs text-slate-500 mb-1">สถานี</div><input className="w-full rounded border px-3 py-2" value={form.station} onChange={e=>setForm({...form,station:e.target.value})}/></div>
                  <div><div className="text-xs text-slate-500 mb-1">ผู้แจ้ง</div><input className="w-full rounded border px-3 py-2" value={form.reporter} onChange={e=>setForm({...form,reporter:e.target.value})}/></div>
                  <div><div className="text-xs text-slate-500 mb-1">รายละเอียด *</div><textarea className="w-full rounded border px-3 py-2" rows="4" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required/></div>
                  <div className="flex justify-end"><button className="btnP" type="submit">บันทึก</button></div>
                </form>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <div className="card p-4">
                <div className="text-lg font-semibold mb-3">ประวัติเคส</div>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 xl:col-span-7 max-h-[55vh] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500"><tr><th className="py-2 pr-3">เวลา</th><th className="py-2 pr-3">สถานี</th><th className="py-2 pr-3">ประเภท</th><th className="py-2 pr-3">ด่วน</th><th className="py-2 pr-3">สถานะ</th><th className="py-2">รายละเอียด</th></tr></thead>
                      <tbody>
                        {issues.map(it=>(
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

      /* ----------------- Mount ----------------- */
      ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
    </script>
  </body>
</html>
