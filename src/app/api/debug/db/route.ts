import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ok = await connectToDatabase();
    return NextResponse.json({
      ok,
      envHasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || 'unknown',
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
        envHasDatabaseUrl: !!process.env.DATABASE_URL,
      },
      { status: 500 }
    );
  }
}