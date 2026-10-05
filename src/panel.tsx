import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BarChart3, Bell, CalendarDays, CheckCircle2, ChevronDown, CircleDollarSign,
  CircleUserRound, Clock3, Eye, LayoutDashboard, MapPin, Menu, PackagePlus,
  Pencil, Plane, Plus, Search, Settings, Star, Trash2, TrendingUp, Users, X,
} from 'lucide-react';
import '../app/globals.css';
import './panel.css';
import { createTour, getCurrentProfile, getOwnSellerProfile, listOwnTours, removeTour as deleteTour, type TourRow } from '../lib/database';
import { signOut } from '../lib/auth';
import { isDatabaseConfigured } from '../lib/supabase';

type TourStatus = 'Faol' | 'Moderatsiyada' | 'Qoralama';
type Tour = {
  id: string; name: string; place: string; date: string; price: string;
  bookings: number; views: number; status: TourStatus;
};

const initialTours: Tour[] = [
  { id: '1', name: 'Istanbul klassik sayohati', place: 'Istanbul, Turkiya', date: '18–23 oktabr', price: '6 890 000', bookings: 18, views: 1248, status: 'Faol' },
  { id: '2', name: 'Dubai city & beach', place: 'Dubai, BAA', date: '25–31 oktabr', price: '9 240 000', bookings: 11, views: 846, status: 'Faol' },
  { id: '3', name: 'Antalya all inclusive', place: 'Antalya, Turkiya', date: '2–9 noyabr', price: '8 560 000', bookings: 0, views: 214, status: 'Moderatsiyada' },
  { id: '4', name: 'Baku weekend', place: 'Baku, Ozarbayjon', date: '14–17 noyabr', price: '4 980 000', bookings: 0, views: 0, status: 'Qoralama' },
];

const statusClass: Record<TourStatus, string> = {
  Faol: 'active', Moderatsiyada: 'review', Qoralama: 'draft',
};

const mapTour = (tour: TourRow): Tour => ({ id: tour.id, name: tour.title, place: tour.destination,
  date: `${tour.starts_at} — ${tour.ends_at}`, price: new Intl.NumberFormat('uz-UZ').format(tour.price_uzs),
  bookings: 0, views: 0, status: tour.status === 'active' ? 'Faol' : tour.status === 'draft' ? 'Qoralama' : 'Moderatsiyada' });

