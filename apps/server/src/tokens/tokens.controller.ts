import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  /**
   * Get current user's Tks balance
   */
  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Tks balance' })
  async getBalance(@CurrentUser('clerkId') clerkId: string) {
    return this.tokensService.getBalance(clerkId);
  }

  /**
   * Get transaction history
   */
  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Tks transaction history' })
  async getTransactions(@CurrentUser('clerkId') clerkId: string) {
    return this.tokensService.getTransactions(clerkId);
  }

  /**
   * Claim daily login reward
   */
  @Post('daily-reward')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim daily login reward (+2 Tks)' })
  async claimDailyReward(@CurrentUser('clerkId') clerkId: string) {
    return this.tokensService.claimDailyReward(clerkId);
  }
}
