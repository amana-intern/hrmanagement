import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

// Deklarasi font Be Vietnam Pro dengan penambahan style Italic
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '600'], // Light (300), Regular (400), Semibold (600)
  style: ['normal', 'italic'],   // Wajib ditambahin agar H2 (Semibold Italic) bisa jalan
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
      {/* Masukin variabel font-nya ke body, dan tambahin class font-sans */}
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}