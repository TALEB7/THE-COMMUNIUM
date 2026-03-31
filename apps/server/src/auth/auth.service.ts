import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    created_at: number;
    updated_at: number;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Register a new local user with email and password
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        accountType: dto.accountType || 'personal',
        phone: dto.phone,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  /**
   * Login existing user
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        accountType: user.accountType,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  /**
   * Verify and process Clerk webhook events
   */
  async handleClerkWebhook(
    rawBody: Buffer,
    headers: Record<string, string>,
  ) {
    const webhookSecret = this.config.get<string>('CLERK_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const wh = new Webhook(webhookSecret);
    let event: ClerkWebhookEvent;

    try {
      event = wh.verify(rawBody.toString(), headers) as ClerkWebhookEvent;
    } catch (err) {
      this.logger.error('Clerk webhook verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Clerk webhook received: ${event.type}`);

    switch (event.type) {
      case 'user.created':
        await this.handleUserCreated(event.data);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event.data);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(event.data.id);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle user creation from Clerk
   */
  private async handleUserCreated(data: ClerkWebhookEvent['data']) {
    const email = data.email_addresses[0]?.email_address;

    const user = await this.prisma.user.upsert({
      where: { clerkId: data.id },
      update: {
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatarUrl: data.image_url,
      },
      create: {
        clerkId: data.id,
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatarUrl: data.image_url,
      },
    });

    this.logger.log(`User synced from Clerk: ${user.id} (${email})`);
    return user;
  }

  /**
   * Handle user update from Clerk
   */
  private async handleUserUpdated(data: ClerkWebhookEvent['data']) {
    const email = data.email_addresses[0]?.email_address;

    await this.prisma.user.update({
      where: { clerkId: data.id },
      data: {
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        avatarUrl: data.image_url,
      },
    });
  }

  /**
   * Handle user deletion from Clerk
   */
  private async handleUserDeleted(clerkId: string) {
    await this.prisma.user.update({
      where: { clerkId },
      data: { isActive: false },
    });
  }

  /**
   * Complete onboarding — set account type and detailed profile info
   */
  async onboardUser(dto: OnboardingDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { clerkId: dto.clerkId },
          { id: dto.clerkId },
          { email: dto.email },
        ],
      },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // 1. Update basic user info
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        accountType: dto.accountType,
        firstName: dto.firstName || user.firstName,
        lastName: dto.lastName || user.lastName,
        avatarUrl: dto.avatarUrl || user.avatarUrl,
        phone: dto.phone || user.phone,
      },
    });

    // 2. Populate specific profiles
    if (dto.accountType === 'personal') {
      await this.prisma.personalProfile.upsert({
        where: { userId: user.id },
        update: {
          firstName: dto.firstName || user.firstName,
          lastName: dto.lastName || user.lastName,
          birthday: dto.birthday,
          identityType: dto.identityType,
          identityNumber: dto.identityNumber,
          phone: dto.phone || user.phone,
          email: dto.email,
          country: dto.country,
          city: dto.city,
          address: dto.address,
          photoUrl: dto.avatarUrl || user.avatarUrl,
        },
        create: {
          userId: user.id,
          firstName: dto.firstName || user.firstName,
          lastName: dto.lastName || user.lastName,
          birthday: dto.birthday,
          identityType: dto.identityType,
          identityNumber: dto.identityNumber,
          phone: dto.phone || user.phone,
          email: dto.email,
          country: dto.country,
          city: dto.city,
          address: dto.address,
          photoUrl: dto.avatarUrl || user.avatarUrl,
        },
      });
    } else if (dto.accountType === 'business' || dto.accountType === 'company_creation') {
      await this.prisma.businessProfile.upsert({
        where: { userId: user.id },
        update: {
          companyName: dto.companyName,
          rc: dto.rc,
          creationDate: dto.creationDate,
          phone: dto.phone || user.phone,
          email: dto.email,
          country: dto.country || 'Maroc',
          city: dto.city,
          address: dto.address,
          logoUrl: dto.avatarUrl || user.avatarUrl,
        },
        create: {
          userId: user.id,
          companyName: dto.companyName,
          rc: dto.rc,
          creationDate: dto.creationDate,
          phone: dto.phone || user.phone,
          email: dto.email,
          country: dto.country || 'Maroc',
          city: dto.city,
          address: dto.address,
          logoUrl: dto.avatarUrl || user.avatarUrl,
        },
      });
    }

    // 3. Handle Membership/Plan
    if (dto.selectedPlan && !dto.selectedPlan.includes('_free')) {
      await this.prisma.membership.upsert({
        where: { userId: user.id },
        update: {
          plan: dto.selectedPlan,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        create: {
          userId: user.id,
          plan: dto.selectedPlan,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 4. Award initial tokens
    await this.awardInitialTokens(user.id, dto.accountType);

    return updatedUser;
  }

  /**
   * Award initial Tks tokens based on account type
   */
  private async awardInitialTokens(userId: string, accountType: string) {
    const tokenAmounts: Record<string, number> = {
      personal: 50,
      business: 150,
      company_creation: 500,
    };

    const amount = tokenAmounts[accountType] || 0;
    if (amount === 0) return;

    // Upsert token wallet
    await this.prisma.tksWallet.upsert({
      where: { userId },
      update: {
        balance: { increment: amount },
      },
      create: {
        userId,
        balance: amount,
      },
    });

    // Record transaction
    await this.prisma.tksTransaction.create({
      data: {
        userId,
        amount,
        type: 'EARNED',
        reason: `Bonus d'inscription ${accountType}`,
      },
    });
  }
}
