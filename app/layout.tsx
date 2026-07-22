import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

// Memuat font Be Vietnam Pro dari Google Fonts
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], // Mengambil berbagai ketebalan font
  variable: '--font-sans',
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
      {/* Menerapkan font ke seluruh body */}
      <body className={`${beVietnamPro.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}