import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const secret = this.config.get<string>('JWT_SECRET') || this.config.get<string>('NEXTAUTH_SECRET') || 'fallback_secret_for_development_only';
      
      // We now verify Standard JWTs issued by NestJS (or NextAuth if shared)
      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      (request as any)['user'] = {
        id: payload.sub,
        email: payload.email,
        // Map the payload sub to clerkId just in case some old controller code still expects clerkId!
        clerkId: payload.sub,
      };

      return true;
    } catch (error) {
      this.logger.error('Token verification failed', error);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // Also check for cookies if NextAuth passes the token via cookie instead of Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    return undefined;
  }
}
