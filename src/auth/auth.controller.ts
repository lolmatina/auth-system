import { Controller, Post, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async login(@Body() authDto: AuthDto, @Res() res: Response) {
    try {
      const result = await this.authService.login(authDto);
      
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: 'Authentication successful',
        user: result.user,
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
