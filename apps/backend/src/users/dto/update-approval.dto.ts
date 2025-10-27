import { IsEnum, IsString, IsOptional } from 'class-validator';

export class UpdateApprovalDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsString()
  @IsOptional()
  adminNotes?: string;

  @IsString()
  @IsOptional()
  reviewedBy?: string;
}
