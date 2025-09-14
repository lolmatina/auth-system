import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Res,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';

@Controller('api/v1/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    try {
      const user = await this.userService.create(createUserDto);
      const token = await this.authService.generateToken(user);
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          message: error.message,
        });
      }
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const user = await this.userService.findOne(id);
      return res.json(user);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          message: error.message,
        });
      }
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
  ) {
    try {
      const user = await this.userService.update(id, updateUserDto);
      return res.json(user);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          message: error.message,
        });
      }
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.userService.remove(id);
      return res.json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          message: error.message,
        });
      }
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
}
