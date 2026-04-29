import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('AI_SERVICE_URL') ?? 'http://localhost:8000',
        timeout: 8000,
      }),
    }),
  ],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
