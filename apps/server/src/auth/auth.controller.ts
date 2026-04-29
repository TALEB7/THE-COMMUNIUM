import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user and get JWT' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('onboarding')
  @ApiOperation({ summary: 'Complete user onboarding with account type' })
  async onboarding(@Body() dto: OnboardingDto) {
    return this.authService.onboardUser(dto);
  }
}
