import { ManagerService } from '../manager/manager.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
export declare class TelegramService {
    private readonly managerService;
    private readonly userService;
    private readonly emailService;
    private readonly botToken;
    constructor(managerService: ManagerService, userService: UserService, emailService: EmailService);
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
