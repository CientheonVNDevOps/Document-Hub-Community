import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // Note endpoints
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager', 'user')
  @ApiOperation({ summary: 'Create a new note (All roles in development)' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  createNote(@Request() req, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.createNote(req.user.userId, createNoteDto, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for the current user' })
  @ApiQuery({ name: 'folderId', required: false, description: 'Filter by folder ID' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  findAllNotes(@Request() req, @Query('folderId') folderId?: string) {
    return this.notesService.findAllNotes(req.user.userId, folderId, req.user.role);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search notes' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  searchNotes(@Request() req, @Query('q') query: string) {
    return this.notesService.searchNotes(req.user.userId, query, req.user.role);
  }

  @Get('folder-tree')
  @ApiOperation({ summary: 'Get folder tree structure for navigation' })
  @ApiResponse({ status: 200, description: 'Folder tree retrieved successfully' })
  getFolderTree(@Request() req) {
    return this.notesService.getFolderTree(req.user.userId, req.user.role);
  }

  // Folder endpoints - moved before :id route to avoid conflicts
  @Get('folders')
  @ApiOperation({ summary: 'Get all root folders for the current user' })
  @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
  findAllFolders(@Request() req) {
    return this.notesService.findAllFolders(req.user.userId);
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Get a specific folder by ID' })
  @ApiResponse({ status: 200, description: 'Folder retrieved successfully' })
  findFolderById(@Request() req, @Param('id') id: string) {
    return this.notesService.findFolderById(id, req.user.userId);
  }

  // Trash endpoints - must be defined before :id routes to avoid conflicts
  @Get('trash')
  @ApiOperation({ summary: 'Get all notes in trash' })
  @ApiResponse({ status: 200, description: 'Trash notes retrieved successfully' })
  getTrashNotes(@Request() req) {
    return this.notesService.getTrashNotes(req.user.userId, req.user.role);
  }

  @Delete('trash')
  @ApiOperation({ summary: 'Empty trash (permanently delete all notes in trash)' })
  @ApiResponse({ status: 200, description: 'Trash emptied successfully' })
  emptyTrash(@Request() req) {
    return this.notesService.emptyTrash(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific note by ID' })
  @ApiResponse({ status: 200, description: 'Note retrieved successfully' })
  findNoteById(@Request() req, @Param('id') id: string) {
    return this.notesService.findNoteById(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a note (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  updateNote(@Request() req, @Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.updateNote(id, req.user.userId, updateNoteDto, req.user.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a note (Admin only)' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  deleteNote(@Request() req, @Param('id') id: string) {
    return this.notesService.deleteNote(id, req.user.userId, req.user.role);
  }

  // Folder endpoints
  @Post('folders')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new folder (Admin and Manager only)' })
  @ApiResponse({ status: 201, description: 'Folder created successfully' })
  createFolder(@Request() req, @Body() createFolderDto: CreateFolderDto) {
    return this.notesService.createFolder(req.user.userId, createFolderDto, req.user.role);
  }

  @Patch('folders/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update a folder (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Folder updated successfully' })
  updateFolder(@Request() req, @Param('id') id: string, @Body() updateData: Partial<CreateFolderDto>) {
    return this.notesService.updateFolder(id, req.user.userId, updateData, req.user.role);
  }

  @Delete('folders/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a folder (Admin only)' })
  @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
  deleteFolder(@Request() req, @Param('id') id: string) {
    return this.notesService.deleteFolder(id, req.user.userId, req.user.role);
  }

  // Version endpoints
  @Get(':id/versions')
  @ApiOperation({ summary: 'Get version history for a note' })
  @ApiResponse({ status: 200, description: 'Version history retrieved successfully' })
  getNoteVersions(@Request() req, @Param('id') id: string) {
    return this.notesService.getNoteVersions(id, req.user.userId, req.user.role);
  }

  @Post(':id/versions/:versionId/restore')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Restore a specific version of a note (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Version restored successfully' })
  restoreNoteVersion(@Request() req, @Param('id') id: string, @Param('versionId') versionId: string) {
    return this.notesService.restoreNoteVersion(id, versionId, req.user.userId, req.user.role);
  }

  @Post('sample-data')
  @ApiOperation({ summary: 'Create sample data for development' })
  @ApiResponse({ status: 201, description: 'Sample data created successfully' })
  createSampleData(@Request() req) {
    return this.notesService.createSampleData(req.user.userId);
  }

  @Post('ensure-sample-data')
  @ApiOperation({ summary: 'Ensure sample data exists for current user' })
  @ApiResponse({ status: 200, description: 'Sample data ensured' })
  ensureSampleData(@Request() req) {
    return this.notesService.ensureSampleData(req.user.userId);
  }

  // Rename endpoints
  @Patch(':id/rename')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Rename a note (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Note renamed successfully' })
  renameNote(@Request() req, @Param('id') id: string, @Body() body: { title: string }) {
    return this.notesService.renameNote(id, req.user.userId, body.title, req.user.role);
  }

  @Patch('folders/:id/rename')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Rename a folder (Admin and Manager only)' })
  @ApiResponse({ status: 200, description: 'Folder renamed successfully' })
  renameFolder(@Request() req, @Param('id') id: string, @Body() body: { name: string }) {
    return this.notesService.renameFolder(id, req.user.userId, body.name, req.user.role);
  }

  // All Notes endpoints
  @Get('all-notes')
  @ApiOperation({ summary: 'Get all notes with folder information for All Notes view' })
  @ApiResponse({ status: 200, description: 'All notes with folders retrieved successfully' })
  getAllNotesWithFolders(@Request() req) {
    return this.notesService.getAllNotesWithFolders(req.user.userId, req.user.role);
  }

  @Get('folders/:id/contents')
  @ApiOperation({ summary: 'Get folder contents (notes and subfolders)' })
  @ApiResponse({ status: 200, description: 'Folder contents retrieved successfully' })
  getFolderContents(@Request() req, @Param('id') id: string) {
    return this.notesService.getFolderContents(id, req.user.userId, req.user.role);
  }

  @Patch(':id/trash')
  @ApiOperation({ summary: 'Move note to trash' })
  @ApiResponse({ status: 200, description: 'Note moved to trash successfully' })
  moveToTrash(@Request() req, @Param('id') id: string) {
    return this.notesService.moveToTrash(id, req.user.userId, req.user.role);
  }

  @Patch(':id/recover')
  @ApiOperation({ summary: 'Recover note from trash' })
  @ApiResponse({ status: 200, description: 'Note recovered successfully' })
  recoverNote(@Request() req, @Param('id') id: string) {
    return this.notesService.recoverNote(id, req.user.userId, req.user.role);
  }
}
