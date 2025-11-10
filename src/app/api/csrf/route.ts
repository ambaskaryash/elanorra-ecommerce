import { NextRequest } from 'next/server';
import { generateCSRFTokenResponse } from '@/lib/csrf';

// Ensure Node runtime and dynamic handling to avoid build-time data collection
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/csrf - Generate a new CSRF token
export async function GET(request: NextRequest) {
  return generateCSRFTokenResponse(request);
}