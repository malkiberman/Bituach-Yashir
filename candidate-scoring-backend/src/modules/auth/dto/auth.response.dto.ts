import { RoleEnum } from '../schemas/user.schema';

export class AuthResponseDto {
  email!: string;
  name!: string;
  role!: RoleEnum;
  accessToken!: string;
  expiresIn!: number;
}