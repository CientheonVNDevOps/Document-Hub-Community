import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'My Note Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'This is the content of my note...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: 'uuid-of-folder', required: false })
  @IsOptional()
  @IsUUID()
  folder_id?: string;

  @ApiProperty({ example: 'This is a note about...', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
