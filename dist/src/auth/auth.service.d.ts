import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AuthDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';
import { User } from '../database/supabase.service';
export declare class AuthService {
    private userService;
    private jwtService;
    private emailService;
    private telegramService;
    constructor(userService: UserService, jwtService: JwtService, emailService: EmailService, telegramService: TelegramService);
    validateUser(email: string, password: string): Promise<any>;
    login(authDto: AuthDto): Promise<{
        user: any;
        token: string;
    }>;
    generateToken(user: any): Promise<string>;
    initiateEmailVerification(user: User): Promise<void>;
    resendEmailVerification(email: string): Promise<void>;
    verifyEmailCode(email: string, code: string): Promise<void>;
    submitDocuments(params: {
        email: string;
        frontPath: string;
        backPath: string;
        selfiePath: string;
    }): Promise<void>;
}
