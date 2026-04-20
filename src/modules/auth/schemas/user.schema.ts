import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum RoleEnum {
  RECRUITER = 'RECRUITER',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: false })
  name?: string;

  @Prop({ type: String, enum: RoleEnum, default: RoleEnum.RECRUITER })
  role!: RoleEnum;

  @Prop({ default: new Date() })
  createdAt!: Date;

  @Prop({ default: new Date() })
  updatedAt!: Date;

  @Prop({ default: null })
  lastLogin?: Date;

  // Hash password before saving
  async comparePassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook: hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

export type UserDocument = User & Document;