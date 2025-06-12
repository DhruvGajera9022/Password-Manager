import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ArrayUnique,
  IsNotEmpty,
} from 'class-validator';
import { Types, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Vault {
  _id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  @ApiProperty({
    description: 'User ID owning this password entry',
    type: String,
    example: '64aef1a7e24f4321a4567890',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Prop({ required: true })
  @ApiProperty({ example: 'Gmail', description: 'Website or app name' })
  @IsString()
  @MinLength(1)
  siteName: string;

  @Prop({ required: true })
  @ApiProperty({ example: 'john.doe', description: 'Username or login ID' })
  @IsString()
  @MinLength(1)
  username: string;

  @Prop({ required: true })
  @ApiProperty({
    example: 'encryptedPasswordString',
    description: 'Encrypted password',
  })
  @IsString()
  @MinLength(1)
  encryptedPassword: string;

  @Prop()
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email for this account',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Prop()
  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number for this account',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @Prop()
  @ApiProperty({
    example: 'My personal email account',
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @Prop({ default: false })
  @ApiProperty({
    example: false,
    description: 'Whether this entry is marked as favorite',
  })
  @IsBoolean()
  @IsOptional()
  favorite?: boolean;

  @Prop()
  @ApiProperty({
    example: 'https://accounts.google.com/signin',
    description: 'URL to login page',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;

  @Prop({ type: [String], default: [] })
  @ApiProperty({
    example: ['work', 'email'],
    description: 'Tags for categorization',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

  @Prop()
  @ApiProperty({
    example: 'Email',
    description: 'Category of the password entry',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @Prop()
  @ApiProperty({
    example: 'https://example.com/favicon.ico',
    description: 'Avatar or favicon URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @Prop()
  @ApiProperty({
    example: '2025-06-01T15:00:00.000Z',
    description: 'Last time this password was used',
    required: false,
  })
  @IsOptional()
  @IsDate()
  lastUsedAt?: Date;
}

export const VaultSchema = SchemaFactory.createForClass(Vault);
export const VaultModel = MongooseModule.forFeature([
  { name: Vault.name, schema: VaultSchema },
]);
