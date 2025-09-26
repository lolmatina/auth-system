import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { SignupDto } from './dto/signup.dto';
import { UserService } from '../user/user.service';
export declare class AuthController {
    private readonly authService;
    private readonly userService;
    constructor(authService: AuthService, userService: UserService);
    signup(signupDto: SignupDto, res: Response): Promise<Response<any, Record<string, any>>>;
    login(authDto: AuthDto, res: Response): Promise<Response<any, Record<string, any>>>;
    sendEmailVerification(email: string, res: Response): Promise<Response<any, Record<string, any>>>;
    verifyEmail(email: string, code: string, res: Response): Promise<Response<any, Record<string, any>>>;
    uploadDocuments(email: string, files: Array<Express.Multer.File>, res: Response): Promise<Response<any, Record<string, any>>>;
}
