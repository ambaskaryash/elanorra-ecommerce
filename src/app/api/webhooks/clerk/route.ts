import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { syncUserFromClerk } from '@/lib/rbac';

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, primary_email_address_id } = evt.data;

    const email = email_addresses.find(e => e.id === primary_email_address_id)?.email_address 
      || email_addresses[0]?.email_address;

    if (!email) {
      return new Response('Error: No email found', { status: 400 });
    }

    try {
      // Use existing sync function if available or direct prisma call
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          firstName: first_name || '',
          lastName: last_name || '',
          image: image_url || null,
        },
        create: {
          clerkId: id,
          email,
          firstName: first_name || '',
          lastName: last_name || '',
          image: image_url || null,
          isAdmin: false, // Default to false
        },
      });
      
      console.log(`User ${id} synced successfully`);
    } catch (error) {
      console.error('Error syncing user:', error);
      return new Response('Error syncing user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (id) {
      try {
        await prisma.user.delete({
          where: { clerkId: id },
        });
        console.log(`User ${id} deleted successfully`);
      } catch (error) {
        console.error('Error deleting user:', error);
        // Don't return 500 here as user might already be deleted
      }
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
