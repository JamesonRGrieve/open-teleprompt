import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import sgMail from '@sendgrid/mail';
import { totp } from 'otplib';
import axios from 'axios';

// Assume these are defined elsewhere in your project
import { User, FailedLogin, UserOAuth, OAuthProvider } from './models';
import { prisma } from './prismaClient';
import { getSsoProvider } from './OAuth2Providers';

interface LoginData {
  email: string;
  token: string;
}

interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
}

class MagicalAuth {
  private link: string;
  private encryptionKey: string;
  public token: string | null;
  public email: string | null;

  constructor(token: string | null = null) {
    const encryptionKey = process.env.ENCRYPTION_SECRET || '';
    this.link = process.env.MAGIC_LINK_URL || '';
    this.encryptionKey = `${encryptionKey}${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    this.token = token ? decodeURIComponent(token).replace(/^(Bearer\s|bearer\s)/, '') : null;
    this.email = null;

    if (this.token) {
      try {
        const decoded = jwt.verify(this.token, this.encryptionKey) as { email: string };
        this.email = decoded.email;
      } catch {
        this.email = null;
        this.token = null;
      }
    }
  }

  async userExists(email: string): Promise<boolean> {
    this.email = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: this.email } });
    if (!user) {
      throw new Error('User not found');
    }
    return true;
  }

  async addFailedLogin(ipAddress: string): Promise<void> {
    if (this.email) {
      const user = await prisma.user.findUnique({ where: { email: this.email } });
      if (user) {
        await prisma.failedLogin.create({
          data: {
            userId: user.id,
            ipAddress,
          },
        });
      }
    }
  }

  async countFailedLogins(): Promise<number> {
    if (!this.email) return 0;
    const user = await prisma.user.findUnique({ where: { email: this.email } });
    if (!user) return 0;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedLogins = await prisma.failedLogin.count({
      where: {
        userId: user.id,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });
    return failedLogins;
  }

  async sendMagicLink(
    ipAddress: string,
    login: LoginData,
    referrer: string | null = null,
    sendLink: boolean = true,
  ): Promise<string> {
    this.email = login.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: this.email } });
    if (!user) {
      throw new Error('User not found');
    }
    if (!totp.verify({ token: login.token, secret: user.mfaToken })) {
      await this.addFailedLogin(ipAddress);
      throw new Error('Invalid MFA token. Please try again.');
    }
    this.token = jwt.sign(
      {
        sub: user.id,
        email: this.email,
        admin: user.admin,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      },
      this.encryptionKey,
    );
    const encodedToken = encodeURIComponent(this.token);
    if (referrer) {
      this.link = referrer;
    }
    const magicLink = `${this.link}?token=${encodedToken}`;
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL && sendLink) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: this.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Magic Link',
        html: `<a href='${magicLink}'>Click here to log in</a>`,
      };
      await sgMail.send(msg);
      return `A login link has been sent to ${this.email}, please check your email and click the link to log in. The link will expire in 24 hours.`;
    } else {
      return magicLink;
    }
  }

  async login(ipAddress: string): Promise<User> {
    const failures = await this.countFailedLogins();
    if (failures >= 50) {
      throw new Error('Too many failed login attempts today. Please try again tomorrow.');
    }
    try {
      const userInfo = jwt.verify(this.token!, this.encryptionKey) as { sub: string };
      const user = await prisma.user.findUnique({ where: { id: userInfo.sub } });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch {
      await this.addFailedLogin(ipAddress);
      throw new Error('Invalid login token. Please log out and try again.');
    }
  }

  async register(newUser: RegisterData): Promise<string> {
    newUser.email = newUser.email.toLowerCase();
    this.email = newUser.email;
    const allowedDomains = process.env.ALLOWED_DOMAINS;
    if (allowedDomains && allowedDomains !== '*') {
      const domain = this.email.split('@')[1];
      if (!allowedDomains.split(',').includes(domain)) {
        throw new Error('Registration is not allowed for this domain.');
      }
    }
    const existingUser = await prisma.user.findUnique({ where: { email: this.email } });
    if (existingUser) {
      throw new Error('User already exists with this email.');
    }
    const mfaToken = totp.generateSecret();
    const user = await prisma.user.create({
      data: {
        ...newUser,
        mfaToken,
        id: uuidv4(),
      },
    });
    const registrationWebhook = process.env.REGISTRATION_WEBHOOK;
    if (registrationWebhook) {
      try {
        await axios.post(
          registrationWebhook,
          { email: this.email },
          { headers: { Authorization: process.env.ENCRYPTION_SECRET } },
        );
      } catch (error) {
        console.error('Failed to send registration webhook:', error);
      }
    }
    return mfaToken;
  }

  async updateUser(data: Partial<User>): Promise<string> {
    const user = await this.verifyApiKey();
    if (!user) {
      throw new Error('User not found');
    }
    await prisma.user.update({
      where: { id: user.id },
      data,
    });
    return 'User updated successfully';
  }

  async deleteUser(): Promise<string> {
    const user = await this.verifyApiKey();
    if (!user) {
      throw new Error('User not found');
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });
    return 'User deleted successfully';
  }

  async sso(provider: string, code: string, ipAddress: string, referrer: string | null = null): Promise<string> {
    if (!referrer) {
      referrer = process.env.MAGIC_LINK_URL || '';
    }
    provider = provider.toLowerCase();
    const ssoData = await getSsoProvider(provider, code, referrer);
    if (!ssoData || !ssoData.accessToken) {
      throw new Error(`Failed to get user data from ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`);
    }
    const { userInfo, accessToken, refreshToken } = ssoData;
    this.email = userInfo.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: this.email } });
    if (!user) {
      const registerData: RegisterData = {
        email: this.email,
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
      };
      const mfaToken = await this.register(registerData);
      user = await prisma.user.findUnique({ where: { email: this.email } });
      if (!user) throw new Error('Failed to create user');
      let oauthProvider = await prisma.oAuthProvider.findUnique({ where: { name: provider } });
      if (!oauthProvider) {
        oauthProvider = await prisma.oAuthProvider.create({ data: { name: provider } });
      }
      await prisma.userOAuth.create({
        data: {
          userId: user.id,
          providerId: oauthProvider.id,
          accessToken,
          refreshToken,
        },
      });
    } else {
      const userOAuth = await prisma.userOAuth.findFirst({ where: { userId: user.id } });
      if (userOAuth) {
        await prisma.userOAuth.update({
          where: { id: userOAuth.id },
          data: { accessToken, refreshToken },
        });
      }
    }
    const login: LoginData = { email: this.email, token: totp.generate(user.mfaToken) };
    return this.sendMagicLink(ipAddress, login, referrer, false);
  }

  private async verifyApiKey(): Promise<User | null> {
    if (!this.token) return null;
    try {
      const decoded = jwt.verify(this.token, this.encryptionKey) as { sub: string };
      return await prisma.user.findUnique({ where: { id: decoded.sub } });
    } catch {
      return null;
    }
  }
}

export default MagicalAuth;
