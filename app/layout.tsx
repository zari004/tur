import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Triply — sayohatingiz shu yerdan boshlanadi',
  description: 'Tur paketlarini toping, solishtiring va ishonch bilan bron qiling.',
  metadataBase: new URL('https://triply-travel.exon-obunalar.chatgpt.site'),
  openGraph: {
    title: 'Triply — sayohatingiz shu yerdan boshlanadi',
    description: 'Tur paketlarini toping, solishtiring va ishonch bilan bron qiling.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Triply — sayohatingiz shu yerdan boshlanadi',
    description: 'Tur paketlarini toping, solishtiring va ishonch bilan bron qiling.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
