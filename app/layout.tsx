import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import UserNav from '@/components/UserNav';

export const metadata: Metadata = {
  title: 'PDF İşleme Merkezi',
  description: 'Tüm PDF işlemleriniz için profesyonel çözümler',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        <nav className="bg-blue-600 text-white shadow">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <span className="text-2xl">📄</span>
              PDF İşleme Merkezi
            </Link>
            <UserNav />
          </div>
        </nav>
        <main className="container mx-auto px-4 py-6">{children}</main>
        <footer className="bg-slate-200 text-center py-4 mt-8 text-slate-600 text-sm">
          PDF İşleme Merkezi — Tüm PDF işlemleriniz için tek adres
        </footer>
      </body>
    </html>
  );
}
