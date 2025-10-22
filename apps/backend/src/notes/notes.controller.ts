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
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new note (Admin only)' })
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

  // Folder endpoints - moved before :id route to avoid conflicts
  @Get('folders')
  @ApiOperation({ summary: 'Get all folders for the current user' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent folder ID' })
  @ApiResponse({ status: 200, description: 'Folders retrieved successfully' })
  findAllFolders(@Request() req, @Query('parentId') parentId?: string) {
    return this.notesService.findAllFolders(req.user.userId, parentId);
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Get a specific folder by ID' })
  @ApiResponse({ status: 200, description: 'Folder retrieved successfully' })
  findFolderById(@Request() req, @Param('id') id: string) {
    return this.notesService.findFolderById(id, req.user.userId);
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
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new folder (Admin only)' })
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
}
