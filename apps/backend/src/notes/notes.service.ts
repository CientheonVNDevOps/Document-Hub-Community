import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { RoleValidator } from '../common/validators/role.validator.js';

@Injectable()
export class NotesService {
  constructor(@Inject('SUPABASE_CLIENT') private readonly supabase: any) {}

  // UUID validation helper
  private validateUUID(id: string, fieldName: string = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new BadRequestException(`Invalid ${fieldName}: ${id}. Must be a valid UUID.`);
    }
  }

  // Note operations
  async createNote(userId: string, createNoteDto: CreateNoteDto, userRole?: string) {
    // Validate role - only admin can create notes
    RoleValidator.validateNoteCreation(userRole || 'user', 'create note');

    const { data, error } = await this.supabase
      .from('notes')
      .insert([{
        ...createNoteDto,
        user_id: userId,
        version: 1,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create note: ${error.message}`);
    }

    return data;
  }

  async findAllNotes(userId: string, folderId?: string, userRole?: string) {
    // Validate role - all roles can view notes
    RoleValidator.validateNoteAccess(userRole || 'user', 'view notes');

    // Validate folderId if provided
    if (folderId && folderId !== 'undefined') {
      this.validateUUID(folderId, 'folder ID');
    }

    // Ensure sample data exists for the user
    await this.ensureSampleData(userId);

    let query = this.supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    // If user is not admin or manager, only show their own notes
    if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
      query = query.eq('user_id', userId);
    }

    if (folderId && folderId !== 'undefined') {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch notes: ${error.message}`);
    }

    return data;
  }

  async findNoteById(id: string, userId: string, userRole?: string) {
    // Validate role - all roles can view notes
    RoleValidator.validateNoteAccess(userRole || 'user', 'view note');

    // Validate UUID
    this.validateUUID(id, 'note ID');

    // Ensure sample data exists for the user first
    await this.ensureSampleData(userId);

    let query = this.supabase
      .from('notes')
      .select('*')
      .eq('id', id);

    // If user is not admin or manager, only show their own notes
    if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException(`Note with ID ${id} not found`);
      }
      throw new Error(`Failed to fetch note: ${error.message}`);
    }

    return data;
  }

  async updateNote(id: string, userId: string, updateNoteDto: UpdateNoteDto, userRole?: string) {
    // Validate role - manager and admin can update notes
    RoleValidator.validateNoteUpdate(userRole || 'user', 'update note');
    
    // Validate UUID
    this.validateUUID(id, 'note ID');
    
    // Check if note exists and user has access
    const existingNote = await this.findNoteById(id, userId, userRole);
    
    const { data, error } = await this.supabase
      .from('notes')
      .update({
        ...updateNoteDto,
        version: existingNote.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update note: ${error.message}`);
    }

    return data;
  }

  async deleteNote(id: string, userId: string, userRole?: string) {
    // Validate role - only admin can delete notes
    RoleValidator.validateNoteDeletion(userRole || 'user', 'delete note');
    
    // Validate UUID
    this.validateUUID(id, 'note ID');
    
    // Check if note exists and user has access
    await this.findNoteById(id, userId, userRole);
    
    const { error } = await this.supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete note: ${error.message}`);
    }

    return { message: 'Note deleted successfully' };
  }

  // Folder operations
  async createFolder(userId: string, createFolderDto: CreateFolderDto, userRole?: string) {
    // Validate role - only admin can create folders
    RoleValidator.validateFolderManagement(userRole || 'user', 'create folder');

    const { data, error } = await this.supabase
      .from('folders')
      .insert([{
        ...createFolderDto,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }

    return data;
  }

  async findAllFolders(userId: string, parentId?: string) {
    // Validate parentId if provided
    if (parentId && parentId !== 'undefined') {
      this.validateUUID(parentId, 'parent folder ID');
    }

    // Ensure sample data exists for the user
    await this.ensureSampleData(userId);

    let query = this.supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (parentId && parentId !== 'undefined') {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch folders: ${error.message}`);
    }

    return data;
  }

  async findFolderById(id: string, userId: string) {
    // Validate UUID
    this.validateUUID(id, 'folder ID');

    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Folder not found');
      }
      throw new Error(`Failed to fetch folder: ${error.message}`);
    }

    return data;
  }

  async updateFolder(id: string, userId: string, updateData: Partial<CreateFolderDto>, userRole?: string) {
    // Validate role - manager and admin can update folders
    RoleValidator.validateFolderUpdate(userRole || 'user', 'update folder');
    
    // Validate UUID
    this.validateUUID(id, 'folder ID');
    
    // Check if folder exists and belongs to user
    await this.findFolderById(id, userId);
    
    const { data, error } = await this.supabase
      .from('folders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update folder: ${error.message}`);
    }

    return data;
  }

  async deleteFolder(id: string, userId: string, userRole?: string) {
    // Validate role - only admin can delete folders
    RoleValidator.validateFolderManagement(userRole || 'user', 'delete folder');
    
    // Validate UUID
    this.validateUUID(id, 'folder ID');
    
    // Check if folder exists and belongs to user
    await this.findFolderById(id, userId);
    
    // Check if folder has children or notes
    const { data: children } = await this.supabase
      .from('folders')
      .select('id')
      .eq('parent_id', id);

    const { data: notes } = await this.supabase
      .from('notes')
      .select('id')
      .eq('folder_id', id);

    if (children?.length > 0 || notes?.length > 0) {
      throw new ForbiddenException('Cannot delete folder with children or notes');
    }
    
    const { error } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete folder: ${error.message}`);
    }

    return { message: 'Folder deleted successfully' };
  }

  // Search functionality
  async searchNotes(userId: string, query: string, userRole?: string) {
    // Validate role - all roles can search notes
    RoleValidator.validateNoteAccess(userRole || 'user', 'search notes');

    let searchQuery = this.supabase
      .from('notes')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    // If user is not admin or manager, only search their own notes
    if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
      searchQuery = searchQuery.eq('user_id', userId);
    }

    const { data, error } = await searchQuery;

    if (error) {
      throw new Error(`Failed to search notes: ${error.message}`);
    }

    return data;
  }

  // Version history
  async getNoteVersions(noteId: string, userId: string, userRole?: string) {
    // Validate role - all roles can view note versions
    RoleValidator.validateNoteAccess(userRole || 'user', 'view note versions');
    
    // Validate UUID
    this.validateUUID(noteId, 'note ID');
    
    // First verify the note belongs to the user or user has access
    await this.findNoteById(noteId, userId, userRole);
    
    const { data, error } = await this.supabase
      .from('note_versions')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch note versions: ${error.message}`);
    }

    return data;
  }

  async restoreNoteVersion(noteId: string, versionId: string, userId: string, userRole?: string) {
    // Validate role - manager and admin can restore versions
    RoleValidator.validateVersionRestore(userRole || 'user', 'restore note version');
    
    // Validate UUIDs
    this.validateUUID(noteId, 'note ID');
    this.validateUUID(versionId, 'version ID');
    
    // Verify note belongs to user or user has access
    await this.findNoteById(noteId, userId, userRole);
    
    const { data: version, error: versionError } = await this.supabase
      .from('note_versions')
      .select('*')
      .eq('id', versionId)
      .eq('note_id', noteId)
      .single();

    if (versionError) {
      throw new NotFoundException('Version not found');
    }

    // Create new version with restored content
    const { data, error } = await this.supabase
      .from('notes')
      .update({
        title: version.title,
        content: version.content,
        version: version.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to restore version: ${error.message}`);
    }

    return data;
  }

  // Sample data creation for development with specific IDs
  async createSampleData(userId: string) {
    try {
      console.log('🔧 Creating sample data for user:', userId);
      
      // Create sample folders with specific IDs that frontend expects
      const { data: personalFolder, error: folder1Error } = await this.supabase
        .from('folders')
        .upsert([{
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Personal',
          user_id: userId,
          description: 'Personal notes and ideas'
        }], { onConflict: 'id' })
        .select()
        .single();

      if (folder1Error) {
        console.warn('⚠️  Could not create personal folder:', folder1Error.message);
      }

      const { data: workFolder, error: folder2Error } = await this.supabase
        .from('folders')
        .upsert([{
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Work',
          user_id: userId,
          description: 'Work-related notes and projects'
        }], { onConflict: 'id' })
        .select()
        .single();

      if (folder2Error) {
        console.warn('⚠️  Could not create work folder:', folder2Error.message);
      }

      const { data: projectsFolder, error: folder3Error } = await this.supabase
        .from('folders')
        .upsert([{
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Projects',
          parent_id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: userId,
          description: 'Project-related notes and documentation'
        }], { onConflict: 'id' })
        .select()
        .single();

      if (folder3Error) {
        console.warn('⚠️  Could not create projects folder:', folder3Error.message);
      }

      // Create sample notes with specific IDs that frontend expects
      const sampleNotes = [
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          title: 'Meeting Notes',
          content: 'Today we discussed the project timeline and upcoming deadlines. Key points:\n- Review design mockups\n- Prepare presentation\n- Schedule team meeting',
          folder_id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: userId,
          description: 'Notes from today\'s team meeting'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          title: 'Ideas',
          content: 'Random ideas and thoughts:\n- New feature for the app\n- Blog post about productivity\n- Weekend project ideas',
          folder_id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: userId,
          description: 'Collection of random ideas'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440013',
          title: 'Project Plan',
          content: 'Project planning and documentation:\n- Phase 1: Research and analysis\n- Phase 2: Design and prototyping\n- Phase 3: Development and testing\n- Phase 4: Launch and maintenance',
          folder_id: '550e8400-e29b-41d4-a716-446655440003',
          user_id: userId,
          description: 'Main project planning document'
        }
      ];

      const { data: notes, error: notesError } = await this.supabase
        .from('notes')
        .upsert(sampleNotes, { onConflict: 'id' })
        .select();

      if (notesError) {
        console.warn('⚠️  Could not create sample notes:', notesError.message);
      } else {
        console.log('✅ Sample data created successfully');
        console.log(`   - Personal folder: ${personalFolder ? 'created/updated' : 'already exists'}`);
        console.log(`   - Work folder: ${workFolder ? 'created/updated' : 'already exists'}`);
        console.log(`   - Projects folder: ${projectsFolder ? 'created/updated' : 'already exists'}`);
        console.log(`   - ${notes?.length || 0} sample notes created/updated`);
      }

      return { success: true, notesCreated: notes?.length || 0 };
    } catch (error) {
      console.error('❌ Failed to create sample data:', error);
      throw new Error(`Failed to create sample data: ${error.message}`);
    }
  }

  // Auto-initialize sample data for new users
  async ensureSampleData(userId: string) {
    try {
      // Check if user already has any notes
      const { data: existingNotes, error: checkError } = await this.supabase
        .from('notes')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (checkError) {
        console.warn('⚠️  Error checking existing notes:', checkError.message);
        return;
      }

      // If user has no notes, create sample data
      if (!existingNotes || existingNotes.length === 0) {
        console.log('🔧 No notes found for user, creating sample data...');
        await this.createSampleData(userId);
      } else {
        // Check if the specific sample notes exist, if not create them
        const { data: sampleNotes, error: sampleCheckError } = await this.supabase
          .from('notes')
          .select('id')
          .eq('user_id', userId)
          .in('id', [
            '550e8400-e29b-41d4-a716-446655440011',
            '550e8400-e29b-41d4-a716-446655440012',
            '550e8400-e29b-41d4-a716-446655440013'
          ]);

        if (sampleCheckError) {
          console.warn('⚠️  Error checking sample notes:', sampleCheckError.message);
        } else if (!sampleNotes || sampleNotes.length < 3) {
          console.log('🔧 Sample notes missing, creating/updating sample data...');
          await this.createSampleData(userId);
        }
      }
    } catch (error) {
      console.error('❌ Failed to ensure sample data:', error);
    }
  }
}
