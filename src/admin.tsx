import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  AlertTriangle, BadgeCheck, Ban, BarChart3, Bell, Building2, CalendarCheck,
  Check, ChevronDown, CircleDollarSign, CircleUserRound, Clock3, Eye, FileCheck2,
  LayoutDashboard, Menu, MessageSquareWarning, MoreHorizontal, Plane, Search,
  Settings, ShieldCheck, Star, TrendingUp, UserCheck, Users, WalletCards, X,
} from 'lucide-react';
import '../app/globals.css';
import './admin.css';
import { getCurrentProfile, getDashboardCounts, listSellers, setSellerStatus } from '../lib/database';
import { isDatabaseConfigured } from '../lib/supabase';

type SellerStatus = 'Tasdiqlangan' | 'Kutilmoqda' | 'Bloklangan';
type Seller = { id:string | number; company:string; owner:string; phone:string; tours:number; sales:string; rating:string; status:SellerStatus };

const initialSellers: Seller[] = [
  { id:1, company:'Atlas Travel', owner:'Aziz Karimov', phone:'+998 90 123 45 67', tours:12, sales:'286.4 mln', rating:'4.9', status:'Tasdiqlangan' },
  { id:2, company:'Orient Voyage', owner:'Madina Rahimova', phone:'+998 93 445 21 10', tours:8, sales:'194.8 mln', rating:'4.7', status:'Tasdiqlangan' },
  { id:3, company:'Samarqand Tour', owner:'Jasur Toirov', phone:'+998 97 722 18 08', tours:0, sales:'—', rating:'—', status:'Kutilmoqda' },
  { id:4, company:'Skyline Holidays', owner:'Dilorom Aliyeva', phone:'+998 99 885 40 20', tours:5, sales:'78.2 mln', rating:'4.2', status:'Kutilmoqda' },
  { id:5, company:'Easy Trip', owner:'Bekzod Usmonov', phone:'+998 95 311 09 09', tours:2, sales:'21.5 mln', rating:'3.1', status:'Bloklangan' },
];

const recentTours = [
  ['Istanbul bahor sayohati','Atlas Travel','Istanbul','6 890 000','Moderatsiyada'],
  ['Dubai Premium Week','Orient Voyage','Dubai','12 400 000','Faol'],
  ['Samarqand tarixi','Samarqand Tour','Samarqand','1 850 000','Moderatsiyada'],
  ['Antalya Family Resort','Skyline Holidays','Antalya','9 700 000','Rad etilgan'],
];

