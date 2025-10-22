import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateApprovalDto {
  @IsEnum(['approved', 'rejected'])
  @IsNotEmpty()
  status: 'approved' | 'rejected';

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsString()
  @IsNotEmpty()
  reviewedBy: string;
}
