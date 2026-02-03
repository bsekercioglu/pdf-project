import Link from 'next/link';

export default function ConvertPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><Link href="/" className="text-blue-600 hover:underline">← Ana Sayfa</Link></div>
      <h1 className="text-2xl font-bold text-cyan-600 mb-2">Format Dönüştürme</h1>
      <p className="text-slate-600 mb-6">Word, Excel, TXT ve görsel dosyalarını PDF'e dönüştürme özelliği bu sürümde henüz aktif değil. Diğer PDF işlemlerini kullanabilirsiniz.</p>
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-slate-700">
        <p className="text-sm">Desteklenen işlemler: PDF Birleştirme, Ayırma, Sıkıştırma, OCR, Görsel/Metin çıkarma, Sayfa işlemleri, Şifreleme, Filigran, PDF'den görsel.</p>
      </div>
    </div>
  );
}
