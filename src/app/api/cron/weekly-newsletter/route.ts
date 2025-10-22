import { NextRequest, NextResponse } from 'next/server';
import { triggerWeeklyNewsletter } from '@/lib/cron';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Triggering weekly newsletter cron job...');
    
    const success = await triggerWeeklyNewsletter();
    
    if (success) {
      return NextResponse.json({
        message: 'Weekly newsletter triggered successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        message: 'Weekly newsletter was not sent (may have already been sent this week)',
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('Error in weekly newsletter cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger weekly newsletter',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    message: 'Weekly newsletter cron endpoint is active',
    timestamp: new Date().toISOString(),
  });
}