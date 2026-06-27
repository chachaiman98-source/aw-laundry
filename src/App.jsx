import { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';

// =============================================
// LAZY LOADING — komponen berat dimuat saat dibutuhkan
// =============================================
const ModalPesanan = lazy(() => import('./ModalPesanan'));

// CSR — Komponen yang hanya dirender di sisi client
function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tracking states
  const [trackingMode, setTrackingMode] = useState("invoice"); // invoice | hp | id
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingResults, setTrackingResults] = useState([]); // for HP (multiple)
  const [trackingError, setTrackingError] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Form states
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [layanan, setLayanan] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [nota, setNota] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false); // Lazy loading state

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true }); // passive: true = optimasi scroll
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // LAZY LOADING — preload background hero setelah halaman siap
  useEffect(() => {
    const img = new Image();
    img.src = '/src/assets/bg1.png';
    img.onload = () => setImgLoaded(true);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && !e.target.closest('.navbar-content')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // ========== TRACKING FUNCTIONS ==========
  const resetTracking = () => {
    setTrackingResult(null);
    setTrackingResults([]);
    setTrackingError("");
  };

  const cekStatusByInvoice = async () => {
    if (!trackingInput) { setTrackingError("Masukkan kode invoice terlebih dahulu"); return; }
    try {
      setTrackingLoading(true); resetTracking();
      const res = await fetch(`http://localhost:5000/tracking/${trackingInput}`);
      const data = await res.json();
      if (data.success) setTrackingResult(data.data);
      else setTrackingError("Data tidak ditemukan untuk kode invoice ini");
    } catch {
      setTrackingError("Server error (Pastikan backend berjalan)");
    } finally {
      setTrackingLoading(false);
    }
  };

  const cekStatusByHP = async () => {
    if (!trackingInput) { setTrackingError("Masukkan nomor HP terlebih dahulu"); return; }
    try {
      setTrackingLoading(true); resetTracking();
      const res = await fetch(`http://localhost:5000/tracking/hp/${trackingInput}`);
      const data = await res.json();
      if (data.success) setTrackingResults(data.data);
      else setTrackingError("Data tidak ditemukan untuk nomor HP ini");
    } catch {
      setTrackingError("Server error (Pastikan backend berjalan)");
    } finally {
      setTrackingLoading(false);
    }
  };

  const cekStatusByID = async () => {
    if (!trackingInput) { setTrackingError("Masukkan ID transaksi terlebih dahulu"); return; }
    try {
      setTrackingLoading(true); resetTracking();
      const res = await fetch(`http://localhost:5000/tracking/id/${trackingInput}`);
      const data = await res.json();
      if (data.success) setTrackingResult(data.data);
      else setTrackingError("Data tidak ditemukan untuk ID transaksi ini");
    } catch {
      setTrackingError("Server error (Pastikan backend berjalan)");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTracking = () => {
    if (trackingMode === "invoice") cekStatusByInvoice();
    else if (trackingMode === "hp") cekStatusByHP();
    else if (trackingMode === "id") cekStatusByID();
  };

  const getPlaceholder = () => {
    if (trackingMode === "invoice") return "Contoh: AW-001";
    if (trackingMode === "hp") return "Contoh: 087892008122";
    return "Contoh: 1";
  };

  const getInputType = () => {
    if (trackingMode === "id") return "number";
    return "text";
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("selesai") || s.includes("diambil")) return "#10b981";
    if (s.includes("proses") || s.includes("cuci")) return "#f59e0b";
    if (s.includes("antar") || s.includes("jemput")) return "#3b82f6";
    return "#6366f1";
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("selesai") || s.includes("diambil")) return "✅";
    if (s.includes("proses") || s.includes("cuci")) return "🔄";
    if (s.includes("antar")) return "🚚";
    if (s.includes("jemput")) return "📦";
    return "⏳";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ========== PESANAN FUNCTIONS ==========
  const generateNota = () => `AW-${Math.floor(100 + Math.random() * 900)}`;

  const kirimPesanan = async () => {
    if (!nama || !hp || !alamat || !layanan) { alert("Lengkapi semua data terlebih dahulu"); return; }
    const noNota = generateNota();
    try {
      const res = await fetch("http://localhost:5000/pesanan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota: noNota, nama, hp, alamat, layanan, status: "Menunggu Penjemputan", tanggal: new Date() })
      });
      const data = await res.json();
      if (data.success) {
        setNota(noNota);
        alert(`Pesanan berhasil dikirim!\n\nNomor Nota: ${noNota}`);
        setShowForm(false); setNama(""); setHp(""); setAlamat(""); setLayanan("");
      } else alert("Gagal mengirim pesanan");
    } catch (err) {
      console.error(err); alert("Server backend belum berjalan");
    }
  };

  const layananList = [
    { icon: "👕", nama: "Cuci Setrika", harga: "Rp 7.000", satuan: "/kg", desc: "Cuci bersih & setrika rapi" },
    { icon: "⚡", nama: "Laundry Express", harga: "Rp 12.000", satuan: "/kg", desc: "Selesai dalam 6 jam" },
    { icon: "👟", nama: "Cuci Sepatu", harga: "Rp 25.000", satuan: "/psg", desc: "Sepatu bersih seperti baru" },
    { icon: "✨", nama: "Cuci Selimut", harga: "Rp 20.000", satuan: "/pcs", desc: "Selimut wangi & lembut" },
    { icon: "🛏️", nama: "Cuci Sprei", harga: "Rp 15.000", satuan: "/pcs", desc: "Sprei bersih & harum" },
    { icon: "🧼", nama: "Cuci Karpet", harga: "Rp 30.000", satuan: "/m²", desc: "Karpet bersih & segar" },
  ];

  // Render single result card
  const renderResultCard = (data) => (
    <div className="tracking-result-card" key={data.nota || data.id}>
      <div className="result-header">
        <div className="result-status-badge" style={{ background: getStatusColor(data.status) }}>
          {getStatusIcon(data.status)} {data.status}
        </div>
        <span className="result-nota">#{data.nota}</span>
      </div>
      <div className="result-details">
        <div className="result-row">
          <span className="result-label">👤 Nama</span>
          <span className="result-value">{data.nama}</span>
        </div>
        <div className="result-row">
          <span className="result-label">📞 No. HP</span>
          <span className="result-value">{data.hp}</span>
        </div>
        <div className="result-row">
          <span className="result-label">🏠 Alamat</span>
          <span className="result-value">{data.alamat || "-"}</span>
        </div>
        <div className="result-row">
          <span className="result-label">👔 Layanan</span>
          <span className="result-value">{data.layanan}</span>
        </div>
        <div className="result-row">
          <span className="result-label">📅 Tanggal</span>
          <span className="result-value">{formatDate(data.tanggal)}</span>
        </div>
        {data.id && (
          <div className="result-row">
            <span className="result-label">🔢 ID Transaksi</span>
            <span className="result-value">{data.id}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app">
      {/* Floating WhatsApp */}
      <a href="https://wa.me/6287892008122" className="wa-float" target="_blank" rel="noopener noreferrer">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          width="30" alt="WA"
          loading="lazy" // LAZY LOADING — atribut native browser
        />
      </a>

      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-content">
          <div className="logo-container" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            {/* LAZY LOADING — logo dimuat dengan loading="lazy" */}
            <img
              src="/src/assets/logo-aw.png"
              alt="AW"
              className="app-logo"
              loading="lazy"
              decoding="async"
            />
            <div className="logo-wrapper">
              <span className="logo-text">AW LAUNDRY</span>
              <span className="logo-subtext"></span>
            </div>
          </div>

          {/* Hamburger button for mobile */}
          <button
            className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen); }}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <span onClick={() => scrollToSection('home')}>Home</span>
            <span onClick={() => scrollToSection('layanan')}>Layanan</span>
            <span onClick={() => scrollToSection('harga')}>Harga</span>
            <span onClick={() => scrollToSection('tracking')}>Tracking Laundry</span>
            <span onClick={() => scrollToSection('contact')}>Contact</span>
          </div>
          <div className="nav-contact">
            <span className="status-dot"></span>
            ONLINE
          </div>
        </div>
      </nav>

      {/* Hero Section — LAZY LOADING background image */}
      <header
        id="home"
        className={`hero ${imgLoaded ? 'hero-loaded' : 'hero-loading'}`}
        style={imgLoaded ? { backgroundImage: `url(/src/assets/bg1.png)` } : {}}
      >
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-tagline">#1 Trusted Laundry in Purwokerto</p>
          <h2>Baju Bersih,<br />Cepat & <span>Antar Jemput</span></h2>
          <p className="hero-desc">Solusi cuci praktis untuk mahasiswa & warga Dukuhwaluh. Baju rapi tanpa harus keluar rumah!</p>
          <div className="hero-buttons">
            <button className="btn-main" onClick={() => scrollToSection('layanan')}>
              Pesan Sekarang
            </button>
            <button className="btn-secondary" onClick={() => scrollToSection('tracking')}>
              📦 Lacak Pesanan
            </button>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="about-sec">
        <div className="about-content">
          <div className="about-text">
            <span className="section-badge">Tentang Kami</span>
            <h3 className="section-title-left">Mengapa Memilih <span style={{ color: 'var(--primary)' }}>AW Laundry</span>?</h3>
            <p className="about-desc">
              AW Laundry adalah layanan laundry profesional di Dukuhwaluh, Purwokerto yang mengutamakan kebersihan, kecepatan, dan kenyamanan pelanggan. Kami hadir untuk memudahkan hidup Anda!
            </p>
            <div className="about-features">
              <div className="about-feature-item">
                <div className="feature-icon-box">🧴</div>
                <div>
                  <h5>Deterjen Premium</h5>
                  <p>Menggunakan deterjen berkualitas tinggi yang aman untuk semua jenis kain</p>
                </div>
              </div>
              <div className="about-feature-item">
                <div className="feature-icon-box">⏰</div>
                <div>
                  <h5>Tepat Waktu</h5>
                  <p>Kami berkomitmen menyelesaikan cucian sesuai jadwal yang dijanjikan</p>
                </div>
              </div>
              <div className="about-feature-item">
                <div className="feature-icon-box">🚗</div>
                <div>
                  <h5>Antar Jemput Gratis</h5>
                  <p>Layanan antar jemput gratis untuk area Dukuhwaluh & sekitarnya</p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-stats">
            <div className="stat-card">
              <span className="stat-number">500+</span>
              <span className="stat-label">Pelanggan Puas</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">3+</span>
              <span className="stat-label">Tahun Pengalaman</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">6</span>
              <span className="stat-label">Jenis Layanan</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Order Online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Layanan Section — CSR render dari array */}
      <section id="layanan">
        <h3 className="section-title">Layanan Kami</h3>
        <div className="grid">
          {layananList.map((item) => (
            <div
              key={item.nama}
              className="card-service"
              onClick={() => { setLayanan(item.nama); setShowForm(true); }}
            >
              <div className="icon-box">{item.icon}</div>
              <h4>{item.nama}</h4>
              <p className="service-desc">{item.desc}</p>
              <p className="price">{item.harga} <span className="price-unit">{item.satuan}</span></p>
              <button className="btn-order-service">Pesan</button>
            </div>
          ))}
        </div>
      </section>

      {/* Harga Section */}
      <section id="harga" className="harga-sec">
        <span className="section-badge">Daftar Harga</span>
        <h3 className="section-title">Harga Transparan & Terjangkau</h3>
        <p className="section-subtitle">Tanpa biaya tersembunyi. Harga yang Anda lihat adalah harga yang Anda bayar.</p>
        <div className="harga-table-wrapper">
          <table className="harga-table">
            <thead>
              <tr>
                <th>Layanan</th>
                <th>Harga</th>
                <th>Estimasi</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="table-icon">👕</span> Cuci Setrika</td>
                <td className="table-price">Rp 7.000/kg</td>
                <td>2-3 Hari</td>
                <td>Cuci + setrika rapi</td>
              </tr>
              <tr className="table-highlight">
                <td><span className="table-icon">⚡</span> Laundry Express</td>
                <td className="table-price">Rp 12.000/kg</td>
                <td>6 Jam</td>
                <td>Prioritas utama ⭐</td>
              </tr>
              <tr>
                <td><span className="table-icon">👟</span> Cuci Sepatu</td>
                <td className="table-price">Rp 25.000/psg</td>
                <td>2-3 Hari</td>
                <td>Deep clean + deodorize</td>
              </tr>
              <tr>
                <td><span className="table-icon">✨</span> Cuci Selimut</td>
                <td className="table-price">Rp 20.000/pcs</td>
                <td>2-3 Hari</td>
                <td>Termasuk pewangi</td>
              </tr>
              <tr>
                <td><span className="table-icon">🛏️</span> Cuci Sprei</td>
                <td className="table-price">Rp 15.000/pcs</td>
                <td>2-3 Hari</td>
                <td>Bersih & harum</td>
              </tr>
              <tr>
                <td><span className="table-icon">🧼</span> Cuci Karpet</td>
                <td className="table-price">Rp 30.000/m²</td>
                <td>3-5 Hari</td>
                <td>Vacuum + cuci basah</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="harga-note">* Harga dapat berubah sewaktu-waktu. Minimal order 2 kg untuk layanan kiloan.</p>
      </section>

      {/* Promo Box */}
      <section className="promo-box">
        <small style={{ fontWeight: '700', letterSpacing: '2px' }}>SPECIAL PROMO</small>
        <h3 style={{ fontSize: '2rem', margin: '15px 0' }}>Cuci 5kg, Gratis 1kg!</h3>
        <p style={{ opacity: 0.9 }}>Berlaku setiap hari Jumat. Khusus Laundry Kiloan area Purwokerto.</p>
      </section>

      {/* Cara Kerja Section */}
      <section id="cara-kerja">
        <h3 className="section-title">Cara Kerja Kami</h3>
        <div className="steps-container">
          {[
            { num: 1, title: "Order Online", desc: "Hubungi kami via WhatsApp atau Web.", icon: "📱" },
            { num: 2, title: "Kami Jemput", desc: "Kurir akan menjemput cucian ke lokasimu.", icon: "🚗" },
            { num: 3, title: "Proses Cuci", desc: "Pakaian dicuci higienis & disetrika rapi.", icon: "🧺" },
            { num: 4, title: "Antar Kembali", desc: "Cucian wangi siap antar ke depan pintu.", icon: "📦" },
          ].map((step) => (
            <div key={step.num} className="step-item">
              <div className="step-num">{step.num}</div>
              <div>
                <h5 style={{ fontWeight: '700' }}>{step.title}</h5>
                <p style={{ fontSize: '13px', color: '#64748b' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== TRACKING LAUNDRY SECTION ========== */}
      <section id="tracking" className="tracking-sec">
        <span className="section-badge">Lacak Pesanan</span>
        <h3 className="section-title">Tracking Laundry</h3>
        <p className="section-subtitle">Cek status cucian Anda secara real-time dengan 3 cara mudah</p>

        <div className="tracking-card">
          {/* Tracking Mode Tabs */}
          <div className="tracking-tabs">
            <button
              className={`tracking-tab ${trackingMode === 'invoice' ? 'active' : ''}`}
              onClick={() => { setTrackingMode('invoice'); setTrackingInput(''); resetTracking(); }}
            >
              <span className="tab-icon">🧾</span>
              <span className="tab-text">Kode Invoice</span>
            </button>
            <button
              className={`tracking-tab ${trackingMode === 'hp' ? 'active' : ''}`}
              onClick={() => { setTrackingMode('hp'); setTrackingInput(''); resetTracking(); }}
            >
              <span className="tab-icon">📱</span>
              <span className="tab-text">Nomor HP</span>
            </button>
            <button
              className={`tracking-tab ${trackingMode === 'id' ? 'active' : ''}`}
              onClick={() => { setTrackingMode('id'); setTrackingInput(''); resetTracking(); }}
            >
              <span className="tab-icon">🔢</span>
              <span className="tab-text">ID Transaksi</span>
            </button>
          </div>

          {/* Tracking Input */}
          <div className="tracking-input-area">
            <p className="tracking-label">
              {trackingMode === 'invoice' && '🧾 Masukkan Kode Invoice / Nota Anda'}
              {trackingMode === 'hp' && '📱 Masukkan Nomor HP yang Terdaftar'}
              {trackingMode === 'id' && '🔢 Masukkan ID Transaksi Anda'}
            </p>
            <div className="input-group">
              <input
                type={getInputType()}
                placeholder={getPlaceholder()}
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTracking()}
              />
              <button
                className="btn-cek"
                onClick={handleTracking}
                disabled={trackingLoading}
              >
                {trackingLoading ? (
                  <span className="btn-loading">⏳ Mencari...</span>
                ) : (
                  'Cek Status'
                )}
              </button>
            </div>
          </div>

          {/* Tracking Results */}
          {trackingResult && (
            <div className="tracking-results">
              <h4 className="results-title">📋 Hasil Pencarian</h4>
              {renderResultCard(trackingResult)}
            </div>
          )}

          {trackingResults.length > 0 && (
            <div className="tracking-results">
              <h4 className="results-title">📋 Ditemukan {trackingResults.length} pesanan</h4>
              {trackingResults.map((item) => renderResultCard(item))}
            </div>
          )}

          {trackingError && (
            <div className="tracking-error">
              <span className="error-icon">⚠️</span>
              <p>{trackingError}</p>
            </div>
          )}

          {nota && (
            <div className="nota-box">
              <p><b>📌 No Nota Terakhir Anda:</b> {nota}</p>
              <small>Simpan nomor ini untuk cek status cucian</small>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-sec">
        <span className="section-badge">Hubungi Kami</span>
        <h3 className="section-title">Butuh Bantuan?</h3>
        <p className="section-subtitle">Kami siap melayani Anda kapan saja</p>
        <div className="contact-cards">
          <div className="contact-card">
            <div className="contact-icon-box">📍</div>
            <h4>Alamat</h4>
            <p>Jl. Raya Dukuhwaluh No.10,<br />Purwokerto Timur</p>
          </div>
          <div className="contact-card">
            <div className="contact-icon-box">📞</div>
            <h4>Telepon</h4>
            <p>0878-9200-8122</p>
            <a href="tel:087892008122" className="contact-link">Hubungi Sekarang →</a>
          </div>
          <div className="contact-card">
            <div className="contact-icon-box">💬</div>
            <h4>WhatsApp</h4>
            <p>Chat langsung dengan kami</p>
            <a href="https://wa.me/6287892008122" target="_blank" rel="noopener noreferrer" className="contact-link">Chat via WA →</a>
          </div>
          <div className="contact-card">
            <div className="contact-icon-box">⏰</div>
            <h4>Jam Operasional</h4>
            <p>Senin - Minggu<br />07.00 - 21.00 WIB</p>
          </div>
        </div>
      </section>

      {/* Modal Form — LAZY LOADING dengan Suspense */}
      {showForm && (
        <Suspense fallback={
          <div className="modal-overlay">
            <div className="modal-box" style={{ textAlign: 'center', padding: '40px' }}>
              <p>⏳ Memuat form...</p>
            </div>
          </div>
        }>
          <ModalPesanan
            layanan={layanan} setLayanan={setLayanan}
            nama={nama} setNama={setNama}
            hp={hp} setHp={setHp}
            alamat={alamat} setAlamat={setAlamat}
            onKirim={kirimPesanan}
            onTutup={() => setShowForm(false)}
          />
        </Suspense>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-container">
              <img src="/src/assets/logo-aw.png" alt="AW" className="app-logo" loading="lazy" decoding="async" />
              <div className="logo-wrapper">
                <span className="logo-text">AW LAUNDRY</span>
                <span className="logo-subtext">Premium Service</span>
              </div>
            </div>
            <p className="footer-desc">Solusi laundry modern dan terpercaya di Dukuhwaluh. Kami menjaga kebersihan pakaian Anda seperti milik sendiri.</p>
          </div>
          <div className="footer-links">
            <h4>Navigasi</h4>
            <ul>
              <li onClick={() => scrollToSection('home')}>Home</li>
              <li onClick={() => scrollToSection('layanan')}>Layanan</li>
              <li onClick={() => scrollToSection('harga')}>Harga</li>
              <li onClick={() => scrollToSection('tracking')}>Tracking Laundry</li>
              <li onClick={() => scrollToSection('contact')}>Contact</li>
            </ul>
          </div>
          <div className="footer-contact">
            <h4>Hubungi Kami</h4>
            <p>📍 Jl. Raya Dukuhwaluh No.10, Purwokerto Timur</p>
            <p>📞 0878-9200-8122</p>
            <p>⏰ Senin - Minggu (07.00 - 21.00)</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 <b>AW LAUNDRY PROFESSIONAL</b>. Dibuat dengan ❤️ untuk Purwokerto.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
