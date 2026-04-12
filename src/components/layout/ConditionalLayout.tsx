'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import Cart from './Cart';
import PWAInstaller from '@/components/pwa/PWAInstaller';

/**
 * Renders Header, Footer, Cart, and PWAInstaller only on non-admin routes.
 * Admin pages have their own full-page layout and don't need the global nav/footer.
 */
export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    // Admin: no header, no footer, no padding-top — just render children
    return (
      <div className="min-h-screen bg-stone-50">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 pt-28">
        {children}
      </main>
      <Footer />
      <Cart />
      <PWAInstaller />
    </div>
  );
}
