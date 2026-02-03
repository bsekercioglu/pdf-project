'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Giriş yapılamadı.');
        setLoading(false);
        return;
      }
      router.push(redirect);
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
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Giriş Yap</h1>
        <p className="text-slate-600 text-sm mb-6">Hesabınıza giriş yapın</p>
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
            <label className="block font-medium text-slate-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <p className="mt-4 text-center text-slate-600 text-sm">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">Kayıt olun</Link>
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="mb-6 text-center">
        <Link href="/" className="text-blue-600 hover:underline">← Ana Sayfa</Link>
      </div>
      <div className="bg-white p-8 rounded-xl shadow border border-slate-200 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-2/3 mb-6" />
        <div className="h-10 bg-slate-100 rounded mb-4" />
        <div className="h-10 bg-slate-100 rounded mb-4" />
        <div className="h-10 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
