import { Suspense } from 'react';
import { Toaster } from 'sonner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        {children}
      </Suspense>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}