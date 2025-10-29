import { NextRequest } from 'next/server';
import { generateCSRFTokenResponse } from '@/lib/csrf';

// GET /api/csrf - Generate a new CSRF token
export async function GET(request: NextRequest) {
  return generateCSRFTokenResponse(request);
}