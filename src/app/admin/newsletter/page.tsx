import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import NewsletterDashboard from '@/components/admin/NewsletterDashboard';

export default async function NewsletterAdminPage() {
  const { userId } = await auth();

  // Check if user is authenticated
  if (!userId) {
    redirect('/sign-in');
  }

  // For now, we'll implement admin check later
  // TODO: Implement proper admin role checking with Clerk

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