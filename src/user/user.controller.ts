import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userservice: UserService) {}

  @Get('me')
  getUser(@GetUser('id') id: number) {
    return this.userservice.getUser(id);
  }

  @Patch()
  updateUser(@GetUser('id') id: number, @Body() dto: UpdateUserDto) {
    return this.userservice.updateUser(id, dto);
  }

  @Delete()
  remove(@GetUser('id') id: number) {
    return this.userservice.remove(id);
  }
}
