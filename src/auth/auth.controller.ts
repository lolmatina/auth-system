import { Controller, Post, Body, Res, HttpCode, HttpStatus, UploadedFiles, UseInterceptors, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { SignupDto } from './dto/signup.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UserService } from '../user/user.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
    try {
      const user = await this.userService.create(signupDto);
      await this.authService.initiateEmailVerification(user);

      return res.json({
        message: 'User created successfully. Please verify your email.',
        user: {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          email_verified_at: user.email_verified_at,
          documents_verified_at: user.documents_verified_at,
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

  @Post()
  @HttpCode(HttpStatus.OK)
  async login(@Body() authDto: AuthDto, @Res() res: Response) {
    try {
      const result = await this.authService.login(authDto);
      
      // Set cookie only for fully verified users
      if (result.user.email_verified_at && result.user.documents_verified_at) {
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000,
        });
      }

      return res.json({
        message: 'Authentication successful',
        user: result.user,
        token: result.token,
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

  @Post('email/send')
  @HttpCode(HttpStatus.OK)
  async sendEmailVerification(@Body('email') email: string, @Res() res: Response) {
    try {
      await this.authService.resendEmailVerification(email);
      return res.json({ message: 'Verification email sent' });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('email') email: string, @Body('code') code: string, @Res() res: Response) {
    try {
      await this.authService.verifyEmailCode(email, code);
      return res.json({ message: 'Email verified successfully' });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Post('documents')
  @UseInterceptors(FilesInterceptor('files', 3, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    limits: { files: 3 },
  }))
  async uploadDocuments(
    @Body('email') email: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res: Response,
  ) {
    try {
      if (!files || files.length !== 3) {
        throw new BadRequestException('Exactly 3 files are required');
      }
      await this.authService.submitDocuments({
        email,
        frontPath: files[0].path,
        backPath: files[1].path,
        selfiePath: files[2].path,
      });
      return res.json({ message: 'Documents submitted' });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
