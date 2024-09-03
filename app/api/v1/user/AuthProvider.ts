import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

interface JwtPayload {
  sub: string;
}

const prisma = new PrismaClient();

export default async function verifyJWT(request) {
  // Extract the authorization header
  const authToken = request.headers.get('authorization').replaceAll('Bearer ', '');

  if (!authToken) {
    throw new Error('Missing authorization header.');
  }

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
    throw new Error('No user found matching the email in the JWT.');
  }

  // Return user information
  return user;
}
