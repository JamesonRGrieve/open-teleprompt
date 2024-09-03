import { NextRequest, NextResponse } from 'next/server';
import verifyJWT from './AuthProvider';
import jwt from 'jsonwebtoken';
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(verifyJWT(request));
  } catch (error) {
    console.error('Error verifying JWT:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: `Invalid token: ${error.message}` }, { status: 401 });
    }
    return NextResponse.json({ error: `Error validating token: ${error.message}` }, { status: 401 });
  }
}
