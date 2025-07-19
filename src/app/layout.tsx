import Header from '@/components/layout/Header';
import Providers from '@/components/layout/Providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SocialApp',
  description: 'A modern social platform built with Next.js and MongoDB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-[#F9FAFB]">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                {children}
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
