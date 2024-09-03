import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  sub: string;
}

export async function GET(request: NextRequest) {
  try {
    // Extract the authorization header
    const authToken = request.headers.get('authorization').replaceAll('Bearer ', '');

    if (!authToken) {
      return NextResponse.json({ error: 'Missing authorization header.' }, { status: 401 });
    }

    // Verify the JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not set in environment variables');
    }

    const decoded = jwt.verify(authToken, jwtSecret) as JwtPayload;

    // Fetch user information from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        // Add any other fields you want to return
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user information
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error verifying JWT:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
