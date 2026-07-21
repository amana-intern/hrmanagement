import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from './components/Sidebar/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AMANA Solutions HR-OPS',
  description: 'Internal System AMANA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 flex`}>
        {/* Sidebar akan selalu ada di kiri */}
        <Sidebar />
        
        {/* Konten utama akan menyesuaikan halaman yang dibuka, digeser ke kanan */}
        <main className="ml-64 w-full p-8 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}