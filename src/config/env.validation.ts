import { plainToClass } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  validateSync,
  IsOptional,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  JWT_EXPIRATION!: string;

  @IsString()
  OPENAI_API_KEY!: string;

  @IsNumber()
  PORT!: number;

  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsString()
  @IsOptional()
  API_KEY?: string;

  @IsString()
  @IsOptional()
  LOG_LEVEL?: string;
}

export function envValidation(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error:\n${errors.toString()}`);
  }

  return validatedConfig;
}