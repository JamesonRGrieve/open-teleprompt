import { NextResponse, NextRequest } from 'next/server';
import { useNextAPIBypass, useSocketIOBypass, useJWTQueryParam, useOAuth2, useAuth } from 'jrgcomponents/Middleware/Hooks';

export default async function Middleware(req: NextRequest): Promise<NextResponse> {
  const hooks = [useNextAPIBypass, useSocketIOBypass, useOAuth2, useJWTQueryParam, useAuth];
  for (const hook of hooks) {
    const hookResult = await hook(req);
    if (hookResult.activated) {
      return hookResult.response;
    }
  }
  return NextResponse.next();
}
