import { NextRequest, NextResponse } from 'next/server';
import MagicalAuth from './MagicalAuth'; // Adjust the import path as needed

export async function POST(request: NextRequest) {
  const provider = request.nextUrl.pathname.split('/').pop()?.toLowerCase();

  if (!provider) {
    return NextResponse.json({ error: 'Provider not specified' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const auth = new MagicalAuth();

    const magic_link = auth.sso({
      provider,
      code: data.code,
      ip_address: request.ip,
      referrer: data.referrer || process.env.MAGIC_LINK_URL,
    });

    return NextResponse.json({
      detail: magic_link,
      email: auth.email,
      token: auth.token,
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
