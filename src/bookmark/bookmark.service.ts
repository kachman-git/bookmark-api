import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookmarkDto, UpdateBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  async getAllBookmarks() {
    return await this.prisma.bookmark.findMany({});
  }

  async getUserBookmarks(id: number) {
    return await this.prisma.bookmark.findMany({
      where: {
        userId: id,
      },
    });
  }

  async getUserBookmark(id: number, bookmarkId: number) {
    return await this.prisma.bookmark.findFirst({
      where: {
        userId: id,
        id: bookmarkId,
      },
    });
  }

  async createBookmark(id: number, dto: CreateBookmarkDto) {
    await this.prisma.bookmark.create({
      data: {
        userId: id,
        ...dto,
      },
    });

    return {
      message: 'Bookmark created successfully',
    };
  }

  async updateBookmark(id: number, bookmarkId: number, dto: UpdateBookmarkDto) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: id,
      },
    });

    if (!bookmark) {
      throw new NotFoundException(
        'Bookmark not found or you do not have permission to update it',
      );
    }

    const d = await this.prisma.bookmark.update({
      where: {
        id: bookmarkId,
      },
      data: {
        ...dto,
      },
    });

    return {
      message: 'Bookmark updated successfully',
      d,
    };
  }

  async deleteBookmark(id: number, bookmarkId: number) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: id,
      },
    });

    if (!bookmark) {
      throw new NotFoundException(
        'Bookmark not found or you do not have permission to delete it',
      );
    }

    await this.prisma.bookmark.delete({
      where: {
        id: bookmarkId,
        userId: id,
      },
    });

    return {
      message: 'Bookmark deleted successfully',
    };
  }
}
