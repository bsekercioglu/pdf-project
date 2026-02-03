'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4">
      <Link href="/" className="hover:bg-blue-500 px-3 py-1 rounded">
        Ana Sayfa
      </Link>
      <Link href="/my-files" className="hover:bg-blue-500 px-3 py-1 rounded">
        Benim Dosyalarım
      </Link>
      {user && (
        <>
          <span className="text-blue-100 text-sm truncate max-w-[180px]" title={user.email}>
            {user.name || user.email}
          </span>
          <button
            type="button"
            onClick={logout}
            className="hover:bg-blue-500 px-3 py-1 rounded text-sm"
          >
            Çıkış
          </button>
        </>
      )}
    </div>
  );
}
