import { ManagerService } from '../manager/manager.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import { SupabaseService } from '../database/supabase.service';
export declare class TelegramService {
    private readonly managerService;
    private readonly userService;
    private readonly emailService;
    private readonly supabaseService;
    private readonly botToken;
    constructor(managerService: ManagerService, userService: UserService, emailService: EmailService, supabaseService: SupabaseService);
    handleUpdate(update: any): Promise<void>;
    sendDocumentSubmission(params: {
        email: string;
        name: string;
        frontPath: string;
        backPath: string;
        selfiePath: string;
    }): Promise<void>;
    private resolveUserId;
    private sendMessage;
    private sendDocument;
}
