import Link from 'next/link';

const features = [
  { title: 'PDF Birleştirme', desc: 'Birden fazla PDF dosyasını tek dosyada birleştirin.', href: '/merge', color: 'bg-blue-500', icon: '📑' },
  { title: 'PDF Ayırma', desc: 'PDF dosyalarını sayfa aralıklarına göre ayırın.', href: '/split', color: 'bg-green-500', icon: '✂️' },
  { title: 'Format Dönüştürme', desc: 'Word, Excel, TXT, görsel dosyalarını PDF\'e dönüştürün.', href: '/convert', color: 'bg-cyan-500', icon: '🔄' },
  { title: 'OCR Tanıma', desc: 'Görsellerden ve taranmış PDF\'lerden metin çıkarın.', href: '/ocr', color: 'bg-amber-500', icon: '👁️' },
  { title: 'PDF Sıkıştırma', desc: 'PDF dosya boyutunu küçültün.', href: '/compress', color: 'bg-slate-600', icon: '🗜️' },
  { title: 'Görsel Çıkarma', desc: 'PDF içindeki resimleri ayrı ayrı indirin.', href: '/extract-images', color: 'bg-red-500', icon: '🖼️' },
  { title: 'Metin Çıkarma', desc: 'PDF\'lerden metin tabanlı içerik çıkarın.', href: '/extract-text', color: 'bg-slate-800', icon: '📝' },
  { title: 'Sayfa İşlemleri', desc: 'Sayfa silme ve yeniden sıralama.', href: '/page-operations', color: 'bg-violet-600', icon: '📄' },
  { title: 'Şifreleme', desc: 'PDF\'e şifre ekleyin veya kaldırın.', href: '/password', color: 'bg-indigo-600', icon: '🔒' },
  { title: 'Filigran', desc: 'PDF\'lere metin veya görsel filigran ekleyin.', href: '/watermark', color: 'bg-teal-500', icon: '💧' },
  { title: 'PDF\'den Görsel', desc: 'PDF sayfalarını JPG/PNG formatına dönüştürün.', href: '/pdf-to-images', color: 'bg-orange-500', icon: '🖼️' },
];

export default function Home() {
  return (
    <>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">📄 PDF İşleme Merkezi</h1>
        <p className="text-slate-600 text-lg">Tüm PDF işlemleriniz için profesyonel çözümler</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="block p-6 bg-white rounded-xl shadow hover:shadow-lg transition-shadow border border-slate-200"
          >
            <div className={`w-14 h-14 ${f.color} rounded-full flex items-center justify-center text-2xl mb-4`}>
              {f.icon}
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">{f.title}</h2>
            <p className="text-slate-600 text-sm">{f.desc}</p>
            <span className="inline-block mt-3 text-blue-600 font-medium text-sm">Başla →</span>
          </Link>
        ))}
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-3xl mb-2">🛡️</div>
          <h3 className="font-semibold text-slate-800">Güvenli</h3>
          <p className="text-slate-600 text-sm">Dosyalarınız güvenli işlenir ve otomatik silinir.</p>
        </div>
        <div>
          <div className="text-3xl mb-2">📱</div>
          <h3 className="font-semibold text-slate-800">Mobil Uyumlu</h3>
          <p className="text-slate-600 text-sm">Tüm cihazlarda çalışan responsive tasarım.</p>
        </div>
        <div>
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="font-semibold text-slate-800">Hızlı</h3>
          <p className="text-slate-600 text-sm">Hızlı işlem süreleri.</p>
        </div>
      </div>
    </>
  );
}
