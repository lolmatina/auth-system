"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const manager_service_1 = require("../manager/manager.service");
const user_service_1 = require("../user/user.service");
const email_service_1 = require("../email/email.service");
let TelegramService = class TelegramService {
    constructor(managerService, userService, emailService) {
        this.managerService = managerService;
        this.userService = userService;
        this.emailService = emailService;
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    }
    async handleUpdate(update) {
        if (!this.botToken)
            return;
        if (update.message && update.message.text) {
            const chatId = String(update.message.chat.id);
            const text = update.message.text.trim();
            if (text.startsWith('/auth')) {
                const parts = text.split(' ');
                const password = parts[1] || '';
                if (password && password === (process.env.MANAGER_PASSWORD || '')) {
                    await this.managerService.registerManager(chatId);
                    await this.sendMessage(chatId, '✅ You have been registered as a manager.');
                }
                else {
                    await this.sendMessage(chatId, '❌ Invalid manager password.');
                }
            }
        }
        else if (update.callback_query) {
            const data = update.callback_query.data;
            const chatId = String(update.callback_query.message.chat.id);
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'approve' || parsed.type === 'deny') {
                    const userId = parsed.userId;
                    const user = await this.userService.findOne(userId);
                    if (parsed.type === 'approve') {
                        await this.userService.update(userId, { documents_verified_at: new Date() });
                        await this.sendMessage(chatId, '✅ Documents approved.');
                        try {
                            await this.emailService.sendDocumentApprovalEmail(user.email, user.name);
                            console.log(`📧 Approval email sent to ${user.email}`);
                        }
                        catch (error) {
                            console.error('Failed to send approval email:', error);
                        }
                    }
                    else {
                        await this.userService.update(userId, { documents_verified_at: null });
                        await this.sendMessage(chatId, '❌ Documents denied.');
                        try {
                            await this.emailService.sendDocumentDenialEmail(user.email, user.name);
                            console.log(`📧 Denial email sent to ${user.email}`);
                        }
                        catch (error) {
                            console.error('Failed to send denial email:', error);
                        }
                    }
                }
            }
            catch (e) {
            }
        }
    }
    async sendDocumentSubmission(params) {
        if (!this.botToken) {
            console.log('Telegram bot not configured, skipping document submission:', params);
            return;
        }
        try {
            const managers = await this.managerService.getAllManagers();
            if (!managers.length) {
                console.log('No managers registered; skipping broadcast');
                return;
            }
            for (const manager of managers) {
                await axios_1.default.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                    chat_id: manager.telegram_chat_id,
                    text: `📋 New Document Submission\n\n👤 User: ${params.name}\n📧 Email: ${params.email}`,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Approve ✅', callback_data: JSON.stringify({ type: 'approve', userId: await this.resolveUserId(params.email) }) },
                                { text: 'Deny ❌', callback_data: JSON.stringify({ type: 'deny', userId: await this.resolveUserId(params.email) }) },
                            ],
                        ],
                    },
                });
                await this.sendDocument(manager.telegram_chat_id, params.frontPath, 'passport_front.jpg');
                await this.sendDocument(manager.telegram_chat_id, params.backPath, 'passport_back.jpg');
                await this.sendDocument(manager.telegram_chat_id, params.selfiePath, 'selfie_with_passport.jpg');
            }
            console.log(`Document submission sent to Telegram managers for user: ${params.email}`);
        }
        catch (error) {
            console.error('Failed to send document submission to Telegram:', error);
            throw new Error('Failed to send document submission to moderators');
        }
    }
    async resolveUserId(email) {
        const user = await this.userService.findByEmail(email);
        return user?.id;
    }
    async sendMessage(chatId, text) {
        await axios_1.default.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
            chat_id: chatId,
            text,
        });
    }
    async sendDocument(chatId, filePath, filename) {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('document', fs.createReadStream(filePath), { filename });
        await axios_1.default.post(`https://api.telegram.org/bot${this.botToken}/sendDocument`, formData, {
            headers: formData.getHeaders(),
        });
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [manager_service_1.ManagerService,
        user_service_1.UserService,
        email_service_1.EmailService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map