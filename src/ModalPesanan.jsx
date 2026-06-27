// LAZY LOADING — komponen ini hanya dimuat saat user klik layanan
function ModalPesanan({ layanan, setLayanan, nama, setNama, hp, setHp, alamat, setAlamat, onKirim, onTutup }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Form Pemesanan</h3>
        <input type="text" placeholder="Nama Lengkap" value={nama} onChange={(e) => setNama(e.target.value)} />
        <input type="text" placeholder="No. HP" value={hp} onChange={(e) => setHp(e.target.value)} />
        <select value={layanan} onChange={(e) => setLayanan(e.target.value)}>
          <option value="">Pilih Layanan</option>
          <option>Cuci Setrika</option>
          <option>Laundry Express</option>
          <option>Cuci Sepatu</option>
          <option>Cuci Selimut</option>
          <option>Cuci Sprei</option>
          <option>Cuci Karpet</option>
        </select>
        <input type="text" placeholder="Alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
        <div className="modal-actions">
          <button className="btn-submit" onClick={onKirim}>Kirim Pesanan</button>
          <button className="btn-close" onClick={onTutup}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

export default ModalPesanan;
