import { NextRequest, NextResponse } from 'next/server';
import GoogleOAuth from './GoogleOAuth';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    const redirectUri = process.env.REDIRECT_URI || '';

    const auth = new GoogleOAuth();
    const result = await auth.handleCallback(code, redirectUri);

    return NextResponse.json({
      detail: result.magic_link,
      email: result.email,
      token: result.token,
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
