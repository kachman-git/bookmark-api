import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUser(id: number) {
    return await this.prisma.user.findFirst({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
      },
    });
    return { message: 'User update sucessful' };
  }

  async remove(id: number) {
    await this.prisma.user.delete({
      where: {
        id,
      },
      include: { Bookmarks: true },
    });

    return { message: 'User sucessfully delete' };
  }
}
