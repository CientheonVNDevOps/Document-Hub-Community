import { Controller, Get, Post, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserApprovalService } from '../users/user-approval.service';
import { UpdateApprovalDto } from '../users/dto/update-approval.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly userApprovalService: UserApprovalService) {}

  @Get('approvals')
  async getAllApprovalRequests() {
    return await this.userApprovalService.getAllRequests();
  }

  @Get('approvals/pending')
  async getPendingApprovalRequests() {
    return await this.userApprovalService.getAllPendingRequests();
  }

  @Get('approvals/:id')
  async getApprovalRequest(@Param('id') id: string) {
    return await this.userApprovalService.getRequestById(id);
  }

  @Put('approvals/:id')
  async updateApprovalRequest(
    @Param('id') id: string,
    @Body() updateDto: UpdateApprovalDto,
    @Request() req: any
  ) {
    // Add the reviewer ID from the JWT token
    updateDto.reviewedBy = req.user.sub;
    
    return await this.userApprovalService.updateRequestStatus(id, updateDto);
  }
}
