import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  create(@Request() req, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, req.user.role);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get all users (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get user by ID (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update user by ID (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Request() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto, req.user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  remove(@Request() req, @Param('id') id: string) {
    return this.usersService.delete(id, req.user.role);
  }

  @Post('initialize-database')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Initialize database with default data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Database initialized successfully' })
  initializeDatabase(@Request() req) {
    return this.usersService.initializeDatabase();
  }
}
