import Cart from '@/components/layout/Cart';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import PWAInstaller from '@/components/pwa/PWAInstaller';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';
import { AuthProvider } from '@/lib/contexts/auth-context';
import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'sonner';
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://elanorraliving.in'),
  title: "ElanorraLiving - Luxury Home Decor & Lifestyle",
  description: "Transform your space with ElanorraLiving's curated collection of premium home decor, furniture, and lifestyle products. Elevate your everyday living.",
  keywords: "home decor, luxury furniture, lifestyle products, interior design, premium homeware, modern living, tableware, stationery, gift sets",
  authors: [{ name: "ElanorraLiving Team" }],
  creator: "ElanorraLiving",
  publisher: "ElanorraLiving",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "ElanorraLiving - Luxury Home Decor & Lifestyle",
    description: "Transform your space with premium home decor and lifestyle products.",
    url: "https://elanorraliving.in",
    siteName: "ElanorraLiving",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: '/icon.svg',
        width: 32,
        height: 32,
        alt: 'ElanorraLiving Logo',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElanorraLiving - Luxury Home Decor & Lifestyle",
    description: "Transform your space with premium home decor and lifestyle products.",
    creator: "@elanorraliving",
    images: ['/icon.svg'],
  },
  alternates: {
    canonical: 'https://elanorraliving.in',
  },
  category: 'shopping',
  classification: 'Home Decor & Lifestyle E-commerce',
  other: {
    'theme-color': '#f43f5e',
    'color-scheme': 'light',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'ElanorraLiving',
    'application-name': 'ElanorraLiving',
    'msapplication-TileColor': '#f43f5e',
    'msapplication-config': '/browserconfig.xml',
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
              <PWAInstaller />
            </ThemeProvider>
            <Toaster richColors position="bottom-right" />
            <>
              {children}
              <ToastContainer />
            </>
          </AuthProvider>
        </SessionProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}