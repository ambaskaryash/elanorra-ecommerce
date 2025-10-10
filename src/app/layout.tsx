import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/components/providers/session-provider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Cart from '@/components/layout/Cart';
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Elanorraa Living - Luxury Home Decor & Lifestyle",
  description: "Transform your space with Elanorraa Living's curated collection of premium home decor, furniture, and lifestyle products. Elevate your everyday living.",
  keywords: "home decor, luxury furniture, lifestyle products, interior design, premium homeware, modern living",
  openGraph: {
    title: "Elanorraa Living - Luxury Home Decor & Lifestyle",
    description: "Transform your space with premium home decor and lifestyle products.",
    url: "https://Elanorraaliving.com",
    siteName: "Elanorraa Living",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elanorraa Living - Luxury Home Decor & Lifestyle",
    description: "Transform your space with premium home decor and lifestyle products.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.className} antialiased`}>
        <SessionProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Cart />
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
        </SessionProvider>
      </body>
    </html>
  );
}
