'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kayıt oluşturulamadı.');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Bağlantı hatası.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="mb-6 text-center">
        <Link href="/" className="text-blue-600 hover:underline">← Ana Sayfa</Link>
      </div>
      <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Kayıt Ol</h1>
        <p className="text-slate-600 text-sm mb-6">Yeni hesap oluşturun</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-slate-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="ornek@email.com"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Ad (isteğe bağlı)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Adınız"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Şifre (en az 6 karakter)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <p className="mt-4 text-center text-slate-600 text-sm">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Giriş yapın</Link>
        </p>
      </div>
    </div>
  );
}
