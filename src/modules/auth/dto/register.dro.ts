import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { RoleEnum } from '../schemas/user.schema';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(RoleEnum)
  @IsOptional()
  role?: RoleEnum;
}