import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateCommunityVersionDto, UpdateCommunityVersionDto } from './dto/community-version.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Notes')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // Public endpoints for docs (no authentication required)
  @Get('public/versions')
  @ApiOperation({ summary: 'Get all community versions (public)' })
  @ApiResponse({ status: 200, description: 'Community versions retrieved successfully' })
  async getPublicVersions() {
    return this.notesService.getAllCommunityVersionsPublic();
  }

  @Get('public/folder-tree')
  @ApiOperation({ summary: 'Get public folder tree structure for navigation' })
  @ApiResponse({ status: 200, description: 'Folder tree retrieved successfully' })
  async getPublicFolderTree(@Query('versionId') versionId?: string) {
    return this.notesService.getFolderTreePublic(versionId);
  }

  @Get('public/versions/:versionId/notes')
  @ApiOperation({ summary: 'Get public notes by version' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  async getPublicNotesByVersion(@Param('versionId') versionId: string) {
    return this.notesService.getAllNotesPublic(versionId);
  }

  @Get('public/versions/:versionId/folders')
  @ApiOperation({ summary: 'Get public folders by version' })
  @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
  async getPublicFoldersByVersion(@Param('versionId') versionId: string) {
    return this.notesService.getAllFoldersPublic(versionId);
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'Get a specific note by ID (public)' })
  @ApiResponse({ status: 200, description: 'Note retrieved successfully' })
  async getPublicNote(@Param('id') id: string) {
    return this.notesService.findNoteByIdPublic(id);
  }

  // Note endpoints (authenticated)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager', 'user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new note (All roles in development)' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  createNote(@Request() req, @Body() createNoteDto: CreateNoteDto, @Query('versionId') versionId?: string) {
    return this.notesService.createNote(req.user.userId, createNoteDto, req.user.role, versionId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notes for the current user' })
  @ApiQuery({ name: 'folderId', required: false, description: 'Filter by folder ID' })
  @ApiQuery({ name: 'versionId', required: false, description: 'Filter by community version ID' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  findAllNotes(@Request() req, @Query('folderId') folderId?: string, @Query('versionId') versionId?: string) {
    return this.notesService.findAllNotes(req.user.userId, folderId, req.user.role, versionId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search notes' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  searchNotes(@Request() req, @Query('q') query: string) {
    return this.notesService.searchNotes(req.user.userId, query, req.user.role);
  }

  @Get('folder-tree')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get folder tree structure for navigation' })
  @ApiResponse({ status: 200, description: 'Folder tree retrieved successfully' })
  getFolderTree(@Request() req) {
    return this.notesService.getFolderTree(req.user.userId, req.user.role);
  }

  // Folder endpoints - moved before :id route to avoid conflicts
  @Get('folders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all root folders for the current user' })
  @ApiQuery({ name: 'versionId', required: false, description: 'Filter by community version ID' })
  @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
  findAllFolders(@Request() req, @Query('versionId') versionId?: string) {
    return this.notesService.findAllFolders(req.user.userId, versionId);
  }

  @Get('folders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific folder by ID' })
  @ApiResponse({ status: 200, description: 'Folder retrieved successfully' })
  findFolderById(@Request() req, @Param('id') id: string) {
    return this.notesService.findFolderById(id, req.user.userId);
  }

  // Trash endpoints - must be defined before :id routes to avoid conflicts
  @Get('trash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notes in trash' })
  @ApiQuery({ name: 'versionId', required: false, description: 'Filter by community version ID' })
  @ApiResponse({ status: 200, description: 'Trash notes retrieved successfully' })
  getTrashNotes(@Request() req, @Query('versionId') versionId?: string) {
    return this.notesService.getTrashNotes(req.user.userId, req.user.role, versionId);
  }

  @Delete('trash')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Empty trash (permanently delete all notes in trash)' })
  @ApiQuery({ name: 'versionId', required: false, description: 'Filter by community version ID' })
  @ApiResponse({ status: 200, description: 'Trash emptied successfully' })
  emptyTrash(@Request() req, @Query('versionId') versionId?: string) {
    return this.notesService.emptyTrash(req.user.userId, req.user.role, versionId);
  }

  @Get('trash/folders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all folders in trash' })
  @ApiQuery({ name: 'versionId', required: false, description: 'Filter by community version ID' })
  @ApiResponse({ status: 200, description: 'Trash folders retrieved successfully' })
  getTrashFolders(@Request() req, @Query('versionId') versionId?: string) {
    return this.notesService.getTrashFolders(req.user.userId, req.user.role, versionId);
  }

  @Patch('folders/:id/recover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recover folder from trash' })
  @ApiResponse({ status: 200, description: 'Folder recovered successfully' })
  recoverFolder(@Request() req, @Param('id') id: string) {
    return this.notesService.recoverFolder(id, req.user.userId, req.user.role);
  }

  @Patch('trash/recover-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recover all items from trash' })
  @ApiQuery({ name: 'versionId', required: false, description: 'Filter by community version ID' })
  @ApiResponse({ status: 200, description: 'All items recovered successfully' })
  recoverAllFromTrash(@Request() req, @Query('versionId') versionId?: string) {
    return this.notesService.recoverAllFromTrash(req.user.userId, req.user.role, versionId);
  }

  // Test endpoint
  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  testEndpoint() {
    return { message: 'Test endpoint working' };
  }

  // Community Version Management endpoints (must come before :id route)
  @Get('versions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all community versions' })
  @ApiResponse({ status: 200, description: 'Community versions retrieved successfully' })
  getAllCommunityVersions(@Request() req) {
    return this.notesService.getAllCommunityVersions(req.user.role);
  }

  @Post('versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new community version (Manager and Admin only)' })
  @ApiResponse({ status: 201, description: 'Community version created successfully' })
  createCommunityVersion(@Request() req, @Body() createVersionDto: CreateCommunityVersionDto) {
    return this.notesService.createCommunityVersion(req.user.userId, createVersionDto, req.user.role);
  }

  @Patch('versions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a community version (Admin only)' })
  @ApiResponse({ status: 200, description: 'Community version updated successfully' })
  updateCommunityVersion(@Request() req, @Param('id') id: string, @Body() updateVersionDto: UpdateCommunityVersionDto) {
    return this.notesService.updateCommunityVersion(id, req.user.userId, updateVersionDto, req.user.role);
  }

  @Delete('versions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a community version (Admin only)' })
  @ApiResponse({ status: 200, description: 'Community version deleted successfully' })
  deleteCommunityVersion(@Request() req, @Param('id') id: string) {
    return this.notesService.deleteCommunityVersion(id, req.user.userId, req.user.role);
  }

  @Get('versions/:id/notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notes by version' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  getNotesByVersion(@Request() req, @Param('id') id: string) {
    return this.notesService.getNotesByVersion(id, req.user.userId, req.user.role);
  }

  @Get('versions/:id/folders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get folders by version' })
  @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
  getFoldersByVersion(@Request() req, @Param('id') id: string) {
    return this.notesService.getFoldersByVersion(id, req.user.userId, req.user.role);
  }

  @Post('versions/migrate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Migrate content between versions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Content migrated successfully' })
  migrateContentToVersion(@Request() req, @Body() body: { sourceVersionId: string, targetVersionId: string }) {
    return this.notesService.migrateContentToVersion(body.sourceVersionId, body.targetVersionId, req.user.userId, req.user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific note by ID' })
  @ApiResponse({ status: 200, description: 'Note retrieved successfully' })
  findNoteById(@Request() req, @Param('id') id: string) {
    return this.notesService.findNoteById(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a note (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  updateNote(@Request() req, @Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.updateNote(id, req.user.userId, updateNoteDto, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a note (Admin only)' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  deleteNote(@Request() req, @Param('id') id: string) {
    return this.notesService.deleteNote(id, req.user.userId, req.user.role);
  }

  // Folder endpoints
  @Post('folders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new folder (Admin and Manager only)' })
  @ApiResponse({ status: 201, description: 'Folder created successfully' })
  createFolder(@Request() req, @Body() createFolderDto: CreateFolderDto, @Query('versionId') versionId?: string) {
    return this.notesService.createFolder(req.user.userId, createFolderDto, req.user.role, versionId);
  }

  @Patch('folders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a folder (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Folder updated successfully' })
  updateFolder(@Request() req, @Param('id') id: string, @Body() updateData: Partial<CreateFolderDto>) {
    return this.notesService.updateFolder(id, req.user.userId, updateData, req.user.role);
  }

  @Delete('folders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a folder (Admin only)' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
  deleteFolder(@Request() req, @Param('id') id: string) {
    return this.notesService.deleteFolder(id, req.user.userId, req.user.role);
  }

  // Version endpoints
  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get version history for a note' })
  @ApiResponse({ status: 200, description: 'Version history retrieved successfully' })
  getNoteVersions(@Request() req, @Param('id') id: string) {
    return this.notesService.getNoteVersions(id, req.user.userId, req.user.role);
  }

  @Post(':id/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a specific version of a note (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Version restored successfully' })
  restoreNoteVersion(@Request() req, @Param('id') id: string, @Param('versionId') versionId: string) {
    return this.notesService.restoreNoteVersion(id, versionId, req.user.userId, req.user.role);
  }

  @Post('sample-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create sample data for development' })
  @ApiResponse({ status: 201, description: 'Sample data created successfully' })
  createSampleData(@Request() req) {
    return this.notesService.createSampleData(req.user.userId);
  }

  @Post('ensure-sample-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ensure sample data exists for current user' })
  @ApiResponse({ status: 200, description: 'Sample data ensured' })
  ensureSampleData(@Request() req) {
    return this.notesService.ensureSampleData(req.user.userId);
  }

  // Rename endpoints
  @Patch(':id/rename')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rename a note (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Note renamed successfully' })
  renameNote(@Request() req, @Param('id') id: string, @Body() body: { title: string }) {
    return this.notesService.renameNote(id, req.user.userId, body.title, req.user.role);
  }

  @Patch('folders/:id/rename')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rename a folder (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Folder renamed successfully' })
  renameFolder(@Request() req, @Param('id') id: string, @Body() body: { name: string }) {
    return this.notesService.renameFolder(id, req.user.userId, body.name, req.user.role);
  }

  // All Notes endpoints
  @Get('all-notes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notes with folder information for All Notes view' })
  @ApiResponse({ status: 200, description: 'All notes with folders retrieved successfully' })
  getAllNotesWithFolders(@Request() req) {
    return this.notesService.getAllNotesWithFolders(req.user.userId, req.user.role);
  }

  @Get('folders/:id/contents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get folder contents (notes and subfolders)' })
  @ApiResponse({ status: 200, description: 'Folder contents retrieved successfully' })
  getFolderContents(@Request() req, @Param('id') id: string) {
    return this.notesService.getFolderContents(id, req.user.userId, req.user.role);
  }

  @Patch(':id/trash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move note to trash' })
  @ApiResponse({ status: 200, description: 'Note moved to trash successfully' })
  moveToTrash(@Request() req, @Param('id') id: string) {
    return this.notesService.moveToTrash(id, req.user.userId, req.user.role);
  }

  @Patch(':id/recover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recover note from trash' })
  @ApiResponse({ status: 200, description: 'Note recovered successfully' })
  recoverNote(@Request() req, @Param('id') id: string) {
    return this.notesService.recoverNote(id, req.user.userId, req.user.role);
  }

}
