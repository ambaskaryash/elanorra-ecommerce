import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NewsletterDashboard from '@/components/admin/NewsletterDashboard';

export default async function NewsletterAdminPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is an admin
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // For now, we'll check if the user email matches admin criteria
  // You can modify this logic based on your admin user setup
  const isAdmin = session.user.email === 'admin@elanorra.com' || 
                  session.user.email?.endsWith('@elanorra.com');

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div>
      <NewsletterDashboard />
    </div>
  );
}

export const metadata = {
  title: 'Newsletter Dashboard - ElanorraLiving Admin',
  description: 'Manage newsletter subscribers and campaigns for ElanorraLiving Community',
};