function PartnerPanel() {
  const [tours, setTours] = useState(initialTours);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Barchasi' | TourStatus>('Barchasi');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [company, setCompany] = useState('Hamkor');

  useEffect(() => {
    if (!isDatabaseConfigured) return;
    void (async () => {
      try {
        const profile = await getCurrentProfile();
        if (!profile) { window.location.href = '/auth/?next=/panel/'; return; }
        if (!['seller', 'admin'].includes(profile.role)) { window.location.href = '/'; return; }
        const seller = await getOwnSellerProfile();
        if (!seller) { setTours([]); setNotice('Seller profilingiz hali yaratilmagan. Administratorga murojaat qiling.'); return; }
        setSellerId(seller.id); setCompany(seller.company_name);
        setTours((await listOwnTours(seller.id)).map(mapTour));
      } catch (error) { setNotice(error instanceof Error ? error.message : 'Ma’lumotlarni yuklab bo‘lmadi.'); }
    })();
  }, []);

  const filtered = useMemo(() => tours.filter((tour) => {
    const matchesText = `${tour.name} ${tour.place}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === 'Barchasi' || tour.status === filter);
  }), [tours, query, filter]);

  async function addTour(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Tour = {
      id: String(Date.now()),
      name: String(data.get('name')),
      place: String(data.get('place')),
      date: `${String(data.get('starts_at'))} — ${String(data.get('ends_at'))}`,
      price: String(data.get('price')),
      bookings: 0,
      views: 0,
      status: 'Moderatsiyada',
    };
    if (isDatabaseConfigured) {
      if (!sellerId) { setNotice('Avval seller profilingiz tasdiqlanishi kerak.'); return; }
      try {
        const created = await createTour({ seller_id: sellerId, title: next.name, destination: next.place,
          starts_at: String(data.get('starts_at')), ends_at: String(data.get('ends_at')),
          price_uzs: Number(String(data.get('price')).replace(/\D/g, '')), description: String(data.get('description') ?? '') });
        setTours((current) => [mapTour(created as TourRow), ...current]);
      } catch (error) { setNotice(error instanceof Error ? error.message : 'Tur saqlanmadi.'); return; }
    } else setTours((current) => [next, ...current]);
    setShowForm(false);
    setNotice('Yangi tur moderatsiyaga yuborildi.');
    window.setTimeout(() => setNotice(''), 3500);
  }

  async function removeTour(id: string) {
    if (isDatabaseConfigured) {
      try { await deleteTour(id); } catch (error) { setNotice(error instanceof Error ? error.message : 'Tur o‘chirilmadi.'); return; }
    }
    setTours((current) => current.filter((tour) => tour.id !== id));
  }

  return (
    <div className="partner-shell">
      <aside className="partner-sidebar">
        <a className="panel-brand" href="/"><span><Plane /></span>go2trip</a>
        <div className="partner-label">HAMKOR PANELI</div>
        <nav>
          <a className="selected" href="#overview"><LayoutDashboard /> Umumiy</a>
          <a href="#tours"><Plane /> Mening turlarim <span>{tours.length}</span></a>
          <a href="#bookings"><CalendarDays /> Bronlar <span>29</span></a>
          <a href="#analytics"><BarChart3 /> Statistika</a>
          <a href="#settings"><Settings /> Sozlamalar</a>
        </nav>
        <div className="sidebar-support"><strong>Yordam kerakmi?</strong><p>Hamkorlar bo‘limi sizga yordam beradi.</p><button>Yordam markazi</button></div>
        <a className="back-home" href="/">← Saytga qaytish</a>
      </aside>

      <main className="partner-main">
        <header className="partner-header">
          <button className="panel-menu" aria-label="Menyuni ochish"><Menu /></button>
          <div><span>Hamkor paneli</span><strong>Atlas Travel</strong></div>
          <div className="partner-actions"><button aria-label="Bildirishnomalar"><Bell /><i /></button><button className="partner-profile" onClick={async()=>{ await signOut(); window.location.href='/auth/'; }}><span>{company.slice(0,2).toUpperCase()}</span><div><strong>{company}</strong><small>Chiqish</small></div><ChevronDown /></button></div>
        </header>

        <div className="partner-content" id="overview">
          {notice && <div className="panel-notice"><CheckCircle2 /> {notice}</div>}
          <section className="welcome-row"><div><p>Hamkor kabineti</p><h1>Xush kelibsiz, {company}!</h1><span>Natijalar va turlaringiz holati bilan tanishing.</span></div><button className="primary-action" onClick={() => setShowForm(true)}><Plus /> Yangi tur joylashtirish</button></section>

          <section className="stat-grid">
            <article><span className="stat-icon blue"><Eye /></span><div><small>Jami ko‘rishlar</small><strong>2 308</strong><em><TrendingUp /> 12.4% o‘sish</em></div></article>
            <article><span className="stat-icon violet"><CalendarDays /></span><div><small>Faol bronlar</small><strong>29</strong><em><TrendingUp /> 8.2% o‘sish</em></div></article>
            <article><span className="stat-icon orange"><CircleDollarSign /></span><div><small>Bu oy daromad</small><strong>186.4 mln</strong><em><TrendingUp /> 18.7% o‘sish</em></div></article>
            <article><span className="stat-icon green"><Star /></span><div><small>Hamkor reytingi</small><strong>4.9</strong><em>128 ta sharh</em></div></article>
          </section>

          <section className="panel-card chart-card" id="analytics">
            <div className="card-title"><div><h2>Bronlar dinamikasi</h2><p>Oxirgi 7 kunlik ko‘rsatkichlar</p></div><button>7 kun <ChevronDown /></button></div>
            <div className="chart-wrap">
              {[38, 52, 45, 72, 58, 86, 68].map((height, index) => <div className="bar-column" key={index}><span style={{ height: `${height}%` }} /><small>{['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'][index]}</small></div>)}
            </div>
          </section>

          <section className="panel-card tours-card" id="tours">
            <div className="card-title tours-title"><div><h2>Mening turlarim</h2><p>Barcha takliflaringizni bir joydan boshqaring</p></div><button className="secondary-action" onClick={() => setShowForm(true)}><PackagePlus /> Tur qo‘shish</button></div>
            <div className="tour-toolbar">
              <label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tur yoki yo‘nalishni qidiring" /></label>
              <div>{(['Barchasi', 'Faol', 'Moderatsiyada', 'Qoralama'] as const).map((item) => <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
            </div>
            <div className="tour-table-wrap"><table><thead><tr><th>Tur nomi</th><th>Sana</th><th>Narx</th><th>Bron / Ko‘rish</th><th>Holati</th><th /></tr></thead><tbody>
              {filtered.map((tour) => <tr key={tour.id}><td><strong>{tour.name}</strong><span><MapPin /> {tour.place}</span></td><td>{tour.date}</td><td><strong>{tour.price}</strong><small>UZS</small></td><td><span className="metrics"><b><Users /> {tour.bookings}</b><b><Eye /> {tour.views}</b></span></td><td><span className={`status-pill ${statusClass[tour.status]}`}>{tour.status === 'Faol' ? <CheckCircle2 /> : <Clock3 />}{tour.status}</span></td><td><div className="row-actions"><button aria-label="Tahrirlash"><Pencil /></button><button aria-label="O‘chirish" onClick={() => removeTour(tour.id)}><Trash2 /></button></div></td></tr>)}
            </tbody></table>{filtered.length === 0 && <div className="empty-state">Mos tur topilmadi.</div>}</div>
          </section>
        </div>
      </main>

      {showForm && <div className="modal-backdrop" role="presentation"><div className="tour-modal" role="dialog" aria-modal="true" aria-labelledby="new-tour-title">
        <div className="modal-header"><div><span><PackagePlus /></span><div><h2 id="new-tour-title">Yangi tur joylashtirish</h2><p>Taklif ma’lumotlarini to‘ldiring</p></div></div><button onClick={() => setShowForm(false)} aria-label="Yopish"><X /></button></div>
        <form onSubmit={addTour}><label>Tur nomi<input name="name" required placeholder="Masalan, Istanbul klassik sayohati" /></label>
          <div className="form-grid"><label>Yo‘nalish<input name="place" required placeholder="Shahar, mamlakat" /></label><label>Boshlanish<input name="starts_at" type="date" required /></label><label>Tugash<input name="ends_at" type="date" required /></label></div>
          <label>Bir kishi uchun narx (UZS)<input name="price" required inputMode="numeric" placeholder="6 890 000" /></label><label>Qisqacha tavsif<textarea name="description" rows={3} placeholder="Turga nimalar kirishini yozing..." /></label>
          <div className="modal-actions"><button type="button" onClick={() => setShowForm(false)}>Bekor qilish</button><button className="primary-action" type="submit">Moderatsiyaga yuborish <Plane /></button></div>
        </form></div></div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><PartnerPanel /></React.StrictMode>);
