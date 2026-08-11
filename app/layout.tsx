import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { MotionConfig } from 'framer-motion';
import './globals.css';

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
    <html lang="id">
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        {/* Defers to the OS "reduce motion" accessibility setting for every Framer Motion
            animation in the app, instead of forcing motion on or off globally. */}
        <MotionConfig reducedMotion="never">{children}</MotionConfig>
      </body>
    </html>
  );
}