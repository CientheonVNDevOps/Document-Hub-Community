import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommunityVersionDto {
  @ApiProperty({ description: 'Version name (e.g., v1.0, v2.1)' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Version description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCommunityVersionDto {
  @ApiProperty({ description: 'Version name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Version description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
