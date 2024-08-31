import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface UserInfo {
  email: string;
  given_name: string;
  family_name: string;
}

export class GoogleOAuth {
  private clientId: string;
  private clientSecret: string;
  private jwtSecret: string;
  private magicLinkUrl: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.jwtSecret = process.env.JWT_SECRET || '';
    this.magicLinkUrl = process.env.OAUTH_REDIRECT_URI || '';
  }

  private async getTokens(code: string, redirectUri: string) {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    return response.data;
  }

  private async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  private generateJWT(userId: string): string {
    return jwt.sign({ sub: userId }, this.jwtSecret, { expiresIn: '1d' });
  }

  private generateMagicLink(token: string): string {
    return `${this.magicLinkUrl}?token=${encodeURIComponent(token)}`;
  }

  async handleCallback(code: string, redirectUri: string) {
    const { access_token, refresh_token } = await this.getTokens(code, redirectUri);
    const userInfo = await this.getUserInfo(access_token);

    let user = await prisma.user.findUnique({ where: { email: userInfo.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
        },
      });
    }

    await prisma.userOAuth.upsert({
      where: { userId: user.id },
      update: { accessToken: access_token, refreshToken: refresh_token },
      create: {
        userId: user.id,
        providerId: 'google',
        accessToken: access_token,
        refreshToken: refresh_token,
      },
    });

    const token = this.generateJWT(user.id);
    const magic_link = this.generateMagicLink(token);

    return {
      magic_link,
      email: user.email,
      token,
    };
  }
}
