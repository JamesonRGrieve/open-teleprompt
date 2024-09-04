import { NextRequest, NextResponse } from 'next/server';
import { GoogleOAuth } from '../../GoogleConnector';
import verifyJWT from '../../../user/AuthProvider';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyJWT(request);

    const google = new GoogleOAuth();

    const docs = await google.listUserDocuments(user.email);

    //console.log(docs);

    return NextResponse.json(docs);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
