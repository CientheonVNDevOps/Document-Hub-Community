import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ example: 'My Folder' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'uuid-of-parent-folder', required: false })
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiProperty({ example: 'This folder contains...', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
