import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { CreateBookmarkDto, UpdateBookmarkDto } from './dto';

@UseGuards(JwtGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmark: BookmarkService) {}

  @Get('all')
  getAllBookmarks() {
    return this.bookmark.getAllBookmarks();
  }

  @Get('me')
  getUserBookmarks(@GetUser('id') id: number) {
    return this.bookmark.getUserBookmarks(id);
  }

  @Get(':bookmarkId')
  getUserBookmark(
    @GetUser('id') id: number,
    @Param('bookmarkId', ParseIntPipe) bookmarkId: number,
  ) {
    return this.bookmark.getUserBookmark(id, bookmarkId);
  }

  @Post()
  createBookmark(@GetUser('id') id: number, @Body() dto: CreateBookmarkDto) {
    return this.bookmark.createBookmark(id, dto);
  }

  @Patch(':bookmarkId')
  updateBookmark(
    @GetUser('id') id: number,
    @Param('bookmarkId', ParseIntPipe) bookmarkId: number,
    @Body() dto: UpdateBookmarkDto,
  ) {
    return this.bookmark.updateBookmark(id, bookmarkId, dto);
  }

  @Delete(':bookmarkId')
  deleteBookmark(
    @GetUser('id') id: number,
    @Param('bookmarkId', ParseIntPipe) bookmarkId: number,
  ) {
    return this.bookmark.deleteBookmark(id, bookmarkId);
  }
}
