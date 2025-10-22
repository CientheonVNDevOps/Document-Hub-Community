import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsIn, Matches, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'SecurePass123!',
    description: 'Password must be 8-128 characters, contain uppercase, lowercase, number, and special character'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  )
  password: string;

  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'user', enum: ['user', 'manager', 'admin'] })
  @IsString()
  @IsOptional()
  @IsIn(['user', 'manager', 'admin'])
  role?: string = 'user';

  @ApiProperty({ example: 'approved', enum: ['pending', 'approved', 'rejected'] })
  @IsString()
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: string = 'approved';
}
