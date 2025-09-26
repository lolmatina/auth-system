import { TelegramService } from './telegram.service';
export declare class TelegramController {
    private readonly telegramService;
    constructor(telegramService: TelegramService);
    webhook(update: any): Promise<{
        ok: boolean;
    }>;
}
