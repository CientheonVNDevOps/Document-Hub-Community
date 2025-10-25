import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleValidator } from '../common/validators/role.validator';
import { PasswordService } from '../common/services/password.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: any,
    private readonly passwordService: PasswordService,
  ) {}

  // UUID validation helper
  private validateUUID(id: string, fieldName: string = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new BadRequestException(`Invalid ${fieldName}: ${id}. Must be a valid UUID.`);
    }
  }

  async create(createUserDto: CreateUserDto, userRole?: string) {
    // Validate role - only admin can create users
    RoleValidator.validateUserManagement(userRole || 'user', 'create user');

    try {
      // Validate password strength
      const passwordValidation = this.passwordService.validatePasswordStrength(createUserDto.password);
      if (!passwordValidation.isValid) {
        throw new BadRequestException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash the password
      const hashedPassword = await this.passwordService.hashPassword(createUserDto.password);

      // Handle different user data structures
      const userData = {
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role || 'user',
        status: createUserDto.status || 'approved',
        ...(createUserDto.name && { name: createUserDto.name }),
        ...(createUserDto.first_name && { first_name: createUserDto.first_name }),
        ...(createUserDto.last_name && { last_name: createUserDto.last_name }),
      };

      const { data, error } = await this.supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('User creation error:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  async findById(id: string) {
    // Validate UUID
    this.validateUUID(id, 'user ID');

    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateData: Partial<CreateUserDto>, userRole?: string) {
    // Validate role - manager and admin can update users
    RoleValidator.validateUserManagement(userRole || 'user', 'update user');

    // Validate UUID
    this.validateUUID(id, 'user ID');

    try {
      // Handle password update separately if provided
      if (updateData.password) {
        // Validate password strength
        const passwordValidation = this.passwordService.validatePasswordStrength(updateData.password);
        if (!passwordValidation.isValid) {
          throw new BadRequestException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }

        // Hash the password
        const hashedPassword = await this.passwordService.hashPassword(updateData.password);
        updateData.password = hashedPassword;
      }

      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to update user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('User update error:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async delete(id: string, userRole?: string) {
    // Validate role - only admin can delete users
    RoleValidator.validateUserDeletion(userRole || 'user', 'delete user');

    // Validate UUID
    this.validateUUID(id, 'user ID');

    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return { message: 'User deleted successfully' };
  }

  async findAll() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  async initializeDatabase() {
    try {      
      // Check if admin user exists
      const { data: existingAdmin, error: checkError } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', 'nhatlinh.lykny@gmail.com')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('⚠️  Error checking for existing admin:', checkError.message);
      }

      if (!existingAdmin) {
        // Create default admin user with proper password hash
        const adminPassword = 'Admin123!';
        const hashedAdminPassword = await this.passwordService.hashPassword(adminPassword);
        
        const adminUser = {
          email: 'nhatlinh.lykny@gmail.com',
          password: hashedAdminPassword,
          name: 'Admin User',
          role: 'admin',
          status: 'approved'
        };

        const { data: newAdmin, error: createError } = await this.supabase
          .from('users')
          .insert([adminUser])
          .select()
          .single();

        if (createError) {
          console.warn('⚠️  Could not create admin user:', createError.message);
        } else {
          console.log('✅ Admin user created successfully');
        }
      } else {
        console.log('✅ Admin user already exists');
      }

      // Check total user count
      const { data: allUsers, error: countError } = await this.supabase
        .from('users')
        .select('*');

      if (countError) {
        console.warn('⚠️  Error counting users:', countError.message);
      } else {
        console.log(`✅ Database initialized with ${allUsers?.length || 0} users`);
      }

      return { success: true, userCount: allUsers?.length || 0 };
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }
}
