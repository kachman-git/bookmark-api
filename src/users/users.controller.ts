import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { jwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { UpdateUserDto } from './dto';

@UseGuards(jwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@GetUser('id') id: string) {
    return this.usersService.me(id);
  }

  @Patch(':id')
  async updateMe(@GetUser('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(id, dto);
  }
}
