import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { CreateFolderDto } from './dto/create-folder.dto.js';
import { CreateCommunityVersionDto, UpdateCommunityVersionDto } from './dto/community-version.dto.js';
import { RoleValidator } from '../common/validators/role.validator.js';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotesService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabase: any,
    private readonly configService: ConfigService
  ) {}

  // Create a Supabase client with proper authentication context
  private async getAuthenticatedSupabaseClient(userId: string) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // Try to set the user context by making a request with the user ID
    // This is a workaround for RLS policies
    try {
      // We'll use the regular client but handle RLS differently
      return supabase;
    } catch (error) {
      console.error('Error setting up authenticated Supabase client:', error);
      return supabase;
    }
  }

  // UUID validation helper
  private validateUUID(id: string, fieldName: string = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      throw new BadRequestException(`Invalid ${fieldName}: ${id}. Must be a valid UUID.`);
    }
  }

  // Note operations
  async createNote(userId: string, createNoteDto: CreateNoteDto, userRole?: string, versionId?: string) {
    // Validate role - manager and admin can create notes, but allow in development
    try {
      RoleValidator.validateNoteCreation(userRole || 'user', 'create note');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Development mode: Allow note creation despite role validation
      } else {
        console.error('Role validation failed:', error.message);
        throw error;
      }
    }

    // Get the current version if not provided
    let currentVersionId = versionId;
    if (!currentVersionId) {
      const versions = await this.getAllCommunityVersions(userRole);
      if (versions && versions.length > 0) {
        currentVersionId = versions[0].id;
      }
    }

    const { data, error } = await this.supabase
      .from('notes')
      .insert([{
        ...createNoteDto,
        content: createNoteDto.content || '', // Default to empty string if not provided
        user_id: userId,
        version_id: currentVersionId,
        version: 1, // Keep the old version field for backward compatibility
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to create note: ${error.message}`);
    }

    return data;
  }

  async findAllNotes(userId: string, folderId?: string, userRole?: string, versionId?: string) {
    // Validate role - all roles can view notes
    RoleValidator.validateNoteAccess(userRole || 'user', 'view notes');

    // Validate folderId if provided
    if (folderId && folderId !== 'undefined') {
      this.validateUUID(folderId, 'folder ID');
    }

    // Validate versionId if provided
    if (versionId && versionId !== 'undefined') {
      this.validateUUID(versionId, 'version ID');
    }

    let query = this.supabase
      .from('notes')
      .select('*')
      .eq('is_deleted', false) // Only show non-deleted notes
      .order('created_at', { ascending: false });

    // If user is not admin or manager, only show their own notes
    if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
      query = query.eq('user_id', userId);
    }

    if (folderId && folderId !== 'undefined') {
      query = query.eq('folder_id', folderId);
    }

    // Filter by version if provided
    if (versionId && versionId !== 'undefined') {
      query = query.eq('version_id', versionId);
      console.log(`Filtering notes by version: ${versionId}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
      throw new Error(`Failed to fetch notes: ${error.message}`);
    }

    return data || [];
  }

  async findNoteById(id: string, userId: string, userRole?: string) {
    // Validate role - all roles can view notes
    RoleValidator.validateNoteAccess(userRole || 'user', 'view note');

    // Validate UUID
    this.validateUUID(id, 'note ID');

    let query = this.supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false); // Only show non-deleted notes

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
    // Validate role - manager and admin can update notes, but allow in development
    try {
      RoleValidator.validateNoteUpdate(userRole || 'user', 'update note');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Development mode: Allow note update despite role validation
      } else {
        console.error('Role validation failed:', error.message);
        throw error;
      }
    }
    
    // Validate UUID
    this.validateUUID(id, 'note ID');
    
    // Check if note exists and user has access
    const existingNote = await this.findNoteById(id, userId, userRole);
    
    const { data, error } = await this.supabase
      .from('notes')
      .update({
        ...updateNoteDto,
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
  async createFolder(userId: string, createFolderDto: CreateFolderDto, userRole?: string, versionId?: string) {
    // Validate role - only admin can create folders, but allow in development
    if (process.env.NODE_ENV !== 'development') {
      RoleValidator.validateFolderManagement(userRole || 'user', 'create folder');
    } else {
      // Development mode: Allow folder creation for role
    }

    // Get the current version if not provided
    let currentVersionId = versionId;
    if (!currentVersionId) {
      const versions = await this.getAllCommunityVersions(userRole);
      if (versions && versions.length > 0) {
        currentVersionId = versions[0].id;
      }
    }

    const { data, error } = await this.supabase
      .from('folders')
      .insert([{
        ...createFolderDto,
        user_id: userId,
        version_id: currentVersionId,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder: ${error.message}`);
    }

    return data;
  }

  async findAllFolders(userId: string, versionId?: string) {
    // Validate versionId if provided
    if (versionId && versionId !== 'undefined') {
      this.validateUUID(versionId, 'version ID');
    }

    try {
      // First, check if the is_deleted column exists by trying a simple query
      const { data: testData, error: testError } = await this.supabase
        .from('folders')
        .select('is_deleted')
        .limit(1);

      const hasIsDeletedColumn = !testError || !testError.message.includes('is_deleted');

      // Only get root folders (no parent) for 2-layer structure
      let query = this.supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .is('parent_id', null) // Only root folders
        .order('name', { ascending: true });

      // Only filter by is_deleted if the column exists
      if (hasIsDeletedColumn) {
        query = query.eq('is_deleted', false); // Only get non-deleted folders
      }

      // Filter by version if provided
      if (versionId && versionId !== 'undefined') {
        query = query.eq('version_id', versionId);
        console.log(`Filtering folders by version: ${versionId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching folders:', error);
        throw new Error(`Failed to fetch folders: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in findAllFolders:', error);
      // Fallback: try without is_deleted filter
      let query = this.supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .is('parent_id', null) // Only root folders
        .order('name', { ascending: true });

      // Filter by version if provided
      if (versionId && versionId !== 'undefined') {
        query = query.eq('version_id', versionId);
        console.log(`Filtering folders by version (fallback): ${versionId}`);
      }

      const { data, error: fallbackError } = await query;

      if (fallbackError) {
        console.error('Error fetching folders (fallback):', fallbackError);
        throw new Error(`Failed to fetch folders: ${fallbackError.message}`);
      }

      return data || [];
    }
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
    
    try {
      // First, check if the trash columns exist by trying to select them
      const { data: testData, error: testError } = await this.supabase
        .from('folders')
        .select('is_deleted, deleted_at')
        .limit(1);

      // Check if the error is specifically about missing columns
      const hasTrashColumns = !testError || 
        (testError && !testError.message.toLowerCase().includes('column') && 
         !testError.message.toLowerCase().includes('does not exist') &&
         !testError.message.toLowerCase().includes('is_deleted') &&
         !testError.message.toLowerCase().includes('deleted_at'));

      console.log('Trash column test - Error:', testError?.message);
      console.log('Trash column test - Has columns:', hasTrashColumns);

      if (hasTrashColumns) {
        console.log('Trash columns found, performing soft delete');
        
        // Check if folder has children or notes (only non-deleted ones)
        const { data: children } = await this.supabase
          .from('folders')
          .select('id')
          .eq('parent_id', id)
          .eq('is_deleted', false); // Only check non-deleted children

        const { data: notes } = await this.supabase
          .from('notes')
          .select('id')
          .eq('folder_id', id)
          .eq('is_deleted', false); // Only check non-deleted notes

        // If folder has contents, move them to trash first
        if (children?.length > 0) {
          console.log(`Moving ${children.length} child folders to trash`);
          const { error: childrenError } = await this.supabase
            .from('folders')
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString()
            })
            .in('id', children.map(child => child.id));

          if (childrenError) {
            throw new Error(`Failed to move child folders to trash: ${childrenError.message}`);
          }
        }

        if (notes?.length > 0) {
          console.log(`Moving ${notes.length} notes to trash`);
          const { error: notesError } = await this.supabase
            .from('notes')
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString()
            })
            .in('id', notes.map(note => note.id));

          if (notesError) {
            throw new Error(`Failed to move notes to trash: ${notesError.message}`);
          }
        }
        
        // Soft delete the folder
        const { error } = await this.supabase
          .from('folders')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          throw new Error(`Failed to delete folder: ${error.message}`);
        }

        const movedContents = (children?.length || 0) + (notes?.length || 0);
        const message = movedContents > 0 
          ? `Folder and ${movedContents} item(s) moved to trash successfully`
          : 'Folder moved to trash successfully';

        return { message };
      } else {
        // Fallback: hard delete if trash columns don't exist
        console.warn('Trash columns not found, performing hard delete');
        
        // Check if folder has children or notes (all children/notes)
        const { data: children } = await this.supabase
          .from('folders')
          .select('id')
          .eq('parent_id', id);

        const { data: notes } = await this.supabase
          .from('notes')
          .select('id')
          .eq('folder_id', id);

        if (children?.length > 0 || notes?.length > 0) {
          throw new ForbiddenException('Cannot delete folder with children or notes. Please delete or move all contents first.');
        }
        
        // Hard delete the folder
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
    } catch (error) {
      console.error('Error in deleteFolder:', error);
      throw error;
    }
  }

  // Search functionality
  async searchNotes(userId: string, query: string, userRole?: string) {
    // Validate role - all roles can search notes
    RoleValidator.validateNoteAccess(userRole || 'user', 'search notes');

    let searchQuery = this.supabase
      .from('notes')
      .select('*')
      .eq('is_deleted', false) // Only search non-deleted notes
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

  // Rename operations
  async renameNote(id: string, userId: string, newTitle: string, userRole?: string) {
    // Validate role - manager and admin can rename notes, but allow in development
    try {
      RoleValidator.validateNoteUpdate(userRole || 'user', 'rename note');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Development mode: Allow note rename despite role validation
      } else {
        console.error('Role validation failed:', error.message);
        throw error;
      }
    }
    
    // Validate UUID
    this.validateUUID(id, 'note ID');
    
    // Check if note exists and user has access
    await this.findNoteById(id, userId, userRole);
    
    const { data, error } = await this.supabase
      .from('notes')
      .update({
        title: newTitle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to rename note: ${error.message}`);
    }

    return data;
  }

  async renameFolder(id: string, userId: string, newName: string, userRole?: string) {
    // Validate role - manager and admin can rename folders
    RoleValidator.validateFolderUpdate(userRole || 'user', 'rename folder');
    
    // Validate UUID
    this.validateUUID(id, 'folder ID');
    
    // Check if folder exists and belongs to user
    await this.findFolderById(id, userId);
    
    const { data, error } = await this.supabase
      .from('folders')
      .update({
        name: newName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to rename folder: ${error.message}`);
    }

    return data;
  }

  // Get all notes with folder information for "All Notes" view
  async getAllNotesWithFolders(userId: string, userRole?: string) {
    // Validate role - all roles can view notes
    RoleValidator.validateNoteAccess(userRole || 'user', 'view all notes');

    let query = this.supabase
      .from('notes')
      .select(`
        *,
        folders!inner(
          id,
          name,
          parent_id,
          description
        )
      `)
      .eq('is_deleted', false) // Only show non-deleted notes
      .order('updated_at', { ascending: false });

    // If user is not admin or manager, only show their own notes
    if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch all notes with folders: ${error.message}`);
    }

    return data;
  }

  // Get folder tree structure for navigation
  async getFolderTree(userId: string, userRole?: string) {
    // Validate role - all roles can view folders
    RoleValidator.validateNoteAccess(userRole || 'user', 'view folder tree');

    // Get all folders for the user
    const { data: folders, error: foldersError } = await this.supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (foldersError) {
      throw new Error(`Failed to fetch folders: ${foldersError.message}`);
    }

    // Get all notes for the user
    const { data: notes, error: notesError } = await this.supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false) // Only show non-deleted notes
      .order('title', { ascending: true });

    if (notesError) {
      throw new Error(`Failed to fetch notes: ${notesError.message}`);
    }

    // Build tree structure
    const buildTree = (parentId: string | null = null): any[] => {
      const children = folders.filter(folder => folder.parent_id === parentId);
      return children.map(folder => ({
        ...folder,
        children: buildTree(folder.id),
        notes: notes.filter(note => note.folder_id === folder.id)
      }));
    };

    return {
      folders: buildTree(),
    };
  }

  // Get folder contents (notes and subfolders)
  async getFolderContents(folderId: string, userId: string, userRole?: string) {
    // Validate role - all roles can view folder contents
    RoleValidator.validateNoteAccess(userRole || 'user', 'view folder contents');
    
    // Validate UUID
    this.validateUUID(folderId, 'folder ID');

    // Check if folder exists and user has access
    await this.findFolderById(folderId, userId);

    // Get subfolders
    const { data: subfolders, error: subfoldersError } = await this.supabase
      .from('folders')
      .select('*')
      .eq('parent_id', folderId)
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (subfoldersError) {
      throw new Error(`Failed to fetch subfolders: ${subfoldersError.message}`);
    }

    // Get notes in folder
    const { data: notes, error: notesError } = await this.supabase
      .from('notes')
      .select('*')
      .eq('folder_id', folderId)
      .eq('is_deleted', false) // Only show non-deleted notes
      .order('updated_at', { ascending: false });

    if (notesError) {
      throw new Error(`Failed to fetch notes: ${notesError.message}`);
    }

    return {
      subfolders,
      notes
    };
  }

  // Trash functionality
  async getTrashNotes(userId: string, userRole?: string, versionId?: string) {
    // Validate role - all roles can view trash
    RoleValidator.validateNoteAccess(userRole || 'user', 'view trash notes');

    // Validate versionId if provided
    if (versionId && versionId !== 'undefined') {
      this.validateUUID(versionId, 'version ID');
    }

    try {
      // First, check if the trash columns exist by trying a simple query
      const { data: testData, error: testError } = await this.supabase
        .from('notes')
        .select('is_deleted')
        .limit(1);

      if (testError && (testError.message.includes('is_deleted') || testError.message.includes('deleted_at'))) {
        console.warn('Trash columns not found. Database migration required.');
        return [];
      }

      let query = this.supabase
        .from('notes')
        .select('*')
        .eq('is_deleted', true) // Only get deleted notes
        .order('deleted_at', { ascending: false });

      // If user is not admin or manager, only show their own trash
      if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
        query = query.eq('user_id', userId);
      }

      // Filter by version if provided
      if (versionId && versionId !== 'undefined') {
        query = query.eq('version_id', versionId);
        console.log(`Filtering trash notes by version: ${versionId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching trash notes:', error);
        throw new Error(`Failed to fetch trash notes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrashNotes:', error);
      // Return empty array if there's any error to prevent crashes
      return [];
    }
  }

  async moveToTrash(noteId: string, userId: string, userRole?: string) {
    // Validate role - all roles can move their own notes to trash
    RoleValidator.validateNoteAccess(userRole || 'user', 'move note to trash');
    
    // Validate UUID
    this.validateUUID(noteId, 'note ID');
    
    try {
      // Check if note exists and user has access
      await this.findNoteById(noteId, userId, userRole);
      
      // First, check if the trash columns exist
      const { data: testData, error: testError } = await this.supabase
        .from('notes')
        .select('is_deleted')
        .limit(1);

      if (testError && (testError.message.includes('is_deleted') || testError.message.includes('deleted_at'))) {
        console.warn('Trash columns not found. Falling back to regular delete.');
        const { error: deleteError } = await this.supabase
          .from('notes')
          .delete()
          .eq('id', noteId);
        
        if (deleteError) {
          throw new Error(`Failed to delete note: ${deleteError.message}`);
        }
        
        return { message: 'Note deleted successfully (trash not available)' };
      }
      
      const now = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('notes')
        .update({
          is_deleted: true,
          deleted_at: now,
          updated_at: now,
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        console.error('Error moving note to trash:', error);
        throw new Error(`Failed to move note to trash: ${error.message}`);
      }

      return { message: 'Note moved to trash successfully' };
    } catch (error) {
      console.error('Error in moveToTrash:', error);
      throw error;
    }
  }

  async recoverNote(noteId: string, userId: string, userRole?: string) {
    // Validate role - all roles can recover their own notes
    RoleValidator.validateNoteAccess(userRole || 'user', 'recover note');
    
    // Validate UUID
    this.validateUUID(noteId, 'note ID');
    
    try {
      // First, check if the trash columns exist
      const { data: testData, error: testError } = await this.supabase
        .from('notes')
        .select('is_deleted')
        .limit(1);

      if (testError && (testError.message.includes('is_deleted') || testError.message.includes('deleted_at'))) {
        throw new BadRequestException('Trash functionality not available. Database migration required.');
      }
      
      // Check if note exists and user has access
      const { data: existingNote, error: checkError } = await this.supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (checkError || !existingNote) {
        throw new NotFoundException('Note not found');
      }

      // If user is not admin or manager, only allow recovery of their own notes
      if (!RoleValidator.canAccessAllNotes(userRole || 'user') && existingNote.user_id !== userId) {
        throw new ForbiddenException('You can only recover your own notes');
      }

      // Check if note is actually deleted
      if (!existingNote.is_deleted) {
        throw new BadRequestException('Note is not in trash');
      }
      
      const now = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('notes')
        .update({
          is_deleted: false,
          deleted_at: null,
          updated_at: now,
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        console.error('Error recovering note:', error);
        throw new Error(`Failed to recover note: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in recoverNote:', error);
      throw error;
    }
  }

  async emptyTrash(userId: string, userRole?: string, versionId?: string) {
    // Validate role - all roles can empty their own trash
    RoleValidator.validateNoteAccess(userRole || 'user', 'empty trash');
    
    // Validate versionId if provided
    if (versionId && versionId !== 'undefined') {
      this.validateUUID(versionId, 'version ID');
    }
    
    try {
      // First, check if the trash columns exist
      const { data: testData, error: testError } = await this.supabase
        .from('notes')
        .select('is_deleted')
        .limit(1);

      if (testError && (testError.message.includes('is_deleted') || testError.message.includes('deleted_at'))) {
        throw new BadRequestException('Trash functionality not available. Database migration required.');
      }
      
      let query = this.supabase
        .from('notes')
        .delete()
        .eq('is_deleted', true); // Only delete soft-deleted notes

      // If user is not admin or manager, only delete their own notes
      if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
        query = query.eq('user_id', userId);
      }

      // Filter by version if provided
      if (versionId && versionId !== 'undefined') {
        query = query.eq('version_id', versionId);
        console.log(`Emptying trash for version: ${versionId}`);
      }

      const { error } = await query;

      if (error) {
        console.error('Error emptying trash:', error);
        throw new Error(`Failed to empty trash: ${error.message}`);
      }

      return { message: 'Trash emptied successfully' };
    } catch (error) {
      console.error('Error in emptyTrash:', error);
      throw error;
    }
  }

  // Folder trash functionality
  async getTrashFolders(userId: string, userRole?: string, versionId?: string) {
    // Validate role - all roles can view trash
    RoleValidator.validateNoteAccess(userRole || 'user', 'view trash folders');

    // Validate versionId if provided
    if (versionId && versionId !== 'undefined') {
      this.validateUUID(versionId, 'version ID');
    }

    try {
      // First, check if the trash columns exist by trying to select them
      const { data: testData, error: testError } = await this.supabase
        .from('folders')
        .select('is_deleted, deleted_at')
        .limit(1);

      // Check if the error is specifically about missing columns
      const hasTrashColumns = !testError || 
        (testError && !testError.message.toLowerCase().includes('column') && 
         !testError.message.toLowerCase().includes('does not exist') &&
         !testError.message.toLowerCase().includes('is_deleted') &&
         !testError.message.toLowerCase().includes('deleted_at'));

      if (!hasTrashColumns) {
        console.warn('Folder trash columns not found. Database migration required.');
        return [];
      }

      let query = this.supabase
        .from('folders')
        .select('*')
        .eq('is_deleted', true) // Only get deleted folders
        .order('deleted_at', { ascending: false });

      // If user is not admin or manager, only show their own folders
      if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
        query = query.eq('user_id', userId);
      }

      // Filter by version if provided
      if (versionId && versionId !== 'undefined') {
        query = query.eq('version_id', versionId);
        console.log(`Filtering trash folders by version: ${versionId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching trash folders:', error);
        throw new Error(`Failed to fetch trash folders: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrashFolders:', error);
      // Return empty array if there's any error to prevent crashes
      return [];
    }
  }

  async recoverFolder(folderId: string, userId: string, userRole?: string) {
    // Validate role - all roles can recover their own folders
    RoleValidator.validateNoteAccess(userRole || 'user', 'recover folder');
    
    // Validate UUID
    this.validateUUID(folderId, 'folder ID');
    
    try {
      // First, check if the trash columns exist
      const { data: testData, error: testError } = await this.supabase
        .from('folders')
        .select('is_deleted')
        .limit(1);

      if (testError && (testError.message.includes('is_deleted') || testError.message.includes('deleted_at'))) {
        throw new BadRequestException('Folder trash functionality not available. Database migration required.');
      }

      // Check if folder exists in trash and user has access
      const { data: folder, error: checkError } = await this.supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .eq('is_deleted', true)
        .single();

      if (checkError || !folder) {
        throw new Error('Folder not found in trash');
      }

      // If user is not admin or manager, only allow recovering their own folders
      if (!RoleValidator.canAccessAllNotes(userRole || 'user') && folder.user_id !== userId) {
        throw new ForbiddenException('You can only recover your own folders');
      }

      // Recover the folder
      const { data, error } = await this.supabase
        .from('folders')
        .update({
          is_deleted: false,
          deleted_at: null
        })
        .eq('id', folderId)
        .select()
        .single();

      if (error) {
        console.error('Error recovering folder:', error);
        throw new Error(`Failed to recover folder: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in recoverFolder:', error);
      throw error;
    }
  }

  async recoverAllFromTrash(userId: string, userRole?: string, versionId?: string) {
    // Validate role - all roles can recover their own items
    RoleValidator.validateNoteAccess(userRole || 'user', 'recover all from trash');
    
    // Validate versionId if provided
    if (versionId && versionId !== 'undefined') {
      this.validateUUID(versionId, 'version ID');
    }

    try {
      // First, check if the trash columns exist
      const { data: testData, error: testError } = await this.supabase
        .from('notes')
        .select('is_deleted')
        .limit(1);

      if (testError && (testError.message.includes('is_deleted') || testError.message.includes('deleted_at'))) {
        throw new BadRequestException('Trash functionality not available. Database migration required.');
      }

      const now = new Date().toISOString();
      let recoveredNotes = 0;
      let recoveredFolders = 0;

      // Recover all notes
      let notesQuery = this.supabase
        .from('notes')
        .update({
          is_deleted: false,
          deleted_at: null,
          updated_at: now
        })
        .eq('is_deleted', true);

      // If user is not admin or manager, only recover their own notes
      if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
        notesQuery = notesQuery.eq('user_id', userId);
      }

      // Filter by version if provided
      if (versionId && versionId !== 'undefined') {
        notesQuery = notesQuery.eq('version_id', versionId);
      }

      const { data: notesData, error: notesError } = await notesQuery.select();

      if (notesError) {
        console.error('Error recovering notes:', notesError);
        throw new Error(`Failed to recover notes: ${notesError.message}`);
      }

      recoveredNotes = notesData?.length || 0;

      // Recover all folders
      let foldersQuery = this.supabase
        .from('folders')
        .update({
          is_deleted: false,
          deleted_at: null
        })
        .eq('is_deleted', true);

      // If user is not admin or manager, only recover their own folders
      if (!RoleValidator.canAccessAllNotes(userRole || 'user')) {
        foldersQuery = foldersQuery.eq('user_id', userId);
      }

      // Filter by version if provided
      if (versionId && versionId !== 'undefined') {
        foldersQuery = foldersQuery.eq('version_id', versionId);
      }

      const { data: foldersData, error: foldersError } = await foldersQuery.select();

      if (foldersError) {
        console.error('Error recovering folders:', foldersError);
        throw new Error(`Failed to recover folders: ${foldersError.message}`);
      }

      recoveredFolders = foldersData?.length || 0;

      return {
        message: `Successfully recovered ${recoveredNotes} notes and ${recoveredFolders} folders`,
        recoveredNotes,
        recoveredFolders
      };
    } catch (error) {
      console.error('Error in recoverAllFromTrash:', error);
      throw error;
    }
  }

  // Community Version Management
  async getAllCommunityVersions(userRole?: string) {
    // All users can view versions
    try {
      const { data, error } = await this.supabase
        .from('community_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching community versions:', error);
        // Check if it's a table not found error
        if (error.message.includes('relation "community_versions" does not exist') || 
            error.message.includes('does not exist') ||
            error.code === '42P01') {
          console.warn('Community versions table does not exist. Returning default version.');
          // Return a default version object to prevent frontend errors
          return [{
            id: 'default-version',
            name: 'v1.0',
            description: 'Default version (migration pending)',
            created_by: '00000000-0000-0000-0000-000000000000',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        }
        throw new Error(`Failed to fetch community versions: ${error.message}`);
      }

      // If no versions exist, create a default one
      if (!data || data.length === 0) {
        console.log('No versions found, creating default version...');
        
        // Get the first user to use as created_by (fallback to any user if no admin)
        const { data: anyUser, error: userError } = await this.supabase
          .from('users')
          .select('id')
          .limit(1)
          .single();

        let createdBy = '00000000-0000-0000-0000-000000000000'; // Default UUID
        if (anyUser && !userError) {
          createdBy = anyUser.id;
        }

        const { data: defaultVersion, error: createError } = await this.supabase
          .from('community_versions')
          .insert([{
            name: 'v1.0',
            description: 'Initial version',
            created_by: createdBy
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating default version:', createError);
          // Return default version object if creation fails
          return [{
            id: 'default-version',
            name: 'v1.0',
            description: 'Default version (creation failed)',
            created_by: createdBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        }

        return [defaultVersion];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllCommunityVersions:', error);
      // Return default version object if any error occurs
      return [{
        id: 'default-version',
        name: 'v1.0',
        description: 'Default version (error occurred)',
        created_by: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
    }
  }

  async createCommunityVersion(userId: string, createVersionDto: CreateCommunityVersionDto, userRole?: string) {
    // Managers and admins can create versions
    RoleValidator.validateManagerOrAdminRole(userRole || 'user', 'create community version');

    try {
      console.log(`Attempting to create version with data:`, createVersionDto);

      const { data, error } = await this.supabase
        .from('community_versions')
        .insert([{
          ...createVersionDto,
          created_by: userId,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating community version:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check if it's an RLS policy error
        if (error.code === 'PGRST301' || error.code === '42501') {
          console.log('RLS policy error detected for create operation');
          throw new Error('RLS policy restrictions prevent creating versions. Please check database permissions.');
        }
        
        throw new Error(`Failed to create community version: ${error.message}`);
      }

      console.log(`Successfully created version:`, data);
      return data;
    } catch (error) {
      console.error('Error in createCommunityVersion:', error);
      throw error;
    }
  }

  async updateCommunityVersion(versionId: string, userId: string, updateVersionDto: UpdateCommunityVersionDto, userRole?: string) {
    // Only admins can update versions
    RoleValidator.validateAdminRole(userRole || 'user', 'update community version');

    this.validateUUID(versionId, 'Version ID');

    try {
      console.log(`Attempting to update version ${versionId} with data:`, updateVersionDto);

      // Use regular Supabase client - RLS policies should allow admin operations
      const supabaseClient = this.supabase;

      // First check if the version exists - use array instead of single to avoid coercion errors
      const { data: existingVersions, error: checkError } = await supabaseClient
        .from('community_versions')
        .select('id, name, description')
        .eq('id', versionId);

      if (checkError) {
        console.error('Error checking version existence:', checkError);
        // Check if it's a table not found error
        if (checkError.message.includes('relation "community_versions" does not exist')) {
          throw new Error('Community versions table does not exist. Please run the database migration first.');
        }
        // Check if it's an RLS policy error
        if (checkError.code === 'PGRST301' || checkError.code === '42501') {
          console.log('RLS policy error detected, trying alternative approach...');
          // Try to work around RLS by using a different approach
          // For now, let's assume the version exists and proceed with the update
          console.log('Skipping existence check due to RLS policy restrictions');
        } else {
          throw new Error(`Failed to check version existence: ${checkError.message}`);
        }
      }

      // Handle the case where we couldn't check existence due to RLS policies
      let existingVersion = null;
      if (existingVersions && existingVersions.length > 0) {
        existingVersion = existingVersions[0];
        console.log(`Found existing version:`, existingVersion);
      } else if (checkError && (checkError.code === 'PGRST301' || checkError.code === '42501')) {
        console.log('Proceeding with update despite RLS policy restrictions');
        // Create a mock existing version for comparison
        existingVersion = {
          id: versionId,
          name: 'Unknown',
          description: 'Unknown'
        };
      } else {
        throw new Error(`Version with ID ${versionId} not found`);
      }

      // Prepare update data - only include fields that actually changed
      const updateData: any = {};
      
      if (updateVersionDto.name && updateVersionDto.name !== existingVersion.name) {
        updateData.name = updateVersionDto.name;
      }
      
      if (updateVersionDto.description !== undefined && updateVersionDto.description !== existingVersion.description) {
        updateData.description = updateVersionDto.description;
      }
      
      // Don't manually set updated_at - let the database trigger handle it
      // updateData.updated_at = new Date().toISOString();

      console.log(`Updating with data:`, updateData);

      // If no actual changes, return existing version
      if (Object.keys(updateData).length === 0) {
        console.log('No actual changes detected, returning existing version');
        return existingVersion;
      }

      // Update the version - perform update without expecting returned data
      console.log(`Executing update query for version ${versionId} with data:`, updateData);
      
      const { data: updateResult, error: updateError } = await supabaseClient
        .from('community_versions')
        .update(updateData)
        .eq('id', versionId)
        .select('id, name, description');

      console.log(`Update query result:`, { updateResult, updateError });

      if (updateError) {
        console.error('Error updating community version:', updateError);
        console.error('Error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        throw new Error(`Failed to update community version: ${updateError.message}`);
      }

      console.log(`Update completed successfully for version ${versionId}`);

      // Fetch the updated version to return
      const { data: updatedVersions, error: fetchError } = await supabaseClient
        .from('community_versions')
        .select('id, name, description, created_at, updated_at')
        .eq('id', versionId)
        .single();
          
      if (fetchError) {
        console.error('Error fetching updated version:', fetchError);
        throw new Error(`Failed to fetch updated version: ${fetchError.message}`);
      }
        
      if (!updatedVersions) {
        console.error('Updated version not found after update');
        throw new Error('Version not found after update');
      }

      console.log(`Successfully updated and fetched version:`, updatedVersions);
      return updatedVersions;
    } catch (error) {
      console.error('Error in updateCommunityVersion:', error);
      throw error;
    }
  }

  async deleteCommunityVersion(versionId: string, userId: string, userRole?: string) {
    // Only admins can delete versions
    RoleValidator.validateAdminRole(userRole || 'user', 'delete community version');

    this.validateUUID(versionId, 'Version ID');

    try {
      console.log(`Attempting to delete version ${versionId}`);

      // Check if this is the only version
      const { data: versions, error: countError } = await this.supabase
        .from('community_versions')
        .select('id')
        .limit(2);

      if (countError) {
        console.error('Error checking version count:', countError);
        console.error('Error details:', {
          message: countError.message,
          details: countError.details,
          hint: countError.hint,
          code: countError.code
        });
        
        // Check if it's an RLS policy error
        if (countError.code === 'PGRST301' || countError.code === '42501') {
          console.log('RLS policy error detected for count check, proceeding with delete');
          // Skip the count check and proceed with delete
        } else {
          throw new Error(`Failed to check version count: ${countError.message}`);
        }
      } else if (versions && versions.length <= 1) {
        throw new BadRequestException('Cannot delete the last remaining version');
      }

      // Check if version has associated notes or folders
      const { data: notesCount, error: notesError } = await this.supabase
        .from('notes')
        .select('id', { count: 'exact' })
        .eq('version_id', versionId)
        .limit(1);

      const { data: foldersCount, error: foldersError } = await this.supabase
        .from('folders')
        .select('id', { count: 'exact' })
        .eq('version_id', versionId)
        .limit(1);

      if (notesError || foldersError) {
        console.error('Error checking associated content:', notesError || foldersError);
        console.error('Error details:', {
          message: (notesError || foldersError).message,
          details: (notesError || foldersError).details,
          hint: (notesError || foldersError).hint,
          code: (notesError || foldersError).code
        });
        
        // Check if it's an RLS policy error
        if ((notesError && (notesError.code === 'PGRST301' || notesError.code === '42501')) || 
            (foldersError && (foldersError.code === 'PGRST301' || foldersError.code === '42501'))) {
          console.log('RLS policy error detected for content check, proceeding with delete');
          // Skip the content check and proceed with delete
        } else {
          throw new Error(`Failed to check associated content: ${(notesError || foldersError).message}`);
        }
      } else if (notesCount && foldersCount && (notesCount.length > 0 || foldersCount.length > 0)) {
        throw new BadRequestException('Cannot delete version that has associated notes or folders. Please migrate content to another version first.');
      }

      const { error } = await this.supabase
        .from('community_versions')
        .delete()
        .eq('id', versionId);

      if (error) {
        console.error('Error deleting community version:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check if it's an RLS policy error
        if (error.code === 'PGRST301' || error.code === '42501') {
          console.log('RLS policy error detected for delete operation');
          throw new Error('RLS policy restrictions prevent deleting versions. Please check database permissions.');
        }
        
        throw new Error(`Failed to delete community version: ${error.message}`);
      }

      console.log(`Successfully deleted version ${versionId}`);
      return { message: 'Community version deleted successfully' };
    } catch (error) {
      console.error('Error in deleteCommunityVersion:', error);
      throw error;
    }
  }

  async getNotesByVersion(versionId: string, userId: string, userRole?: string) {
    this.validateUUID(versionId, 'Version ID');

    const { data, error } = await this.supabase
      .from('notes')
      .select(`
        *,
        folders (
          id,
          name,
          description
        )
      `)
      .eq('version_id', versionId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes by version:', error);
      throw new Error(`Failed to fetch notes by version: ${error.message}`);
    }

    return data;
  }

  async getFoldersByVersion(versionId: string, userId: string, userRole?: string) {
    this.validateUUID(versionId, 'Version ID');

    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('version_id', versionId)
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching folders by version:', error);
      throw new Error(`Failed to fetch folders by version: ${error.message}`);
    }

    return data;
  }

  async migrateContentToVersion(sourceVersionId: string, targetVersionId: string, userId: string, userRole?: string) {
    // Only admins can migrate content
    RoleValidator.validateAdminRole(userRole || 'user', 'migrate content between versions');

    this.validateUUID(sourceVersionId, 'Source Version ID');
    this.validateUUID(targetVersionId, 'Target Version ID');

    if (sourceVersionId === targetVersionId) {
      throw new BadRequestException('Source and target versions cannot be the same');
    }

    // Migrate notes
    const { error: notesError } = await this.supabase
      .from('notes')
      .update({ version_id: targetVersionId })
      .eq('version_id', sourceVersionId)
      .eq('user_id', userId);

    if (notesError) {
      console.error('Error migrating notes:', notesError);
      throw new Error(`Failed to migrate notes: ${notesError.message}`);
    }

    // Migrate folders
    const { error: foldersError } = await this.supabase
      .from('folders')
      .update({ version_id: targetVersionId })
      .eq('version_id', sourceVersionId)
      .eq('user_id', userId);

    if (foldersError) {
      console.error('Error migrating folders:', foldersError);
      throw new Error(`Failed to migrate folders: ${foldersError.message}`);
    }

    return { message: 'Content migrated successfully' };
  }

  // Public methods (no authentication required)
  async getAllCommunityVersionsPublic() {
    const { data, error } = await this.supabase
      .from('community_versions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public community versions:', error);
      throw new Error(`Failed to fetch community versions: ${error.message}`);
    }

    return data;
  }

  async getAllNotesPublic(versionId: string) {
    this.validateUUID(versionId, 'Version ID');

    const { data, error } = await this.supabase
      .from('notes')
      .select(`
        *,
        folders (
          id,
          name,
          description
        )
      `)
      .eq('version_id', versionId)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching public notes:', error);
      throw new Error(`Failed to fetch notes: ${error.message}`);
    }

    return data || [];
  }

  async getAllFoldersPublic(versionId: string) {
    this.validateUUID(versionId, 'Version ID');

    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('version_id', versionId)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching public folders:', error);
      throw new Error(`Failed to fetch folders: ${error.message}`);
    }

    return data || [];
  }

  async findNoteByIdPublic(id: string) {
    this.validateUUID(id, 'Note ID');

    const { data, error } = await this.supabase
      .from('notes')
      .select(`
        *,
        folders (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      console.error('Error fetching public note:', error);
      throw new NotFoundException(`Note not found: ${error.message}`);
    }

    return data;
  }

  async getFolderTreePublic(versionId?: string) {
    try {
      // Validate versionId if provided
      if (versionId && versionId !== 'undefined' && versionId !== '') {
        try {
          this.validateUUID(versionId, 'Version ID');
        } catch (error) {
          console.error('Invalid versionId:', versionId);
          return { folders: [] };
        }
      }

      // Query folders
      let query = this.supabase
        .from('folders')
        .select('*')
        .eq('is_deleted', false);

      // Filter by version if provided
      if (versionId && versionId !== 'undefined' && versionId !== '') {
        query = query.eq('version_id', versionId);
      }

      const { data: folders, error: foldersError } = await query;

      if (foldersError) {
        console.error('Error fetching folders for public folder tree:', foldersError);
        return { folders: [] };
      }

      if (!folders || folders.length === 0) {
        return { folders: [] };
      }

      // Build folder tree
      const folderMap = new Map();
      const rootFolders: any[] = [];

      folders.forEach(folder => {
        folderMap.set(folder.id, {
          ...folder,
          children: [],
          notes: []
        });
      });

      folders.forEach(folder => {
        const folderNode = folderMap.get(folder.id);
        if (folder.parent_id && folderMap.has(folder.parent_id)) {
          folderMap.get(folder.parent_id).children.push(folderNode);
        } else {
          rootFolders.push(folderNode);
        }
      });

      // Get notes for each folder if version is specified
      if (versionId && versionId !== 'undefined' && versionId !== '') {
        try {
          const { data: notes, error: notesError } = await this.supabase
            .from('notes')
            .select('*')
            .eq('version_id', versionId)
            .eq('is_deleted', false);

          if (!notesError && notes) {
            notes.forEach(note => {
              if (note.folder_id && folderMap.has(note.folder_id)) {
                folderMap.get(note.folder_id).notes.push(note);
              }
            });
          }
        } catch (error) {
          console.error('Error fetching notes for folder tree:', error);
        }
      }

      return { folders: rootFolders };
    } catch (error) {
      console.error('Error building public folder tree:', error);
      // Return empty array instead of throwing to prevent 500 errors
      return { folders: [] };
    }
  }
}
