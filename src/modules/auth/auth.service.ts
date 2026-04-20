import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, RoleEnum } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dro';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth.response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, role } = registerDto;

    // בדוק אם המשתמש כבר קיים
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('אימייל כבר רשום');
    }

    // צור משתמש חדש
    const newUser = new this.userModel({
      email,
      password,
      name,
      role: role || RoleEnum.RECRUITER,
    });

    await newUser.save();

    // צור JWT
    const token = this.generateToken(newUser);

    return {
      email: newUser.email,
      name: newUser.name || '',
      role: newUser.role,
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // מצא את המשתמש
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('אימייל או סיסמה לא נכונים');
    }

    // בדוק את הסיסמה
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('אימייל או סיסמה לא נכונים');
    }

    // עדכן lastLogin
    user.lastLogin = new Date();
    await user.save();

    // צור JWT
    const token = this.generateToken(user);

    return {
      email: user.email,
      name: user.name || '',
      role: user.role,
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
    };
  }

  private generateToken(user: UserDocument): { accessToken: string; expiresIn: number } {
    const payload: JwtPayload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const decoded = this.jwtService.decode(accessToken) as any;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    return { accessToken, expiresIn };
  }

  async validateUser(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }
}