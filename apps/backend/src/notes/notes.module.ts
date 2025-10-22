import { Module } from '@nestjs/common';
import { NotesService } from './notes.service.js';
import { NotesController } from './notes.controller.js';
import { DatabaseModule } from '../config/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [NotesService],
  controllers: [NotesController],
  exports: [NotesService],
})
export class NotesModule {
  // Module for notes and folders management
}
