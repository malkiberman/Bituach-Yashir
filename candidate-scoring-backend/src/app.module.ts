import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { JwtModuleOptions } from '@nestjs/jwt';

// Modules
import { AuthModule } from './modules/auth/auth.module';

// Config
import { envValidation } from './config/env.validation';

@Module({
  imports: [
    // Environment Configuration
    ConfigModule.forRoot({
      envFilePath: `.env${process.env.NODE_ENV === 'production' ? '' : '.local'}`,
      isGlobal: true,
      validate: envValidation,
    }),

    // MongoDB Connection
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
    }),

    // Redis & Bull Queue
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get<string>('REDIS_URL'),
      }),
    }),

    // JWT
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
    }),

    // Passport
    PassportModule,

    // Feature Modules
    AuthModule,
    // CandidateModule,
    // QuestionnaireModule,
    // ScoringModule,
    // AnalysisModule,
    // ResultsModule,
    // DashboardModule,
    // AudioModule,
  ],
})
export class AppModule {}