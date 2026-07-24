import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

// Deklarasi font Be Vietnam Pro untuk Sistem Tipografi AMANA
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  // 300 = H1 (Light)
  // 400 = B1 (Regular)
  // 600 = H2, B2, F (Semibold)
  weight: ['300', '400', '600'], 
  // 'italic' wajib untuk mendukung H2
  style: ['normal', 'italic'],   
  variable: '--font-be-vietnam',
});

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
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}