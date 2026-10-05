'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Bell, CalendarDays, ChevronDown, CircleUserRound, Compass, Headphones, Heart, Hotel, MapPin, Menu, Plane, Search, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const packages = [
  { id: 1, city: 'Istanbul', country: 'Turkiya', title: 'Istanbul klassik sayohati', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=85', days: '6 kun / 5 tun', hotel: '4 yulduzli mehmonxona', price: '6 890 000', oldPrice: '7 450 000', rating: '4.9', reviews: '128', tag: 'Eng ko‘p tanlangan' },
  { id: 2, city: 'Dubai', country: 'BAA', title: 'Dubai city & beach', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85', days: '7 kun / 6 tun', hotel: '5 yulduzli mehmonxona', price: '9 240 000', oldPrice: '10 100 000', rating: '4.8', reviews: '96', tag: 'Chegirma 12%' },
  { id: 3, city: 'Antalya', country: 'Turkiya', title: 'Antalya all inclusive', image: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=1200&q=85', days: '8 kun / 7 tun', hotel: '5 yulduzli resort', price: '8 560 000', oldPrice: '9 200 000', rating: '4.9', reviews: '214', tag: 'Oilalar uchun' },
  { id: 4, city: 'Baku', country: 'Ozarbayjon', title: 'Baku weekend', image: 'https://images.unsplash.com/photo-1603072388139-5658532e2a17?auto=format&fit=crop&w=1200&q=85', days: '4 kun / 3 tun', hotel: '4 yulduzli mehmonxona', price: '4 980 000', oldPrice: '5 390 000', rating: '4.7', reviews: '74', tag: 'Qisqa sayohat' },
];

const destinations = [
  { name: 'Istanbul', info: 'Turkiya · 86 ta tur', image: packages[0].image },
  { name: 'Dubai', info: 'BAA · 54 ta tur', image: packages[1].image },
  { name: 'Antalya', info: 'Turkiya · 42 ta tur', image: packages[2].image },
  { name: 'Baku', info: 'Ozarbayjon · 31 ta tur', image: packages[3].image },
];

type SearchMode = 'Turlar' | 'Mehmonxonalar' | 'Aviachiptalar';

export default function Home() {
  const [mode, setMode] = useState<SearchMode>('Turlar');
  const [destination, setDestination] = useState('Istanbul, Turkiya');
  const [saved, setSaved] = useState<number[]>([]);
  const [notice, setNotice] = useState('');
  const ModeIcon = useMemo(() => (mode === 'Turlar' ? Compass : mode === 'Mehmonxonalar' ? Hotel : Plane), [mode]);

  function runSearch() {
    setNotice(`${destination} uchun eng yaxshi takliflar tayyor.`);
    document.getElementById('tours')?.scrollIntoView({ behavior: 'smooth' });
  }

  function toggleSaved(id: number) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <main>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#top" aria-label="Go2Trip bosh sahifa"><span className="brand-mark"><Plane aria-hidden="true" /></span><span>go2trip</span></a>
          <nav className="desktop-nav" aria-label="Asosiy navigatsiya"><a href="#tours">Turlar</a><a href="#destinations">Yo‘nalishlar</a><a href="#advantages">Afzalliklar</a><a href="#help">Yordam</a></nav>
          <div className="header-actions">
            <button className="language-button" type="button">UZ <ChevronDown /></button>
            <button className="icon-button" type="button" aria-label="Xabarnomalar"><Bell /></button>
            <Button className="login-button" onClick={() => { window.location.href = '/panel/'; }}><CircleUserRound /> Hamkor paneli</Button>
            <button className="mobile-menu" type="button" aria-label="Menyuni ochish"><Menu /></button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
        <div className="shell hero-content">
          <div className="eyebrow"><Sparkles /> Sayohatning oson yo‘li</div>
          <h1>Dunyoni <span>Go2Trip</span> bilan kashf eting</h1>
          <p>Eng yaxshi tur paketlarini bir joyda toping, solishtiring va ishonch bilan bron qiling.</p>
          <div className="search-panel" role="search">
            <div className="search-tabs" aria-label="Qidiruv turi">
              {(['Turlar', 'Mehmonxonalar', 'Aviachiptalar'] as SearchMode[]).map((item) => (
                <button className={mode === item ? 'active' : ''} key={item} onClick={() => setMode(item)} type="button">
                  {item === 'Turlar' ? <Compass /> : item === 'Mehmonxonalar' ? <Hotel /> : <Plane />}{item}
                </button>
              ))}
            </div>
            <div className="search-grid">
              <label className="search-field destination-field"><span>Qayerga?</span><div><MapPin /><input aria-label="Yo‘nalish" value={destination} onChange={(event) => setDestination(event.target.value)} /></div></label>
              <label className="search-field"><span>Jo‘nash sanasi</span><div><CalendarDays /><input aria-label="Jo‘nash sanasi" type="date" defaultValue="2026-10-18" /></div></label>
              <label className="search-field"><span>Sayohatchilar</span><div><Users /><select aria-label="Sayohatchilar"><option>2 katta</option><option>1 katta</option><option>2 katta, 1 bola</option></select><ChevronDown /></div></label>
              <Button className="search-button" onClick={runSearch}><Search /> Izlash</Button>
            </div>
            <div className="quick-links"><span>Tez qidiruv:</span><button onClick={() => setDestination('Dubai, BAA')}>Dubai</button><button onClick={() => setDestination('Antalya, Turkiya')}>Antalya</button><button onClick={() => setDestination('Istanbul, Turkiya')}>Istanbul</button></div>
          </div>
          <div className="trust-row"><span><ShieldCheck /> Tekshirilgan turfirmalar</span><span><Headphones /> 24/7 yordam</span><span><Star /> Haqiqiy sharhlar</span></div>
        </div>
      </section>

      <section className="section shell" id="destinations">
        <div className="section-heading"><div><span className="section-kicker">ILHOM OLING</span><h2>Mashhur yo‘nalishlar</h2><p>Sayohatchilar eng ko‘p tanlayotgan manzillar</p></div><a href="#tours">Barchasini ko‘rish <ArrowRight /></a></div>
        <div className="destination-grid">
          {destinations.map((item) => (
            <button className="destination-card" key={item.name} onClick={() => { setDestination(item.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <img src={item.image} alt={`${item.name} manzarasi`} /><span className="destination-overlay" /><span className="destination-copy"><strong>{item.name}</strong><small>{item.info}</small></span><span className="destination-arrow"><ArrowRight /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="section tours-section" id="tours">
        <div className="shell">
          <div className="section-heading"><div><span className="section-kicker coral">MAXSUS TAKLIFLAR</span><h2>Siz uchun tanlangan turlar</h2><p>Qulay narx va ishonchli turfirmalardan tayyor paketlar</p></div><div className="filter-pills"><button className="selected">Barchasi</button><button>Dengiz</button><button>Shahar</button><button>Oilaviy</button></div></div>
          {notice && <div className="search-notice"><ModeIcon /> {notice}</div>}
          <div className="tour-grid">
            {packages.map((tour) => (
              <article className="tour-card" key={tour.id}>
                <div className="tour-image-wrap"><img src={tour.image} alt={`${tour.city} uchun ${tour.title}`} /><span className="tour-tag">{tour.tag}</span><button className={`heart-button ${saved.includes(tour.id) ? 'saved' : ''}`} onClick={() => toggleSaved(tour.id)} aria-label={saved.includes(tour.id) ? 'Saqlanganlardan olib tashlash' : 'Saqlash'}><Heart /></button></div>
                <div className="tour-body"><div className="tour-location"><MapPin /> {tour.city}, {tour.country}</div><h3>{tour.title}</h3><div className="tour-meta"><span>{tour.days}</span><span>{tour.hotel}</span></div><div className="rating"><strong><Star /> {tour.rating}</strong><span>{tour.reviews} ta sharh</span></div><div className="tour-footer"><div><small>1 kishi uchun</small><del>{tour.oldPrice} so‘m</del><strong>{tour.price} <em>so‘m</em></strong></div><Button aria-label={`${tour.title}ni ko‘rish`}><ArrowRight /></Button></div></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell" id="advantages"><div className="benefit-banner"><div><span className="section-kicker">NIMA UCHUN GO2TRIP?</span><h2>Sayohatingiz uchun bitta ishonchli joy</h2></div><div className="benefit-list"><div><span><ShieldCheck /></span><p><strong>Xavfsiz bron</strong><small>Tekshirilgan seller va himoyalangan to‘lov</small></p></div><div><span><Sparkles /></span><p><strong>Eng yaxshi narx</strong><small>Takliflarni bir joyda solishtiring</small></p></div><div><span><Headphones /></span><p><strong>Doim yoningizda</strong><small>Safargacha va safar davomida yordam</small></p></div></div></div></section>

      <footer id="help"><div className="shell footer-inner"><div><a className="brand footer-brand" href="#top"><span className="brand-mark"><Plane /></span><span>go2trip</span></a><p>Safaringiz shu yerdan boshlanadi.</p></div><div><strong>Go2Trip</strong><a href="#destinations">Yo‘nalishlar</a><a href="#tours">Tur paketlari</a></div><div><strong>Yordam</strong><a href="#help">Savol-javoblar</a><a href="#help">Bog‘lanish</a></div><div><strong>Aloqa</strong><span>+998 71 200 00 00</span><span>hello@go2trip.uz</span></div></div><div className="shell footer-bottom"><span>© 2026 Go2Trip. Barcha huquqlar himoyalangan.</span><span>O‘zbekiston · UZS</span></div></footer>
    </main>
  );
}
