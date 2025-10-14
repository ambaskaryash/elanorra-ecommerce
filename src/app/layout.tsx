import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/components/providers/session-provider';
import { AuthProvider } from '@/lib/contexts/auth-context';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Cart from '@/components/layout/Cart';
import { ThemeProvider } from '@/components/providers/theme-provider';
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://elanorraliving.in'),
  title: "ElanorraLiving - Luxury Home Decor & Lifestyle",
  description: "Transform your space with ElanorraLiving's curated collection of premium home decor, furniture, and lifestyle products. Elevate your everyday living.",
  keywords: "home decor, luxury furniture, lifestyle products, interior design, premium homeware, modern living",
  openGraph: {
    title: "ElanorraLiving - Luxury Home Decor & Lifestyle",
    description: "Transform your space with premium home decor and lifestyle products.",
    url: "https://elanorraliving.in",
    siteName: "ElanorraLiving",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ElanorraLiving - Luxury Home Decor & Lifestyle",
    description: "Transform your space with premium home decor and lifestyle products.",
  },
  alternates: {
    canonical: 'https://elanorraliving.in',
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.className} antialiased`}>
        <SessionProvider>
          <AuthProvider>
            <ThemeProvider>
              <Header />
              <main className="min-h-screen">
                <Suspense fallback={null}>
                  {children}
                </Suspense>
              </main>
              <Footer />
              <Cart />
            </ThemeProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10B981',
                    color: '#fff',
                  },
                },
                error: {
                  style: {
                    background: '#EF4444',
                    color: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
