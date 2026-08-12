import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import NumberInputGuard from './components/NumberInputGuard';
import './globals.css';

// Deklarasi font Be Vietnam Pro dengan penambahan style Italic
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
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
    <html lang="id" data-scroll-behavior="smooth">
      {/* Masukin variabel font-nya ke body, dan tambahin class font-sans */}
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        {/* Satu MotionConfig untuk seluruh app agar animasi Framer Motion konsisten */}
        <MotionConfig reducedMotion="never">
          <NumberInputGuard />
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}