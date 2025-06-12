import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

@Schema({ timestamps: true })
export class User {
  _id: string;

  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'john doe', description: 'Full name of the user' })
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @Prop({ type: String, required: true, unique: true })
  @ApiProperty({
    example: 'john@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Prop({ required: true })
  @ApiProperty({
    example: 'StrongP@ssw0rd',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Prop()
  @ApiProperty({
    example: '2025-05-17T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @Prop()
  @ApiProperty({
    example: '2025-05-17T12:00:00.000Z',
    description: 'Update timestamp',
  })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModel = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
]);