function AdminPanel() {
  const [section, setSection] = useState('overview');
  const [sellers, setSellers] = useState(initialSellers);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'Barchasi' | SellerStatus>('Barchasi');
  const [toast, setToast] = useState('');
  const [detail, setDetail] = useState<Seller | null>(null);
  const [counts, setCounts] = useState({ users: 0, sellers: 0, tours: 0, bookings: 0 });

  useEffect(() => {
    if (!isDatabaseConfigured) return;
    void (async () => {
      try {
        const profile = await getCurrentProfile();
        if (!profile) { window.location.href = '/auth/?next=/admin/'; return; }
        if (profile.role !== 'admin') { window.location.href = '/'; return; }
        const [rows, totals] = await Promise.all([listSellers(), getDashboardCounts()]);
        if (rows) setSellers(rows.map(row => ({ id: row.id, company: row.company_name, owner: row.owner_name,
          phone: row.phone ?? '—', tours: 0, sales: '—', rating: String(row.rating),
          status: row.status === 'approved' ? 'Tasdiqlangan' : row.status === 'blocked' ? 'Bloklangan' : 'Kutilmoqda' })));
        if (totals) setCounts(totals);
      } catch (error) { setToast(error instanceof Error ? error.message : 'Admin ma’lumotlari yuklanmadi.'); }
    })();
  }, []);

  const filtered = useMemo(() => sellers.filter((seller) =>
    `${seller.company} ${seller.owner} ${seller.phone}`.toLowerCase().includes(query.toLowerCase()) &&
    (status === 'Barchasi' || seller.status === status)
  ), [sellers, query, status]);

  async function updateSeller(id:string | number, next:SellerStatus) {
    if (isDatabaseConfigured) {
      try { await setSellerStatus(String(id), next === 'Tasdiqlangan' ? 'approved' : next === 'Bloklangan' ? 'blocked' : 'pending'); }
      catch (error) { setToast(error instanceof Error ? error.message : 'Holat yangilanmadi.'); return; }
    }
    setSellers((current) => current.map((seller) => seller.id === id ? { ...seller, status:next } : seller));
    setDetail((current) => current?.id === id ? { ...current, status:next } : current);
    setToast(next === 'Tasdiqlangan' ? 'Seller muvaffaqiyatli tasdiqlandi.' : next === 'Bloklangan' ? 'Seller faoliyati bloklandi.' : 'Seller holati yangilandi.');
    window.setTimeout(() => setToast(''), 3200);
  }

  const pending = sellers.filter((seller) => seller.status === 'Kutilmoqda').length;

  return <div className="admin-app">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/"><span><Plane /></span><b>go2trip</b><em>ADMIN</em></a>
      <p>BOSHQARUV</p>
      <nav>
        <button className={section === 'overview' ? 'active' : ''} onClick={() => setSection('overview')}><LayoutDashboard /> Umumiy ko‘rinish</button>
        <button className={section === 'sellers' ? 'active' : ''} onClick={() => setSection('sellers')}><Building2 /> Sellerlar <i>{pending}</i></button>
        <button onClick={() => setSection('users')}><Users /> Foydalanuvchilar</button>
        <button onClick={() => setSection('tours')}><Plane /> Turlar <i>7</i></button>
        <button onClick={() => setSection('bookings')}><CalendarCheck /> Bronlar</button>
        <button onClick={() => setSection('payments')}><WalletCards /> To‘lovlar</button>
      </nav>
      <p>NAZORAT</p>
      <nav>
        <button><MessageSquareWarning /> Shikoyatlar <i className="danger">3</i></button>
        <button><FileCheck2 /> Moderatsiya</button>
        <button><BarChart3 /> Hisobotlar</button>
        <button><Settings /> Sozlamalar</button>
      </nav>
      <div className="admin-security"><ShieldCheck /><div><strong>Tizim barqaror</strong><small>Oxirgi tekshiruv: hozir</small></div></div>
    </aside>

    <main className="admin-main">
      <header className="admin-header"><button className="admin-menu"><Menu /></button><div><span>Administrator paneli</span><strong>Platforma nazorati</strong></div><label><Search /><input placeholder="Umumiy qidiruv..." /></label><button className="admin-bell"><Bell /><i /></button><button className="admin-user"><span>ZA</span><div><b>Zarnigor</b><small>Super administrator</small></div><ChevronDown /></button></header>
      <div className="admin-content" data-users={counts.users} data-tours={counts.tours}>
        {toast && <div className="admin-toast"><Check />{toast}</div>}
        <section className="admin-heading"><div><p>GO2TRIP BOSHQARUVI</p><h1>{section === 'sellers' ? 'Sellerlar nazorati' : 'Umumiy ko‘rinish'}</h1><span>{section === 'sellers' ? 'Hamkorlarni tekshiring, tasdiqlang va boshqaring.' : 'Platformadagi eng muhim ko‘rsatkichlar va vazifalar.'}</span></div><div className="date-chip"><Clock3 /> 5-oktabr, 2026</div></section>

        {section === 'overview' && <>
          <section className="admin-stats">
            <article><span className="blue"><Users /></span><div><small>Jami userlar</small><strong>12 846</strong><em><TrendingUp /> +14.2%</em></div></article>
            <article><span className="purple"><Building2 /></span><div><small>Faol sellerlar</small><strong>{sellers.filter(s=>s.status==='Tasdiqlangan').length}</strong><em>{pending} ta tekshiruvda</em></div></article>
            <article><span className="orange"><Plane /></span><div><small>Faol turlar</small><strong>186</strong><em>7 ta moderatsiyada</em></div></article>
            <article><span className="green"><CircleDollarSign /></span><div><small>Oylik aylanma</small><strong>2.84 mlrd</strong><em><TrendingUp /> +19.8%</em></div></article>
          </section>
          <section className="admin-grid">
            <article className="admin-card revenue-card"><div className="admin-card-title"><div><h2>Sotuvlar dinamikasi</h2><p>Oxirgi 8 haftadagi aylanma</p></div><button>8 hafta <ChevronDown /></button></div><div className="revenue-total"><strong>₽ 2.84 mlrd</strong><span>+19.8% oldingi davrga nisbatan</span></div><div className="line-chart"><svg viewBox="0 0 700 180" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#396fe8" stopOpacity=".28"/><stop offset="1" stopColor="#396fe8" stopOpacity="0"/></linearGradient></defs><path className="area" d="M0 150 C55 142 70 110 120 118 S190 95 235 100 S300 54 350 75 S420 42 470 57 S545 22 590 38 S650 12 700 18 L700 180 L0 180Z"/><path className="line" d="M0 150 C55 142 70 110 120 118 S190 95 235 100 S300 54 350 75 S420 42 470 57 S545 22 590 38 S650 12 700 18"/></svg><div>{['12-avg','19-avg','26-avg','2-sen','9-sen','16-sen','23-sen','30-sen'].map(x=><span key={x}>{x}</span>)}</div></div></article>
            <article className="admin-card tasks-card"><div className="admin-card-title"><div><h2>Tezkor vazifalar</h2><p>E’tibor talab qiladigan holatlar</p></div></div>{[[Building2,'Seller tekshiruvi',`${pending} ta ariza kutilmoqda`,'Sellerlarni ko‘rish'],[Plane,'Tur moderatsiyasi','7 ta yangi tur','Turlarni ko‘rish'],[MessageSquareWarning,'Shikoyatlar','3 ta ochiq murojaat','Ko‘rib chiqish']].map(([Icon,title,sub,action],i)=><div className="task-row" key={title as string}><span className={`task-icon t${i}`}><Icon /></span><div><strong>{title as string}</strong><small>{sub as string}</small></div><button onClick={()=> i===0 && setSection('sellers')}>{action as string}</button></div>)}</article>
          </section>
          <section className="admin-card"><div className="admin-card-title table-title"><div><h2>So‘nggi turlar</h2><p>Yangi qo‘shilgan va moderatsiyadagi takliflar</p></div><button onClick={()=>setSection('tours')}>Barchasini ko‘rish</button></div><div className="admin-table-wrap"><table><thead><tr><th>Tur</th><th>Seller</th><th>Yo‘nalish</th><th>Narx</th><th>Holat</th><th /></tr></thead><tbody>{recentTours.map((tour)=><tr key={tour[0]}><td><strong>{tour[0]}</strong></td><td>{tour[1]}</td><td>{tour[2]}</td><td><b>{tour[3]} UZS</b></td><td><span className={`admin-status ${tour[4]==='Faol'?'ok':tour[4]==='Rad etilgan'?'bad':'wait'}`}>{tour[4]}</span></td><td><button className="icon-more"><MoreHorizontal /></button></td></tr>)}</tbody></table></div></section>
        </>}

        {section === 'sellers' && <section className="admin-card sellers-card"><div className="seller-toolbar"><label><Search /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kompaniya, rahbar yoki telefon..." /></label><div>{(['Barchasi','Tasdiqlangan','Kutilmoqda','Bloklangan'] as const).map(item=><button key={item} className={status===item?'active':''} onClick={()=>setStatus(item)}>{item}</button>)}</div></div><div className="admin-table-wrap"><table><thead><tr><th>Kompaniya</th><th>Rahbar va aloqa</th><th>Turlar</th><th>Sotuv</th><th>Reyting</th><th>Holat</th><th>Amallar</th></tr></thead><tbody>{filtered.map(seller=><tr key={seller.id}><td><div className="company-cell"><span>{seller.company.slice(0,2).toUpperCase()}</span><strong>{seller.company}</strong></div></td><td><strong>{seller.owner}</strong><small>{seller.phone}</small></td><td>{seller.tours}</td><td><b>{seller.sales}</b></td><td><span className="rating"><Star /> {seller.rating}</span></td><td><span className={`admin-status ${seller.status==='Tasdiqlangan'?'ok':seller.status==='Bloklangan'?'bad':'wait'}`}>{seller.status}</span></td><td><div className="seller-actions"><button title="Ko‘rish" onClick={()=>setDetail(seller)}><Eye /></button>{seller.status!=='Tasdiqlangan'&&<button className="approve" title="Tasdiqlash" onClick={()=>updateSeller(seller.id,'Tasdiqlangan')}><UserCheck /></button>}{seller.status!=='Bloklangan'&&<button className="block" title="Bloklash" onClick={()=>updateSeller(seller.id,'Bloklangan')}><Ban /></button>}</div></td></tr>)}</tbody></table>{!filtered.length&&<div className="admin-empty">Seller topilmadi.</div>}</div></section>}

        {!['overview','sellers'].includes(section) && <section className="coming-soon"><span><Settings /></span><h2>Bo‘lim tayyorlanmoqda</h2><p>Ushbu modul keyingi bosqichda ma’lumotlar bazasiga ulanadi.</p><button onClick={()=>setSection('overview')}>Umumiy sahifaga qaytish</button></section>}
      </div>
    </main>

    {detail && <div className="admin-modal-bg"><div className="seller-modal"><div className="seller-modal-head"><div><span>{detail.company.slice(0,2).toUpperCase()}</span><div><h2>{detail.company}</h2><p>Seller ma’lumotlari va tekshiruv holati</p></div></div><button onClick={()=>setDetail(null)}><X /></button></div><div className="verification-banner"><BadgeCheck /><div><strong>Hujjatlarni tekshirish</strong><p>STIR, litsenziya va bank rekvizitlari yuklangan.</p></div><span>4/4 hujjat</span></div><div className="seller-info"><div><small>Rahbar</small><strong>{detail.owner}</strong></div><div><small>Telefon</small><strong>{detail.phone}</strong></div><div><small>Faol turlar</small><strong>{detail.tours}</strong></div><div><small>Sotuv hajmi</small><strong>{detail.sales}</strong></div><div><small>Reyting</small><strong>{detail.rating}</strong></div><div><small>Joriy holat</small><span className={`admin-status ${detail.status==='Tasdiqlangan'?'ok':detail.status==='Bloklangan'?'bad':'wait'}`}>{detail.status}</span></div></div><div className="seller-modal-actions"><button onClick={()=>updateSeller(detail.id,'Bloklangan')}><Ban /> Bloklash</button><button className="approve-big" onClick={()=>updateSeller(detail.id,'Tasdiqlangan')}><Check /> Seller’ni tasdiqlash</button></div></div></div>}
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AdminPanel /></React.StrictMode>);
