import { NextRequest, NextResponse } from 'next/server';
import { GoogleOAuth } from '../GoogleConnector';
import verifyJWT from '../../user/AuthProvider';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyJWT(request);

    const google = new GoogleOAuth();

    const documentBody = await google.getUserDocumentMarkdown(user.email, request.nextUrl.searchParams.get('id'));

    //console.log(documentBody);

    return NextResponse.json(documentBody);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
